// src/components/text-matching/index.ts
// module: ui | layer: ui | role: module export
// summary: 文本匹配配置模块导出

export { 
  TextMatchingConfigPanel,
  defaultTextMatchingConfig,
  useTextMatchingConfig 
} from './TextMatchingConfigPanel';

export { TextMatchingInlineControl } from './components/TextMatchingInlineControl';

export type { 
  TextMatchingMode,
  TextMatchingConfig,
  TextMatchingConfigPanelProps 
} from './TextMatchingConfigPanel';

export type { TextMatchingInlineControlProps } from './components/TextMatchingInlineControl';