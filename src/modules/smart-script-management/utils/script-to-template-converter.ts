// src/modules/smart-script-management/utils/script-to-template-converter.ts
// module: smart-script-management | layer: utils | role: converter
// summary: 智能脚本到模板库格式转换器

import type { ExtendedSmartScriptStep } from '../../../types/loopScript';
import type { ExecutorConfig } from '../../../types/execution';

/**
 * 模板库所需的脚本模板接口（基于TemplateLibrary.tsx）
 */
export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  author: string;
  version: string;
  rating: number;
  downloads: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isOfficial: boolean;
  isFavorite: boolean;
  thumbnail?: string;
  steps: TemplateStep[];
  metadata: {
    targetApp: string;
    deviceType: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: string;
  };
}

/**
 * 模板步骤格式（简化版，适合模板存储）
 */
export interface TemplateStep {
  type: string;
  name: string;
  description?: string;
  parameters: Record<string, any>;
}

/**
 * 发布到模板库的表单数据
 */
export interface PublishToTemplateFormData {
  name: string;
  description: string;
  category: string;
  targetApp: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: string;
  tags: string[];
}

/**
 * 脚本到模板转换器类
 */
export class ScriptToTemplateConverter {
  
  /**
   * 将智能脚本步骤转换为模板步骤格式
   */
  static convertStepsToTemplateFormat(steps: ExtendedSmartScriptStep[]): TemplateStep[] {
    return steps
      .filter(step => step.enabled !== false) // 只包含启用的步骤
      .map(step => ({
        type: step.step_type || 'action',
        name: step.name || `${step.step_type || 'action'} 操作`,
        description: step.description,
        parameters: this.sanitizeParameters(step.parameters || {})
      }));
  }

  /**
   * 清理和简化参数，移除不必要的复杂数据
   */
  private static sanitizeParameters(parameters: any): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    // 保留基本参数
    const allowedFields = [
      'coordinate', 'bounds', 'text', 'delay', 'retries',
      'timeout', 'xpath', 'resource_id', 'content_desc',
      'class_name', 'matching', 'wait_timeout', 'app_package'
    ];

    allowedFields.forEach(field => {
      if (parameters[field] !== undefined) {
        sanitized[field] = parameters[field];
      }
    });

    // 处理匹配策略
    if (parameters.matching) {
      sanitized.matching = {
        strategy: parameters.matching.strategy || 'standard',
        fields: parameters.matching.fields || [],
        values: parameters.matching.values || {}
      };
    }

