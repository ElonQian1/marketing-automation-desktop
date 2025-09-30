/**
 * Grid View 网格视图索引 - TypeScript 模块
 * 导出网格视图相关组件和类型
 */

export { GridElementView } from './GridElementView';
export type { UiNode, AdvancedFilter } from './types';
export { FilterBar } from './FilterBar';
export { MatchResultsPanel } from './MatchResultsPanel';
export { ScreenPreview } from './ScreenPreview';
export { NodeDetail } from './NodeDetail';
export { Breadcrumbs } from './Breadcrumbs';
export { XPathBuilder } from './XPathBuilder';

// 导出快照解析器
export { 
  resolveSnapshot, 
  useSnapshotResolver,
  resolveFromBinding,
  resolveFromSnapshotAndXPath 
} from './snapshotResolver';
export type { SnapshotResolveInput, SnapshotResolveResult } from './snapshotResolver';

// 🆕 子元素选择功能导出
export {
  ChildElementListModal,
  type ChildElementListModalProps,
} from './components/ChildElementListModal';

export {
  EnhancedChildElementListModal,
  type EnhancedChildElementListModalProps,
} from './components/EnhancedChildElementListModal';

export {
  ChildElementCard,
  type ChildElementCardProps,
} from './components/ChildElementCard';

export {
  EnhancedChildElementCard,
  type EnhancedChildElementCardProps,
} from './components/EnhancedChildElementCard';

export {
  childElementAnalyzer,
  type ActionableChildElement,
  type ActionableElementType,
  type ChildElementAnalysis,
} from './services/childElementAnalyzer';

export {
  smartRecommendationEnhancer,
  type UserIntent,
  type ElementContext,
} from './services/smartRecommendationEnhancer';