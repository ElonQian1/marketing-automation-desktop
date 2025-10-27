// src/components/LoopCards/useLoopSync.ts
// module: ui | layer: ui | role: hook
// summary: 循环卡片组同步管理Hook - 统一循环开始和结束卡片的数据管理

/**
 * 循环卡片组数据同步管理器
 * 解决循环开始和结束卡片数据不同步问题
 * 
 * 核心功能：
 * 1. 统一数据源：所有循环配置都从 step.parameters 读取
 * 2. 同步更新：修改配置时同时更新关联的开始/结束步骤
 * 3. 自动查找：根据 loop_id 自动查找关联的循环步骤
 */

import { useCallback, useMemo } from 'react';
import type { ExtendedSmartScriptStep, LoopConfig } from '../../types/loopScript';

interface LoopSyncConfig {
  /** 当前步骤（开始或结束） */
  currentStep: ExtendedSmartScriptStep;
  /** 所有步骤列表（用于查找关联步骤） */
  allSteps?: ExtendedSmartScriptStep[];
  /** 步骤参数更新回调 */
  onUpdateStepParameters?: (stepId: string, parameters: Record<string, unknown>) => void;
}

export const useLoopSync = (config: LoopSyncConfig) => {
  const { currentStep, allSteps = [], onUpdateStepParameters } = config;

  /**
   * 查找关联的循环步骤
   * 开始步骤 → 找结束步骤，结束步骤 → 找开始步骤
   */
  const associatedStep = useMemo(() => {
    if (!allSteps.length) return null;

    const currentLoopId = currentStep.parameters?.loop_id as string;
    if (!currentLoopId) return null;

    const targetType = currentStep.step_type === 'loop_start' ? 'loop_end' : 'loop_start';
    
    return allSteps.find(step => 
      step.step_type === targetType && 
      step.parameters?.loop_id === currentLoopId
    ) || null;
  }, [currentStep, allSteps]);

  /**
   * 获取当前循环配置
   * 统一从 step.parameters 读取，保证数据一致性
   */
  const getLoopConfig = useCallback((): LoopConfig => {
    const params = currentStep.parameters || {};
    
    return {
      loopId: (params.loop_id as string) || `loop_${currentStep.id}`,
      name: (params.loop_name as string) || currentStep.name || '未命名循环',
      iterations: (params.loop_count as number) || 1,
      enabled: currentStep.enabled,
      description: (params.loop_description as string) || '',
    };
  }, [currentStep]);

  /**
   * 同步更新循环配置
   * 同时更新当前步骤和关联步骤的参数
   */
  const updateLoopConfig = useCallback((updates: Partial<LoopConfig>) => {
    if (!onUpdateStepParameters) return;

    const currentConfig = getLoopConfig();
    const newConfig = { ...currentConfig, ...updates };

    // 构建统一的参数对象
    const loopParameters = {
      loop_id: newConfig.loopId,
      loop_name: newConfig.name,
      loop_count: newConfig.iterations,
      loop_description: newConfig.description || '',
      loop_config: newConfig, // 保留完整配置对象
    };

    // 更新当前步骤
    onUpdateStepParameters(currentStep.id, {
      ...currentStep.parameters,
      ...loopParameters,
    });

    // 同步更新关联步骤（如果存在）
    if (associatedStep) {
      onUpdateStepParameters(associatedStep.id, {
        ...associatedStep.parameters,
        ...loopParameters,
      });
    }
  }, [currentStep, associatedStep, onUpdateStepParameters, getLoopConfig]);

  /**
   * 获取循环次数显示文本
   */
  const getIterationsText = useCallback(() => {
    const config = getLoopConfig();
    return `${config.iterations}次`;
  }, [getLoopConfig]);

  /**
   * 检查是否有关联步骤
   */
  const hasAssociatedStep = useCallback(() => {
    return associatedStep !== null;
  }, [associatedStep]);

  return {
    /** 获取当前循环配置 */
    getLoopConfig,
    /** 更新循环配置（同步更新当前和关联步骤） */
    updateLoopConfig,
    /** 获取循环次数显示文本 */
    getIterationsText,
    /** 关联的循环步骤 */
    associatedStep,
    /** 检查是否有关联步骤 */
    hasAssociatedStep,
  };
};

export default useLoopSync;