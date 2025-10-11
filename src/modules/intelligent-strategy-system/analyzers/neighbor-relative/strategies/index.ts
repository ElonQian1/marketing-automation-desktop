// src/modules/intelligent-strategy-system/analyzers/neighbor-relative/strategies/index.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * Neighbor-Relative Strategies Index
 * 邻居相对策略模块导出
 */

export { DirectNeighborStrategy } from './DirectNeighborStrategy';
export { DirectionalStrategy } from './DirectionalStrategy';
export { SiblingStrategy } from './SiblingStrategy';
export { DistanceConstraintStrategy } from './DistanceConstraintStrategy';
export { MultiNeighborStrategy } from './MultiNeighborStrategy';

/**
 * 所有邻居相对策略的集合
 */
export const ALL_NEIGHBOR_STRATEGIES = [
  'DirectNeighborStrategy',
  'DirectionalStrategy', 
  'SiblingStrategy',
  'DistanceConstraintStrategy',
  'MultiNeighborStrategy'
] as const;