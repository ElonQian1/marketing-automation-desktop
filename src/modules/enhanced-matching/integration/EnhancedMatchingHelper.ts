/**
 * enhanced-matching/integration/EnhancedMatchingHelper.ts
 * 增强匹配助手 - 集成到现有 usePageFinder 工作流
 */

import { 
  HierarchyAnalyzer,
  generateEnhancedMatching,
  MATCHING_PRESETS,
  SmartMatchingConditions,
  MatchingOptimizationOptions
} from '../index';
import { StrategyDecisionEngine } from '../../intelligent-strategy-system/core/StrategyDecisionEngine';
import { 
  buildAndCacheDefaultMatchingFromElement,
  BuiltMatchingResult 
} from '../../../pages/SmartScriptBuilderPage/helpers/matchingHelpers';
import { saveLatestMatching } from '../../../components/universal-ui/views/grid-view/matchingCache';
import { cleanXmlContent } from '../../../components/universal-ui/xml-parser/cleanXml';
import { XPathService } from '../../../utils/xpath';

export interface EnhancedElementLike {
  resource_id?: string;
  text?: string;
  content_desc?: string;
  class_name?: string;
  bounds?: any;
  xpath?: string;
  element_path?: string;
  
  // 扩展属性
  clickable?: string;
  enabled?: string;
  selected?: string;
  checkable?: string;
  checked?: string;
  scrollable?: string;
  package?: string;
  index?: string;
}

export interface EnhancedMatchingOptions {
  /** 使用增强匹配系统 */
  useEnhancedMatching?: boolean;
  /** XML上下文内容 */
  xmlContext?: string;
  /** 匹配优化选项 */
  optimizationOptions?: Partial<MatchingOptimizationOptions>;
  /** 降级选项：增强匹配失败时是否降级到原有逻辑 */
  fallbackToLegacy?: boolean;
  /** 调试模式：输出详细日志 */
  debug?: boolean;
}

/**
 * 增强匹配条件构建器
 * 优先使用智能层级分析，失败时降级到原有逻辑
 */
export class EnhancedMatchingHelper {
  
  /**
   * 从元素构建增强匹配条件
   * @param element 元素对象
   * @param options 增强匹配选项
   */
  static async buildEnhancedMatching(
    element: EnhancedElementLike,
    options: EnhancedMatchingOptions = {}
  ): Promise<BuiltMatchingResult | null> {
    const {
      useEnhancedMatching = true,
      xmlContext,
      optimizationOptions,
      fallbackToLegacy = true,
      debug = false
    } = options;

    // 🔥 XPath 直接索引优先（最快匹配方式）
    const xpath = element.xpath || element.element_path;
    if (xpath && typeof xpath === 'string' && xpath.trim() && XPathService.isValid(xpath.trim())) {
      const xpathResult: BuiltMatchingResult = {
        strategy: 'xpath-direct',
        fields: ['xpath'],
        values: { xpath: xpath.trim() }
      };
      
      if (debug) {
        console.log('🎯 XPath 直接匹配优先返回:', xpathResult);
      }
      
      // 保存到缓存
      saveLatestMatching({ 
        strategy: xpathResult.strategy, 
        fields: xpathResult.fields 
      });
      
      return xpathResult;
    }

    // 调试日志
    if (debug) {
      console.log('🧩 增强匹配系统启动:', {
        useEnhanced: useEnhancedMatching,
        hasXmlContext: !!xmlContext,
        elementFields: Object.keys(element).filter(k => element[k as keyof typeof element])
      });
    }

    // 🆕 检测隐藏元素（bounds=[0,0][0,0] 或类似的空bounds）
    const bounds = element.bounds;
    let boundsStr: string | undefined;
    if (typeof bounds === 'string') {
      boundsStr = bounds;
    } else if (bounds && typeof bounds === 'object' && 'left' in bounds) {
      const b = bounds as any;
      boundsStr = `[${b.left},${b.top}][${b.right},${b.bottom}]`;
    }
    
    const isHiddenElement = boundsStr === '[0,0][0,0]' || boundsStr === '' || 
                           boundsStr === null || boundsStr === undefined || 
                           boundsStr === '[0,0,0,0]' || boundsStr === '0,0,0,0' || 
                           boundsStr === '[0][0]';

    if (debug) {
      console.log('🔍 [EnhancedMatchingHelper] 隐藏元素检测:', {
        bounds: boundsStr,
        isHiddenElement,
        text: element.text,
        contentDesc: element.content_desc,
        resourceId: element.resource_id
      });
    }

    // 🎯 隐藏元素特殊处理
    if (isHiddenElement) {
      if (debug) {
        console.log('🎯 [EnhancedMatchingHelper] 检测到隐藏元素，使用父容器查找策略');
      }
      
      // 为隐藏元素返回隐藏元素父查找策略
      const hiddenElementResult: BuiltMatchingResult = {
        strategy: 'hidden-element-parent',
        fields: ['text', 'content-desc', 'resource-id', 'class'],
        values: {
          'text': element.text || '',
          'content-desc': element.content_desc || '',
          'resource-id': element.resource_id || '',
          'class': element.class_name || ''
        },
        // 添加隐藏元素父查找配置
        hiddenElementParentConfig: {
          targetText: element.text || element.content_desc || '',
          maxTraversalDepth: 5,
          clickableIndicators: ['Button', 'ImageButton', 'TextView', 'LinearLayout', 'RelativeLayout'],
          excludeIndicators: ['ScrollView', 'ListView', 'RecyclerView'],
          confidenceThreshold: 0.7
        }
      };

      if (debug) {
        console.log('✅ [EnhancedMatchingHelper] 隐藏元素策略生成完成:', hiddenElementResult);
      }

      return hiddenElementResult;
    }

    // 尝试使用增强匹配系统
    if (useEnhancedMatching && xmlContext) {
      try {
        const enhancedResult = await this.tryEnhancedMatching(element, xmlContext, optimizationOptions, debug);
        if (enhancedResult) {
          // 保存到缓存
          saveLatestMatching({ 
            strategy: enhancedResult.strategy, 
            fields: enhancedResult.fields 
          });
          
          if (debug) {
            console.log('✅ 增强匹配成功:', enhancedResult);
          }
          
          return enhancedResult;
        }
      } catch (error) {
        console.warn('🚨 增强匹配失败:', error);
        
        if (!fallbackToLegacy) {
          return null;
        }
      }
    }

    // 降级到原有逻辑
    if (fallbackToLegacy) {
      if (debug) {
        console.log('🔄 降级到原有匹配逻辑');
      }
      
      return buildAndCacheDefaultMatchingFromElement(element, {
        xmlContext,
        enableChildNodeExtraction: true,
        enableParentNodeExtraction: true
      });
    }

    return null;
  }

