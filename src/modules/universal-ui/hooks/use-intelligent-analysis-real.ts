// src/modules/universal-ui/hooks/use-intelligent-analysis-real.ts
// module: universal-ui | layer: hooks | role: ✅ V3智能分析Hook（正确执行路径）
// summary: 基于V3智能自动链的真实智能分析Hook，使用Step 0-6策略分析，替代简化系统
//
// 🎯 【重要】此Hook已升级到 V3 智能策略分析系统：
// ✅ 正确命令：execute_chain_test_v3 → V3智能自动链 → Step 0-6策略分析
// ❌ 旧命令：start_intelligent_analysis → V2简化分析（已弃用）
//
// 🔧 修复历史：
// - 2025-10-26: 修正Tauri命令调用，确保使用完整的智能策略分析
// - 解决"已关注"vs"关注"按钮识别错误问题
// - 确保空文本元素通过智能策略而不是坐标兜底

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { buildEnvelope } from '../../../protocol/v3/envelope-builder';
import { calculateSelectionHash } from '../utils/selection-hash';
import { EVENTS } from '../../../shared/constants/events';
import type {
  ElementSelectionContext,
  AnalysisJob,
  AnalysisJobState,
  AnalysisResult,
} from '../types/intelligent-analysis-types';

/**
 * Tauri 后端类型定义 (与 Rust 保持一致)
 */

interface AnalysisJobConfig {
  elementContext: {
    snapshotId: string;
    elementPath: string;
    elementText?: string;
    elementBounds?: string;
    elementType?: string;
    keyAttributes?: Record<string, string>;
    containerInfo?: {
      containerType: string;
      containerPath: string;
      itemIndex?: number;
      totalItems?: number;
    };
  };
  stepId?: string;
  lockContainer: boolean;
  enableSmartCandidates: boolean;
  enableStaticCandidates: boolean;
}

interface AnalysisJobResponse {
  jobId: string;
  selectionHash: string;
  state: AnalysisJobState;
}

interface AnalysisProgressEvent {
  jobId: string;
  progress: number;
  currentStep: string;
  estimatedTimeLeft?: number;
}

interface AnalysisDoneEvent {
  jobId: string;
  selectionHash: string;
  result: AnalysisResult;
}

interface AnalysisErrorEvent {
  jobId: string;
  selectionHash: string;
  error: string;
}

/**
 * Hook 配置选项
 */
export interface UseIntelligentAnalysisRealOptions {
  /** 元素上下文 */
  elementContext: ElementSelectionContext;
  /** 步骤卡ID (可选) */
  stepId?: string;
  /** 是否锁定容器 */
  lockContainer?: boolean;
  /** 是否启用智能候选 */
  enableSmartCandidates?: boolean;
  /** 是否启用静态候选 */
  enableStaticCandidates?: boolean;
  /** 分析完成回调 */
  onAnalysisComplete?: (result: AnalysisResult) => void;
  /** 分析失败回调 */
  onAnalysisError?: (error: string) => void;
  /** 进度更新回调 */
  onProgressUpdate?: (progress: number, step: string) => void;
}

/**
 * 真实智能分析 Hook
 * 
 * 功能:
 * - ✅ 调用真实 Tauri 命令
 * - ✅ 事件监听 (progress/done/error)
 * - ✅ 三重校验 (jobId + selectionHash + stepId)
 * - ✅ 元素切换自动取消
 * - ✅ 状态管理
 */
