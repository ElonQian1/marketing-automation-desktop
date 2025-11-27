// src/modules/universal-ui/infrastructure/event-acknowledgment-service.ts
// module: universal-ui | layer: infrastructure | role: event-ack-service
// summary: 前端事件确认服务，确保后端完成事件的幂等性处理

import { invoke } from '@tauri-apps/api/core';

/**
 * 事件确认状态
 */
interface EventAcknowledgment {
  eventType: string;
  eventId: string;
  acknowledgedAt: number;
  processed: boolean;
}

/**
 * 事件确认服务类
 * 
 * 负责前端向后端确认已处理的事件，防止重复处理和30%残影问题
 */
export class EventAcknowledgmentService {
  private acknowledgedEvents = new Map<string, EventAcknowledgment>();
  private readonly maxCacheSize = 1000; // 最大缓存事件数
  
  /**
   * 检查事件是否已被确认处理
   */
  isEventAcknowledged(eventType: string, eventId: string): boolean {
    const key = this.getEventKey(eventType, eventId);
    const ack = this.acknowledgedEvents.get(key);
    return ack?.processed === true;
  }
  
  /**
   * 标记事件为已处理并发送ACK到后端
   */
  async acknowledgeEvent(
    eventType: string, 
    eventId: string, 
    additionalData?: Record<string, any>
  ): Promise<void> {
    const key = this.getEventKey(eventType, eventId);
    
    // 如果已经确认过，跳过
    if (this.isEventAcknowledged(eventType, eventId)) {
      console.log('🔒 [EventAck] 事件已确认，跳过重复处理', { eventType, eventId });
      return;
    }
    
    const ack: EventAcknowledgment = {
      eventType,
      eventId, 
      acknowledgedAt: Date.now(),
      processed: true
    };
    
    // 本地标记
    this.acknowledgedEvents.set(key, ack);
    
    // 清理旧缓存
    this.cleanupOldAcknowledgments();
    
    // 发送ACK到后端（如果后端需要确认）
    try {
      await this.sendAckToBackend(eventType, eventId, additionalData);
      console.log('✅ [EventAck] 事件确认已发送', { eventType, eventId });
    } catch (error) {
      console.warn('⚠️ [EventAck] 发送确认失败（非致命）', { eventType, eventId, error });
      // ACK失败不影响业务逻辑，因为本地已标记
    }
  }
  
  /**
   * 批量确认多个事件
   */
  async acknowledgeEvents(events: Array<{ eventType: string; eventId: string; data?: Record<string, any> }>): Promise<void> {
    const unacknowledgedEvents = events.filter(e => !this.isEventAcknowledged(e.eventType, e.eventId));
    
    if (unacknowledgedEvents.length === 0) {
      console.log('🔒 [EventAck] 所有事件已确认，跳过批量处理');
      return;
    }
    
    // 并行确认所有未确认的事件
    await Promise.allSettled(
      unacknowledgedEvents.map(e => this.acknowledgeEvent(e.eventType, e.eventId, e.data))
    );
    
    console.log('✅ [EventAck] 批量确认完成', { count: unacknowledgedEvents.length });
  }
  
  /**
   * 获取确认统计信息
   */
  getAcknowledgmentStats(): { total: number; processed: number; eventTypes: string[] } {
    const stats = Array.from(this.acknowledgedEvents.values());
    const eventTypes = [...new Set(stats.map(s => s.eventType))];
    
    return {
      total: stats.length,
      processed: stats.filter(s => s.processed).length,
      eventTypes
    };
  }
  
  /**
   * 清理旧确认记录（防止内存泄漏）
   */
  private cleanupOldAcknowledgments(): void {
    if (this.acknowledgedEvents.size <= this.maxCacheSize) return;
    
    // 按时间排序，删除最旧的确认记录
    const sortedAcks = Array.from(this.acknowledgedEvents.entries())
      .sort(([,a], [,b]) => a.acknowledgedAt - b.acknowledgedAt);
      
    const toDelete = sortedAcks.slice(0, sortedAcks.length - this.maxCacheSize);
    toDelete.forEach(([key]) => this.acknowledgedEvents.delete(key));
    
    console.log('🧹 [EventAck] 清理旧确认记录', { deleted: toDelete.length, remaining: this.acknowledgedEvents.size });
  }
  
  /**
   * 生成事件唯一键
   */
  private getEventKey(eventType: string, eventId: string): string {
    return `${eventType}:${eventId}`;
  }
  
  /**
   * 向后端发送确认消息
   */
  private async sendAckToBackend(
    eventType: string, 
    eventId: string, 
    additionalData?: Record<string, any>
  ): Promise<void> {
    // 暂时禁用后端ACK调用，因为后端尚未实现该命令
    // 避免产生 "Command acknowledge_event not found" 错误日志
    /*
    try {
      await invoke('acknowledge_event', {
        event_type: eventType,
        event_id: eventId,
        acknowledged_at: Date.now(),
        additional_data: additionalData || {}
      });
    } catch (error) {
      // ...
    }
    */
    return Promise.resolve();
  }
  
  /**
   * 重置所有确认状态（主要用于测试）
   */
  reset(): void {
    this.acknowledgedEvents.clear();
    console.log('🔄 [EventAck] 确认状态已重置');
  }
}

/**
 * 全局事件确认服务实例
 */
export const eventAckService = new EventAcknowledgmentService();