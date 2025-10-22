// src/infrastructure/gateways/StepExecutionGateway.ts
// module: infrastructure | layer: gateways | role: 执行引擎网关
// summary: 统一V1/V2步骤执行切换，支持影子执行和特性开关

import type { StepActionParams } from '../../types/stepActions';
import { getCurrentExecutionEngine } from '../config/ExecutionEngineConfig';

// 执行引擎类型
export type ExecutionEngine = 'v1' | 'v2' | 'shadow';
export type ExecutionMode = 'match-only' | 'execute-step';

// 统一请求参数接口
export interface StepExecutionRequest {
  deviceId: string;
  mode: ExecutionMode;
  actionParams: StepActionParams;
  selectorId?: string; // 元素选择器ID
  bounds?: { x: number; y: number; width: number; height: number }; // 兜底坐标
  engineOverride?: ExecutionEngine; // 每步覆盖全局引擎设置
}

// 统一响应接口
export interface StepExecutionResponse {
  success: boolean;
  message: string;
  engine: ExecutionEngine; // 实际使用的引擎
  matched?: {
    id: string;
    score: number;
    confidence: number;
    bounds: { left: number; top: number; right: number; bottom: number };
    text?: string;
  };
  executedAction?: string;
  verifyPassed?: boolean;
  errorCode?: string;
  logs?: string[];
  // 影子执行结果对比
  shadowResult?: {
    v1Result?: StepExecutionResponse;
    v2Result?: StepExecutionResponse;
    comparison?: {
      matched: boolean;
      scoreDiff: number;
      confidenceDiff: number;
    };
  };
}

// 引擎选择器配置
interface EngineConfig {
  defaultEngine: ExecutionEngine;
  deviceOverrides?: Record<string, ExecutionEngine>; // 每设备覆盖
  actionOverrides?: Record<string, ExecutionEngine>; // 每动作类型覆盖
  featureFlags?: {
    enableV2: boolean;
    enableShadow: boolean;
    shadowSampleRate: number; // 0-1，影子执行采样率
  };
}

// 默认配置 - 🚀 使用V2引擎，解决"missing field strategy"问题
const DEFAULT_CONFIG: EngineConfig = {
  defaultEngine: (import.meta.env.VITE_EXECUTION_ENGINE as ExecutionEngine) || 'v2', // 🎯 默认V2
  featureFlags: {
    enableV2: true,
    enableShadow: false, // 🔒 关闭影子执行，直接使用V2
    shadowSampleRate: 0.0, // 🔒 不使用影子执行
  },
};

/**
 * 步骤执行网关
 * 
 * 职责：
 * 1. 统一V1/V2执行接口
 * 2. 支持运行时引擎切换
 * 3. 影子执行模式（V1执行 + V2验证）
 * 4. 特性开关和灰度控制
 */
export class StepExecutionGateway {
  private config: EngineConfig;

  constructor(config?: Partial<EngineConfig>) {
    // 🔄 集成统一配置管理 - 使用ExecutionEngineConfig的引擎设置
    const unifiedEngine = getCurrentExecutionEngine();
    const configWithUnified = {
      ...DEFAULT_CONFIG,
      defaultEngine: unifiedEngine, // 使用统一配置的引擎
      ...config
    };
    this.config = configWithUnified;
    
    console.log('[StepExecGateway] 初始化配置:', {
      defaultEngine: this.config.defaultEngine,
      unifiedEngine,
      enableV2: this.config.featureFlags?.enableV2,
      enableShadow: this.config.featureFlags?.enableShadow,
    });
  }

  /**
   * 统一执行入口
   */
  async executeStep(request: StepExecutionRequest): Promise<StepExecutionResponse> {
    const engine = this.resolveEngine(request);
    
    console.log(`[StepExecGateway] Using engine: ${engine}, mode: ${request.mode}`);

    try {
      switch (engine) {
        case 'v1':
          return await this.executeV1(request);
        case 'v2':
          return await this.executeV2(request);
        case 'shadow':
          return await this.executeShadow(request);
        default:
          throw new Error(`Unknown engine: ${engine}`);
      }
    } catch (error) {
      console.error(`[StepExecGateway] Execution failed:`, error);
      return {
        success: false,
        message: `执行失败: ${error instanceof Error ? error.message : String(error)}`,
        engine,
        errorCode: 'EXECUTION_ERROR',
      };
    }
  }

