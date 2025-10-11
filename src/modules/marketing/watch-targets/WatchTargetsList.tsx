// src/modules/marketing/watch-targets/WatchTargetsList.tsx
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

import React, { useEffect, useState } from 'react';
import { Card, Table, Space, Tag, Select, Typography, Button, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ServiceFactory } from '../../../application/services/ServiceFactory';

const { Text } = Typography;

// 数据行类型与后端 rows 对齐（最小必要字段）
interface WatchTargetRowVM {
  dedup_key: string;
  target_type: string;
  platform: string;
  id_or_url: string;
  title?: string;
  source?: string;
  industry_tags?: string; // 逗号分隔
  region?: string;
  notes?: string;
  created_at?: string;
}

// 过滤器状态
interface Filters {
  platform?: string;
  target_type?: string;
}

const PLATFORM_OPTIONS = [
  { label: '全部', value: '' },
  { label: 'xiaohongshu', value: 'xiaohongshu' },
  { label: 'douyin', value: 'douyin' },
  { label: 'kuaishou', value: 'kuaishou' },
  { label: 'weibo', value: 'weibo' },
  { label: 'bilibili', value: 'bilibili' },
];

const TYPE_OPTIONS = [
  { label: '全部', value: '' },
  { label: 'user', value: 'user' },
  { label: 'topic', value: 'topic' },
  { label: 'hashtag', value: 'hashtag' },
  { label: 'shop', value: 'shop' },
];

export const WatchTargetsList: React.FC = () => {
  const [data, setData] = useState<WatchTargetRowVM[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({});

  const columns: ColumnsType<WatchTargetRowVM> = [
    { title: '平台', dataIndex: 'platform', key: 'platform', width: 120,
      render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '类型', dataIndex: 'target_type', key: 'target_type', width: 120,
      render: (v: string) => <Tag>{v}</Tag> },
    { title: '标识/链接', dataIndex: 'id_or_url', key: 'id_or_url', ellipsis: true },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '来源', dataIndex: 'source', key: 'source', width: 120 },
    { title: '行业标签', dataIndex: 'industry_tags', key: 'industry_tags',
      render: (v?: string) => (v ? (
        <Space wrap>
          {v.split(',').filter(Boolean).map(tag => (
            <Tag key={tag} color="processing">{tag}</Tag>
          ))}
        </Space>
      ) : <Text type="secondary">—</Text>)
    },
    { title: '区域', dataIndex: 'region', key: 'region', width: 120 },
  ];

  // 通过 watchRepo 直接调用 list（走 Tauri 命令）
  const fetchData = async () => {
    setLoading(true);
    try {
      // 直接访问容器内注册的仓储，避免重复 plumbing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const repo: any = (ServiceFactory as any).get ? (ServiceFactory as any).get('watchTargetRepository') : null;
      // 若上行不可达，回退通过 app service 的方法（此处先做轻实现，后续可在 MarketingApplicationService 增加 list 方法）
      if (!repo || typeof repo.list !== 'function') {
        // 尝试通过 Tauri 仓储动态引入
        const { TauriWatchTargetRepository } = await import('../../../infrastructure/repositories/TauriWatchTargetRepository');
        const fallback = new TauriWatchTargetRepository();
        const rows = await fallback.list({ limit: 200, offset: 0, platform: filters.platform || undefined, target_type: filters.target_type || undefined });
        const vms: WatchTargetRowVM[] = (rows || []).map((r: any) => ({
          dedup_key: r.dedup_key,
          target_type: r.target_type,
          platform: r.platform,
          id_or_url: r.platform_id_or_url,
          title: r.title,
          source: r.source,
          industry_tags: Array.isArray(r.industry_tags) ? r.industry_tags.join(',') : r.industry_tags,
          region: r.region_tag,
          notes: r.notes,
          created_at: r.created_at,
        }));
        setData(vms);
      } else {
        const rows = await repo.list({ limit: 200, offset: 0, platform: filters.platform || undefined, target_type: filters.target_type || undefined });
        const vms: WatchTargetRowVM[] = (rows || []).map((r: any) => ({
          dedup_key: r.dedup_key,
          target_type: r.target_type,
          platform: r.platform,
          id_or_url: r.platform_id_or_url,
          title: r.title,
          source: r.source,
          industry_tags: Array.isArray(r.industry_tags) ? r.industry_tags.join(',') : r.industry_tags,
          region: r.region_tag,
          notes: r.notes,
          created_at: r.created_at,
        }));
        setData(vms);
      }
    } catch (e) {
      console.error('加载 watch_targets 失败: ', e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.platform, filters.target_type]);

  return (
    <Card title={<Space>候选池 Watch Targets<Tag color="purple">验证视图</Tag></Space>}
          extra={
            <Space>
              <Select
                style={{ width: 160 }}
                placeholder="平台筛选"
                value={filters.platform ?? ''}
                onChange={(v) => setFilters(f => ({ ...f, platform: v || undefined }))}
                options={PLATFORM_OPTIONS}
              />
              <Select
                style={{ width: 160 }}
                placeholder="类型筛选"
                value={filters.target_type ?? ''}
                onChange={(v) => setFilters(f => ({ ...f, target_type: v || undefined }))}
                options={TYPE_OPTIONS}
              />
              <Button onClick={fetchData} loading={loading} type="primary">刷新</Button>
            </Space>
          }>
      <Table<WatchTargetRowVM>
        size="small"
        rowKey={(r) => r.dedup_key}
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 20 }}
        locale={{ emptyText: <Empty description="暂无数据" /> }}
      />
    </Card>
  );
};

export default WatchTargetsList;
