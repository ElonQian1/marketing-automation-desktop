// src/modules/loop-control/application/use-loop-auto-switch.ts
// module: loop-control | layer: application | role: hook
// summary: 循环自动切换 Hook - 拖拽后自动检测并切换角色

import { useEffect, useMemo, useCallback } from 'react';
import { message } from 'antd';
import { LoopPairingService } from '../domain/loop-pairing-service';
import { LoopRoleSwitchService } from '../domain/loop-role-switch-service';
import type { SmartScriptStep } from '../../../types/smartScript';

export interface UseLoopAutoSwitchOptions {
  /** 当前所有步骤 */
  steps: SmartScriptStep[];
  /** 是否启用自动切换（默认：true） */
  enabled?: boolean;
  /** 切换后的回调 */
  onStepsUpdated?: (updatedSteps: SmartScriptStep[]) => void;
  /** 是否在检测到问题时显示提示（默认：true） */
  showWarnings?: boolean;
}

/**
 * 循环自动切换 Hook
 * 
 * 功能：
 * 1. 自动检测循环配对的位置关系
 * 2. 当结束卡片在前、开始卡片在后时，自动切换角色
 * 3. 性能优化：只在步骤变化时重新计算
 * 
 * @example
 * ```tsx
 * const { 
 *   pairs, 
 *   hasInvalidPairs, 
 *   triggerAutoSwitch 
 * } = useLoopAutoSwitch({
 *   steps: allSteps,
 *   onStepsUpdated: (updated) => setSteps(updated),
 * });
 * 
 * // 拖拽结束后触发自动切换
 * const handleDragEnd = () => {
 *   triggerAutoSwitch();
 * };
 * ```
 */
export function useLoopAutoSwitch(options: UseLoopAutoSwitchOptions) {
  const {
    steps,
    enabled = true,
    onStepsUpdated,
    showWarnings = true,
  } = options;

  // 🎯 性能优化：使用 useMemo 缓存配对计算
  const pairs = useMemo(() => {
    if (!enabled || steps.length === 0) return [];
    return LoopPairingService.findAllPairs(steps);
  }, [steps, enabled]);

  // 🎯 性能优化：缓存验证结果
  const validationErrors = useMemo(() => {
    if (!enabled || steps.length === 0) return [];
    return LoopPairingService.validatePairs(steps);
  }, [steps, enabled]);

  // 是否存在无效的配对
  const hasInvalidPairs = useMemo(() => {
    return pairs.some(pair => pair.needsSwap);
  }, [pairs]);

  // 是否存在循环嵌套
  const hasNestedLoops = useMemo(() => {
    if (!enabled || steps.length === 0) return false;
    return LoopPairingService.hasNestedLoops(steps);
  }, [steps, enabled]);

  // 🎯 性能优化：使用 useCallback 稳定函数引用
  const triggerAutoSwitch = useCallback(() => {
    if (!enabled || !hasInvalidPairs) return;

    const result = LoopRoleSwitchService.autoSwitchRoles(steps);

    if (result.needsSwitch) {
      if (showWarnings) {
        const switchCount = result.switchedSteps.length / 2;
        message.info(`检测到 ${switchCount} 个循环配对位置错误，已自动修正 🔄`);
      }

      // 通知父组件更新步骤
      onStepsUpdated?.(result.updatedSteps);

      return result.updatedSteps;
    }

    return steps;
  }, [enabled, hasInvalidPairs, steps, showWarnings, onStepsUpdated]);

  // 手动切换指定循环的角色
  const switchLoopRoles = useCallback((loopId: string) => {
    if (!enabled) return;

    const updatedSteps = LoopRoleSwitchService.switchPairRoles(steps, loopId);
    onStepsUpdated?.(updatedSteps);

    if (showWarnings) {
      message.success('已切换循环角色 🔄');
    }
  }, [enabled, steps, onStepsUpdated, showWarnings]);

  // 🎯 性能优化：只在检测到问题时显示警告（避免频繁提示）
  useEffect(() => {
    if (!enabled || !showWarnings) return;

    if (validationErrors.length > 0) {
      // 延迟显示警告，避免拖拽时频繁弹出
      const timer = setTimeout(() => {
        validationErrors.forEach(error => {
          console.warn('[循环配对警告]', error);
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [validationErrors, enabled, showWarnings]);

  return {
    /** 所有循环配对 */
    pairs,
    /** 是否存在无效的配对（需要切换） */
    hasInvalidPairs,
    /** 是否存在循环嵌套 */
    hasNestedLoops,
    /** 验证错误列表 */
    validationErrors,
    /** 触发自动切换 */
    triggerAutoSwitch,
    /** 手动切换指定循环的角色 */
    switchLoopRoles,
  };
}
