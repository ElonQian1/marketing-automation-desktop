// src/pages/SmartScriptBuilderPage/helpers/intelligentDataTransfer.ts
// module: ui | layer: application | role: 智能分析数据传递核心模块
// summary: 确保智能分析生成的XPath、XML快照、策略信息完整传递到后端

import type { ExtendedSmartScriptStep } from "../../../types/loopScript";

/**
 * 🧠 智能分析步骤数据完整性检查和传递
 *
 * 解决的核心问题：
 * 1. 用户点击可视化元素 → 获得精确XPath
 * 2. 智能分析生成候选策略 → 保存到步骤卡片
 * 3. 步骤卡片保存原始XML快照 → 用于失败恢复
 * 4. 真机执行时数据完整传递 → 避免数据丢失
 */

/**
 * 数据存储位置说明：
 * - 原始XML快照：前端XmlCacheManager内存缓存 + 步骤参数xmlSnapshot
 * - 用户选择的XPath：步骤参数element_selector + xmlSnapshot.elementGlobalXPath
 * - 智能策略候选：strategySelector.analysis.result
 * - 最终选择策略：strategySelector.selectedStrategy/selectedStep
 */

export interface IntelligentStepDataPackage {
  // 核心识别信息
  stepId: string;
  isIntelligentStep: boolean;

  // 原始数据（失败恢复核心）
  originalXmlContent: string;
  originalXmlHash: string;
  userSelectedXPath: string;

  // 元素信息
  elementText: string;
  elementBounds: string;
  keyAttributes: Record<string, string>;

  // 🔥 子元素文本列表（用于解决resource-id歧义问题）
  // Bug Fix: WRONG_ELEMENT_SELECTION_BUG_REPORT.md
  childrenTexts: string[];

  // 🔥 NEW: 子元素content-desc列表（解决"视而不见"问题）
  childrenContentDescs: string[];

  // 🔥 NEW: 兄弟元素文本列表（精确定位中层容器）
  siblingTexts: string[];

  // 🔥 NEW: 父元素信息（上下文匹配）
  parentInfo: {
    contentDesc?: string;
    text?: string;
    resourceId?: string;
  } | null;

  // 🔥 NEW: 匹配策略标记（告诉后端如何匹配）
  /**
   * 🎯 匹配策略类型：
   * - direct_match: 直接文本/属性匹配（元素自身有text/content-desc）
   * - anchor_by_child_text: 用子元素文本作为锚点（向下找文本，向上找可点击父）
   * - anchor_by_sibling_text: 用兄弟元素文本作为锚点（同层找文本+容器）
   * - anchor_by_parent_text: 用父元素文本作为锚点（向上找文本容器）
   * - anchor_by_child_or_parent_text: 灵活锚点（子或父，后端决策）
   * - region_scoped_index: 区域限定+局部索引（优先于全局索引）
   * - global_index_fallback: 全局索引兜底（最后手段）
   */
  matchingStrategy:
    | "direct_match"
    | "anchor_by_child_text"
    | "anchor_by_sibling_text"
    | "anchor_by_parent_text"
    | "anchor_by_child_or_parent_text"
    | "region_scoped_index"
    | "global_index_fallback";

  // 策略信息
  selectedStrategy: string;
  strategyConfidence: number;
  strategyType: string;

  // 数据完整性标记
  hasOriginalXml: boolean;
  hasUserXPath: boolean;
  hasStrategyInfo: boolean;
}

/**
 * 🔥 提取元素的子元素文本列表（递归）
 * Bug Fix: WRONG_ELEMENT_SELECTION_BUG_REPORT.md - 解决resource-id歧义问题
 */
