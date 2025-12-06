// src/config/step-sequence.ts
// module: config | layer: config | role: 步骤序号统一配置
// summary: 定义智能分析步骤的统一序号体系，确保前后端一致性

/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │  🎯 智能策略 Step 1-10 完整定义（V3架构）                                      │
 * │                                                                             │
 * │  本文件是策略序号的【唯一真相源】，前后端必须保持一致。                          │
 * │                                                                             │
 * │  🏆 Tier 1: 批量结构匹配（瀑布流场景首选）                                     │
 * │    Step 1 - 卡片子树评分     card_subtree_scoring                            │
 * │    Step 2 - 叶子上下文评分   leaf_context_scoring                            │
 * │                                                                             │
 * │  🏆 Tier 2: 结构定位兜底                                                     │
 * │    Step 3 - 索引路径定位     index_fallback                                  │
 * │    Step 4 - 区域约束策略     region_scoped                                   │
 * │                                                                             │
 * │  🏆 Tier 3: 语义精确匹配（唯一元素场景）                                       │
 * │    Step 5 - 文本唯一匹配     text_exact_scoring                              │
 * │    Step 6 - ID稳定性评分     heuristic_id_scoring                            │
 * │    Step 7 - 描述文本定位     content_desc                                    │
 * │                                                                             │
 * │  🏆 Tier 4: 传统XPath兜底（最后保障）                                         │
 * │    Step 8 - 自锚定策略       self_anchor                                     │
 * │    Step 9 - XPath启发生成    heuristic_xpath_scoring                         │
 * │    Step 10 - XPath兜底策略   xpath_fallback                                  │
 * │                                                                             │
 * │  📍 同步文件：                                                               │
 * │    - 后端: src-tauri/src/services/unified_match_service.rs                  │
 * │    - 后端: src-tauri/src/services/intelligent_analysis_service.rs           │
 * │    - 后端: src-tauri/src/engine/strategy_engine.rs                          │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

/**
 * 步骤序号配置接口
 */
export interface StepConfig {
  /** 步骤序号 (1-10) */
  step: number;
  /** 步骤标识符（用于前端状态管理） */
  stepId: string;
  /** 候选项key（用于后端策略匹配，必须与Rust代码一致） */
  candidateKey: string;
  /** 显示标签 */
  label: string;
  /** 中文名称（规范命名，消除歧义） */
  displayName: string;
  /** 一句话说明（帮助AI和开发者理解） */
  description: string;
  /** 步骤类别 */
  category: 'structure_matching' | 'semantic_matching' | 'xpath_fallback';
  /** 所属层级 (Tier 1-4) */
  tier: 1 | 2 | 3 | 4;
  /** 是否为兜底策略 */
  isFallback?: boolean;
}

/**
 * 🎯 统一步骤序号配置（V3架构 - 10步策略体系）
 */
