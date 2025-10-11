// src/modules/contact-import/ui/components/number-pool-table/ColumnConfigPanel.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Checkbox, Space, Button, Popover, Typography, Divider } from 'antd';
import { SettingOutlined, ReloadOutlined } from '@ant-design/icons';
import { ColumnConfigPanelProps } from './useNumberPoolTable';

const { Text } = Typography;

export const ColumnConfigPanel: React.FC<ColumnConfigPanelProps> = ({
  availableColumns,
  visibleColumns,
  onToggleColumn,
  onResetColumns,
}) => {
  const content = (
    <div style={{ width: 280 }}>
      <div style={{ marginBottom: 12 }}>
        <Space>
          <Text strong>列显示设置</Text>
          <Button 
            size="small" 
            icon={<ReloadOutlined />} 
            onClick={onResetColumns}
            type="link"
          >
            重置
          </Button>
        </Space>
      </div>
      <Divider style={{ margin: '8px 0' }} />
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {availableColumns.map(column => (
            <Checkbox
              key={column.id}
              checked={visibleColumns.has(column.id)}
              onChange={() => onToggleColumn(column.id)}
            >
              <Space>
                <span>{column.title}</span>
                {column.width && <Text type="secondary" style={{ fontSize: '12px' }}>({column.width}px)</Text>}
              </Space>
            </Checkbox>
          ))}
        </Space>
      </div>
      <Divider style={{ margin: '8px 0' }} />
      <Text type="secondary" style={{ fontSize: '12px' }}>
        已显示 {visibleColumns.size} / {availableColumns.length} 列
      </Text>
    </div>
  );

  return (
    <Popover
      content={content}
      title={null}
      trigger="click"
      placement="bottomRight"
    >
      <Button icon={<SettingOutlined />} type="text">
        列设置
      </Button>
    </Popover>
  );
};