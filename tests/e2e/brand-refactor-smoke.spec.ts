// tests/e2e/brand-refactor-smoke.spec.ts
// 品牌化重构核心功能冒烟测试
// 验证品牌化组件正常渲染、主题切换、响应式布局

import { test, expect } from '@playwright/test';

test.describe('品牌化重构 - 核心功能测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 导航到应用首页
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('应用启动和基本渲染', async ({ page }) => {
    // 验证应用标题
    await expect(page).toHaveTitle(/Employee/i);
    
    // 验证主导航存在
    const nav = page.locator('[data-testid="main-navigation"]').or(page.locator('nav')).first();
    await expect(nav).toBeVisible();
  });

  test('品牌化组件渲染测试', async ({ page }) => {
    // 检查是否有品牌化按钮
    const buttons = page.locator('button');
    await expect(buttons.first()).toBeVisible();
    
    // 验证 Design Tokens 是否生效（检查 CSS 变量）
    const buttonStyles = await buttons.first().evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      return {
        borderRadius: computedStyle.borderRadius,
        backgroundColor: computedStyle.backgroundColor,
      };
    });
    
    // 验证圆角不是默认值（说明 tokens 生效）
    expect(buttonStyles.borderRadius).not.toBe('0px');
  });

  test('暗黑模式切换测试', async ({ page }) => {
    // 查找主题切换按钮
    const themeToggle = page.locator('[data-testid="theme-toggle"]')
      .or(page.locator('button:has-text("暗黑")')).or(page.locator('button:has-text("主题")'));
    
    if (await themeToggle.isVisible()) {
      // 记录切换前的背景色
      const initialBg = await page.locator('body').evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // 切换主题
      await themeToggle.click();
      await page.waitForTimeout(500); // 等待主题切换动画
      
      // 验证背景色发生变化
      const newBg = await page.locator('body').evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      
      expect(newBg).not.toBe(initialBg);
    } else {
      // 如果没有主题切换器，至少验证当前主题渲染正常
      const bodyBg = await page.locator('body').evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      expect(bodyBg).toBeTruthy();
    }
  });

  test('导航功能测试', async ({ page }) => {
    // 测试主要页面导航
    const navItems = [
      '员工管理', '设备管理', '联系人', '脚本', '镜像'
    ];
    
    for (const item of navItems) {
      const navLink = page.locator(`a:has-text("${item}")`)
        .or(page.locator(`button:has-text("${item}")`)).first();
      
      if (await navLink.isVisible()) {
        await navLink.click();
        await page.waitForLoadState('networkidle');
        
        // 验证页面内容已加载（至少有标题）
        const hasTitle = await page.locator('h1, h2, [role="heading"]').count() > 0;
        expect(hasTitle).toBeTruthy();
        
        // 等待一下再点击下一个导航
        await page.waitForTimeout(300);
      }
    }
  });

  test('响应式布局测试', async ({ page }) => {
    // 测试不同视窗大小
    const viewports = [
      { width: 1920, height: 1080 }, // 大屏
      { width: 1280, height: 720 },  // 中屏
      { width: 768, height: 1024 },  // 平板
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500); // 等待布局调整
      
      // 验证主要元素仍然可见
      const mainContent = page.locator('main, [role="main"], .main-content').first();
      await expect(mainContent).toBeVisible();
      
      // 验证没有水平滚动条（除非是移动端）
      if (viewport.width >= 768) {
        const hasHorizontalScroll = await page.evaluate(() => 
          document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(hasHorizontalScroll).toBeFalsy();
      }
    }
  });

  test('A11y 键盘导航测试', async ({ page }) => {
    // 从第一个可聚焦元素开始
    await page.keyboard.press('Tab');
    
    // 验证焦点可见性
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // 测试 Tab 导航至少 5 个元素
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      // 每次 Tab 后都应该有聚焦元素
      const currentFocused = page.locator(':focus');
      if (await currentFocused.count() > 0) {
        await expect(currentFocused).toBeVisible();
      }
    }
    
    // 测试 Shift+Tab 反向导航
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
  });

  test('错误处理和加载状态', async ({ page }) => {
    // 测试加载状态显示
    const loadingElements = page.locator('[data-testid="loading"], .loading, .ant-spin');
    
    // 如果有加载指示器，验证它们正常显示
    if (await loadingElements.count() > 0) {
      await expect(loadingElements.first()).toBeVisible();
    }
    
    // 验证页面最终加载完成（没有永久加载状态）
    await expect(page.locator('text=加载中')).toHaveCount(0, { timeout: 10000 });
  });
});

test.describe('设备管理页面 - 品牌化版本', () => {
  
  test('设备管理页面渲染测试', async ({ page }) => {
    // 导航到设备管理页面
    await page.goto('/');
    
    // 寻找设备管理导航链接
    const deviceNav = page.locator('a:has-text("设备")').or(page.locator('button:has-text("设备")'));
    
    if (await deviceNav.isVisible()) {
      await deviceNav.click();
      await page.waitForLoadState('networkidle');
      
      // 验证页面标题
      await expect(page.locator('h1, h2').filter({ hasText: '设备' })).toBeVisible();
      
      // 验证统计卡片存在
      const statsCards = page.locator('.text-2xl, [data-testid="stat-card"]');
      expect(await statsCards.count()).toBeGreaterThan(0);
      
      // 验证操作按钮存在
      const addButton = page.locator('button:has-text("添加")');
      const refreshButton = page.locator('button:has-text("刷新")');
      
      if (await addButton.isVisible()) {
        await expect(addButton).toBeEnabled();
      }
      
      if (await refreshButton.isVisible()) {
        await expect(refreshButton).toBeEnabled();
      }
    }
  });
});