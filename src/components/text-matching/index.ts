// src/components/text-matching/index.ts
// module: text-matching | layer: ui | role: module export
// summary: 文本匹配配置模块统一导出

// 主要组件
export { 
  TextMatchingConfigPanel,
  defaultTextMatchingConfig,
  useTextMatchingConfig 
} from './TextMatchingConfigPanel';

// 子组件
export { 
  TextMatchingInlineControl,
  AntonymManager 
} from './components';

// Hook
export { useAntonymManager } from './hooks';

// 核心引擎
export { TextMatchingEngine } from './core';

// 类型
export type { 
  TextMatchingMode,
  TextMatchingConfig,
  TextMatchingConfigPanelProps 
} from './TextMatchingConfigPanel';

export type { 
  TextMatchingInlineControlProps 
} from './components/TextMatchingInlineControl';

export type {
  TextMatchingStepConfig,
  AntonymPair
} from './types';

export type { MatchResult } from './core';