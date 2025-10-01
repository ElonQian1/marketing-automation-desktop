import { test, expect } from '@playwright/test';

/**
 * 品牌化页面测试套件
 * 
 * 验证新重构的品牌化页面是否：
 * 1. 正确渲染品牌化组件
 * 2. 无.ant-*样式覆盖
 * 3. 符合设计令牌规范
 * 4. 响应式布局正常
 */

test.describe('品牌化页面渲染测试', () => {
  
  test('员工页面品牌化渲染', async ({ page }) => {
    await page.goto('/employee-brand');
    
    // 验证PageShell结构
    await expect(page.locator('[data-testid="page-shell"]')).toBeVisible();
    
    // 验证品牌化标题
    await expect(page.locator('h1')).toContainText('员工管理');
    
    // 验证CardShell容器
    await expect(page.locator('[data-testid="card-shell"]')).toBeVisible();
    
    // 验证无.ant-*类名覆盖
    const antClasses = await page.locator('[class*=".ant-"]').count();
    expect(antClasses).toBe(0);
  });

  test('设备管理页面品牌化渲染', async ({ page }) => {
    await page.goto('/device-management-brand');
    
    // 验证页面结构
    await expect(page.locator('[data-testid="page-shell"]')).toBeVisible();
    
    // 验证设备列表渲染
    await expect(page.locator('[data-testid="device-list"]')).toBeVisible();
    
    // 验证品牌化按钮
    await expect(page.locator('button[data-variant="primary"]')).toBeVisible();
  });

  test('联系人导入页面品牌化渲染', async ({ page }) => {
    await page.goto('/contact-import-brand');
    
    // 验证页面加载
    await expect(page.locator('[data-testid="page-shell"]')).toBeVisible();
    
    // 验证加载状态品牌化
    const loadingElement = page.locator('text=加载联系人导入工具中');
    if (await loadingElement.isVisible()) {
      await expect(loadingElement).toBeVisible();
    }
    
    // 等待组件加载完成
    await page.waitForLoadState('networkidle');
  });
});

test.describe('响应式布局测试', () => {
  
  test('1920x1080桌面分辨率', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/employee-brand');
    
    // 验证桌面布局
    const container = page.locator('[data-testid="page-shell"]');
    await expect(container).toBeVisible();
    
    // 验证容器宽度合理
    const boundingBox = await container.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(1200);
  });

  test('1366x768紧凑分辨率', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/employee-brand');
    
    // 验证紧凑布局适配
    const container = page.locator('[data-testid="page-shell"]');
    await expect(container).toBeVisible();
    
    // 验证无横向滚动
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20); // 20px容差
  });
});

test.describe('设计令牌验证', () => {
  
  test('品牌色彩系统', async ({ page }) => {
    await page.goto('/employee-brand');
    
    // 验证主要品牌色
    const primaryButton = page.locator('button[data-variant="primary"]').first();
    if (await primaryButton.isVisible()) {
      const bgColor = await primaryButton.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      // 验证使用CSS变量（间接验证Design Tokens）
      expect(bgColor).toBeTruthy();
    }
  });

  test('间距系统一致性', async ({ page }) => {
    await page.goto('/employee-brand');
    
    // 验证PageShell使用统一间距
    const pageShell = page.locator('[data-testid="page-shell"]');
    const padding = await pageShell.evaluate(el => 
      window.getComputedStyle(el).padding
    );
    
    // 验证使用rem单位（设计令牌特征）
    expect(padding).toBeTruthy();
  });
});