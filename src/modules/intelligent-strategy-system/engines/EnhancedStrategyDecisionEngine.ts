/**
 * 增强的策略决策引擎 - 集成离线验证、受控回退、区域优化
 * 
 * 在原有StrategyDecisionEngine基础上集成XPath文档要求的三大功能：
 * 1. 离线验证系统 - 本地XML验证策略可行性
 * 2. 受控回退机制 - Plan A/B/C/D分层回退
 * 3. 区域限制搜索优化 - 智能搜索范围优化
 */

import type { 
  StrategyCandidate, 
  MatchStrategy,
  MatchCriteria 
} from '../types/StrategyTypes';

import type { 
  ElementAnalysisContext 
} from '../types/AnalysisTypes';

import { OfflineValidationSystem, ValidationResult } from '../validation/OfflineValidationSystem';
import { ControlledFallbackMechanism, FallbackPlan, FallbackExecutionResult } from '../fallback/ControlledFallbackMechanism';
import { RegionLimitedSearchOptimizer, RegionSearchResult } from '../optimization/RegionLimitedSearchOptimizer';

/**
 * 增强决策配置
 */
export interface EnhancedDecisionConfig {
  /** 启用离线验证 */
  enableOfflineValidation: boolean;
  /** 启用受控回退 */
  enableControlledFallback: boolean;
  /** 启用区域搜索优化 */
  enableRegionOptimization: boolean;
  /** 最小验证置信度 */
  minValidationConfidence: number;
  /** 最大决策时间 (ms) */
  maxDecisionTime: number;
  /** 启用详细日志 */
  enableDetailedLogging: boolean;
  /** 并行处理策略候选者 */
  enableParallelProcessing: boolean;
}

/**
 * 增强决策结果
 */
export interface EnhancedDecisionResult {
  /** 决策是否成功 */
  success: boolean;
  /** 最终选择的策略 */
  selectedStrategy?: MatchStrategy;
  /** 选择的候选者 */
  selectedCandidate?: StrategyCandidate;
  /** 最终置信度 */
  finalConfidence: number;
  
  /** 详细结果 */
  details: {
    /** 验证结果 */
    validationResults?: Map<StrategyCandidate, ValidationResult>;
    /** 回退执行结果 */
    fallbackResult?: FallbackExecutionResult;
    /** 区域优化结果 */
    regionOptimization?: RegionSearchResult;
    /** 原始候选者数量 */
    originalCandidateCount: number;
    /** 优化后候选者数量 */
    optimizedCandidateCount: number;
  };
  
  /** 性能指标 */
  performance: {
    /** 总决策时间 (ms) */
    totalDecisionTime: number;
    /** 验证时间 (ms) */
    validationTime?: number;
    /** 回退执行时间 (ms) */
    fallbackTime?: number;
    /** 区域优化时间 (ms) */
    regionOptimizationTime?: number;
  };
  
  /** 决策消息 */
  message: string;
  /** 优化建议 */
  suggestions: string[];
}

/**
 * 增强的策略决策引擎
 * 
 * 集成了离线验证、受控回退和区域优化的完整策略决策系统
 */
export class EnhancedStrategyDecisionEngine {
  private readonly config: EnhancedDecisionConfig;
  private readonly offlineValidator: OfflineValidationSystem;
  private readonly fallbackMechanism: ControlledFallbackMechanism;
  private readonly regionOptimizer: RegionLimitedSearchOptimizer;

  constructor(config?: Partial<EnhancedDecisionConfig>) {
    this.config = {
      enableOfflineValidation: true,
      enableControlledFallback: true,
      enableRegionOptimization: true,
      minValidationConfidence: 0.6,
      maxDecisionTime: 30000,
      enableDetailedLogging: false,
      enableParallelProcessing: true,
      ...config
    };

    // 初始化子系统
    this.offlineValidator = new OfflineValidationSystem({
      enableDetailedLogging: this.config.enableDetailedLogging,
      minConfidenceThreshold: this.config.minValidationConfidence
    });

    this.fallbackMechanism = new ControlledFallbackMechanism({
      enableDetailedLogging: this.config.enableDetailedLogging,
      globalMaxExecutionTime: this.config.maxDecisionTime
    });

    this.regionOptimizer = new RegionLimitedSearchOptimizer({
      enablePerformanceOptimization: true
    });
  }

