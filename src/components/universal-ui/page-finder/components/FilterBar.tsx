// src/components/universal-ui/page-finder/components/FilterBar.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Input, Space, Checkbox } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface FilterBarProps {
  searchText: string;
  onSearchTextChange: (v: string) => void;
  showOnlyClickable: boolean;
  onShowOnlyClickableChange: (v: boolean) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchText,
  onSearchTextChange,
  showOnlyClickable,
  onShowOnlyClickableChange,
}) => {
  return (
    <Space direction="vertical">
      <Input
        placeholder="搜索元素..."
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => onSearchTextChange(e.target.value)}
      />
      <Checkbox
        checked={showOnlyClickable}
        onChange={(e) => onShowOnlyClickableChange(e.target.checked)}
      >
        只显示可点击元素
      </Checkbox>
    </Space>
  );
};

export default FilterBar;
