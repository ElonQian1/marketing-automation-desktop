// src/modules/loop-control/application/use-loop-drag-manager.ts
// module: loop-control | layer: application | role: hook
// summary: 循环拖拽管理器 - 处理拖拽后的自动角色切换和性能优化

import { useCallback, useMemo, useRef } from 'react';
import { debounce } from 'lodash';
import type { SmartScriptStep } from '../../../types/smartScript';
import { LoopPairingService } from '../domain/loop-pairing-service';
import { LoopRoleSwitchService } from '../domain/loop-role-switch-service';

interface UseLoopDragManagerProps {
  /** 所有步骤 */
  allSteps: SmartScriptStep[];
  /** 步骤更新回调 */
  onStepsChange: (steps: SmartScriptStep[]) => void;
  /** 调试模式 */
  debug?: boolean;
}

interface LoopDragManagerState {
  /** 检查并执行自动角色切换 */
  checkAndSwitchRoles: () => void;
  /** 获取循环配对信息（用于 UI 显示） */
  getLoopPairs: () => ReturnType<typeof LoopPairingService.findAllPairs>;
  /** 检查指定步骤是否需要切换角色 */
  needsRoleSwitch: (stepId: string) => boolean;
  /** 获取步骤的配对状态 */
  getPairStatus: (stepId: string) => {
    hasPair: boolean;
    isValid: boolean;
    needsSwap: boolean;
    loopId?: string;
    partnerStepId?: string;
  };
  /** 验证所有循环配对 */
  validateAllPairs: () => string[];
}

/**
 * 循环拖拽管理器
 * 
 * 功能：
 * 1. 🎯 拖拽后自动检测和切换角色
 * 2. 🚀 性能优化：防抖处理避免频繁更新
 * 3. 🔍 实时配对状态查询
 * 4. ✅ 循环配对验证
 */
export const useLoopDragManager = ({ 
  allSteps, 
  onStepsChange, 
  debug = false 
}: UseLoopDragManagerProps): LoopDragManagerState => {
  
  const lastProcessedStepsRef = useRef<string>('');

  // 🎯 核心功能：检查并执行自动角色切换
  const checkAndSwitchRoles = useCallback(() => {
    if (debug) {
      console.log('🔄 [LoopDragManager] checkAndSwitchRoles 被调用');
    }
    
    if (!allSteps || allSteps.length === 0) {
      if (debug) {
        console.log('🔄 [LoopDragManager] 没有步骤数据，跳过处理');
      }
      return;
    }

    // 生成步骤指纹避免重复处理
    const currentFingerprint = allSteps.map(s => `${s.id}:${s.step_type}`).join('|');
    if (currentFingerprint === lastProcessedStepsRef.current) {
      if (debug) {
        console.log('🔄 [LoopDragManager] 指纹未变化，跳过处理');
      }
      return; // 没有变化，跳过处理
    }

    if (debug) {
      console.log('🔄 [LoopDragManager] 执行角色切换检查:', {
        stepsCount: allSteps.length,
        fingerprint: currentFingerprint,
        lastFingerprint: lastProcessedStepsRef.current
      });
    }

    const result = LoopRoleSwitchService.autoSwitchRoles(allSteps);
    
    if (result.needsSwitch) {
      if (debug) {
        console.log('🔄 [LoopDragManager] 检测到需要角色切换:', result.switchedSteps);
      }
      
      onStepsChange(result.updatedSteps);
      lastProcessedStepsRef.current = result.updatedSteps.map(s => `${s.id}:${s.step_type}`).join('|');
    } else {
      lastProcessedStepsRef.current = currentFingerprint;
    }
  }, [allSteps, onStepsChange, debug]);

  // 🚀 防抖版本的角色切换检查（提升性能）
  const debouncedCheckAndSwitch = useMemo(
    () => debounce(checkAndSwitchRoles, 150), // 150ms 防抖，平衡响应性和性能
    [checkAndSwitchRoles]
  );

  // 🔍 获取所有循环配对信息
  const getLoopPairs = useCallback(() => {
    return LoopPairingService.findAllPairs(allSteps);
  }, [allSteps]);

  // 🔍 检查指定步骤是否需要切换角色
  const needsRoleSwitch = useCallback((stepId: string) => {
    const pair = LoopPairingService.findPairByStepId(allSteps, stepId);
    return pair ? pair.needsSwap : false;
  }, [allSteps]);

  // 🔍 获取步骤的配对状态
  const getPairStatus = useCallback((stepId: string) => {
    const step = allSteps.find(s => s.id === stepId);
    if (!step || !['loop_start', 'loop_end'].includes(step.step_type)) {
      return { hasPair: false, isValid: true, needsSwap: false };
    }

    const pair = LoopPairingService.findPairByStepId(allSteps, stepId);
    if (!pair) {
      return { 
        hasPair: false, 
        isValid: false, 
        needsSwap: false,
        loopId: step.parameters?.loop_id as string,
      };
    }

    const partnerStep = pair.startStep.id === stepId ? pair.endStep : pair.startStep;

    return {
      hasPair: true,
      isValid: pair.isValid,
      needsSwap: pair.needsSwap,
      loopId: pair.loopId,
      partnerStepId: partnerStep.id,
    };
  }, [allSteps]);

  // ✅ 验证所有循环配对
  const validateAllPairs = useCallback(() => {
    return LoopPairingService.validatePairs(allSteps);
  }, [allSteps]);

  return {
    checkAndSwitchRoles: debouncedCheckAndSwitch,
    getLoopPairs,
    needsRoleSwitch,
    getPairStatus,
    validateAllPairs,
  };
};

/**
 * 轻量级版本 - 仅用于状态查询，不涉及步骤更新
 */
export const useLoopPairStatus = (allSteps: SmartScriptStep[]) => {
  return useMemo(() => {
    const pairs = LoopPairingService.findAllPairs(allSteps);
    const errors = LoopPairingService.validatePairs(allSteps);
    
    return {
      pairs,
      errors,
      hasErrors: errors.length > 0,
      hasNestedLoops: LoopPairingService.hasNestedLoops(allSteps),
    };
  }, [allSteps]);
};