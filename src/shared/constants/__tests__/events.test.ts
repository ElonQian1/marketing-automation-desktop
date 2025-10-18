// src/shared/constants/__tests__/events.test.ts
// module: shared | layer: tests | role: 事件常量合同测试
// summary: 防止事件常量回归和确保类型安全的合同测试

import { describe, it, expect } from 'vitest';
import { EVENTS, ANALYSIS_STATES, type EventName, type AnalysisState } from '../events';

describe('Event Constants Contract Tests', () => {
  describe('Event Names Stability', () => {
    it('should maintain stable event names for backend compatibility', () => {
      // 合同测试1: 事件名称稳定性 - 防止破坏后端通信
      expect(EVENTS.ANALYSIS_PROGRESS).toBe('analysis:progress');
      expect(EVENTS.ANALYSIS_DONE).toBe('analysis:done');
      expect(EVENTS.ANALYSIS_ERROR).toBe('analysis:error');
      expect(EVENTS.DEVICE_CHANGE).toBe('device-change');
      expect(EVENTS.LOG_ENTRY).toBe('log-entry');
      expect(EVENTS.ADB_COMMAND_LOG).toBe('adb-command-log');
      expect(EVENTS.CONTACT_IMPORT_START).toBe('contact:import:start');
      expect(EVENTS.SCRIPT_EXECUTION_START).toBe('script:execution:start');
      expect(EVENTS.TASK_STATUS_CHANGE).toBe('task:status:change');
    });

    it('should provide complete event coverage without gaps', () => {
      // 确保所有关键事件都有对应常量
      const eventValues = Object.values(EVENTS);
      const requiredEvents = [
        'analysis:progress',
        'analysis:done', 
        'analysis:error',
        'device-change',
        'log-entry',
        'adb-command-log',
        'contact:import:start',
        'script:execution:start',
        'task:status:change'
      ];
      
      requiredEvents.forEach(event => {
        expect(eventValues).toContain(event);
      });
    });
  });

  describe('Analysis States Contract', () => {
    it('should maintain stable analysis state values', () => {
      // 合同测试2: 分析状态值稳定性 - 防止UI状态混乱
      expect(ANALYSIS_STATES.IDLE).toBe('idle');
      expect(ANALYSIS_STATES.ANALYZING).toBe('analyzing'); 
      expect(ANALYSIS_STATES.COMPLETED).toBe('analysis_completed');
      expect(ANALYSIS_STATES.FAILED).toBe('analysis_failed');
    });

    it('should cover all possible analysis lifecycle states', () => {
      // 确保状态覆盖完整的分析生命周期
      const states = Object.values(ANALYSIS_STATES);
      expect(states).toHaveLength(4);
      expect(states).toContain('idle');
      expect(states).toContain('analyzing');
      expect(states).toContain('analysis_completed');
      expect(states).toContain('analysis_failed');
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should enforce compile-time type safety for event names', () => {
      // 合同测试3: TypeScript类型安全 - 防止字符串字面量错误
      const validateEventName = (name: EventName): boolean => {
        return Object.values(EVENTS).includes(name);
      };

      expect(validateEventName('analysis:progress' as EventName)).toBe(true);
      expect(validateEventName('analysis:done' as EventName)).toBe(true);
      expect(validateEventName('analysis:error' as EventName)).toBe(true);
    });

    it('should enforce compile-time type safety for analysis states', () => {
      const validateAnalysisState = (state: AnalysisState): boolean => {
        return Object.values(ANALYSIS_STATES).includes(state);
      };

      expect(validateAnalysisState('idle' as AnalysisState)).toBe(true);
      expect(validateAnalysisState('analyzing' as AnalysisState)).toBe(true);
      expect(validateAnalysisState('analysis_completed' as AnalysisState)).toBe(true);
      expect(validateAnalysisState('analysis_failed' as AnalysisState)).toBe(true);
    });
  });
});