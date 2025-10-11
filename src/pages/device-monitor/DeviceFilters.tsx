// src/pages/device-monitor/DeviceFilters.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React from 'react';
import { Space, Select, Input, Tag } from 'antd';
import type { DeviceFiltersProps } from './types';

const STATUS_OPTIONS = [
  { label: '在线', value: 'device' },
  { label: '未授权', value: 'unauthorized' },
  { label: '离线', value: 'offline' },
];

const CONN_OPTIONS = [
  { label: 'USB', value: 'usb' },
  { label: '模拟器', value: 'emulator' },
];

export const DeviceFilters: React.FC<DeviceFiltersProps> = ({ value, onChange }) => {
  return (
    <Space wrap>
      <Select
        mode="multiple"
        allowClear
        placeholder="按状态过滤"
        options={STATUS_OPTIONS}
        value={value.statuses}
        onChange={(v) => onChange({ ...value, statuses: v as any })}
        tagRender={(props) => <Tag closable={props.closable} onClose={props.onClose}>{props.label}</Tag>}
      />
      <Select
        mode="multiple"
        allowClear
        placeholder="按连接类型过滤"
        options={CONN_OPTIONS}
        value={value.connections}
        onChange={(v) => onChange({ ...value, connections: v as any })}
        tagRender={(props) => <Tag closable={props.closable} onClose={props.onClose}>{props.label}</Tag>}
      />
      <Input
        allowClear
        placeholder="按设备ID关键字过滤"
        value={value.keyword}
        onChange={(e) => onChange({ ...value, keyword: e.target.value })}
      />
    </Space>
  );
};
