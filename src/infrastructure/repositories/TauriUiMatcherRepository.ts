// src/infrastructure/repositories/TauriUiMatcherRepository.ts
// module: shared | layer: infrastructure | role: 基础设施
// summary: DDD架构基础设施层实现

import { invoke, isTauri } from '@tauri-apps/api/core';
import { IUiMatcherRepository, MatchCriteriaDTO, MatchResultDTO, HiddenElementParentConfig } from '../../domain/page-analysis/repositories/IUiMatcherRepository';

export class TauriUiMatcherRepository implements IUiMatcherRepository {
  /**
   * 将前端的 camelCase 字段转换为后端的 snake_case
   */
  private convertToBackendFormat(criteria: MatchCriteriaDTO): any {
    const converted: any = {
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

    return converted;
  }

  /**
   * 转换隐藏元素父容器配置
   */
  private convertHiddenElementParentConfig(config: HiddenElementParentConfig): any {
    return {
      enable_parent_detection: config.enableParentDetection,
      max_parent_levels: config.maxParentLevels,
      expected_parent_types: config.expectedParentTypes,
      prefer_clickable_parent: config.preferClickableParent
    };
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
        matched_elements: any[];
        confidence_score: number;
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
        } : undefined
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
