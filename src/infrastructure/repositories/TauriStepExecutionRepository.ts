// src/infrastructure/repositories/TauriStepExecutionRepository.ts
// module: infrastructure | layer: repositories | role: 步骤执行接口
// summary: 统一步骤执行的前后端接口
//
// ⚠️  === V1 旧版 Repository - 已废弃 === 
// 问题：此Repository设计过时，存在类型不匹配和接口复杂性问题
// 替代方案：使用新的 StepExecutionGateway + V2适配器系统
// V2系统优势：统一接口、类型安全、支持多引擎切换
// 废弃时间：2025年10月22日起，不再维护此文件
// ⚠️  请直接使用: src/infrastructure/gateways/StepExecutionGateway.ts

import { invoke } from '@tauri-apps/api/core';
// import type { ActionKind, StepAction } from '../../types/smartScript';

export interface StepExecutionRequest {
  device_id: string;
  step: StepDefinition;
  mode: ExecutionMode;
}

export interface StepDefinition {
  id: string;
  name: string;
  selector: MatchCriteriaDTO;
  action: ActionTypeDto;
  strategy: string;
}

export interface ActionTypeDto {
  type: string;
  params?: Record<string, unknown>;
}

export interface MatchCriteriaDTO {
  text?: string;
  'content-desc'?: string;
  'resource-id'?: string;
  class?: string;
  bounds?: string;
  xpath?: string;
  index?: number;
  [key: string]: unknown;
}

export type ExecutionMode = 'match-only' | 'execute-step';

export interface StepExecutionResult {
  success: boolean;
  step_id: string;
  message: string;
  duration_ms: number;
  matched_element?: MatchedElementInfo;
  action_result?: ActionResultInfo;
  logs: string[];
  error_details?: string;
}

export interface MatchedElementInfo {
  bounds: ElementBounds;
  confidence: number;
  strategy_used: string;
}

export interface ElementBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface ActionResultInfo {
  success: boolean;
  message: string;
  duration: number;
  data?: unknown;
}

export class TauriStepExecutionRepository {
  async runStep(request: StepExecutionRequest): Promise<StepExecutionResult> {
    console.log('🚀 TauriStepExecutionRepository.runStep:', request);
    
    try {
      const result = await invoke<StepExecutionResult>('run_step', { request });
      console.log('✅ 步骤执行结果:', result);
      return result;
    } catch (error) {
      console.error('❌ 步骤执行失败:', error);
      throw new Error(`步骤执行失败: ${error}`);
    }
  }

  // 工具函数：从 Action 转换为后端 ActionTypeDto
  convertActionToDto(action: { kind: string; params?: Record<string, unknown> }): ActionTypeDto {
    const { kind, params = {} } = action;
    
    switch (kind) {
      case 'tap':
        return { type: 'Click' };
        
      case 'long_press':
        return { 
          type: 'LongPress',
          params: { duration: params.durationMs || 2000 }
        };
        
      case 'input':
        return {
          type: 'Input',
          params: {
            text: params.text || '',
            clear_before: params.clearBefore || false
          }
        };
        
      case 'swipe':
        const swipeInfo = params.swipe as { direction?: string; distancePx?: number; durationMs?: number } || {};
        const swipeDirection = swipeInfo.direction || 'up';
        const distance = swipeInfo.distancePx || 200;
        const duration = swipeInfo.durationMs || 300;
        
        return {
          type: `Swipe${swipeDirection.charAt(0).toUpperCase() + swipeDirection.slice(1)}`,
          params: { distance, duration }
        };
        
      case 'wait':
        return {
          type: 'Wait',
          params: { duration: params.waitMs || 1000 }
        };
        
      default:
        return { type: 'Click' }; // 默认为点击
    }
  }

  // 工具函数：从 SmartScriptStep 的 parameters 生成 MatchCriteriaDTO
  convertParametersToSelector(parameters: Record<string, unknown>): MatchCriteriaDTO {
    const selector: MatchCriteriaDTO = {};
    
    // 提取常用的匹配字段
    if (parameters.text) selector.text = String(parameters.text);
    if (parameters['content-desc']) selector['content-desc'] = String(parameters['content-desc']);
    if (parameters['resource-id']) selector['resource-id'] = String(parameters['resource-id']);
    if (parameters.class) selector.class = String(parameters.class);
    if (parameters.bounds) selector.bounds = String(parameters.bounds);
    if (parameters.xpath) selector.xpath = String(parameters.xpath);
    if (parameters.index !== undefined) selector.index = Number(parameters.index);
    
    // 检查是否有嵌套的 matching 对象
    const matching = parameters.matching as Record<string, unknown> | undefined;
    if (matching) {
      if (matching.text) selector.text = String(matching.text);
      if (matching['content-desc']) selector['content-desc'] = String(matching['content-desc']);
      if (matching['resource-id']) selector['resource-id'] = String(matching['resource-id']);
      if (matching.class) selector.class = String(matching.class);
      if (matching.bounds) selector.bounds = String(matching.bounds);
      if (matching.xpath) selector.xpath = String(matching.xpath);
      if (matching.index !== undefined) selector.index = Number(matching.index);
    }
    
    return selector;
  }

  // 工具函数：推断策略
  inferStrategy(parameters: Record<string, unknown>): string {
    const matching = parameters.matching as Record<string, unknown> | undefined;
    if (matching?.strategy) {
      return String(matching.strategy);
    }
    
    // 根据参数推断策略
    if (parameters.xpath || (matching && matching.xpath)) {
      return 'xpath-direct';
    }
    
    return 'intelligent'; // 默认智能策略
  }
}