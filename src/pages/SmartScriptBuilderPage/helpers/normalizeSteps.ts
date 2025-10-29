// src/pages/SmartScriptBuilderPage/helpers/normalizeSteps.ts
// module: ui | layer: application | role: 步骤规范化和数据传递核心
// summary: 智能分析和传统步骤的统一规范化处理，确保关键数据完整传递到后端

import type { ExtendedSmartScriptStep } from "../../../types/loopScript";
import { 
  enhanceIntelligentStepForBackend, 
  diagnoseStepDataIntegrity 
} from "./intelligentDataTransfer";

/**
 * 🔧 统一bounds格式为字符串：[left,top][right,bottom]
 * 
 * 解决问题：
 * - 测试按钮：boundsString直接传递 → "[754,2047][943,2121]" ✅
 * - 执行脚本：序列化后变成 {"left":754,"top":2047,"right":943,"bottom":2121} ❌
 * 
 * 修复：检测对象格式并转换为 Rust 后端能解析的字符串格式
 */
function normalizeBoundsFormat(bounds: unknown): string {
  if (!bounds) {
    return '';
  }
  
  // 情况1：已经是正确的字符串格式 "[left,top][right,bottom]"
  if (typeof bounds === 'string') {
    // 检查是否是 JSON 字符串（脚本保存后可能被序列化）
    if (bounds.startsWith('{') && bounds.includes('"left"')) {
      try {
        const parsed = JSON.parse(bounds) as { left: number; top: number; right: number; bottom: number };
        return `[${parsed.left},${parsed.top}][${parsed.right},${parsed.bottom}]`;
      } catch {
        console.warn('⚠️ [Bounds格式] 无法解析JSON字符串:', bounds);
        return bounds; // 返回原始值
      }
    }
    // 已经是正确格式，直接返回
    return bounds;
  }
  
  // 情况2：是对象格式 { left, top, right, bottom }
  if (typeof bounds === 'object' && bounds !== null) {
    const b = bounds as { left?: number; top?: number; right?: number; bottom?: number };
    if (b.left !== undefined && b.top !== undefined && b.right !== undefined && b.bottom !== undefined) {
      const formatted = `[${b.left},${b.top}][${b.right},${b.bottom}]`;
      console.log('✅ [Bounds格式] 对象 → 字符串:', { 原始: bounds, 转换后: formatted });
      return formatted;
    }
  }
  
  console.warn('⚠️ [Bounds格式] 无法识别的bounds格式:', bounds);
  return String(bounds);
}

// 🔧 智能分析步骤优先处理 + 传统步骤兼容处理
export function normalizeStepForBackend(step: ExtendedSmartScriptStep): ExtendedSmartScriptStep {
  try {
    console.log('🔍 [步骤标准化] 开始处理:', {
      stepId: step.id,
      stepType: step.step_type,
      stepName: step.name,
      hasStrategySelector: !!step.enableStrategySelector
    });
    
    // 🧠 第一优先级：智能分析步骤（包含策略选择器）
    if (step.enableStrategySelector) {
      console.log('🧠 [智能步骤] 检测到智能分析步骤，使用专用处理器:', step.id);
      
      // 📊 数据完整性诊断
      const diagnosis = diagnoseStepDataIntegrity(step);
      if (!diagnosis.isValid) {
        console.warn('⚠️ [数据完整性] 智能步骤数据不完整:', {
          stepId: step.id,
          issues: diagnosis.issues,
          recommendations: diagnosis.recommendations
        });
      }
      
      // 使用专用的智能分析数据传递模块
      const enhanced = enhanceIntelligentStepForBackend(step);
      console.log('✅ [智能步骤] 增强完成，保留原始类型:', {
        stepId: enhanced.id,
        originalType: step.step_type,
        enhancedType: enhanced.step_type,
        typePreserved: step.step_type === enhanced.step_type
      });
      return enhanced;
    }
    
    // 📦 第二优先级：包含XML快照的传统步骤（确保失败恢复能力）
    if (step.parameters?.xmlSnapshot || step.parameters?.elementLocator) {
      console.log('📦 [传统步骤] 检测到包含数据的步骤，增强失败恢复能力:', step.id);
      return enhanceTraditionalStepWithSnapshot(step);
    }

    
    // 🔄 第三优先级：传统步骤类型规范化处理
    return normalizeTraditionalStepTypes(step);
    
  } catch (e) {
    console.warn("步骤规范化失败：", e);
    return step;
  }
}

/**
 * 🔧 增强包含XML快照的传统步骤（手动录制、导入的步骤等）
 * 确保这些步骤也具备失败恢复能力
 */
