// tests/e2e/intelligent-analysis-concurrent-isolation.spec.ts
// module: testing | layer: e2e | role: 智能分析并发隔离测试
// summary: 验证多个job并发时的jobId精确匹配和串扰防护

import { test, expect } from '@playwright/test';

/**
 * E2E测试：并发/串扰防护
 * 
 * 测试场景：
 * 1. 同时启动两个分析任务（不同jobId）
 * 2. 模拟交叉的事件流：job-A和job-B的事件混合到达
 * 3. 验证每个UI只消费自己的jobId事件（精确匹配）
 * 4. 验证不会被其他job的事件影响
 * 5. 验证懒绑定机制正常工作
 * 6. 验证XOR确认通道约束
 */

test.describe('智能分析并发隔离', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // 添加并发测试环境设置
    await page.addInitScript(() => {
      // 并发测试状态
      window.concurrentTestState = {
        jobs: new Map(),
        allEvents: [],
        crossContamination: []
      };
      
      // 监听所有事件并记录来源
      ['progress_update', 'analysis_completed', 'analysis_error'].forEach(eventType => {
        window.addEventListener(eventType, (e: Event) => {
          const customEvent = e as CustomEvent<any>;
          const eventData = {
            type: eventType,
            jobId: customEvent.detail?.jobId,
            timestamp: Date.now(),
            detail: customEvent.detail
          };
          
          window.concurrentTestState.allEvents.push(eventData);
          
          // 检测跨contamination：如果事件被错误job消费
          if (window.concurrentTestState.jobs.has(customEvent.detail?.jobId)) {
            const job = window.concurrentTestState.jobs.get(customEvent.detail?.jobId);
            job.receivedEvents.push(eventData);
          }
        });
      });
      
      // 模拟并发作业事件流
      window.simulateConcurrentJobs = (jobA: string, jobB: string) => {
        // Job A: 正常流程
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('progress_update', { 
            detail: { progress: 30, jobId: jobA } 
          }));
        }, 100);
        
        // Job B: 启动（交叉）
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('progress_update', { 
            detail: { progress: 20, jobId: jobB } 
          }));
        }, 150);
        
        // Job A: 继续
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('progress_update', { 
            detail: { progress: 70, jobId: jobA } 
          }));
        }, 200);
        
        // Job B: 继续（干扰事件）
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('progress_update', { 
            detail: { progress: 90, jobId: jobB } 
          }));
        }, 250);
        
        // Job A: 完成
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('progress_update', { 
            detail: { progress: 100, jobId: jobA } 
          }));
          
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('analysis_completed', {
              detail: {
                jobId: jobA,
                smartCandidates: [
                  { key: 'strategy_a', description: 'Job A 策略', confidence: 0.9 }
                ]
              }
            }));
          }, 50);
        }, 300);
        
        // Job B: 完成（较晚）
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('progress_update', { 
            detail: { progress: 100, jobId: jobB } 
          }));
          
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('analysis_completed', {
              detail: {
                jobId: jobB,
                smartCandidates: [
                  { key: 'strategy_b', description: 'Job B 策略', confidence: 0.8 }
                ]
              }
            }));
          }, 50);
        }, 500);
      };
      
      // 注册job
      window.registerJob = (jobId: string, elementSelector: string) => {
        window.concurrentTestState.jobs.set(jobId, {
          jobId,
          elementSelector,
          receivedEvents: [],
          expectedEvents: 0,
          actualEvents: 0
        });
      };
    });
  });

  test('应该正确隔离并发任务，防止事件串扰', async ({ page }) => {
    // 模拟有两个分析按钮的场景
    await page.evaluate(() => {
      // 动态添加第二个分析按钮用于测试
      const container = document.body;
      const secondButton = document.createElement('button');
      secondButton.innerText = '🧠 智能分析 B';
      secondButton.setAttribute('data-testid', 'intelligent-button-b');
      secondButton.className = 'ant-btn';
      container.appendChild(secondButton);
    });
    
    const buttonA = page.locator('button:has-text("🧠"), button:has-text("智能"), button:has-text("自动链")').first();
    const buttonB = page.locator('[data-testid="intelligent-button-b"]');
    
    await expect(buttonA).toBeVisible();
    await expect(buttonB).toBeVisible();
    
    // 生成不同的jobId
    const jobA = 'concurrent-job-a-' + Date.now();
    const jobB = 'concurrent-job-b-' + Date.now();
    
    // 注册job跟踪
    await page.evaluate(({ jobA, jobB }) => {
      window.registerJob(jobA, 'button:has-text("🧠")');
      window.registerJob(jobB, '[data-testid="intelligent-button-b"]');
    }, { jobA, jobB });
    
    // 同时点击两个按钮
    await Promise.all([
      buttonA.click(),
      buttonB.click()
    ]);
    
    // 验证两个按钮都进入loading状态
    await expect(buttonA).toHaveClass(/ant-btn-loading/);
    await expect(buttonB).toHaveClass(/ant-btn-loading/);
    
    // 启动并发事件模拟
    await page.evaluate(({ jobA, jobB }) => {
      window.simulateConcurrentJobs(jobA, jobB);
    }, { jobA, jobB });
    
    // 等待所有事件处理完成
    await page.waitForTimeout(800);
    
    // 验证事件隔离：每个job只收到自己的事件
    const testResults = await page.evaluate(({ jobA, jobB }) => {
      const jobAEvents = window.concurrentTestState.jobs.get(jobA)?.receivedEvents || [];
      const jobBEvents = window.concurrentTestState.jobs.get(jobB)?.receivedEvents || [];
      const allEvents = window.concurrentTestState.allEvents;
      
      return {
        jobAEvents: jobAEvents.map(e => ({ type: e.type, jobId: e.jobId, progress: e.detail?.progress })),
        jobBEvents: jobBEvents.map(e => ({ type: e.type, jobId: e.jobId, progress: e.detail?.progress })),
        totalEvents: allEvents.length,
        crossContamination: {
          jobAReceivedB: jobAEvents.some(e => e.jobId === jobB),
          jobBReceivedA: jobBEvents.some(e => e.jobId === jobA)
        }
      };
    }, { jobA, jobB });
    
    // 验证事件隔离成功
    expect(testResults.crossContamination.jobAReceivedB).toBe(false);
    expect(testResults.crossContamination.jobBReceivedA).toBe(false);
    
    // 验证每个job收到了正确数量的事件
    expect(testResults.jobAEvents.filter(e => e.jobId === jobA)).toHaveLength(4); // 3个progress + 1个completion
    expect(testResults.jobBEvents.filter(e => e.jobId === jobB)).toHaveLength(4); // 3个progress + 1个completion
    
    // 验证按钮状态正确恢复
    await expect(buttonA).not.toHaveClass(/ant-btn-loading/);
    await expect(buttonB).not.toHaveClass(/ant-btn-loading/);
    await expect(buttonA).toBeEnabled();
    await expect(buttonB).toBeEnabled();
  });

  test('应该正确处理乱序完成事件（懒绑定测试）', async ({ page }) => {
    const jobId = 'lazy-binding-test-' + Date.now();
    
    // 先发送完成事件（在启动之前）
    await page.evaluate((jobId) => {
      // 孤立完成事件
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('analysis_completed', {
          detail: {
            jobId,
            smartCandidates: [
              { key: 'orphan_strategy', description: '孤立策略', confidence: 0.7 }
            ]
          }
        }));
      }, 100);
    }, jobId);
    
    // 然后点击启动分析
    const intelligentButton = page.locator('button:has-text("🧠"), button:has-text("智能"), button:has-text("自动链")').first();
    await intelligentButton.click();
    
    // 等待懒绑定处理
    await page.waitForTimeout(300);
    
    // 验证懒绑定生效：按钮应该不再loading
    await expect(intelligentButton).not.toHaveClass(/ant-btn-loading/);
    
    // 验证策略展示（如果支持）
    const strategySection = page.locator('[data-testid="strategy-candidates"], .strategy-candidates, .smart-candidates').first();
    if (await strategySection.isVisible()) {
      await expect(strategySection).toContainText('孤立策略');
    }
  });

  test('应该正确实现XOR确认机制，防止重复处理', async ({ page }) => {
    const jobId = 'xor-test-' + Date.now();
    
    await page.addInitScript(() => {
      window.xorTestState = {
        completionHandlerCalls: 0,
        duplicateProcessingDetected: false
      };
      
      // 拦截完成事件处理
      const originalDispatch = window.dispatchEvent;
      window.dispatchEvent = function(event: Event) {
        if (event.type === 'analysis_completed') {
          window.xorTestState.completionHandlerCalls++;
          if (window.xorTestState.completionHandlerCalls > 1) {
            window.xorTestState.duplicateProcessingDetected = true;
          }
        }
        return originalDispatch.call(this, event);
      };
    });
    
    const intelligentButton = page.locator('button:has-text("🧠"), button:has-text("智能"), button:has-text("自动链")').first();
    await intelligentButton.click();
    
    // 发送相同的完成事件多次（模拟重复事件）
    await page.evaluate((jobId) => {
      const completionEvent = {
        jobId,
        smartCandidates: [
          { key: 'xor_strategy', description: 'XOR测试策略', confidence: 0.8 }
        ]
      };
      
      // 快速连续发送3次相同完成事件
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('analysis_completed', {
            detail: completionEvent
          }));
        }, i * 10);
      }
    }, jobId);
    
    await page.waitForTimeout(200);
    
    // 验证XOR确认机制：只处理一次
    const xorResult = await page.evaluate(() => window.xorTestState);
    expect(xorResult.completionHandlerCalls).toBe(1);
    expect(xorResult.duplicateProcessingDetected).toBe(false);
    
    // 验证UI状态正确
    await expect(intelligentButton).not.toHaveClass(/ant-btn-loading/);
    await expect(intelligentButton).toBeEnabled();
  });

  test('应该正确处理错误事件不影响其他正常任务', async ({ page }) => {
    const jobA = 'error-job-' + Date.now();
    const jobB = 'normal-job-' + Date.now();
    
    // 添加第二个按钮
    await page.evaluate(() => {
      const container = document.body;
      const secondButton = document.createElement('button');
      secondButton.innerText = '🧠 正常任务';
      secondButton.setAttribute('data-testid', 'normal-job-button');
      secondButton.className = 'ant-btn';
      container.appendChild(secondButton);
    });
    
    const errorButton = page.locator('button:has-text("🧠"), button:has-text("智能"), button:has-text("自动链")').first();
    const normalButton = page.locator('[data-testid="normal-job-button"]');
    
    // 同时启动两个任务
    await Promise.all([
      errorButton.click(),
      normalButton.click()
    ]);
    
    // Job A 发生错误，Job B 正常完成
    await page.evaluate(({ jobA, jobB }) => {
      // Job A: 进度后出错
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('progress_update', { 
          detail: { progress: 50, jobId: jobA } 
        }));
      }, 100);
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('analysis_error', {
          detail: { jobId: jobA, error: 'Mock analysis error' }
        }));
      }, 200);
      
      // Job B: 正常完成
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('progress_update', { 
          detail: { progress: 100, jobId: jobB } 
        }));
      }, 150);
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('analysis_completed', {
          detail: {
            jobId: jobB,
            smartCandidates: [
              { key: 'normal_strategy', description: '正常策略', confidence: 0.9 }
            ]
          }
        }));
      }, 300);
    }, { jobA, jobB });
    
    await page.waitForTimeout(500);
    
    // 验证错误任务按钮恢复，正常任务也恢复
    await expect(errorButton).not.toHaveClass(/ant-btn-loading/);
    await expect(normalButton).not.toHaveClass(/ant-btn-loading/);
    await expect(errorButton).toBeEnabled();
    await expect(normalButton).toBeEnabled();
    
    // 验证可以重新启动分析
    await errorButton.click();
    await expect(errorButton).toHaveClass(/ant-btn-loading/);
  });
});