// src/components/universal-ui/views/grid-view/panels/node-detail/types.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

// 导入统一的策略类型定义
import type { MatchStrategy, MatchCriteria } from '../../../../../../modules/intelligent-strategy-system/types/StrategyTypes';

// 重新导出，保持向后兼容
export type { MatchStrategy, MatchCriteria };

export interface MatchResultSummary {
  ok: boolean;
  message: string;
  matchedIndex?: number;
  total?: number;
  preview?: { 
    text?: string; 
    resource_id?: string; 
    class_name?: string; 
    xpath?: string; 
    bounds?: string; 
    package?: string; 
  };
}

// 详细策略推荐类型 - 统一为 StrategyScoreCard 所期望的格式
export interface DetailedStrategyScore {
  total: number;
  performance: number;
  stability: number;
  compatibility: number;
  uniqueness: number;
  confidence?: number;
}

export interface DetailedStrategyRecommendation {
  strategy: string;
  score: DetailedStrategyScore;
  confidence: number;
  reason: string;
  // 🆕 支持Plan候选链
  step?: string; // 来源步骤 (如 "Step 1: Self-Anchor")
  fallbackRank?: number; // 在回退链中的排序
  performance?: {
    estimatedSpeed: 'fast' | 'medium' | 'slow';
    crossDeviceStability: 'high' | 'medium' | 'low';
  };
}

// 🆕 策略候选链 (Plan) 类型
export interface StrategyPlan {
  /** Plan 唯一标识 */
  id: string;
  /** Plan 显示名称 */
  name: string;
  /** 优先级（数字越小优先级越高） */
  priority: number;
  /** 置信度 */
  confidence: number;
  /** 推荐策略 */
  strategy: MatchStrategy;
  /** 匹配条件 */
  criteria: MatchCriteria;
  /** 回退链 */
  fallbackChain: MatchStrategy[];
  /** 预估成功率 */
  estimatedSuccessRate: number;
  /** 推理说明 */
  reasoning: string;
  /** 生成时间戳 */
  timestamp?: number;
  /** 多语言同义词支持 */
  i18nAliases?: Record<string, string[]>;
  /** 是否允许后端回退 */
  allowBackendFallback?: boolean;
  /** 时间预算设置 */
  timeBudget?: {
    total: number; // 总预算（毫秒）
    perCandidate: number; // 每候选预算（毫秒）
  };
}

// 🆕 智能/静态模式切换类型
export type StrategyMode = 'intelligent' | 'static';

export interface StrategyModeState {
  currentMode: StrategyMode;
  userPreference: StrategyMode; // 用户偏好设置
  canSwitch: boolean; // 是否可以切换
}
