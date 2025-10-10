/**
 * StrategyDecisionEngine.ts
 * 智能策略决策引擎 - 核心决策逻辑
 * 
 * @description 实现基于 Step 0-6 的智能匹配策略决策流程
 */

import type { 
  DecisionContext, 
  DecisionResult, 
  StepAnalysisResult,
  DecisionEngineConfig
} from '../types/DecisionTypes';

import type {
  MatchStrategy,
  StrategyRecommendation,
  StrategyCandidate
} from '../types/StrategyTypes';

// AnalysisStep 作为值导入
import { AnalysisStep } from '../types/DecisionTypes';

import type {
  ElementAnalysisContext,
  AnalysisOptions,
  ElementAnalysisResult
} from '../types/AnalysisTypes';

import { ElementContextAnalyzer } from './ElementContextAnalyzer';
import { ConfidenceCalculator } from './ConfidenceCalculator';
import { AnalyzerFactory } from '../analyzers/index';

// Plan 系统集成
import { getStrategyPlanFactory } from '../plan/StrategyPlanFactory';
import type { StrategyPlan } from '../types/StrategyPlanTypes';

/**
 * 智能策略决策引擎
 * 
 * 核心职责：
 * 1. 协调 Step 0-6 分析流程
 * 2. 管理分析器链的执行
 * 3. 综合评估和策略推荐
 */
export class StrategyDecisionEngine {
  private readonly contextAnalyzer: ElementContextAnalyzer;
  private readonly confidenceCalculator: ConfidenceCalculator;
  private readonly config: DecisionEngineConfig;
  private readonly analyzers: Map<AnalysisStep, any> = new Map();

  constructor(config?: Partial<DecisionEngineConfig>) {
    this.config = {
      debugMode: false,
      maxSteps: 6,
      minConfidenceThreshold: 0.5,
      performanceMode: 'balanced',
      enableLocalValidation: true,
      ...config
    };

    this.contextAnalyzer = new ElementContextAnalyzer();
    this.confidenceCalculator = new ConfidenceCalculator();
    
    this.initializeAnalyzers();
  }

  // === 适配器方法：处理新旧 StrategyCandidate 格式兼容性 ===
  
  private getCandidateScore(candidate: StrategyCandidate): number {
    return candidate.scoring?.total || 0;
  }
  
  private getCandidateConfidence(candidate: StrategyCandidate): number {
    // 基于总分计算置信度（0-1）
    const score = this.getCandidateScore(candidate);
    return Math.min(score / 100, 1.0);
  }
  
  private getCandidateReason(candidate: StrategyCandidate): string {
    return `Strategy ${candidate.strategy} selected based on analysis`;
  }
  
  private getCandidatePerformance(candidate: StrategyCandidate): {
    estimatedSpeed: 'fast' | 'medium' | 'slow';
    crossDeviceStability: 'high' | 'medium' | 'low';
  } {
    const complexity = candidate.metadata?.complexity || 'medium';
    const estimatedSpeed = complexity === 'simple' ? 'fast' : 
                          complexity === 'complex' ? 'slow' : 'medium';
    
    // 基于策略类型推断稳定性
    const stableStrategies = ['self-anchor', 'child-anchor', 'standard'];
    const crossDeviceStability = stableStrategies.includes(candidate.strategy) ? 'high' : 'medium';
    
    return { estimatedSpeed, crossDeviceStability };
  }

  /**
   * 主要入口：分析元素并推荐策略
   * @param element 目标元素节点
   * @param xmlContent XML内容
   * @returns 策略推荐结果
   */
  async analyzeAndRecommend(
    element: any, 
    xmlContent: string
  ): Promise<StrategyRecommendation> {
    const startTime = Date.now();
    
    try {
      // 1. 构建决策上下文
      const decisionContext = await this.buildDecisionContext(element, xmlContent);
      
      // 2. 执行完整决策流程
      const decisionResult = await this.executeDecisionFlow(decisionContext);
      
      // 3. 返回推荐结果
      return decisionResult.recommendedStrategy;
      
    } catch (error) {
      console.error('策略决策引擎执行失败:', error);
      
      // 返回默认推荐
      return this.getDefaultRecommendation(element, error as Error);
    } finally {
      if (this.config.debugMode) {
        console.log(`决策引擎总耗时: ${Date.now() - startTime}ms`);
      }
    }
  }