  /**
   * 解析实际使用的引擎
   */
  private resolveEngine(request: StepExecutionRequest): ExecutionEngine {
    // 1. 每步覆盖
    if (request.engineOverride) {
      return request.engineOverride;
    }

    // 2. 设备覆盖
    if (this.config.deviceOverrides?.[request.deviceId]) {
      return this.config.deviceOverrides[request.deviceId];
    }

    // 5. 动作类型覆盖
    if (this.config.actionOverrides?.[request.actionParams.type]) {
      return this.config.actionOverrides[request.actionParams.type];
    }

    // 4. 影子执行采样
    if (this.config.featureFlags?.enableShadow && 
        Math.random() < (this.config.featureFlags.shadowSampleRate || 0)) {
      return 'shadow';
    }

    // 5. 默认引擎
    return this.config.defaultEngine;
  }

  /**
   * V1执行（兼容现有系统）
   */
  private async executeV1(request: StepExecutionRequest): Promise<StepExecutionResponse> {
    console.log('[StepExecGateway] V1 execution - 暂时返回模拟结果');
    
    // TODO: 实现V1适配器调用
    await new Promise(resolve => setTimeout(resolve, 100)); // 模拟延时

    return {
      success: true,
      message: 'V1执行完成（模拟）',
      engine: 'v1',
      matched: {
        id: 'v1_mock_match',
        score: 0.8,
        confidence: 0.8,
        bounds: { left: 100, top: 100, right: 200, bottom: 150 },
        text: 'Mock V1 Element',
      },
      executedAction: request.mode === 'execute-step' ? request.actionParams.type : undefined,
    };
  }

  /**
   * V2执行（新动作系统）- 🚀 直接使用V2后端
   */
  private async executeV2(request: StepExecutionRequest): Promise<StepExecutionResponse> {
    console.log('[StepExecGateway] V2 execution - 使用真实V2后端');
    
    try {
      // 动态导入V2适配器函数
      const { convertToV2Request } = await import('./adapters/v2Adapter');
      const { invoke } = await import('@tauri-apps/api/core');
      
      // 转换为V2后端格式
      const v2StepRequest = convertToV2Request({
        deviceId: request.deviceId,
        mode: request.mode,
        actionParams: request.actionParams,
        selectorId: request.selectorId,
        bounds: request.bounds,
      });
      
      console.log('[StepExecGateway] V2请求:', v2StepRequest);
      
      // 🔧 修复参数格式 - Tauri后端期望 { request: {...} } 格式
      const tauriArgs = {
        request: v2StepRequest
      };
      
      console.log('[StepExecGateway] Tauri调用参数:', tauriArgs);
      
      // 调用V2后端命令，使用正确的参数格式
      const result = await invoke('run_step_v2', tauriArgs) as Record<string, unknown>;
      
      console.log('[StepExecGateway] V2后端结果:', result);
      
      // 转换为统一响应格式
      const success = Boolean(result.success);
      return {
        success,
        message: String(result.message || 'V2执行完成'),
        engine: 'v2',
        matched: this.parseV2MatchResult(result.match_result),
        executedAction: request.mode === 'execute-step' ? request.actionParams.type : undefined,
        verifyPassed: Boolean(result.verification_passed),
        logs: Array.isArray(result.logs) ? result.logs.map(String) : [`V2执行: ${success ? '成功' : '失败'}`],
        errorCode: success ? undefined : 'V2_EXECUTION_FAILED',
      };
    } catch (error) {
      console.error('[StepExecGateway] V2执行失败:', error);
      return {
        success: false,
        message: `V2执行失败: ${error instanceof Error ? error.message : String(error)}`,
        engine: 'v2',
        errorCode: 'V2_ADAPTER_ERROR',
        logs: [`V2适配器错误: ${error}`],
      };
    }
  }