export const UNIFIED_STEP_SEQUENCE: StepConfig[] = [
  // ==================== Tier 1: 批量结构匹配（瀑布流场景首选）====================
  {
    step: 1,
    stepId: 'step1',
    candidateKey: 'card_subtree_scoring',
    label: 'Step1 - 卡片子树评分',
    displayName: '卡片子树评分',
    description: '检测瀑布流卡片的结构特征：媒体区、底栏、RecyclerView容器',
    category: 'structure_matching',
    tier: 1,
  },
  {
    step: 2,
    stepId: 'step2',
    candidateKey: 'leaf_context_scoring',
    label: 'Step2 - 叶子上下文评分',
    displayName: '叶子上下文评分',
    description: '记录叶子节点的结构指纹：祖先链、兄弟位置、相对坐标',
    category: 'structure_matching',
    tier: 1,
  },
  
  // ==================== Tier 2: 结构定位兜底 ====================
  {
    step: 3,
    stepId: 'step3',
    candidateKey: 'index_fallback',
    label: 'Step3 - 索引路径定位',
    displayName: '索引路径定位',
    description: '基于DOM树的index_path结构定位，适用于结构稳定场景',
    category: 'structure_matching',
    tier: 2,
    isFallback: true,
  },
  {
    step: 4,
    stepId: 'step4',
    candidateKey: 'region_scoped',
    label: 'Step4 - 区域约束策略',
    displayName: '区域约束策略',
    description: '限定在容器（ScrollView/RecyclerView）内查找元素',
    category: 'structure_matching',
    tier: 2,
  },
  
  // ==================== Tier 3: 语义精确匹配（唯一元素场景）====================
  {
    step: 5,
    stepId: 'step5',
    candidateKey: 'text_exact_scoring',
    label: 'Step5 - 文本唯一匹配',
    displayName: '文本唯一匹配',
    description: '检查text/content-desc在页面中是否唯一，适用于单一元素',
    category: 'semantic_matching',
    tier: 3,
  },
  {
    step: 6,
    stepId: 'step6',
    candidateKey: 'heuristic_id_scoring',
    label: 'Step6 - ID稳定性评分',
    displayName: 'ID稳定性评分',
    description: '评估resource-id的稳定性，排除混淆ID和动态ID',
    category: 'semantic_matching',
    tier: 3,
  },
  {
    step: 7,
    stepId: 'step7',
    candidateKey: 'content_desc',
    label: 'Step7 - 描述文本定位',
    displayName: '描述文本定位',
    description: '通过content-desc属性定位，适用于无障碍标签清晰的按钮',
    category: 'semantic_matching',
    tier: 3,
  },
  
  // ==================== Tier 4: 传统XPath兜底（最后保障）====================
  {
    step: 8,
    stepId: 'step8',
    candidateKey: 'self_anchor',
    label: 'Step8 - 自锚定策略',
    displayName: '自锚定策略',
    description: '基于resource-id生成简单XPath，作为ID匹配的回退',
    category: 'xpath_fallback',
    tier: 4,
    isFallback: true,
  },
  {
    step: 9,
    stepId: 'step9',
    candidateKey: 'heuristic_xpath_scoring',
    label: 'Step9 - XPath启发生成',
    displayName: 'XPath启发生成',
    description: '智能生成XPath候选，综合多种属性特征',
    category: 'xpath_fallback',
    tier: 4,
    isFallback: true,
  },
  {
    step: 10,
    stepId: 'step10',
    candidateKey: 'xpath_fallback',
    label: 'Step10 - XPath兜底策略',
    displayName: 'XPath兜底策略',
    description: '使用完整路径定位，所有策略失败时的最后保障',
    category: 'xpath_fallback',
    tier: 4,
    isFallback: true,
  },
];

/**
 * 步骤序号映射工具类
 */
export class StepSequenceMapper {
  private static stepMap = new Map<string, StepConfig>();
  private static candidateKeyMap = new Map<string, StepConfig>();
  private static stepIdMap = new Map<string, StepConfig>();
  
  static {
    // 初始化映射表
    UNIFIED_STEP_SEQUENCE.forEach(config => {
      this.stepMap.set(config.step.toString(), config);
      this.candidateKeyMap.set(config.candidateKey, config);
      this.stepIdMap.set(config.stepId, config);
    });
  }
  
  /**
   * 根据步骤序号获取配置
   */
  static getByStep(step: number): StepConfig | undefined {
    return this.stepMap.get(step.toString());
  }
  
  /**
   * 根据候选项key获取配置
   */
  static getByCandidateKey(candidateKey: string): StepConfig | undefined {
    return this.candidateKeyMap.get(candidateKey);
  }
  
  /**
   * 根据stepId获取配置
   */
  static getByStepId(stepId: string): StepConfig | undefined {
    return this.stepIdMap.get(stepId);
  }
  
  /**
   * 获取所有步骤配置
   */
  static getAll(): StepConfig[] {
    return UNIFIED_STEP_SEQUENCE;
  }
  