  /**
   * 执行完整的决策流程 (Step 0-6)
   * @param context 决策上下文
   * @returns 完整决策结果
   */
  async executeDecisionFlow(context: DecisionContext): Promise<DecisionResult> {
    const startTime = Date.now();
    const stepResults: StepAnalysisResult[] = [];
    const allCandidates: StrategyCandidate[] = [];

    try {
      // Step 0: 规范化输入
      const normalizedContext = await this.executeStep0(context);
      
      // Step 1-6: 执行分析器链
      for (const step of this.getAnalysisSteps()) {
        const stepResult = await this.executeAnalysisStep(step, normalizedContext);
        stepResults.push(stepResult);
        
        // 收集候选策略
        allCandidates.push(...stepResult.candidates);
        
        // 检查是否可以提前结束
        if (this.shouldTerminateEarly(stepResult, allCandidates)) {
          if (this.config.debugMode) {
            console.log(`在 ${step} 步骤提前结束决策`);
          }
          break;
        }
      }

      // 评分和排序
      const scoredCandidates = await this.scoreAndRankCandidates(allCandidates, normalizedContext);
      
      // 选择最佳推荐
      const recommendedStrategy = this.selectBestRecommendation(scoredCandidates);
      
      // 构建决策结果
      return this.buildDecisionResult(
        recommendedStrategy,
        scoredCandidates,
        stepResults,
        startTime
      );

    } catch (error) {
      console.error('决策流程执行失败:', error);
      throw error;
    }
  }

  /**
   * Step 0: 规范化输入
   * @param context 原始决策上下文
   * @returns 规范化后的上下文
   */
  private async executeStep0(context: DecisionContext): Promise<ElementAnalysisContext> {
    const startTime = Date.now();
    
    try {
      // 使用 ElementContextAnalyzer 进行上下文分析
      const analysisContext = await this.contextAnalyzer.analyzeElement(
        context.targetNode,
        context.xmlContent,
        {
          mode: 'standard',
          deepAnalysis: this.config.performanceMode === 'thorough',
          enableCaching: true,
          timeout: 3000,
          maxDepth: 10,
          performancePriority: this.config.performanceMode === 'fast' ? 'speed' : 
                              this.config.performanceMode === 'thorough' ? 'accuracy' : 'balanced'
        }
      );

      if (this.config.debugMode) {
        console.log(`Step 0 规范化完成，耗时: ${Date.now() - startTime}ms`);
        console.log('分析上下文:', analysisContext);
      }

      return analysisContext;

    } catch (error) {
      console.error('Step 0 规范化失败:', error);
      throw new Error(`规范化输入失败: ${error}`);
    }
  }

  /**
   * 执行单个分析步骤
   * @param step 分析步骤
   * @param context 分析上下文
   * @returns 步骤分析结果
   */
  private async executeAnalysisStep(
    step: AnalysisStep, 
    context: ElementAnalysisContext
  ): Promise<StepAnalysisResult> {
    const startTime = Date.now();
    
    try {
      const analyzer = this.analyzers.get(step);
      
      if (!analyzer) {
        return {
          step,
          success: false,
          candidates: [],
          executionTime: Date.now() - startTime,
          details: {
            message: `分析器 ${step} 未找到`,
            warnings: ['分析器未实现，跳过此步骤']
          },
          shouldContinue: true
        };
      }

      // 执行分析器
      const candidates = await analyzer.analyze(context);
      
      const result: StepAnalysisResult = {
        step,
        success: candidates.length > 0,
        candidates: candidates || [],
        executionTime: Date.now() - startTime,
        details: {
          message: `${step} 分析完成，找到 ${candidates.length} 个候选策略`,
          debugInfo: this.config.debugMode ? { candidates } : undefined
        },
        shouldContinue: candidates.length === 0 || candidates.every(c => c.confidence < 0.8)
      };

      if (this.config.debugMode) {
        console.log(`${step} 执行结果:`, result);
      }

      return result;

    } catch (error) {
      console.error(`${step} 执行失败:`, error);
      
      return {
        step,
        success: false,
        candidates: [],
        executionTime: Date.now() - startTime,
        details: {
          message: `${step} 执行失败: ${error}`,
          warnings: [`步骤 ${step} 发生错误，已跳过`]
        },
        shouldContinue: true
      };
    }
  }

