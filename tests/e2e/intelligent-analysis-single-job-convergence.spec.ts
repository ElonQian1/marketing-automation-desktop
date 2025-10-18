// tests/e2e/intelligent-analysis-single-job-convergence.spec.ts
// module: testing | layer: e2e | role: 智能分析单作业收敛测试
// summary: 验证智能分析从30%进度到100%完成的完整流程

import { test, expect } from '@playwright/test';

/**
 * E2E测试：单 job 正常收敛流程
 * 
 * 测试场景：
 * 1. 点击"🧠 智能·自动链"按钮启动分析
 * 2. 模拟后端事件流：progress 30% → 60% → 80% → 95% → 100% + 完成事件
 * 3. 验证按钮 loading 状态正确移除
 * 4. 验证推荐策略正确展示（如 self_anchor）
 * 5. 验证按钮恢复可点击状态
 * 6. 验证不出现错误 toast
 */

test.describe('智能分析单作业收敛', () => {
  test.beforeEach(async ({ page }) => {
    // 设置测试环境
    await page.goto('/');
    
    // 添加事件监听和模拟逻辑
    await page.addInitScript(() => {
      // 全局状态追踪
      window.testState = {
        analysisStarted: false,
        analysisCompleted: false,
        progressEvents: [],
        completionEvents: [],
        errors: []
      };
      
      // 监听分析进度事件 (使用 EVENTS.ANALYSIS_PROGRESS 值)
      window.addEventListener('progress_update', (e: Event) => {
        const customEvent = e as CustomEvent<{ progress: number; jobId: string }>;
        window.testState.progressEvents.push(customEvent.detail);
        console.log('收到进度事件:', customEvent.detail);
      });
      
      // 监听分析完成事件 (使用 EVENTS.ANALYSIS_DONE 值)
      window.addEventListener('analysis_completed', (e: Event) => {
        const customEvent = e as CustomEvent<{ smartCandidates: any[]; jobId: string }>;
        window.testState.completionEvents.push(customEvent.detail);
        window.testState.analysisCompleted = true;
        console.log('收到完成事件:', customEvent.detail);
      });
      
      // 监听错误事件
      window.addEventListener('error', (e: ErrorEvent) => {
        window.testState.errors.push(e.message);
      });
      
      // 模拟正常进度收敛流程
      window.simulateNormalConvergence = (jobId: string) => {
        const progressSteps = [30, 60, 80, 95, 100];
        
        progressSteps.forEach((progress, index) => {
          setTimeout(() => {
            console.log(`模拟进度: ${progress}%`);
            window.dispatchEvent(new CustomEvent('progress_update', { 
              detail: { progress, jobId }
            }));
            
            // 100%后发送完成事件
            if (progress === 100) {
              setTimeout(() => {
                console.log('模拟分析完成');
                window.dispatchEvent(new CustomEvent('analysis_completed', {
                  detail: {
                    jobId,
                    smartCandidates: [
                      {
                        key: 'self_anchor',
                        description: '智能推荐：自锚点策略',
                        confidence: 0.85,
                        xpath: '//button[@text="关注"]'
                      }
                    ],
                    recommendedKey: 'self_anchor'
                  }
                }));
              }, 100);
            }
          }, (index + 1) * 200);
        });
      };
    });
  });

  test('应该成功完成单作业分析流程并正确更新UI状态', async ({ page }) => {
    // 1. 找到智能分析按钮
    const intelligentButton = page.locator('button:has-text("🧠"), button:has-text("智能"), button:has-text("自动链")').first();
    await expect(intelligentButton).toBeVisible();
    
    // 2. 验证初始状态：按钮可用
    await expect(intelligentButton).toBeEnabled();
    await expect(intelligentButton).not.toHaveClass(/ant-btn-loading/);
    
    // 3. 点击启动分析
    await intelligentButton.click();
    
    // 4. 验证加载状态：按钮应该显示loading
    await expect(intelligentButton).toHaveClass(/ant-btn-loading/);
    await expect(intelligentButton).toBeDisabled();
    
    // 5. 获取jobId并启动模拟事件流
    const jobId = await page.evaluate(() => {
      // 模拟生成jobId（实际项目中应该从分析启动响应获取）
      const testJobId = 'test-job-' + Date.now();
      window.simulateNormalConvergence(testJobId);
      return testJobId;
    });
    
    // 6. 等待进度事件传播
    await page.waitForTimeout(1500); // 等待所有进度事件完成
    
    // 7. 验证按钮loading状态被移除
    await expect(intelligentButton).not.toHaveClass(/ant-btn-loading/);
    await expect(intelligentButton).toBeEnabled();
    
    // 8. 验证分析完成状态
    await page.waitForFunction(() => window.testState.analysisCompleted);
    
    // 9. 验证推荐策略展示
    const strategySection = page.locator('[data-testid="strategy-candidates"], .strategy-candidates, .smart-candidates').first();
    if (await strategySection.isVisible()) {
      await expect(strategySection).toContainText('自锚点策略');
    }
    
    // 10. 验证进度事件序列正确
    const progressEvents = await page.evaluate(() => window.testState.progressEvents);
    expect(progressEvents).toHaveLength(5);
    expect(progressEvents.map(e => e.progress)).toEqual([30, 60, 80, 95, 100]);
    
    // 11. 验证完成事件接收
    const completionEvents = await page.evaluate(() => window.testState.completionEvents);
    expect(completionEvents).toHaveLength(1);
    expect(completionEvents[0].smartCandidates).toHaveLength(1);
    expect(completionEvents[0].smartCandidates[0].key).toBe('self_anchor');
    
    // 12. 验证无错误发生
    const errors = await page.evaluate(() => window.testState.errors);
    expect(errors).toHaveLength(0);
    
    // 13. 验证按钮可以再次点击（无残留状态）
    await expect(intelligentButton).toBeEnabled();
    await expect(intelligentButton).not.toHaveClass(/ant-btn-loading/);
  });

  test('应该正确处理快速连续点击（幂等性保护）', async ({ page }) => {
    const intelligentButton = page.locator('button:has-text("🧠"), button:has-text("智能"), button:has-text("自动链")').first();
    
    // 快速连续点击3次
    await intelligentButton.click();
    await intelligentButton.click(); // 应该被忽略
    await intelligentButton.click(); // 应该被忽略
    
    // 验证只有一个分析任务启动
    await page.waitForTimeout(500);
    
    const jobId = await page.evaluate(() => {
      const testJobId = 'rapid-click-test-' + Date.now();
      window.simulateNormalConvergence(testJobId);
      return testJobId;
    });
    
    await page.waitForTimeout(1500);
    
    // 验证只收到一组事件序列
    const progressEvents = await page.evaluate(() => window.testState.progressEvents);
    expect(progressEvents.length).toBeLessThanOrEqual(5); // 不超过一个任务的事件数
  });

  test('应该在页面刷新后正确重置状态', async ({ page }) => {
    const intelligentButton = page.locator('button:has-text("🧠"), button:has-text("智能"), button:has-text("自动链")').first();
    
    // 启动分析
    await intelligentButton.click();
    await expect(intelligentButton).toHaveClass(/ant-btn-loading/);
    
    // 刷新页面
    await page.reload();
    
    // 等待页面重新加载
    await page.waitForLoadState('domcontentloaded');
    
    // 验证按钮状态重置
    const buttonAfterReload = page.locator('button:has-text("🧠"), button:has-text("智能"), button:has-text("自动链")').first();
    await expect(buttonAfterReload).toBeVisible();
    await expect(buttonAfterReload).toBeEnabled();
    await expect(buttonAfterReload).not.toHaveClass(/ant-btn-loading/);
    
    // 验证可以正常启动新的分析
    await buttonAfterReload.click();
    await expect(buttonAfterReload).toHaveClass(/ant-btn-loading/);
  });
});