  /**
   * 执行增强的策略决策
   * @param candidates 原始策略候选者
   * @param context 元素分析上下文
   * @param xmlContent 目标XML内容
   * @param screenSize 屏幕尺寸信息
   * @returns 增强决策结果
   */
  async makeEnhancedDecision(
    candidates: StrategyCandidate[],
    context: ElementAnalysisContext,
    xmlContent: string,
    screenSize: { width: number; height: number }
  ): Promise<EnhancedDecisionResult> {
    const startTime = Date.now();
    const suggestions: string[] = [];

    if (this.config.enableDetailedLogging) {
      console.log('[EnhancedDecision] 开始增强策略决策，候选者数量:', candidates.length);
    }

    try {
      let workingCandidates = [...candidates];
      let validationResults: Map<StrategyCandidate, ValidationResult> | undefined;
      let regionOptimization: RegionSearchResult | undefined;
      let fallbackResult: FallbackExecutionResult | undefined;

      // === 阶段1: 区域搜索优化 ===
      let regionOptimizationTime = 0;
      if (this.config.enableRegionOptimization) {
        const regionStartTime = Date.now();
        
        regionOptimization = await this.regionOptimizer.optimizeSearch(
          context,
          workingCandidates,
          screenSize
        );
        
        regionOptimizationTime = Date.now() - regionStartTime;
        
        if (regionOptimization.success) {
          workingCandidates = regionOptimization.optimizedCandidates;
          suggestions.push(...regionOptimization.optimizationSuggestions);
          
          if (this.config.enableDetailedLogging) {
            console.log(`[EnhancedDecision] 区域优化完成，候选者从${candidates.length}个减少到${workingCandidates.length}个`);
          }
        }
      }

      // === 阶段2: 离线验证 ===
      let validationTime = 0;
      if (this.config.enableOfflineValidation && workingCandidates.length > 0) {
        const validationStartTime = Date.now();
        
        validationResults = await this.offlineValidator.validateCandidates(
          workingCandidates,
          context,
          xmlContent
        );
        
        validationTime = Date.now() - validationStartTime;
        
        // 过滤掉验证失败的候选者
        workingCandidates = workingCandidates.filter(candidate => {
          const validation = validationResults!.get(candidate);
          return validation?.isValid && validation.confidence >= this.config.minValidationConfidence;
        });
        
        if (this.config.enableDetailedLogging) {
          console.log(`[EnhancedDecision] 离线验证完成，${workingCandidates.length}个候选者通过验证`);
        }
        
        if (workingCandidates.length === 0) {
          suggestions.push('所有候选者都未通过离线验证，建议检查元素特征或降低验证标准');
        }
      }

      // === 阶段3: 受控回退决策 ===
      let fallbackTime = 0;
      if (this.config.enableControlledFallback && workingCandidates.length > 0) {
        const fallbackStartTime = Date.now();
        
        // 生成回退计划
        const fallbackPlans = this.fallbackMechanism.generateFallbackPlans(
          context,
          workingCandidates
        );
        
        // 执行受控回退
        fallbackResult = await this.fallbackMechanism.executeControlledFallback(
          fallbackPlans,
          context,
          validationResults
        );
        
        fallbackTime = Date.now() - fallbackStartTime;
        
        if (this.config.enableDetailedLogging) {
          console.log(`[EnhancedDecision] 受控回退完成，结果:`, fallbackResult.success ? '成功' : '失败');
        }
      } else if (workingCandidates.length > 0) {
        // 如果没有启用回退机制，选择置信度最高的候选者
        const bestCandidate = this.selectBestCandidate(workingCandidates, validationResults);
        if (bestCandidate) {
          fallbackResult = {
            success: true,
            successfulPlanId: 'A',
            usedStrategy: bestCandidate.strategy,
            usedCandidate: bestCandidate,
            executionDetails: {
              attemptedPlans: [{
                planId: 'A',
                success: true,
                strategy: bestCandidate.strategy,
                confidence: this.getCandidateConfidence(bestCandidate, validationResults),
                executionTime: 0
              }],
              totalExecutionTime: 0,
              finalConfidence: this.getCandidateConfidence(bestCandidate, validationResults)
            },
            message: '直接选择最佳候选者'
          };
        }
      }

      // === 构建决策结果 ===
      const totalDecisionTime = Date.now() - startTime;
      
      const success = fallbackResult?.success || false;
      const finalConfidence = fallbackResult?.executionDetails.finalConfidence || 0;
      
      if (success) {
        suggestions.push(`成功选择策略: ${fallbackResult!.usedStrategy}，置信度: ${(finalConfidence * 100).toFixed(1)}%`);
      } else {
        suggestions.push('所有策略决策尝试都失败，建议检查元素特征或使用手动策略');
      }

      // 性能建议
      if (totalDecisionTime > 10000) {
        suggestions.push('决策时间较长，建议优化候选者数量或启用并行处理');
      }

      const result: EnhancedDecisionResult = {
        success,
        selectedStrategy: fallbackResult?.usedStrategy,
        selectedCandidate: fallbackResult?.usedCandidate,
        finalConfidence,
        details: {
          validationResults,
          fallbackResult,
          regionOptimization,
          originalCandidateCount: candidates.length,
          optimizedCandidateCount: workingCandidates.length
        },
        performance: {
          totalDecisionTime,
          validationTime: validationTime > 0 ? validationTime : undefined,
          fallbackTime: fallbackTime > 0 ? fallbackTime : undefined,
          regionOptimizationTime: regionOptimizationTime > 0 ? regionOptimizationTime : undefined
        },
        message: success 
          ? `增强决策成功: 使用${fallbackResult!.usedStrategy}策略`
          : '增强决策失败: 所有策略尝试都未成功',
        suggestions
      };

      if (this.config.enableDetailedLogging) {
        console.log('[EnhancedDecision] 决策完成:', {
          success: result.success,
          strategy: result.selectedStrategy,
          confidence: result.finalConfidence,
          totalTime: totalDecisionTime
        });
      }

      return result;

    } catch (error) {
      console.error('[EnhancedDecision] 决策过程出错:', error);
      
      return {
        success: false,
        finalConfidence: 0,
        details: {
          originalCandidateCount: candidates.length,
          optimizedCandidateCount: 0
        },
        performance: {
          totalDecisionTime: Date.now() - startTime
        },
        message: `决策失败: ${error.message}`,
        suggestions: ['发生内部错误，建议检查系统配置或使用简化决策模式']
      };
    }
  }