  /**
   * 评分和排序候选策略
   */
  private async scoreAndRankCandidates(
    candidates: StrategyCandidate[],
    context: ElementAnalysisContext
  ): Promise<StrategyCandidate[]> {
    if (candidates.length === 0) {
      return [];
    }

    // 使用 ConfidenceCalculator 进行评分
    const scoredCandidates = await Promise.all(
      candidates.map(async (candidate) => {
        const enhancedScore = await this.confidenceCalculator.calculateCandidateScore(
          candidate,
          context
        );
        
        return {
          ...candidate,
          score: enhancedScore,
          confidence: Math.min(enhancedScore / 100, 1.0)
        };
      })
    );

    // 按分数降序排序
    return scoredCandidates.sort((a, b) => b.score - a.score);
  }

  /**
   * 选择最佳推荐策略
   */
  private selectBestRecommendation(candidates: StrategyCandidate[]): StrategyRecommendation {
    if (candidates.length === 0) {
      return this.getFallbackRecommendation();
    }

    const best = candidates[0];
    const alternatives = candidates.slice(1, 5); // 取前5个作为备选
    
    const performance = this.getCandidatePerformance(best);
    const confidence = this.getCandidateConfidence(best);

    return {
      strategy: best.strategy,
      confidence: confidence,
      reason: this.getCandidateReason(best),
      score: this.getCandidateScore(best),
      performance: {
        speed: performance.estimatedSpeed,
        stability: performance.crossDeviceStability,
        crossDevice: confidence > 0.8 ? 'excellent' : 
                    confidence > 0.6 ? 'good' : 'fair'
      },
      alternatives,
      tags: this.generateRecommendationTags(best) as any,
      scenarios: this.generateScenarios(best),
      limitations: this.generateLimitations(best)
    };
  }

  /**
   * 构建决策上下文
   */
  private async buildDecisionContext(
    element: any, 
    xmlContent: string
  ): Promise<DecisionContext> {
    return {
      targetNode: element,
      xmlSnapshot: {
        xmlContent,
        xmlHash: this.generateXmlHash(xmlContent),
        timestamp: Date.now(),
        deviceInfo: {
          deviceId: 'unknown',
          deviceName: 'unknown',
          appPackage: 'unknown',
          activityName: 'unknown'
        },
        pageInfo: {
          pageTitle: 'unknown',
          pageType: 'unknown',
          elementCount: this.countElements(xmlContent)
        }
      },
      xmlContent,
      deviceInfo: {
        deviceId: 'unknown'
      },
      userIntent: {
        action: 'click'
      }
    };
  }

  /**
   * 构建决策结果
   */
  private buildDecisionResult(
    recommendedStrategy: StrategyRecommendation,
    allCandidates: StrategyCandidate[],
    stepResults: StepAnalysisResult[],
    startTime: number
  ): DecisionResult {
    const totalTime = Date.now() - startTime;
    const stepsExecuted = stepResults.length;
    const finalStep = stepResults[stepResults.length - 1]?.step || AnalysisStep.NORMALIZE_INPUT;

    return {
      recommendedStrategy,
      allCandidates,
      stepResults,
      summary: {
        totalTime,
        stepsExecuted,
        finalStep,
        confidenceLevel: recommendedStrategy.confidence > 0.8 ? 'high' :
                        recommendedStrategy.confidence > 0.5 ? 'medium' : 'low'
      },
      debugInfo: this.config.debugMode ? {
        originalElement: null,
        normalizedElement: null,
        analysisLogs: stepResults.map(r => r.details.message)
      } : undefined
    };
  }

