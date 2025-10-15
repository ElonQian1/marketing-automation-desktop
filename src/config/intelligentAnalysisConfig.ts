// src/config/intelligentAnalysisConfig.ts
// module: config | layer: config | role: configuration
// summary: 智能分析功能配置

/**
 * 智能分析功能配置
 */
export interface IntelligentAnalysisConfig {
  /** 是否使用真实 Rust 后端 (默认根据环境判断) */
  useRealBackend: boolean;
  
  /** 调试模式 */
  debug: boolean;
  
  /** 自动回填配置 */
  autoFill: {
    /** 是否启用自动回填 */
    enabled: boolean;
    /** 是否需要用户确认 */
    requireConfirmation: boolean;
    /** 自动升级阈值 (置信度 >= 此值时自动升级) */
    autoUpgradeThreshold: number;
  };
  
  /** 性能配置 */
  performance: {
    /** 分析超时时间 (毫秒) */
    analysisTimeout: number;
    /** 最大重试次数 */
    maxRetries: number;
  };
  
  /** UI 配置 */
  ui: {
    /** 是否显示详细进度 */
    showDetailedProgress: boolean;
    /** 是否显示置信度 */
    showConfidence: boolean;
    /** 是否显示调试信息 */
    showDebugInfo: boolean;
  };
}

/**
 * 安全获取环境变量的函数
 */
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // Node.js 环境
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  // Vite 浏览器环境
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env as Record<string, string>)[key] || defaultValue;
  }
  return defaultValue;
};

/**
 * 检查是否为开发环境
 */
const isDevelopment = (): boolean => {
  const nodeEnv = getEnvVar('NODE_ENV', 'development');
  const viteMode = getEnvVar('MODE', 'development');
  return nodeEnv === 'development' || viteMode === 'development';
};

/**
 * 检查是否为生产环境
 */
const isProduction = (): boolean => {
  const nodeEnv = getEnvVar('NODE_ENV', 'development');
  const viteMode = getEnvVar('MODE', 'development');
  return nodeEnv === 'production' || viteMode === 'production';
};

/**
 * 默认配置
 */
export const defaultIntelligentAnalysisConfig: IntelligentAnalysisConfig = {
  // 💡 临时强制启用真实后端进行测试
  useRealBackend: true,
  // 原逻辑：根据环境自动选择后端
  // useRealBackend: isProduction() || 
  //                 getEnvVar('REACT_APP_USE_REAL_BACKEND') === 'true' ||
  //                 getEnvVar('VITE_USE_REAL_BACKEND') === 'true',
  
  // 开发环境启用调试
  debug: isDevelopment(),
  
  // 自动回填配置
  autoFill: {
    enabled: true,
    requireConfirmation: true,
    autoUpgradeThreshold: 0.82, // 82% 置信度以上自动升级
  },
  
  // 性能配置
  performance: {
    analysisTimeout: 10000, // 10 秒超时
    maxRetries: 3,
  },
  
  // UI 配置
  ui: {
    showDetailedProgress: true,
    showConfidence: true,
    showDebugInfo: process.env.NODE_ENV === 'development',
  },
};

/**
 * 获取智能分析配置
 * 
 * 支持运行时动态配置和环境变量覆盖
 */
export const getIntelligentAnalysisConfig = (
  overrides?: Partial<IntelligentAnalysisConfig>
): IntelligentAnalysisConfig => {
  return {
    ...defaultIntelligentAnalysisConfig,
    ...overrides,
    autoFill: {
      ...defaultIntelligentAnalysisConfig.autoFill,
      ...overrides?.autoFill,
    },
    performance: {
      ...defaultIntelligentAnalysisConfig.performance,
      ...overrides?.performance,
    },
    ui: {
      ...defaultIntelligentAnalysisConfig.ui,
      ...overrides?.ui,
    },
  };
};

/**
 * 配置预设
 */
export const intelligentAnalysisPresets = {
  /** 开发环境预设 */
  development: {
    useRealBackend: false,
    debug: true,
    ui: {
      showDetailedProgress: true,
      showConfidence: true,
      showDebugInfo: true,
    },
  },
  
  /** 生产环境预设 */
  production: {
    useRealBackend: true,
    debug: false,
    ui: {
      showDetailedProgress: true,
      showConfidence: true,
      showDebugInfo: false,
    },
  },
  
  /** 测试环境预设 */
  testing: {
    useRealBackend: true,
    debug: true,
    performance: {
      analysisTimeout: 5000, // 更短的超时时间
      maxRetries: 1,
    },
  },
} as const;

/**
 * 根据环境获取预设配置
 */
export const getPresetConfig = (preset: keyof typeof intelligentAnalysisPresets) => {
  return getIntelligentAnalysisConfig(intelligentAnalysisPresets[preset]);
};

/**
 * 检查是否支持真实后端
 */
export const isRealBackendSupported = (): boolean => {
  // 检查是否在 Tauri 环境中
  return typeof window !== 'undefined' && 
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         (window as any).__TAURI__ !== undefined;
};

/**
 * 自动检测最佳配置
 */
export const detectOptimalConfig = (): IntelligentAnalysisConfig => {
  const isInTauri = isRealBackendSupported();
  const isDev = isDevelopment();
  
  if (!isInTauri) {
    // 浏览器环境，强制使用模拟版本
    return getIntelligentAnalysisConfig({
      useRealBackend: false,
      debug: isDev,
    });
  }
  
  if (isDev) {
    // Tauri 开发环境，默认使用真实后端但允许切换
    return getPresetConfig('development');
  } else {
    // Tauri 生产环境，使用真实后端
    return getPresetConfig('production');
  }
};