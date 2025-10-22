// src/infrastructure/config/ExecutionEngineConfig.ts
// module: infrastructure | layer: config | role: 执行引擎配置管理
// summary: 运行时特性开关和引擎选择配置

export type ExecutionEngine = 'v1' | 'v2' | 'shadow';

// 引擎配置接口
export interface EngineConfig {
  // 默认引擎
  defaultEngine: ExecutionEngine;
  
  // 特性开关
  featureFlags: {
    enableV2: boolean;
    enableShadow: boolean;
    shadowSampleRate: number; // 0-1，影子执行采样率
    forceV1Fallback: boolean; // 紧急回退开关
  };
  
  // 设备级覆盖
  deviceOverrides?: Record<string, ExecutionEngine>;
  
  // 动作类型覆盖
  actionOverrides?: Record<string, ExecutionEngine>;
  
  // 时间窗口控制（灰度放量）
  timeWindowOverrides?: {
    startTime?: string; // '09:00'
    endTime?: string;   // '17:00'  
    weekdaysOnly?: boolean;
    engineDuringWindow?: ExecutionEngine;
  };
}

// 默认配置 - 🎯 直接使用V2新版本，旧版V1已废弃
const DEFAULT_CONFIG: EngineConfig = {
  defaultEngine: (import.meta.env.VITE_EXECUTION_ENGINE as ExecutionEngine) || 'v2', // 🚀 默认V2
  featureFlags: {
    enableV2: import.meta.env.VITE_ENABLE_V2 === 'true' || true,
    enableShadow: import.meta.env.VITE_ENABLE_SHADOW === 'true' || false, // 🔒 关闭影子执行
    shadowSampleRate: Number(import.meta.env.VITE_SHADOW_SAMPLE_RATE) || 0.0, // 🔒 不使用影子执行
    forceV1Fallback: import.meta.env.VITE_FORCE_V1_FALLBACK === 'true' || false,
  },
  deviceOverrides: {},
  actionOverrides: {
    // 某些动作可能V2还不稳定，强制用V1
    // 'longPress': 'v1',
  },
};

/**
 * 执行引擎配置管理器
 */