  /**
   * 尝试使用增强匹配系统
   */
  private static async tryEnhancedMatching(
    element: EnhancedElementLike,
    xmlContext: string,
    optimizationOptions?: Partial<MatchingOptimizationOptions>,
    debug?: boolean
  ): Promise<BuiltMatchingResult | null> {
    // 解析XML上下文（先清洗，避免 BOM/前缀噪声）
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(cleanXmlContent(xmlContext), 'text/xml');
    
    if (xmlDoc.documentElement.tagName === 'parsererror') {
      throw new Error('XML解析失败');
    }

    // 查找目标元素
    const targetElement = this.findElementInXml(xmlDoc, element);
    if (!targetElement) {
      throw new Error('在XML中未找到目标元素');
    }

    // 使用增强匹配系统生成条件
    const finalOptions = {
      enableParentContext: true,
      enableChildContext: true,
      enableDescendantSearch: false, // 保守设置，避免性能问题
      maxDepth: 2,
      prioritizeSemanticFields: true,
      excludePositionalFields: true,
      ...optimizationOptions
    };

    // 使用新的智能决策引擎
    const engine = new StrategyDecisionEngine();
    const recommendation = await engine.analyzeAndRecommend(targetElement, xmlDoc.toString());
    
    // 从元素提取字段值
    const extractFieldValues = (element: any): Record<string, string> => {
      const attrs = element.attributes || {};
      const values: Record<string, string> = {};
      
      // 常用字段映射
      const fieldMapping = {
        'resource-id': attrs.resourceId || '',
        'text': attrs.text || '',
        'content-desc': attrs.contentDescription || '',
        'class': attrs.className || '',
        'bounds': attrs.bounds || ''
      };
      
      Object.entries(fieldMapping).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          values[key] = value;
        }
      });
      
      return values;
    };
    
    // 转换为兼容的 SmartMatchingConditions 格式
    const smartConditions: SmartMatchingConditions = {
      strategy: recommendation.strategy || 'custom',
      fields: ['resource-id', 'text', 'content-desc', 'class'], // 根据策略推荐确定字段
      values: extractFieldValues(targetElement),
      includes: {},
      excludes: {},
      hierarchy: [], // 可以从 recommendation 中提取更多信息
      confidence: recommendation.confidence || 0.5,
      analysis: HierarchyAnalyzer.analyzeNodeHierarchy(targetElement, xmlDoc)
    };

    if (debug) {
      console.log('🎯 智能匹配分析结果:', {
        strategy: smartConditions.strategy,
        fieldsCount: smartConditions.fields.length,
        confidence: smartConditions.confidence,
        hierarchy: smartConditions.hierarchy.map(h => `${h.level}.${h.fieldName}`)
      });
    }

    // 转换为兼容格式
    return {
      strategy: smartConditions.strategy,
      fields: smartConditions.fields,
      values: smartConditions.values
    };
  }

  /**
   * 在XML文档中查找对应元素
   */
  private static findElementInXml(xmlDoc: Document, element: EnhancedElementLike): Element | null {
    // 1. 优先使用XPath查找
    if (element.xpath || element.element_path) {
      const xpath = element.xpath || element.element_path;
      try {
        const result = xmlDoc.evaluate(xpath!, xmlDoc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const node = result.singleNodeValue as Node | null;
        if (node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            return node as Element;
          }
          // 有些实现可能返回属性/文本节点，取其父元素
          const parent = (node as any).parentElement || (node as any).parentNode;
          if (parent && parent.nodeType === Node.ELEMENT_NODE) {
            return parent as Element;
          }
        }
      } catch (error) {
        console.warn('XPath查找失败:', error);
      }
    }

    // 2. 使用属性匹配查找（优先使用 bounds 精确匹配）
    const allElements = xmlDoc.querySelectorAll('*');
    // 2.1 bounds 精确匹配（当提供时）
    let boundsStr: string | null = null;
    if (element && element.bounds) {
      if (typeof element.bounds === 'string') {
        boundsStr = element.bounds;
      } else if (
        typeof element.bounds === 'object' &&
        ['left','top','right','bottom'].every(k => k in (element.bounds as any))
      ) {
        const b = element.bounds as any;
        boundsStr = `[${b.left},${b.top}][${b.right},${b.bottom}]`;
      }
    }
    if (boundsStr) {
      for (const el of Array.from(allElements)) {
        if ((el as Element).getAttribute('bounds') === boundsStr) {
          return el as Element;
        }
      }
    }

    // 2.2 其他关键字段匹配
    for (const el of Array.from(allElements)) {
      if (this.isElementMatch(el, element)) {
        return el;
      }
    }

    return null;
  }

  /**
   * 检查元素是否匹配
   */
  private static isElementMatch(xmlElement: Element, targetElement: EnhancedElementLike): boolean {
    // 多字段综合匹配
    let matchScore = 0;
    let totalChecks = 0;

    const checkField = (xmlAttr: string, targetValue: string | undefined) => {
      totalChecks++;
      if (xmlElement.getAttribute(xmlAttr) === targetValue) {
        matchScore++;
        return true;
      }
      return false;
    };

    // 检查关键字段
    if (targetElement.resource_id) {
      checkField('resource-id', targetElement.resource_id);
    }
    if (targetElement.text) {
      checkField('text', targetElement.text);
    }
    if (targetElement.content_desc) {
      checkField('content-desc', targetElement.content_desc);
    }
    if (targetElement.class_name) {
      checkField('class', targetElement.class_name);
    }

    // bounds 精确匹配（若提供）
    if (targetElement.bounds) {
      let boundsStr: string | undefined;
      if (typeof targetElement.bounds === 'string') {
        boundsStr = targetElement.bounds;
      } else if (
        typeof targetElement.bounds === 'object' &&
        ['left','top','right','bottom'].every(k => k in (targetElement.bounds as any))
      ) {
        const b = targetElement.bounds as any;
        boundsStr = `[${b.left},${b.top}][${b.right},${b.bottom}]`;
      }
      if (boundsStr) {
        checkField('bounds', boundsStr);
      }
    }

    // 需要至少50%的字段匹配
    return totalChecks > 0 && (matchScore / totalChecks) >= 0.5;
  }

  /**
   * 获取预设匹配选项
   */
  static getPresetOptions(preset: keyof typeof MATCHING_PRESETS): EnhancedMatchingOptions {
    return {
      useEnhancedMatching: true,
      optimizationOptions: MATCHING_PRESETS[preset],
      fallbackToLegacy: true,
      debug: false
    };
  }

  /**
   * 跨设备兼容模式
   */
  static getCrossDeviceOptions(): EnhancedMatchingOptions {
    return this.getPresetOptions('CROSS_DEVICE');
  }

  /**
   * 智能层级模式
   */
  static getSmartHierarchyOptions(): EnhancedMatchingOptions {
    return this.getPresetOptions('SMART_HIERARCHY');
  }

  /**
   * 严格匹配模式
   */
  static getStrictOptions(): EnhancedMatchingOptions {
    return this.getPresetOptions('STRICT');
  }
}