function extractChildrenTexts(element: Record<string, unknown>): string[] {
  const texts: string[] = [];

  if (!element || typeof element !== "object") {
    return texts;
  }

  // 提取子元素文本
  const children = element.children;
  if (children && Array.isArray(children)) {
    for (const child of children) {
      const childObj = child as Record<string, unknown>;
      // 直接子元素的文本
      if (
        childObj.text &&
        typeof childObj.text === "string" &&
        childObj.text.trim()
      ) {
        texts.push(childObj.text.trim());
      }
      if (
        childObj.content_desc &&
        typeof childObj.content_desc === "string" &&
        childObj.content_desc.trim()
      ) {
        texts.push(childObj.content_desc.trim());
      }
      // 递归提取孙子元素文本
      const grandChildTexts = extractChildrenTexts(childObj);
      texts.push(...grandChildTexts);
    }
  }

  return texts;
}

/**
 * 从智能分析步骤中提取完整的数据包
 */
export function extractIntelligentStepData(
  step: ExtendedSmartScriptStep
): IntelligentStepDataPackage {
  console.log("📦 [数据提取] 开始提取智能步骤数据:", step.id);

  const params = step.parameters || {};
  const analysis = step.strategySelector?.analysis;
  const analysisResult = analysis?.result as any;

  // 🎯 第一数据源：步骤参数中的xmlSnapshot（最可靠的原始数据）
  const snapshot = params.xmlSnapshot as any;
  const originalXmlContent = snapshot?.xmlContent || snapshot?.text || "";
  const originalXmlHash = snapshot?.xmlHash || snapshot?.hash || "";
  const userSelectedXPath =
    snapshot?.elementGlobalXPath || params.element_selector || "";

  // 🎯 第二数据源：元素基础信息
  const elementText = String(params.text || "");
  const elementBounds = String(params.bounds || "");
  const keyAttributes = {
    "resource-id": String(
      params.resource_id || snapshot?.elementSignature?.resourceId || ""
    ),
    "content-desc": String(
      params.content_desc || snapshot?.elementSignature?.contentDesc || ""
    ),
    text: String(params.text || snapshot?.elementSignature?.text || ""),
    class: String(params.class_name || snapshot?.elementSignature?.class || ""),
  };

  // 🔥 NEW: 提取子元素文本（用于解决底部导航栏等resource-id歧义场景）
  // 优先从 elementSignature 中读取（已保存的数据），否则从 element 中提取
  const childrenTexts =
    snapshot?.elementSignature?.childrenTexts ||
    extractChildrenTexts(snapshot?.element || params.element || {});
  console.log(
    "🔍 [子元素提取] 发现子元素文本:",
    childrenTexts.length,
    "个:",
    childrenTexts
  );

  // 🔥 NEW: 提取子元素content-desc（解决"视而不见"问题）
  const childrenContentDescs =
    snapshot?.elementSignature?.childrenContentDescs || [];
  console.log(
    "🔍 [子元素提取] 发现子元素content-desc:",
    childrenContentDescs.length,
    "个:",
    childrenContentDescs
  );

  // 🔥 NEW: 提取兄弟元素文本（用于精确定位中层容器）
  const siblingTexts = snapshot?.elementSignature?.siblingTexts || [];
  console.log(
    "🔍 [兄弟元素提取] 发现兄弟元素文本:",
    siblingTexts.length,
    "个:",
    siblingTexts
  );

  // 🔥 NEW: 提取父元素信息（用于上下文匹配）
  const parentInfo = snapshot?.elementSignature?.parentInfo || null;

  // 🔥 NEW: 匹配策略标记
  const matchingStrategy =
    snapshot?.elementSignature?.matchingStrategy ||
    (params.matching as any)?.preferredStrategy ||
    "direct_match";
  console.log("🎯 [匹配策略] 使用策略:", matchingStrategy);

  // 🎯 第三数据源：智能分析结果中的策略信息
  let strategyConfidence = 0.8;
  let strategyType = "intelligent";
  let finalXPath = userSelectedXPath;

  if (analysisResult?.recommendedStrategy) {
    const strategy = analysisResult.recommendedStrategy;
    strategyConfidence = strategy.confidence || 0.8;
    strategyType = strategy.variant || strategy.key || "intelligent";
    finalXPath = strategy.xpath || userSelectedXPath; // 策略可能提供更优化的XPath
  }

  // 🎯 第四数据源：用户最终选择
  const selectedStrategy =
    step.strategySelector?.selectedStrategy || "smart-auto";

  // 📊 数据完整性检查
  const hasOriginalXml = originalXmlContent.length > 0;
  const hasUserXPath = userSelectedXPath.length > 0;
  const hasStrategyInfo = !!analysisResult?.recommendedStrategy;

  const dataPackage: IntelligentStepDataPackage = {
    stepId: step.id,
    isIntelligentStep: !!step.enableStrategySelector,

    originalXmlContent,
    originalXmlHash,
    userSelectedXPath: finalXPath, // 使用最优化的XPath

    elementText,
    elementBounds,
    keyAttributes,

    // 🔥 NEW: 子元素文本列表
    childrenTexts,
    // 🔥 NEW: 子元素content-desc列表（解决"视而不见"问题）
    childrenContentDescs,
    // 🔥 NEW: 兄弟元素文本列表
    siblingTexts,
    // 🔥 NEW: 父元素信息
    parentInfo,
    // 🔥 NEW: 匹配策略标记
    matchingStrategy,

    selectedStrategy,
    strategyConfidence,
    strategyType,

    hasOriginalXml,
    hasUserXPath,
    hasStrategyInfo,
  };

  // 🚨 数据完整性验证
  const criticalDataMissing = !hasOriginalXml || !hasUserXPath;
  if (criticalDataMissing) {
    console.error("❌ [数据完整性] 智能步骤关键数据缺失:", {
      stepId: step.id,
      hasOriginalXml,
      hasUserXPath,
      hasStrategyInfo,
      xmlLength: originalXmlContent.length,
      xpathLength: finalXPath.length,
    });
  } else {
    console.log("✅ [数据完整性] 智能步骤数据完整:", {
      stepId: step.id,
      xmlLength: originalXmlContent.length,
      hasXPath: hasUserXPath,
      confidence: strategyConfidence,
      strategyType,
    });
  }

  return dataPackage;
}