class ExecutionEngineConfigManager {
  private config: EngineConfig;
  private listeners: Array<(config: EngineConfig) => void> = [];

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.loadFromLocalStorage();
    this.loadFromUrlParams();
  }

  /**
   * 获取当前配置
   */
  getConfig(): EngineConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<EngineConfig>) {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...updates };
    
    // 保存到localStorage
    this.saveToLocalStorage();
    
    // 通知监听器
    this.notifyListeners();
    
    console.log('[EngineConfig] 配置已更新:', {
      from: oldConfig.defaultEngine,
      to: this.config.defaultEngine,
      changes: updates,
    });
  }

  /**
   * 解析指定上下文应该使用的引擎
   */
  resolveEngine(context: {
    deviceId?: string;
    actionType?: string;
    stepId?: string;
  }): ExecutionEngine {
    const { deviceId, actionType } = context;

    // 1. 紧急回退开关
    if (this.config.featureFlags.forceV1Fallback) {
      console.log('[EngineConfig] 紧急回退到V1');
      return 'v1';
    }

    // 2. URL参数强制覆盖（测试用）
    const urlOverride = this.getUrlEngineOverride();
    if (urlOverride) {
      console.log('[EngineConfig] URL覆盖:', urlOverride);
      return urlOverride;
    }

    // 3. 时间窗口控制
    if (this.config.timeWindowOverrides) {
      const windowEngine = this.resolveTimeWindow();
      if (windowEngine) {
        console.log('[EngineConfig] 时间窗口:', windowEngine);
        return windowEngine;
      }
    }

    // 4. 设备级覆盖
    if (deviceId && this.config.deviceOverrides?.[deviceId]) {
      console.log('[EngineConfig] 设备覆盖:', deviceId, this.config.deviceOverrides[deviceId]);
      return this.config.deviceOverrides[deviceId];
    }

    // 5. 动作类型覆盖
    if (actionType && this.config.actionOverrides?.[actionType]) {
      console.log('[EngineConfig] 动作覆盖:', actionType, this.config.actionOverrides[actionType]);
      return this.config.actionOverrides[actionType];
    }

    // 6. 影子执行采样
    if (this.config.featureFlags.enableShadow && 
        this.config.defaultEngine !== 'shadow' &&
        Math.random() < this.config.featureFlags.shadowSampleRate) {
      console.log('[EngineConfig] 影子执行采样命中');
      return 'shadow';
    }

    // 7. 默认引擎
    return this.config.defaultEngine;
  }

  /**
   * 监听配置变化
   */
  onConfigChange(listener: (config: EngineConfig) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * 紧急回退到V1
   */
  emergencyFallbackToV1() {
    console.warn('🚨 [EngineConfig] 紧急回退到V1引擎');
    this.updateConfig({
      featureFlags: {
        ...this.config.featureFlags,
        forceV1Fallback: true,
      },
    });
  }

  /**
   * 重置为默认配置
   */
  resetToDefault() {
    this.config = { ...DEFAULT_CONFIG };
    this.saveToLocalStorage();
    this.notifyListeners();
    console.log('[EngineConfig] 已重置为默认配置');
  }

  // 私有方法

  private loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('execution_engine_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.config = { ...this.config, ...parsed };
      }
    } catch (error) {
      console.warn('[EngineConfig] 加载本地配置失败:', error);
    }
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem('execution_engine_config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('[EngineConfig] 保存本地配置失败:', error);
    }
  }

  private loadFromUrlParams() {
    const params = new URLSearchParams(window.location.search);
    
    // 支持 ?engine=v2 这样的URL参数
    const engineParam = params.get('engine') as ExecutionEngine;
    if (engineParam && ['v1', 'v2', 'shadow'].includes(engineParam)) {
      this.config.defaultEngine = engineParam;
      console.log('[EngineConfig] URL参数设置引擎:', engineParam);
    }

    // 支持 ?force_v1=true
    if (params.get('force_v1') === 'true') {
      this.config.featureFlags.forceV1Fallback = true;
      console.log('[EngineConfig] URL参数强制V1回退');
    }
  }

  private getUrlEngineOverride(): ExecutionEngine | null {
    const params = new URLSearchParams(window.location.search);
    const override = params.get('engine_override') as ExecutionEngine;
    return ['v1', 'v2', 'shadow'].includes(override) ? override : null;
  }

  private resolveTimeWindow(): ExecutionEngine | null {
    const tw = this.config.timeWindowOverrides;
    if (!tw || !tw.engineDuringWindow) return null;

    const now = new Date();
    
    // 工作日检查
    if (tw.weekdaysOnly) {
      const dayOfWeek = now.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) return null; // 周末不启用
    }

    // 时间范围检查
    if (tw.startTime && tw.endTime) {
      const currentTime = now.toTimeString().substring(0, 5); // HH:MM
      if (currentTime >= tw.startTime && currentTime <= tw.endTime) {
        return tw.engineDuringWindow;
      }
    }

    return null;
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.config);
      } catch (error) {
        console.error('[EngineConfig] 监听器执行错误:', error);
      }
    });
  }
}

// 单例实例
export const engineConfig = new ExecutionEngineConfigManager();

// 全局快捷方法
export function getCurrentExecutionEngine(context?: {
  deviceId?: string;
  actionType?: string;
  stepId?: string;
}): ExecutionEngine {
  return engineConfig.resolveEngine(context || {});
}

export function setExecutionEngine(engine: ExecutionEngine) {
  engineConfig.updateConfig({ defaultEngine: engine });
}

export function enableShadowExecution(sampleRate: number = 0.1) {
  engineConfig.updateConfig({
    featureFlags: {
      ...engineConfig.getConfig().featureFlags,
      enableShadow: true,
      shadowSampleRate: sampleRate,
    },
  });
}