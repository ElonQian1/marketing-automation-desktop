// src/modules/universal-ui/ui/types/universal-analysis-step-card.ts
// module: universal-ui | layer: ui | role: types
// summary: 智能分析步骤卡片相关类型定义

import type { StrategyInfo, AnalysisResult, AnalysisProgress } from '../../../../components/universal-ui/element-selection/types/StrategyAnalysis';

/**
 * 分析状态枚举
 */
export type AnalysisStepState = 
  | 'idle'           // 未开始分析
  | 'pending'        // 分析中
  | 'completed'      // 分析完成
  | 'failed'         // 分析失败
  | 'cancelled';     // 分析取消

/**
 * 步骤卡片分析数据
 */
export interface UniversalStepCardAnalysisData {
  /** 分析任务ID */
  analysisJobId?: string;
  /** 选择哈希（防串扰） */
  selectionHash?: string;
  /** 分析状态 */
  analysisState: AnalysisStepState;
  /** 分析进度 */
  analysisProgress?: AnalysisProgress;
  /** 分析结果 */
  analysisResult?: AnalysisResult;
  /** 推荐策略 */
  recommendedStrategy?: StrategyInfo;
  /** 推荐置信度 */
  recommendedConfidence?: number;
  /** 是否自动跟随智能策略 */
  autoFollowSmart?: boolean;
}

/**
 * 分析操作回调
 */
export interface UniversalStepCardAnalysisActions {
  /** 重试分析 */
  onRetryAnalysis?: () => Promise<void>;
  /** 取消分析 */
  onCancelAnalysis?: () => void;
  /** 应用推荐策略 */
  onApplyRecommended?: (strategy: StrategyInfo) => Promise<void>;
  /** 查看分析详情 */
  onViewAnalysisDetails?: () => void;
  /** 一键升级 */
  onQuickUpgrade?: () => Promise<void>;
}

/**
 * 扩展的步骤卡片属性
 */
export interface UniversalAnalysisEnhancedStepCardProps {
  /** 分析数据 */
  analysis?: UniversalStepCardAnalysisData;
  /** 分析操作 */
  analysisActions?: UniversalStepCardAnalysisActions;
  /** 是否启用智能分析功能 */
  enableAnalysis?: boolean;
}