function enhanceTraditionalStepWithSnapshot(step: ExtendedSmartScriptStep): ExtendedSmartScriptStep {
  const params = step.parameters || {};
  
  // 检查是否已经有 original_data，避免重复处理
  if (params.original_data) {
    return step;
  }
  
  // 提取 XML 快照数据
  const snapshot = params.xmlSnapshot as Record<string, unknown> | undefined;
  
  // 安全访问 elementLocator 数据
  const elementLocator = params.elementLocator as Record<string, unknown> | undefined;
  const additionalInfo = elementLocator?.additionalInfo as Record<string, unknown> | undefined;
  
  // 🔥 统一 bounds 格式（修复执行脚本失败问题）
  const rawBounds = additionalInfo?.bounds || params.bounds || '';
  const normalizedBounds = normalizeBoundsFormat(rawBounds);
  
  // 🔥 NEW: 提取 elementSignature 数据（从 snapshot 中获取）
  const elementSignature = snapshot?.elementSignature as Record<string, unknown> | undefined;
  
  // 🔥 NEW: 提取子元素文本列表（关键字段！）
  const childrenTexts = elementSignature?.childrenTexts as string[] | undefined || [];
  console.log('🔍 [传统步骤增强] 提取子元素文本:', childrenTexts.length, '个:', childrenTexts);
  
  // 🔥 NEW: 提取子元素 content-desc 列表
  const childrenContentDescs = elementSignature?.childrenContentDescs as string[] | undefined || [];
  console.log('🔍 [传统步骤增强] 提取子元素content-desc:', childrenContentDescs.length, '个:', childrenContentDescs);
  
  // 🔥 NEW: 提取兄弟元素文本列表
  const siblingTexts = elementSignature?.siblingTexts as string[] | undefined || [];
  console.log('🔍 [传统步骤增强] 提取兄弟元素文本:', siblingTexts.length, '个:', siblingTexts);
  
  // 🔥 NEW: 提取父元素信息
  const parentInfo = elementSignature?.parentInfo as Record<string, unknown> | null || null;
  console.log('🔍 [传统步骤增强] 提取父元素信息:', parentInfo ? 'Yes' : 'No');
  
  // 🔥 NEW: 提取匹配策略
  const matchingStrategy = elementSignature?.matchingStrategy as string | undefined || 'direct_match';
  console.log('🎯 [传统步骤增强] 匹配策略:', matchingStrategy);
  
  // 构建传统步骤的 original_data，模仿智能步骤的数据结构
  const originalData = {
    // 优先从 xmlSnapshot 获取原始XML
    original_xml: snapshot?.xmlContent 
      || snapshot?.text 
      || params.xmlContent
      || '',
    
    // XML 哈希值
    xml_hash: snapshot?.xmlHash 
      || snapshot?.hash 
      || params.xmlHash
      || '',
    
    // 多重回退获取用户选择的精确XPath
    selected_xpath: elementLocator?.elementPath
      || additionalInfo?.xpath
      || snapshot?.elementGlobalXPath 
      || params.element_selector 
      || params.xpath
      || params.element_path
      || '',
    
    // 分析时间戳
    analysis_timestamp: snapshot?.timestamp 
      || params.xmlTimestamp
      || Date.now(),
    
    // 元素基础信息
    element_text: additionalInfo?.text 
      || params.text 
      || params.element_text
      || '',
    element_bounds: normalizedBounds,  // 🔥 使用标准化后的bounds格式
    
    // 元素特征（用于相似度匹配）
    element_features: {
      resourceId: additionalInfo?.resourceId || params.resource_id || '',
      text: additionalInfo?.text || params.text || '',
      contentDesc: additionalInfo?.contentDesc || params.content_desc || '',
      className: additionalInfo?.className || params.class_name || '',
      bounds: normalizedBounds,  // 🔥 同样使用标准化后的bounds
    },
    
    // 关键属性（向后兼容）
    key_attributes: {
      'resource-id': additionalInfo?.resourceId || params.resource_id || '',
      'content-desc': additionalInfo?.contentDesc || params.content_desc || '',
      'text': additionalInfo?.text || params.text || '',
      'class': additionalInfo?.className || params.class_name || '',
    },
    
    // 🔥 NEW: 添加子元素文本列表（关键修复！）
    children_texts: childrenTexts,
    
    // 🔥 NEW: 添加子元素 content-desc 列表
    children_content_descs: childrenContentDescs,
    
    // 🔥 NEW: 添加兄弟元素文本列表
    sibling_texts: siblingTexts,
    
    // 🔥 NEW: 添加父元素信息
    parent_info: parentInfo,
    
    // 🔥 NEW: 添加匹配策略
    matching_strategy: matchingStrategy,
    
    // 标记为传统步骤
    step_type: 'traditional_with_snapshot'
  };
  
  // 🔥 NEW: 确保 smartSelection 配置被保留（关键修复！）
  // 使用合并策略：默认值 + 已保存的配置，确保所有必要字段都存在
  const smartSelection = {
    // 1. 先设置默认值（确保所有必要字段都有值）
    mode: 'first',
    targetText: originalData.element_text,
    textMatchingMode: 'exact',
    antonymCheckEnabled: false,  // ✅ 禁用反义词检查
    semanticAnalysisEnabled: false,  // ✅ 禁用语义分析
    minConfidence: 0.8,
    batchConfig: {
      intervalMs: 1000,
      maxCount: 1,
      continueOnError: false,
      showProgress: true,
    },
    
    // 2. 再用已保存的配置覆盖（保留用户自定义的值）
    ...(params.smartSelection as Record<string, unknown> || {}),
  };
  
  console.log('🔍 [smartSelection 配置] 原始:', params.smartSelection);
  console.log('🔍 [smartSelection 配置] 合并后:', smartSelection);
  
  const enhancedParameters = {
    ...params,
    original_data: originalData,
    smartSelection,  // 🔥 确保 smartSelection 配置存在
    // 确保基础字段存在（向后兼容）
    xpath: originalData.selected_xpath,
    targetText: originalData.element_text,
  };
  
  console.log('📦 [传统步骤增强] 添加失败恢复数据:', {
    stepId: step.id,
    hasXml: !!(originalData.original_xml as string)?.length,
    hasXPath: !!(originalData.selected_xpath as string)?.length,
    hasElementFeatures: !!(originalData.element_features.resourceId || originalData.element_features.text),
    // 🔥 NEW: 添加新字段的统计信息
    hasChildrenTexts: (originalData.children_texts as string[]).length > 0,
    hasChildrenContentDescs: (originalData.children_content_descs as string[]).length > 0,
    hasSiblingTexts: (originalData.sibling_texts as string[]).length > 0,
    hasParentInfo: !!originalData.parent_info,
    matchingStrategy: originalData.matching_strategy,
    stepType: step.step_type,
    dataSource: snapshot ? 'xmlSnapshot' : elementLocator ? 'elementLocator' : 'legacy'
  });
  
  return {
    ...step,
    parameters: enhancedParameters
  };
}

