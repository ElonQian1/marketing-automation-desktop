// src/modules/precise-acquisition/task-generation/templates/TaskTemplateManager.ts
// module: prospecting | layer: application | role: module-component
// summary: 模块组件

/**
 * 精准获客系统 - 任务模板系统
 * 
 * 管理回复模板、关注话术等，支持变量替换和敏感词检查
 */

import { TaskType, Platform } from '../../shared/constants';

// ==================== 模板核心类型 ====================

/**
 * 模板变量定义
 */
export interface TemplateVariable {
  name: string;                          // 变量名（如 comment_author）
  display_name: string;                  // 显示名称
  description: string;                   // 变量说明
  type: 'string' | 'number' | 'date' | 'custom'; // 变量类型
  default_value?: string;                // 默认值
  validation_pattern?: string;           // 验证正则
  is_required?: boolean;                 // 是否必需
}

/**
 * 模板应用条件
 */
export interface TemplateCondition {
  platforms?: Platform[];                // 适用平台
  keywords?: string[];                   // 触发关键词
  industries?: string[];                 // 适用行业
  regions?: string[];                    // 适用地区
  time_ranges?: Array<{                  // 时间范围
    start_hour: number;
    end_hour: number;
  }>;
  comment_length_range?: {               // 评论长度范围
    min: number;
    max: number;
  };
  interaction_threshold?: {              // 互动阈值
    min_likes: number;
    min_replies: number;
  };
}

/**
 * 任务模板
 */
export interface TaskTemplate {
  id: string;
  name: string;
  type: TaskType;
  category: string;                      // 模板分类
  description?: string;
  content_template: string;              // 模板内容
  variables: TemplateVariable[];         // 可用变量
  conditions?: TemplateCondition;        // 应用条件
  weight: number;                        // 选择权重
  is_active: boolean;                    // 是否启用
  created_at: Date;
  updated_at: Date;
  usage_count?: number;                  // 使用次数
  success_rate?: number;                 // 成功率
  tags?: string[];                       // 标签
}

/**
 * 模板渲染结果
 */
export interface TemplateRenderResult {
  success: boolean;
  rendered_content: string;
  used_variables: { [key: string]: string };
  warnings?: string[];
  errors?: string[];
  validation_results: {
    sensitive_words_found: string[];
    length_check: boolean;
    variable_check: boolean;
  };
}

/**
 * 模板匹配结果
 */
export interface TemplateMatchResult {
  template: TaskTemplate;
  match_score: number;                   // 匹配分数
  matched_conditions: string[];          // 匹配的条件
  context_relevance: number;             // 上下文相关性
}

// ==================== 敏感词检查 ====================

/**
 * 敏感词检查器
 */
export class SensitiveWordChecker {
  private sensitiveWords: Set<string>;
  private patterns: RegExp[];
  
  constructor() {
    this.sensitiveWords = new Set();
    this.patterns = [];
    this.initializeDefaultSensitiveWords();
  }
  
  /**
   * 检查文本中的敏感词
   */
  check(content: string): string[] {
    const foundWords: string[] = [];
    const normalizedContent = content.toLowerCase();
    
    // 检查完整敏感词
    for (const word of this.sensitiveWords) {
      if (normalizedContent.includes(word.toLowerCase())) {
        foundWords.push(word);
      }
    }
    
    // 检查正则模式
    for (const pattern of this.patterns) {
      const matches = normalizedContent.match(pattern);
      if (matches) {
        foundWords.push(...matches);
      }
    }
    
    return [...new Set(foundWords)];
  }
  
  /**
   * 添加敏感词
   */
  addSensitiveWord(word: string): void {
    this.sensitiveWords.add(word);
  }
  
  /**
   * 添加敏感词模式
   */
  addPattern(pattern: RegExp): void {
    this.patterns.push(pattern);
  }
  
  /**
   * 清理敏感词
   */
  cleanContent(content: string, replacement: string = '***'): string {
    let cleanedContent = content;
    
    // 替换敏感词
    for (const word of this.sensitiveWords) {
      const regex = new RegExp(word, 'gi');
      cleanedContent = cleanedContent.replace(regex, replacement);
    }
    
    // 替换模式匹配
    for (const pattern of this.patterns) {
      cleanedContent = cleanedContent.replace(pattern, replacement);
    }
    
    return cleanedContent;
  }
  
