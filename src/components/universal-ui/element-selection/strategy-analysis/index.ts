// src/components/universal-ui/element-selection/strategy-analysis/index.ts
// module: universal-ui | layer: ui | role: 策略分析组件导出
// summary: 策略分析相关组件和类型的统一导出

export { StrategyAnalysisModal } from './StrategyAnalysisModal';

export type { 
  AnalysisResult,
  StrategyAnalysisModalProps 
} from './StrategyAnalysisModal';

// 重新导出统一的类型
export type { StrategyCandidate } from '../../../../modules/universal-ui/types/intelligent-analysis-types';