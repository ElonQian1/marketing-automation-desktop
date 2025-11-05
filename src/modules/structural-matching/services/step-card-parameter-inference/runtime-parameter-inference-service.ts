// src/modules/structural-matching/services/step-card-parameter-inference/runtime-parameter-inference-service.ts
// module: structural-matching | layer: services | role: 运行时参数推理服务
// summary: 基于步骤卡片的XML快照和XPath，动态推导结构匹配参数

import { 
  StructuralMatchPlan, 
  InferenceResult, 
  ParameterInferenceOptions,
  ElementStructuralFeatures,
  ParsedUIElement
} from './types';
import { XmlSnapshotAnalyzer } from './xml-snapshot-analyzer';
import { StepCardInferenceService } from './step-card-inference-service';
import type { StepCard } from '../../../../store/stepcards';

/**
 * 运行时参数推理服务
 * 负责在脚本执行时，根据步骤卡片信息动态推导结构匹配参数
 */
export class RuntimeParameterInferenceService {
  private xmlAnalyzer: XmlSnapshotAnalyzer;
  private stepCardService: StepCardInferenceService;
  private planCache: Map<string, StructuralMatchPlan> = new Map();

  constructor() {
    this.xmlAnalyzer = new XmlSnapshotAnalyzer();
    this.stepCardService = new StepCardInferenceService();
  }

  /**
   * 从步骤卡片推导结构匹配计划
   * @param stepCard 步骤卡片数据
   * @param options 推导选项
   */
  async inferFromStepCard(
    stepCard: {
      id: string;
      staticXPath: string;
      xmlSnapshot: string;
      existingPlan?: StructuralMatchPlan;
    },
    options: ParameterInferenceOptions = { mode: 'balanced', containerStrategy: 'auto' }
  ): Promise<InferenceResult> {
    const startTime = Date.now();
    
    try {
      console.log('🎯 [RuntimeInference] 开始推导步骤卡片参数', {
        stepCardId: stepCard.id,
        hasExistingPlan: !!stepCard.existingPlan,
        mode: options.mode
      });

      // 1. 检查缓存
      const cacheKey = this.generateCacheKey(stepCard, options);
      const cachedPlan = this.planCache.get(cacheKey);
      if (cachedPlan) {
        console.log('📋 [RuntimeInference] 使用缓存计划');
        return {
          success: true,
          plan: cachedPlan,
          stats: {
            analysisTimeMs: Date.now() - startTime,
            elementsAnalyzed: 0,
            featuresExtracted: 0
          }
        };
      }

      // 2. 验证现有计划
      if (stepCard.existingPlan && this.isPlanValid(stepCard.existingPlan)) {
        console.log('✅ [RuntimeInference] 现有计划有效，直接使用');
        return {
          success: true,
          plan: stepCard.existingPlan,
          stats: {
            analysisTimeMs: Date.now() - startTime,
            elementsAnalyzed: 0,
            featuresExtracted: 0
          }
        };
      }

      // 3. 解析XML快照
      const elements = await this.xmlAnalyzer.parseXmlSnapshot(stepCard.xmlSnapshot, {
        includeInvisible: false,
        buildRelations: true,
        calculateXPath: true
      });

      if (elements.length === 0) {
        return {
          success: false,
          error: 'XML快照解析失败：无有效元素'
        };
      }

      // 4. 查找目标元素
      const targetElement = this.xmlAnalyzer.findElementByXPath(stepCard.staticXPath);
      if (!targetElement) {
        return {
          success: false,
          error: `目标元素未找到：${stepCard.staticXPath}`
        };
      }

      // 5. 分析结构特征
      const structuralFeatures = this.xmlAnalyzer.analyzeElementStructure(targetElement, options);

      // 6. 生成推理计划
      const plan = this.generateStructuralMatchPlan(
        stepCard,
        structuralFeatures,
        options
      );

      // 7. 缓存结果
      this.planCache.set(cacheKey, plan);

      const endTime = Date.now();
      console.log('✅ [RuntimeInference] 参数推导完成', {
        planVersion: plan.version,
        analysisTime: endTime - startTime,
        hasContainer: !!structuralFeatures.containerElement
      });

      return {
        success: true,
        plan,
        stats: {
          analysisTimeMs: endTime - startTime,
          elementsAnalyzed: elements.length,
          featuresExtracted: Object.keys(structuralFeatures).length
        }
      };

    } catch (error) {
      console.error('❌ [RuntimeInference] 推导失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '推导过程发生未知错误'
      };
    }
  }

