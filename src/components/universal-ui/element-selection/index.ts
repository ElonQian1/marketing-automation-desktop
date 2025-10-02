// 元素选择模块导出
export { ElementSelectionPopover } from './ElementSelectionPopover';
export { useElementSelectionManager } from './useElementSelectionManager';
export { useEnhancedElementSelectionManager } from './useEnhancedElementSelectionManager';
export type { ElementSelectionState } from './ElementSelectionPopover';
export { useSmartPopoverPosition, PopoverPositionCalculator } from './utils/popoverPositioning';
export type { Position, PopoverDimensions, PopoverPlacement } from './utils/popoverPositioning';

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

// 🆕 气泡管理模块（简化版）
export { usePopoverManager } from './hooks/usePopoverManager';
export { SmartPopoverContainer } from './components/SmartPopoverContainer';