export function useIntelligentAnalysisReal(options: UseIntelligentAnalysisRealOptions) {
  const {
    elementContext,
    stepId,
    lockContainer = false,
    enableSmartCandidates = true,
    enableStaticCandidates = true,
    onAnalysisComplete,
    onAnalysisError,
    onProgressUpdate,
  } = options;
  
  // 当前分析任务
  const [currentJob, setCurrentJob] = useState<AnalysisJob | null>(null);
  
  // 计算当前 selection_hash
  const currentSelectionHash = useMemo(
    () => calculateSelectionHash(elementContext),
    [elementContext]
  );
  
  // 保存 unlisten 函数的引用
  const unlistenFnsRef = useRef<UnlistenFn[]>([]);
  
  /**
   * 🚀 启动智能分析
   */
  const startAnalysis = useCallback(async () => {
    try {
      console.log('🚀 [真实调用] 启动智能分析', {
        selectionHash: currentSelectionHash,
        elementPath: elementContext.elementPath,
      });
      
      // 构建配置
      const config: AnalysisJobConfig = {
        elementContext: {
          snapshotId: elementContext.snapshotId,
          elementPath: elementContext.elementPath,
          elementText: elementContext.elementText,
          elementBounds: elementContext.elementBounds,
          elementType: elementContext.elementType,
          keyAttributes: elementContext.keyAttributes,
          containerInfo: elementContext.containerInfo,
        },
        stepId,
        lockContainer,
        enableSmartCandidates,
        enableStaticCandidates,
      };
      
      // 🎯 【修正】调用 V3 智能自动链进行 Step 0-6 策略分析
      // ✅ 正确路径：execute_chain_test_v3 → 完整智能策略分析
      // ❌ 旧路径：start_intelligent_analysis → 绕过策略分析
      // 🎯 使用统一的 envelope-builder
      const envelope = buildEnvelope({
        deviceId: elementContext.snapshotId || 'default',
        analysisId: stepId,
        xmlContent: null,
        executionMode: 'relaxed'
      });

      const spec = {
        chainId: `real_analysis_${stepId}`,
        orderedSteps: [{
          ref: null,
          inline: {
            stepId: stepId,
            action: 'smart_find_element', // tagged enum action field (snake_case value)
            params: config.elementContext
          }
        }],
        threshold: 0.5,
        mode: 'dryrun', // 分析模式
        // 可选配置保持默认值
        quality: {},
        constraints: {},
        validation: {}
      };

      const response = await invoke<AnalysisJobResponse>(
        'execute_chain_test_v3',
        {
          envelope,
          spec
        }
      );
      
      console.log('✅ [真实调用] 分析任务已启动', response);
      
      // 更新本地状态
      setCurrentJob({
        jobId: response.jobId,
        selectionHash: response.selectionHash,
        stepId,
        state: 'running',
        progress: 0,
        startedAt: Date.now(),
      });
      
    } catch (error) {
      console.error('❌ [真实调用] 启动分析失败', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      onAnalysisError?.(errorMsg);
    }
  }, [
    elementContext,
    currentSelectionHash,
    stepId,
    lockContainer,
    enableSmartCandidates,
    enableStaticCandidates,
    onAnalysisError,
  ]);
  
  /**
   * ⏹️ 取消分析
   */
  const cancelAnalysis = useCallback(async () => {
    if (!currentJob) return;
    
    try {
      console.log('⏹️ [真实调用] 取消分析', currentJob.jobId);
      
      await invoke('cancel_intelligent_analysis', {
        jobId: currentJob.jobId,
      });
      
      console.log('✅ [真实调用] 分析已取消');
      
      setCurrentJob(null);
      
    } catch (error) {
      console.error('❌ [真实调用] 取消分析失败', error);
    }
  }, [currentJob]);
  
  /**
   * 🎯 元素切换自动取消 (防串扰核心)
   */
  useEffect(() => {
    if (!currentJob) return;
    
    // 检测 selection_hash 变化
    if (currentJob.selectionHash !== currentSelectionHash) {
      console.warn(
        '🔒 [防串扰] 检测到元素切换,自动取消旧任务',
        {
          oldHash: currentJob.selectionHash,
          newHash: currentSelectionHash,
          oldJobId: currentJob.jobId,
        }
      );
      
      // 自动取消
      cancelAnalysis();
    }
  }, [currentSelectionHash, currentJob, cancelAnalysis]);
  
  /**
   * 📡 事件监听器设置 (带三重校验)
   */
  useEffect(() => {
    const setupListeners = async () => {
      try {
        // 清理旧监听器
        unlistenFnsRef.current.forEach(fn => fn());
        unlistenFnsRef.current = [];
        
        // 1️⃣ 监听进度事件
        const unlistenProgress = await listen<AnalysisProgressEvent>(
          EVENTS.ANALYSIS_PROGRESS,
          (event) => {
            const { jobId, progress, currentStep, estimatedTimeLeft } = event.payload;
            
            // 🔒 校验 jobId
            if (currentJob?.jobId !== jobId) {
              console.warn('[防串扰] jobId 不匹配,忽略进度事件', {
                expected: currentJob?.jobId,
                got: jobId,
              });
              return;
            }
            
            console.log('📊 [事件] 进度更新', { progress, currentStep });
            
            // 更新进度
            setCurrentJob(prev =>
              prev
                ? {
                    ...prev,
                    progress,
                    estimatedTimeLeft,
                  }
                : null
            );
            
            onProgressUpdate?.(progress, currentStep);
          }
        );
        
        // 2️⃣ 监听完成事件
        const unlistenDone = await listen<AnalysisDoneEvent>(
          'analysis:done',
          (event) => {
            const { jobId, selectionHash, result } = event.payload;
            
            // 🔒 三重校验
            // 1. 校验 jobId
            if (currentJob?.jobId !== jobId) {
              console.warn('[防串扰] jobId 不匹配,忽略完成事件', {
                expected: currentJob?.jobId,
                got: jobId,
              });
              return;
            }
            
            // 2. 校验 selectionHash
            if (currentSelectionHash !== selectionHash) {
              console.warn('[防串扰] selectionHash 不匹配,忽略完成事件', {
                expected: currentSelectionHash,
                got: selectionHash,
              });
              return;
            }
            
            // 3. 校验 stepId (如果存在)
            if (currentJob.stepId && result.stepId && currentJob.stepId !== result.stepId) {
              console.warn('[防串扰] stepId 不匹配,忽略完成事件', {
                expected: currentJob.stepId,
                got: result.stepId,
              });
              return;
            }
            
            // ✅ 通过校验
            console.log('✅ [事件] 分析完成,校验通过', {
              jobId,
              recommendedKey: result.recommendedKey,
              smartCandidatesCount: result.smartCandidates.length,
            });
            
            // 更新状态
            setCurrentJob(prev =>
              prev
                ? {
                    ...prev,
                    state: 'completed',
                    progress: 100,
                    completedAt: Date.now(),
                    result,
                  }
                : null
            );
            
            // 触发回调
            onAnalysisComplete?.(result);
          }
        );
        
        // 3️⃣ 监听错误事件
        const unlistenError = await listen<AnalysisErrorEvent>(
          'analysis:error',
          (event) => {
            const { jobId, selectionHash, error } = event.payload;
            
            // 🔒 校验 jobId 和 selectionHash
            if (currentJob?.jobId !== jobId) return;
            if (currentSelectionHash !== selectionHash) return;
            
            console.error('❌ [事件] 分析失败', error);
            
            // 更新状态
            setCurrentJob(prev =>
              prev
                ? {
                    ...prev,
                    state: 'failed',
                    error,
                    completedAt: Date.now(),
                  }
                : null
            );
            
            // 触发回调
            onAnalysisError?.(error);
          }
        );
        
        // 保存 unlisten 函数
        unlistenFnsRef.current = [
          unlistenProgress,
          unlistenDone,
          unlistenError,
        ];
        
      } catch (error) {
        console.error('❌ [事件] 监听器设置失败', error);
      }
    };
    
    setupListeners();
    
    // 清理
    return () => {
      unlistenFnsRef.current.forEach(fn => fn());
      unlistenFnsRef.current = [];
    };
  }, [
    currentJob,
    currentSelectionHash,
    onAnalysisComplete,
    onAnalysisError,
    onProgressUpdate,
  ]);
  
  return {
    currentJob,
    currentSelectionHash,
    startAnalysis,
    cancelAnalysis,
    isAnalyzing: currentJob?.state === 'running',
    isCompleted: currentJob?.state === 'completed',
    isFailed: currentJob?.state === 'failed',
  };
}
