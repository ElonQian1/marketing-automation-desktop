// src/hooks/useSmartSelection.ts
// module: hooks | layer: application | role: 智能选择系统React Hook
// summary: 为React组件提供智能选择功能的Hook，包含状态管理和设备集成

import { useState, useCallback, useRef, useEffect } from 'react';
import { SmartSelectionService } from '../services/smartSelectionService';
import type { 
  SmartSelectionProtocol, 
  SmartSelectionResult,
  SmartSelectionStats,
} from '../types/smartSelection';
import type { 
  ConnectivityTestResult,
  CandidatePreviewResult,
  ValidationResult,
} from '../services/smartSelectionService';
import { useAdb } from './useAdb'; // 使用现有的ADB Hook

/**
 * 智能选择执行状态
 */
export interface SmartSelectionState {
  isExecuting: boolean;
  isPreviewLoading: boolean;
  isTesting: boolean;
  result: SmartSelectionResult | null;
  preview: CandidatePreviewResult | null;
  validation: ValidationResult | null;
  error: string | null;
  stats: SmartSelectionStats | null;
}

/**
 * 智能选择Hook选项
 */
export interface UseSmartSelectionOptions {
  /**
   * 设备ID（可选，如果不提供将使用第一个连接的设备）
   */
  deviceId?: string;
  
  /**
   * 是否自动验证协议变更
   */
  autoValidate?: boolean;
  
  /**
   * 是否在执行前自动测试连通性
   */
  autoConnectivityTest?: boolean;
  
  /**
   * 执行完成回调
   */
  onComplete?: (result: SmartSelectionResult) => void;
  
  /**
   * 错误回调
   */
  onError?: (error: string) => void;
}

/**
 * 智能选择Hook
 */