  private initializeDefaultSensitiveWords(): void {
    // 基础敏感词
    const defaultWords = [
      '加微信', '微信号', 'VX', 'vx', 'Vx',
      '私聊', '私信', 'QQ', 'qq',
      '广告', '推广', '营销', '刷粉',
      '代理', '招代理', '兼职', '赚钱',
      '投资', '理财', '股票', '基金',
      '贷款', '借钱', '网贷', '套现',
      '色情', '赌博', '毒品', '暴力'
    ];
    
    for (const word of defaultWords) {
      this.sensitiveWords.add(word);
    }
    
    // 添加一些常见模式
    this.patterns.push(
      /\d{11}/,                          // 手机号
      /\d{5,12}/,                        // QQ号
      /[a-zA-Z0-9]{6,20}@[a-zA-Z0-9]{2,10}\.[a-zA-Z]{2,4}/, // 邮箱
      /微信[:：]\s*[a-zA-Z0-9_-]+/,      // 微信号模式
      /VX[:：]\s*[a-zA-Z0-9_-]+/i        // VX号模式
    );
  }
}

// ==================== 变量替换器 ====================

/**
 * 模板变量替换器
 */
export class TemplateVariableReplacer {
  private variables: Map<string, any>;
  
  constructor() {
    this.variables = new Map();
  }
  
  /**
   * 设置变量值
   */
  setVariable(name: string, value: any): void {
    this.variables.set(name, value);
  }
  
  /**
   * 批量设置变量
   */
  setVariables(variables: { [key: string]: any }): void {
    for (const [name, value] of Object.entries(variables)) {
      this.variables.set(name, value);
    }
  }
  
  /**
   * 替换模板中的变量
   */
  replace(template: string, additionalVars?: { [key: string]: any }): {
    result: string;
    usedVariables: { [key: string]: string };
    missingVariables: string[];
  } {
    let result = template;
    const usedVariables: { [key: string]: string } = {};
    const missingVariables: string[] = [];
    
    // 合并变量
    const allVariables = new Map(this.variables);
    if (additionalVars) {
      for (const [key, value] of Object.entries(additionalVars)) {
        allVariables.set(key, value);
      }
    }
    
    // 查找所有变量引用
    const variablePattern = /\{([^}]+)\}/g;
    let match;
    
    while ((match = variablePattern.exec(template)) !== null) {
      const variableName = match[1];
      const fullMatch = match[0];
      
      if (allVariables.has(variableName)) {
        const value = String(allVariables.get(variableName));
        result = result.replace(fullMatch, value);
        usedVariables[variableName] = value;
      } else {
        missingVariables.push(variableName);
      }
    }
    
