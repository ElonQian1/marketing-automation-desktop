// src/hooks/useStepCardReanalysis.ts
// module: hooks | layer: hooks | role: 步骤卡片重新分析集成
// summary: 连接步骤卡片与智能分析工作流，实现重新分析功能

import React, { useCallback } from 'react';
import { message } from 'antd';
import { showMissingSnapshotDialog } from '../components/MissingSnapshotDialog';
import type { UseIntelligentAnalysisWorkflowReturn } from '../modules/universal-ui/hooks/use-intelligent-analysis-workflow';
import type { ExtendedSmartScriptStep } from '../types/loopScript';
import type { ElementSelectionContext } from '../modules/universal-ui/types/intelligent-analysis-types';
import type { XmlCacheEntry } from '../services/xml-cache-manager';
import XmlCacheManager from '../services/xml-cache-manager';
import { deriveStepContext, isSameContext, isWithinTimeWindow, XML_CACHE_MATCH_CONFIG, type XmlSnapshot, type StepContext } from '../types/xml-cache';

/**
 * 从步骤中提取元数据用于智能缓存匹配
 */
function extractMetadataFromStep(step: ExtendedSmartScriptStep): Partial<XmlCacheEntry['metadata']> | undefined {
  // 尝试从步骤的 parameters 中提取元数据
  if (step.parameters) {
    const params = step.parameters as Record<string, unknown>;
    
    // 检查是否有 element_selector 字段
    if (params.element_selector && typeof params.element_selector === 'object') {
      const selector = params.element_selector as Record<string, unknown>;
      
      // 检查 xmlSnapshot 中的 metadata
      if (selector.xmlSnapshot && typeof selector.xmlSnapshot === 'object') {
        const snapshot = selector.xmlSnapshot as Record<string, unknown>;
        if (snapshot.metadata && typeof snapshot.metadata === 'object') {
          return snapshot.metadata as Partial<XmlCacheEntry['metadata']>;
        }
      }
    }
  }
  
  // 降级：无法提取元数据
  return undefined;
}

export interface UseStepCardReanalysisOptions {
  steps: ExtendedSmartScriptStep[];
  setSteps: React.Dispatch<React.SetStateAction<ExtendedSmartScriptStep[]>>;
  analysisWorkflow: UseIntelligentAnalysisWorkflowReturn;
}

/**
 * 步骤卡片重新分析Hook
 * 
 * 连接现有的智能分析工作流，为步骤卡片提供重新分析功能
 */
