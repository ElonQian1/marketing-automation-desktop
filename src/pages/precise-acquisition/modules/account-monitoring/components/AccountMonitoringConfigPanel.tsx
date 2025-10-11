// src/pages/precise-acquisition/modules/account-monitoring/components/AccountMonitoringConfigPanel.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 账号/视频监控配置组件
 * 支持用户自主添加监控账号或视频，基于数据指标推送监控提醒
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Space,
  Row,
  Col,
  Typography,
  Tag,
  Tooltip,
  Divider,
  Alert,
  Tabs,
  Table,
  Switch,
  Modal,
  Badge,
  Statistic,
  Progress
} from 'antd';
import {
  UserOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  FilterOutlined,
  BellOutlined,
  BarChartOutlined,
  EyeOutlined,
  HeartOutlined,
  MessageOutlined,
  LinkOutlined
} from '@ant-design/icons';
import type { Device } from '../../../../../domain/adb/entities/Device';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

export interface AccountData {
  id: string;
  name: string;
  url: string;
  type: 'account' | 'video';
  stats: {
    followers?: number;
    likes: number;
    comments: number;
    views: number;
    lastUpdate: string;
  };
  monitoringStatus: 'active' | 'paused' | 'pending';
  thresholds: {
    minLikes: number;
    minComments: number;
    minViews: number;
    growthRate: number; // 增长率阈值
  };
}

export interface RecommendedAccount {
  id: string;
  name: string;
  url: string;
  type: 'account' | 'video';
  reason: string;
  stats: {
    followers?: number;
    likes: number;
    comments: number;
    views: number;
  };
  trending: boolean;
  score: number; // 推荐分数
}

interface AccountMonitoringConfigPanelProps {
  onlineDevices: Device[];
  onAddMonitoring: (config: any) => void;
}