  /**
   * 解析V2匹配结果
   */
  private parseV2MatchResult(matchResult: unknown): StepExecutionResponse['matched'] {
    if (!matchResult || typeof matchResult !== 'object') return undefined;
    
    const result = matchResult as Record<string, unknown>;
    const bounds = result.bounds as Record<string, unknown>;
    
    return {
      id: String(result.element_id || 'v2_match'),
      score: Number(result.confidence || 0.8),
      confidence: Number(result.confidence || 0.8),
      bounds: bounds ? {
        left: Number(bounds.x || 0),
        top: Number(bounds.y || 0), 
        right: Number(bounds.x || 0) + Number(bounds.width || 100),
        bottom: Number(bounds.y || 0) + Number(bounds.height || 50),
      } : { left: 0, top: 0, right: 100, bottom: 50 },
      text: String(result.text || ''),
    };
  }

  /**
   * 影子执行（V1真实执行 + V2并行验证）
   */
  private async executeShadow(request: StepExecutionRequest): Promise<StepExecutionResponse> {
    console.log(`[StepExecGateway] Shadow execution started`);

    // 真实执行：V1
    const realExecution = this.executeV1(request);

    // 影子验证：V2仅匹配模式
    const shadowRequest = { ...request, mode: 'match-only' as ExecutionMode };
    const shadowExecution = this.executeV2(shadowRequest);

    // 并行执行
    const [realResult, shadowResult] = await Promise.allSettled([realExecution, shadowExecution]);

    // 计算对比结果
    let comparison;
    if (realResult.status === 'fulfilled' && shadowResult.status === 'fulfilled') {
      const real = realResult.value;
      const shadow = shadowResult.value;
      
      comparison = {
        matched: !!(real.matched && shadow.matched),
        scoreDiff: (shadow.matched?.score || 0) - (real.matched?.score || 0),
        confidenceDiff: (shadow.matched?.confidence || 0) - (real.matched?.confidence || 0),
      };
    }

    // 记录影子执行结果（用于分析和改进）
    this.logShadowResult({
      request,
      realResult: realResult.status === 'fulfilled' ? realResult.value : null,
      shadowResult: shadowResult.status === 'fulfilled' ? shadowResult.value : null,
      comparison,
    });

    // 返回V1的真实结果
    if (realResult.status === 'fulfilled') {
      return {
        ...realResult.value,
        engine: 'shadow',
        shadowResult: {
          v1Result: realResult.value,
          v2Result: shadowResult.status === 'fulfilled' ? shadowResult.value : undefined,
          comparison,
        },
      };
    } else {
      throw realResult.reason;
    }
  }

  /**
   * 记录影子执行结果（用于后续分析）
   */
  private logShadowResult(data: {
    request: StepExecutionRequest;
    realResult: StepExecutionResponse | null;
    shadowResult: StepExecutionResponse | null;
    comparison?: {
      matched: boolean;
      scoreDiff: number;
      confidenceDiff: number;
    };
  }) {
    // 发送到本地存储或远程服务
    console.log('[ShadowExecution]', {
      timestamp: new Date().toISOString(),
      deviceId: data.request.deviceId,
      action: data.request.actionParams.type,
      realSuccess: data.realResult?.success,
      shadowSuccess: data.shadowResult?.success,
      comparison: data.comparison,
    });

    // TODO: 可以发送到分析服务
    // await analyticsService.logShadowExecution(data);
  }

  /**
   * 更新引擎配置
   */
  updateConfig(newConfig: Partial<EngineConfig>) {
    this.config = { ...this.config, ...newConfig };
    console.log('[StepExecGateway] Config updated:', this.config);
  }

  /**
   * 获取当前配置
   */
  getConfig(): EngineConfig {
    return { ...this.config };
  }
}

// 单例实例，全局共享
let gatewayInstance: StepExecutionGateway | null = null;

/**
 * 获取网关实例（单例模式）
 */
export function getStepExecutionGateway(): StepExecutionGateway {
  if (!gatewayInstance) {
    gatewayInstance = new StepExecutionGateway();
  }
  return gatewayInstance;
}

/**
 * 重置网关实例（主要用于测试）
 */
export function resetStepExecutionGateway(config?: Partial<EngineConfig>) {
  gatewayInstance = config ? new StepExecutionGateway(config) : new StepExecutionGateway();
  return gatewayInstance;
}