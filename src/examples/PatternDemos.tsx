// src/examples/PatternDemos.tsx
// module: shared | layer: examples | role: 示例代码
// summary: 功能演示和使用示例

import React from "react";
import { Space, Divider, Tag } from "antd";
import { Heart, Users, Smartphone, TrendingUp, AlertCircle, Wifi } from "lucide-react";
import {
  HeaderBar,
  CompactHeaderBar,
  GradientHeaderBar,
  FilterBar,
  CompactFilterBar,
  MarketplaceCard,
  MetricCard,
  DeviceCard,
  FeatureCard,
  SkeletonCard,
  SkeletonBlock,
  SkeletonList,
  EmptyState,
  NoDataState,
  SearchEmptyState,
  ErrorState,
} from "../components/patterns";
import { Button } from "../components/ui/button/Button";

const PatternDemos: React.FC = () => {
  const [search, setSearch] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<Record<string, any>>({});
  const [showSkeletons, setShowSkeletons] = React.useState(false);

  // 模拟筛选器配置
  const mockFilters = [
    {
      key: 'status',
      label: '状态',
      type: 'select' as const,
      options: [
        { label: '全部', value: 'all' },
        { label: '在线', value: 'online' },
        { label: '离线', value: 'offline' },
      ],
    },
    {
      key: 'category',
      label: '分类',
      type: 'multiSelect' as const,
      options: [
        { label: '营销', value: 'marketing' },
        { label: '运营', value: 'operation' },
        { label: '管理', value: 'management' },
      ],
    }
  ];

  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  const handleFilterReset = () => {
    setFilterValues({});
    setSearch("");
  };

  return (
    <div style={{ padding: 16 }}>
      {/* HeaderBar 变体演示 */}
      <Divider orientation="left">Header Bar 变体</Divider>
      <Space direction="vertical" size="middle" style={{ width: "100%", marginBottom: 24 }}>
        <HeaderBar 
          title="标准页面头部" 
          description="适用于大多数管理页面的头部样式"
          breadcrumb={[
            { label: "首页", href: "/" },
            { label: "演示页面" }
          ]}
        />
        <CompactHeaderBar 
          title="紧凑型头部" 
          description="空间有限时的简化头部样式"
        />
        <GradientHeaderBar 
          title="渐变背景头部" 
          description="适用于着陆页和重要功能页面"
        />
      </Space>

      {/* FilterBar 功能演示 */}
      <Divider orientation="left">Filter Bar 功能演示</Divider>
      <Space direction="vertical" size="middle" style={{ width: "100%", marginBottom: 24 }}>
        <FilterBar 
          searchPlaceholder="搜索员工、设备或功能..."
          searchValue={search}
          onSearch={setSearch}
          filters={mockFilters}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onReset={handleFilterReset}
          showReset={true}
          actions={
            <Button variant="outline" size="sm">
              导出数据
            </Button>
          }
        />
        <CompactFilterBar 
          searchPlaceholder="紧凑模式搜索..."
          searchValue={search}
          onSearch={setSearch}
        />
      </Space>

      {/* MarketplaceCard 业务场景演示 */}
      <Divider orientation="left">Marketplace Card 业务场景</Divider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 24 }}>
        <MetricCard 
          title="今日关注" 
          value={156} 
          trend="+12.5%" 
          trendType="up"
          icon={<Heart className="w-5 h-5" />}
        />
        <MetricCard 
          title="活跃设备" 
          value={8} 
          trend="-2.1%" 
          trendType="down"
          icon={<Smartphone className="w-5 h-5" />}
        />
        <DeviceCard 
          title="设备001"
          status="online"
          deviceModel="Xiaomi 13 Pro"
          lastActive="2分钟前"
        />
        <FeatureCard 
          title="联系人导入"
          description="批量导入和管理联系人"
          isActive={true}
        />
      </div>

      {/* Skeleton 加载效果演示 */}
      <Divider orientation="left">Skeleton 加载效果</Divider>
      <Space direction="vertical" size="middle" style={{ width: "100%", marginBottom: 24 }}>
        <Space>
          <Button 
            variant={showSkeletons ? "default" : "outline"}
            onClick={() => setShowSkeletons(!showSkeletons)}
          >
            {showSkeletons ? "显示真实内容" : "显示骨架屏"}
          </Button>
          <Tag color={showSkeletons ? "orange" : "green"}>
            {showSkeletons ? "加载中..." : "已加载"}
          </Tag>
        </Space>
        
        {showSkeletons ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonBlock />
            <SkeletonList items={3} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MarketplaceCard variant="metric" title="真实数据" value={2340} trend="+15.2%" trendType="up" />
            <MarketplaceCard variant="feature" title="功能模块" description="这是加载完成后的真实内容" />
            <div className="p-4 border rounded-lg bg-white">
              <h4 className="font-medium mb-2">列表数据</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>张三 - 营销部</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>李四 - 运营部</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>王五 - 管理部</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </Space>

      {/* Empty State 完整场景演示 */}
      <Divider orientation="left">Empty State 场景覆盖</Divider>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ marginBottom: 24 }}>
        <NoDataState
          title="暂无员工数据"
          description="还没有添加任何员工信息，点击下方按钮开始添加"
          action={
            <Button variant="default">
              <Users className="w-4 h-4 mr-2" />
              添加第一个员工
            </Button>
          }
        />
        
        <SearchEmptyState
          title="未找到匹配结果"
          description={`关键词"${search || 'example'}"没有找到相关内容`}
          action={
            <Button variant="outline" onClick={() => setSearch("")}>
              清除搜索
            </Button>
          }
        />
        
        <EmptyState
          variant="filtered"
          title="筛选无结果"
          description="当前筛选条件下没有数据，请调整筛选条件"
          action={
            <Button variant="outline" onClick={handleFilterReset}>
              重置筛选
            </Button>
          }
        />
        
        <ErrorState
          title="连接失败"
          description="无法连接到服务器，请检查网络连接后重试"
          action={
            <Button variant="default">
              <AlertCircle className="w-4 h-4 mr-2" />
              重新连接
            </Button>
          }
        />
        
        <EmptyState
          variant="offline"
          title="网络离线"
          description="当前处于离线状态，部分功能可能无法使用"
          icon={<Wifi className="w-full h-full" />}
          action={
            <Button variant="outline">
              检查连接
            </Button>
          }
        />
        
        <EmptyState
          variant="maintenance"
          title="系统维护中"
          description="系统正在进行例行维护，预计30分钟后恢复"
          compact={true}
        />
      </div>

      {/* 筛选状态演示 */}
      {(search || Object.keys(filterValues).length > 0) && (
        <>
          <Divider orientation="left">当前筛选状态</Divider>
          <div style={{ marginBottom: 24, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
            <Space wrap>
              {search && <Tag color="blue">搜索: {search}</Tag>}
              {Object.entries(filterValues).map(([key, value]) => 
                value && (
                  <Tag key={key} color="green">
                    {key}: {Array.isArray(value) ? value.join(', ') : value}
                  </Tag>
                )
              )}
            </Space>
          </div>
        </>
      )}
    </div>
  );
};

export default PatternDemos;
