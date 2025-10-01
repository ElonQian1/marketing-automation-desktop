// 文件路径：src/pages/BrandShowcasePage.tsx

/**
 * 品牌化展示页面 - 重构成果演示
 * 
 * 这个页面展示了完整的品牌化重构成果：
 * - Layout + Patterns + UI + Adapters 的完整组合
 * - 统一的设计令牌和动效
 * - 现代化的商业风格
 * 
 * 仅负责页面编排，不包含任何视觉硬编码
 */

import React, { useState } from 'react';
import { Space, message } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, MoreOutlined } from '@ant-design/icons';

// Layout 组件
import { PageShell } from '@/components/layout/PageShell';

// UI 轻组件
import { 
  Button, 
  CardShell, 
  CardHeader, 
  CardContent, 
  TagPill,
  SmartDialog,
  DialogTrigger,
  DialogClose,
  DialogActions
} from '@/components/ui';

// Motion 组件
import { 
  FadeIn, 
  SlideIn, 
  AnimatedList, 
  HoverScale, 
  HoverLift 
} from '@/components/ui/motion/MotionSystem';

// Patterns 组件
import { FilterBar } from '@/components/patterns';

// Adapters
import { AntTableAdapter } from '@/components/adapters';

// 示例数据
const mockData = [
  { 
    key: '1', 
    name: '张三', 
    email: 'zhangsan@example.com',
    status: 'active',
    role: 'admin',
    createdAt: '2024-01-15',
  },
  { 
    key: '2', 
    name: '李四', 
    email: 'lisi@example.com',
    status: 'disabled',
    role: 'user',
    createdAt: '2024-01-20',
  },
  { 
    key: '3', 
    name: '王五', 
    email: 'wangwu@example.com',
    status: 'active',
    role: 'moderator',
    createdAt: '2024-01-25',
  },
];

const BrandShowcasePage: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 表格列定义
  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <span className="font-medium text-text-primary">{text}</span>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (text: string) => (
        <span className="text-text-secondary">{text}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <TagPill 
          variant={status === 'active' ? 'success' : 'error'}
          size="sm"
        >
          {status === 'active' ? '正常' : '禁用'}
        </TagPill>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleMap = {
          admin: { text: '管理员', variant: 'primary' as const },
          moderator: { text: '版主', variant: 'info' as const },
          user: { text: '用户', variant: 'default' as const },
        };
        const roleInfo = roleMap[role as keyof typeof roleMap];
        return (
          <TagPill variant={roleInfo.variant} size="sm">
            {roleInfo.text}
          </TagPill>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => (
        <span className="text-text-tertiary">{text}</span>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedUser(record);
              setDialogOpen(true);
            }}
          >
            查看
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => message.info(`编辑 ${record.name}`)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  // 筛选配置
  const filterConfig = [
    {
      key: 'status',
      label: '状态',
      type: 'select' as const,
      options: [
        { label: '全部', value: '' },
        { label: '正常', value: 'active' },
        { label: '禁用', value: 'disabled' },
      ],
    },
    {
      key: 'role',
      label: '角色',
      type: 'select' as const,
      options: [
        { label: '全部', value: '' },
        { label: '管理员', value: 'admin' },
        { label: '版主', value: 'moderator' },
        { label: '用户', value: 'user' },
      ],
    },
  ];

  // 统计数据
  const stats = [
    { label: '总用户数', value: '1,234', change: '+12%', positive: true },
    { label: '活跃用户', value: '987', change: '+5.7%', positive: true },
    { label: '新增用户', value: '45', change: '-2.1%', positive: false },
    { label: '转化率', value: '23.4%', change: '+8.9%', positive: true },
  ];

  return (
    <PageShell
      title="用户管理"
      description="品牌化重构演示页面 - Layout + Patterns + UI + Adapters 完整组合"
      actions={
        <Space>
          <Button variant="ghost" size="default">
            导出数据
          </Button>
          <Button variant="primary" size="default" leftIcon={<PlusOutlined />}>
            添加用户
          </Button>
        </Space>
      }
    >
      <div className="space-y-6">
        {/* 统计卡片区域 */}
        <AnimatedList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <HoverLift key={stat.label}>
              <CardShell variant="elevated" size="default">
                <CardContent className="text-center">
                  <div className="text-2xl font-bold text-text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-text-secondary mb-2">
                    {stat.label}
                  </div>
                  <TagPill 
                    variant={stat.positive ? 'success' : 'error'}
                    size="sm"
                  >
                    {stat.change}
                  </TagPill>
                </CardContent>
              </CardShell>
            </HoverLift>
          ))}
        </AnimatedList>

        {/* 筛选栏 */}
        <SlideIn direction="up" delay={0.2}>
          <FilterBar
            searchPlaceholder="搜索用户姓名或邮箱..."
            filters={filterConfig}
            onSearch={(value) => console.log('搜索：', value)}
            onFilterChange={(filters) => console.log('筛选：', filters)}
            extra={
              <Button variant="ghost" leftIcon={<MoreOutlined />}>
                更多操作
              </Button>
            }
          />
        </SlideIn>

        {/* 数据表格 */}
        <FadeIn delay={0.3}>
          <AntTableAdapter
            columns={columns}
            dataSource={mockData}
            title="用户列表"
            description="系统中所有用户的详细信息"
            branded={true}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条数据`,
            }}
          />
        </FadeIn>

        {/* 用户详情对话框 */}
        <SmartDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="用户详情"
          description="查看用户的详细信息"
          size="lg"
        >
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary">
                    姓名
                  </label>
                  <div className="text-text-primary">{selectedUser.name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">
                    邮箱
                  </label>
                  <div className="text-text-primary">{selectedUser.email}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">
                    状态
                  </label>
                  <div>
                    <TagPill 
                      variant={selectedUser.status === 'active' ? 'success' : 'error'}
                    >
                      {selectedUser.status === 'active' ? '正常' : '禁用'}
                    </TagPill>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">
                    角色
                  </label>
                  <div className="text-text-primary">{selectedUser.role}</div>
                </div>
              </div>
            </div>
          )}

          <DialogActions align="right">
            <DialogClose asChild>
              <Button variant="ghost">关闭</Button>
            </DialogClose>
            <Button 
              variant="primary"
              onClick={() => {
                message.success('用户信息已更新');
                setDialogOpen(false);
              }}
            >
              保存修改
            </Button>
          </DialogActions>
        </SmartDialog>
      </div>
    </PageShell>
  );
};

export default BrandShowcasePage;