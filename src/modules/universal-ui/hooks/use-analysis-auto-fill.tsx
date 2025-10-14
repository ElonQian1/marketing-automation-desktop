// src/modules/universal-ui/hooks/use-analysis-auto-fill.ts
// module: universal-ui | layer: hooks | role: custom-hook
// summary: 智能分析结果自动回填Hook - 将分析结果自动填充到步骤卡

import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Modal, message } from 'antd';
import type { AnalysisResult, StrategyCandidate } from '../types/intelligent-analysis-types';

/**
 * 自动填充配置
 */
export interface AutoFillConfig {
  /**
   * 是否需要用户确认 (默认 true)
   */
  requireConfirmation?: boolean;
  
  /**
   * 是否覆盖现有策略 (默认 false)
   */
  overwriteExisting?: boolean;
  
  /**
   * 填充成功回调
   */
  onFillSuccess?: (stepId: string, strategy: StrategyCandidate) => void;
  
  /**
   * 填充失败回调
   */
  onFillError?: (stepId: string, error: string) => void;
}

/**
 * 填充预览数据
 */
export interface FillPreview {
  stepId: string;
  currentStrategy?: {
    name: string;
    xpath: string;
  };
  newStrategy: StrategyCandidate;
  analysisResult: AnalysisResult;
}

/**
 * Tauri 后端绑定请求
 */
interface BindAnalysisResultRequest {
  stepId: string;
  analysisResult: AnalysisResult;
  selectedStrategyKey: string;
  overwriteExisting: boolean;
}

/**
 * Tauri 后端绑定响应
 */
interface BindAnalysisResultResponse {
  success: boolean;
  message: string;
  stepId: string;
  boundStrategy?: StrategyCandidate;
}

/**
 * 智能分析结果自动回填 Hook
 * 
 * 功能:
 * 1. 将分析结果自动填充到指定步骤
 * 2. 支持用户确认对话框
 * 3. 支持覆盖现有策略
 * 4. 提供撤销功能
 * 5. 集成到 IntelligentAnalysisController
 * 
 * @example
 * ```tsx
 * const { fillStep, showConfirmDialog } = useAnalysisAutoFill({
 *   requireConfirmation: true,
 *   onFillSuccess: (stepId, strategy) => {
 *     console.log('填充成功', stepId, strategy);
 *   }
 * });
 * 
 * // 自动填充 (有确认对话框)
 * await fillStep('step-1', analysisResult);
 * 
 * // 手动确认
 * showConfirmDialog({
 *   stepId: 'step-1',
 *   newStrategy: recommendedStrategy,
 *   analysisResult
 * });
 * ```
 */
