// src/modules/structural-matching/domain/services/enhanced-data-validator.ts
// module: structural-matching | layer: domain | role: 增强数据验证器
// summary: 提供业务规则验证、数据标准化和质量检查

import { UnifiedElementData } from './structural-matching-data-provider';

/**
 * 验证规则配置
 */
export interface ValidationRuleConfig {
  // 基础验证
  requireId: boolean;
  requireBounds: boolean;
  requireType: boolean;
  
  // 业务规则验证
  validateSemanticConsistency: boolean;
  validateStructuralIntegrity: boolean;
  validateAccessibilityInfo: boolean;
  
  // 数据质量检查
  checkDataCompleteness: boolean;
  checkDataFreshness: boolean;
  validateAgainstSchema: boolean;
  
  // 性能阈值
  maxValidationTime: number; // 毫秒
  enableDetailedReporting: boolean;
}

/**
 * 验证结果详情
 */
export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100 数据质量评分
  
  // 错误分类
  criticalErrors: ValidationError[];
  warnings: ValidationError[];
  suggestions: ValidationSuggestion[];
  
  // 性能指标
  validationTime: number;
  rulesExecuted: number;
  
  // 数据质量报告
  qualityReport: DataQualityReport;
  
  // 修复建议
  repairActions: RepairAction[];
}

/**
 * 验证错误
 */
export interface ValidationError {
  code: string;
  message: string;
  field: string;
  severity: 'critical' | 'warning' | 'info';
  context: Record<string, unknown>;
  suggestedFix?: string;
}

/**
 * 验证建议
 */
export interface ValidationSuggestion {
  type: 'enhancement' | 'standardization' | 'optimization';
  message: string;
  benefit: string;
  implementation: string;
}

/**
 * 数据质量报告
 */
export interface DataQualityReport {
  completeness: number; // 0-100
  accuracy: number;
  consistency: number;
  accessibility: number;
  freshness: number;
  
  // 详细指标
  metrics: {
    hasRequiredFields: boolean;
    hasValidBounds: boolean;
    hasSemanticInfo: boolean;
    hasAccessibilityLabels: boolean;
    dataAge: number; // 毫秒
  };
}

/**
 * 修复操作
 */
export interface RepairAction {
  type: 'auto' | 'manual' | 'assisted';
  description: string;
  confidence: number; // 0-1 修复成功概率
  estimatedTime: number; // 毫秒
  execute?: () => Promise<UnifiedElementData>;
}

/**
 * 增强数据验证器
 * 
 * 特性：
 * - 多维度数据验证
 * - 业务规则检查
 * - 数据质量评估
 * - 自动修复建议
 * - 性能优化
 */
export class EnhancedDataValidator {
  private config: ValidationRuleConfig;
  private validationCache = new Map<string, ValidationResult>();
  
  constructor(config: Partial<ValidationRuleConfig> = {}) {
    this.config = {
      // 基础验证默认值
      requireId: true,
      requireBounds: true,
      requireType: false,
      
      // 业务规则默认值
      validateSemanticConsistency: true,
      validateStructuralIntegrity: true,
      validateAccessibilityInfo: true,
      
      // 数据质量默认值
      checkDataCompleteness: true,
      checkDataFreshness: true,
      validateAgainstSchema: true,
      
      // 性能设置
      maxValidationTime: 100, // 100ms
      enableDetailedReporting: true,
      
      ...config
    };
  }

  /**
   * 验证统一元素数据
   */
  async validateElementData(data: UnifiedElementData): Promise<ValidationResult> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(data);
    
    // 检查缓存
    const cached = this.validationCache.get(cacheKey);
    if (cached && this.isCacheValid(cached, data)) {
      return cached;
    }
    
    console.log('🔍 [EnhancedValidator] 开始数据验证:', {
      elementId: data.id,
      dataSource: data.dataSource.type,
      cacheKey: cacheKey.substring(0, 8)
    });
    
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: ValidationSuggestion[] = [];
    
    // 执行验证规则
    const rulesExecuted = await this.executeValidationRules(data, errors, warnings, suggestions);
    
    // 生成数据质量报告
    const qualityReport = this.generateQualityReport(data, errors, warnings);
    
    // 生成修复建议
    const repairActions = this.generateRepairActions(errors, warnings, data);
    
    // 计算总体评分
    const score = this.calculateQualityScore(qualityReport, errors, warnings);
    
    const validationTime = performance.now() - startTime;
    
