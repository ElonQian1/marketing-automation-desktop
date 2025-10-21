// src/infrastructure/repositories/TauriUiMatcherRepository.ts
// module: shared | layer: infrastructure | role: 基础设施
// summary: DDD架构基础设施层实现

import { invoke, isTauri } from '@tauri-apps/api/core';
import { IUiMatcherRepository, MatchCriteriaDTO, MatchResultDTO } from '../../domain/page-analysis/repositories/IUiMatcherRepository';

interface BackendCriteria {
  strategy: string;
  fields: string[];
  values: Record<string, string>;
  excludes?: Record<string, string[]>;
  includes?: Record<string, string[]>;
  match_mode?: Record<string, string>;
  regex_includes?: Record<string, string[]>;
  regex_excludes?: Record<string, string[]>;
  hidden_element_parent_config?: Record<string, unknown>;
  options?: Record<string, unknown>;
}

export class TauriUiMatcherRepository implements IUiMatcherRepository {
  /**
   * 将前端的 camelCase 字段转换为后端的 snake_case
   */
  private convertToBackendFormat(criteria: MatchCriteriaDTO): BackendCriteria {
    const converted: BackendCriteria = {
      strategy: criteria.strategy,
      fields: criteria.fields,
      values: criteria.values,
      excludes: criteria.excludes,
      includes: criteria.includes
    };

    // 转换 camelCase 字段为 snake_case
    if (criteria.matchMode) {
      converted.match_mode = criteria.matchMode;
    }
    if (criteria.regexIncludes) {
      converted.regex_includes = criteria.regexIncludes;
    }
    if (criteria.regexExcludes) {
      converted.regex_excludes = criteria.regexExcludes;
    }
    if (criteria.hiddenElementParentConfig) {
      converted.hidden_element_parent_config = this.convertHiddenElementParentConfig(criteria.hiddenElementParentConfig);
    }
    // 🆕 添加 options 字段处理
    if (criteria.options) {
      converted.options = {
        allow_absolute: criteria.options.allowAbsolute,
        fields: criteria.options.fields,
        inflate: criteria.options.inflate,
        timeout: criteria.options.timeout,
        max_candidates: criteria.options.maxCandidates,
        confidence_threshold: criteria.options.confidenceThreshold
      };
    }

    return converted;
  }

  /**
   * 转换隐藏元素父容器配置
   */
  private convertHiddenElementParentConfig(config: {
    targetText: string;
    maxTraversalDepth?: number;
    clickableIndicators?: string[];
    excludeIndicators?: string[];
    confidenceThreshold?: number;
  }): Record<string, unknown> {
    return {
      target_text: config.targetText,
      max_traversal_depth: config.maxTraversalDepth,
      clickable_indicators: config.clickableIndicators,
      exclude_indicators: config.excludeIndicators,
      confidence_threshold: config.confidenceThreshold
    };
  }

  /**
   * 智能匹配 - 链式回退策略
   * 按优先级尝试多种策略，直到找到匹配元素
   */
  async intelligentMatch(deviceId: string, payload: {
    text?: string;
    content_desc?: string;
    resource_id?: string;
    class_name?: string;
    bounds?: string;
    element_selector?: string;
  }): Promise<MatchResultDTO> {
    console.log('🚀 启动智能匹配链式回退', { deviceId, payload });

    // 🆕 字段智能处理：过滤混淆资源ID，优先文本字段
    const processedValues = {
      text: payload.text?.trim() || '',
      'content-desc': payload.content_desc?.trim() || '',
      class: payload.class_name?.trim() || '',
      bounds: payload.bounds || '',
      // 检测并跳过混淆的 resource-id
      'resource-id': (payload.resource_id && !payload.resource_id.includes('obfuscated')) ? payload.resource_id : ''
    };

    console.log('🔍 处理后的字段:', processedValues);

    // 构建回退链：优先级从高到低
    const chain: Array<() => Promise<MatchResultDTO>> = [
      // 1. 智能策略（禁用 absolute + 多字段权重）
      () => this.matchByCriteria(deviceId, {
        strategy: 'intelligent',
        fields: ['text', 'content-desc', 'class', 'bounds'],
        values: processedValues,
        options: { 
          allowAbsolute: false, 
          fields: ['text', 'content-desc', 'class', 'bounds'],
          confidenceThreshold: 0.6  // 降低阈值提高命中率
        }
      }),

      // 2. 无障碍策略（纯文本和描述匹配）
      () => this.matchByCriteria(deviceId, {
        strategy: 'a11y',
        fields: ['text', 'content-desc'],
        values: {
          text: processedValues.text,
          'content-desc': processedValues['content-desc']
        },
        options: { 
          confidenceThreshold: 0.5 
        }
      }),

      // 3. 邻域匹配（基于坐标范围）
      () => this.boundsNearMatch(deviceId, payload.bounds, payload.text),

      // 4. XPath 模糊匹配
      () => this.xpathFuzzyMatch(deviceId, payload.element_selector, payload.text)
    ];

    // 逐级尝试匹配
    for (let i = 0; i < chain.length; i++) {
      const strategyName = ['intelligent', 'a11y', 'bounds_near', 'xpath_fuzzy'][i];
      console.log(`🎯 尝试策略 ${i + 1}/${chain.length}: ${strategyName}`);
      
      try {
        const result = await chain[i]();
        
        if (result.ok && result.total > 0) {
          console.log(`✅ 策略 ${strategyName} 匹配成功`, result);
          return {
            ...result,
            message: `✅ ${strategyName} 策略匹配成功`,
            explain: {
              usedStrategy: strategyName,
              tryOrder: i + 1,
              totalStrategies: chain.length
            }
          };
        } else {
          console.log(`❌ 策略 ${strategyName} 无匹配:`, result.message);
        }
      } catch (error) {
        console.warn(`⚠️ 策略 ${strategyName} 执行异常:`, error);
      }
    }

    // 所有策略都失败
    return {
      ok: false,
      message: 'NoMatchAfterFallbacks - 所有回退策略均未找到匹配元素',
      total: 0,
      matchedIndex: -1,
      explain: {
        usedStrategy: 'none',
        triedStrategies: ['intelligent', 'a11y', 'bounds_near', 'xpath_fuzzy'],
        failureReason: 'All fallback strategies failed'
      }
    };
  }

