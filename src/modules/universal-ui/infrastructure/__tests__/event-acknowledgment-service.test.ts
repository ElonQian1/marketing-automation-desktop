// src/modules/universal-ui/infrastructure/__tests__/event-acknowledgment-service.test.ts
// module: universal-ui | layer: infrastructure | role: event-ack-test
// summary: 事件确认服务测试，验证XOR约束和幂等性

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventAcknowledgmentService } from '../event-acknowledgment-service';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue({})
}));

describe('EventAcknowledgmentService', () => {
  let ackService: EventAcknowledgmentService;

  beforeEach(() => {
    ackService = new EventAcknowledgmentService();
  });

  describe('🔒 XOR约束：单一通道确认', () => {
    it('应该正确标记事件为已确认', async () => {
      const eventType = 'analysis_completed';
      const eventId = 'job-123';

      // 初始状态：未确认
      expect(ackService.isEventAcknowledged(eventType, eventId)).toBe(false);

      // 确认事件
      await ackService.acknowledgeEvent(eventType, eventId);

      // 验证已确认
      expect(ackService.isEventAcknowledged(eventType, eventId)).toBe(true);
    });

    it('应该防止重复确认相同事件', async () => {
      const eventType = 'analysis_completed';
      const eventId = 'job-456';
      
      // 第一次确认
      await ackService.acknowledgeEvent(eventType, eventId);
      expect(ackService.isEventAcknowledged(eventType, eventId)).toBe(true);

      // 重复确认应该被跳过（通过内部逻辑）
      await ackService.acknowledgeEvent(eventType, eventId);
      expect(ackService.isEventAcknowledged(eventType, eventId)).toBe(true);

      // 统计信息应该只显示一个确认事件
      const stats = ackService.getAcknowledgmentStats();
      expect(stats.total).toBe(1);
      expect(stats.processed).toBe(1);
    });

    it('应该区分不同类型和ID的事件', async () => {
      // 确认不同类型的事件
      await ackService.acknowledgeEvent('analysis_completed', 'job-1');
      await ackService.acknowledgeEvent('analysis_progress', 'job-1');
      await ackService.acknowledgeEvent('analysis_completed', 'job-2');

      // 验证独立确认
      expect(ackService.isEventAcknowledged('analysis_completed', 'job-1')).toBe(true);
      expect(ackService.isEventAcknowledged('analysis_progress', 'job-1')).toBe(true);
      expect(ackService.isEventAcknowledged('analysis_completed', 'job-2')).toBe(true);
      
      // 验证未确认的组合
      expect(ackService.isEventAcknowledged('analysis_progress', 'job-2')).toBe(false);
      expect(ackService.isEventAcknowledged('analysis_completed', 'job-3')).toBe(false);
    });
  });

  describe('📊 批量确认和统计', () => {
    it('应该支持批量确认多个事件', async () => {
      const events = [
        { eventType: 'analysis_completed', eventId: 'job-1' },
        { eventType: 'analysis_completed', eventId: 'job-2' },
        { eventType: 'analysis_progress', eventId: 'job-3' }
      ];

      await ackService.acknowledgeEvents(events);

      // 验证所有事件都已确认
      events.forEach(e => {
        expect(ackService.isEventAcknowledged(e.eventType, e.eventId)).toBe(true);
      });

      const stats = ackService.getAcknowledgmentStats();
      expect(stats.total).toBe(3);
      expect(stats.processed).toBe(3);
      expect(stats.eventTypes).toContain('analysis_completed');
      expect(stats.eventTypes).toContain('analysis_progress');
    });

    it('批量确认应该跳过已确认的事件', async () => {
      // 预先确认一个事件
      await ackService.acknowledgeEvent('analysis_completed', 'job-1');

      const events = [
        { eventType: 'analysis_completed', eventId: 'job-1' }, // 已确认
        { eventType: 'analysis_completed', eventId: 'job-2' }  // 新事件
      ];

      await ackService.acknowledgeEvents(events);

      // 验证统计正确（不会重复计数）
      const stats = ackService.getAcknowledgmentStats();
      expect(stats.total).toBe(2);
      expect(stats.processed).toBe(2);
    });

    it('应该提供准确的统计信息', async () => {
      // 确认多种类型的事件
      await ackService.acknowledgeEvent('analysis_completed', 'job-1');
      await ackService.acknowledgeEvent('analysis_completed', 'job-2');
      await ackService.acknowledgeEvent('analysis_error', 'job-3');

      const stats = ackService.getAcknowledgmentStats();
      expect(stats.total).toBe(3);
      expect(stats.processed).toBe(3);
      expect(stats.eventTypes).toEqual(
        expect.arrayContaining(['analysis_completed', 'analysis_error'])
      );
      expect(stats.eventTypes.length).toBe(2);
    });
  });

  describe('🧹 内存管理和清理', () => {
    it('应该在超过最大缓存大小时清理旧记录', async () => {
      // 创建一个小缓存的服务实例来测试清理逻辑
      const smallCacheService = new (EventAcknowledgmentService as any)();
      smallCacheService.maxCacheSize = 3; // 通过修改私有属性来测试

      // 添加超过缓存限制的事件
      for (let i = 1; i <= 5; i++) {
        await smallCacheService.acknowledgeEvent('test_event', `job-${i}`);
      }

      const stats = smallCacheService.getAcknowledgmentStats();
      expect(stats.total).toBeLessThanOrEqual(3); // 应该清理到最大缓存大小
    });

    it('reset方法应该清空所有确认状态', async () => {
      // 添加一些确认事件
      await ackService.acknowledgeEvent('analysis_completed', 'job-1');
      await ackService.acknowledgeEvent('analysis_completed', 'job-2');

      expect(ackService.getAcknowledgmentStats().total).toBe(2);

      // 重置
      ackService.reset();

      // 验证清空
      expect(ackService.getAcknowledgmentStats().total).toBe(0);
      expect(ackService.isEventAcknowledged('analysis_completed', 'job-1')).toBe(false);
      expect(ackService.isEventAcknowledged('analysis_completed', 'job-2')).toBe(false);
    });
  });

  describe('🔄 幂等性验证', () => {
    it('多次确认同一事件应该保持幂等', async () => {
      const eventType = 'analysis_completed';
      const eventId = 'job-idempotent';

      // 多次确认同一事件
      await ackService.acknowledgeEvent(eventType, eventId);
      await ackService.acknowledgeEvent(eventType, eventId);
      await ackService.acknowledgeEvent(eventType, eventId);

      // 状态应该保持一致
      expect(ackService.isEventAcknowledged(eventType, eventId)).toBe(true);
      
      // 统计应该只计算一次
      const stats = ackService.getAcknowledgmentStats();
      expect(stats.total).toBe(1);
      expect(stats.processed).toBe(1);
    });

    it('并发确认同一事件应该安全处理', async () => {
      const eventType = 'analysis_completed';
      const eventId = 'job-concurrent';

      // 并发确认同一事件
      const promises = Array(5).fill(null).map(() => 
        ackService.acknowledgeEvent(eventType, eventId)
      );

      await Promise.all(promises);

      // 应该只被记录一次
      expect(ackService.isEventAcknowledged(eventType, eventId)).toBe(true);
      const stats = ackService.getAcknowledgmentStats();
      expect(stats.total).toBe(1);
      expect(stats.processed).toBe(1);
    });
  });

  describe('📝 日志和调试', () => {
    it('应该提供清晰的事件键生成', () => {
      // 测试私有方法的行为通过公共接口
      ackService.acknowledgeEvent('analysis_completed', 'job-123');
      ackService.acknowledgeEvent('analysis_completed', 'job-456');

      const statsAfterFirst = ackService.getAcknowledgmentStats();
      expect(statsAfterFirst.total).toBe(2);

      // 相同事件类型但不同ID应该被区分
      expect(ackService.isEventAcknowledged('analysis_completed', 'job-123')).toBe(true);
      expect(ackService.isEventAcknowledged('analysis_completed', 'job-456')).toBe(true);
      expect(ackService.isEventAcknowledged('analysis_completed', 'job-789')).toBe(false);
    });
  });
});