  // === 辅助方法 ===

  private initializeAnalyzers(): void {
    // 使用 AnalyzerFactory 初始化所有可用的分析器
    const implementedSteps = AnalyzerFactory.getImplementedSteps();
    
    implementedSteps.forEach(step => {
      const analyzer = AnalyzerFactory.getAnalyzerByStep(step);
      if (analyzer) {
        this.analyzers.set(step, analyzer);
      }
    });

    const stats = AnalyzerFactory.getStats();
    console.log('✅ 分析器初始化完成', {
      total: stats.total,
      implemented: stats.implemented,
      pending: stats.pending,
      implementedSteps: stats.implementedSteps
    });

    if (this.config.debugMode) {
      console.log('📊 已实现的分析器:', Object.fromEntries(this.analyzers));
    }
  }

  private getAnalysisSteps(): AnalysisStep[] {
    return [
      AnalysisStep.SELF_ANCHOR,
      AnalysisStep.CHILD_ANCHOR,
      AnalysisStep.PARENT_CLICKABLE,
      AnalysisStep.REGION_SCOPED,
      AnalysisStep.NEIGHBOR_RELATIVE,
      AnalysisStep.INDEX_FALLBACK
    ];
  }

  private shouldTerminateEarly(
    stepResult: StepAnalysisResult, 
    allCandidates: StrategyCandidate[]
  ): boolean {
    // 如果找到高置信度的候选策略，可以提前结束
    const hasHighConfidenceCandidate = allCandidates.some(c => this.getCandidateConfidence(c) > 0.9);
    return hasHighConfidenceCandidate && this.config.performanceMode === 'fast';
  }

  private getDefaultRecommendation(element: any, error: Error): StrategyRecommendation {
    return {
      strategy: 'standard' as MatchStrategy,
      confidence: 0.3,
      reason: `决策引擎失败，使用默认策略: ${error.message}`,
      score: 30,
      performance: {
        speed: 'medium',
        stability: 'medium',
        crossDevice: 'fair'
      },
      alternatives: [],
      tags: ['fallback'],
      scenarios: ['应急情况下的默认选择'],
      limitations: ['未经过智能分析，可能不是最优选择']
    };
  }

  private getFallbackRecommendation(): StrategyRecommendation {
    return {
      strategy: 'standard' as MatchStrategy,
      confidence: 0.5,
      reason: '未找到合适的候选策略，使用标准匹配作为回退方案',
      score: 50,
      performance: {
        speed: 'medium',
        stability: 'medium',
        crossDevice: 'good'
      },
      alternatives: [],
      tags: ['fallback', 'stable'] as any,
      scenarios: ['通用场景下的安全选择'],
      limitations: ['可能不是最优策略，但具有良好的兼容性']
    };
  }

  private generateRecommendationTags(candidate: StrategyCandidate): string[] {
    const tags: string[] = [];
    
    const confidence = this.getCandidateConfidence(candidate);
    const performance = this.getCandidatePerformance(candidate);
    const score = this.getCandidateScore(candidate);
    
    if (confidence > 0.8) tags.push('recommended');
    if (performance.estimatedSpeed === 'fast') tags.push('fast');
    if (performance.crossDeviceStability === 'high') tags.push('stable');
    if (score > 80) tags.push('precise');
    
    return tags;
  }

  private generateScenarios(candidate: StrategyCandidate): string[] {
    const scenarios: string[] = [];
    
    switch (candidate.strategy) {
      case 'standard':
        scenarios.push('跨设备兼容场景', '通用自动化场景');
        break;
      case 'strict':
        scenarios.push('高精度要求场景', '稳定性优先场景');
        break;
      case 'xpath-direct':
        scenarios.push('结构稳定场景', '快速执行场景');
        break;
      default:
        scenarios.push('特定应用场景');
    }
    
    return scenarios;
  }

