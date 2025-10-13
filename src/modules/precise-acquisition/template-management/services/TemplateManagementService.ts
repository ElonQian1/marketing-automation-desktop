// src/modules/precise-acquisition/template-management/services/TemplateManagementService.ts
// module: precise-acquisition | layer: services | role: service-stub
// summary: 模板管理服务存根实现

/**
 * 模板管理相关类型定义
 */
export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description?: string;
  defaultValue?: unknown;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
}

export interface SensitiveWordCheckResult {
  hasSensitiveWords: boolean;
  sensitiveWords: string[];
  suggestions?: string[];
  passed: boolean;  // 是否通过检查(与hasSensitiveWords相反)
  blocked_words: string[];  // 被阻止的敏感词
}

export interface TemplateContext {
  [key: string]: unknown;
}

export interface TemplateRenderResult {
  success: boolean;
  content: string;
  variables?: Record<string, unknown>;
  missing_variables?: string[];
  sensitive_check?: SensitiveWordCheckResult;
  error?: string;
}

export interface TemplateFilters {
  category?: string;
  platform?: string;
  active?: boolean;
}

/**
 * 模板管理服务存根
 * TODO: 需要实现完整的模板管理功能
 */
export class TemplateManagementService {
  async getTemplates(filters?: TemplateFilters): Promise<any[]> {
    console.warn('TemplateManagementService.getTemplates: 使用存根实现', filters);
    return [];
  }

  async createTemplate(template: any): Promise<any> {
    console.warn('TemplateManagementService.createTemplate: 使用存根实现', template);
    return { id: Date.now(), ...template };
  }

  async updateTemplate(id: string, template: any): Promise<any> {
    console.warn('TemplateManagementService.updateTemplate: 使用存根实现', id, template);
    return { id, ...template };
  }

  async deleteTemplate(id: string): Promise<void> {
    console.warn('TemplateManagementService.deleteTemplate: 使用存根实现', id);
  }

  async renderTemplate(templateId: string, context: TemplateContext): Promise<TemplateRenderResult> {
    console.warn('TemplateManagementService.renderTemplate: 使用存根实现', templateId, context);
    return {
      success: true,
      content: `渲染结果 for ${templateId}`,
      variables: context
    };
  }

  async checkSensitiveWords(content: string): Promise<SensitiveWordCheckResult> {
    console.warn('TemplateManagementService.checkSensitiveWords: 使用存根实现', content);
    return {
      hasSensitiveWords: false,
      sensitiveWords: [],
      passed: true,
      blocked_words: []
    };
  }
}

// 导出单例实例
export const templateManagementService = new TemplateManagementService();
export default templateManagementService;