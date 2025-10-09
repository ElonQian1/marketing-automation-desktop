/**
 * ScoreWeightConfig.ts
 * 评分权重配置管理模块
 * 
 * @description 提供灵活的评分权重配置和预设方案管理
 */

import type {
  ScoreWeightConfig,
  WeightPreset,
  WeightConfigOptions,
  DEFAULT_WEIGHT_CONFIGS
} from './types';

/**
 * 评分权重配置管理器
 * 
 * @description 管理不同场景下的评分权重配置，支持预设方案和自定义配置
 */
export class ScoreWeightConfigManager {
  private currentConfig: ScoreWeightConfig;
  private presetConfigs: Record<WeightPreset, ScoreWeightConfig>;
  private dynamicAdjustmentEnabled: boolean = false;
  private adjustmentHistory: WeightAdjustmentRecord[] = [];

  constructor(options: WeightConfigOptions = {}) {
    // 加载预设配置
    this.presetConfigs = this.loadDefaultPresets();
    
    // 初始化当前配置
    this.currentConfig = this.initializeConfig(options);
    
    // 设置动态调整
    this.dynamicAdjustmentEnabled = options.enableDynamicAdjustment || false;
  }

  /**
   * 获取当前权重配置
   */
  getCurrentConfig(): ScoreWeightConfig {
    return { ...this.currentConfig };
  }

  /**
   * 设置权重预设方案
   */
  setPreset(preset: WeightPreset): void {
    if (!this.presetConfigs[preset]) {
      throw new Error(`未知的预设方案: ${preset}`);
    }
    
    this.currentConfig = { ...this.presetConfigs[preset] };
    this.recordAdjustment('preset-change', { preset });
  }

  /**
   * 自定义权重配置
   */
  setCustomWeights(weights: Partial<ScoreWeightConfig>): void {
    // 验证权重值
    this.validateWeights(weights);
    
    // 合并配置
    this.currentConfig = {
      ...this.currentConfig,
      ...weights
    };
    
    // 归一化权重
    this.normalizeWeights();
    
    this.recordAdjustment('custom-change', { weights });
  }

  /**
   * 获取预设配置列表
   */
  getAvailablePresets(): WeightPreset[] {
    return Object.keys(this.presetConfigs) as WeightPreset[];
  }

  /**
   * 获取指定预设的配置
   */
  getPresetConfig(preset: WeightPreset): ScoreWeightConfig {
    if (!this.presetConfigs[preset]) {
      throw new Error(`未知的预设方案: ${preset}`);
    }
    return { ...this.presetConfigs[preset] };
  }

  /**
   * 基于性能数据动态调整权重
   */
  adjustWeightsBasedOnPerformance(performanceData: PerformanceAdjustmentData): void {
    if (!this.dynamicAdjustmentEnabled) {
      return;
    }

    const adjustments = this.calculatePerformanceBasedAdjustments(performanceData);
    
    if (adjustments) {
      this.setCustomWeights(adjustments);
      this.recordAdjustment('performance-based', { 
        performanceData, 
        adjustments 
      });
    }
  }

  /**
   * 重置为默认配置
   */
  reset(preset: WeightPreset = 'balanced'): void {
    this.setPreset(preset);
    this.adjustmentHistory = [];
  }

  /**
   * 获取调整历史
   */
  getAdjustmentHistory(): WeightAdjustmentRecord[] {
    return [...this.adjustmentHistory];
  }

  /**
   * 导出配置为JSON
   */
  exportConfig(): string {
    return JSON.stringify({
      config: this.currentConfig,
      timestamp: Date.now(),
      version: '1.0.0'
    }, null, 2);
  }

  /**
   * 从JSON导入配置
   */
  importConfig(configJson: string): void {
    try {
      const imported = JSON.parse(configJson);
      this.validateWeights(imported.config);
      this.currentConfig = imported.config;
      this.normalizeWeights();
      
      this.recordAdjustment('import', { source: 'json' });
    } catch (error) {
      throw new Error(`配置导入失败: ${error}`);
    }
  }

  // === 私有方法 ===

  /**
   * 加载默认预设配置
   */
  private loadDefaultPresets(): Record<WeightPreset, ScoreWeightConfig> {
    // 注意：这里需要在运行时加载，避免编译时的循环依赖
    const defaultConfigs = {
      'speed-first': {
        performance: 0.4,
        stability: 0.2,
        accuracy: 0.2,
        crossDevice: 0.1,
        maintainability: 0.1
      },
      'stability-first': {
        performance: 0.1,
        stability: 0.4,
        accuracy: 0.2,
        crossDevice: 0.2,
        maintainability: 0.1
      },
      'accuracy-first': {
        performance: 0.1,
        stability: 0.2,
        accuracy: 0.4,
        crossDevice: 0.2,
        maintainability: 0.1
      },
      'balanced': {
        performance: 0.2,
        stability: 0.2,
        accuracy: 0.2,
        crossDevice: 0.2,
        maintainability: 0.2
      },
      'cross-device': {
        performance: 0.1,
        stability: 0.3,
        accuracy: 0.1,
        crossDevice: 0.4,
        maintainability: 0.1
      }
    } as Record<WeightPreset, ScoreWeightConfig>;

    return defaultConfigs;
  }

