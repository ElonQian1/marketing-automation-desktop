// src/modules/intelligent-strategy-system/types/DecisionTypes.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * DecisionTypes.ts
 * 智能策略决策相关类型定义
 * 
 * @description 定义 Step 0-6 决策流程中使用的核心类型
 */

import type { UiNode } from '../../../components/universal-ui/views/grid-view/types';
import type { XmlSnapshot } from '../../../types/self-contained/xmlSnapshot';
import type { 
  StrategyRecommendation, 
  StrategyCandidate, 
  MatchStrategy 
} from './StrategyTypes';

// === 决策上下文 ===

/**
 * 决策上下文 - 包含决策所需的所有信息
 */
export interface DecisionContext {
  /** 目标元素节点 */
  targetNode: UiNode;
  
  /** XML快照信息 */
  xmlSnapshot: XmlSnapshot;
  
  /** 解析后的XML内容 */
  xmlContent: string;
  
  /** 设备信息 */
  deviceInfo?: {
    deviceId: string;
    deviceName?: string;
    screenWidth?: number;
    screenHeight?: number;
    density?: number;
  };
  
  /** 页面信息 */
  pageInfo?: {
    packageName?: string;
    activityName?: string;
    appName?: string;
  };
  
  /** 用户操作意图 */
  userIntent?: {
    action: 'click' | 'input' | 'swipe' | 'long_press';
    expectedBehavior?: string;
  };
}

// === 分析步骤 ===

/**
 * 分析步骤枚举 - 对应文档中的 Step 0-6
 */
export enum AnalysisStep {
  /** Step 0: 规范化输入 */
  NORMALIZE_INPUT = 'normalize_input',
  
  /** Step 1: 自我可定位性检查 */
  SELF_ANCHOR = 'self_anchor',
  
  /** Step 2: 子树锚点查找 */
  CHILD_ANCHOR = 'child_anchor',
  
  /** Step 3: 上溯可点击父节点 */
  PARENT_CLICKABLE = 'parent_clickable',
  
  /** Step 4: 区域限定匹配 */
  REGION_SCOPED = 'region_scoped',
  
  /** Step 5: 邻居相对定位 */
  NEIGHBOR_RELATIVE = 'neighbor_relative',
  
  /** Step 6: 索引兜底 */
  INDEX_FALLBACK = 'index_fallback',
}

/**
 * 分析步骤结果
 */
export interface StepAnalysisResult {
  /** 分析步骤类型 */
  step: AnalysisStep;
  
  /** 是否成功找到候选策略 */
  success: boolean;
  
  /** 找到的候选策略列表 */
  candidates: StrategyCandidate[];
  
  /** 执行时间（毫秒） */
  executionTime: number;
  
  /** 分析详情和日志 */
  details: {
    message: string;
    debugInfo?: any;
    warnings?: string[];
  };
  
  /** 是否应该继续下一步分析 */
  shouldContinue: boolean;
}

// === 决策结果 ===

/**
 * 完整的决策结果
 */
export interface DecisionResult {
  /** 推荐的策略 */
  recommendedStrategy: StrategyRecommendation;
  
  /** 所有候选策略（按分数排序） */
  allCandidates: StrategyCandidate[];
  
  /** 各步骤的分析结果 */
  stepResults: StepAnalysisResult[];
  
  /** 决策总结 */
  summary: {
    /** 总决策时间 */
    totalTime: number;
    
    /** 执行的步骤数 */
    stepsExecuted: number;
    
    /** 最终选择的步骤 */
    finalStep: AnalysisStep;
    
    /** 置信度等级 */
    confidenceLevel: 'high' | 'medium' | 'low';
  };
  
  /** 调试信息 */
  debugInfo?: {
    /** 原始元素信息 */
    originalElement: any;
    
    /** 标准化后的元素信息 */
    normalizedElement: any;
    
    /** 分析过程日志 */
    analysisLogs: string[];
  };
}

// === 策略候选 ===

// === 配置选项 ===

/**
 * 决策引擎配置
 */
export interface DecisionEngineConfig {
  /** 是否启用调试模式 */
  debugMode: boolean;
  
  /** 最大分析步骤数 */
  maxSteps: number;
  
  /** 最小置信度阈值 */
  minConfidenceThreshold: number;
  
  /** 性能模式：fast 优先速度，thorough 优先准确性 */
  performanceMode: 'fast' | 'balanced' | 'thorough';
  
  /** 是否启用本地验证 */
  enableLocalValidation: boolean;
  
  /** 自定义评分权重 */
  customWeights?: Record<string, number>;
}