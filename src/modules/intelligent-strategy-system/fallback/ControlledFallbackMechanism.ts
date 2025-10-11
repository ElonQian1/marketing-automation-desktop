// src/modules/intelligent-strategy-system/fallback/ControlledFallbackMechanism.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * 受控回退机制 - Plan B/C/D 有序执行系统
 * 
 * 根据XPath文档要求实现分层回退策略，确保在主策略失败时
 * 能够按照预定义的优先级顺序执行备选方案
 */

import type { 
  StrategyCandidate, 
  MatchStrategy,
  MatchCriteria 
} from '../types/StrategyTypes';

import type { 
  ElementAnalysisContext 
} from '../types/AnalysisTypes';

import type { ValidationResult } from '../validation/OfflineValidationSystem';

/**
 * 回退计划
 */
export interface FallbackPlan {
  /** 计划标识 */
  planId: 'A' | 'B' | 'C' | 'D';
  /** 计划名称 */
  name: string;
  /** 策略候选者列表（按优先级排序） */
  candidates: StrategyCandidate[];
  /** 计划描述 */
  description: string;
  /** 预期成功率 */
  expectedSuccessRate: number;
  /** 执行条件 */
  conditions?: {
    /** 最小置信度要求 */
    minConfidence?: number;
    /** 最大执行时间限制 (ms) */
    maxExecutionTime?: number;
    /** 是否允许在失败后继续 */
    continueOnFailure?: boolean;
  };
}

/**
 * 回退执行结果
 */
export interface FallbackExecutionResult {
  /** 是否成功 */
  success: boolean;
  /** 成功的计划ID */
  successfulPlanId?: 'A' | 'B' | 'C' | 'D';
  /** 使用的策略 */
  usedStrategy?: MatchStrategy;
  /** 使用的候选者 */
  usedCandidate?: StrategyCandidate;
  /** 执行详情 */
  executionDetails: {
    /** 尝试的计划列表 */
    attemptedPlans: Array<{
      planId: 'A' | 'B' | 'C' | 'D';
      success: boolean;
      strategy?: MatchStrategy;
      confidence?: number;
      errorMessage?: string;
      executionTime: number;
    }>;
    /** 总执行时间 */
    totalExecutionTime: number;
    /** 最终置信度 */
    finalConfidence?: number;
  };
  /** 执行消息 */
  message: string;
}

/**
 * 回退配置
 */
export interface FallbackConfig {
  /** 启用智能回退顺序 */
  enableSmartFallbackOrder: boolean;
  /** 计划间最大间隔时间 (ms) */
  maxPlanInterval: number;
  /** 启用计划预验证 */
  enablePlanPreValidation: boolean;
  /** 全局最大执行时间 (ms) */
  globalMaxExecutionTime: number;
  /** 启用详细日志 */
  enableDetailedLogging: boolean;
}

/**
 * 受控回退机制
 * 
 * 实现分层的策略回退系统，确保在主策略失败时能够
 * 有序、高效地执行备选策略，提高整体匹配成功率
 */
export class ControlledFallbackMechanism {
  private readonly config: FallbackConfig;
  private planCache = new Map<string, FallbackPlan[]>();

  constructor(config?: Partial<FallbackConfig>) {
    this.config = {
      enableSmartFallbackOrder: true,
      maxPlanInterval: 1000,
      enablePlanPreValidation: true,
      globalMaxExecutionTime: 30000,
      enableDetailedLogging: false,
      ...config
    };
  }

  /**
   * 生成回退计划
   * @param context 元素分析上下文
   * @param availableCandidates 可用的策略候选者
   * @returns 分层回退计划
   */
  generateFallbackPlans(
    context: ElementAnalysisContext,
    availableCandidates: StrategyCandidate[]
  ): FallbackPlan[] {
    const cacheKey = this.generatePlanCacheKey(context, availableCandidates);
    
    if (this.planCache.has(cacheKey)) {
      return this.planCache.get(cacheKey)!;
    }

    const plans = this.createFallbackPlans(context, availableCandidates);
    this.planCache.set(cacheKey, plans);
    
    return plans;
  }

