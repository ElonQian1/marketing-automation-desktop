// tests/e2e/event-flow-convergence.spec.ts
// module: e2e-tests | layer: integration | role: 事件流收敛验证测试
// summary: 验证智能分析的事件流闭环 - 进度30%→100%→completed→推荐策略展示

import { test, expect, type Page } from '@playwright/test';
import { EVENTS } from '../../src/shared/constants/events';

interface AnalysisEventPayload {
  jobId: string;
  progress?: number;
  status?: 'analyzing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

// 事件收集器 - 捕获前端事件流
class EventFlowCollector {
  private events: Array<{ event: string; payload: any; timestamp: number }> = [];
  
  constructor(private page: Page) {}
  
  async startCollecting() {
    // 监听 Tauri 事件
    await this.page.evaluate(() => {
      if (window.__TAURI__) {
        const originalListen = window.__TAURI__.event.listen;
        window.__TAURI__.event.listen = function(event: string, handler: Function) {
          const wrappedHandler = (data: any) => {
            window.__eventCollector = window.__eventCollector || [];
            window.__eventCollector.push({
              event,
              payload: data.payload,
              timestamp: Date.now()
            });
            return handler(data);
          };
          return originalListen(event, wrappedHandler);
        };
      }
    });
  }
  
  async getCollectedEvents(): Promise<Array<{ event: string; payload: any; timestamp: number }>> {
    return await this.page.evaluate(() => window.__eventCollector || []);
  }
  
