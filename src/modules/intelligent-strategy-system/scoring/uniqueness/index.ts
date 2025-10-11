// src/modules/intelligent-strategy-system/scoring/uniqueness/index.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * UniquenessValidator 模块化重构 - 统一导出
 * 
 * 本模块将原来重复的 UniquenessValidator.ts (668行) 和 UniquenessValidator.complex.ts (1029行)
 * 重构为模块化架构，消除代码重复，提供统一接口
 * 
 * 核心架构：
 * - ValidationEngine: 主要验证引擎，整合所有功能
 * - SimilarityAnalyzer: 策略相似性分析
 * - ConflictDetector: 策略冲突检测 
 * - types/: 统一类型定义
 * 
 * 使用方式：
 * ```typescript
 * import { UniquenessValidator } from './uniqueness';
 * 
 * const validator = new UniquenessValidator(config);
 * const result = validator.validateUniqueness(strategies);
 * ```
 */

// 核心组件导出
export { ValidationEngine } from './core/ValidationEngine';
export { SimilarityAnalyzer } from './core/SimilarityAnalyzer';
export { ConflictDetector } from './core/ConflictDetector';

// 类型定义导出
export type {
  SimilarityType,
  SimilarityAnalysis,
  ConflictDetection,
  ElementContext,
  UniquenessValidationResult,
  UniquenessValidatorConfig
} from './types';

export { DEFAULT_UNIQUENESS_CONFIG } from './types';

// 统一接口适配器（向后兼容）
import { ValidationEngine } from './core/ValidationEngine';
import { UniquenessValidatorConfig, ElementContext, UniquenessValidationResult } from './types';
import { StrategyRecommendation } from '../../types/StrategyTypes';

/**
 * 统一的 UniquenessValidator 接口
 * 替代原来的重复实现，向后兼容
 */
export class UniquenessValidator {
  private engine: ValidationEngine;

  constructor(config?: Partial<UniquenessValidatorConfig>) {
    this.engine = new ValidationEngine(config);
  }

  /**
   * 验证策略唯一性（标准接口）
   */
  validateUniqueness(
    strategies: StrategyRecommendation[], 
    context?: ElementContext
  ): UniquenessValidationResult {
    return this.engine.validateUniqueness(strategies, context);
  }

  /**
   * 快速验证（性能优化版本）
   */
  validateUniquenessQuick(strategies: StrategyRecommendation[]): UniquenessValidationResult {
    return this.engine.validateUniquenessQuick(strategies);
  }

  /**
   * 分析相似性（兼容接口）
   */
  analyzeSimilarities(strategies: StrategyRecommendation[]) {
    const result = this.engine.validateUniqueness(strategies);
    return result.similarityAnalyses;
  }

  /**
   * 检测冲突（兼容接口）
   */
  detectConflicts(strategies: StrategyRecommendation[]) {
    const result = this.engine.validateUniqueness(strategies);
    return result.conflictDetections;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<UniquenessValidatorConfig>): void {
    this.engine.updateConfig(newConfig);
  }

  /**
   * 获取当前配置
   */
  getConfig(): UniquenessValidatorConfig {
    return this.engine.getConfig();
  }
}

// 默认导出统一验证器
export default UniquenessValidator;