// src/modules/contact-import/ui/batch-manager/components/table-cells/index.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 表格单元格组件集合
 * 提供可复用的表格单元格组件，所有组件都支持主题适配
 */

// 主要组件
export { default as TimeFormatterCell } from './TimeFormatterCell';
export { default as BatchIdCell } from './BatchIdCell';
export { default as ThemeAwareCell } from './ThemeAwareCell';
export { default as LatestImportTimeCell } from './LatestImportTimeCell';
export { default as IndustryTagCell } from './IndustryTagCell';

// 预设文本组件
export {
  PrimaryText,
  SecondaryText,
  TertiaryText,
  EmphasizedText,
  ErrorText,
  SuccessText,
  WarningText
} from './ThemeAwareCell';

// 导出组件Props类型，便于外部使用
export type { default as TimeFormatterCellProps } from './TimeFormatterCell';
export type { default as BatchIdCellProps } from './BatchIdCell';
export type { LatestImportTimeCellProps } from './LatestImportTimeCell';
export type { IndustryTagCellProps } from './IndustryTagCell';
export type { 
  ThemeAwareCellProps, 
  TextVariant 
} from './ThemeAwareCell';