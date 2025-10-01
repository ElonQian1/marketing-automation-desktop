/**
 * 元素发现模块 - 统一导出
 * 
 * 此模块提供元素层次结构分析功能，帮助用户发现父容器和子元素，
 * 以找到更稳定和精确的元素匹配策略。
 * 
 * 主要功能：
 * - 父容器分析：查找包含目标元素的上层容器
 * - 子元素分析：查找包含文本的子元素
 * - 智能推荐：基于置信度算法推荐最佳匹配
 * - 元素详情：展示完整的元素属性和层次关系
 * 
 * 使用示例：
 * ```tsx
 * import { 
 *   ElementDiscoveryModal, 
 *   useElementDiscovery, 
 *   DiscoveredElement 
 * } from './element-discovery';
 * 
 * // 在组件中使用
 * const { discoverElements } = useElementDiscovery(allElements, options);
 * const result = discoverElements(targetElement);
 * ```
 */

// 导出类型定义
export * from './types';

// 导出核心Hook
export { useElementDiscovery } from './useElementDiscovery';

// 导出UI组件
export { ParentElementCard } from './ParentElementCard';
export { ChildElementCard } from './ChildElementCard';
export { SelfElementCard } from './SelfElementCard';
export { ElementDiscoveryModal } from './ElementDiscoveryModal';