/**
 * 将数据包转换为后端执行参数格式
 */
export function buildBackendParameters(
  dataPackage: IntelligentStepDataPackage,
  originalParams: Record<string, unknown>
): Record<string, unknown> {
  // 🔧 构建original_data（后端失败恢复的核心数据结构）
  const originalData = {
    // 原始XML快照（失败恢复时重新分析用）
    original_xml: dataPackage.originalXmlContent,
    xml_hash: dataPackage.originalXmlHash,

    // 用户选择的精确XPath（静态分析结果）
    selected_xpath: dataPackage.userSelectedXPath,

    // 元素特征信息
    element_text: dataPackage.elementText,
    element_bounds: dataPackage.elementBounds,
    key_attributes: dataPackage.keyAttributes,

    // 🔥 NEW: 子元素文本列表（解决resource-id歧义问题）
    // Bug Fix: WRONG_ELEMENT_SELECTION_BUG_REPORT.md
    children_texts: dataPackage.childrenTexts,

    // 🔥 NEW: 子元素content-desc列表（解决"视而不见"问题）
    children_content_descs: dataPackage.childrenContentDescs,

    // 🔥 NEW: 兄弟元素文本列表（精确定位中层容器）
    sibling_texts: dataPackage.siblingTexts,

    // 🔥 NEW: 父元素信息（上下文匹配）
    parent_info: dataPackage.parentInfo,

    // 🔥 NEW: 匹配策略标记（告诉后端如何匹配）
    matching_strategy: dataPackage.matchingStrategy,

    // 策略信息
    strategy_type: dataPackage.strategyType,
    confidence: dataPackage.strategyConfidence,

    // 数据完整性标记
    data_integrity: {
      has_original_xml: dataPackage.hasOriginalXml,
      has_user_xpath: dataPackage.hasUserXPath,
      has_strategy_info: dataPackage.hasStrategyInfo,
      has_children_texts: dataPackage.childrenTexts.length > 0,
      has_children_content_descs: dataPackage.childrenContentDescs.length > 0, // 🆕
      has_sibling_texts: dataPackage.siblingTexts.length > 0,
      has_parent_info: !!dataPackage.parentInfo,
      extraction_timestamp: Date.now(),
    },
  };

  // 🚀 构建完整的后端执行参数
  const backendParams = {
    ...originalParams,

    // 🏷️ 智能分析标识（后端路由判断）
    intelligent_analysis: true,
    analysis_completed: true,

    // 🎯 用户决策记录
    selected_strategy: dataPackage.selectedStrategy,

    // 📦 失败恢复数据包（核心）
    original_data: originalData,

    // 🔄 直接访问字段（后端兼容性）
    xpath: dataPackage.userSelectedXPath,
    targetText: dataPackage.elementText,
    target_content_desc: dataPackage.keyAttributes["content-desc"] || "", // 🔥 FIX: 传递 content-desc
    target_element_hint: dataPackage.elementText, // 🔥 NEW: 后端回退逻辑需要此字段
    confidence: dataPackage.strategyConfidence,
    strategy_type: dataPackage.strategyType,

    // 📊 调试信息
    debug_info: {
      step_id: dataPackage.stepId,
      data_sources: {
        xml_from_snapshot: dataPackage.hasOriginalXml,
        xpath_from_user_selection: dataPackage.hasUserXPath,
        strategy_from_analysis: dataPackage.hasStrategyInfo,
      },
    },
  };

  console.log("🚀 [参数构建] 后端执行参数已构建:", {
    stepId: dataPackage.stepId,
    hasOriginalData: !!backendParams.original_data,
    hasXPath: !!backendParams.xpath,
    xmlSize: dataPackage.originalXmlContent.length,
    confidence: backendParams.confidence,
  });

  return backendParams;
}