    return {
      result,
      usedVariables,
      missingVariables: [...new Set(missingVariables)]
    };
  }
  
  /**
   * 验证模板变量
   */
  validateTemplate(template: string, requiredVariables: TemplateVariable[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // 检查必需变量
    for (const variable of requiredVariables) {
      if (variable.is_required) {
        const pattern = new RegExp(`\\{${variable.name}\\}`);
        if (!pattern.test(template)) {
          errors.push(`缺少必需变量: {${variable.name}}`);
        }
      }
    }
    
    // 检查未定义变量
    const variablePattern = /\{([^}]+)\}/g;
    let match;
    
    while ((match = variablePattern.exec(template)) !== null) {
      const variableName = match[1];
      const variableExists = requiredVariables.some(v => v.name === variableName);
      
      if (!variableExists) {
        errors.push(`未定义的变量: {${variableName}}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// ==================== 模板管理器 ====================

/**
 * 任务模板管理器
 */
export class TaskTemplateManager {
  private templates: Map<string, TaskTemplate>;
  private sensitiveWordChecker: SensitiveWordChecker;
  private variableReplacer: TemplateVariableReplacer;
  
  constructor() {
    this.templates = new Map();
    this.sensitiveWordChecker = new SensitiveWordChecker();
    this.variableReplacer = new TemplateVariableReplacer();
    this.initializeDefaultTemplates();
  }
  
  /**
   * 添加模板
   */
  addTemplate(template: TaskTemplate): void {
    template.updated_at = new Date();
    this.templates.set(template.id, template);
  }
  
  /**
   * 获取模板
   */
  getTemplate(id: string): TaskTemplate | undefined {
    return this.templates.get(id);
  }
  
  /**
   * 获取指定类型的所有模板
   */
  getTemplatesByType(type: TaskType): TaskTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.type === type && template.is_active);
  }
  
  /**
   * 根据条件匹配模板
   */
  matchTemplates(
    type: TaskType,
    context: {
      platform?: Platform;
      content?: string;
      keywords?: string[];
      industry?: string;
      region?: string;
    }
  ): TemplateMatchResult[] {
    const candidates = this.getTemplatesByType(type);
    const results: TemplateMatchResult[] = [];
    
    for (const template of candidates) {
      const matchScore = this.calculateMatchScore(template, context);
      
      if (matchScore > 0) {
        results.push({
          template,
          match_score: matchScore,
          matched_conditions: this.getMatchedConditions(template, context),
          context_relevance: this.calculateContextRelevance(template, context)
        });
      }
    }
    
    // 按匹配分数排序
    return results.sort((a, b) => b.match_score - a.match_score);
  }
  
  /**
   * 渲染模板
   */
  renderTemplate(
    templateId: string,
    variables: { [key: string]: any },
    options: {
      checkSensitiveWords?: boolean;
      maxLength?: number;
    } = {}
  ): TemplateRenderResult {
    const template = this.templates.get(templateId);
    
    if (!template) {
      return {
        success: false,
        rendered_content: '',
        used_variables: {},
        errors: [`模板不存在: ${templateId}`],
        validation_results: {
          sensitive_words_found: [],
          length_check: false,
          variable_check: false
        }
      };
    }
    
    const result: TemplateRenderResult = {
      success: true,
      rendered_content: '',
      used_variables: {},
      warnings: [],
      errors: [],
      validation_results: {
        sensitive_words_found: [],
        length_check: true,
        variable_check: true
      }
    };
    
    try {
      // 替换变量
      const replacement = this.variableReplacer.replace(template.content_template, variables);
      result.rendered_content = replacement.result;
      result.used_variables = replacement.usedVariables;
      
      // 检查缺失变量
      if (replacement.missingVariables.length > 0) {
        result.validation_results.variable_check = false;
        result.warnings?.push(`缺失变量: ${replacement.missingVariables.join(', ')}`);
      }
      
      // 敏感词检查
      if (options.checkSensitiveWords !== false) {
        const sensitiveWords = this.sensitiveWordChecker.check(result.rendered_content);
        result.validation_results.sensitive_words_found = sensitiveWords;
        
        if (sensitiveWords.length > 0) {
          result.warnings?.push(`发现敏感词: ${sensitiveWords.join(', ')}`);
        }
      }
      
      // 长度检查
      if (options.maxLength && result.rendered_content.length > options.maxLength) {
        result.validation_results.length_check = false;
        result.warnings?.push(`内容长度超限: ${result.rendered_content.length}/${options.maxLength}`);
      }
      
      // 更新使用统计
      template.usage_count = (template.usage_count || 0) + 1;
      
    } catch (error) {
      result.success = false;
      result.errors?.push(error instanceof Error ? error.message : '渲染失败');
    }
    
    return result;
  }
  
  /**
   * 删除模板
   */
  deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  }
  
  /**
   * 更新模板
   */
  updateTemplate(id: string, updates: Partial<TaskTemplate>): boolean {
    const template = this.templates.get(id);
    if (!template) return false;
    
    Object.assign(template, updates, { updated_at: new Date() });
    return true;
  }
  
  /**
   * 获取所有模板
   */
  getAllTemplates(): TaskTemplate[] {
    return Array.from(this.templates.values());
  }
  
  /**
   * 清理敏感词内容
   */
  cleanSensitiveWords(content: string): string {
    return this.sensitiveWordChecker.cleanContent(content);
  }
  
  // ==================== 私有方法 ====================
  
  private calculateMatchScore(template: TaskTemplate, context: any): number {
    let score = template.weight || 1;
    const conditions = template.conditions;
    
    if (!conditions) return score;
    
    // 平台匹配
    if (conditions.platforms && context.platform) {
      if (conditions.platforms.includes(context.platform)) {
        score += 10;
      } else {
        return 0; // 平台不匹配直接排除
      }
    }
    
    // 关键词匹配
    if (conditions.keywords && context.content) {
      const matchedKeywords = conditions.keywords.filter(keyword =>
        context.content.toLowerCase().includes(keyword.toLowerCase())
      );
      score += matchedKeywords.length * 5;
    }
    
    // 行业匹配
    if (conditions.industries && context.industry) {
      if (conditions.industries.includes(context.industry)) {
        score += 8;
      }
    }
    
    // 地区匹配
    if (conditions.regions && context.region) {
      if (conditions.regions.includes(context.region)) {
        score += 5;
      }
    }
    
    return score;
  }
  
  private getMatchedConditions(template: TaskTemplate, context: any): string[] {
    const matched: string[] = [];
    const conditions = template.conditions;
    
    if (!conditions) return matched;
    
    if (conditions.platforms && context.platform && conditions.platforms.includes(context.platform)) {
      matched.push('platform');
    }
    
    if (conditions.keywords && context.content) {
      const hasKeywords = conditions.keywords.some(keyword =>
        context.content.toLowerCase().includes(keyword.toLowerCase())
      );
      if (hasKeywords) matched.push('keywords');
    }
    
    if (conditions.industries && context.industry && conditions.industries.includes(context.industry)) {
      matched.push('industry');
    }
    
    if (conditions.regions && context.region && conditions.regions.includes(context.region)) {
      matched.push('region');
    }
    
    return matched;
  }
  
  private calculateContextRelevance(template: TaskTemplate, context: any): number {
    // TODO: 实现更复杂的上下文相关性计算
    return 0.5;
  }
  
  private initializeDefaultTemplates(): void {
    // 默认回复模板
    const defaultReplyTemplates: TaskTemplate[] = [
      {
        id: 'reply_thank',
        name: '感谢回复',
        type: TaskType.REPLY,
        category: '友好回复',
        description: '对积极评论表示感谢',
        content_template: '感谢您的支持！{random_emoji} 您的反馈对我们很重要。',
        variables: [
          {
            name: 'random_emoji',
            display_name: '随机表情',
            description: '随机选择的表情符号',
            type: 'custom',
            default_value: '😊'
          }
        ],
        weight: 5,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 0
      },
      {
        id: 'reply_helpful',
        name: '有用回复',
        type: TaskType.REPLY,
        category: '友好回复',
        description: '回复认为内容有用的评论',
        content_template: '很高兴这个内容对您有帮助！{random_emoji} 如果有其他问题欢迎交流。',
        variables: [
          {
            name: 'random_emoji',
            display_name: '随机表情',
            description: '随机选择的表情符号',
            type: 'custom',
            default_value: '👍'
          }
        ],
        weight: 4,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 0
      },
      {
        id: 'reply_question',
        name: '问题回复',
        type: TaskType.REPLY,
        category: '问答回复',
        description: '回复提问类评论',
        content_template: '这是个好问题！{random_emoji} 简单来说就是{comment_content}相关的内容，希望对您有帮助。',
        variables: [
          {
            name: 'comment_content',
            display_name: '评论内容',
            description: '原评论的内容摘要',
            type: 'string',
            is_required: true
          },
          {
            name: 'random_emoji',
            display_name: '随机表情',
            description: '随机选择的表情符号',
            type: 'custom',
            default_value: '💡'
          }
        ],
        conditions: {
          keywords: ['怎么', '如何', '为什么', '什么', '？', '?']
        },
        weight: 6,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 0
      }
    ];
    
    // 添加默认模板
    for (const template of defaultReplyTemplates) {
      this.templates.set(template.id, template);
    }
    
    // 设置默认变量
    this.variableReplacer.setVariables({
      current_time: new Date().toLocaleString(),
      random_emoji: '😊'
    });
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建模板管理器
 */
export function createTaskTemplateManager(): TaskTemplateManager {
  return new TaskTemplateManager();
}

/**
 * 创建敏感词检查器
 */
export function createSensitiveWordChecker(): SensitiveWordChecker {
  return new SensitiveWordChecker();
}

/**
 * 创建变量替换器
 */
export function createTemplateVariableReplacer(): TemplateVariableReplacer {
  return new TemplateVariableReplacer();
}