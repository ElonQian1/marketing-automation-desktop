/**
 * Element Discovery 模块化架构 - 统一导出
 * 
 * 这个文件提供了重构后的模块化组件和服务的统一导出接口
 * 
 * 架构层次：
 * - Services: 业务逻辑服务层
 * - Utils: 工具类和辅助函数
 * - Hooks: React 状态管理和逻辑 Hook
 * - Components: UI 组件层
 */

// === 新的模块化架构导出 ===

// 核心服务层
export { XmlStructureParser, type HierarchyNode } from './services/xmlStructureParser';
export { ElementAnalyzer } from './services/elementAnalyzer';
export { HierarchyBuilder } from './services/hierarchyBuilder';

// 工具层
export { BoundaryDetector } from './utils/boundaryDetector';

// Hook 层
export { useArchitectureTree } from './hooks/useArchitectureTree';
export { useElementVisualization } from './hooks/useElementVisualization';

// 组件层
export { default as ArchitectureDiagram } from './ArchitectureDiagram_v2';
export type { ArchitectureDiagramProps } from './ArchitectureDiagram_v2';

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

// 导出原版架构图组件（兼容性）
export { default as ArchitectureDiagramLegacy } from './ArchitectureDiagram';