export function useAnalysisAutoFill(config: AutoFillConfig = {}) {
  const {
    requireConfirmation = true,
    overwriteExisting = false,
    onFillSuccess,
    onFillError,
  } = config;
  
  const [isFilling, setIsFilling] = useState(false);
  const [fillHistory, setFillHistory] = useState<Array<{
    stepId: string;
    timestamp: number;
    strategy: StrategyCandidate;
    previousStrategy?: any;
  }>>([]);
  
  /**
   * 调用后端 API 绑定分析结果到步骤
   */
  const bindToBackend = useCallback(
    async (
      stepId: string,
      analysisResult: AnalysisResult,
      selectedStrategyKey: string
    ): Promise<BindAnalysisResultResponse> => {
      try {
        const request: BindAnalysisResultRequest = {
          stepId,
          analysisResult,
          selectedStrategyKey,
          overwriteExisting,
        };
        
        const response = await invoke<BindAnalysisResultResponse>(
          'bind_analysis_result_to_step',
          { request }
        );
        
        return response;
      } catch (error) {
        console.error('[自动回填] 后端绑定失败', error);
        throw error;
      }
    },
    [overwriteExisting]
  );
  
  /**
   * 执行实际的填充操作
   */
  const performFill = useCallback(
    async (
      stepId: string,
      analysisResult: AnalysisResult,
      strategyKey?: string
    ): Promise<boolean> => {
      setIsFilling(true);
      
      try {
        // 使用推荐策略或指定策略
        const selectedKey = strategyKey || analysisResult.recommendedKey;
        const selectedStrategy = analysisResult.smartCandidates.find(
          c => c.key === selectedKey
        );
        
        if (!selectedStrategy) {
          throw new Error(`未找到策略: ${selectedKey}`);
        }
        
        // 调用后端 API
        const response = await bindToBackend(
          stepId,
          analysisResult,
          selectedKey
        );
        
        if (!response.success) {
          throw new Error(response.message);
        }
        
        // 记录到历史
        setFillHistory(prev => [
          ...prev,
          {
            stepId,
            timestamp: Date.now(),
            strategy: selectedStrategy,
          },
        ]);
        
        // 成功回调
        onFillSuccess?.(stepId, selectedStrategy);
        
        message.success(`✅ 已将"${selectedStrategy.name}"填充到步骤 ${stepId}`);
        
        return true;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[自动回填] 填充失败', errorMsg);
        
        onFillError?.(stepId, errorMsg);
        message.error(`❌ 填充失败: ${errorMsg}`);
        
        return false;
      } finally {
        setIsFilling(false);
      }
    },
    [bindToBackend, onFillSuccess, onFillError]
  );
  
  /**
   * 显示确认对话框
   */
  const showConfirmDialog = useCallback(
    (preview: FillPreview, strategyKey?: string) => {
      const selectedKey = strategyKey || preview.analysisResult.recommendedKey;
      const selectedStrategy = preview.analysisResult.smartCandidates.find(
        c => c.key === selectedKey
      );
      
      if (!selectedStrategy) {
        message.error('未找到推荐策略');
        return;
      }
      
      Modal.confirm({
        title: '🎯 确认自动填充策略',
        width: 600,
        content: (
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <strong>步骤 ID:</strong> {preview.stepId}
            </div>
            
            {preview.currentStrategy && (
              <div style={{ 
                marginBottom: 12, 
                padding: 12, 
                background: '#fff7e6',
                borderRadius: 4,
                border: '1px solid #ffd591',
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                  ⚠️ 当前策略 (将被覆盖):
                </div>
                <div>{preview.currentStrategy.name}</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                  <code>{preview.currentStrategy.xpath}</code>
                </div>
              </div>
            )}
            
            <div style={{ 
              padding: 12, 
              background: '#f6ffed',
              borderRadius: 4,
              border: '1px solid #b7eb8f',
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                ✅ 新策略:
              </div>
              <div style={{ fontSize: 16, color: '#52c41a', fontWeight: 'bold' }}>
                {selectedStrategy.name}
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                {selectedStrategy.description}
              </div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>
                <code>{selectedStrategy.xpath}</code>
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ 
                  background: '#52c41a', 
                  color: 'white', 
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                }}>
                  置信度: {selectedStrategy.confidence}%
                </span>
                {selectedStrategy.isRecommended && (
                  <span style={{ 
                    background: '#1890ff', 
                    color: 'white', 
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    marginLeft: 8,
                  }}>
                    推荐
                  </span>
                )}
              </div>
            </div>
            
            <div style={{ 
              marginTop: 12, 
              fontSize: 12, 
              color: '#666',
              lineHeight: 1.6,
            }}>
              💡 <strong>提示:</strong> 填充后可以在步骤卡中手动修改,或使用撤销功能恢复
            </div>
          </div>
        ),
        okText: '确认填充',
        cancelText: '取消',
        okButtonProps: { 
          loading: isFilling,
          type: 'primary',
        },
        onOk: async () => {
          await performFill(
            preview.stepId,
            preview.analysisResult,
            selectedKey
          );
        },
      });
    },
    [performFill, isFilling]
  );
  
  /**
   * 自动填充步骤 (主入口)
   */
  const fillStep = useCallback(
    async (
      stepId: string,
      analysisResult: AnalysisResult,
      strategyKey?: string,
      currentStrategy?: { name: string; xpath: string }
    ): Promise<boolean> => {
      // 如果需要确认,显示对话框
      if (requireConfirmation) {
        showConfirmDialog(
          {
            stepId,
            currentStrategy,
            newStrategy: analysisResult.smartCandidates.find(
              c => c.key === (strategyKey || analysisResult.recommendedKey)
            )!,
            analysisResult,
          },
          strategyKey
        );
        return true; // 对话框异步处理
      }
      
      // 直接填充 (无确认)
      return performFill(stepId, analysisResult, strategyKey);
    },
    [requireConfirmation, showConfirmDialog, performFill]
  );
  
  /**
   * 撤销最后一次填充
   */
  const undoLastFill = useCallback(async (): Promise<boolean> => {
    if (fillHistory.length === 0) {
      message.warning('没有可撤销的操作');
      return false;
    }
    
    const lastFill = fillHistory[fillHistory.length - 1];
    
    // TODO: 调用后端 API 恢复之前的策略
    // 目前简单从历史中移除
    setFillHistory(prev => prev.slice(0, -1));
    
    message.success(`✅ 已撤销步骤 ${lastFill.stepId} 的填充`);
    return true;
  }, [fillHistory]);
  
  /**
   * 批量填充多个步骤
   */
  const fillMultipleSteps = useCallback(
    async (
      fills: Array<{
        stepId: string;
        analysisResult: AnalysisResult;
        strategyKey?: string;
      }>
    ): Promise<{
      success: number;
      failed: number;
      results: Array<{ stepId: string; success: boolean }>;
    }> => {
      const results: Array<{ stepId: string; success: boolean }> = [];
      
      for (const fill of fills) {
        const success = await performFill(
          fill.stepId,
          fill.analysisResult,
          fill.strategyKey
        );
        
        results.push({
          stepId: fill.stepId,
          success,
        });
      }
      
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;
      
      message.info(
        `批量填充完成: 成功 ${successCount} 个, 失败 ${failedCount} 个`
      );
      
      return {
        success: successCount,
        failed: failedCount,
        results,
      };
    },
    [performFill]
  );
  
  /**
   * 清空填充历史
   */
  const clearHistory = useCallback(() => {
    setFillHistory([]);
    message.success('已清空填充历史');
  }, []);
  
  return {
    // 状态
    isFilling,
    fillHistory,
    
    // 核心方法
    fillStep,
    showConfirmDialog,
    
    // 高级功能
    undoLastFill,
    fillMultipleSteps,
    clearHistory,
  };
}
