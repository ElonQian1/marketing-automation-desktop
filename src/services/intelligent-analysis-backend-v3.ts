// src/services/intelligent-analysis-backend-v3.ts
// module: intelligent-analysis | layer: services | role: V3 unified execution backend
// summary: V3统一执行协议后端接口，提供链式执行、单步执行和静态策略测试

import { invoke } from '@tauri-apps/api/core';
import type { ExecutionResult } from './matching-batch-engine';

// V3 特定结果类型
export interface SingleStepTestResult {
  success: boolean;
  elementId?: string;
  confidence?: number;
  strategy?: string;
  error?: string;
}

export interface StaticStrategyTestResult {
  success: boolean;
  elements: Array<{
    elementId: string;
    confidence: number;
    strategy: string;
  }>;
  totalFound: number;
  error?: string;
}

export interface V3ExecutionConfig {
  analysis_id: string;
  device_id: string;
  timeout_ms?: number;
  max_retries?: number;
  dryrun?: boolean;
  enable_fallback?: boolean;
}

export interface V3ChainSpec {
  chain_id: string;
  steps: V3StepSpec[];
  threshold?: number;
  mode?: 'sequential' | 'parallel' | 'conditional';
}

export interface V3StepSpec {
  step_id: string;
  action: V3ActionType;
  params: Record<string, unknown>;
  quality?: V3QualitySettings;
  constraints?: V3ConstraintSettings;
  validation?: V3ValidationSettings;
}

export type V3ActionType = 
  | 'tap' 
  | 'input' 
  | 'swipe' 
  | 'smart_navigation' 
  | 'wait_for_element' 
  | 'validate_ui';

export interface V3QualitySettings {
  confidence_threshold?: number;
  match_precision?: number;
  enable_smart_fallback?: boolean;
}

export interface V3ConstraintSettings {
  max_execution_time_ms?: number;
  screen_change_required?: boolean;
  ui_stability_check?: boolean;
}

export interface V3ValidationSettings {
  post_action_validation?: boolean;
  expected_ui_change?: boolean;
  validation_timeout_ms?: number;
}

export interface V3ExecutionStatus {
  analysis_id: string;
  phase: V3ExecutionPhase;
  progress: number;
  message?: string;
  element_info?: V3ElementInfo;
  confidence?: number;
}

export type V3ExecutionPhase = 
  | 'initializing'
  | 'device_ready' 
  | 'snapshot_ready'
  | 'match_started'
  | 'matched'
  | 'validated'
  | 'executed'
  | 'complete'
  | 'error';

export interface V3ElementInfo {
  bounds?: string;
  text?: string;
  resource_id?: string;
  class_name?: string;
  click_point?: [number, number];
}

/**
 * V3统一执行协议后端服务
 * 
 * 特性：
 * - 90%数据量减少 vs V2
 * - 智能短路逻辑
 * - 统一事件系统
 * - by-ref/by-inline执行模式
 * - 自动回退机制
 */
export class IntelligentAnalysisBackendV3 {
  
  /**
   * 执行单步操作测试（V3协议）
   * 统一的单步执行接口，支持所有V3操作类型
   */
  static async executeSingleStepV3(
    config: V3ExecutionConfig,
    stepSpec: V3StepSpec
  ): Promise<SingleStepTestResult> {
    try {
      const result = await invoke<SingleStepTestResult>('execute_single_step_test_v3', {
        analysisId: config.analysis_id,
        deviceId: config.device_id,
        stepId: stepSpec.step_id,
        action: stepSpec.action,
        params: stepSpec.params,
        quality: stepSpec.quality || {},
        constraints: stepSpec.constraints || {},
        validation: stepSpec.validation || {},
        timeoutMs: config.timeout_ms || 30000,
        maxRetries: config.max_retries || 3,
        dryrun: config.dryrun || false
      });
      
      console.log(`✅ V3单步执行成功 - Step: ${stepSpec.step_id}, Action: ${stepSpec.action}`);
      return result;
      
    } catch (error) {
      console.error('❌ V3单步执行失败:', error);
      throw new Error(`V3单步执行失败: ${error}`);
    }
  }