    const result: ValidationResult = {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      score,
      criticalErrors: errors.filter(e => e.severity === 'critical'),
      warnings: errors.filter(e => e.severity === 'warning'),
      suggestions,
      validationTime,
      rulesExecuted,
      qualityReport,
      repairActions
    };
    
    // 缓存结果
    this.validationCache.set(cacheKey, result);
    
    console.log('✅ [EnhancedValidator] 验证完成:', {
      isValid: result.isValid,
      score: result.score,
      errors: result.criticalErrors.length,
      warnings: result.warnings.length,
      time: validationTime.toFixed(2) + 'ms'
    });
    
    return result;
  }

  /**
   * 执行验证规则
   */
  private async executeValidationRules(
    data: UnifiedElementData,
    errors: ValidationError[],
    warnings: ValidationError[],
    suggestions: ValidationSuggestion[]
  ): Promise<number> {
    let rulesExecuted = 0;
    
    // 基础验证规则
    if (this.config.requireId) {
      rulesExecuted++;
      if (!data.element.id || data.element.id.trim() === '') {
        errors.push({
          code: 'MISSING_ID',
          message: '元素缺少有效的ID',
          field: 'element.id',
          severity: 'critical',
          context: { currentId: data.element.id },
          suggestedFix: '为元素分配唯一ID'
        });
      }
    }
    
    if (this.config.requireBounds) {
      rulesExecuted++;
      if (!data.element.bounds && !data.element.position) {
        errors.push({
          code: 'MISSING_BOUNDS',
          message: '元素缺少位置信息',
          field: 'element.bounds',
          severity: 'critical',
          context: { 
            hasBounds: !!data.element.bounds,
            hasPosition: !!data.element.position
          },
          suggestedFix: '添加元素边界或位置信息'
        });
      } else if (data.element.bounds && !this.isValidBounds(data.element.bounds)) {
        warnings.push({
          code: 'INVALID_BOUNDS_FORMAT',
          message: '元素边界格式无效',
          field: 'element.bounds',
          severity: 'warning',
          context: { bounds: data.element.bounds },
          suggestedFix: '使用标准边界格式 [x1,y1][x2,y2]'
        });
      }
    }
    
    // 业务规则验证
    if (this.config.validateSemanticConsistency) {
      rulesExecuted++;
      await this.validateSemanticConsistency(data, warnings, suggestions);
    }
    
    if (this.config.validateStructuralIntegrity) {
      rulesExecuted++;
      this.validateStructuralIntegrity(data, warnings, suggestions);
    }
    
    if (this.config.validateAccessibilityInfo) {
      rulesExecuted++;
      this.validateAccessibilityInfo(data, warnings, suggestions);
    }
    
    // 数据质量检查
    if (this.config.checkDataCompleteness) {
      rulesExecuted++;
      this.checkDataCompleteness(data, warnings, suggestions);
    }
    
    if (this.config.checkDataFreshness) {
      rulesExecuted++;
      this.checkDataFreshness(data, warnings);
    }
    
    return rulesExecuted;
  }

  /**
   * 验证语义一致性
   */
  private async validateSemanticConsistency(
    data: UnifiedElementData,
    warnings: ValidationError[],
    suggestions: ValidationSuggestion[]
  ): Promise<void> {
    const element = data.element;
    
    // 检查文本和内容描述的一致性
    if (element.text && element.contentDesc) {
      const textWords = element.text.toLowerCase().split(/\s+/);
      const descWords = element.contentDesc.toLowerCase().split(/\s+/);
      
      const commonWords = textWords.filter(word => descWords.includes(word));
      if (commonWords.length === 0 && element.text.length > 0 && element.contentDesc.length > 0) {
        warnings.push({
          code: 'SEMANTIC_INCONSISTENCY',
          message: '元素文本与内容描述语义不一致',
          field: 'element.text,element.contentDesc',
          severity: 'warning',
          context: { text: element.text, contentDesc: element.contentDesc },
          suggestedFix: '确保文本和描述语义相关'
        });
      }
    }
    
    // 检查类型与内容的匹配度
    if (element.type && element.text) {
      const isButton = element.type.toLowerCase().includes('button');
      const hasActionText = /^(点击|确定|取消|保存|删除|提交|登录)/.test(element.text);
      
      if (isButton && !hasActionText && element.text.length > 0) {
        suggestions.push({
          type: 'enhancement',
          message: '按钮元素建议使用行为动词',
          benefit: '提高用户体验和可访问性',
          implementation: '使用如"点击提交"而非"提交按钮"'
        });
      }
    }
  }

  /**
   * 验证结构完整性
   */
  private validateStructuralIntegrity(
    data: UnifiedElementData,
    warnings: ValidationError[],
    suggestions: ValidationSuggestion[]
  ): void {
    const element = data.element;
    
    // 检查关键属性缺失
    const keyAttributes = ['type', 'className', 'resourceId'];
    const missingAttributes = keyAttributes.filter(attr => !element[attr as keyof typeof element]);
    
    if (missingAttributes.length > 2) {
      warnings.push({
        code: 'INSUFFICIENT_ATTRIBUTES',
        message: '元素缺少足够的标识属性',
        field: missingAttributes.join(','),
        severity: 'warning',
        context: { missingAttributes, availableAttributes: Object.keys(element) },
        suggestedFix: '添加更多标识属性如className或resourceId'
      });
    }
    
    // 检查XML索引一致性
    if (element.xmlIndex !== undefined && data.id) {
      const expectedIndex = this.extractIndexFromId(data.id);
      if (expectedIndex !== null && expectedIndex !== element.xmlIndex) {
        warnings.push({
          code: 'INDEX_MISMATCH',
          message: 'XML索引与元素ID不匹配',
          field: 'element.xmlIndex',
          severity: 'warning',
          context: { xmlIndex: element.xmlIndex, expectedIndex },
          suggestedFix: '确保XML索引与元素ID一致'
        });
      }
    }
  }

  /**
   * 验证可访问性信息
   */
  private validateAccessibilityInfo(
    data: UnifiedElementData,
    warnings: ValidationError[],
    suggestions: ValidationSuggestion[]
  ): void {
    const element = data.element;
    
    // 检查可访问性标签
    if (element.clickable && !element.text && !element.contentDesc) {
      warnings.push({
        code: 'MISSING_ACCESSIBILITY_LABEL',
        message: '可交互元素缺少可访问性标签',
        field: 'element.text,element.contentDesc',
        severity: 'warning',
        context: { clickable: element.clickable },
        suggestedFix: '为可交互元素添加文本或内容描述'
      });
    }
    
    // 检查ARIA属性（如果有的话）
    if (element.resourceId && element.resourceId.includes('accessibility')) {
      suggestions.push({
        type: 'enhancement',
        message: '发现可访问性相关的资源ID',
        benefit: '提高辅助技术支持',
        implementation: '确保相关ARIA属性正确设置'
      });
    }
  }

  /**
   * 检查数据完整性
   */
  private checkDataCompleteness(
    data: UnifiedElementData,
    warnings: ValidationError[],
    suggestions: ValidationSuggestion[]
  ): void {
    const completenessScore = this.calculateCompleteness(data);
    
    if (completenessScore < 60) {
      warnings.push({
        code: 'LOW_DATA_COMPLETENESS',
        message: `数据完整性较低 (${completenessScore}%)`,
        field: 'data',
        severity: 'warning',
        context: { completenessScore },
        suggestedFix: '补充缺失的元素属性'
      });
    }
    
    if (completenessScore > 90) {
      suggestions.push({
        type: 'optimization',
        message: '数据完整性excellent',
        benefit: '提供最佳匹配精度',
        implementation: '保持当前数据质量'
      });
    }
  }

  /**
   * 检查数据新鲜度
   */
  private checkDataFreshness(
    data: UnifiedElementData,
    warnings: ValidationError[]
  ): void {
    const dataAge = Date.now() - data.dataSource.timestamp;
    const maxAge = 5 * 60 * 1000; // 5分钟
    
    if (dataAge > maxAge) {
      warnings.push({
        code: 'STALE_DATA',
        message: '数据可能已过期',
        field: 'dataSource.timestamp',
        severity: 'warning',
        context: { 
          dataAge: Math.round(dataAge / 1000), 
          maxAge: Math.round(maxAge / 1000) 
        },
        suggestedFix: '刷新获取最新数据'
      });
    }
  }

  /**
   * 生成数据质量报告
   */
  private generateQualityReport(
    data: UnifiedElementData,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): DataQualityReport {
    const completeness = this.calculateCompleteness(data);
    const accuracy = this.calculateAccuracy(data, errors);
    const consistency = this.calculateConsistency(data, warnings);
    const accessibility = this.calculateAccessibility(data);
    const freshness = this.calculateFreshness(data);
    
    return {
      completeness,
      accuracy,
      consistency,
      accessibility,
      freshness,
      metrics: {
        hasRequiredFields: !!data.element.id && (!!data.element.bounds || !!data.element.position),
        hasValidBounds: this.isValidBounds(data.element.bounds),
        hasSemanticInfo: !!(data.element.text || data.element.contentDesc),
        hasAccessibilityLabels: !!(data.element.contentDesc || data.element.text),
        dataAge: Date.now() - data.dataSource.timestamp
      }
    };
  }

  /**
   * 生成修复建议
   */
  private generateRepairActions(
    errors: ValidationError[],
    warnings: ValidationError[],
    data: UnifiedElementData
  ): RepairAction[] {
    const actions: RepairAction[] = [];
    
    // 自动修复ID
    const idError = errors.find(e => e.code === 'MISSING_ID');
    if (idError) {
      actions.push({
        type: 'auto',
        description: '自动生成元素ID',
        confidence: 0.95,
        estimatedTime: 1,
        execute: async () => ({
          ...data,
          id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          element: {
            ...data.element,
            id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
          }
        })
      });
    }
    
    // 边界格式修复
    const boundsWarning = warnings.find(w => w.code === 'INVALID_BOUNDS_FORMAT');
    if (boundsWarning) {
      actions.push({
        type: 'assisted',
        description: '修复边界格式',
        confidence: 0.8,
        estimatedTime: 10,
        execute: async () => ({
          ...data,
          element: {
            ...data.element,
            bounds: this.normalizeBounds(data.element.bounds)
          }
        })
      });
    }
    
    return actions;
  }

  /**
   * 工具方法
   */
  private isValidBounds(bounds?: string): boolean {
    if (!bounds) return false;
    return /^\[\d+,\d+\]\[\d+,\d+\]$/.test(bounds);
  }

  private extractIndexFromId(id: string): number | null {
    const match = id.match(/element[_-](\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  private calculateCompleteness(data: UnifiedElementData): number {
    const fields = [
      data.element.id,
      data.element.type,
      data.element.bounds || data.element.position,
      data.element.text || data.element.contentDesc,
      data.element.className || data.element.resourceId
    ];
    
    const filledFields = fields.filter(field => field && field !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  }

  private calculateAccuracy(data: UnifiedElementData, errors: ValidationError[]): number {
    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    return Math.max(0, 100 - (criticalErrors * 25));
  }

  private calculateConsistency(data: UnifiedElementData, warnings: ValidationError[]): number {
    const consistencyIssues = warnings.filter(w => 
      w.code.includes('INCONSISTENCY') || w.code.includes('MISMATCH')
    ).length;
    return Math.max(0, 100 - (consistencyIssues * 20));
  }

  private calculateAccessibility(data: UnifiedElementData): number {
    let score = 50; // 基础分
    
    if (data.element.text || data.element.contentDesc) score += 25;
    if (data.element.contentDesc) score += 15;
    if (data.element.resourceId) score += 10;
    
    return Math.min(100, score);
  }

  private calculateFreshness(data: UnifiedElementData): number {
    const age = Date.now() - data.dataSource.timestamp;
    const maxAge = 5 * 60 * 1000; // 5分钟
    
    return Math.max(0, 100 - (age / maxAge) * 100);
  }

  private calculateQualityScore(
    report: DataQualityReport,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): number {
    const baseScore = (
      report.completeness * 0.3 +
      report.accuracy * 0.25 +
      report.consistency * 0.2 +
      report.accessibility * 0.15 +
      report.freshness * 0.1
    );
    
    // 错误惩罚
    const errorPenalty = errors.filter(e => e.severity === 'critical').length * 10;
    const warningPenalty = warnings.length * 2;
    
    return Math.max(0, Math.round(baseScore - errorPenalty - warningPenalty));
  }

  private normalizeBounds(bounds?: string): string {
    if (!bounds) return '[0,0][0,0]';
    
    // 尝试解析和规范化边界
    const nums = bounds.match(/\d+/g);
    if (nums && nums.length >= 4) {
      return `[${nums[0]},${nums[1]}][${nums[2]},${nums[3]}]`;
    }
    
    return bounds;
  }

  private generateCacheKey(data: UnifiedElementData): string {
    return `${data.id}_${data.dataSource.type}_${data.dataSource.timestamp}`;
  }

  private isCacheValid(cached: ValidationResult, data: UnifiedElementData): boolean {
    const cacheAge = Date.now() - (cached as any).cacheTimestamp;
    const maxCacheAge = 2 * 60 * 1000; // 2分钟
    
    return cacheAge < maxCacheAge;
  }

  /**
   * 清理过期缓存
   */
  public cleanupCache(): void {
    // 简单的缓存清理策略
    if (this.validationCache.size > 100) {
      this.validationCache.clear();
    }
  }
}

export default EnhancedDataValidator;