/**
 * 🔧 主入口：智能分析步骤的完整数据传递处理
 */
export function enhanceIntelligentStepForBackend(
  step: ExtendedSmartScriptStep
): ExtendedSmartScriptStep {
  // 提取完整数据包
  const dataPackage = extractIntelligentStepData(step);

  // 构建后端参数
  const enhancedParameters = buildBackendParameters(
    dataPackage,
    step.parameters || {}
  );

  // 返回增强的步骤
  // 🔧 修复：保留原始步骤类型，不要强制改成 smart_tap
  // 这样可以确保滚动、输入、按键等不同类型的步骤能被正确识别和执行
  return {
    ...step,
    step_type: step.step_type, // ✅ 保留原始类型
    parameters: enhancedParameters,
  };
}

/**
 * 🔍 数据完整性诊断工具
 */
export function diagnoseStepDataIntegrity(step: ExtendedSmartScriptStep): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // 检查是否是智能分析步骤
  if (!step.enableStrategySelector) {
    issues.push("步骤未启用策略选择器");
    recommendations.push("确保在创建步骤时设置 enableStrategySelector: true");
  }

  // 检查XML快照
  const snapshot = step.parameters?.xmlSnapshot as any;
  if (!snapshot?.xmlContent) {
    issues.push("缺少原始XML快照");
    recommendations.push("确保在创建步骤时保存完整的XML内容");
  }

  // 检查XPath
  const xpath =
    snapshot?.elementGlobalXPath || step.parameters?.element_selector;
  if (!xpath) {
    issues.push("缺少用户选择的XPath");
    recommendations.push("确保保存用户在静态分析中选择的精确XPath");
  }

  // 检查策略分析结果
  const analysisResult = step.strategySelector?.analysis?.result;
  if (!analysisResult) {
    issues.push("缺少智能分析结果");
    recommendations.push("确保智能分析完成后保存分析结果");
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations,
  };
}
