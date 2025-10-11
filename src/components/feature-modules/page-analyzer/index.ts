// src/components/feature-modules/page-analyzer/index.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 页面分析器模块统一导出
 * 提供所有组件、Hook、类型的便捷导入方式
 */

// 组件导出
export { ElementTree } from './components/ElementTree';
export { PropertyPanel } from './components/PropertyPanel';
export { PageAnalyzerContainer } from './components/PageAnalyzerContainer';

// Hooks导出
export { usePageAnalyzerState } from './hooks/usePageAnalyzerState';
export { useElementTree } from './hooks/useElementTree';

// 类型导出
export type * from './types';

// 组件Props类型导出
export type { ElementTreeProps } from './components/ElementTree';
export type { PropertyPanelProps } from './components/PropertyPanel';
export type { PageAnalyzerContainerProps } from './components/PageAnalyzerContainer';

// 模块信息
export const PageAnalyzerModule = {
  name: 'PageAnalyzer',
  version: '1.0.0',
  description: '页面元素分析器模块',
  components: [
    'ElementTree',
    'PropertyPanel', 
    'MatchStrategySelector',
    'PageAnalyzerContainer'
  ],
  hooks: [
    'usePageAnalyzerState',
    'useElementTree'
  ],
  features: [
    '元素树状结构展示',
    '属性面板详情显示',
    '匹配策略配置',
    '搜索和过滤功能',
    '响应式布局支持'
  ]
} as const;