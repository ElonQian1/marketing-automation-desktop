/**
 * 统一表格列管理系统导出
 * 
 * 使用方式：
 * ```typescript
 * import { useTableColumns, TableColumnSettings } from '@/components/universal-ui/table';
 * ```
 */

export { useTableColumns } from './useTableColumns';
export type { 
  UseTableColumnsOptions, 
  UseTableColumnsResult, 
  TableColumnConfig, 
  TableColumnState 
} from './useTableColumns';

export { TableColumnSettings } from './TableColumnSettings';
export type { TableColumnSettingsProps } from './TableColumnSettings';

export { ResizableHeader, AntTableResizableHeader } from './ResizableHeader';
export type { ResizableHeaderProps } from './ResizableHeader';