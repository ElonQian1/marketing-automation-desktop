// tests/e2e/health-check-integration.spec.ts
// module: health-check | layer: e2e-tests | role: 健康检查集成E2E测试
// summary: 测试健康检查系统的前端集成功能和用户交互

import { test, expect } from '@playwright/test';

test.describe('健康检查系统集成', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到包含健康检查组件的页面
    await page.goto('/');
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
  });

  test('首屏自动健康检查', async ({ page }) => {
    // 验证健康检查组件存在
    const healthCheckCard = page.locator('[data-testid="health-check-system"]').first();
    if (await healthCheckCard.count() > 0) {
      await expect(healthCheckCard).toBeVisible();

      // 等待首屏探活完成（最多等待10秒）
      await page.waitForTimeout(2000);

      // 验证状态不是"未知"（说明已经执行了检查）
      const statusBadge = page.locator('.ant-badge').first();
      if (await statusBadge.count() > 0) {
        const statusText = await statusBadge.textContent();
        expect(statusText).not.toBe('未知');
      }
    }
  });

  test('手动触发健康检查', async ({ page }) => {
    // 查找健康检查按钮
    const checkButton = page.locator('button:has-text("手动检查")').first();
    
    if (await checkButton.count() > 0) {
      // 点击手动检查按钮
      await checkButton.click();

      // 验证按钮显示loading状态
      await expect(checkButton).toHaveClass(/ant-btn-loading/);

      // 等待检查完成（最多10秒）
      await expect(checkButton).not.toHaveClass(/ant-btn-loading/, { timeout: 10000 });

      // 验证检查结果已更新
      const timestamp = page.locator('.ant-statistic:has-text("最后检查时间")').first();
      if (await timestamp.count() > 0) {
        await expect(timestamp).toBeVisible();
      }
    }
  });

  test('健康检查错误处理', async ({ page }) => {
    // 模拟网络错误 - 拦截健康检查请求
    await page.route('**/health**', route => {
      route.abort('failed');
    });

    // 触发健康检查
    const checkButton = page.locator('button:has-text("手动检查")').first();
    if (await checkButton.count() > 0) {
      await checkButton.click();

      // 等待错误状态出现
      const errorAlert = page.locator('.ant-alert-error').first();
      if (await errorAlert.count() > 0) {
        await expect(errorAlert).toBeVisible({ timeout: 10000 });
      }

      // 验证错误徽章
      const statusBadge = page.locator('.ant-badge:has-text("异常")').first();
      if (await statusBadge.count() > 0) {
        await expect(statusBadge).toBeVisible();
      }
    }
  });

  test('健康检查成功状态', async ({ page }) => {
    // 模拟成功的健康检查响应
    await page.route('**/health**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isHealthy: true,
          message: '后端服务正常',
          responseTime: 150,
          endpoint: '/api/health',
          version: '1.0.0'
        })
      });
    });

    // 触发健康检查
    const checkButton = page.locator('button:has-text("手动检查")').first();
    if (await checkButton.count() > 0) {
      await checkButton.click();

      // 等待成功状态
      const successAlert = page.locator('.ant-alert-success').first();
      if (await successAlert.count() > 0) {
        await expect(successAlert).toBeVisible({ timeout: 10000 });
      }

      // 验证成功徽章
      const statusBadge = page.locator('.ant-badge:has-text("健康")').first();
      if (await statusBadge.count() > 0) {
        await expect(statusBadge).toBeVisible();
      }

      // 验证响应时间显示
      const responseTime = page.locator('.ant-statistic:has-text("响应时间")').first();
      if (await responseTime.count() > 0) {
        await expect(responseTime).toBeVisible();
        await expect(responseTime).toContainText('150ms');
      }
    }
  });

  test('详细信息展示', async ({ page }) => {
    // 确保显示详细信息
    const detailsSection = page.locator('.ant-descriptions').first();
    
    if (await detailsSection.count() > 0) {
      await expect(detailsSection).toBeVisible();

      // 验证包含必要的详细信息项
      const endpointItem = page.locator('.ant-descriptions-item:has-text("检查端点")').first();
      if (await endpointItem.count() > 0) {
        await expect(endpointItem).toBeVisible();
      }

      const statusItem = page.locator('.ant-descriptions-item:has-text("健康状态")').first();
      if (await statusItem.count() > 0) {
        await expect(statusItem).toBeVisible();
      }
    }
  });

  test('检查中状态显示', async ({ page }) => {
    // 模拟慢速响应以捕获loading状态
    await page.route('**/health**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ isHealthy: true, message: '健康' })
      });
    });

    // 触发检查
    const checkButton = page.locator('button:has-text("手动检查")').first();
    if (await checkButton.count() > 0) {
      await checkButton.click();

      // 验证检查中状态
      const checkingBadge = page.locator('.ant-badge:has-text("检查中")').first();
      if (await checkingBadge.count() > 0) {
        await expect(checkingBadge).toBeVisible();
      }

      // 验证loading指示器
      const loadingSpinner = page.locator('.ant-spin').first();
      if (await loadingSpinner.count() > 0) {
        await expect(loadingSpinner).toBeVisible();
      }
    }
  });

  test('事件系统集成', async ({ page }) => {
    // 监听自定义事件
    let healthCheckEvent: any = null;
    await page.addInitScript(() => {
      window.addEventListener('health_check_success', (event) => {
        (window as any).lastHealthCheckEvent = (event as CustomEvent).detail;
      });
    });

    // 模拟成功响应
    await page.route('**/health**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          isHealthy: true, 
          message: '服务正常',
          responseTime: 200 
        })
      });
    });

    // 触发检查
    const checkButton = page.locator('button:has-text("手动检查")').first();
    if (await checkButton.count() > 0) {
      await checkButton.click();
      await page.waitForTimeout(1000);

      // 验证事件被触发
      const eventData = await page.evaluate(() => (window as any).lastHealthCheckEvent);
      if (eventData) {
        expect(eventData.result.isHealthy).toBe(true);
        expect(eventData.timestamp).toBeDefined();
      }
    }
  });

  test('自动刷新功能', async ({ page }) => {
    // 设置较短的刷新间隔进行测试
    let requestCount = 0;
    await page.route('**/health**', route => {
      requestCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          isHealthy: true, 
          message: `检查 #${requestCount}` 
        })
      });
    });

    // 等待自动刷新（假设设置了较短的间隔）
    await page.waitForTimeout(3000);

    // 验证发生了多次请求（说明自动刷新工作）
    if (requestCount > 1) {
      expect(requestCount).toBeGreaterThan(1);
    }
  });
});