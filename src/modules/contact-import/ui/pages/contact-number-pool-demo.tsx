// src/modules/contact-import/ui/pages/contact-number-pool-demo.tsx
// module: contact-import | layer: ui | role: demo-page
// summary: 号码池树形表格演示页面（可选）

import React, { useState, useEffect } from 'react';
import { Card, Space, Button, Switch, Typography, Divider } from 'antd';
import { ContactNumberTreeTable } from '../components/number-pool-table';
import { NumberPoolPanel } from '../components/resizable-layout/NumberPoolPanel';
import { listContactNumbers, ContactNumberDto } from '../services/contactNumberService';

const { Title, Text } = Typography;

/**
 * 号码池展示演示页面
 * 
 * 功能：
 * 1. 切换传统表格和树形表格视图
 * 2. 演示文件名分组展示
 * 3. 演示导入状态和设备信息显示
 */
export const ContactNumberPoolDemo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ContactNumberDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('tree');

  // 加载号码数据
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await listContactNumbers({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        search: search || undefined,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch (error) {
      console.error('加载号码失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, search]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // 重置到第一页
  };

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 页头 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3}>号码池管理</Title>
            <Space>
              <Text>视图模式：</Text>
              <Switch
                checked={viewMode === 'tree'}
                checkedChildren="树形视图"
                unCheckedChildren="表格视图"
                onChange={(checked) => setViewMode(checked ? 'tree' : 'table')}
              />
              <Button onClick={loadData}>刷新</Button>
            </Space>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          {/* 内容区域 */}
          <div style={{ minHeight: '600px' }}>
            {viewMode === 'tree' ? (
              <div>
                <Text type="secondary" style={{ marginBottom: '12px', display: 'block' }}>
                  📁 树形视图：按文件名分组显示，点击文件夹展开查看详情
                </Text>
                <ContactNumberTreeTable
                  loading={loading}
                  items={items}
                  total={total}
                  search={search}
                  onSearch={handleSearch}
                  onRefresh={loadData}
                />
              </div>
            ) : (
              <div>
                <Text type="secondary" style={{ marginBottom: '12px', display: 'block' }}>
                  📋 表格视图：传统列表展示方式
                </Text>
                <NumberPoolPanel
                  loading={loading}
                  items={items}
                  total={total}
                  page={page}
                  pageSize={pageSize}
                  search={search}
                  selectedRowKeys={selectedRowKeys}
                  onSearch={handleSearch}
                  onPageChange={handlePageChange}
                  onSelectedRowKeysChange={setSelectedRowKeys}
                  onRefresh={loadData}
                />
              </div>
            )}
          </div>

          {/* 说明信息 */}
          <Card size="small" style={{ background: '#f6f8fa' }}>
            <Title level={5}>功能说明</Title>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li><strong>树形视图</strong>：按文件名分组显示，适合查看文件来源</li>
              <li><strong>表格视图</strong>：传统列表方式，适合快速浏览和操作</li>
              <li><strong>状态标签</strong>：
                <ul>
                  <li>🟢 已导入 - 已成功导入到设备</li>
                  <li>🔵 已分配 - 已分配VCF批次但未导入</li>
                  <li>⚪ 未导入 - 尚未使用</li>
                </ul>
              </li>
              <li><strong>设备信息</strong>：显示导入到哪台设备（带设备图标）</li>
              <li><strong>批量操作</strong>：支持勾选多个文件或联系人进行批量处理</li>
            </ul>
          </Card>
        </Space>
      </Card>
    </div>
  );
};

export default ContactNumberPoolDemo;