  /**
   * 初始化配置
   */
  private initializeConfig(options: WeightConfigOptions): ScoreWeightConfig {
    let config: ScoreWeightConfig;

    if (options.custom) {
      // 使用自定义配置
      config = {
        performance: 0.2,
        stability: 0.2,
        accuracy: 0.2,
        crossDevice: 0.2,
        maintainability: 0.2,
        ...options.custom
      };
    } else {
      // 使用预设配置
      const preset = options.preset || 'balanced';
      config = { ...this.presetConfigs[preset] };
    }

    this.validateWeights(config);
    return config;
  }

  /**
   * 验证权重值
   */
  private validateWeights(weights: Partial<ScoreWeightConfig>): void {
    const entries = Object.entries(weights);
    
    for (const [key, value] of entries) {
      if (typeof value !== 'number' || value < 0 || value > 1) {
        throw new Error(`权重值 ${key} 必须是 0-1 之间的数字，当前值: ${value}`);
      }
    }

    // 检查总和不超过1（允许小于1，会自动归一化）
    const sum = Object.values(weights).reduce((total, weight) => total + (weight || 0), 0);
    if (sum > 1.1) { // 允许小幅超出，考虑浮点数精度
      throw new Error(`权重总和不能超过1，当前总和: ${sum.toFixed(3)}`);
    }
  }

  /**
   * 归一化权重（确保总和为1）
   */
  private normalizeWeights(): void {
    const sum = Object.values(this.currentConfig).reduce((total, weight) => total + weight, 0);
    
    if (Math.abs(sum - 1) > 0.001) { // 如果总和不是1
      const factor = 1 / sum;
      this.currentConfig = {
        performance: this.currentConfig.performance * factor,
        stability: this.currentConfig.stability * factor,
        accuracy: this.currentConfig.accuracy * factor,
        crossDevice: this.currentConfig.crossDevice * factor,
        maintainability: this.currentConfig.maintainability * factor,
      };
    }
  }

  /**
   * 基于性能数据计算调整建议
   */
  private calculatePerformanceBasedAdjustments(
    data: PerformanceAdjustmentData
  ): Partial<ScoreWeightConfig> | null {
    const adjustments: Partial<ScoreWeightConfig> = {};
    
    // 根据失败率调整稳定性权重
    if (data.failureRate > 0.1) { // 失败率 > 10%
      adjustments.stability = Math.min(0.5, this.currentConfig.stability + 0.1);
      adjustments.performance = Math.max(0.1, this.currentConfig.performance - 0.05);
    }
    
    // 根据响应时间调整性能权重
    if (data.averageResponseTime > 5000) { // 响应时间 > 5秒
      adjustments.performance = Math.min(0.5, this.currentConfig.performance + 0.1);
      adjustments.accuracy = Math.max(0.1, this.currentConfig.accuracy - 0.05);
    }
    
    // 根据跨设备兼容性调整
    if (data.crossDeviceSuccessRate < 0.8) { // 跨设备成功率 < 80%
      adjustments.crossDevice = Math.min(0.4, this.currentConfig.crossDevice + 0.1);
      adjustments.maintainability = Math.max(0.1, this.currentConfig.maintainability - 0.05);
    }
    
    return Object.keys(adjustments).length > 0 ? adjustments : null;
  }

  /**
   * 记录权重调整历史
   */
  private recordAdjustment(type: string, details: any): void {
    this.adjustmentHistory.push({
      timestamp: Date.now(),
      type,
      previousConfig: this.adjustmentHistory.length > 0 
        ? this.adjustmentHistory[this.adjustmentHistory.length - 1].newConfig
        : undefined,
      newConfig: { ...this.currentConfig },
      details
    });

    // 保持历史记录在合理范围内
    if (this.adjustmentHistory.length > 100) {
      this.adjustmentHistory = this.adjustmentHistory.slice(-50);
    }
  }
}

// === 辅助类型 ===

/**
 * 性能调整数据
 */
export interface PerformanceAdjustmentData {
  /** 失败率 (0-1) */
  failureRate: number;
  
  /** 平均响应时间 (ms) */
  averageResponseTime: number;
  
  /** 跨设备成功率 (0-1) */
  crossDeviceSuccessRate: number;
  
  /** 准确率 (0-1) */
  accuracyRate: number;
  
  /** 数据样本数 */
  sampleSize: number;
}

/**
 * 权重调整记录
 */
export interface WeightAdjustmentRecord {
  /** 调整时间戳 */
  timestamp: number;
  
  /** 调整类型 */
  type: string;
  
  /** 调整前配置 */
  previousConfig?: ScoreWeightConfig;
  
  /** 调整后配置 */
  newConfig: ScoreWeightConfig;
  
  /** 调整详情 */
  details: any;
}

// === 便捷函数 ===

/**
 * 创建权重配置管理器
 */
export function createWeightConfigManager(options?: WeightConfigOptions): ScoreWeightConfigManager {
  return new ScoreWeightConfigManager(options);
}

/**
 * 快速创建预设权重配置
 */
export function createPresetWeightConfig(preset: WeightPreset): ScoreWeightConfig {
  const manager = new ScoreWeightConfigManager({ preset });
  return manager.getCurrentConfig();
}

/**
 * 验证权重配置有效性
 */
export function validateWeightConfig(config: Partial<ScoreWeightConfig>): boolean {
  try {
    const manager = new ScoreWeightConfigManager();
    manager.setCustomWeights(config);
    return true;
  } catch {
    return false;
  }
}