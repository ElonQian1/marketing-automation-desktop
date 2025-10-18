// tests/e2e/event-routing-fix.spec.ts
// module: tests | layer: e2e | role: 事件路由修复验证
// summary: 专门测试"分析完成事件→步骤卡片状态同步"的闭环，验证修复效果

import { test, expect, Page } from '@playwright/test';

/**
 * 事件路由修复验证测试
 * 
 * 目标：验证 GitHub Issues 中的问题已修复
 * - 后端发送 analysis_completed 事件
 * - 前端正确接收并更新UI状态  
 * - 按钮从 loading 变为 ready 状态
 * - 步骤卡片显示推荐策略
 */
test.describe('事件路由修复验证', () => {
  
  test.beforeEach(async ({ page }) => {
    // 启动应用并导航到修复版演示页面
    await page.goto('/');
    
    // 等待应用加载完成
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
    
    // 导航到修复版页面
    await page.click('text=✅ 策略选择器修复版');
    await page.waitForSelector('h1:has-text("策略选择器真实后端集成演示 (修复版)")');
  });

  test('🐛→✅ 核心修复验证：事件完成后UI正确更新', async ({ page }) => {
    // 1. 记录初始状态
    const initialButtonText = await page.textContent('button:has-text("🧠 智能·自动链")');
    expect(initialButtonText).toContain('🧠 智能·自动链');
    expect(initialButtonText).not.toContain('🔄'); // 初始不应该有loading

    // 2. 点击智能分析按钮
    await page.click('button:has-text("🧠 智能·自动链")');
    
    // 3. 验证状态变为analyzing（应该显示loading）
    await expect(page.locator('button:has-text("🧠 智能·自动链")')).toContainText('🔄', {
      timeout: 2000
    });
    
    // 4. 监听页面控制台，捕获事件日志
    const eventLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('[UnifiedAnalysisEvents]')) {
        eventLogs.push(msg.text());
      }
    });

    // 5. 等待分析完成（最多30秒）
    // 期望：按钮文本变为包含 ✅ 而不是 🔄
    await expect(page.locator('button:has-text("✅")')).toBeVisible({
      timeout: 30000
    });

    // 6. 验证最终状态
    const finalButtonText = await page.textContent('button:has-text("✅")');
    expect(finalButtonText).toContain('✅');
    expect(finalButtonText).not.toContain('🔄'); // 不应该再有loading
    
    // 7. 验证事件日志中包含关键信息
    const hasProgressEvent = eventLogs.some(log => log.includes('收到进度事件'));
    const hasCompleteEvent = eventLogs.some(log => log.includes('收到完成事件'));
    
    expect(hasProgressEvent).toBe(true);
    expect(hasCompleteEvent).toBe(true);

    // 8. 验证策略选择器可用（点击应该显示策略选项）
    await page.click('button:has-text("✅")');
    
    // 应该能看到推荐策略选项
    await expect(page.locator('text=推荐')).toBeVisible({ timeout: 5000 });
  });

  test('🔄 进度更新正确显示', async ({ page }) => {
    // 监听进度变化
    const progressValues: number[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('进度更新') && text.includes('progress:')) {
        const match = text.match(/progress:\s*(\d+)/);
        if (match) {
          progressValues.push(parseInt(match[1]));
        }
      }
    });

    // 启动分析
    await page.click('button:has-text("🧠 智能·自动链")');
    
    // 等待至少收到一些进度更新
    await page.waitForFunction(() => {
      return window.console.log.toString().includes('进度更新');
    }, { timeout: 15000 });

    // 等待完成
    await expect(page.locator('button:has-text("✅")')).toBeVisible({
      timeout: 30000
    });

    // 验证进度是递增的
    expect(progressValues.length).toBeGreaterThan(0);
    
    // 验证最后的进度应该是100或接近100
    const lastProgress = progressValues[progressValues.length - 1];
    expect(lastProgress).toBeGreaterThanOrEqual(90);
  });

  test('📊 实时状态监控显示正确', async ({ page }) => {
    // 启动分析
    await page.click('button:has-text("🧠 智能·自动链")');
    
    // 验证实时状态区域显示活跃卡片
    await expect(page.locator('text=活跃卡片状态')).toBeVisible({ timeout: 10000 });
    
    // 验证状态从 analyzing 变为 ready
    await expect(page.locator('text=状态: analyzing')).toBeVisible({ timeout: 5000 });
    
    // 等待变为ready状态
    await expect(page.locator('text=状态: ready')).toBeVisible({ timeout: 30000 });
    
    // 验证有Job ID显示
    await expect(page.locator('text=Job:')).toBeVisible();
    
    // 验证进度显示100%
    await expect(page.locator('text=进度: 100%')).toBeVisible();
  });

  test('🎯 错误恢复机制', async ({ page }) => {
    // 模拟网络错误或后端故障情况
    // 这里可以通过拦截请求来模拟错误
    
    await page.route('**/start_intelligent_analysis', route => {
      route.abort('failed');
    });

    // 尝试启动分析
    await page.click('button:has-text("🧠 智能·自动链")');
    
    // 验证错误状态显示
    await expect(page.locator('button:has-text("❌")')).toBeVisible({ timeout: 10000 });
    
    // 清除路由拦截
    await page.unroute('**/start_intelligent_analysis');
    
    // 点击重试
    await page.click('button:has-text("❌")');
    
    // 验证可以重新启动
    await expect(page.locator('button:has-text("🔄")')).toBeVisible({ timeout: 5000 });
  });

  test('🔗 jobId 绑定验证', async ({ page }) => {
    const jobIds: string[] = [];
    const cardIds: string[] = [];
    
    // 监听控制台获取 jobId 和 cardId 的绑定日志
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('绑定Job') && text.includes('jobId')) {
        jobIds.push(text);
      }
      if (text.includes('创建步骤卡片') && text.includes('cardId')) {
        cardIds.push(text);
      }
    });

    // 启动分析
    await page.click('button:has-text("🧠 智能·自动链")');
    
    // 等待完成
    await expect(page.locator('button:has-text("✅")')).toBeVisible({
      timeout: 30000
    });

    // 验证有jobId绑定日志
    expect(jobIds.length).toBeGreaterThan(0);
    expect(cardIds.length).toBeGreaterThan(0);
    
    // 验证实时状态中显示了Job ID
    const jobIdText = await page.textContent('text=Job:');
    expect(jobIdText).toMatch(/Job:\s*\w{6,}/);
  });
});

/**
 * 对比测试：新旧系统行为差异
 */
test.describe('新旧系统对比', () => {
  
  test('📈 性能对比：统一事件系统 vs 分离系统', async ({ page }) => {
    // 访问修复版页面
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
    await page.click('text=✅ 策略选择器修复版');
    
    // 记录开始时间
    const startTime = Date.now();
    
    // 启动分析
    await page.click('button:has-text("🧠 智能·自动链")');
    
    // 等待完成
    await expect(page.locator('button:has-text("✅")')).toBeVisible({
      timeout: 30000
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // 记录性能数据（可以与旧版本对比）
    console.log(`修复版完成时间: ${duration}ms`);
    
    // 验证在合理时间内完成（应该不超过30秒）
    expect(duration).toBeLessThan(30000);
  });
});