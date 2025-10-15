// src/pages/SmartScriptBuilderPage/hooks/useIntelligentStepCardIntegration.ts
// module: pages | layer: hooks | role: integration
// summary: 智能步骤卡集成Hook示例，连接元素选择和步骤卡创建

import { useCallback } from 'react';
import { App } from 'antd';
import { useIntelligentAnalysisWorkflow } from '../../../modules/universal-ui/hooks/use-intelligent-analysis-workflow';
import type { UIElement } from '../../../api/universalUIAPI';

interface ElementSelectionContext {
  snapshotId: string;
  elementPath: string;
  elementText?: string;
  elementBounds?: string;
  elementType?: string;
  keyAttributes?: Record<string, string>;
}

/**
 * 智能步骤卡集成Hook示例
 * 
 * 演示如何从元素选择自动创建智能步骤卡
 * 实际使用时需要根据具体的步骤类型进行适配
 */
export function useIntelligentStepCardIntegration() {
  const { message } = App.useApp();
  
  const {
    createStepCardQuick,
    stepCards,
    isAnalyzing
  } = useIntelligentAnalysisWorkflow();

  /**
   * 从UIElement转换为ElementSelectionContext
   */
  const convertElementToContext = useCallback((element: UIElement): ElementSelectionContext => {
    return {
      snapshotId: 'current', // 可以从当前XML内容获取
      elementPath: element.xpath || element.id || '',
      elementText: element.text,
      elementBounds: element.bounds ? JSON.stringify(element.bounds) : undefined,
      elementType: element.element_type || 'tap',
      keyAttributes: {
        'resource-id': element.resource_id || '',
        'content-desc': element.content_desc || '',
        'text': element.text || '',
        'class': element.class_name || '',
      }
    };
  }, []);

  /**
   * 处理元素选择 - 自动创建智能步骤卡
   */
  const handleElementSelected = useCallback(async (element: UIElement) => {
    try {
      console.log('🎯 [智能集成] 处理元素选择:', element.id);

      // 转换为分析上下文
      const context = convertElementToContext(element);
      
      // 创建智能步骤卡 (会自动启动后台分析)
      const stepId = await createStepCardQuick(context, false);
      
      message.success(`已创建智能步骤卡: 步骤${stepCards.length + 1}`);
      
      console.log('✅ [智能集成] 步骤卡创建成功:', {
        stepId,
        elementId: element.id,
        analysisStarted: true
      });
      
    } catch (error) {
      console.error('❌ [智能集成] 创建步骤卡失败:', error);
      message.error(`创建步骤卡失败: ${error}`);
    }
  }, [convertElementToContext, createStepCardQuick, stepCards.length]);

  return {
    handleElementSelected,
    isAnalyzing,
    stepCards
  };
}