export const useSmartSelection = (options: UseSmartSelectionOptions = {}) => {
  // 状态管理
  const [state, setState] = useState<SmartSelectionState>({
    isExecuting: false,
    isPreviewLoading: false,
    isTesting: false,
    result: null,
    preview: null,
    validation: null,
    error: null,
    stats: null,
  });

  // 当前协议配置
  const [protocol, setProtocol] = useState<SmartSelectionProtocol | null>(null);
  
  // 使用ADB Hook获取设备信息
  const { devices, selectedDevice } = useAdb();
  
  // 获取当前设备ID
  const currentDeviceId = options.deviceId || selectedDevice?.id || devices[0]?.id;
  
  // 防止重复调用的引用
  const executionRef = useRef<AbortController | null>(null);

  // 更新状态的辅助函数
  const updateState = useCallback((updates: Partial<SmartSelectionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  /**
   * 设置智能选择协议
   */
  const setSmartSelectionProtocol = useCallback(async (newProtocol: SmartSelectionProtocol) => {
    setProtocol(newProtocol);
    clearError();
    
    // 自动验证协议
    if (options.autoValidate) {
      try {
        const validation = await SmartSelectionService.validateProtocol(newProtocol);
        updateState({ validation });
        
        if (!validation.is_valid && validation.issues.length > 0) {
          updateState({ error: `协议验证失败: ${validation.issues.join(', ')}` });
        }
      } catch (error) {
        updateState({ error: `协议验证异常: ${error}` });
      }
    }
  }, [options.autoValidate, updateState, clearError]);

  /**
   * 预览候选元素
   */
  const previewCandidates = useCallback(async (targetProtocol?: SmartSelectionProtocol) => {
    if (!currentDeviceId) {
      updateState({ error: '没有可用的设备连接' });
      return null;
    }

    const protocolToUse = targetProtocol || protocol;
    if (!protocolToUse) {
      updateState({ error: '需要先配置智能选择协议' });
      return null;
    }

    updateState({ isPreviewLoading: true, error: null });
    
    try {
      const preview = await SmartSelectionService.previewCandidates(currentDeviceId, protocolToUse);
      updateState({ 
        preview, 
        isPreviewLoading: false,
        error: preview.total_found === 0 ? '未找到匹配的元素' : null,
      });
      return preview;
    } catch (error) {
      const errorMessage = `预览失败: ${error}`;
      updateState({ 
        error: errorMessage,
        isPreviewLoading: false,
        preview: null,
      });
      options.onError?.(errorMessage);
      return null;
    }
  }, [currentDeviceId, protocol, updateState, options]);

  /**
   * 测试系统连通性
   */
  const testConnectivity = useCallback(async (): Promise<ConnectivityTestResult | null> => {
    if (!currentDeviceId) {
      updateState({ error: '没有可用的设备连接' });
      return null;
    }

    updateState({ isTesting: true, error: null });
    
    try {
      const result = await SmartSelectionService.testConnectivity(currentDeviceId);
      updateState({ 
        isTesting: false,
        error: result.overall_success ? null : '连通性测试失败，请检查设备连接',
      });
      return result;
    } catch (error) {
      const errorMessage = `连通性测试异常: ${error}`;
      updateState({ 
        error: errorMessage,
        isTesting: false,
      });
      options.onError?.(errorMessage);
      return null;
    }
  }, [currentDeviceId, updateState, options]);

  /**
   * 执行智能选择
   */
  const execute = useCallback(async (targetProtocol?: SmartSelectionProtocol): Promise<SmartSelectionResult | null> => {
    // 检查设备连接
    if (!currentDeviceId) {
      const errorMessage = '没有可用的设备连接';
      updateState({ error: errorMessage });
      options.onError?.(errorMessage);
      return null;
    }

    const protocolToUse = targetProtocol || protocol;
    if (!protocolToUse) {
      const errorMessage = '需要先配置智能选择协议';
      updateState({ error: errorMessage });
      options.onError?.(errorMessage);
      return null;
    }

    // 防止重复执行
    if (executionRef.current) {
      executionRef.current.abort();
    }
    executionRef.current = new AbortController();

    updateState({ isExecuting: true, error: null, result: null });

    try {
      // 可选的连通性测试
      if (options.autoConnectivityTest) {
        const connectivityResult = await testConnectivity();
        if (!connectivityResult?.overall_success) {
          throw new Error('连通性测试失败');
        }
      }

      // 执行智能选择
      const result = await SmartSelectionService.executeSmartSelection(currentDeviceId, protocolToUse);
      
      // 检查是否被中止
      if (executionRef.current.signal.aborted) {
        return null;
      }

      updateState({ 
        result,
        isExecuting: false,
        error: result.success ? null : `执行失败: ${result.message}`,
      });

      // 触发完成回调
      if (result.success) {
        options.onComplete?.(result);
      } else {
        options.onError?.(result.message);
      }

      return result;
    } catch (error) {
      const errorMessage = `智能选择执行异常: ${error}`;
      updateState({ 
        error: errorMessage,
        isExecuting: false,
        result: null,
      });
      options.onError?.(errorMessage);
      return null;
    } finally {
      executionRef.current = null;
    }
  }, [currentDeviceId, protocol, options, updateState, testConnectivity]);

  /**
   * 中止执行
   */
  const abort = useCallback(() => {
    if (executionRef.current) {
      executionRef.current.abort();
      executionRef.current = null;
    }
    updateState({ isExecuting: false, isPreviewLoading: false, isTesting: false });
  }, [updateState]);

  /**
   * 获取统计信息
   */
  const loadStats = useCallback(async () => {
    try {
      const stats = await SmartSelectionService.getStats();
      updateState({ stats });
      return stats;
    } catch (error) {
      updateState({ error: `获取统计信息失败: ${error}` });
      return null;
    }
  }, [updateState]);

  /**
   * 创建快速配置协议
   */
  const createQuickProtocol = useCallback((type: 'batch-follow' | 'precise-match' | 'first-element', options: any = {}) => {
    let newProtocol: SmartSelectionProtocol;
    
    switch (type) {
      case 'batch-follow':
        newProtocol = SmartSelectionService.createBatchFollowProtocol(options);
        break;
      case 'precise-match':
        newProtocol = SmartSelectionService.createPreciseMatchProtocol(options);
        break;
      case 'first-element':
        newProtocol = SmartSelectionService.createProtocol({ ...options, mode: 'first' });
        break;
      default:
        return;
    }
    
    setSmartSelectionProtocol(newProtocol);
    return newProtocol;
  }, [setSmartSelectionProtocol]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (executionRef.current) {
        executionRef.current.abort();
      }
    };
  }, []);

  // 返回Hook API
  return {
    // 状态
    ...state,
    protocol,
    currentDeviceId,
    
    // 操作函数
    setProtocol: setSmartSelectionProtocol,
    previewCandidates,
    testConnectivity,
    execute,
    abort,
    clearError,
    loadStats,
    createQuickProtocol,
    
    // 便捷函数
    isReady: !!(currentDeviceId && protocol),
    hasValidDevice: !!currentDeviceId,
    canExecute: !!(currentDeviceId && protocol && !state.isExecuting),
    
    // 工具函数
    utils: {
      formatResult: SmartSelectionService.formatResult || ((result: SmartSelectionResult) => 
        result.success ? '✅ 执行成功' : `❌ ${result.message}`
      ),
      getConfidenceLevel: (confidence: number) => {
        if (confidence >= 0.9) return '非常高';
        if (confidence >= 0.8) return '高';
        if (confidence >= 0.7) return '中等';
        return '低';
      },
    },
  };
};

export type UseSmartSelectionReturn = ReturnType<typeof useSmartSelection>;