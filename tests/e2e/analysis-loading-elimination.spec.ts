// tests/e2e/analysis-loading-elimination.spec.ts
// module: e2e | layer: tests | role: 端到端分析加载状态测试
// summary: 验证分析工作流完整UI转换，消除"30%卡住"问题的E2E测试

import { test, expect } from '@playwright/test';

test.describe('Analysis Loading State Elimination', () => {
  test.beforeEach(async ({ page }) => {
    // 启动应用到智能分析页面
    await page.goto('/');
    // 假设需要导航到分析页面
    await page.click('[data-testid="intelligent-analysis-tab"]');
  });

  test('should complete full analysis workflow without stuck progress', async ({ page }) => {
    // E2E测试1: 完整分析工作流 - 确保没有进度卡住
    
    // 1. 验证初始状态
    await expect(page.locator('[data-testid="analysis-status"]')).toHaveText('idle');
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('aria-valuenow', '0');
    
    // 2. 开始分析
    await page.click('[data-testid="start-analysis-button"]');
    
    // 3. 验证分析状态转换
    await expect(page.locator('[data-testid="analysis-status"]')).toHaveText('analyzing');
    
    // 4. 验证进度更新（确保不会卡在30%）
    // 等待进度超过30% - 这是之前的卡住点
    await page.waitForFunction(() => {
      const progressBar = document.querySelector('[data-testid="progress-bar"]');
      const progress = parseInt(progressBar?.getAttribute('aria-valuenow') || '0');
      return progress > 30;
    }, { timeout: 10000 });
    
    // 5. 验证进度继续增长到更高值
    await page.waitForFunction(() => {
      const progressBar = document.querySelector('[data-testid="progress-bar"]');
      const progress = parseInt(progressBar?.getAttribute('aria-valuenow') || '0');
      return progress > 60;
    }, { timeout: 15000 });
    
    // 6. 验证最终完成
    await page.waitForFunction(() => {
      const progressBar = document.querySelector('[data-testid="progress-bar"]');
      const progress = parseInt(progressBar?.getAttribute('aria-valuenow') || '0');
      return progress === 100;
    }, { timeout: 20000 });
    
    // 7. 验证完成状态
    await expect(page.locator('[data-testid="analysis-status"]')).toHaveText('analysis_completed');
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();
  });

  test('should handle analysis errors gracefully', async ({ page }) => {
    // E2E测试2: 错误处理 - 验证错误状态转换
    
    // 模拟错误条件（比如无设备连接）
    await page.route('**/api/analysis/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Device not connected' })
      });
    });
    
    await page.click('[data-testid="start-analysis-button"]');
    
    // 验证错误状态
    await expect(page.locator('[data-testid="analysis-status"]')).toHaveText('analysis_failed');
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Device not connected');
  });

  test('should maintain progress monotonicity', async ({ page }) => {
    // E2E测试3: 进度单调性 - 确保进度值只增不减
    
    const progressValues: number[] = [];
    
    // 监听进度变化
    await page.exposeFunction('collectProgress', (progress: number) => {
      progressValues.push(progress);
    });
    
    await page.addInitScript(() => {
      // 拦截进度更新事件
      const originalSetAttribute = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function(name, value) {
        if (name === 'aria-valuenow' && this.getAttribute('data-testid') === 'progress-bar') {
          (window as any).collectProgress(parseInt(value));
        }
        return originalSetAttribute.call(this, name, value);
      };
    });
    
    await page.click('[data-testid="start-analysis-button"]');
    
    // 等待分析完成
    await page.waitForFunction(() => {
      const progressBar = document.querySelector('[data-testid="progress-bar"]');
      const progress = parseInt(progressBar?.getAttribute('aria-valuenow') || '0');
      return progress === 100;
    }, { timeout: 30000 });
    
    // 验证进度序列单调递增
    for (let i = 1; i < progressValues.length; i++) {
      expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
    }
    
    // 验证没有禁止的硬编码序列
    const forbiddenSequence = [10, 30, 60, 80, 95, 100];
    expect(progressValues).not.toEqual(forbiddenSequence);
  });

  test('should complete multiple analysis cycles without regression', async ({ page }) => {
    // E2E测试4: 多轮分析 - 确保没有状态泄漏
    
    for (let cycle = 1; cycle <= 3; cycle++) {
      // 重置状态
      if (cycle > 1) {
        await page.click('[data-testid="reset-analysis-button"]');
      }
      
      // 验证初始状态
      await expect(page.locator('[data-testid="analysis-status"]')).toHaveText('idle');
      await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('aria-valuenow', '0');
      
      // 执行分析
      await page.click('[data-testid="start-analysis-button"]');
      
      // 等待完成
      await page.waitForFunction(() => {
        const progressBar = document.querySelector('[data-testid="progress-bar"]');
        const progress = parseInt(progressBar?.getAttribute('aria-valuenow') || '0');
        return progress === 100;
      }, { timeout: 20000 });
      
      // 验证完成状态
      await expect(page.locator('[data-testid="analysis-status"]')).toHaveText('analysis_completed');
      
      console.log(`Cycle ${cycle} completed successfully`);
    }
  });
});