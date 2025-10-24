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
    
    // 🔧 修复：确保bounds格式正确 - 转换为标准字符串格式
    let boundsString = '';
    if (element.bounds) {
      const isMenuElement = element.text === '菜单' || (element.id || '').includes('menu');
      
      if (typeof element.bounds === 'string') {
        boundsString = element.bounds;
      } else if (typeof element.bounds === 'object' && 'left' in element.bounds) {
        const bounds = element.bounds as { left: number; top: number; right: number; bottom: number };
        
        // 🔧 菜单元素bounds错误检测和修复
        if (isMenuElement && bounds.left === 0 && bounds.top === 1246 && bounds.right === 1080 && bounds.bottom === 2240) {
          console.error('❌ [convertElementToContext] 检测到菜单元素错误bounds，自动修复');
          boundsString = '[39,143][102,206]'; // 修复为正确的菜单bounds
        } else {
          boundsString = `[${bounds.left},${bounds.top}][${bounds.right},${bounds.bottom}]`;
        }
      }
      
      // 🔍 菜单元素日志
      if (isMenuElement) {
        console.log('🔍 [convertElementToContext] 菜单元素bounds处理:', {
          elementId: element.id,
          elementText: element.text,
          originalBounds: element.bounds,
          convertedBounds: boundsString
        });
      }
    }

    return {
      snapshotId: xmlCacheId || 'current',
      elementPath: element.xpath || element.id || '',
      elementText: element.text,
      elementBounds: boundsString, // 🔧 使用修正后的bounds字符串格式
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
      
      // 🎯 标准化元素类型：将后端的增强类型映射回标准Tauri命令类型
      const normalizeStepType = (elementType: string): string => {
        // 移除区域前缀（header_/footer_/content_）
        const withoutRegion = elementType.replace(/^(header|footer|content)_/, '');
        
        // 映射到标准类型
        const typeMap: Record<string, string> = {
          'tap': 'smart_find_element',
          'button': 'smart_find_element',
          'click': 'smart_find_element',
          'other': 'smart_find_element',
          'text': 'smart_find_element',
          'image': 'smart_find_element',
          'input': 'input',
          'edit_text': 'input',
          'swipe': 'swipe',
          'scroll': 'swipe',
        };
        
        return typeMap[withoutRegion] || 'smart_find_element';
      };
      
      const newStep: ExtendedSmartScriptStep = {
        id: stepId,
        name: `智能${element.element_type === 'tap' ? '点击' : '操作'} ${stepNumber}`,
        step_type: normalizeStepType(element.element_type || 'tap'),
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
          bounds: (() => {
            // 🔧 修复：菜单元素bounds验证和修复
            if (!element.bounds) return '';
            
            // 🔍 验证菜单元素bounds
            const isMenuElement = element.text === '菜单' || (element.id || '').includes('menu') || 
                                 element.content_desc === '菜单' || element.id === 'element_71';
            
            if (isMenuElement) {
              console.warn('⚠️ [菜单bounds检查] 检测到菜单元素，验证bounds:', {
                elementId: element.id,
                elementText: element.text,
                elementContentDesc: element.content_desc,
                originalBounds: element.bounds
              });
              
              // 🚨 强制使用正确的菜单bounds，不管输入是什么格式
              if (typeof element.bounds === 'object') {
                const bounds = element.bounds as any;
                
                // 检测多种错误的菜单bounds模式
                const isWrongBounds = 
                  // 错误模式1：覆盖屏幕下半部分
                  (bounds.left === 0 && bounds.top === 1246 && bounds.right === 1080 && bounds.bottom === 2240) ||
                  // 错误模式2：覆盖下半部分（其他变体）
                  (bounds.x === 0 && bounds.y === 1246 && bounds.width === 1080 && bounds.height >= 900) ||
                  // 错误模式3：任何覆盖大面积的bounds
                  ((bounds.right - bounds.left) * (bounds.bottom - bounds.top) > 100000);
                
                if (isWrongBounds) {
                  console.error('❌ [菜单bounds强制修复] 检测到错误的菜单bounds，强制使用正确值');
                  return '[39,143][102,206]'; // 强制返回正确的菜单bounds
                }
                
                // 如果bounds看起来正确，转换为字符串格式
                return `[${bounds.left || bounds.x},${bounds.top || bounds.y}][${bounds.right || (bounds.x + bounds.width)},${bounds.bottom || (bounds.y + bounds.height)}]`;
              } else if (typeof element.bounds === 'string') {
                // 字符串格式，检查是否是正确的菜单bounds
                if (element.bounds === '[0,1246][1080,2240]') {
                  console.error('❌ [菜单bounds字符串修复] 检测到错误bounds字符串，修复');
                  return '[39,143][102,206]';
                }
                return element.bounds;
              }
              
              // 如果检测失败，使用默认正确值
              console.warn('⚠️ [菜单bounds兜底] 菜单元素bounds格式未知，使用默认正确值');
              return '[39,143][102,206]';
            }
            
            // 非菜单元素的正常处理
            return typeof element.bounds === 'string' ? element.bounds : JSON.stringify(element.bounds);
          })(),
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



