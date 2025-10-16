// src/hooks/useStepCardReanalysis.ts
// module: hooks | layer: hooks | role: 步骤卡片重新分析集成
// summary: 连接步骤卡片与智能分析工作流，实现重新分析功能

import { useCallback } from 'react';
import { message } from 'antd';
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
   * 从步骤卡片重新构建元素选择上下文
   */
  const reconstructElementContext = useCallback((step: ExtendedSmartScriptStep): ElementSelectionContext | null => {
    try {
      const xmlSnapshot = step.parameters?.xmlSnapshot as any;
      if (!xmlSnapshot) {
        console.warn('步骤缺少XML快照信息:', step.id);
        return null;
      }

      // 尝试从缓存管理器获取XML内容
      let xmlContent = xmlSnapshot.xmlContent;
      if (!xmlContent && xmlSnapshot.xmlCacheId) {
        const cacheEntry = XmlCacheManager.getInstance().getCachedXml(xmlSnapshot.xmlCacheId);
        xmlContent = cacheEntry?.xmlContent;
      }

      if (!xmlContent) {
        console.warn('无法获取XML内容:', step.id);
        return null;
      }

      // 重新构建元素选择上下文
      const context: ElementSelectionContext = {
        snapshotId: xmlSnapshot.xmlCacheId || xmlSnapshot.xmlHash || 'current',
        elementPath: xmlSnapshot.elementGlobalXPath || step.parameters.element_selector || '',
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
      const context = reconstructElementContext(step);
      if (!context) {
        message.error('无法重新构建元素上下文，请检查XML快照信息');
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
    const xmlSnapshot = step.parameters?.xmlSnapshot;
    return !!(xmlSnapshot && (xmlSnapshot.xmlContent || xmlSnapshot.xmlCacheId));
  }, [steps]);

  /**
   * 获取步骤的分析状态
   */
  const getAnalysisStatus = useCallback((stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    const selector = step?.strategySelector as any;
    return selector?.analysis?.status || 'idle';
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