  /**
   * 执行受控回退
   * @param plans 回退计划列表
   * @param context 分析上下文
   * @param validationResults 离线验证结果
   * @returns 回退执行结果
   */
  async executeControlledFallback(
    plans: FallbackPlan[],
    context: ElementAnalysisContext,
    validationResults?: Map<StrategyCandidate, ValidationResult>
  ): Promise<FallbackExecutionResult> {
    const startTime = Date.now();
    const attemptedPlans: FallbackExecutionResult['executionDetails']['attemptedPlans'] = [];

    if (this.config.enableDetailedLogging) {
      console.log(`[ControlledFallback] 开始执行回退计划，共${plans.length}个计划`);
    }

    // 按顺序执行计划 A -> B -> C -> D
    for (const plan of plans) {
      const planStartTime = Date.now();
      
      try {
        // 检查全局超时
        if (Date.now() - startTime > this.config.globalMaxExecutionTime) {
          console.warn(`[ControlledFallback] 全局执行超时，终止计划${plan.planId}`);
          break;
        }

        if (this.config.enableDetailedLogging) {
          console.log(`[ControlledFallback] 尝试执行计划${plan.planId}: ${plan.name}`);
        }

        // 预验证计划（如果启用）
        if (this.config.enablePlanPreValidation && validationResults) {
          const preValidation = this.preValidatePlan(plan, validationResults);
          if (!preValidation.isValid) {
            attemptedPlans.push({
              planId: plan.planId,
              success: false,
              errorMessage: `预验证失败: ${preValidation.reason}`,
              executionTime: Date.now() - planStartTime
            });
            continue;
          }
        }

        // 执行计划中的策略候选者
        const planResult = await this.executePlan(plan, context, validationResults);
        
        const executionTime = Date.now() - planStartTime;
        
        if (planResult.success) {
          // 计划成功，返回结果
          attemptedPlans.push({
            planId: plan.planId,
            success: true,
            strategy: planResult.strategy!,
            confidence: planResult.confidence,
            executionTime
          });

          return {
            success: true,
            successfulPlanId: plan.planId,
            usedStrategy: planResult.strategy,
            usedCandidate: planResult.candidate,
            executionDetails: {
              attemptedPlans,
              totalExecutionTime: Date.now() - startTime,
              finalConfidence: planResult.confidence
            },
            message: `计划${plan.planId}执行成功，使用策略: ${planResult.strategy}`
          };
        } else {
          // 计划失败，记录并继续
          attemptedPlans.push({
            planId: plan.planId,
            success: false,
            errorMessage: planResult.errorMessage,
            executionTime
          });

          // 检查是否允许继续
          if (plan.conditions?.continueOnFailure === false) {
            if (this.config.enableDetailedLogging) {
              console.log(`[ControlledFallback] 计划${plan.planId}设置为失败时不继续，终止回退`);
            }
            break;
          }
        }

        // 计划间间隔
        if (this.config.maxPlanInterval > 0) {
          await this.sleep(Math.min(this.config.maxPlanInterval, 100));
        }

      } catch (error) {
        attemptedPlans.push({
          planId: plan.planId,
          success: false,
          errorMessage: `计划执行异常: ${error.message}`,
          executionTime: Date.now() - planStartTime
        });

        console.error(`[ControlledFallback] 计划${plan.planId}执行异常:`, error);
      }
    }

    // 所有计划都失败了
    return {
      success: false,
      executionDetails: {
        attemptedPlans,
        totalExecutionTime: Date.now() - startTime
      },
      message: `所有回退计划都失败了，共尝试${attemptedPlans.length}个计划`
    };
  }

