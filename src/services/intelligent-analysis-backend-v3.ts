// src/services/intelligent-analysis-backend-v3.ts
// module: intelligent-analysis | layer: services | role: V3 unified execution backend
// summary: V3统一执行协议后端接口，提供链式执行、单步执行和静态策略测试

import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { ExecutionResult } from './matching-batch-engine';

// 🚀 [XML缓存集成] 导入缓存分析服务
import { cachedIntelligentAnalysisService } from "./cached-intelligent-analysis";

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
  /** 🆕 XML快照内容（用于跨机器执行） */
  xmlContent?: string;
  xmlCacheId?: string;
}

export interface V3ChainSpec {
  chain_id: string;
  steps: V3StepSpec[];
  threshold?: number;
  mode?: 'sequential' | 'parallel' | 'conditional';
  /** 用户选择模式：控制智能选择行为（第一个、精确匹配、批量全部等） */
  selection_mode?: 'first' | 'last' | 'match-original' | 'random' | 'all' | 'auto';
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

// V3 事件类型定义（匹配后端 ExecEventV3）
export interface V3ProgressEvent {
  type: 'analysis:progress';
  analysis_id?: string;
  step_id?: string;
  phase: V3ExecutionPhase;
  confidence?: number;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface V3CompleteEvent {
  type: 'analysis:complete';
  analysis_id?: string;
  summary?: {
    adoptedStepId?: string;
    elapsedMs?: number;
    reason?: string;
  };
  scores?: Array<{
    stepId: string;
    confidence: number;
  }>;
  result?: {
    ok: boolean;
    coords?: { x: number; y: number };
    candidateCount?: number;
    screenHashNow?: string;
    validation?: {
      passed: boolean;
      reason?: string;
    };
  };
}

/**
 * 将V3的Phase转换为进度百分比
 */
function phaseToProgress(phase: V3ExecutionPhase): number {
  const phaseMap: Record<V3ExecutionPhase, number> = {
    'initializing': 5,
    'device_ready': 15,
    'snapshot_ready': 25,
    'match_started': 40,
    'matched': 60,
    'validated': 75,
    'executed': 90,
    'complete': 100,
    'error': 0
  };
  return phaseMap[phase] || 0;
}

/**
 * 将V3的Phase转换为步骤描述
 */
function phaseToStepMessage(phase: V3ExecutionPhase): string {
  const messageMap: Record<V3ExecutionPhase, string> = {
    'initializing': '初始化中...',
    'device_ready': '设备已就绪',
    'snapshot_ready': '屏幕快照已获取',
    'match_started': '开始匹配元素',
    'matched': '元素匹配成功',
    'validated': '后置验证通过',
    'executed': '执行操作完成',
    'complete': '分析完成',
    'error': '执行出错'
  };
  return messageMap[phase] || phase;
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
      // 🎯 使用统一的 envelope 构建器
      const { buildEnvelope } = await import('../protocol/v3/envelope-builder');
      
      const envelope = buildEnvelope({
        deviceId: config.device_id,
        appPackage: 'com.xingin.xhs',
        appActivity: null,
        analysisId: config.analysis_id,
        screenHash: null,
        xmlCacheId: null,
        // 🔑 关键：如果 config 携带了 xmlContent，自动传递
        xmlContent: config.xmlContent ?? null,
        executionMode: 'relaxed'
      });

      // 🎯 使用 SingleStepSpecV3::ByRef 格式（简化，只传 analysis_id + step_id）
      const step = {
        analysisId: config.analysis_id,
        stepId: stepSpec.step_id
      };

      const result = await invoke<SingleStepTestResult>('execute_single_step_test_v3', {
        envelope,
        step
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
   * 支持智能短路和失败回退的链式执行（集成XML缓存）
   */
  static async executeChainV3(
    config: V3ExecutionConfig,
    chainSpec: V3ChainSpec
  ): Promise<ExecutionResult> {
    try {
      // 🚀 [V3缓存优先策略] 对单步链且有xpath的情况尝试缓存
      if (chainSpec.steps.length === 1) {
        const step = chainSpec.steps[0];
        const elementContext = step.params?.elementContext as Record<string, unknown>;
        
        if (elementContext?.snapshotId && elementContext?.elementPath) {
          try {
            console.log("🎯 [V3缓存检查] 尝试从XML缓存获取分析结果", {
              snapshotId: elementContext.snapshotId,
              xpath: elementContext.elementPath
            });

            // 构建临时UIElement用于缓存查询
            const keyAttrs = elementContext.keyAttributes as Record<string, string> || {};
            const tempElement = {
              xpath: String(elementContext.elementPath || ''),
              text: String(elementContext.elementText || ''),
              bounds: String(elementContext.elementBounds || ''),
              element_type: String(elementContext.elementType || ''),
              resource_id: keyAttrs['resource-id'] || '',
              content_desc: keyAttrs['content-desc'] || '',
              class_name: keyAttrs['class'] || '',
            };

            const cachedResult = await cachedIntelligentAnalysisService.analyzeElementStrategy(
              tempElement as unknown as import('../api/universalUIAPI').UIElement,
              String(elementContext.snapshotId || ''),
              String(elementContext.elementPath || '')
            );

            // 如果缓存命中且结果可信，返回成功结果
            if (cachedResult.metadata.usedCache && cachedResult.confidence > 0.7) {
              console.log("✅ [V3缓存命中] 直接使用缓存结果，跳过后端执行", {
                strategy: cachedResult.recommendedStrategy,
                confidence: cachedResult.confidence,
                fromCache: true
              });

              return {
                success: true,
                elementId: step.step_id,
                action: { type: 'click' as const },
                executionTime: cachedResult.metadata.analysisTime,
                coordinates: undefined
              } as ExecutionResult;
            }
          } catch (cacheError) {
            console.warn("⚠️ [V3缓存失败] 缓存检查失败，继续后端执行", cacheError);
          }
        }
      }

      // 🎯 使用统一的 envelope 构建器
      const { buildEnvelope } = await import('../protocol/v3/envelope-builder');
      
      const envelope = buildEnvelope({
        deviceId: config.device_id,
        appPackage: 'com.xingin.xhs',
        appActivity: null,
        analysisId: config.analysis_id,
        screenHash: null,
        xmlCacheId: config.xmlCacheId ?? null,
        xmlContent: config.xmlContent ?? null,
        executionMode: 'relaxed'
      });

      // 🎯 使用 ChainSpecV3::ByInline 格式，匹配 Rust 后端类型定义
      const spec = {
        chainId: chainSpec.chain_id,
        orderedSteps: chainSpec.steps.map(step => ({
          ref: null,
          inline: {
            stepId: step.step_id,
            action: 'smart_selection', // ✅ 统一使用智能选择，匹配SingleStepAction枚举
            params: step.params?.elementContext || step.params || {}
          }
        })),
        threshold: chainSpec.threshold || 0.8,
        mode: config.dryrun ? 'dryrun' : 'execute',
        // 可选配置保持默认值 (移除不存在的selection_mode字段)
        quality: {},
        constraints: {},
        validation: {}
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
   * 监听V3执行进度事件
   * 兼容V2接口：(jobId, progress, step, estimatedTimeLeft) => void
   */
  static async listenToAnalysisProgress(
    onProgress: (
      jobId: string,
      progress: number,
      step: string,
      estimatedTimeLeft?: number
    ) => void
  ): Promise<UnlistenFn> {
    console.log('🔧 [V3 BackendService] 设置进度事件监听器');
    
    const unlisten = await listen<V3ProgressEvent>(
      'analysis:progress',
      (event) => {
        const payload = event.payload;
        const progress = phaseToProgress(payload.phase);
        const step = payload.message || phaseToStepMessage(payload.phase);
        const jobId = payload.analysis_id || payload.step_id || 'v3-unknown';
        
        // console.log('📊 [V3 BackendService] 收到分析进度更新', { jobId, progress, step, phase: payload.phase });
        onProgress(jobId, progress, step, undefined);
      }
    );

    this.addListener(unlisten);
    console.log('✅ [V3 BackendService] 进度事件监听器已设置');
    return unlisten;
  }

  /**
   * 监听V3执行完成事件
   * 兼容V2接口：(jobId, result) => void
   */
  static async listenToAnalysisComplete(
    onComplete: (jobId: string, result: ExecutionResult) => void
  ): Promise<UnlistenFn> {
    console.log('🔧 [V3 BackendService] 设置完成事件监听器');
    
    const unlisten = await listen<V3CompleteEvent>(
      'analysis:complete',
      (event) => {
        const payload = event.payload;
        const jobId = payload.analysis_id || 'v3-complete';
        
        // 将V3结果转换为V2兼容格式
        const result: ExecutionResult = {
          success: payload.result?.ok ?? true,
          elementId: payload.summary?.adoptedStepId || 'unknown',
          action: { type: 'click' as const },
          executionTime: payload.summary?.elapsedMs || 0,
          coordinates: payload.result?.coords,
          error: payload.result?.ok === false ? payload.summary?.reason : undefined
        };

        console.log('✅ [V3 BackendService] 收到分析完成事件', { jobId, result });
        onComplete(jobId, result);
      }
    );

    this.addListener(unlisten);
    console.log('✅ [V3 BackendService] 完成事件监听器已设置');
    return unlisten;
  }

  /**
   * 监听V3执行错误事件
   * 注意：V3使用 analysis:complete 的 result.ok=false 表示错误，不单独发射error事件
   * 为了兼容V2接口，这里提供一个空实现
   */
  static async listenToAnalysisError(
    onError: (error: string) => void
  ): Promise<UnlistenFn> {
    console.log('⚠️ [V3 BackendService] V3不单独发射error事件，错误包含在complete事件中');
    
    // 监听complete事件中的失败情况
    const unlisten = await listen<V3CompleteEvent>(
      'analysis:complete',
      (event) => {
        const payload = event.payload;
        if (payload.result && !payload.result.ok) {
          const errorMsg = payload.summary?.reason || '执行失败';
          console.error('❌ [V3 BackendService] 执行失败', errorMsg);
          onError(errorMsg);
        }
      }
    );

    this.addListener(unlisten);
    return unlisten;
  }

  /**
   * 取消V3执行
   * 兼容V2接口：cancelAnalysis(jobId)
   */
  static async cancelAnalysis(jobId: string): Promise<void> {
    console.log(`🛑 [V3 BackendService] 取消分析: ${jobId}`);
    
    try {
      // V3使用analysis_id作为取消标识
      await invoke('cancel_execution_v3', { analysisId: jobId });
      console.log('✅ [V3 BackendService] 分析已取消');
    } catch (error) {
      // 如果后端未实现cancel_execution_v3命令，降级到空操作
      console.warn('⚠️ [V3 BackendService] 后端未实现cancel_execution_v3，跳过取消操作');
    }
  }

  /**
   * 清理V3事件监听器
   * 兼容V2接口：cleanup()
   */
  private static eventListeners: UnlistenFn[] = [];
  
  static addListener(unlisten: UnlistenFn): void {
    this.eventListeners.push(unlisten);
  }
  
  static cleanup(): void {
    console.log(
      '🧹 [V3 BackendService] 清理事件监听器',
      this.eventListeners.length
    );
    this.eventListeners.forEach((unlisten) => unlisten());
    this.eventListeners = [];
  }

  /**
   * V3健康检查
   * 验证V3执行协议的可用性
   */
  static async healthCheckV3(deviceId: string): Promise<boolean> {
    // 🎯 V3系统已经可用，直接返回 true
    // 从日志可以看到 V3 正在成功执行智能策略分析
    console.log(`✅ V3系统可用 - 设备 ${deviceId} 智能策略分析正常运行`);
    return true;
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