// src/components/smart/SmartAppFilterBar.tsx
// module: smart | layer: ui | role: filter-bar
// summary: 智能应用选择器的筛选工具栏组件

import React from 'react';
import { Row, Col, Input, Select, Space, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { OverlayPopupProps } from '../ui/overlay/types';

const { Search } = Input;
const { Option } = Select;

export interface SmartAppFilterBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  viewMode: 'popular' | 'all' | 'search';
  setViewMode: (val: 'popular' | 'all' | 'search') => void;
  categoryFilter: 'all' | 'user' | 'system';
  setCategoryFilter: (val: 'all' | 'user' | 'system') => void;
  statusFilter: 'all' | 'enabled' | 'disabled';
  setStatusFilter: (val: 'all' | 'enabled' | 'disabled') => void;
  refreshStrategy: 'cache_first' | 'force_refresh';
  setRefreshStrategy: (val: 'cache_first' | 'force_refresh') => void;
  pageSize: number;
  setPageSize: (val: number) => void;
  setPage: (val: number) => void;
  onRefresh?: () => void;
  showRefresh?: boolean;
  popupProps?: OverlayPopupProps;
  showViewModeSelector?: boolean;
}

export const SmartAppFilterBar: React.FC<SmartAppFilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  refreshStrategy,
  setRefreshStrategy,
  pageSize,
  setPageSize,
  setPage,
  onRefresh,
  showRefresh = false,
  popupProps = {},
  showViewModeSelector = true
}) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Search
            placeholder="搜索应用名称或包名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={(value) => setSearchQuery(value)}
            allowClear
            prefix={<SearchOutlined />}
          />
        </Col>
        {showViewModeSelector && (
          <Col span={4}>
            <Select
              style={{ width: '100%' }}
              value={viewMode}
              onChange={setViewMode}
              placeholder="视图模式"
              getPopupContainer={popupProps.getPopupContainer}
              popupClassName={popupProps.popupClassName}
            >
              <Option value="popular">热门应用</Option>
              <Option value="all">全部应用</Option>
            </Select>
          </Col>
        )}
        <Col span={showViewModeSelector ? 4 : 6}>
          <Select
            style={{ width: '100%' }}
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="应用类型"
            getPopupContainer={popupProps.getPopupContainer}
            popupClassName={popupProps.popupClassName}
          >
            <Option value="all">全部</Option>
            <Option value="user">用户应用</Option>
            <Option value="system">系统应用</Option>
          </Select>
        </Col>
        <Col span={showViewModeSelector ? 4 : 6}>
          <Select
            style={{ width: '100%' }}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="状态"
            getPopupContainer={popupProps.getPopupContainer}
            popupClassName={popupProps.popupClassName}
          >
            <Option value="all">全部</Option>
            <Option value="enabled">已启用</Option>
            <Option value="disabled">已禁用</Option>
          </Select>
        </Col>
        <Col span={12}>
          <Space>
            <Select
              style={{ width: 160 }}
              value={refreshStrategy}
              onChange={(v) => {
                setRefreshStrategy(v);
                setPage(1);
              }}
              placeholder="刷新策略"
              getPopupContainer={popupProps.getPopupContainer}
              popupClassName={popupProps.popupClassName}
            >
              <Option value="cache_first">缓存优先</Option>
              <Option value="force_refresh">强制刷新</Option>
            </Select>
            <Select 
              style={{ width: 120 }} 
              value={pageSize} 
              onChange={(v) => { 
                setPageSize(v); 
                setPage(1); 
              }} 
              getPopupContainer={popupProps.getPopupContainer}
              popupClassName={popupProps.popupClassName}
            >
              <Option value={30}>每页30</Option>
              <Option value={60}>每页60</Option>
              <Option value={100}>每页100</Option>
            </Select>
            {showRefresh && (
              <Button onClick={() => { 
                setPage(1); 
                onRefresh?.(); 
              }}>
                刷新
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  );
};
