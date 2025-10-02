export { default as ElementSelectionPopover } from './ElementSelectionPopover';
export type { ElementSelectionPopoverProps, ElementSelectionState } from './ElementSelectionPopover';

export { PopoverActionButtons } from './components/PopoverActionButtons';
export type { PopoverActionButtonsProps } from './components/PopoverActionButtons';

export type { PopoverActionTokens } from './components/tokens';
export { defaultPopoverActionTokens } from './components/tokens';
// 元素选择模块导出（去重）
export { useElementSelectionManager } from './useElementSelectionManager';
export { useEnhancedElementSelectionManager } from './useEnhancedElementSelectionManager';
// ElementSelectionState 已在顶部一次性导出
export { useSmartPopoverPosition, PopoverPositionCalculator } from './utils/popoverPositioning';
export type { Position, PopoverDimensions, PopoverPlacement } from './utils/popoverPositioning';

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

// 🆕 增强气泡组件
export { EnhancedSelectionPopover } from './enhanced-popover/EnhancedSelectionPopover';
export { AlternativeElementCard } from './enhanced-popover/AlternativeElementCard';
export type { 
  EnhancedElementSelectionState,
  EnhancedSelectionPopoverProps 
} from './enhanced-popover/EnhancedSelectionPopover';
