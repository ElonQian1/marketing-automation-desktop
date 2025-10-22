// src/modules/contact-import/ui/components/number-pool-table/index.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

// 导出所有号码池表格相关的组件和工具
export { useNumberPoolTable } from './useNumberPoolTable';
export type { 
  UseNumberPoolTableOptions, 
  NumberPoolTableState, 
  NumberPoolTableActions,
  ColumnConfigPanelProps 
} from './useNumberPoolTable';

export { ColumnConfigPanel } from './ColumnConfigPanel';

export { 
  createNumberPoolColumns, 
  COLUMN_CONFIGS 
} from './NumberPoolTableColumns';
export type { 
  NumberPoolColumnConfig, 
  CreateColumnsOptions, 
  ColumnRenderer, 
  ColumnRenderers 
} from './NumberPoolTableColumns';

export { 
  createNumberPoolRenderers,
  StatusRenderer,
  UsedRenderer,
  DeviceRenderer,
  IndustryRenderer,
  TimeRenderer,
  BatchRenderer,
  FilePathRenderer,
} from './NumberPoolFieldRenderers';

export { ContactNumberTreeTable } from './contact-number-tree-table';