  private generateLimitations(candidate: StrategyCandidate): string[] {
    const limitations: string[] = [];
    
    const confidence = this.getCandidateConfidence(candidate);
    const performance = this.getCandidatePerformance(candidate);
    
    if (confidence < 0.6) {
      limitations.push('置信度较低，建议验证后使用');
    }
    
    if (performance.crossDeviceStability === 'low') {
      limitations.push('跨设备兼容性可能有限');
    }
    
    if (candidate.strategy.includes('xpath')) {
      limitations.push('依赖页面结构稳定性');
    }
    
    return limitations;
  }

  private generateXmlHash(xmlContent: string): string {
    // 简单的哈希实现
    let hash = 0;
    for (let i = 0; i < xmlContent.length; i++) {
      const char = xmlContent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(16);
  }

  private countElements(xmlContent: string): number {
    // 简单计算XML中的元素数量
    const matches = xmlContent.match(/<[^\/\?!][^>]*>/g);
    return matches ? matches.length : 0;
  }

  // === 公共API ===

  /**
   * 批量分析多个元素
   */
  async batchAnalyze(
    elements: any[], 
    xmlContent: string
  ): Promise<StrategyRecommendation[]> {
    const results = await Promise.all(
      elements.map(element => this.analyzeAndRecommend(element, xmlContent))
    );
    return results;
  }

  /**
   * 获取引擎配置
   */
  getConfig(): DecisionEngineConfig {
    return { ...this.config };
  }

  /**
   * 更新引擎配置
   */
  updateConfig(newConfig: Partial<DecisionEngineConfig>): void {
    Object.assign(this.config, newConfig);
  }

  // === Plan 系统集成方法 ===

  /**
   * 创建策略执行计划
   * @param element 目标元素
   * @param xmlContent XML内容
   * @param deviceId 设备ID
   * @returns 策略执行计划
   */
  async createExecutionPlan(
    element: any,
    xmlContent: string,
    deviceId: string
  ): Promise<StrategyPlan> {
    // 1. 分析并获取推荐
    const recommendation = await this.analyzeAndRecommend(element, xmlContent);
    
    // 2. 构建执行上下文
    const executionContext = {
      deviceId,
      xmlSnapshot: xmlContent,
      targetElement: element
    };
    
    // 3. 创建执行计划
    const planFactory = getStrategyPlanFactory({
      maxCandidates: this.config.maxSteps || 6,
      performanceMode: this.config.performanceMode || 'balanced',
      enableLocalValidation: this.config.enableLocalValidation || true
    });
    
    return await planFactory.createPlanFromRecommendation(recommendation, executionContext);
  }

  /**
   * 执行策略计划
   * @param plan 策略计划
   * @param deviceId 设备ID
   * @param xmlContent 当前XML内容
   * @returns 执行结果
   */
  async executePlan(
    plan: StrategyPlan,
    deviceId: string,
    xmlContent?: string
  ) {
    const planFactory = getStrategyPlanFactory();
    
    const executionContext = {
      deviceId,
      xmlSnapshot: xmlContent,
      targetElement: undefined // 将从 plan 中推断
    };
    
    return await planFactory.executePlan(plan, executionContext);
  }

  /**
   * 端到端策略执行：分析 + 计划 + 执行
   * @param element 目标元素
   * @param xmlContent XML内容
   * @param deviceId 设备ID
   * @returns 执行结果
   */
  async analyzeAndExecute(
    element: any,
    xmlContent: string,
    deviceId: string
  ) {
    try {
      // 1. 创建执行计划
      const plan = await this.createExecutionPlan(element, xmlContent, deviceId);
      
      if (this.config.debugMode) {
        console.log('创建执行计划:', {
          planId: plan.planId,
          candidatesCount: plan.candidates.length,
          primaryStrategy: plan.candidates[0]?.strategy,
          confidence: plan.metadata.statistics.totalCandidates
        });
      }
      
      // 2. 执行计划
      const result = await this.executePlan(plan, deviceId, xmlContent);
      
      return {
        success: result.success,
        plan,
        executionResult: result,
        strategy: result.success ? plan.candidates[0]?.strategy : undefined
      };
      
    } catch (error) {
      console.error('端到端策略执行失败:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '执行失败',
        plan: undefined,
        executionResult: undefined
      };
    }
  }
}