  /**
   * 执行链式操作测试（V3协议）
   * 支持智能短路和失败回退的链式执行
   */
  static async executeChainV3(
    config: V3ExecutionConfig,
    chainSpec: V3ChainSpec
  ): Promise<ExecutionResult> {
    try {
      // 🎯 使用正确的V3调用格式：envelope + spec
      const envelope = {
        deviceId: config.device_id,
        app: {
          package: 'com.xingin.xhs',
          activity: null
        },
        snapshot: {
          analysisId: config.analysis_id,
          screenHash: null,
          xmlCacheId: null
        },
        executionMode: 'relaxed'
      };

      const spec = {
        chainId: chainSpec.chain_id,
        orderedSteps: chainSpec.steps.map(step => ({
          ref: null,
          inline: {
            stepId: step.step_id,
            elementContext: step.params?.elementContext || step.params || {},
            action: step.action,
            selectionMode: 'match-original',
            batchConfig: null
          }
        })),
        threshold: chainSpec.threshold || 0.8,
        mode: config.dryrun ? 'dryrun' : 'execute',
        quality: {
          enableOfflineValidation: true,
          enableControlledFallback: config.enable_fallback !== false,
          enableRegionOptimization: true
        },
        constraints: {
          maxAnalysisTime: config.timeout_ms || 60000,
          maxExecutionTime: (config.timeout_ms || 60000) / 2,
          allowFallback: config.enable_fallback !== false
        },
        validation: {
          requireUniqueness: true,
          minConfidence: chainSpec.threshold || 0.8
        }
      };

      const result = await invoke<ExecutionResult>('execute_chain_test_v3', {
        envelope,
        spec
      });
      
      console.log(`✅ V3链式执行成功 - Chain: ${chainSpec.chain_id}, Steps: ${chainSpec.steps.length}`);
      return result;
      
    } catch (error) {
      console.error('❌ V3链式执行失败:', error);
      throw new Error(`V3链式执行失败: ${error}`);
    }
  }

  /**
   * 执行静态策略测试（V3协议）
   * 基于预定义策略的静态执行模式
   */
  static async executeStaticStrategyV3(
    config: V3ExecutionConfig,
    strategyId: string,
    targetText?: string,
    inputText?: string,
    clickPointPolicy?: 'center' | 'smart' | 'bounds'
  ): Promise<StaticStrategyTestResult> {
    try {
      const result = await invoke<StaticStrategyTestResult>('execute_static_strategy_test_v3', {
        analysisId: config.analysis_id,
        deviceId: config.device_id,
        scriptId: strategyId,
        targetText,
        inputText,
        clickPointPolicy,
        timeoutMs: config.timeout_ms || 30000,
        dryrun: config.dryrun || false
      });
      
      console.log(`✅ V3静态策略执行成功 - Strategy: ${strategyId}`);
      return result;
      
    } catch (error) {
      console.error('❌ V3静态策略执行失败:', error);
      throw new Error(`V3静态策略执行失败: ${error}`);
    }
  }

  /**
   * V3健康检查
   * 验证V3执行协议的可用性
   */
  static async healthCheckV3(deviceId: string): Promise<boolean> {
    try {
      const testConfig: V3ExecutionConfig = {
        analysis_id: `health_check_${Date.now()}`,
        device_id: deviceId,
        timeout_ms: 5000,
        dryrun: true
      };

      const testStep: V3StepSpec = {
        step_id: 'health_check',
        action: 'validate_ui',
        params: {},
        quality: { confidence_threshold: 0.1 }
      };

      await this.executeSingleStepV3(testConfig, testStep);
      console.log('✅ V3健康检查通过');
      return true;
      
    } catch (error) {
      console.warn('⚠️ V3健康检查失败，可能需要回退到V2:', error);
      return false;
    }
  }

  /**
   * 创建标准V3配置
   */
  static createStandardConfig(
    analysisId: string, 
    deviceId: string, 
    options?: Partial<V3ExecutionConfig>
  ): V3ExecutionConfig {
    return {
      analysis_id: analysisId,
      device_id: deviceId,
      timeout_ms: 30000,
      max_retries: 3,
      dryrun: false,
      enable_fallback: true,
      ...options
    };
  }

  /**
   * 创建标准步骤规格
   */
  static createStandardStep(
    stepId: string,
    action: V3ActionType,
    params: Record<string, unknown>,
    options?: {
      quality?: Partial<V3QualitySettings>;
      constraints?: Partial<V3ConstraintSettings>;
      validation?: Partial<V3ValidationSettings>;
    }
  ): V3StepSpec {
    return {
      step_id: stepId,
      action,
      params,
      quality: {
        confidence_threshold: 0.8,
        match_precision: 0.85,
        enable_smart_fallback: true,
        ...options?.quality
      },
      constraints: {
        max_execution_time_ms: 10000,
        screen_change_required: false,
        ui_stability_check: true,
        ...options?.constraints
      },
      validation: {
        post_action_validation: true,
        expected_ui_change: false,
        validation_timeout_ms: 3000,
        ...options?.validation
      }
    };
  }
}

export default IntelligentAnalysisBackendV3;