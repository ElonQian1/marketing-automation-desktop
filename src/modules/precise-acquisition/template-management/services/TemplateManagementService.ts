/**
 * 话术模板管理服务
 * 
 * 基于文档：round_2_｜候选池字段清单（v_1_）.md
 * 实现话术模板的CRUD、变量处理、敏感词检查等功能
 */

import { 
  ReplyTemplate,
  Platform,
  IndustryTag 
} from '../../shared/types/core';

// 从枚举常量导入
import { TemplateChannel } from '../../../../constants/precise-acquisition-enums';

/**
 * 模板变量定义
 */
export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
  required: boolean;
}

/**
 * 模板分类定义
 */
export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  industry_tags?: IndustryTag[];
}

/**
 * 敏感词检查结果
 */
export interface SensitiveWordCheckResult {
  passed: boolean;
  blocked_words: string[];
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestions?: string[];
}

/**
 * 模板生成上下文
 */
export interface TemplateContext {
  nickname?: string;
  topic?: string;
  industry?: IndustryTag;
  region?: string;
  custom_fields?: Record<string, string>;
}

/**
 * 模板生成结果
 */
export interface TemplateRenderResult {
  content: string;
  variables_used: string[];
  missing_variables: string[];
  sensitive_check: SensitiveWordCheckResult;
}

/**
 * 话术模板管理服务
 */
export class TemplateManagementService {
  
  // 内置变量定义
  private readonly builtInVariables: TemplateVariable[] = [
    {
      name: 'nickname',
      description: '用户昵称',
      example: '@小明',
      required: false
    },
    {
      name: 'topic',
      description: '话题或内容主题',
      example: '口腔护理',
      required: false
    },
    {
      name: 'industry',
      description: '行业标签',
      example: '医疗健康',
      required: false
    },
    {
      name: 'region', 
      description: '地区信息',
      example: '华东',
      required: false
    },
    {
      name: 'time',
      description: '当前时间',
      example: '上午好',
      required: false
    }
  ];

  // 敏感词列表（示例）
  private readonly sensitiveWords: string[] = [
    '免费', '限时', '立即', '马上', '赚钱', '投资', '理财',
    '加微信', '扫码', '点击链接', '私聊', '内部消息'
  ];

  // 默认分类
  private readonly defaultCategories: TemplateCategory[] = [
    {
      id: 'general',
      name: '通用模板',
      description: '适用于所有行业的通用话术'
    },
    {
      id: 'professional',
      name: '专业模板', 
      description: '针对特定行业的专业话术',
      industry_tags: [IndustryTag.ORAL_CARE, IndustryTag.MEDICAL_HEALTH]
    },
    {
      id: 'follow_up',
      name: '跟进模板',
      description: '用于后续跟进的话术'
    },
    {
      id: 'greeting',
      name: '问候模板',
      description: '初次接触的问候话术'
    }
  ];

  /**
   * 创建话术模板
   */
  async createTemplate(template: Omit<ReplyTemplate, 'id' | 'updated_at'>): Promise<ReplyTemplate> {
    // 验证模板内容
    const validation = this.validateTemplate(template);
    if (!validation.valid) {
      throw new Error(`模板验证失败: ${validation.errors.join(', ')}`);
    }

    // 敏感词检查
    const sensitiveCheck = this.checkSensitiveWords(template.text);
    if (!sensitiveCheck.passed && sensitiveCheck.risk_level === 'HIGH') {
      throw new Error(`模板包含高风险敏感词: ${sensitiveCheck.blocked_words.join(', ')}`);
    }

    const newTemplate: ReplyTemplate = {
      id: this.generateTemplateId(),
      template_name: template.template_name,
      channel: template.channel,
      text: template.text,
      variables: template.variables,
      category: template.category,
      enabled: template.enabled,
      updated_at: new Date()
    };

    // TODO: 保存到数据库
    console.log('创建模板:', newTemplate);
    
    return newTemplate;
  }

  /**
   * 获取模板列表
   */
  async getTemplates(options: {
    channel?: Platform | 'all';
    category?: string;
    enabled?: boolean;
    keyword?: string;
  } = {}): Promise<ReplyTemplate[]> {
    // TODO: 从数据库查询
    // 这里返回示例数据
    const sampleTemplates: ReplyTemplate[] = [
      {
        id: 'tpl_001',
        template_name: '基础问候',
        channel: 'all',
        text: '你好 @{{nickname}}，看到你对{{topic}}很感兴趣，我这边有一些专业建议可以分享给你',
        variables: ['nickname', 'topic'],
        category: 'greeting',
        enabled: true,
        updated_at: new Date()
      },
      {
        id: 'tpl_002', 
        template_name: '口腔护理专业回复',
        channel: Platform.DOUYIN,
        text: '关于{{topic}}的问题，作为专业的口腔护理师，我建议...',
        variables: ['topic'],
        category: 'professional',
        enabled: true,
        updated_at: new Date()
      }
    ];

    return sampleTemplates.filter(template => {
      if (options.channel && options.channel !== 'all' && template.channel !== options.channel && template.channel !== 'all') {
        return false;
      }
      if (options.category && template.category !== options.category) {
        return false;
      }
      if (options.enabled !== undefined && template.enabled !== options.enabled) {
        return false;
      }
      if (options.keyword) {
        const keyword = options.keyword.toLowerCase();
        return template.template_name.toLowerCase().includes(keyword) || 
               template.text.toLowerCase().includes(keyword);
      }
      return true;
    });
  }

