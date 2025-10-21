// src/config/feature-flags.ts
// module: config | layer: infrastructure | role: feature-toggles
// summary: V2→V3 迁移的特性开关配置，支持灰度切换和安全回退

/**
 * 🔄 V2→V3 迁移特性开关
 * 
 * 用途：安全地从 V2 执行系统迁移到 V3 系统
 * 策略：并行共存 → 灰度测试 → 逐步切换 → 完全迁移
 * 
 * 迁移阶段：
 * Phase 1 (当前): V2 稳定运行，V3 后端就绪
 * Phase 2 (下周): 创建 V3 前端服务层
 * Phase 3 (2周后): 添加 V3 UI 入口，开发者可选择
 * Phase 4 (1个月后): 灰度测试，部分用户自动使用 V3
 * Phase 5 (2个月后): 全面切换到 V3，标记 V2 为 deprecated
 */

export interface FeatureFlags {
  // ========== V3 执行系统开关 ==========
  
  /** 是否启用 V3 执行系统（主开关） */
  USE_V3_EXECUTION: boolean;
  
  /** 是否启用 V3 智能单步执行 */
  USE_V3_SINGLE_STEP: boolean;
  
  /** 是否启用 V3 智能自动链 */
  USE_V3_CHAIN: boolean;
  
  /** 是否启用 V3 静态策略执行 */
  USE_V3_STATIC: boolean;
  
  // ========== UI 显示开关 ==========
  
  /** 开发模式：同时显示 V2 和 V3 按钮 */
  SHOW_V3_BUTTONS: boolean;
  
  /** 是否显示 V2 按钮（用于逐步隐藏） */
  SHOW_V2_BUTTONS: boolean;
  
  /** 是否显示版本对比信息 */
  SHOW_VERSION_COMPARISON: boolean;
  
  // ========== 测试和监控 ==========
  
  /** A/B 测试：V3 用户比例 (0.0-1.0) */
  V3_USER_RATIO: number;
  
  /** 自动回退阈值：V3 成功率低于此值自动切回 V2 */
  V3_AUTO_ROLLBACK_THRESHOLD: number;
  
  /** 是否启用执行对比日志 */
  ENABLE_EXECUTION_COMPARISON: boolean;
}

/**
 * 默认特性开关配置
 * 
 * 当前阶段：Phase 1 - V2 稳定运行，V3 准备就绪
 */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  // V3 执行系统（默认关闭，确保稳定性）
  USE_V3_EXECUTION: false,
  USE_V3_SINGLE_STEP: false,
  USE_V3_CHAIN: false,
  USE_V3_STATIC: false,
  
  // UI 显示（开发模式开启，便于测试）
  SHOW_V3_BUTTONS: true,      // 开发者可以看到 V3 按钮
  SHOW_V2_BUTTONS: true,      // 保持 V2 按钮可见
  SHOW_VERSION_COMPARISON: true, // 显示对比信息
  
  // 测试和监控
  V3_USER_RATIO: 0.0,         // 0% 用户使用 V3（Phase 1）
  V3_AUTO_ROLLBACK_THRESHOLD: 0.8, // 成功率 < 80% 自动回退
  ENABLE_EXECUTION_COMPARISON: true, // 启用对比日志
};

/**
 * 运行时特性开关管理
 */
class FeatureFlagManager {
  private flags: FeatureFlags;
  
  constructor() {
    this.flags = { ...DEFAULT_FEATURE_FLAGS };
    this.loadFromLocalStorage();
  }
  
  /**
   * 从本地存储加载开关状态
   */
  private loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('feature_flags_v2_v3');
      if (stored) {
        const parsedFlags = JSON.parse(stored);
        this.flags = { ...this.flags, ...parsedFlags };
      }
    } catch (error) {
      console.warn('加载特性开关失败，使用默认配置:', error);
    }
  }
  
  /**
   * 保存开关状态到本地存储
   */
  private saveToLocalStorage() {
    try {
      localStorage.setItem('feature_flags_v2_v3', JSON.stringify(this.flags));
    } catch (error) {
      console.warn('保存特性开关失败:', error);
    }
  }
  
  /**
   * 获取特性开关状态
   */
  isEnabled(flag: keyof FeatureFlags): boolean {
    return !!this.flags[flag];
  }
  
  /**
   * 设置特性开关
   */
  setFlag<K extends keyof FeatureFlags>(flag: K, value: FeatureFlags[K]) {
    this.flags[flag] = value;
    this.saveToLocalStorage();
    console.log(`🚩 特性开关 ${flag} 设置为:`, value);
  }
  
  /**
   * 获取所有开关状态
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }
  
  /**
   * 重置为默认配置
   */
  reset() {
    this.flags = { ...DEFAULT_FEATURE_FLAGS };
    this.saveToLocalStorage();
    console.log('🔄 特性开关已重置为默认配置');
  }
}

// 全局实例
export const featureFlagManager = new FeatureFlagManager();

/**
 * 便捷函数：判断是否启用 V3 执行
 */
export function isV3ExecutionEnabled(): boolean {
  return featureFlagManager.isEnabled('USE_V3_EXECUTION');
}

/**
 * 便捷函数：判断是否启用 V3 自动链
 */
export function isV3ChainEnabled(): boolean {
  return featureFlagManager.isEnabled('USE_V3_CHAIN') && isV3ExecutionEnabled();
}

/**
 * 便捷函数：判断是否显示 V3 按钮
 */
export function shouldShowV3Buttons(): boolean {
  return featureFlagManager.isEnabled('SHOW_V3_BUTTONS');
}

/**
 * 便捷函数：获取执行版本（用于 A/B 测试）
 */
export function getExecutionVersion(userId?: string): 'v2' | 'v3' {
  if (!isV3ExecutionEnabled()) return 'v2';
  
  const ratio = featureFlagManager.getAllFlags().V3_USER_RATIO;
  
  // 如果比例为 0，所有用户使用 V2
  if (ratio <= 0) return 'v2';
  
  // 如果比例为 1，所有用户使用 V3
  if (ratio >= 1) return 'v3';
  
  // 基于用户ID或随机数决定
  let hash = 0;
  if (userId) {
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff;
    }
    hash = Math.abs(hash) / 0xffffffff;
  } else {
    hash = Math.random();
  }
  
  return hash < ratio ? 'v3' : 'v2';
}

/**
 * 开发调试函数：快速启用 V3
 */
export function enableV3ForDevelopment() {
  featureFlagManager.setFlag('USE_V3_EXECUTION', true);
  featureFlagManager.setFlag('USE_V3_CHAIN', true);
  featureFlagManager.setFlag('USE_V3_SINGLE_STEP', true);
  featureFlagManager.setFlag('USE_V3_STATIC', true);
  console.log('🚀 V3 执行系统已启用（开发模式）');
}

/**
 * 开发调试函数：回退到 V2
 */
export function rollbackToV2() {
  featureFlagManager.setFlag('USE_V3_EXECUTION', false);
  console.log('🔄 已回退到 V2 执行系统');
}

// 在控制台暴露调试函数
if (typeof window !== 'undefined') {
  (window as any).v2v3Migration = {
    enableV3: enableV3ForDevelopment,
    rollbackToV2,
    getFlags: () => featureFlagManager.getAllFlags(),
    setFlag: <K extends keyof FeatureFlags>(flag: K, value: FeatureFlags[K]) => 
      featureFlagManager.setFlag(flag, value),
    reset: () => featureFlagManager.reset()
  };
  
  console.log('🛠️ V2→V3 迁移调试工具已加载，使用 window.v2v3Migration 访问');
}