  /**
   * 创建分层回退计划
   */
  private createFallbackPlans(
    context: ElementAnalysisContext,
    candidates: StrategyCandidate[]
  ): FallbackPlan[] {
    const element = context.targetElement;
    
    // 按策略类型和置信度对候选者进行分组和排序
    const sortedCandidates = this.sortCandidatesByPriority(candidates);
    
    const plans: FallbackPlan[] = [];

    // Plan A: 高精度策略 (绝对定位、严格匹配)
    const planA: FallbackPlan = {
      planId: 'A',
      name: '高精度匹配计划',
      candidates: sortedCandidates.filter(c => 
        ['absolute', 'strict'].includes(c.strategy)
      ),
      description: '使用绝对定位和严格匹配策略，精度最高但脆弱性较强',
      expectedSuccessRate: 0.85,
      conditions: {
        minConfidence: 0.8,
        maxExecutionTime: 5000,
        continueOnFailure: true
      }
    };

    // Plan B: 标准匹配策略 (跨设备稳定)
    const planB: FallbackPlan = {
      planId: 'B',
      name: '标准匹配计划',
      candidates: sortedCandidates.filter(c => 
        c.strategy === 'standard'
      ),
      description: '使用语义字段匹配，跨设备兼容性好',
      expectedSuccessRate: 0.75,
      conditions: {
        minConfidence: 0.6,
        maxExecutionTime: 8000,
        continueOnFailure: true
      }
    };

    // Plan C: 宽松匹配策略 (容错性强)
    const planC: FallbackPlan = {
      planId: 'C',
      name: '宽松匹配计划',
      candidates: sortedCandidates.filter(c => 
        ['relaxed', 'positionless'].includes(c.strategy)
      ),
      description: '使用宽松匹配策略，容错性强但精度较低',
      expectedSuccessRate: 0.65,
      conditions: {
        minConfidence: 0.4,
        maxExecutionTime: 10000,
        continueOnFailure: true
      }
    };

    // Plan D: XPath和其他策略 (兜底方案)
    const planD: FallbackPlan = {
      planId: 'D',
      name: '兜底匹配计划',
      candidates: sortedCandidates.filter(c => 
        c.strategy.startsWith('xpath-') || !['absolute', 'strict', 'standard', 'relaxed', 'positionless'].includes(c.strategy)
      ),
      description: '使用XPath和其他兜底策略，最后的匹配尝试',
      expectedSuccessRate: 0.45,
      conditions: {
        minConfidence: 0.3,
        maxExecutionTime: 15000,
        continueOnFailure: false
      }
    };

    // 只包含有候选者的计划
    [planA, planB, planC, planD].forEach(plan => {
      if (plan.candidates.length > 0) {
        plans.push(plan);
      }
    });

    // 智能排序（如果启用）
    if (this.config.enableSmartFallbackOrder) {
      return this.optimizePlanOrder(plans, context);
    }

    return plans;
  }

  /**
   * 执行单个计划
   */
  private async executePlan(
    plan: FallbackPlan,
    context: ElementAnalysisContext,
    validationResults?: Map<StrategyCandidate, ValidationResult>
  ): Promise<{
    success: boolean;
    strategy?: MatchStrategy;
    candidate?: StrategyCandidate;
    confidence?: number;
    errorMessage?: string;
  }> {
    // 按置信度排序候选者
    const sortedCandidates = this.sortCandidatesByConfidence(plan.candidates, validationResults);

    for (const candidate of sortedCandidates) {
      try {
        // 检查验证结果
        if (validationResults?.has(candidate)) {
          const validation = validationResults.get(candidate)!;
          
          if (!validation.isValid || 
              validation.confidence < (plan.conditions?.minConfidence || 0)) {
            continue;
          }
        }

        // 这里应该调用实际的策略执行器
        // 为了演示，我们模拟执行结果
        const executionResult = await this.simulateStrategyExecution(candidate, context);
        
        if (executionResult.success) {
          return {
            success: true,
            strategy: candidate.strategy,
            candidate,
            confidence: executionResult.confidence
          };
        }

      } catch (error) {
        console.warn(`[ControlledFallback] 候选者${candidate.strategy}执行失败:`, error);
        continue;
      }
    }

    return {
      success: false,
      errorMessage: `计划${plan.planId}中所有候选者都执行失败`
    };
  }

