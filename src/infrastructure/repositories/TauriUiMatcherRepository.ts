import { invoke, isTauri } from '@tauri-apps/api/core';
import { IUiMatcherRepository, MatchCriteriaDTO, MatchResultDTO } from '../../domain/page-analysis/repositories/IUiMatcherRepository';

export class TauriUiMatcherRepository implements IUiMatcherRepository {
  async matchByCriteria(deviceId: string, criteria: MatchCriteriaDTO): Promise<MatchResultDTO> {
    if (!isTauri()) {
      // 浏览器环境：返回模拟结果
      return { ok: false, message: '非Tauri环境无法执行真机匹配' };
    }

    try {
      console.log('🎯 调用后端策略匹配命令:', { deviceId, strategy: criteria.strategy });
      
      // 调用新的策略匹配命令
      const result = await invoke('match_element_by_criteria', {
        deviceId,
        criteria
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
        total: result.matched_elements.length,
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
      return {
        ok: false,
        message: `策略匹配失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }

    try {
      const res = await invoke('match_element_by_criteria', { deviceId, criteria });
      return res as MatchResultDTO;
    } catch (error) {
      console.error('match_element_by_criteria 调用失败:', error);
      
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
      
      return { ok: false, message: String(error) };
    }
  }
}