  /**
   * 验证推理计划是否有效
   */
  async validatePlan(plan: StructuralMatchPlan): Promise<boolean> {
    try {
      // 检查计划版本
      if (!plan.version || plan.version !== 'smplan.v1') {
        return false;
      }

      // 检查必要字段
      if (!plan.selectedAnchor || !plan.containerGate || !plan.fieldMask) {
        return false;
      }

      // 检查时间有效性（可选：检查计划是否过期）
      const generatedAt = new Date(plan.generatedAt);
      const now = new Date();
      const hoursSinceGenerated = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60);
      
      // 计划超过24小时认为过期
      if (hoursSinceGenerated > 24) {
        console.log('⏰ [RuntimeInference] 计划已过期', {
          generatedAt: plan.generatedAt,
          hoursSinceGenerated
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ [RuntimeInference] 计划验证失败:', error);
      return false;
    }
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.planCache.clear();
    console.log('🧹 [RuntimeInference] 缓存已清理');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.planCache.size,
      keys: Array.from(this.planCache.keys())
    };
  }

  /**
   * 检查步骤卡片是否需要参数推理
   */
  needsInference(stepCard: StepCard): boolean {
    // 检查是否已有结构匹配计划
    if (stepCard.structuralMatchPlan) {
      return false;
    }

    // 检查是否有XML快照
    if (!stepCard.xmlSnapshot) {
      return false;
    }

    // 检查步骤类型是否支持推理
    const supportedActionTypes = ['click', 'input'];
    return stepCard.actionType ? supportedActionTypes.includes(stepCard.actionType.type) : false;
  }

  /**
   * 为步骤卡片推理参数
   */
  async inferParametersForStepCard(stepCard: StepCard): Promise<RuntimeInferenceResult> {
    try {
      console.log('🎯 [RuntimeInference] 开始推理步骤卡片参数', stepCard.id);

      // 检查必要数据
      if (!stepCard.xmlSnapshot) {
        return {
          status: 'failed',
          error: 'XML快照数据缺失'
        };
      }

      const xpath = stepCard.elementContext?.xpath;
      if (!xpath) {
        return {
          status: 'failed', 
          error: '步骤XPath缺失'
        };
      }

      // 调用现有的推理方法
      const result = await this.inferFromStepCard({
        id: stepCard.id,
        staticXPath: xpath,
        xmlSnapshot: typeof stepCard.xmlSnapshot === 'string' ? 
          stepCard.xmlSnapshot : 
          stepCard.xmlSnapshot.xmlContent || JSON.stringify(stepCard.xmlSnapshot),
        existingPlan: stepCard.structuralMatchPlan
      });

      if (result.success) {
        return {
          status: 'completed',
          plan: result.plan,
          stats: result.stats
        };
      } else {
        return {
          status: 'failed',
          error: result.error
        };
      }
    } catch (error) {
      console.error('❌ [RuntimeInference] 推理失败:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(
    stepCard: { id: string; staticXPath: string; xmlSnapshot: string },
    options: ParameterInferenceOptions
  ): string {
    const hash = this.generateHash(stepCard.xmlSnapshot);
    return `${stepCard.id}:${hash}:${options.mode}:${options.containerStrategy}`;
  }

  /**
   * 简单哈希生成
   */
  private generateHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 检查计划是否有效
   */
  private isPlanValid(plan: StructuralMatchPlan): boolean {
    try {
      // 基本字段检查
      if (!plan.version || !plan.selectedAnchor || !plan.containerGate) {
        return false;
      }

      // 版本检查
      if (plan.version !== 'smplan.v1') {
        return false;
      }

      // 时间有效性检查
      const generatedAt = new Date(plan.generatedAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60);

      return hoursDiff <= 24; // 24小时内有效
    } catch {
      return false;
    }
  }

  /**
   * 生成结构匹配计划
   */
  private generateStructuralMatchPlan(
    stepCard: {
      id: string;
      staticXPath: string;
      xmlSnapshot: string;
    },
    features: ElementStructuralFeatures,
    options: ParameterInferenceOptions
  ): StructuralMatchPlan {
    const now = new Date().toISOString();
    const snapshotHash = this.generateHash(stepCard.xmlSnapshot);

    return {
      version: 'smplan.v1',
      snapshotHash,
      generatedAt: now,
      sourceXPath: stepCard.staticXPath,
      
      selectedAnchor: {
        ancestorChain: features.ancestorChain.slice(-5).map((ancestor) => ({
          className: ancestor.tag,
          role: ancestor.attributes.class || 'unknown',
          depth: ancestor.depth,
          signature: this.generateElementSignature(ancestor)
        })),
        clickableParentSig: this.findClickableParentSignature(features.targetElement),
        selfSignature: this.generateElementSignature(features.targetElement)
      },
      
      containerGate: {
        containerXPath: features.containerElement?.xpath || '//*',
        fallbackMode: options.containerStrategy === 'nearest_scrollable' ? 'nearest_scrollable' : 'business_pane',
        gateMode: 'pre'
      },
      
      fieldMask: {
        text: this.inferTextStrategy(features.targetElement),
        contentDesc: this.inferContentDescStrategy(features.targetElement),
        resourceId: 'use',
        bounds: 'geom-iou',
        booleanFields: 'soft'
      },
      
      layoutGate: {
        normalizedCenter: [
          features.geometricFeatures.relativeBounds.x + features.geometricFeatures.relativeBounds.width / 2,
          features.geometricFeatures.relativeBounds.y + features.geometricFeatures.relativeBounds.height / 2
        ],
        normalizedSize: [
          features.geometricFeatures.relativeBounds.width,
          features.geometricFeatures.relativeBounds.height
        ],
        maxShift: this.calculateMaxShift(options.mode)
      },
      
      scoring: {
        weightsProfile: this.mapModeToProfile(options.mode),
        minConfidence: this.getMinConfidence(options.mode),
        topGap: 0.15,
        earlyStop: true
      }
    };
  }

  /**
   * 生成元素签名
   */
  private generateElementSignature(element: { tag: string; attributes: Record<string, string>; text?: string }): string {
    const parts = [
      element.tag,
      element.attributes['resource-id'] || '',
      element.attributes.class || '',
      element.text ? 'hasText' : ''
    ];
    return parts.filter(Boolean).join('|');
  }

  /**
   * 查找可点击父元素签名
   */
  private findClickableParentSignature(element: { parent: ParsedUIElement | null }): string {
    let current = element.parent;
    while (current) {
      if (current.attributes?.clickable === 'true') {
        return this.generateElementSignature(current);
      }
      current = current.parent;
    }
    return '';
  }

  /**
   * 推导文本策略
   */
  private inferTextStrategy(element: { text?: string }): "use" | "ignore-numeric" | "pattern-match" {
    if (!element.text) return 'use';
    
    // 检查是否包含数字（可能是易变内容）
    if (/\d/.test(element.text)) {
      return 'ignore-numeric';
    }
    
    return 'use';
  }

  /**
   * 推导内容描述策略
   */
  private inferContentDescStrategy(element: { attributes: Record<string, string> }): "use" | "ignore-numeric" | "pattern-match" {
    const contentDesc = element.attributes['content-desc'] || '';
    if (!contentDesc) return 'use';
    
    // 检查是否包含数字
    if (/\d/.test(contentDesc)) {
      return 'ignore-numeric';
    }
    
    return 'use';
  }

  /**
   * 计算最大漂移值
   */
  private calculateMaxShift(mode: string): number {
    switch (mode) {
      case 'conservative': return 0.05;
      case 'balanced': return 0.15;
      case 'aggressive': return 0.25;
      default: return 0.15;
    }
  }

  /**
   * 映射模式到权重配置
   */
  private mapModeToProfile(mode: string): "Speed" | "Default" | "Robust" {
    switch (mode) {
      case 'conservative': return 'Robust';
      case 'balanced': return 'Default';
      case 'aggressive': return 'Speed';
      default: return 'Default';
    }
  }

  /**
   * 获取最小置信度
   */
  private getMinConfidence(mode: string): number {
    switch (mode) {
      case 'conservative': return 0.8;
      case 'balanced': return 0.7;
      case 'aggressive': return 0.6;
      default: return 0.7;
    }
  }
}

// 默认实例
export const defaultRuntimeInferenceService = new RuntimeParameterInferenceService();

// 运行时推理状态枚举
export type RuntimeInferenceStatus = 'pending' | 'completed' | 'failed' | 'not_needed' | 'disabled';

// 运行时推理结果类型
export interface RuntimeInferenceResult {
  status: RuntimeInferenceStatus;
  plan?: StructuralMatchPlan;
  error?: string;
  stats?: {
    analysisTimeMs: number;
    elementsAnalyzed: number;
    featuresExtracted: number;
  };
}