export const AccountMonitoringConfigPanel: React.FC<AccountMonitoringConfigPanelProps> = ({
  onlineDevices,
  onAddMonitoring
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('manual');
  const [loading, setLoading] = useState(false);
  const [monitoredAccounts, setMonitoredAccounts] = useState<AccountData[]>([]);
  const [recommendedAccounts, setRecommendedAccounts] = useState<RecommendedAccount[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountData | null>(null);

  // 模拟推荐数据
  useEffect(() => {
    // 这里应该调用后端API获取推荐账号
    setRecommendedAccounts([
      {
        id: 'rec_1',
        name: '行业专家张三',
        url: 'https://xiaohongshu.com/user/12345',
        type: 'account',
        reason: '近期发布内容热度高涨，新增粉丝增长200%',
        stats: {
          followers: 50000,
          likes: 1200,
          comments: 89,
          views: 15000
        },
        trending: true,
        score: 95
      },
      {
        id: 'rec_2',
        name: '热门产品评测视频',
        url: 'https://xiaohongshu.com/video/67890',
        type: 'video',
        reason: '相关产品视频，评论区活跃度极高',
        stats: {
          likes: 2500,
          comments: 456,
          views: 80000
        },
        trending: true,
        score: 88
      }
    ]);
  }, []);

  // 推荐账号表格列定义
  const recommendedColumns: ColumnsType<RecommendedAccount> = [
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      render: (type) => (
        <Tag color={type === 'account' ? 'blue' : 'green'}>
          {type === 'account' ? (
            <><UserOutlined /> 账号</>
          ) : (
            <><PlayCircleOutlined /> 视频</>
          )}
        </Tag>
      )
    },
    {
      title: '名称/标题',
      dataIndex: 'name',
      ellipsis: true,
      render: (name, record) => (
        <div>
          <div className="font-medium">{name}</div>
          <Text type="secondary" className="text-xs">
            推荐分数: {record.score}
          </Text>
        </div>
      )
    },
    {
      title: '数据指标',
      key: 'stats',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="浏览量">
            <Badge count={record.stats.views} overflowCount={999999} showZero color="blue" />
            <EyeOutlined className="ml-1 text-gray-400" />
          </Tooltip>
          <Tooltip title="点赞数">
            <Badge count={record.stats.likes} overflowCount={9999} showZero color="red" />
            <HeartOutlined className="ml-1 text-gray-400" />
          </Tooltip>
          <Tooltip title="评论数">
            <Badge count={record.stats.comments} overflowCount={999} showZero color="green" />
            <MessageOutlined className="ml-1 text-gray-400" />
          </Tooltip>
        </Space>
      )
    },
    {
      title: '推荐原因',
      dataIndex: 'reason',
      ellipsis: true,
      render: (reason, record) => (
        <div>
          <Text className="text-sm">{reason}</Text>
          {record.trending && (
            <Tag color="orange" className="ml-1 text-xs">
              <BellOutlined /> 热门
            </Tag>
          )}
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => handleAddRecommended(record)}
          >
            加入监控
          </Button>
          <Button
            size="small"
            onClick={() => handleIgnoreRecommended(record.id)}
          >
            忽略
          </Button>
        </Space>
      )
    }
  ];

  // 监控账号表格列定义
  const monitoredColumns: ColumnsType<AccountData> = [
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      render: (type) => (
        <Tag color={type === 'account' ? 'blue' : 'green'}>
          {type === 'account' ? (
            <><UserOutlined /> 账号</>
          ) : (
            <><PlayCircleOutlined /> 视频</>
          )}
        </Tag>
      )
    },
    {
      title: '名称/标题',
      dataIndex: 'name',
      ellipsis: true,
      render: (name, record) => (
        <div>
          <div className="font-medium">{name}</div>
          <Button
            type="link"
            size="small"
            icon={<LinkOutlined />}
            onClick={() => window.open(record.url)}
            className="p-0 text-xs"
          >
            查看链接
          </Button>
        </div>
      )
    },
    {
      title: '监控状态',
      dataIndex: 'monitoringStatus',
      render: (status) => {
        const statusMap = {
          active: { color: 'green', text: '监控中' },
          paused: { color: 'orange', text: '已暂停' },
          pending: { color: 'blue', text: '等待中' }
        };
        const config = statusMap[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '当前数据',
      key: 'currentStats',
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex space-x-2 text-xs">
            <span>👀 {record.stats.views.toLocaleString()}</span>
            <span>❤️ {record.stats.likes.toLocaleString()}</span>
            <span>💬 {record.stats.comments}</span>
          </div>
          <Text type="secondary" className="text-xs">
            更新: {record.stats.lastUpdate}
          </Text>
        </div>
      )
    },
    {
      title: '阈值设置',
      key: 'thresholds',
      render: (_, record) => (
        <div className="text-xs space-y-1">
          <div>点赞≥{record.thresholds.minLikes}</div>
          <div>评论≥{record.thresholds.minComments}</div>
          <div>增长≥{record.thresholds.growthRate}%</div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={() => handleEditAccount(record)}
          >
            编辑
          </Button>
          <Button
            size="small"
            danger
            onClick={() => handleDeleteAccount(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  // 添加推荐账号到监控
  const handleAddRecommended = (recommended: RecommendedAccount) => {
    const newAccount: AccountData = {
      id: `monitor_${Date.now()}`,
      name: recommended.name,
      url: recommended.url,
      type: recommended.type,
      stats: {
        ...recommended.stats,
        lastUpdate: new Date().toLocaleString()
      },
      monitoringStatus: 'pending',
      thresholds: {
        minLikes: Math.max(10, Math.floor(recommended.stats.likes * 0.1)),
        minComments: Math.max(5, Math.floor(recommended.stats.comments * 0.1)),
        minViews: Math.max(100, Math.floor(recommended.stats.views * 0.1)),
        growthRate: 20
      }
    };

    setMonitoredAccounts(prev => [...prev, newAccount]);
    setRecommendedAccounts(prev => prev.filter(r => r.id !== recommended.id));
  };

  // 忽略推荐
  const handleIgnoreRecommended = (id: string) => {
    setRecommendedAccounts(prev => prev.filter(r => r.id !== id));
  };

  // 编辑监控账号
  const handleEditAccount = (account: AccountData) => {
    setEditingAccount(account);
    form.setFieldsValue({
      name: account.name,
      url: account.url,
      type: account.type,
      minLikes: account.thresholds.minLikes,
      minComments: account.thresholds.minComments,
      minViews: account.thresholds.minViews,
      growthRate: account.thresholds.growthRate
    });
    setAddModalVisible(true);
  };

  // 删除监控账号
  const handleDeleteAccount = (id: string) => {
    setMonitoredAccounts(prev => prev.filter(a => a.id !== id));
  };

  // 手动添加监控
  const handleManualAdd = async (values: any) => {
    setLoading(true);
    try {
      const newAccount: AccountData = {
        id: editingAccount?.id || `manual_${Date.now()}`,
        name: values.name,
        url: values.url,
        type: values.type,
        stats: {
          likes: 0,
          comments: 0,
          views: 0,
          lastUpdate: new Date().toLocaleString()
        },
        monitoringStatus: 'pending',
        thresholds: {
          minLikes: values.minLikes,
          minComments: values.minComments,
          minViews: values.minViews,
          growthRate: values.growthRate
        }
      };

      if (editingAccount) {
        setMonitoredAccounts(prev => prev.map(a => a.id === editingAccount.id ? newAccount : a));
      } else {
        setMonitoredAccounts(prev => [...prev, newAccount]);
      }

      setAddModalVisible(false);
      setEditingAccount(null);
      form.resetFields();
    } catch (error) {
      console.error('添加监控失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BarChartOutlined className="text-blue-500" />
            <Title level={4} className="m-0">账号/视频监控</Title>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingAccount(null);
              form.resetFields();
              setAddModalVisible(true);
            }}
          >
            手动添加监控
          </Button>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="智能推荐" key="recommended">
            <Alert
              message="智能监控推荐"
              description="基于浏览量、点赞量、评论量等数据指标，为您推荐值得监控的热门账号和视频。"
              type="info"
              showIcon
              className="mb-4"
            />
            
            <Table
              columns={recommendedColumns}
              dataSource={recommendedAccounts}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </TabPane>

          <TabPane 
            tab={
              <Badge count={monitoredAccounts.length} size="small">
                监控列表
              </Badge>
            } 
            key="monitoring"
          >
            <div className="mb-4">
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="监控中"
                    value={monitoredAccounts.filter(a => a.monitoringStatus === 'active').length}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="等待中"
                    value={monitoredAccounts.filter(a => a.monitoringStatus === 'pending').length}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="已暂停"
                    value={monitoredAccounts.filter(a => a.monitoringStatus === 'paused').length}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="总计"
                    value={monitoredAccounts.length}
                  />
                </Col>
              </Row>
            </div>

            <Table
              columns={monitoredColumns}
              dataSource={monitoredAccounts}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 手动添加/编辑监控模态框 */}
      <Modal
        title={editingAccount ? '编辑监控设置' : '添加监控目标'}
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          setEditingAccount(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleManualAdd}
          initialValues={{
            type: 'account',
            minLikes: 10,
            minComments: 5,
            minViews: 100,
            growthRate: 20
          }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="type"
                label="监控类型"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="account">
                    <UserOutlined /> 账号监控
                  </Option>
                  <Option value="video">
                    <PlayCircleOutlined /> 视频监控
                  </Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="name"
                label="名称/标题"
                rules={[{ required: true, message: '请输入名称或标题' }]}
              >
                <Input placeholder="输入账号名称或视频标题" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="url"
                label="链接地址"
                rules={[
                  { required: true, message: '请输入链接地址' },
                  { type: 'url', message: '请输入有效的URL地址' }
                ]}
              >
                <Input placeholder="https://xiaohongshu.com/..." />
              </Form.Item>
            </Col>
          </Row>

          <Divider>监控阈值设置</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="minLikes"
                label="最小点赞数"
                tooltip="当新增点赞数达到此阈值时触发提醒"
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="minComments"
                label="最小评论数"
                tooltip="当新增评论数达到此阈值时触发提醒"
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="minViews"
                label="最小浏览量"
                tooltip="当新增浏览量达到此阈值时触发提醒"
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="growthRate"
                label="增长率阈值 (%)"
                tooltip="当数据增长率超过此百分比时触发提醒"
              >
                <InputNumber min={0} max={1000} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => {
              setAddModalVisible(false);
              setEditingAccount(null);
              form.resetFields();
            }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingAccount ? '更新' : '添加'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};