// src/modules/contact-import/ui/components/number-pool-table/NumberPoolTableColumns.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

import type { ColumnType } from 'antd/es/table';
import { ContactNumberDto } from '../../services/contactNumberService';
import { Device } from '../../../../../domain/adb/entities/Device';

export interface NumberPoolColumnConfig {
  id: string;
  title: string;
  dataIndex: string;
  width?: number;
  ellipsis?: boolean;
  defaultVisible: boolean;
  sortable?: boolean;
  filterable?: boolean;
}

export const COLUMN_CONFIGS: NumberPoolColumnConfig[] = [
  {
    id: 'index',
    title: '序号',
    dataIndex: 'index',
    width: 70,
    defaultVisible: true,
  },
  {
    id: 'id',
    title: 'ID',
    dataIndex: 'id',
    width: 80,
    defaultVisible: true,
    sortable: true,
  },
  {
    id: 'phone',
    title: '号码',
    dataIndex: 'phone',
    defaultVisible: true,
    filterable: true,
  },
  {
    id: 'name',
    title: '姓名',
    dataIndex: 'name',
    width: 180,
    defaultVisible: true,
    filterable: true,
  },
  {
    id: 'industry',
    title: '行业分类',
    dataIndex: 'industry',
    width: 120,
    defaultVisible: true,
    filterable: true,
  },
  {
    id: 'status',
    title: '状态',
    dataIndex: 'status',
    width: 120,
    defaultVisible: true,
    filterable: true,
  },
  {
    id: 'used',
    title: '是否已用',
    dataIndex: 'used',
    width: 100,
    defaultVisible: true,
    filterable: true,
  },
  {
    id: 'imported_device_id',
    title: '导入设备',
    dataIndex: 'imported_device_id',
    width: 150,
    defaultVisible: true,
    filterable: true,
  },
  {
    id: 'used_batch',
    title: 'VCF批次',
    dataIndex: 'used_batch',
    width: 150,
    defaultVisible: false,
    ellipsis: true,
  },
  {
    id: 'used_at',
    title: '使用时间',
    dataIndex: 'used_at',
    width: 160,
    defaultVisible: false,
  },
  {
    id: 'source_file',
    title: '来源文件',
    dataIndex: 'source_file',
    defaultVisible: true,
    ellipsis: true,
  },
  {
    id: 'created_at',
    title: '创建时间',
    dataIndex: 'created_at',
    width: 160,
    defaultVisible: true,
  },
];

export interface CreateColumnsOptions {
  page: number;
  pageSize: number;
  visibleColumns: Set<string>;
  devices?: Device[];
}

export type ColumnRenderer = (value: any, record: ContactNumberDto, index: number) => React.ReactNode;

export interface ColumnRenderers {
  [key: string]: ColumnRenderer;
}

export function createNumberPoolColumns(
  options: CreateColumnsOptions,
  renderers: ColumnRenderers
): ColumnType<ContactNumberDto>[] {
  const { page, pageSize, visibleColumns } = options;

  return COLUMN_CONFIGS
    .filter(config => visibleColumns.has(config.id))
    .map(config => {
      const column: ColumnType<ContactNumberDto> = {
        title: config.title,
        dataIndex: config.dataIndex,
        width: config.width,
        ellipsis: config.ellipsis,
        key: config.id,
      };

      // 特殊处理序号列
      if (config.id === 'index') {
        column.render = (_: any, __: any, index: number) => 
          (page - 1) * pageSize + index + 1;
      }
      // 使用自定义渲染器
      else if (renderers[config.id]) {
        column.render = renderers[config.id];
      }

      return column;
    });
}