  /**
   * 预验证计划
   */
  private preValidatePlan(
    plan: FallbackPlan,
    validationResults: Map<StrategyCandidate, ValidationResult>
  ): { isValid: boolean; reason?: string } {
    const validCandidates = plan.candidates.filter(candidate => {
      const validation = validationResults.get(candidate);
      return validation?.isValid && 
             validation.confidence >= (plan.conditions?.minConfidence || 0);
    });

    if (validCandidates.length === 0) {
      return {
        isValid: false,
        reason: '计划中没有通过验证的候选者'
      };
    }

    return { isValid: true };
  }

  // === 辅助方法 ===

  private sortCandidatesByPriority(candidates: StrategyCandidate[]): StrategyCandidate[] {
    const priorityOrder: MatchStrategy[] = [
      'absolute', 'strict', 'standard', 
      'relaxed', 'positionless', 
      'xpath-direct', 'xpath-first-index', 'xpath-all-elements'
    ];

    return [...candidates].sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.strategy);
      const bPriority = priorityOrder.indexOf(b.strategy);
      
      if (aPriority === -1 && bPriority === -1) return 0;
      if (aPriority === -1) return 1;
      if (bPriority === -1) return -1;
      
      return aPriority - bPriority;
    });
  }

  private sortCandidatesByConfidence(
    candidates: StrategyCandidate[],
    validationResults?: Map<StrategyCandidate, ValidationResult>
  ): StrategyCandidate[] {
    if (!validationResults) return candidates;

    return [...candidates].sort((a, b) => {
      const aValidation = validationResults.get(a);
      const bValidation = validationResults.get(b);
      
      const aConfidence = aValidation?.confidence || 0;
      const bConfidence = bValidation?.confidence || 0;
      
      return bConfidence - aConfidence; // 降序排列
    });
  }

  private optimizePlanOrder(plans: FallbackPlan[], context: ElementAnalysisContext): FallbackPlan[] {
    // 根据元素特征智能调整计划顺序
    const element = context.targetElement;
    
    // 如果元素有稳定的resource-id，优先标准匹配
    if (element.attributes?.['resource-id'] && element.attributes['resource-id'].length > 5 && !element.attributes['resource-id'].includes('temp')) {
      const standardPlan = plans.find(p => p.planId === 'B');
      if (standardPlan) {
        return [standardPlan, ...plans.filter(p => p.planId !== 'B')];
      }
    }

    // 如果元素位置信息很详细，保持原序（优先高精度）
    return plans;
  }

  private async simulateStrategyExecution(
    candidate: StrategyCandidate, 
    context: ElementAnalysisContext
  ): Promise<{ success: boolean; confidence?: number }> {
    // 模拟策略执行，实际实现中应调用真实的执行器
    await this.sleep(50 + Math.random() * 200);
    
    // 模拟成功率
    const baseSuccessRate = {
      'absolute': 0.8,
      'strict': 0.75,
      'standard': 0.85,
      'relaxed': 0.7,
      'positionless': 0.65,
      'xpath-direct': 0.6,
      'xpath-first-index': 0.7,
      'xpath-all-elements': 0.5
    }[candidate.strategy] || 0.5;

    const success = Math.random() < baseSuccessRate;
    
    return {
      success,
      confidence: success ? baseSuccessRate + Math.random() * 0.2 : 0
    };
  }

  private generatePlanCacheKey(
    context: ElementAnalysisContext, 
    candidates: StrategyCandidate[]
  ): string {
    const elementKey = JSON.stringify({
      resourceId: context.targetElement.attributes?.['resource-id'],
      text: context.targetElement.text,
      class: context.targetElement.attributes?.class
    });
    
    const candidatesKey = candidates.map(c => c.strategy).sort().join(',');
    
    return `${elementKey}_${candidatesKey}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 清理计划缓存
   */
  clearCache(): void {
    this.planCache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { size: number } {
    return {
      size: this.planCache.size
    };
  }
}