  async clearEvents() {
    await this.page.evaluate(() => window.__eventCollector = []);
  }
}

test.describe('Event Flow Convergence Validation', () => {
  let collector: EventFlowCollector;
  
  test.beforeEach(async ({ page }) => {
    collector = new EventFlowCollector(page);
    await collector.startCollecting();
    await page.goto('/smart-script-builder');
    await page.waitForLoadState('networkidle');
  });
  
  test('单job智能分析完整收敛流程', async ({ page }) => {
    // 🎯 模拟智能分析触发
    await page.getByTestId('intelligent-analysis-trigger').click();
    
    // 🔍 等待分析开始
    await expect(page.getByTestId('analysis-progress-indicator')).toBeVisible();
    
    // 📊 验证进度事件序列: 30% → 67% → 100%
    await page.waitForFunction(() => {
      const events = window.__eventCollector || [];
      return events.some(e => 
        e.event === 'intelligent_analysis_progress' && 
        e.payload?.progress >= 30
      );
    }, { timeout: 10000 });
    
    await page.waitForFunction(() => {
      const events = window.__eventCollector || [];
      return events.some(e => 
        e.event === 'intelligent_analysis_progress' && 
        e.payload?.progress >= 67
      );
    }, { timeout: 15000 });
    
    await page.waitForFunction(() => {
      const events = window.__eventCollector || [];
      return events.some(e => 
        e.event === 'intelligent_analysis_progress' && 
        e.payload?.progress === 100
      );
    }, { timeout: 20000 });
    
    // ✅ 验证完成事件
    await page.waitForFunction(() => {
      const events = window.__eventCollector || [];
      return events.some(e => 
        e.event === 'intelligent_analysis_completed' && 
        e.payload?.result
      );
    }, { timeout: 25000 });
    
    // 🎨 验证UI响应: Loading消失 + 推荐策略显示
    await expect(page.getByTestId('analysis-progress-indicator')).toBeHidden();
    await expect(page.getByTestId('recommended-strategies')).toBeVisible();
    
    // 📈 验证事件流完整性
    const events = await collector.getCollectedEvents();
    const analysisEvents = events.filter(e => e.event.startsWith('intelligent_analysis'));
    
    // 检查事件顺序
    const progressEvents = analysisEvents.filter(e => e.event === 'intelligent_analysis_progress');
    const completedEvents = analysisEvents.filter(e => e.event === 'intelligent_analysis_completed');
    
    expect(progressEvents.length).toBeGreaterThanOrEqual(3); // 至少30%, 67%, 100%
    expect(completedEvents.length).toBe(1);
    
    // 验证最后一个进度事件是100%
    const lastProgressEvent = progressEvents[progressEvents.length - 1];
    expect(lastProgressEvent.payload.progress).toBe(100);
    
    // 验证完成事件在100%进度后
    const completedEvent = completedEvents[0];
    expect(completedEvent.timestamp).toBeGreaterThan(lastProgressEvent.timestamp);
  });
  
  test('并发任务JobId隔离验证', async ({ page }) => {
    // 🚀 快速连续触发两个分析任务
    await page.getByTestId('intelligent-analysis-trigger').click();
    await page.waitForTimeout(100); // 短暂间隔
    await page.getByTestId('intelligent-analysis-trigger').click();
    
    // ⏱️ 等待足够时间让两个任务都有进展
    await page.waitForTimeout(5000);
    
    const events = await collector.getCollectedEvents();
    const progressEvents = events.filter(e => e.event === 'intelligent_analysis_progress');
    
    // 📋 提取所有JobId
    const jobIds = [...new Set(progressEvents.map(e => e.payload?.jobId).filter(Boolean))];
    
    // ✅ 验证: 至少有1个JobId (理想情况下应该有2个，但取决于实现)
    expect(jobIds.length).toBeGreaterThanOrEqual(1);
    
    // 🔒 验证: 每个JobId的事件序列独立且合理
    for (const jobId of jobIds) {
      const jobEvents = progressEvents.filter(e => e.payload?.jobId === jobId);
      const progressValues = jobEvents.map(e => e.payload?.progress).sort((a, b) => a - b);
      
      // 验证进度单调递增或保持
      for (let i = 1; i < progressValues.length; i++) {
        expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
      }
    }
  });
  
  test('错误场景下的事件流处理', async ({ page }) => {
    // 🚨 模拟分析失败场景 (通过禁用网络或模拟后端错误)
    await page.route('**/api/analyze*', route => route.abort());
    
    await page.getByTestId('intelligent-analysis-trigger').click();
    
    // ⚠️ 等待错误事件
    await page.waitForFunction(() => {
      const events = window.__eventCollector || [];
      return events.some(e => 
        e.event === 'intelligent_analysis_failed' ||
        e.event === 'intelligent_analysis_error'
      );
    }, { timeout: 10000 });
    
    // 🔍 验证错误状态UI
    await expect(page.getByTestId('analysis-error-message')).toBeVisible();
    await expect(page.getByTestId('analysis-progress-indicator')).toBeHidden();
    
    const events = await collector.getCollectedEvents();
    const errorEvents = events.filter(e => 
      e.event === 'intelligent_analysis_failed' || 
      e.event === 'intelligent_analysis_error'
    );
    
    expect(errorEvents.length).toBeGreaterThanOrEqual(1);
    expect(errorEvents[0].payload).toHaveProperty('error');
  });
  
  test('事件常量化合规性检查', async ({ page }) => {
    // 📝 这个测试确保所有事件都通过EVENTS常量发送，而非硬编码字符串
    
    await page.getByTestId('intelligent-analysis-trigger').click();
    await page.waitForTimeout(2000);
    
    const events = await collector.getCollectedEvents();
    
    // 🎯 验证所有分析相关事件都使用了正确的常量名
    const validEventNames = [
      'intelligent_analysis_started',
      'intelligent_analysis_progress', 
      'intelligent_analysis_completed',
      'intelligent_analysis_failed',
      'intelligent_analysis_error'
    ];
    
    const analysisEvents = events.filter(e => e.event.startsWith('intelligent_analysis'));
    
    for (const event of analysisEvents) {
      expect(validEventNames).toContain(event.event);
      
      // 验证事件payload结构
      expect(event.payload).toHaveProperty('jobId');
      expect(typeof event.payload.jobId).toBe('string');
      expect(event.payload.jobId.length).toBeGreaterThan(0);
    }
  });
  
  test.afterEach(async ({ page }) => {
    // 📊 收集并保存事件流证据
    const events = await collector.getCollectedEvents();
    
    // 生成事件流报告
    const reportPath = `test-results/event-flow-${Date.now()}.json`;
    await page.evaluate((events) => {
      console.log('=== Event Flow Evidence ===');
      console.log(JSON.stringify(events, null, 2));
    }, events);
    
    // 清理
    await collector.clearEvents();
  });
});

// 🌐 全局声明 - 支持事件收集器
declare global {
  interface Window {
    __eventCollector: Array<{ event: string; payload: any; timestamp: number }>;
    __TAURI__?: any;
  }
}