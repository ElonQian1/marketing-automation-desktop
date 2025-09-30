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

// 🆕 子元素选择功能导出
export {
  ChildElementSelectorModal,
  type ChildElementSelectorModalProps,
} from './components/ChildElementSelectorModal';

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