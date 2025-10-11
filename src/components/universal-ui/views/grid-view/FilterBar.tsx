// src/components/universal-ui/views/grid-view/FilterBar.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Space, Checkbox, Input, Select } from 'antd';
import { AdvancedFilter } from './types';

export interface FilterBarProps {
  value: AdvancedFilter;
  onChange: (v: AdvancedFilter) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ value, onChange }) => {
  const set = (patch: Partial<AdvancedFilter>) => onChange({ ...value, ...patch });
  return (
    <Space wrap>
      <Checkbox
        checked={value.enabled}
        onChange={(e) => set({ enabled: e.target.checked })}
      >
        启用多条件过滤
      </Checkbox>

      <Select
        value={value.mode}
        onChange={(v: 'AND' | 'OR') => set({ mode: v })}
        options={[
          { label: 'AND', value: 'AND' },
          { label: 'OR', value: 'OR' },
        ]}
      />

      <Input
        placeholder="resource-id"
        value={value.resourceId}
        onChange={(e) => set({ resourceId: e.target.value })}
      />

      <Input
        placeholder="text/content-desc"
        value={value.text}
        onChange={(e) => set({ text: e.target.value })}
      />

      <Input
        placeholder="class"
        value={value.className}
        onChange={(e) => set({ className: e.target.value })}
      />

      <Input
        placeholder="package"
        value={value.packageName}
        onChange={(e) => set({ packageName: e.target.value })}
      />

      <Select
        value={value.clickable === null ? 'any' : value.clickable ? 'true' : 'false'}
        onChange={(v: 'any' | 'true' | 'false') => set({ clickable: v === 'any' ? null : v === 'true' })}
        options={[
          { label: 'clickable:any', value: 'any' },
          { label: 'clickable:true', value: 'true' },
          { label: 'clickable:false', value: 'false' },
        ]}
      />

      <Select
        value={value.nodeEnabled === null ? 'any' : value.nodeEnabled ? 'true' : 'false'}
        onChange={(v: 'any' | 'true' | 'false') => set({ nodeEnabled: v === 'any' ? null : v === 'true' })}
        options={[
          { label: 'enabled:any', value: 'any' },
          { label: 'enabled:true', value: 'true' },
          { label: 'enabled:false', value: 'false' },
        ]}
      />
    </Space>
  );
};
