// src/pages/SmartScriptBuilderPage/helpers/normalizeSteps.ts
// module: ui | layer: application | role: 步骤规范化和数据传递核心
// summary: 智能分析和传统步骤的统一规范化处理，确保关键数据完整传递到后端

import type { ExtendedSmartScriptStep } from "../../../types/loopScript";
import { 
  enhanceIntelligentStepForBackend, 
  diagnoseStepDataIntegrity 
} from "./intelligentDataTransfer";

// 🔧 智能分析步骤优先处理 + 传统步骤兼容处理
export function normalizeStepForBackend(step: ExtendedSmartScriptStep): ExtendedSmartScriptStep {
  try {
    // 🧠 第一优先级：智能分析步骤（包含策略选择器）
    if (step.enableStrategySelector) {
      console.log('🧠 [智能步骤] 检测到智能分析步骤，使用专用处理器:', step.id);
      
      // � 数据完整性诊断
      const diagnosis = diagnoseStepDataIntegrity(step);
      if (!diagnosis.isValid) {
        console.warn('⚠️ [数据完整性] 智能步骤数据不完整:', {
          stepId: step.id,
          issues: diagnosis.issues,
          recommendations: diagnosis.recommendations
        });
      }
      
      // 使用专用的智能分析数据传递模块
      return enhanceIntelligentStepForBackend(step);
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
    element_bounds: additionalInfo?.bounds
      || params.bounds 
      || '',
    
    // 元素特征（用于相似度匹配）
    element_features: {
      resourceId: additionalInfo?.resourceId || params.resource_id || '',
      text: additionalInfo?.text || params.text || '',
      contentDesc: additionalInfo?.contentDesc || params.content_desc || '',
      className: additionalInfo?.className || params.class_name || '',
      bounds: additionalInfo?.bounds || params.bounds || '',
    },
    
    // 关键属性（向后兼容）
    key_attributes: {
      'resource-id': additionalInfo?.resourceId || params.resource_id || '',
      'content-desc': additionalInfo?.contentDesc || params.content_desc || '',
      'text': additionalInfo?.text || params.text || '',
      'class': additionalInfo?.className || params.class_name || '',
    },
    
    // 标记为传统步骤
    step_type: 'traditional_with_snapshot'
  };
  
  const enhancedParameters = {
    ...params,
    original_data: originalData,
    // 确保基础字段存在（向后兼容）
    xpath: originalData.selected_xpath,
    targetText: originalData.element_text,
  };
  
  console.log('📦 [传统步骤增强] 添加失败恢复数据:', {
    stepId: step.id,
    hasXml: !!(originalData.original_xml as string)?.length,
    hasXPath: !!(originalData.selected_xpath as string)?.length,
    hasElementFeatures: !!(originalData.element_features.resourceId || originalData.element_features.text),
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
