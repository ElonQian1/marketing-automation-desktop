// src/pages/SmartScriptBuilderPage/hooks/useIntelligentStepCardIntegration.ts
// module: pages | layer: hooks | role: integration
// summary: 智能步骤卡集成Hook示例，连接元素选择和步骤卡创建

import { useCallback } from 'react';
import { App } from 'antd';
import { useIntelligentAnalysisWorkflow } from '../../../modules/universal-ui/hooks/use-intelligent-analysis-workflow';
import type { UIElement } from '../../../api/universalUIAPI';
import type { ExtendedSmartScriptStep } from '../../../types/loopScript';

interface ElementSelectionContext {
  snapshotId: string;
  elementPath: string;
  elementText?: string;
  elementBounds?: string;
  elementType?: string;
  keyAttributes?: Record<string, string>;
}

interface UseIntelligentStepCardIntegrationOptions {
  steps: ExtendedSmartScriptStep[];
  setSteps: React.Dispatch<React.SetStateAction<ExtendedSmartScriptStep[]>>;
  onClosePageFinder?: () => void; // 关闭页面查找器的回调
}

/**
 * 智能步骤卡集成Hook示例
 * 
 * 演示如何从元素选择自动创建智能步骤卡
 * 实际使用时需要根据具体的步骤类型进行适配
 */
export function useIntelligentStepCardIntegration(options: UseIntelligentStepCardIntegrationOptions) {
  const { steps, setSteps, onClosePageFinder } = options;
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
   * 处理元素选择 - 自动创建智能步骤卡并同步到主步骤列表
   */
  const handleElementSelected = useCallback(async (element: UIElement) => {
    try {
      console.log('🎯 [智能集成] 处理元素选择:', element.id);

      // 转换为分析上下文
      const context = convertElementToContext(element);
      
      // 创建智能步骤卡 (会自动启动后台分析)
      const stepId = await createStepCardQuick(context, false);
      
      // 🔄 同步创建常规步骤到主列表（含智能分析状态）
      const stepNumber = steps.length + 1;
      const newStep: ExtendedSmartScriptStep = {
        id: stepId,
        name: `智能${element.element_type === 'tap' ? '点击' : '操作'} ${stepNumber}`,
        step_type: element.element_type === 'tap' ? 'smart_find_element' : (element.element_type || 'tap'),
        description: `智能分析 - ${element.text || element.content_desc || element.resource_id || element.id}`,
        parameters: {
          element_selector: element.xpath || element.id || '',
          text: element.text || '',
          bounds: element.bounds ? JSON.stringify(element.bounds) : '',
          resource_id: element.resource_id || '',
          content_desc: element.content_desc || '',
          class_name: element.class_name || '',
          // 🧠 智能分析相关参数
          xmlSnapshot: {
            xmlCacheId: context.snapshotId,
            xmlContent: '', // 可以从当前快照获取
          },
          // 元素匹配策略（初始为智能推荐模式）
          matching: {
            strategy: 'intelligent' as const,
            fields: ['resource-id', 'text', 'content-desc'],
            values: {
              'resource-id': element.resource_id || '',
              'text': element.text || '',
              'content-desc': element.content_desc || ''
            }
          }
        },
        enabled: true,
        order: stepNumber,
        find_condition: null,
        verification: null,
        retry_config: null,
        fallback_actions: [],
        pre_conditions: [],
        post_conditions: []
      };

      // 添加到主步骤列表
      console.log('🔄 [智能集成] 添加步骤前，当前步骤数量:', steps.length);
      setSteps(prevSteps => {
        const newSteps = [...prevSteps, newStep];
        console.log('🔄 [智能集成] 添加步骤后，新步骤数量:', newSteps.length);
        console.log('🔄 [智能集成] 新步骤详情:', newStep);
        return newSteps;
      });
      
      message.success(`已创建智能步骤卡: 步骤${stepNumber}`);
      
      // 🎯 自动关闭页面查找器模态框，提升用户体验（稍微延迟让用户看到成功消息）
      if (onClosePageFinder) {
        setTimeout(() => {
          console.log('🔒 [智能集成] 自动关闭页面查找器');
          onClosePageFinder();
        }, 800); // 延迟800ms关闭，让用户看到成功提示
      }
      
      console.log('✅ [智能集成] 步骤卡创建成功:', {
        stepId,
        elementId: element.id,
        analysisStarted: true,
        addedToMainList: true,
        currentStepsCount: steps.length,
        modalClosed: !!onClosePageFinder
      });
      
    } catch (error) {
      console.error('❌ [智能集成] 创建步骤卡失败:', error);
      message.error(`创建步骤卡失败: ${error}`);
    }
  }, [convertElementToContext, createStepCardQuick, steps, setSteps]);

  return {
    handleElementSelected,
    isAnalyzing,
    stepCards
  };
}