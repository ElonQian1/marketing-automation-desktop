/**
 * 账号监控配置组件
 * 支持手动添加监控账号或接受系统推荐
 */

import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Alert,
  Tag,
  List,
  Avatar,
  Tooltip,
  Modal,
  Select,
  InputNumber,
  Switch
} from 'antd';
import {
  UserAddOutlined,
  SearchOutlined,
  StarOutlined,
  EyeOutlined,
  HeartOutlined,
  MessageOutlined,
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { Device } from '../../../../domain/adb/entities/Device';
import { monitoringService } from '../../../services/monitoringService';
import type { MonitoringTask } from '../../../services/monitoringService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface AccountMonitoringConfigProps {
  onlineDevices: Device[];
  onTaskCreate: (task: MonitoringTask) => void;
  editingTask?: MonitoringTask | null;
}

interface RecommendedAccount {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  followers: number;
  posts: number;
  avgLikes: number;
  avgComments: number;
  reason: string;
  industry: string;
  platform: 'xiaohongshu' | 'douyin';
}

export const AccountMonitoringConfig: React.FC<AccountMonitoringConfigProps> = ({
  onlineDevices,
  onTaskCreate,
  editingTask
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<RecommendedAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [recommendedVisible, setRecommendedVisible] = useState(false);

  // 模拟推荐账号数据
  const mockRecommendedAccounts: RecommendedAccount[] = [
    {
      id: 'user_rec_1',
      username: 'b2b_expert_2024',
      nickname: 'B2B营销专家小李',
      avatar: '',
      followers: 15600,
      posts: 89,
      avgLikes: 245,
      avgComments: 32,
      reason: '发布内容与您的关键词高度匹配，粉丝活跃度高',
      industry: 'B2B营销',
      platform: 'xiaohongshu'
    },
    {
      id: 'user_rec_2',
      username: 'saas_growth_guru',
      nickname: 'SaaS增长大师',
      avatar: '',
      followers: 23400,
      posts: 156,
      avgLikes: 387,
      avgComments: 56,
      reason: '企业服务领域KOL，评论区经常有潜在客户咨询',
      industry: '企业服务',
      platform: 'xiaohongshu'
    },
    {
      id: 'user_rec_3',
      username: 'digital_transform',
      nickname: '数字化转型顾问',
      avatar: '',
      followers: 8900,
      posts: 234,
      avgLikes: 156,
      avgComments: 28,
      reason: '内容垂直度高，互动用户多为企业决策者',
      industry: '数字化转型',
      platform: 'douyin'
    }
  ];

  // 搜索账号
  const handleSearchAccount = async (values: any) => {
    setSearchLoading(true);
    try {
      // 模拟搜索延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟搜索结果
      const mockResults = mockRecommendedAccounts.filter(account => 
        account.username.includes(values.searchKeyword) ||
        account.nickname.includes(values.searchKeyword) ||
        account.industry.includes(values.searchKeyword)
      );
      
      setSearchResults(mockResults.slice(0, 10));
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // 查看推荐账号
  const handleViewRecommended = () => {
    setSearchResults(mockRecommendedAccounts);
    setRecommendedVisible(true);
  };

  // 选择账号
  const handleSelectAccount = (accountId: string) => {
    setSelectedAccounts(prev => {
      if (prev.includes(accountId)) {
        return prev.filter(id => id !== accountId);
      } else {
        return [...prev, accountId];
      }
    });
  };

  // 添加选中账号到监控
  const handleAddSelectedAccounts = () => {
    const selected = searchResults.filter(account => 
      selectedAccounts.includes(account.id)
    );
    
    // 将选中账号添加到表单
    const currentTargets = form.getFieldValue('monitorTargets') || [];
    const newTargets = selected.map(account => ({
      type: 'account',
      value: account.username,
      platform: account.platform,
      nickname: account.nickname
    }));
    
    form.setFieldValue('monitorTargets', [...currentTargets, ...newTargets]);
    setSelectedAccounts([]);
    setRecommendedVisible(false);
  };

  // 提交表单
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const taskConfig = {
        type: 'account' as const,
        targetAccount: values.monitorTargets?.[0]?.value, // 简化处理，实际可支持多账号
        filters: {
          commentTimeRange: values.commentTimeRange,
          minLikes: values.minLikes,
          minComments: values.minComments,
          region: values.regions
        },
        assignedDevices: values.assignedDevices
      };

      const newTask = await monitoringService.createTask(taskConfig);
      onTaskCreate(newTask);
      
      form.resetFields();
    } catch (error) {
      console.error('创建监控任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 地域选项
  const regionOptions = monitoringService.getRegionOptions();

  return (
    <>
      <Card>
        <div className="flex items-center space-x-2 mb-4">
          <UserAddOutlined className="text-purple-500" />
          <Title level={4} className="m-0">账号监控设置</Title>
        </div>

        {/* 智能推荐 */}
        <Alert
          message="智能推荐"
          description="基于您的行业关键词和历史数据，我们为您推荐了一些高价值的监控账号"
          type="info"
          showIcon
          action={
            <Button size="small" onClick={handleViewRecommended}>
              查看推荐
            </Button>
          }
          className="mb-4"
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            commentTimeRange: 7,
            minLikes: 5,
            minComments: 2
          }}
        >
          {/* 搜索和添加账号 */}
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item
                label={
                  <span className="flex items-center space-x-1">
                    <span>搜索监控账号</span>
                    <Tooltip title="输入账号用户名、昵称或相关关键词进行搜索">
                      <InfoCircleOutlined className="text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <div className="flex space-x-2">
                  <Input
                    placeholder="输入用户名、昵称或关键词"
                    onPressEnter={(e) => handleSearchAccount({ searchKeyword: (e.target as HTMLInputElement).value })}
                  />
                  <Button
                    icon={<SearchOutlined />}
                    loading={searchLoading}
                    onClick={() => {
                      const input = document.querySelector('input[placeholder*="用户名"]') as HTMLInputElement;
                      if (input?.value) {
                        handleSearchAccount({ searchKeyword: input.value });
                      }
                    }}
                  >
                    搜索
                  </Button>
                  <Button
                    icon={<StarOutlined />}
                    onClick={handleViewRecommended}
                  >
                    查看推荐
                  </Button>
                </div>
              </Form.Item>
            </Col>
          </Row>

          {/* 监控目标列表 */}
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item
                name="monitorTargets"
                label="监控目标"
                rules={[{ required: true, message: '请至少添加一个监控目标' }]}
              >
                <div className="border rounded p-4 min-h-20">
                  <Text type="secondary" className="text-sm">
                    已添加的监控目标将显示在这里。您可以通过上方搜索功能添加账号。
                  </Text>
                  {/* 这里会动态显示已添加的账号 */}
                </div>
              </Form.Item>
            </Col>
          </Row>

          {/* 筛选条件 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                name="commentTimeRange"
                label="评论时间范围"
              >
                <InputNumber
                  min={1}
                  max={365}
                  addonAfter="天内"
                  className="w-full"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="minLikes"
                label="最小点赞数"
              >
                <InputNumber
                  min={0}
                  className="w-full"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="minComments"
                label="最小评论数"
              >
                <InputNumber
                  min={0}
                  className="w-full"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="regions"
                label="目标地域"
              >
                <Select
                  mode="multiple"
                  placeholder="选择目标地域（不选择表示不限制）"
                  allowClear
                >
                  {regionOptions.map(region => (
                    <Option key={region.value} value={region.value}>
                      {region.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="assignedDevices"
                label="执行设备"
                rules={[{ required: true, message: '请至少选择一个执行设备' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="选择执行设备"
                  disabled={onlineDevices.length === 0}
                >
                  {onlineDevices.map(device => (
                    <Option key={device.id} value={device.id}>
                      {device.name || device.id} ({device.model})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-2">
            <Button onClick={() => form.resetFields()}>
              重置
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={onlineDevices.length === 0}
            >
              创建监控任务
            </Button>
          </div>
        </Form>
      </Card>

      {/* 推荐账号弹框 */}
      <Modal
        title="推荐监控账号"
        open={recommendedVisible}
        onCancel={() => setRecommendedVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setRecommendedVisible(false)}>
            取消
          </Button>,
          <Button
            key="add"
            type="primary"
            disabled={selectedAccounts.length === 0}
            onClick={handleAddSelectedAccounts}
          >
            添加选中账号 ({selectedAccounts.length})
          </Button>
        ]}
      >
        <List
          itemLayout="horizontal"
          dataSource={searchResults}
          renderItem={(account) => {
            const isSelected = selectedAccounts.includes(account.id);
            return (
              <List.Item
                className={`cursor-pointer p-3 rounded transition-colors ${
                  isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleSelectAccount(account.id)}
                actions={[
                  <Button
                    key="select"
                    type={isSelected ? 'primary' : 'default'}
                    size="small"
                    icon={isSelected ? <DeleteOutlined /> : <PlusOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAccount(account.id);
                    }}
                  >
                    {isSelected ? '取消' : '选择'}
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserAddOutlined />} />}
                  title={
                    <div className="flex items-center space-x-2">
                      <span>{account.nickname}</span>
                      <Text type="secondary" className="text-sm">@{account.username}</Text>
                      <Tag color={account.platform === 'xiaohongshu' ? 'red' : 'black'}>
                        {account.platform === 'xiaohongshu' ? '小红书' : '抖音'}
                      </Tag>
                      <Tag color="blue">{account.industry}</Tag>
                    </div>
                  }
                  description={
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <UserAddOutlined />
                          <span>{account.followers.toLocaleString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <EyeOutlined />
                          <span>{account.posts}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <HeartOutlined />
                          <span>平均{account.avgLikes}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageOutlined />
                          <span>平均{account.avgComments}</span>
                        </span>
                      </div>
                      <Text className="text-sm">{account.reason}</Text>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Modal>
    </>
  );
};