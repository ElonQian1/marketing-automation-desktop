/**
 * Element Discovery 模块化架构 - 统一导出
 * 重构后的模块化架构入口
 * 
 * 架构层次：
 * - Types: 统一类型定义
 * - Services: 业务逻辑服务层
 * - Utils: 工具类和辅助函数
 * - Hooks: React 状态管理和逻辑 Hook
 * - Components: UI 组件层
 */

// === 类型定义导出 ===
export type { 
  HierarchyNode, 
  TreeNodeData, 
  HierarchyStatistics,
  HierarchyValidation,
  ElementRelationship,
  HierarchyBuildOptions,
  HierarchyFilter,
  HierarchySearchResult
} from '../../../../types/hierarchy';

// === 核心服务层 ===
export { XmlStructureParser } from './services/xmlStructureParser';
export { ElementAnalyzer } from './services/elementAnalyzer';
export { HierarchyBuilder } from './services/hierarchyBuilder';

// === 工具层 ===
export { BoundaryDetector } from './utils/boundaryDetector';

// === Hook 层 ===
export { useArchitectureTree } from './hooks/useArchitectureTree';
export { useElementVisualization } from './hooks/useElementVisualization';

// === 组件层 ===
export { ArchitectureDiagram as default } from './ArchitectureDiagram';
export { ArchitectureDiagram } from './ArchitectureDiagram';

// 🆕 交互式组件
export { InteractiveTreeNode } from './components/InteractiveTreeNode';
export type { InteractiveTreeNodeProps } from './components/InteractiveTreeNode';

// === 兼容性导出 ===
export type { DiscoveredElement } from './types';

// === 保留的原有导出（向后兼容） ===

// 导出类型定义
export * from './types';

// 导出核心Hook
export { useElementDiscovery } from './useElementDiscovery';

// 导出UI组件
export { ParentElementCard } from './ParentElementCard';
export { ChildElementCard } from './ChildElementCard';
export { SelfElementCard } from './SelfElementCard';
export { ElementDiscoveryModal } from './ElementDiscoveryModal';