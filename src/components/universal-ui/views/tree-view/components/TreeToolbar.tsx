/**
 * UIElementTree 工具栏组件
 * 提供过滤、搜索、操作按钮等功能
 */

import React from 'react';
import { Button, Input, Select, Space, Badge, Tooltip, Divider } from 'antd';
import { 
  SearchOutlined, 
  ClearOutlined, 
  ExpandOutlined,
  ShrinkOutlined,
  FilterOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { FilterOptions, FILTER_OPTIONS } from '../types';

const { Search } = Input;
const { Option } = Select;

interface TreeToolbarProps {
  searchTerm: string;
  filterOptions: FilterOptions;
  selectedCount: number;
  totalCount: number;
  filteredCount: number;
  onSearchChange: (value: string) => void;
  onFilterChange: (filters: FilterOptions) => void;
  onQuickFilter: (filterName: keyof typeof FILTER_OPTIONS) => void;
  onResetFilters: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onRefresh?: () => void;
}

export const TreeToolbar: React.FC<TreeToolbarProps> = ({
  searchTerm,
  filterOptions,
  selectedCount,
  totalCount,
  filteredCount,
  onSearchChange,
  onFilterChange,
  onQuickFilter,
  onResetFilters,
  onSelectAll,
  onClearSelection,
  onExpandAll,
  onCollapseAll,
  onRefresh,
}) => {
  const hasActiveFilters = Object.values(filterOptions).some(Boolean);

  return (
    <div className="tree-toolbar p-3 border-b bg-gray-50">
      {/* 第一行：搜索和快速过滤 */}
      <div className="flex items-center gap-3 mb-3">
        <Search
          placeholder="搜索元素（ID、文本、类名等）"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onSearch={onSearchChange}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
          allowClear
        />
        
        <Select
          placeholder="快速过滤"
          style={{ width: 150 }}
          onChange={onQuickFilter}
          allowClear
          onClear={() => onQuickFilter('all')}
        >
          <Option value="all">显示全部</Option>
          <Option value="highQuality">仅高质量</Option>
          <Option value="interactable">仅可交互</Option>
          <Option value="withText">仅有文本</Option>
          <Option value="withId">仅有ID</Option>
        </Select>

        <Tooltip title={hasActiveFilters ? "有活动过滤器" : "无过滤器"}>
          <Badge dot={hasActiveFilters}>
            <Button 
              icon={<FilterOutlined />}
              onClick={onResetFilters}
              type={hasActiveFilters ? "primary" : "default"}
            >
              过滤器
            </Button>
          </Badge>
        </Tooltip>

        {onRefresh && (
          <Button icon={<ReloadOutlined />} onClick={onRefresh}>
            刷新
          </Button>
        )}
      </div>

      {/* 第二行：统计信息和操作按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <InfoCircleOutlined />
            <span>
              显示 <Badge count={filteredCount} style={{ backgroundColor: '#52c41a' }} /> / {totalCount} 个元素
            </span>
          </div>
          
          {selectedCount > 0 && (
            <div className="text-sm text-blue-600">
              已选择 {selectedCount} 个元素
            </div>
          )}
        </div>

        <Space split={<Divider type="vertical" />}>
          {/* 选择操作 */}
          <Space>
            <Button size="small" onClick={onSelectAll}>
              全选
            </Button>
            <Button size="small" onClick={onClearSelection} disabled={selectedCount === 0}>
              清除选择
            </Button>
          </Space>

          {/* 展开操作 */}
          <Space>
            <Button size="small" icon={<ExpandOutlined />} onClick={onExpandAll}>
              展开全部
            </Button>
            <Button size="small" icon={<ShrinkOutlined />} onClick={onCollapseAll}>
              收起全部
            </Button>
          </Space>
        </Space>
      </div>

      {/* 详细过滤器选项（当有过滤时显示） */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t">
          <div className="text-xs text-gray-500 mb-2">活动过滤器:</div>
          <Space size={[8, 8]} wrap>
            {filterOptions.showHighQualityOnly && (
              <Badge status="processing" text="仅高质量" />
            )}
            {filterOptions.showInteractableOnly && (
              <Badge status="processing" text="仅可交互" />
            )}
            {filterOptions.showWithTextOnly && (
              <Badge status="processing" text="仅有文本" />
            )}
            {filterOptions.showWithIdOnly && (
              <Badge status="processing" text="仅有ID" />
            )}
            {filterOptions.hideSmallElements && (
              <Badge status="processing" text="隐藏小元素" />
            )}
          </Space>
        </div>
      )}
    </div>
  );
};