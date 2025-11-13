// src/config/step-sequence.ts
// module: config | layer: config | role: 步骤序号统一配置
// summary: 定义智能分析步骤的统一序号体系，确保前后端一致性

/**
 * 步骤序号配置接口
 */
export interface StepConfig {
  /** 步骤序号 */
  step: number;
  /** 步骤标识符（用于前端状态管理） */
  stepId: string;
  /** 候选项key（用于后端策略匹配） */
  candidateKey: string;
  /** 显示标签 */
  label: string;
  /** 中文名称 */
  displayName: string;
  /** 步骤类别 */
  category: 'structure_matching' | 'traditional';
  /** 是否为兜底策略 */
  isFallback?: boolean;
}

/**
 * 🎯 统一步骤序号配置（V3架构）
 * 
 * **重要说明**:
 * - Step1-2: 结构匹配优先（卡片子树、叶子上下文）
 * - Step3-8: 传统策略（自锚定、子元素驱动、区域约束、XPath兜底、索引兜底、应急兜底）
 * 
 * **前后端同步要求**:
 * - 前端: CompactStrategyMenu.tsx 中的 SMART_STEPS
 * - 后端: strategy_engine.rs 中的步骤注释
 */
export const UNIFIED_STEP_SEQUENCE: StepConfig[] = [
  // ==================== 结构匹配优先（Step1-2）====================
  {
    step: 1,
    stepId: 'step1',
    candidateKey: 'card_subtree_scoring',
    label: 'Step1 - 卡片子树评分',
    displayName: '卡片子树评分',
    category: 'structure_matching',
  },
  {
    step: 2,
    stepId: 'step2',
    candidateKey: 'leaf_context_scoring',
    label: 'Step2 - 叶子上下文评分',
    displayName: '叶子上下文评分',
    category: 'structure_matching',
  },
  
  // ==================== 传统策略（Step3-8）====================
  {
    step: 3,
    stepId: 'step3',
    candidateKey: 'self_anchor',
    label: 'Step3 - 自锚定策略',
    displayName: '自锚定策略',
    category: 'traditional',
  },
  {
    step: 4,
    stepId: 'step4',
    candidateKey: 'child_driven',
    label: 'Step4 - 子元素驱动',
    displayName: '子元素驱动',
    category: 'traditional',
  },
  {
    step: 5,
    stepId: 'step5',
    candidateKey: 'region_scoped',
    label: 'Step5 - 区域约束',
    displayName: '区域约束',
    category: 'traditional',
  },
  {
    step: 6,
    stepId: 'step6',
    candidateKey: 'xpath_fallback',
    label: 'Step6 - XPath兜底',
    displayName: 'XPath兜底',
    category: 'traditional',
    isFallback: true,
  },
  {
    step: 7,
    stepId: 'step7',
    candidateKey: 'index_fallback',
    label: 'Step7 - 索引兜底',
    displayName: '索引兜底',
    category: 'traditional',
    isFallback: true,
  },
  {
    step: 8,
    stepId: 'step8',
    candidateKey: 'emergency_fallback',
    label: 'Step8 - 应急兜底',
    displayName: '应急兜底',
    category: 'traditional',
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
   * 获取结构匹配步骤（Step1-2）
   */
  static getStructureMatchingSteps(): StepConfig[] {
    return UNIFIED_STEP_SEQUENCE.filter(s => s.category === 'structure_matching');
  }
  
  /**
   * 获取传统策略步骤（Step3-8）
   */
  static getTraditionalSteps(): StepConfig[] {
    return UNIFIED_STEP_SEQUENCE.filter(s => s.category === 'traditional');
  }
  
  /**
   * 获取兜底策略步骤
   */
  static getFallbackSteps(): StepConfig[] {
    return UNIFIED_STEP_SEQUENCE.filter(s => s.isFallback);
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
   * 验证步骤序号是否有效
   */
  static isValidStep(step: number): boolean {
    return step >= 1 && step <= 8;
  }
  
  /**
   * 验证candidateKey是否有效
   */
  static isValidCandidateKey(candidateKey: string): boolean {
    return this.candidateKeyMap.has(candidateKey);
  }
}

/**
 * 导出便捷访问的常量
 */
export const STRUCTURE_MATCHING_STEPS = StepSequenceMapper.getStructureMatchingSteps();
export const TRADITIONAL_STEPS = StepSequenceMapper.getTraditionalSteps();
export const FALLBACK_STEPS = StepSequenceMapper.getFallbackSteps();

/**
 * 类型导出（用于TypeScript类型检查）
 */
export type StepId = 'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'step6' | 'step7' | 'step8';
export type CandidateKey = 
  | 'card_subtree_scoring' 
  | 'leaf_context_scoring'
  | 'self_anchor'
  | 'child_driven'
  | 'region_scoped'
  | 'xpath_fallback'
  | 'index_fallback'
  | 'emergency_fallback';
