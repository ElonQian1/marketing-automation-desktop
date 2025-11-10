// src/services/structureRecommend.ts
// module: services | layer: services | role: 结构匹配智能推荐API
// summary: 封装Tauri命令的前端调用，提供类型安全的推荐接口

import { invoke } from "@tauri-apps/api/tauri";

export type UiOutcome = {
  mode: "CardSubtree" | "LeafContext" | "TextExact";
  conf: number;            // 0..1（已保留2位小数）
  explain: string;         // 评分解释
  passed_gate: boolean;    // 是否通过统一闸门
};

export type UiRecommendation = {
  recommended: UiOutcome["mode"];           // 系统推荐模式
  outcomes: UiOutcome[];                    // 三路评分详情
  step_plan_mode: string;                   // "structure_match"
  plan_suggest: any;                        // StepCard plan建议
  config_suggest: any;                      // StepCard config建议  
  intent_suggest: any;                      // StepCard intent建议
  preview_target_node_ids: number[];        // 预览目标节点ID列表
  confidence_level: string;                 // 置信度级别："高" | "中等" | "偏低"
  recommendation_reason: string;            // 推荐理由
};

export type RecommendInput = {
  clicked_node: number;
  container_node: number;
  card_root_node: number;
  clickable_parent_node: number;
};

/**
 * 调用智能推荐命令，获取三路评分结果和推荐配置
 */
export async function recommendStructureMode(
  payload: RecommendInput
): Promise<UiRecommendation> {
  try {
    const result = await invoke<UiRecommendation>("recommend_structure_mode", { 
      input: payload 
    });
    
    console.log("🎯 [推荐API] 智能推荐完成:", {
      recommended: result.recommended,
      confidence: result.confidence_level,
      passed_gates: result.outcomes.filter(o => o.passed_gate).length
    });
    
    return result;
  } catch (error) {
    console.error("❌ [推荐API] 推荐失败:", error);
    throw new Error(`智能推荐失败: ${error}`);
  }
}

/**
 * 试算高亮命令，预览指定模式的匹配目标节点
 */
export async function dryRunStructureMatch(
  payload: RecommendInput,
  mode: UiOutcome["mode"]
): Promise<number[]> {
  try {
    const result = await invoke<number[]>("dry_run_structure_match", { 
      input: payload,
      mode 
    });
    
    console.log("🧪 [试算API] 试算完成:", {
      mode,
      targetNodes: result
    });
    
    return result;
  } catch (error) {
    console.error("❌ [试算API] 试算失败:", error);
    throw new Error(`试算高亮失败: ${error}`);
  }
}

/**
 * 获取推荐模式的显示名称
 */
export function getModeDisplayName(mode: UiOutcome["mode"]): string {
  switch (mode) {
    case "CardSubtree":
      return "卡片子树";
    case "LeafContext":
      return "叶子上下文";
    case "TextExact":
      return "文本精确";
    default:
      return mode;
  }
}

/**
 * 获取置信度的显示样式
 */
export function getConfidenceStyle(confidence: number): {
  color: string;
  backgroundColor: string;
  label: string;
} {
  if (confidence >= 0.8) {
    return {
      color: "#389e0d",
      backgroundColor: "#f6ffed", 
      label: "高"
    };
  } else if (confidence >= 0.6) {
    return {
      color: "#d48806",
      backgroundColor: "#fffbe6",
      label: "中"
    };
  } else {
    return {
      color: "#cf1322",
      backgroundColor: "#fff2f0",
      label: "低"
    };
  }
}

/**
 * 格式化置信度百分比
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

/**
 * 检查推荐结果是否可用
 */
export function isRecommendationUsable(recommendation: UiRecommendation): boolean {
  const hasPassedGate = recommendation.outcomes.some(o => o.passed_gate);
  const minConfidence = Math.max(...recommendation.outcomes.map(o => o.conf));
  
  return hasPassedGate || minConfidence >= 0.3; // 兜底阈值
}

/**
 * 生成推荐摘要文本
 */
export function generateRecommendationSummary(recommendation: UiRecommendation): string {
  const passedCount = recommendation.outcomes.filter(o => o.passed_gate).length;
  const recommendedOutcome = recommendation.outcomes.find(
    o => o.mode === recommendation.recommended
  );
  
  if (!recommendedOutcome) {
    return "推荐结果异常";
  }
  
  const confidenceText = formatConfidence(recommendedOutcome.conf);
  const modeText = getModeDisplayName(recommendation.recommended);
  
  if (passedCount === 0) {
    return `所有模式均未通过闸门，采用兜底策略推荐 ${modeText}`;
  } else if (passedCount === 1) {
    return `推荐使用 ${modeText}，置信度 ${confidenceText}`;
  } else {
    return `${passedCount}个模式通过闸门，优选 ${modeText} (${confidenceText})`;
  }
}