  /**
   * 选择最佳候选者（当未启用回退机制时使用）
   */
  private selectBestCandidate(
    candidates: StrategyCandidate[],
    validationResults?: Map<StrategyCandidate, ValidationResult>
  ): StrategyCandidate | null {
    if (candidates.length === 0) return null;
    
    // 根据验证结果排序
    const sortedCandidates = [...candidates].sort((a, b) => {
      const aConfidence = this.getCandidateConfidence(a, validationResults);
      const bConfidence = this.getCandidateConfidence(b, validationResults);
      return bConfidence - aConfidence;
    });
    
    return sortedCandidates[0];
  }

  /**
   * 获取候选者的置信度
   */
  private getCandidateConfidence(
    candidate: StrategyCandidate,
    validationResults?: Map<StrategyCandidate, ValidationResult>
  ): number {
    if (validationResults?.has(candidate)) {
      return validationResults.get(candidate)!.confidence;
    }
    
    // 如果没有验证结果，根据策略类型返回基础置信度
    const baseConfidence = {
      'absolute': 0.8,
      'strict': 0.75,
      'standard': 0.85,
      'relaxed': 0.7,
      'positionless': 0.65,
      'xpath-direct': 0.6,
      'xpath-first-index': 0.7,
      'xpath-all-elements': 0.5
    }[candidate.strategy] || 0.5;
    
    return baseConfidence;
  }

  /**
   * 快速决策模式（用于性能要求高的场景）
   */
  async makeQuickDecision(
    candidates: StrategyCandidate[],
    context: ElementAnalysisContext
  ): Promise<EnhancedDecisionResult> {
    const quickConfig: EnhancedDecisionConfig = {
      ...this.config,
      enableOfflineValidation: false,
      enableControlledFallback: false,
      enableRegionOptimization: true,
      maxDecisionTime: 5000
    };
    
    // 临时创建快速决策引擎
    const quickEngine = new EnhancedStrategyDecisionEngine(quickConfig);
    
    return quickEngine.makeEnhancedDecision(
      candidates,
      context,
      '', // 快速模式不需要XML内容
      { width: 1080, height: 1920 } // 默认屏幕尺寸
    );
  }

  /**
   * 获取系统统计信息
   */
  getSystemStats(): {
    validationCacheSize: number;
    fallbackCacheSize: number;
    regionCacheSize: number;
  } {
    return {
      validationCacheSize: this.offlineValidator.getCacheStats().size,
      fallbackCacheSize: this.fallbackMechanism.getCacheStats().size,
      regionCacheSize: 0 // RegionOptimizer暂时没有暴露缓存统计
    };
  }

  /**
   * 清理所有缓存
   */
  clearAllCaches(): void {
    this.offlineValidator.clearCache();
    this.fallbackMechanism.clearCache();
    this.regionOptimizer.clearCache();
  }
}