  /**
   * 获取结构匹配步骤（Step1-4：卡片子树、叶子上下文、索引路径、区域约束）
   */
  static getStructureMatchingSteps(): StepConfig[] {
    return UNIFIED_STEP_SEQUENCE.filter(s => s.category === 'structure_matching');
  }
  
  /**
   * 获取语义匹配步骤（Step5-7：文本唯一、ID稳定性、描述文本）
   */
  static getSemanticMatchingSteps(): StepConfig[] {
    return UNIFIED_STEP_SEQUENCE.filter(s => s.category === 'semantic_matching');
  }
  
  /**
   * 获取XPath兜底步骤（Step8-10：自锚定、XPath启发、XPath兜底）
   */
  static getXPathFallbackSteps(): StepConfig[] {
    return UNIFIED_STEP_SEQUENCE.filter(s => s.category === 'xpath_fallback');
  }
  
  /**
   * 获取所有兜底策略步骤
   */
  static getFallbackSteps(): StepConfig[] {
    return UNIFIED_STEP_SEQUENCE.filter(s => s.isFallback);
  }
  
  /**
   * 按层级获取步骤
   */
  static getByTier(tier: 1 | 2 | 3 | 4): StepConfig[] {
    return UNIFIED_STEP_SEQUENCE.filter(s => s.tier === tier);
  }
  
  /**
   * 将candidateKey转换为stepId（用于前端状态管理）
   */
  static candidateKeyToStepId(candidateKey: string): string | undefined {
    return this.candidateKeyMap.get(candidateKey)?.stepId;
  }
  
  /**
   * 将stepId转换为candidateKey（用于后端API调用）
   */
  static stepIdToCandidateKey(stepId: string): string | undefined {
    return this.stepIdMap.get(stepId)?.candidateKey;
  }
  
  /**
   * 验证步骤序号是否有效（Step 1-10）
   */
  static isValidStep(step: number): boolean {
    return step >= 1 && step <= 10;
  }
  
  /**
   * 验证candidateKey是否有效
   */
  static isValidCandidateKey(candidateKey: string): boolean {
    return this.candidateKeyMap.has(candidateKey);
  }
  
  /**
   * 获取步骤的简短描述
   */
  static getDescription(step: number): string {
    return this.getByStep(step)?.description ?? '未知策略';
  }
}

/**
 * 导出便捷访问的常量
 */
export const STRUCTURE_MATCHING_STEPS = StepSequenceMapper.getStructureMatchingSteps();
export const SEMANTIC_MATCHING_STEPS = StepSequenceMapper.getSemanticMatchingSteps();
export const XPATH_FALLBACK_STEPS = StepSequenceMapper.getXPathFallbackSteps();
export const FALLBACK_STEPS = StepSequenceMapper.getFallbackSteps();

/**
 * 类型导出（用于TypeScript类型检查）
 * 
 * StepId: 前端步骤标识符（step1 到 step10）
 * CandidateKey: 后端策略键名（必须与Rust代码完全一致）
 */
export type StepId = 
  | 'step1' | 'step2' | 'step3' | 'step4' | 'step5' 
  | 'step6' | 'step7' | 'step8' | 'step9' | 'step10';

export type CandidateKey = 
  | 'card_subtree_scoring'    // Step1: 卡片子树评分
  | 'leaf_context_scoring'    // Step2: 叶子上下文评分
  | 'index_fallback'          // Step3: 索引路径定位
  | 'region_scoped'           // Step4: 区域约束策略
  | 'text_exact_scoring'      // Step5: 文本唯一匹配
  | 'heuristic_id_scoring'    // Step6: ID稳定性评分
  | 'content_desc'            // Step7: 描述文本定位
  | 'self_anchor'             // Step8: 自锚定策略
  | 'heuristic_xpath_scoring' // Step9: XPath启发生成
  | 'xpath_fallback';         // Step10: XPath兜底策略

/**
 * 层级枚举（便于类型检查）
 */
export type StepTier = 1 | 2 | 3 | 4;