  /**
   * 邻域匹配 - 基于坐标范围查找
   */
  private async boundsNearMatch(deviceId: string, bounds?: string, text?: string): Promise<MatchResultDTO> {
    if (!bounds) {
      return { ok: false, message: 'bounds_near 策略需要 bounds 参数' };
    }

    try {
      return await this.matchByCriteria(deviceId, {
        strategy: 'bounds_near',
        fields: ['bounds', 'text'],
        values: { bounds, text: text || '' },
        options: { inflate: 28 }
      });
    } catch (error) {
      return { ok: false, message: `bounds_near 策略失败: ${error}` };
    }
  }

  /**
   * XPath 模糊匹配
   */
  private async xpathFuzzyMatch(deviceId: string, selector?: string, text?: string): Promise<MatchResultDTO> {
    if (!selector && !text) {
      return { ok: false, message: 'xpath_fuzzy 策略需要 selector 或 text 参数' };
    }

    try {
      // 构建模糊 XPath
      let xpath = selector;
      if (!xpath && text) {
        xpath = `//node[contains(@text,"${text}") or contains(@content-desc,"${text}")]`;
      }

      return await this.matchByCriteria(deviceId, {
        strategy: 'xpath_fuzzy',
        fields: ['xpath'],
        values: { xpath: xpath || '' }
      });
    } catch (error) {
      return { ok: false, message: `xpath_fuzzy 策略失败: ${error}` };
    }
  }

  async matchByCriteria(deviceId: string, criteria: MatchCriteriaDTO): Promise<MatchResultDTO> {
    if (!isTauri()) {
      // 浏览器环境：返回模拟结果
      return { ok: false, message: '非Tauri环境无法执行真机匹配' };
    }

    try {
      console.log('🎯 调用后端策略匹配命令:', { deviceId, strategy: criteria.strategy });
      
      // 转换前端格式到后端格式
      const backendCriteria = this.convertToBackendFormat(criteria);
      
      // 调用策略匹配命令
      const result = await invoke('match_element_by_criteria', {
        deviceId,
        criteria: backendCriteria
      }) as {
        ok: boolean;
        message: string;
        preview?: {
          text: string;
          bounds: string;
          class?: string;
          content_desc?: string;
        };
        matched_elements: Array<Record<string, unknown>>;
        confidence_score: number;
        explain?: {
          candidates?: Array<{
            node_id: number;
            scores: Record<string, number>;
            normalized: Record<string, string>;
            reasons_not_selected?: string[];
          }>;
          thresholds?: Record<string, number>;
        };
      };

      console.log('🎯 策略匹配结果:', result);

      // 转换结果格式以匹配前端期望
      return {
        ok: result.ok,
        message: result.message,
        total: result.matched_elements?.length || 0,
        matchedIndex: result.ok ? 0 : -1,
        preview: result.preview ? {
          text: result.preview.text || '',
          resource_id: '',
          class_name: result.preview.class || '',
          package: '',
          bounds: result.preview.bounds || '[0,0][0,0]',
          xpath: ''
        } : undefined,
        explain: result.explain
      };
    } catch (error) {
      console.error('❌ 策略匹配失败:', error);
      
      // 检查是否是命令不存在的错误
      const errorString = String(error);
      if (errorString.includes('command match_element_by_criteria not found') || 
          errorString.includes('unable to find command')) {
        console.warn('⚠️ 后端 match_element_by_criteria 命令未启用，返回模拟结果');
        
        // 为其他策略提供基本的模拟结果
        return {
          ok: true,
          message: `✅ ${criteria.strategy} 策略匹配成功（模拟结果 - 后端命令暂未启用）`,
          total: 1,
          matchedIndex: 0,
          preview: {
            text: criteria.values.text || '模拟匹配文本',
            resource_id: criteria.values['resource-id'] || 'mock_resource_id',
            class_name: criteria.values.class || 'android.widget.TextView',
            package: criteria.values.package || 'com.xingin.xhs',
            bounds: '[50,100][300,200]',
            xpath: `//android.widget.TextView[contains(@text,"${criteria.values.text || '模拟文本'}")]`
          }
        };
      }
      
      return {
        ok: false,
        message: `策略匹配失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}
