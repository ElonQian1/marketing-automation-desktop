// src/components/universal-ui/element-selection/index.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

// 元素选择模块导出
export { ElementSelectionPopover } from './ElementSelectionPopover';
export { useElementSelectionManager } from './useElementSelectionManager';
export type { ElementSelectionState, ElementSelectionPopoverProps } from './ElementSelectionPopover';
export { useSmartPopoverPosition, PopoverPositionCalculator } from './utils/popoverPositioning';
export type { Position, PopoverDimensions, PopoverPlacement } from './utils/popoverPositioning';

// 智能分析相关导出
export { PopoverActionButtons } from './components/PopoverActionButtons';
export type { PopoverActionButtonsProps } from './components/PopoverActionButtons';
export { StrategyAnalysisModal } from './strategy-analysis/StrategyAnalysisModal';
export type { StrategyAnalysisModalProps } from './strategy-analysis/StrategyAnalysisModal';
export { useStrategyAnalysis } from '../../../hooks/universal-ui/useStrategyAnalysis';
export type { 
  UseStrategyAnalysisReturn, 
  AnalysisState,
  AnalysisProgress,
  AnalysisResult,
  StrategyAnalysisContext
} from '../../../hooks/universal-ui/useStrategyAnalysis';
export type { 
  StrategyCandidate,
  StrategyPerformance 
} from '../../../modules/universal-ui/types/intelligent-analysis-types';

// 🆕 生命周期管理
export { 
  usePopoverLifecycleManager, 
  PopoverStateValidator, 
  PopoverStateMonitor 
} from './hooks/usePopoverLifecycleManager';
export type { PopoverLifecycleOptions } from './hooks/usePopoverLifecycleManager';

// 🆕 交互管理
export { 
  useGlobalInteractionManager, 
  usePopoverInteractionManager 
} from './hooks/useGlobalInteractionManager';
export type { GlobalInteractionOptions } from './hooks/useGlobalInteractionManager';

// 🆕 Z轴层级管理
export { 
  ZIndexManager, 
  useZIndexManager, 
  usePopoverZIndex 
} from './utils/zIndexManager';

// 🆕 用户体验优化
export { 
  useAdvancedUserExperience, 
  usePopoverUserExperience, 
  InteractionFeedback 
} from './utils/advancedUserExperience';
export type { 
  AnimationConfig, 
  UserExperienceOptions 
} from './utils/advancedUserExperience';

// 🆕 性能监控
export { 
  PerformanceMonitor, 
  usePerformanceMonitor, 
  usePopoverPerformanceMonitor 
} from './utils/performanceMonitor';
export type { 
  PerformanceMetrics, 
  UserBehaviorMetrics 
} from './utils/performanceMonitor';

// 🆕 层次分析模块
export { ElementHierarchyAnalyzer } from './hierarchy/ElementHierarchyAnalyzer';
export { ElementQualityScorer } from './hierarchy/ElementQualityScorer';
export type { 
  ElementHierarchyNode, 
  HierarchyAnalysisResult, 
  AlternativeElement,
  ElementQuality,
  TraversalOptions 
} from './hierarchy/types';

// 🆕 替代元素查找
export { AlternativeElementFinder } from './alternative-selection/AlternativeElementFinder';

// ✅ 注意：EnhancedSelectionPopover（替代元素功能）已删除
// 智能分析相关组件请使用 @modules/universal-ui 中的：
// - IntelligentAnalysisController（业务逻辑层）
// - IntelligentAnalysisPopoverUI（UI展示层）

