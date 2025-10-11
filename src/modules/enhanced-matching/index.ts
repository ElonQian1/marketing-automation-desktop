/**
 * enhanced-matching/index.ts
 * 增强匹配系统导出文件 - 提供统一的对外接口
 */

// === 导入 ===
import { SmartConditionGenerator } from './generator/SmartConditionGenerator';
import { StrategyDecisionEngine } from '../intelligent-strategy-system/core/StrategyDecisionEngine';

// === 核心类型 ===
export type {
  NodeLevel,
  FieldHierarchy,
  EnhancedMatchField,
  NodeHierarchyAnalysis,
  SmartMatchingConditions,
  MatchingOptimizationOptions
} from './types';

// === 核心分析器 ===
export { HierarchyAnalyzer } from './analyzer/HierarchyAnalyzer';

// === 智能生成器 ===
export { SmartConditionGenerator } from './generator/SmartConditionGenerator';

// === UI 组件 ===
export { 
  HierarchyFieldDisplay,
  HierarchyFieldChips 
} from './components/HierarchyFieldDisplay';

// === 集成助手 ===
export { EnhancedMatchingHelper } from './integration/EnhancedMatchingHelper';

// === 便捷方法 ===
import type { MatchingOptimizationOptions } from './types';

/**
 * 快速生成增强匹配条件
 * @param element XML元素
 * @param xmlDocument XML文档
 * @param options 可选的优化选项
 */
export async function generateEnhancedMatching(
  element: Element,
  xmlDocument: Document,
  options?: Partial<MatchingOptimizationOptions>
) {
  
  const defaultOptions = {
    enableParentContext: true,
    enableChildContext: true,
    enableDescendantSearch: false,
    maxDepth: 2,
    prioritizeSemanticFields: true,
    excludePositionalFields: true
  };

  const finalOptions = { ...defaultOptions, ...options };
  
  // 🔄 迁移到新的统一接口
  try {
    const engine = new StrategyDecisionEngine();
    // 转换 Document 为 XML 字符串
    const xmlContent = new XMLSerializer().serializeToString(xmlDocument);
    const result = await engine.analyzeAndRecommend(element, xmlContent);
    
    // 转换为旧格式以保持兼容性
    return {
      strategy: result.strategy,
      fields: [], // TODO: 从新接口提取关键字段
      values: {}, // TODO: 从新接口提取字段值
      confidence: result.confidence,
      hierarchy: [] // TODO: 从新接口提取层级信息
    };
  } catch (error) {
    console.warn('新的策略引擎调用失败，回退到旧接口', error);
    return SmartConditionGenerator.generateSmartConditions(element, xmlDocument, finalOptions);
  }
}

/**
 * 快速分析节点层级
 * @param element XML元素
 * @param xmlDocument XML文档
 */
export function analyzeNodeHierarchy(element: Element, xmlDocument: Document) {
  return Promise.resolve().then(async () => {
    const mod = await import('./analyzer/HierarchyAnalyzer');
    return mod.HierarchyAnalyzer.analyzeNodeHierarchy(element, xmlDocument);
  });
}

/**
 * 预设的匹配优化选项
 */
export const MATCHING_PRESETS = {
  // 跨设备兼容模式
  CROSS_DEVICE: {
    enableParentContext: true,
    enableChildContext: true,
    enableDescendantSearch: false,
    maxDepth: 2,
    prioritizeSemanticFields: true,
    excludePositionalFields: true
  } as MatchingOptimizationOptions,
  
  // 精确匹配模式
  STRICT: {
    enableParentContext: false,
    enableChildContext: false,
    enableDescendantSearch: false,
    maxDepth: 1,
    prioritizeSemanticFields: true,
    excludePositionalFields: false
  } as MatchingOptimizationOptions,
  
  // 智能层级模式
  SMART_HIERARCHY: {
    enableParentContext: true,
    enableChildContext: true,
    enableDescendantSearch: true,
    maxDepth: 3,
    prioritizeSemanticFields: true,
    excludePositionalFields: true
  } as MatchingOptimizationOptions
};