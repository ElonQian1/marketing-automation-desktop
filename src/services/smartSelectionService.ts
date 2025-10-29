// src/services/smartSelectionService.ts
// module: services | layer: application | role: 智能选择系统前端服务层
// summary: 为前端提供智能选择系统的服务接口，包装Tauri命令调用

import { invoke } from '@tauri-apps/api/core';
import type { 
  SmartSelectionProtocol, 
  SmartSelectionResult,
  SmartSelectionStats,
} from '../types/smartSelection';

/**
 * 验证结果接口
 */
export interface ValidationResult {
  is_valid: boolean;
  issues: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * 连通性测试结果
 */
export interface ConnectivityTestResult {
  overall_success: boolean;
  device_id: string;
  checks: ConnectivityCheck[];
  total_time_ms: number;
  recommendations: string[];
}

export interface ConnectivityCheck {
  name: string;
  success: boolean;
  message: string;
  time_ms: number;
}

/**
 * 候选元素预览结果
 */
export interface CandidatePreviewResult {
  total_found: number;
  candidates: CandidateElementSummary[];
  selection_preview: SelectionPreview;
  warnings: string[];
}

export interface CandidateElementSummary {
  index: number;
  text: string;
  resource_id: string;
  bounds: ElementBounds;
  confidence: number;
  class_name: string;
  clickable: boolean;
  would_be_selected: boolean;
}

export interface ElementBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface SelectionPreview {
  mode: string;
  would_select_count: number;
  estimated_execution_time_ms: number;
}

/**
 * 智能选择服务类
 */
export class SmartSelectionService {
  /**
   * 执行智能选择
   */
  static async executeSmartSelection(
    deviceId: string,
    protocol: SmartSelectionProtocol
  ): Promise<SmartSelectionResult> {
    try {
      const result = await invoke<SmartSelectionResult>('execute_smart_selection', {
        deviceId,
        protocol,
      });
      return result;
    } catch (error) {
      console.error('❌ 智能选择执行失败:', error);
      throw new Error(`智能选择执行失败: ${error}`);
    }
  }

  /**
   * 验证智能选择协议
   */
  static async validateProtocol(
    protocol: SmartSelectionProtocol
  ): Promise<ValidationResult> {
    try {
      const result = await invoke<ValidationResult>('validate_smart_selection_protocol', {
        protocol,
      });
      return result;
    } catch (error) {
      console.error('❌ 协议验证失败:', error);
      throw new Error(`协议验证失败: ${error}`);
    }
  }

  /**
   * 获取智能选择统计信息
   */
  static async getStats(): Promise<SmartSelectionStats> {
    try {
      const result = await invoke<SmartSelectionStats>('get_smart_selection_stats');
      return result;
    } catch (error) {
      console.error('❌ 获取统计信息失败:', error);
      throw new Error(`获取统计信息失败: ${error}`);
    }
  }

  /**
   * 测试智能选择系统连通性
   */
  static async testConnectivity(deviceId: string): Promise<ConnectivityTestResult> {
    try {
      const result = await invoke<ConnectivityTestResult>('test_smart_selection_connectivity', {
        deviceId,
      });
      return result;
    } catch (error) {
      console.error('❌ 连通性测试失败:', error);
      throw new Error(`连通性测试失败: ${error}`);
    }
  }

  /**
   * 预览智能选择候选元素
   */
  static async previewCandidates(
    deviceId: string,
    protocol: SmartSelectionProtocol
  ): Promise<CandidatePreviewResult> {
    try {
      const result = await invoke<CandidatePreviewResult>('preview_smart_selection_candidates', {
        deviceId,
        protocol,
      });
      return result;
    } catch (error) {
      console.error('❌ 候选元素预览失败:', error);
      throw new Error(`候选元素预览失败: ${error}`);
    }
  }

  /**
   * 创建标准的智能选择协议
   */
  static createProtocol(options: {
    text?: string;
    resourceId?: string;
    mode?: 'match-original' | 'first' | 'last' | 'random' | 'all';
    containerXPath?: string;
    batchInterval?: number;
    minConfidence?: number;
    textMatchingConfig?: {
      mode: 'exact' | 'partial';
      antonymCheckEnabled: boolean;
      semanticAnalysisEnabled: boolean;
      partialMatchThreshold?: number;
    };
  }): SmartSelectionProtocol {
    return {
      anchor: {
        fingerprint: {
          text_content: options.text,
          resource_id: options.resourceId,
        },
      },
      selection: {
        mode: options.mode || 'match-original',
        batch_config: options.mode === 'all' ? {
          interval_ms: options.batchInterval || 2000,
          continue_on_error: true,
          show_progress: true,
        } : undefined,
        filters: options.minConfidence ? {
          min_confidence: options.minConfidence,
        } : undefined,
      },
      matching_context: options.containerXPath ? {
        container_xpath: options.containerXPath,
      } : undefined,
      // 🆕 添加文本匹配配置
      text_matching: options.textMatchingConfig ? {
        mode: options.textMatchingConfig.mode,
        antonym_check_enabled: options.textMatchingConfig.antonymCheckEnabled,
        semantic_analysis_enabled: options.textMatchingConfig.semanticAnalysisEnabled,
        partial_threshold: options.textMatchingConfig.partialMatchThreshold,
      } : {
        // 默认使用绝对匹配（安全默认值）
        mode: 'exact',
        antonym_check_enabled: false,
        semantic_analysis_enabled: false,
      },
    };
  }

