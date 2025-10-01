import React from "react";
import { Space, Divider } from "antd";
import {
  HeaderBar,
  FilterBar,
  MarketplaceCard,
  SkeletonCard,
  EmptyState,
} from "../components/patterns";

const PatternDemos: React.FC = () => {
  const [search, setSearch] = React.useState("");
  return (
    <div style={{ padding: 16 }}>
      <HeaderBar title="Pattern Demos" description="Skeleton / EmptyState / MarketplaceCard" />
      <FilterBar 
        searchPlaceholder="搜索..."
        searchValue={search}
        onSearch={setSearch}
      />

      <Divider>Marketplace + Skeleton</Divider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SkeletonCard />
        <MarketplaceCard variant="metric" title="今日新增" value={128} trend="+6.2%" trendType="up" />
        <MarketplaceCard variant="feature" title="导入向导" description="批量导入联系人" />
      </div>

      <Divider>Empty States</Divider>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <EmptyState variant="noData" title="暂无数据" description="请先添加条目" />
        <EmptyState variant="searchEmpty" title="未找到结果" description={`关键词：${search || '（未输入）'}`} />
        <EmptyState variant="filtered" title="筛选无结果" description="请调整筛选条件" />
        <EmptyState variant="error" title="加载失败" description="请稍后重试" />
        <EmptyState variant="offline" title="离线" description="请检查网络连接" />
      </Space>
    </div>
  );
};

export default PatternDemos;
