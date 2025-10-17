// src/pages/SmartScriptBuilderPage/hooks/useIntelligentStepCardIntegration.ts
// module: pages | layer: hooks | role: integration
// summary: 智能步骤卡集成Hook示例，连接元素选择和步骤卡创建

import { useCallback } from 'react';
import { App } from 'antd';
import type { UseIntelligentAnalysisWorkflowReturn } from '../../../modules/universal-ui/hooks/use-intelligent-analysis-workflow';
import type { UIElement } from '../../../api/universalUIAPI';
import type { ExtendedSmartScriptStep } from '../../../types/loopScript';
import XmlCacheManager from '../../../services/xml-cache-manager';
import { generateXmlHash } from '../../../types/self-contained/xmlSnapshot';

interface ElementSelectionContext {
  snapshotId: string;
  elementPath: string;
  elementText?: string;
  elementBounds?: string;
  elementType?: string;
  // 🎯 新增：完整XML快照信息
  xmlContent?: string;
  xmlHash?: string;
  keyAttributes?: Record<string, string>;
}

interface UseIntelligentStepCardIntegrationOptions {
  steps: ExtendedSmartScriptStep[];
  setSteps: React.Dispatch<React.SetStateAction<ExtendedSmartScriptStep[]>>;
  onClosePageFinder?: () => void; // callback when the page finder modal closes
  analysisWorkflow: UseIntelligentAnalysisWorkflowReturn;
}

/**
 * 智能步骤卡集成Hook示例
 * 
 * 演示如何从元素选择自动创建智能步骤卡
 * 实际使用时需要根据具体的步骤类型进行适配
 */
export function useIntelligentStepCardIntegration(options: UseIntelligentStepCardIntegrationOptions) {
  const { steps, setSteps, onClosePageFinder, analysisWorkflow } = options;
  const { message } = App.useApp();
  
  const {
    createStepCardQuick,
    stepCards,
    isAnalyzing
  } = analysisWorkflow;

  /**
   * 从UIElement转换为ElementSelectionContext (增强版 - 包含完整XML信息)
   */
  const convertElementToContext = useCallback((element: UIElement): ElementSelectionContext => {
    // 尝试获取当前XML内容和哈希
    let xmlContent = '';
    let xmlHash = '';
    let xmlCacheId = '';
    
    try {
      // 如果元素有关联的缓存ID，从缓存管理器获取XML内容
      xmlCacheId = (element as unknown as { xmlCacheId?: string }).xmlCacheId || '';
      if (xmlCacheId) {
        const cacheEntry = XmlCacheManager.getInstance().getCachedXml(xmlCacheId);
        if (cacheEntry) {
          xmlContent = cacheEntry.xmlContent;
          xmlHash = cacheEntry.xmlHash || generateXmlHash(xmlContent);
          
          // 确保XML也被按hash索引（如果缓存条目没有hash）
          if (!cacheEntry.xmlHash && xmlHash) {
            const xmlCacheManager = XmlCacheManager.getInstance();
            xmlCacheManager.putXml(xmlCacheId, xmlContent, `sha256:${xmlHash}`);
          }
        }
      }
    } catch (error) {
      console.warn('获取XML内容失败:', error);
    }
    
    return {
      snapshotId: xmlCacheId || 'current',
      elementPath: element.xpath || element.id || '',
      elementText: element.text,
      elementBounds: element.bounds ? JSON.stringify(element.bounds) : undefined,
      elementType: element.element_type || 'tap',
      // 🎯 新增：完整XML快照信息，支持跨设备复现
      xmlContent,
      xmlHash,
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
   * 🆕 分离版本：用于"直接确定"按钮的快速创建流程
   */
  const handleQuickCreateStep = useCallback(async (element: UIElement) => {
    try {
      console.log('⚡ [智能集成] 快速创建步骤:', element.id);

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
        // 🧠 启用策略选择器
        enableStrategySelector: true,
        strategySelector: {
          selectedStrategy: 'smart-auto',
          selectedStep: 'step1',
          analysis: {
            status: 'analyzing' as const,
            progress: 0,
            result: null,
            error: null
          }
        },
        parameters: {
          element_selector: element.xpath || element.id || '',
          text: element.text || '',
          bounds: element.bounds ? JSON.stringify(element.bounds) : '',
          resource_id: element.resource_id || '',
          content_desc: element.content_desc || '',
          class_name: element.class_name || '',
          // 🧠 智能分析相关参数 - 完整XML快照信息
          xmlSnapshot: {
            xmlCacheId: context.snapshotId,
            xmlContent: context.xmlContent || '', // 保存完整XML内容以支持跨设备复现
            xmlHash: context.xmlHash || '',
            timestamp: Date.now(),
            elementGlobalXPath: element.xpath || '',
            elementSignature: {
              class: element.class_name || '',
              resourceId: element.resource_id || '',
              text: element.text || null,
              contentDesc: element.content_desc || null,
              bounds: element.bounds ? JSON.stringify(element.bounds) : '',
              indexPath: (element as unknown as { index_path?: number[] }).index_path || [], // 如果有索引路径
            }
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
      
      console.log('✅ [智能集成] 步骤卡创建成功:', {
        stepId,
        elementId: element.id,
        analysisStarted: true,
        addedToMainList: true,
        currentStepsCount: steps.length,
        modalClosed: !!onClosePageFinder
      });
      
      // 🔧 关闭页面查找器模态框
      if (onClosePageFinder) {
        onClosePageFinder();
        console.log('🚪 [智能集成] 已关闭页面查找器');
      }
      
    } catch (error) {
      console.error('❌ [智能集成] 创建步骤卡失败:', error);
      message.error(`创建步骤卡失败: ${error}`);
    }
  }, [convertElementToContext, createStepCardQuick, steps, setSteps, message, onClosePageFinder]);

  /**
   * 传统的元素选择处理 - 仅用于表单填充，不自动创建步骤
   */
  const handleElementSelected = useCallback(async (element: UIElement) => {
    // 这个函数现在只用于与旧版本兼容，实际的步骤创建由 handleQuickCreateStep 处理
    console.log('🎯 [智能集成] 元素选择确认 (传统模式):', element.id);
    message.info('元素已选择，请通过气泡中的"直接确定"创建智能步骤');
  }, [message]);

  return {
    handleElementSelected,
    handleQuickCreateStep, // 🆕 导出快速创建函数
    isAnalyzing,
    stepCards
  };
}