/**
 * 🔄 传统步骤类型规范化（smart_scroll → swipe, tap坐标补全等）
 */
function normalizeTraditionalStepTypes(step: ExtendedSmartScriptStep): ExtendedSmartScriptStep {
  // smart_scroll 转换为 swipe
  if (String(step.step_type) === "smart_scroll") {
    const p = step.parameters || {} as Record<string, unknown>;
    const direction = (p.direction as string) || "down";
    const distance = Number(p.distance ?? 600);
    const speed = Number(p.speed_ms ?? 300);
    const screen = { width: 1080, height: 1920 };
    const cx = Math.floor(screen.width / 2);
    const cy = Math.floor(screen.height / 2);
    const delta = Math.max(100, Math.min(distance, Math.floor(screen.height * 0.8)));
    let start_x = cx, start_y = cy, end_x = cx, end_y = cy;
    
    switch (direction) {
      case "up":
        start_y = cy - Math.floor(delta / 2);
        end_y = cy + Math.floor(delta / 2);
        break;
      case "down":
        start_y = cy + Math.floor(delta / 2);
        end_y = cy - Math.floor(delta / 2);
        break;
      case "left":
        start_x = cx - Math.floor(delta / 2);
        end_x = cx + Math.floor(delta / 2);
        break;
      case "right":
        start_x = cx + Math.floor(delta / 2);
        end_x = cx - Math.floor(delta / 2);
        break;
      default:
        start_y = cy + Math.floor(delta / 2);
        end_y = cy - Math.floor(delta / 2);
    }
    
    return {
      ...step,
      step_type: "swipe" as ExtendedSmartScriptStep['step_type'],
      name: step.name || "滑动",
      description: step.description || `标准化滚动映射为滑动(${direction})`,
      parameters: {
        ...p,
        start_x, start_y, end_x, end_y,
        duration: speed > 0 ? speed : 300,
      },
    } as ExtendedSmartScriptStep;
  }

  // tap 坐标补全
  if (String(step.step_type) === "tap") {
    const p = step.parameters || {} as Record<string, unknown>;
    if (p.x === undefined || p.y === undefined) {
      const screen = { width: 1080, height: 1920 };
      return {
        ...step,
        parameters: {
          ...p,
          x: (p.x as number) ?? Math.floor(screen.width / 2),
          y: (p.y as number) ?? Math.floor(screen.height / 2),
          hold_duration_ms: (p.duration_ms as number) ?? (p.hold_duration_ms as number) ?? 100,
        },
      } as ExtendedSmartScriptStep;
    }
  }
  
  return step;
}

// 🚫 原有的 expandInlineLoops 函数已删除
// 现在使用新的后端循环系统，不再需要前端展开循环

// 🔄 新的后端循环系统：只过滤和标准化，不再展开循环
// 循环处理完全由后端 loop_handler 模块负责
export function normalizeScriptStepsForBackend(allSteps: ExtendedSmartScriptStep[]): ExtendedSmartScriptStep[] {
  const enabled = (allSteps || []).filter((s) => s.enabled);
  return enabled.map(normalizeStepForBackend);
}
