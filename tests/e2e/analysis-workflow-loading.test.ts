// tests/e2e/analysis-workflow-loading.test.ts
// module: testing | layer: e2e | role: 智能分析工作流端到端测试
// summary: 测试分析按钮loading状态移除和100%进度断言，防止30%残影回归

import { test, expect } from '@playwright/test';
import type { ProgressEventDetail, CompletionEventDetail } from './types/global';

/**
 * E2E测试：智能分析工作流完成状态验证
 * 
 * 核心验证点：
 * 1. 分析按钮loading状态在完成后正确移除
 * 2. 进度条必须达到100%才触发完成事件
 * 3. 完成后按钮重新可用，可进行下次分析
 */

test.describe('智能分析工作流状态管理', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到智能分析页面
    await page.goto('/intelligent-analysis');
    await page.waitForLoadState('networkidle');
  });

  test('分析按钮loading状态正确移除', async ({ page }) => {
    // 定位分析按钮
    const analyzeButton = page.locator('[data-testid="analyze-button"]');
    
    // 验证初始状态：按钮可用，无loading
    await expect(analyzeButton).toBeEnabled();
    await expect(analyzeButton).not.toHaveClass(/loading/);
    
    // 点击开始分析
    await analyzeButton.click();
    
    // 验证loading状态激活
    await expect(analyzeButton).toHaveClass(/loading/);
    await expect(analyzeButton).toBeDisabled();
    
    // 等待分析完成（监听progress事件到100%）
    await page.waitForFunction(() => {
      const progressEvent = window.lastProgressEvent;
      return progressEvent && progressEvent.progress === 100;
    }, { timeout: 30000 });
    
    // 关键验证：loading状态必须在100%进度后移除
    await expect(analyzeButton).not.toHaveClass(/loading/);
    await expect(analyzeButton).toBeEnabled();
  });

  test('进度必须达到100%才触发完成事件', async ({ page }) => {
    // 注入进度监听脚本
    await page.addInitScript(() => {
      window.progressEvents = [];
      window.completionEvents = [];
      
      // 监听所有进度事件
      window.addEventListener('progress_update', (e: Event) => {
        const customEvent = e as CustomEvent<ProgressEventDetail>;
        window.progressEvents.push(customEvent.detail);
        window.lastProgressEvent = customEvent.detail;
      });
      
      // 监听完成事件
      window.addEventListener('analysis_completed', (e: Event) => {
        const customEvent = e as CustomEvent<CompletionEventDetail>;
        window.completionEvents.push(customEvent.detail);
      });
    });
    
    const analyzeButton = page.locator('[data-testid="analyze-button"]');
    await analyzeButton.click();
    
    // 等待至少一个进度事件
    await page.waitForFunction(() => window.progressEvents.length > 0);
    
    // 等待完成事件
    await page.waitForFunction(() => window.completionEvents.length > 0, { timeout: 30000 });
    
    // 验证完成事件只在100%进度后触发
    const finalProgress = await page.evaluate(() => {
      const events = window.progressEvents;
      return events[events.length - 1].progress;
    });
    
    expect(finalProgress).toBe(100);
    
    // 验证完成事件确实被触发
    const completionCount = await page.evaluate(() => window.completionEvents.length);
    expect(completionCount).toBe(1);
  });

  test('防止30%残影：确保状态完全重置', async ({ page }) => {
    const analyzeButton = page.locator('[data-testid="analyze-button"]');
    const progressBar = page.locator('[data-testid="progress-bar"]');
    
    // 第一次分析
    await analyzeButton.click();
    await page.waitForFunction(() => window.lastProgressEvent?.progress === 100, { timeout: 30000 });
    
    // 验证第一次完成后状态重置
    await expect(analyzeButton).toBeEnabled();
    await expect(progressBar).toHaveText('0%');
    
    // 第二次分析（这是关键测试点）
    await analyzeButton.click();
    
    // 验证第二次分析不会从30%等中间值开始
    await page.waitForFunction(() => {
      const events = window.progressEvents;
      // 找到第二轮分析的第一个进度事件
      const secondRoundStart = events.findIndex(e => e.jobId !== events[0].jobId);
      return secondRoundStart > -1 && events[secondRoundStart].progress <= 10;
    });
    
    // 等待第二次完成
    await page.waitForFunction(() => {
      const completions = window.completionEvents;
      return completions.length === 2;
    }, { timeout: 30000 });
    
    // 验证第二次也是100%完成
    const secondCompletion = await page.evaluate(() => {
      return window.completionEvents[1].progress;
    });
    expect(secondCompletion).toBe(100);
  });

  test('错误情况下loading状态也要正确清除', async ({ page }) => {
    // 模拟网络错误或分析失败
    await page.route('**/api/intelligent-analysis/**', route => {
      route.abort('failed');
    });
    
    const analyzeButton = page.locator('[data-testid="analyze-button"]');
    await analyzeButton.click();
    
    // 等待错误处理
    await page.waitForTimeout(2000);
    
    // 即使出错，loading状态也应该清除
    await expect(analyzeButton).not.toHaveClass(/loading/);
    await expect(analyzeButton).toBeEnabled();
  });
});

test.describe('进度事件边界情况', () => {
  test('进度事件乱序时的处理', async ({ page }) => {
    await page.goto('/intelligent-analysis');
    
    // 注入模拟乱序进度事件的脚本
    await page.addInitScript(() => {
      window.simulateProgressEvents = () => {
        // 模拟乱序进度：50% → 30% → 100%
        setTimeout(() => window.dispatchEvent(new CustomEvent('progress_update', { detail: { progress: 50, jobId: 'test-job' } })), 100);
        setTimeout(() => window.dispatchEvent(new CustomEvent('progress_update', { detail: { progress: 30, jobId: 'test-job' } })), 200);
        setTimeout(() => window.dispatchEvent(new CustomEvent('progress_update', { detail: { progress: 100, jobId: 'test-job' } })), 300);
      };
    });
    
    // 触发模拟事件
    await page.evaluate(() => window.simulateProgressEvents());
    
    // 验证UI显示的是最终的100%，而不是中间的乱序值
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveText('100%');
  });

  test('并发多个分析请求的隔离', async ({ page }) => {
    await page.goto('/intelligent-analysis');
    
    const analyzeButton = page.locator('[data-testid="analyze-button"]');
    
    // 快速连击两次（模拟用户双击或网络延迟导致的重复请求）
    await analyzeButton.click();
    await analyzeButton.click();
    
    // 验证只有一个分析任务在运行
    await page.waitForFunction(() => {
      const uniqueJobIds = new Set(window.progressEvents?.map(e => e.jobId) || []);
      return uniqueJobIds.size === 1;
    });
    
    // 等待完成
    await page.waitForFunction(() => window.lastProgressEvent?.progress === 100, { timeout: 30000 });
    
    // 验证只触发了一次完成事件
    const completionCount = await page.evaluate(() => window.completionEvents?.length || 0);
    expect(completionCount).toBe(1);
  });
});