export function useStepCardReanalysis(options: UseStepCardReanalysisOptions) {
  const { steps, setSteps, analysisWorkflow } = options;
  
  const {
    retryAnalysis,
    isAnalyzing,
    stepCards,
    getStepCard
  } = analysisWorkflow;

  /**
   * 显示缺失快照兜底对话框
   */
  const showMissingSnapshotDialogHandler = useCallback((stepId: string) => {
    showMissingSnapshotDialog(stepId, {
      onRefreshSnapshot: async () => {
        // TODO: 触发重新抓取XML的流程
        message.info('重新抓取功能待实现，请手动刷新页面快照后重试');
      },
      onUseHistorySnapshot: async (cacheId: string) => {
        // 使用历史快照重新分析
        console.log('使用历史快照:', cacheId);
        setTimeout(() => reanalyzeStepCard(stepId), 500);
      },
      onCancel: () => {
        // 用户取消操作
        console.log('用户取消了快照选择');
      }
    });
  }, []);

  /**
   * 从步骤卡片重新构建元素选择上下文
   */
  const reconstructElementContext = useCallback((step: ExtendedSmartScriptStep): ElementSelectionContext | null => {
    try {
      const xmlSnapshot = step.parameters?.xmlSnapshot as {
        xmlHash?: string;
        xmlCacheId?: string;
      } | undefined;
      if (!xmlSnapshot) {
        console.warn('步骤缺少XML快照信息:', step.id);
        return null;
      }

      // 按优先级从缓存获取XML内容：hash → cacheId → current
      let xmlContent: string | null = null;
      let actualCacheId = xmlSnapshot.xmlCacheId;
      const xmlCacheManager = XmlCacheManager.getInstance();
      
      // 1) 优先通过hash获取（最稳定）
      if (xmlSnapshot.xmlHash) {
        const entryByHash = xmlCacheManager.getByHash(xmlSnapshot.xmlHash);
        if (entryByHash) {
          console.log('✅ [Reanalyze] 通过xmlHash命中缓存:', xmlSnapshot.xmlHash.substring(0, 16) + '...');
          xmlContent = entryByHash.xmlContent;
          actualCacheId = entryByHash.cacheId;
        } else {
          console.warn('⚠️ [Reanalyze] xmlHash未命中缓存:', xmlSnapshot.xmlHash);
        }
      }
        
      // 2) 其次通过cacheId获取
      if (!xmlContent && xmlSnapshot.xmlCacheId) {
        const entryById = xmlCacheManager.getCachedXml(xmlSnapshot.xmlCacheId);
        if (entryById) {
          console.log('✅ [Reanalyze] 通过xmlCacheId命中缓存:', xmlSnapshot.xmlCacheId);
          xmlContent = entryById.xmlContent;
          actualCacheId = entryById.cacheId;
        } else {
          console.warn('⚠️ [Reanalyze] xmlCacheId未命中缓存:', xmlSnapshot.xmlCacheId);
        }
      }
      
      // 3) 最后尝试智能匹配最新缓存（基于元数据守卫，避免跨页面混淆）
      if (!xmlContent) {
        // 🔒 提取步骤上下文用于元数据比对
        const stepCtx: StepContext = deriveStepContext(step);
        
        // 尝试从步骤中提取元数据用于匹配
        const snapshotMetadata = (xmlSnapshot as Record<string, unknown>).metadata;
        const metadata = (snapshotMetadata && typeof snapshotMetadata === 'object' 
          ? snapshotMetadata as Partial<XmlCacheEntry['metadata']>
          : undefined) || extractMetadataFromStep(step);
        
        const latestEntry = xmlCacheManager.getLatestXmlCache(metadata);
        
        // 🎯 关键守卫：只有在同上下文时才使用 "current" fallback
        const latestSnapshot: XmlSnapshot | null = latestEntry ? {
          id: latestEntry.cacheId,
          hash: latestEntry.xmlHash || '',
          xmlContent: latestEntry.xmlContent,
          metadata: latestEntry.metadata,
          timestamp: latestEntry.timestamp
        } : null;
        
        // 🔒 两层匹配策略：严格匹配 → 时间窗口内宽松匹配
        let usableLatest = isSameContext(stepCtx, latestSnapshot) ? latestEntry : null;
        
        // 如果严格匹配失败，尝试宽松匹配（在时间窗口内）
        if (!usableLatest && latestSnapshot && latestSnapshot.timestamp) {
          const inWindow = isWithinTimeWindow(latestSnapshot.timestamp, XML_CACHE_MATCH_CONFIG.RELAXED_TIME_WINDOW);
          if (inWindow && isSameContext(stepCtx, latestSnapshot, { relaxed: true })) {
            usableLatest = latestEntry;
            console.log('✅ [Reanalyze] 宽松匹配成功（时间窗口内）', {
              windowSeconds: XML_CACHE_MATCH_CONFIG.RELAXED_TIME_WINDOW,
              age: Math.floor((Date.now() - latestSnapshot.timestamp) / 1000),
              matchedPackage: latestEntry!.metadata?.packageName
            });
          }
        }
        
        if (usableLatest) {
          console.log('✅ [Reanalyze] 上下文匹配，使用最新缓存', {
            matchedPackage: usableLatest.metadata?.packageName,
            matchedActivity: usableLatest.metadata?.activity,
            stepContext: stepCtx
          });
          xmlContent = usableLatest.xmlContent;
          actualCacheId = usableLatest.cacheId;
        } else if (latestEntry) {
          console.warn('⚠️ [Reanalyze] 上下文不匹配（严格+宽松均失败），拒绝使用最新缓存', {
            latestPackage: latestEntry.metadata?.packageName,
            latestActivity: latestEntry.metadata?.activity,
            stepContext: stepCtx
          });
        }
      }

      if (!xmlContent) {
        console.error('❌ 无法获取XML内容，缺少快照信息', {
          stepId: step.id,
          xmlHash: xmlSnapshot.xmlHash,
          xmlCacheId: xmlSnapshot.xmlCacheId,
          hasXmlSnapshot: !!xmlSnapshot,
          availableCaches: xmlCacheManager.dumpKeys()
        });
        throw new Error('NO_XML_SNAPSHOT');
      }

      // 重新构建元素选择上下文
      const context: ElementSelectionContext = {
        snapshotId: actualCacheId || xmlSnapshot.xmlHash || 'current',
        elementPath: (step.parameters.element_selector as string) || '',
        elementText: step.parameters.text as string || '',
        elementBounds: step.parameters.bounds as string || '',
        elementType: step.step_type === 'smart_find_element' ? 'tap' : step.step_type,
        xmlContent,
        xmlHash: xmlSnapshot.xmlHash,
        keyAttributes: {
          'resource-id': step.parameters.resource_id as string || '',
          'content-desc': step.parameters.content_desc as string || '',
          'text': step.parameters.text as string || '',
          'class': step.parameters.class_name as string || '',
          'bounds': step.parameters.bounds as string || '',
        }
      };

      return context;
    } catch (error) {
      console.error('重建元素上下文失败:', error);
      return null;
    }
  }, []);

  /**
   * 重新分析步骤卡片
   */
  const reanalyzeStepCard = useCallback(async (stepId: string): Promise<void> => {
    console.log('🔄 [重新分析] 开始重新分析步骤:', stepId);
    
    const step = steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error('未找到对应的步骤');
    }

    if (!step.enableStrategySelector) {
      throw new Error('此步骤未启用智能分析功能');
    }

    // 重新构建元素上下文
    let context;
    try {
      context = reconstructElementContext(step);
    } catch (error) {
      if (error instanceof Error && error.message === 'NO_XML_SNAPSHOT') {
        // 显示缺少快照的兜底对话框
        showMissingSnapshotDialogHandler(stepId);
        return;
      }
      throw error;
    }
    
    if (!context) {
      throw new Error('无法重新构建元素上下文：XML快照信息丢失或已过期，请重新获取页面快照后再试');
    }

    // 🔒 更新步骤状态为分析中（只更新此步骤）
    setSteps(prev => prev.map(s => {
      if (s.id === stepId && s.strategySelector) {
        console.log('🔄 [状态] 设置步骤为 analyzing:', { stepId, currentStatus: s.strategySelector.analysis.status });
        return {
          ...s,
          strategySelector: {
            ...s.strategySelector,
            analysis: {
              ...s.strategySelector.analysis,
              status: 'analyzing',
              progress: 0
            }
          }
        };
      }
      return s;
    }));

    try {
      // 如果已经有对应的智能步骤卡，使用retryAnalysis
      const existingStepCard = getStepCard(stepId);
      if (existingStepCard) {
        console.log('📍 [重新分析] 使用现有智能步骤卡重试分析');
        await retryAnalysis(stepId);
      } else {
        // 否则启动新的分析（这种情况较少见）
        console.log('📍 [重新分析] 创建新的智能分析任务');
        throw new Error('未找到对应的智能步骤卡，请先创建步骤卡');
      }

      message.success('重新分析已启动');
      // ⚠️ 注意：状态复位由后端事件 + useEffect 状态同步完成
      // 这里不手动复位，让工作流的事件监听器处理
      
    } catch (error) {
      console.error('🔴 [重新分析失败]:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      message.error(errorMessage);
      
      // ✅ 失败时立即恢复步骤状态为 ready
      setSteps(prev => prev.map(s => {
        if (s.id === stepId && s.strategySelector) {
          console.log('🔄 [状态] 恢复步骤为 ready:', { stepId });
          return {
            ...s,
            strategySelector: {
              ...s.strategySelector,
              analysis: {
                ...s.strategySelector.analysis,
                status: 'ready',
                progress: 0
              }
            }
          };
        }
        return s;
      }));
      throw error; // 重新抛出错误
    }
  }, [steps, setSteps, reconstructElementContext, retryAnalysis, getStepCard, showMissingSnapshotDialogHandler]);

  /**
   * 检查步骤是否可以重新分析
   */
  const canReanalyze = useCallback((stepId: string): boolean => {
    const step = steps.find(s => s.id === stepId);
    if (!step?.enableStrategySelector) return false;
    
    // 检查是否有必要的XML快照信息（不再依赖xmlContent，只看索引字段）
    const xmlSnapshot = step.parameters?.xmlSnapshot as { xmlHash?: string; xmlCacheId?: string };
    return !!(xmlSnapshot && (xmlSnapshot.xmlHash || xmlSnapshot.xmlCacheId));
  }, [steps]);

  /**
   * 获取步骤的分析状态
   */
  const getAnalysisStatus = useCallback((stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    return step?.strategySelector?.analysis?.status || 'idle';
  }, [steps]);

  return {
    // 核心功能
    reanalyzeStepCard,
    canReanalyze,
    getAnalysisStatus,
    
    // 状态
    isAnalyzing,
    stepCards,
    
    // 工具方法
    reconstructElementContext
  };
}
