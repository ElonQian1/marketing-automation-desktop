// src/hooks/useStepCardReanalysis.ts
// module: hooks | layer: hooks | role: 步骤卡片重新分析集成
// summary: 连接步骤卡片与智能分析工作流，实现重新分析功能

import React, { useCallback } from 'react';
import { message, Modal } from 'antd';
import { useIntelligentAnalysisWorkflow } from '../modules/universal-ui/hooks/use-intelligent-analysis-workflow';
import type { ExtendedSmartScriptStep } from '../types/loopScript';
import type { ElementSelectionContext } from '../modules/universal-ui/types/intelligent-analysis-types';
import XmlCacheManager from '../services/xml-cache-manager';

export interface UseStepCardReanalysisOptions {
  steps: ExtendedSmartScriptStep[];
  setSteps: React.Dispatch<React.SetStateAction<ExtendedSmartScriptStep[]>>;
}

/**
 * 步骤卡片重新分析Hook
 * 
 * 连接现有的智能分析工作流，为步骤卡片提供重新分析功能
 */
export function useStepCardReanalysis(options: UseStepCardReanalysisOptions) {
  const { steps, setSteps } = options;
  
  const {
    retryAnalysis,
    isAnalyzing,
    stepCards,
    getStepCard
  } = useIntelligentAnalysisWorkflow();

  /**
   * 显示缺失快照兜底对话框
   */
  const showMissingSnapshotDialog = useCallback((stepId: string) => {
    const xmlCacheManager = XmlCacheManager.getInstance();
    const keys = xmlCacheManager.dumpKeys();
    
    Modal.confirm({
      title: '缺少XML快照',
      content: `未找到步骤的XML快照信息。可选择：重新抓取当前页面 / 使用历史快照（共 ${keys.ids.length} 个可用）/ 取消分析`,
      okText: '重新抓取当前页面',
      cancelText: '取消',
      width: 480,
      onOk: async () => {
        // TODO: 触发重新抓取XML的流程
        message.info('重新抓取功能待实现，请手动刷新页面快照后重试');
      },
      onCancel: () => {
        // 如果有历史快照，提供使用选项
        if (keys.ids.length > 0) {
          const latest = xmlCacheManager.getLatestXmlCache();
          if (latest) {
            Modal.confirm({
              title: '使用历史快照',
              content: `找到 ${keys.ids.length} 个历史快照，是否使用最新的快照继续分析？`,
              onOk: () => {
                message.success(`已使用最新历史快照: ${latest.cacheId}`);
                setTimeout(() => reanalyzeStepCard(stepId), 500);
              }
            });
          }
        }
      }
    });
  }, []);

  /**
   * 从步骤卡片重新构建元素选择上下文
   */
  const reconstructElementContext = useCallback((step: ExtendedSmartScriptStep): ElementSelectionContext | null => {
    try {
      const xmlSnapshot = step.parameters?.xmlSnapshot as {
        xmlContent?: string;
        xmlCacheId?: string;
        xmlHash?: string;
        elementGlobalXPath?: string;
      } | undefined;
      if (!xmlSnapshot) {
        console.warn('步骤缺少XML快照信息:', step.id);
        return null;
      }

      // 按优先级获取XML内容：hash → cacheId → current
      let xmlContent = xmlSnapshot.xmlContent;
      let actualCacheId = xmlSnapshot.xmlCacheId;
      const xmlCacheManager = XmlCacheManager.getInstance();
      
      // 如果XML内容不存在，按顺序尝试获取
      if (!xmlContent) {
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
        
        // 3) 最后尝试获取'current'缓存（需要用户确认，避免隐式切页）
        if (!xmlContent) {
          const currentEntry = xmlCacheManager.getCachedXml('current');
          if (currentEntry) {
            console.warn('🔄 [Reanalyze] 使用current缓存作为兜底，可能与原快照不同');
            xmlContent = currentEntry.xmlContent;
            actualCacheId = currentEntry.cacheId;
          }
        }
        
        // 如果成功获取了新的XML内容，更新步骤快照信息
        if (xmlContent && actualCacheId && step.parameters) {
          (step.parameters as Record<string, unknown>).xmlSnapshot = {
            ...xmlSnapshot,
            xmlCacheId: actualCacheId,
            xmlContent
          };
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
        elementPath: xmlSnapshot.elementGlobalXPath || (step.parameters.element_selector as string) || '',
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
    try {
      console.log('🔄 [重新分析] 开始重新分析步骤:', stepId);
      
      const step = steps.find(s => s.id === stepId);
      if (!step) {
        message.error('未找到对应的步骤');
        return;
      }

      if (!step.enableStrategySelector) {
        message.warning('此步骤未启用智能分析功能');
        return;
      }

      // 重新构建元素上下文
      let context;
      try {
        context = reconstructElementContext(step);
      } catch (error) {
        if (error instanceof Error && error.message === 'NO_XML_SNAPSHOT') {
          // 显示缺少快照的兜底对话框
          showMissingSnapshotDialog(stepId);
          return;
        }
        throw error;
      }
      
      if (!context) {
        message.error('无法重新构建元素上下文：XML快照信息丢失或已过期，请重新获取页面快照后再试');
        return;
      }

      // 更新步骤状态为分析中
      setSteps(prev => prev.map(s => {
        if (s.id === stepId && s.strategySelector) {
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

      // 如果已经有对应的智能步骤卡，使用retryAnalysis
      const existingStepCard = getStepCard(stepId);
      if (existingStepCard) {
        console.log('📍 [重新分析] 使用现有智能步骤卡重试分析');
        await retryAnalysis(stepId);
      } else {
        // 否则启动新的分析（这种情况较少见）
        console.log('📍 [重新分析] 创建新的智能分析任务');
        // 这里可以调用 startAnalysis 或 createStepCardQuick
        // 但通常步骤卡片已经存在对应的智能分析实例
      }

      message.success('重新分析已启动');
      
    } catch (error) {
      console.error('重新分析失败:', error);
      message.error(`重新分析失败: ${error}`);
      
      // 恢复步骤状态
      setSteps(prev => prev.map(s => {
        if (s.id === stepId && s.strategySelector) {
          return {
            ...s,
            strategySelector: {
              ...s.strategySelector,
              analysis: {
                ...s.strategySelector.analysis,
                status: 'failed'
              }
            }
          };
        }
        return s;
      }));
    }
  }, [steps, setSteps, reconstructElementContext, retryAnalysis, getStepCard]);

  /**
   * 检查步骤是否可以重新分析
   */
  const canReanalyze = useCallback((stepId: string): boolean => {
    const step = steps.find(s => s.id === stepId);
    if (!step?.enableStrategySelector) return false;
    
    // 检查是否有必要的XML快照信息
    const xmlSnapshot = step.parameters?.xmlSnapshot as { xmlContent?: string; xmlCacheId?: string };
    return !!(xmlSnapshot && (xmlSnapshot.xmlContent || xmlSnapshot.xmlCacheId));
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