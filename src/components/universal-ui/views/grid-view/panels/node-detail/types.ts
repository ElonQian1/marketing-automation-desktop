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
}
