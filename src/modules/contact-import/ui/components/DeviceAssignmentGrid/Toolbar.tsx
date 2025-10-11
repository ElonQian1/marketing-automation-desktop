// src/modules/contact-import/ui/components/DeviceAssignmentGrid/Toolbar.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Button, Checkbox, Space, Typography, InputNumber, App } from 'antd';
import { SyncOutlined, ReloadOutlined } from '@ant-design/icons';
const { Text } = Typography;

export function Toolbar(props: {
  allSelected: boolean;
  selectedCount: number;
  onToggleAll: (checked: boolean) => void;
  onClear: () => void;
  bulkCount: number;
  setBulkCount: (n: number) => void;
  onBulkAssign: () => void;
  onRefreshDevices?: () => void;
  onRefreshAllCounts?: () => void;
}) {
  const { message } = App.useApp();
  return (
    <Space wrap>
      {props.onRefreshDevices && (
        <Button 
          onClick={props.onRefreshDevices} 
          icon={<SyncOutlined />}
          title="重新扫描 ADB 设备连接状态（插拔设备后点击此按钮）"
        >
          刷新设备列表
        </Button>
      )}
      {props.onRefreshAllCounts && (
        <Button 
          onClick={props.onRefreshAllCounts}
          icon={<ReloadOutlined />}
          title="刷新每台设备的联系人数量"
        >
          刷新联系人数量
        </Button>
      )}
      <Checkbox
        checked={props.allSelected}
        indeterminate={!props.allSelected && props.selectedCount > 0}
        onChange={(e) => props.onToggleAll(e.target.checked)}
      >全选</Checkbox>
      <Button onClick={props.onClear}>清空选择</Button>
      <Text type="secondary">已选 {props.selectedCount} 台</Text>
      <InputNumber size="small" min={1} style={{ width: 100 }} value={props.bulkCount} onChange={(v) => props.setBulkCount(typeof v === 'number' ? v : props.bulkCount)} />
      <Button type="primary" onClick={() => {
        if (props.selectedCount === 0) { message.warning('请先选择需要分配的设备'); return; }
        props.onBulkAssign();
      }}>分配所选</Button>
    </Space>
  );
}