  /**
   * 创建批量关注协议（针对小红书场景）
   */
  static createBatchFollowProtocol(options: {
    followText?: string;
    containerXPath?: string;
    interval?: number;
    maxCount?: number;
    textMatchingConfig?: {
      mode: 'exact' | 'partial';
      antonymCheckEnabled: boolean;
      semanticAnalysisEnabled: boolean;
    };
  } = {}): SmartSelectionProtocol {
    return {
      anchor: {
        fingerprint: {
          text_content: options.followText || '关注',
        },
      },
      selection: {
        mode: 'all',
        batch_config: {
          interval_ms: options.interval || 2000,
          max_count: options.maxCount,
          continue_on_error: true,
          show_progress: true,
          jitter_ms: 500, // 添加抖动避免检测
        },
        filters: {
          exclude_states: ['已关注', '关注中'], // 排除已关注的按钮
          min_confidence: 0.7,
        },
      },
      matching_context: {
        container_xpath: options.containerXPath,
        i18n_aliases: ['关注', '+关注', 'Follow'],
        light_assertions: {
          must_be_clickable: true,
          must_be_visible: true,
          exclude_text: ['已关注', '关注中', '取消关注'],
        },
      },
      // 🆕 添加文本匹配配置
      text_matching: options.textMatchingConfig ? {
        mode: options.textMatchingConfig.mode,
        antonym_check_enabled: options.textMatchingConfig.antonymCheckEnabled,
        semantic_analysis_enabled: options.textMatchingConfig.semanticAnalysisEnabled,
      } : {
        // 批量关注默认使用精确匹配，防止误操作
        mode: 'exact',
        antonym_check_enabled: false,
        semantic_analysis_enabled: false,
      },
    };
  }

  /**
   * 创建精确匹配协议（针对特定用户）
   */
  static createPreciseMatchProtocol(options: {
    targetText: string;
    resourceId?: string;
    containerXPath?: string;
    minConfidence?: number;
    textMatchingConfig?: {
      mode: 'exact' | 'partial';
      antonymCheckEnabled: boolean;
      semanticAnalysisEnabled: boolean;
    };
  }): SmartSelectionProtocol {
    return {
      anchor: {
        fingerprint: {
          text_content: options.targetText,
          resource_id: options.resourceId,
        },
      },
      selection: {
        mode: 'match-original',
        filters: {
          min_confidence: options.minConfidence || 0.8,
        },
      },
      matching_context: {
        container_xpath: options.containerXPath,
        light_assertions: {
          must_be_clickable: true,
          must_be_visible: true,
        },
      },
      // 🆕 添加文本匹配配置
      text_matching: options.textMatchingConfig ? {
        mode: options.textMatchingConfig.mode,
        antonym_check_enabled: options.textMatchingConfig.antonymCheckEnabled,
        semantic_analysis_enabled: options.textMatchingConfig.semanticAnalysisEnabled,
      } : {
        // 精确匹配默认使用绝对匹配
        mode: 'exact',
        antonym_check_enabled: false,
        semantic_analysis_enabled: false,
      },
    };
  }
}

/**
 * 智能选择工具函数
 */
export const SmartSelectionUtils = {
  /**
   * 格式化执行结果为用户友好的消息
   */
  formatResult(result: SmartSelectionResult): string {
    if (result.success) {
      const count = result.matched_elements.selected_count;
      return `✅ 成功执行智能选择，操作了 ${count} 个元素`;
    } else {
      return `❌ 智能选择失败: ${result.message}`;
    }
  },

  /**
   * 获取置信度等级描述
   */
  getConfidenceLevel(confidence: number): string {
    if (confidence >= 0.9) return '非常高';
    if (confidence >= 0.8) return '高';
    if (confidence >= 0.7) return '中等';
    if (confidence >= 0.6) return '偏低';
    return '低';
  },

  /**
   * 检查是否适合使用智能选择
   */
  shouldUseSmartSelection(scenario: {
    hasMultipleTargets: boolean;
    needsBatchOperation: boolean;
    hasAmbiguousElements: boolean;
  }): boolean {
    return scenario.hasMultipleTargets || 
           scenario.needsBatchOperation || 
           scenario.hasAmbiguousElements;
  },

  /**
   * 估算执行时间
   */
  estimateExecutionTime(
    candidateCount: number,
    mode: string,
    batchInterval?: number
  ): number {
    const baseTime = 500; // 基础分析时间
    
    switch (mode) {
      case 'all':
        return baseTime + (candidateCount * (batchInterval || 2000));
      case 'match-original':
        return baseTime + 200; // 指纹匹配额外时间
      default:
        return baseTime;
    }
  },
};