/**
 * 联系人工作台表格列配置组件
 * Employee D架构 - 单一职责：表格列定义和渲染配置
 * 
 * 职责：
 * - 定义表格列结构和宽度
 * - 处理列的渲染逻辑（状态标签、设备标签等）
 * - 提供可调整列宽的表头组件
 */

import React from 'react';
import { Tag, Text } from '../../../../components/adapters';
import { MobileOutlined } from '@ant-design/icons';
import { ResizableHeaderCell } from '../../../../components/universal-ui/table/resizable';
import type { ContactNumberDto } from '../services/contactNumberService';

export interface TableColumn {
  title: string;
  dataIndex: string;
  width?: number;
  render?: (value: any, record: ContactNumberDto) => React.ReactNode;
}

export interface WorkbenchTableColumnsProps {
  columnSettings: {
    visibleColumns: Array<{
      key: string;
      title: string;
      visible: boolean;
      width?: number;
    }>;
  };
  resizableRuntime: any;
}

/**
 * 获取工作台表格列配置
 */
export const getWorkbenchTableColumns = ({ 
  columnSettings, 
  resizableRuntime 
}: WorkbenchTableColumnsProps) => {
  const columns: TableColumn[] = [];

  columnSettings.visibleColumns.forEach(cfg => {
    if (!cfg.visible) return;

    switch (cfg.key) {
      case 'id':
        columns.push({
          title: cfg.title,
          dataIndex: 'id',
          width: cfg.width ?? 80,
        });
        break;

      case 'phone_number':
        columns.push({
          title: cfg.title,
          dataIndex: 'phone_number',
          width: cfg.width ?? 130,
        });
        break;

      case 'name':
        columns.push({
          title: cfg.title,
          dataIndex: 'name',
          width: cfg.width ?? 100,
        });
        break;

      case 'industry':
        columns.push({
          title: cfg.title,
          dataIndex: 'industry',
          width: cfg.width ?? 120,
          render: (industry: string | null) => 
            industry ? (
              <Tag color="geekblue">{industry}</Tag>
            ) : (
              <Text type="secondary">未分类</Text>
            )
        });
        break;

      case 'status':
        columns.push({
          title: cfg.title,
          dataIndex: 'status',
          width: cfg.width ?? 100,
          render: (status: string | null) => {
            const statusConfig = getStatusConfig(status);
            return <Tag color={statusConfig.color}>{statusConfig.text}</Tag>;
          }
        });
        break;

      case 'used':
        columns.push({
          title: cfg.title,
          dataIndex: 'used',
          width: cfg.width ?? 100,
          render: (used: number | null) => {
            if (used === 1) return <Tag color="warning">已使用</Tag>;
            if (used === 0) return <Tag color="default">未使用</Tag>;
            return <Tag color="default">-</Tag>;
          }
        });
        break;

      case 'imported_device_id':
        columns.push({
          title: cfg.title,
          dataIndex: 'imported_device_id',
          width: cfg.width ?? 150,
          render: (deviceId: string | null) =>
            deviceId ? (
              <Tag color="blue" icon={<MobileOutlined />}>{deviceId}</Tag>
            ) : (
              <Text type="secondary">-</Text>
            )
        });
        break;

      case 'created_at':
        columns.push({
          title: cfg.title,
          dataIndex: 'created_at',
          width: cfg.width ?? 160,
          render: (time: string) => {
            try {
              return <Text>{new Date(time).toLocaleString('zh-CN')}</Text>;
            } catch {
              return <Text>{time}</Text>;
            }
          }
        });
        break;

      default:
        break;
    }
  });

  return columns;
};

/**
 * 获取状态配置
 */
const getStatusConfig = (status: string | null) => {
  switch (status) {
    case 'imported':
      return { color: 'success', text: '已导入' };
    case 'not_imported':
      return { color: 'default', text: '未导入' };
    case 'failed':
      return { color: 'error', text: '导入失败' };
    default:
      return { color: 'default', text: status || '-' };
  }
};

/**
 * 可调整大小的表头组件
 */
export const WorkbenchResizableHeader: React.FC<any> = (props) => {
  const { resizableRuntime } = props;
  
  if (!resizableRuntime) return <th {...props} />;

  return (
    <ResizableHeaderCell
      {...props}
      width={resizableRuntime.width}
      onResize={resizableRuntime.onResize}
      onResizeStop={resizableRuntime.onResizeStop}
      onResizeStart={resizableRuntime.onResizeStart}
    />
  );
};