    return sanitized;
  }

  /**
   * 根据步骤内容推断目标应用
   */
  static inferTargetApp(steps: ExtendedSmartScriptStep[]): string {
    // 检查步骤中的应用包名
    for (const step of steps) {
      const params = step.parameters || {};
      
      if (params.app_package && typeof params.app_package === 'string') {
        return this.getAppNameFromPackage(params.app_package);
      }
      
      // 检查描述中的应用关键词
      const description = (step.description || '').toLowerCase();
      if (description.includes('微信')) return '微信';
      if (description.includes('小红书')) return '小红书';
      if (description.includes('抖音')) return '抖音';
      if (description.includes('淘宝')) return '淘宝';
      if (description.includes('支付宝')) return '支付宝';
      if (description.includes('qq')) return 'QQ';
    }

    return '通用应用';
  }

  /**
   * 从包名推断应用名称
   */
  private static getAppNameFromPackage(packageName: string): string {
    const packageMap: Record<string, string> = {
      'com.tencent.mm': '微信',
      'com.xingin.xhs': '小红书',
      'com.ss.android.ugc.aweme': '抖音',
      'com.taobao.taobao': '淘宝',
      'com.eg.android.AlipayGphone': '支付宝',
      'com.tencent.mobileqq': 'QQ',
      'com.tencent.wework': '企业微信'
    };

    return packageMap[packageName] || '未知应用';
  }

  /**
   * 根据步骤复杂度推断难度等级
   */
  static inferDifficulty(steps: ExtendedSmartScriptStep[]): 'beginner' | 'intermediate' | 'advanced' {
    const enabledSteps = steps.filter(step => step.enabled !== false);
    
    // 根据步骤数量判断
    if (enabledSteps.length <= 3) {
      return 'beginner';
    } else if (enabledSteps.length <= 8) {
      return 'intermediate';
    } else {
      return 'advanced';
    }
  }

  /**
   * 估算执行时间
   */
  static estimateExecutionTime(steps: ExtendedSmartScriptStep[]): string {
    const enabledSteps = steps.filter(step => step.enabled !== false);
    
    // 基础时间计算：每个步骤平均2秒，加上延迟时间
    let totalTime = enabledSteps.length * 2;
    
    // 加上显式的延迟时间
    enabledSteps.forEach(step => {
      const delay = Number(step.parameters?.delay) || 0;
      totalTime += delay / 1000; // 转换为秒
    });

    if (totalTime <= 30) {
      return '30秒以内';
    } else if (totalTime <= 60) {
      return '1分钟以内';
    } else if (totalTime <= 180) {
      return '2-3分钟';
    } else if (totalTime <= 300) {
      return '3-5分钟';
    } else {
      return '5分钟以上';
    }
  }

  /**
   * 从步骤中提取建议标签
   */
  static extractSuggestedTags(steps: ExtendedSmartScriptStep[]): string[] {
    const tags = new Set<string>();
    
    steps.forEach(step => {
      const stepType = step.step_type || '';
      const description = (step.description || '').toLowerCase();
      
      // 根据步骤类型添加标签
      switch (stepType) {
        case 'tap':
          tags.add('点击');
          break;
        case 'input':
          tags.add('输入');
          break;
        case 'scroll':
          tags.add('滑动');
          break;
        case 'wait':
          tags.add('等待');
          break;
        case 'swipe':
          tags.add('滑动');
          break;
        case 'long_press':
          tags.add('长按');
          break;
      }

      // 根据描述添加功能标签
      if (description.includes('搜索')) tags.add('搜索');
      if (description.includes('登录')) tags.add('登录');
      if (description.includes('发送')) tags.add('发送');
      if (description.includes('点赞')) tags.add('点赞');
      if (description.includes('关注')) tags.add('关注');
      if (description.includes('评论')) tags.add('评论');
      if (description.includes('分享')) tags.add('分享');
      if (description.includes('购买')) tags.add('购买');
      if (description.includes('支付')) tags.add('支付');
    });

    tags.add('自动化');
    tags.add('脚本');

    return Array.from(tags).slice(0, 6); // 限制标签数量
  }

  /**
   * 将智能脚本转换为模板库格式
   */
  static convertToTemplate(
    steps: ExtendedSmartScriptStep[],
    executorConfig: ExecutorConfig,
    formData: PublishToTemplateFormData
  ): ScriptTemplate {
    const now = new Date();
    
    return {
      id: `script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      author: '我的创建',
      version: '1.0.0',
      rating: 0,
      downloads: 0,
      tags: formData.tags,
      createdAt: now.toISOString().split('T')[0],
      updatedAt: now.toISOString().split('T')[0],
      isOfficial: false,
      isFavorite: false,
      steps: this.convertStepsToTemplateFormat(steps),
      metadata: {
        targetApp: formData.targetApp,
        deviceType: ['Android'], // 默认Android，可以根据需要扩展
        difficulty: formData.difficulty,
        estimatedTime: formData.estimatedTime || this.estimateExecutionTime(steps)
      }
    };
  }

  /**
   * 生成推荐的模板信息（用于表单预填充）
   */
  static generateRecommendedInfo(steps: ExtendedSmartScriptStep[]): {
    targetApp: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: string;
    suggestedTags: string[];
    suggestedCategory: string;
  } {
    const targetApp = this.inferTargetApp(steps);
    const difficulty = this.inferDifficulty(steps);
    const estimatedTime = this.estimateExecutionTime(steps);
    const suggestedTags = this.extractSuggestedTags(steps);
    
    // 根据目标应用推荐分类
    let suggestedCategory = 'custom';
    if (['微信', 'QQ', '小红书', '抖音'].includes(targetApp)) {
      suggestedCategory = 'social';
    } else if (['淘宝', '支付宝'].includes(targetApp)) {
      suggestedCategory = 'ecommerce';
    } else if (['企业微信', '钉钉'].includes(targetApp)) {
      suggestedCategory = 'productivity';
    }

    return {
      targetApp,
      difficulty,
      estimatedTime,
      suggestedTags,
      suggestedCategory
    };
  }
}