  /**
   * 渲染模板
   */
  async renderTemplate(templateId: string, context: TemplateContext): Promise<TemplateRenderResult> {
    // TODO: 从数据库获取模板
    const templates = await this.getTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error(`模板 ${templateId} 不存在`);
    }

    if (!template.enabled) {
      throw new Error(`模板 ${templateId} 已被禁用`);
    }

    let content = template.text;
    const variablesUsed: string[] = [];
    const missingVariables: string[] = [];

    // 处理变量替换
    const variablePattern = /\{\{(\w+)\}\}/g;
    content = content.replace(variablePattern, (match, variableName) => {
      variablesUsed.push(variableName);
      
      // 优先使用自定义字段
      if (context.custom_fields && context.custom_fields[variableName]) {
        return context.custom_fields[variableName];
      }
      
      // 使用预定义上下文
      switch (variableName) {
        case 'nickname':
          return context.nickname ? `@${context.nickname}` : '@朋友';
        case 'topic':
          return context.topic || '这个话题';
        case 'industry':
          return context.industry || '相关领域';
        case 'region':
          return context.region || '您的地区';
        case 'time':
          return this.getTimeGreeting();
        default:
          missingVariables.push(variableName);
          return match; // 保持原样
      }
    });

    // 敏感词检查
    const sensitiveCheck = this.checkSensitiveWords(content);

    return {
      content,
      variables_used: [...new Set(variablesUsed)],
      missing_variables: [...new Set(missingVariables)],
      sensitive_check: sensitiveCheck
    };
  }

  /**
   * 批量渲染模板
   */
  async batchRenderTemplates(
    templateId: string, 
    contexts: TemplateContext[]
  ): Promise<TemplateRenderResult[]> {
    const results: TemplateRenderResult[] = [];
    
    for (const context of contexts) {
      try {
        const result = await this.renderTemplate(templateId, context);
        results.push(result);
      } catch (error) {
        results.push({
          content: '',
          variables_used: [],
          missing_variables: [],
          sensitive_check: {
            passed: false,
            blocked_words: [],
            risk_level: 'HIGH'
          }
        });
      }
    }
    
    return results;
  }

  /**
   * 获取可用变量列表
   */
  getAvailableVariables(): TemplateVariable[] {
    return [...this.builtInVariables];
  }

  /**
   * 获取模板分类
   */
  getCategories(): TemplateCategory[] {
    return [...this.defaultCategories];
  }

  /**
   * 检查敏感词
   */
  checkSensitiveWords(text: string): SensitiveWordCheckResult {
    const lowerText = text.toLowerCase();
    const blockedWords = this.sensitiveWords.filter(word => 
      lowerText.includes(word.toLowerCase())
    );

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (blockedWords.length > 0) {
      riskLevel = blockedWords.length >= 3 ? 'HIGH' : 'MEDIUM';
    }

    return {
      passed: blockedWords.length === 0,
      blocked_words: blockedWords,
      risk_level: riskLevel,
      suggestions: blockedWords.length > 0 ? [
        '建议使用更自然的表达方式',
        '避免过于商业化的词汇',
        '专注于提供有价值的内容'
      ] : undefined
    };
  }

  /**
   * 验证模板
   */
  private validateTemplate(template: Omit<ReplyTemplate, 'id' | 'updated_at'>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!template.template_name || template.template_name.trim().length === 0) {
      errors.push('模板名称不能为空');
    }

    if (!template.text || template.text.trim().length === 0) {
      errors.push('模板内容不能为空');
    }

    if (template.text && template.text.length > 1000) {
      errors.push('模板内容不能超过1000字符');
    }

    if (!template.channel) {
      errors.push('必须指定适用渠道');
    }

    // 检查变量语法
    if (template.text) {
      const variablePattern = /\{\{(\w+)\}\}/g;
      const matches = template.text.match(variablePattern);
      if (matches) {
        const unclosedPattern = /\{\{[^}]*$/;
        if (unclosedPattern.test(template.text)) {
          errors.push('存在未闭合的变量语法');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 生成模板ID
   */
  private generateTemplateId(): string {
    return `tpl_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
  }

  /**
   * 获取时间问候语
   */
  private getTimeGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 6) return '凌晨好';
    if (hour < 12) return '上午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }
}