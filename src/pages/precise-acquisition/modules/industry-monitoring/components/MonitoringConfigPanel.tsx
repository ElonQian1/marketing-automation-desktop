/**
 * 行业监控配置组件
 * 包含关键词设置、地域筛选、时间范围、查重规则等配置
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Button,
  Space,
  Row,
  Col,
  Typography,
  Tag,
  Tooltip,
  Divider,
  Alert,
  Badge
} from 'antd';
import {
  SettingOutlined,
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  FilterOutlined,
  BulbOutlined
} from '@ant-design/icons';
import type { Device } from '../../../../../domain/adb/entities/Device';
import { monitoringService } from '../../../services/monitoringService';
import type { MonitoringTask } from '../../../services/monitoringService';
import type { EnhancedMonitoringTask } from '../types/enhancedTypes';
import { getTimeRangeRecommendations, formatTimeRange } from '../../../services/monitoringService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface MonitoringConfigPanelProps {
  onlineDevices: Device[];
  onTaskCreate: (task: MonitoringTask) => void;
  onTaskUpdate: (task: MonitoringTask) => void;
  editingTask?: MonitoringTask | null;
}

export const MonitoringConfigPanel: React.FC<MonitoringConfigPanelProps> = ({
  onlineDevices,
  onTaskCreate,
  onTaskUpdate,
  editingTask
}) => {
  const [form] = Form.useForm();
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>(editingTask?.keywords || []);
  const [loading, setLoading] = useState(false);
  const [timeRecommendation, setTimeRecommendation] = useState<{
    recommended: number;
    explanation: string;
    alternatives: Array<{ value: number; label: string; reason: string }>;
  } | null>(null);

  // 地域选项
  const regionOptions = monitoringService.getRegionOptions();

  // 当关键词变化时，更新时间范围建议
  useEffect(() => {
    if (keywords.length > 0) {
      const recommendation = getTimeRangeRecommendations('industry', keywords);
      setTimeRecommendation(recommendation);
      
      // 如果是新任务且没有设置时间范围，自动应用推荐值
      if (!editingTask && !form.getFieldValue('commentTimeRange')) {
        form.setFieldValue('commentTimeRange', recommendation.recommended);
      }
    }
  }, [keywords, editingTask, form]);

  // 添加关键词
  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      const newKeywords = [...keywords, keywordInput.trim()];
      setKeywords(newKeywords);
      setKeywordInput('');
      form.setFieldValue('keywords', newKeywords);
    }
  };

  // 删除关键词
  const handleRemoveKeyword = (keyword: string) => {
    const newKeywords = keywords.filter(k => k !== keyword);
    setKeywords(newKeywords);
    form.setFieldValue('keywords', newKeywords);
  };

  // 提交表单
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const taskConfig = {
        type: 'industry' as const,
        keywords,
        filters: {
          region: values.regions,
          commentTimeRange: values.commentTimeRange,
          onlyRecentTrending: values.onlyRecentTrending,
          excludeOldReplies: values.excludeOldReplies,
          minLikes: values.minLikes,
          minComments: values.minComments,
          minViews: values.minViews
        },
        assignedDevices: values.assignedDevices
      };

      if (editingTask) {
        await monitoringService.updateTask(editingTask.id, taskConfig);
        onTaskUpdate({ ...editingTask, ...taskConfig });
      } else {
        const newTask = await monitoringService.createTask(taskConfig);
        onTaskCreate(newTask);
      }

      if (!editingTask) {
        form.resetFields();
        setKeywords([]);
      }
    } catch (error) {
      console.error('保存监控任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center space-x-2 mb-4">
        <SettingOutlined className="text-blue-500" />
        <Title level={4} className="m-0">
          {editingTask ? '编辑监控任务' : '创建行业监控任务'}
        </Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          commentTimeRange: (editingTask as any)?.filters?.commentTimeRange || 7,
          onlyRecentTrending: (editingTask as any)?.filters?.onlyRecentTrending || false,
          excludeOldReplies: (editingTask as any)?.filters?.excludeOldReplies || false,
          minLikes: (editingTask as any)?.filters?.minLikes || 0,
          minComments: (editingTask as any)?.filters?.minComments || 0,
          minViews: (editingTask as any)?.filters?.minViews || 0,
          regions: (editingTask as any)?.filters?.region || [],
          assignedDevices: (editingTask as any)?.assignedDevices || []
        }}
      >
        {/* 关键词设置 */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item
              label={
                <span className="flex items-center space-x-1">
                  <span>监控关键词</span>
                  <Tooltip title="输入行业相关关键词，系统将搜索包含这些关键词的内容和评论">
                    <InfoCircleOutlined className="text-gray-400" />
                  </Tooltip>
                </span>
              }
              required
            >
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    placeholder="输入关键词，如：B2B营销、产品管理、数字化转型"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onPressEnter={handleAddKeyword}
                  />
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={handleAddKeyword}
                    disabled={!keywordInput.trim()}
                  >
                    添加
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {keywords.map(keyword => (
                    <Tag
                      key={keyword}
                      closable
                      onClose={() => handleRemoveKeyword(keyword)}
                      color="blue"
                    >
                      {keyword}
                    </Tag>
                  ))}
                </div>
                {keywords.length === 0 && (
                  <Text type="secondary" className="text-sm">
                    请至少添加一个关键词
                  </Text>
                )}
              </div>
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        {/* 筛选条件 */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Title level={5} className="flex items-center space-x-2">
              <FilterOutlined className="text-green-500" />
              <span>筛选条件</span>
            </Title>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="commentTimeRange"
              label={
                <span className="flex items-center space-x-1">
                  <span>评论时间筛选</span>
                  <Tooltip title="只监控指定时间范围内的评论，提高回复的时效性和相关性">
                    <InfoCircleOutlined className="text-gray-400" />
                  </Tooltip>
                </span>
              }
            >
              <Select
                placeholder="选择评论时间范围"
                className="w-full"
                showSearch={false}
              >
                <Option value={1}>最近 1 天内</Option>
                <Option value={3}>最近 3 天内</Option>
                <Option value={7}>最近 1 周内</Option>
                <Option value={14}>最近 2 周内</Option>
                <Option value={30}>最近 1 个月内</Option>
                <Option value={90}>最近 3 个月内</Option>
                <Option value={180}>最近 6 个月内</Option>
                <Option value={365}>最近 1 年内</Option>
                <Option value={0}>不限制时间</Option>
              </Select>
            </Form.Item>
            
            {/* 时间范围智能建议 */}
            <div className="text-xs text-gray-500 mt-1 space-y-1">
              <div>💡 <Text className="text-xs">智能建议：</Text></div>
              <div className="ml-4 space-y-0.5">
                <div>• <strong>1-3天</strong>：热点事件追踪，快速响应</div>
                <div>• <strong>1-2周</strong>：常规行业监控，平衡时效性</div>
                <div>• <strong>1-3月</strong>：长期趋势分析，深度挖掘</div>
              </div>
              
              {/* 基于关键词的智能推荐 */}
              {timeRecommendation && keywords.length > 0 && (
                <div className="mt-3 p-2 bg-blue-50 rounded border">
                  <div className="flex items-center space-x-1 mb-1">
                    <BulbOutlined className="text-blue-500" />
                    <Text className="text-xs font-medium text-blue-700">
                      基于您的关键词推荐
                    </Text>
                  </div>
                  <div className="text-xs text-blue-600 mb-2">
                    {timeRecommendation.explanation}
                  </div>
                  <Button
                    size="small"
                    type="link"
                    className="p-0 h-auto text-xs"
                    onClick={() => form.setFieldValue('commentTimeRange', timeRecommendation.recommended)}
                  >
                    应用推荐值：{formatTimeRange(timeRecommendation.recommended)}
                  </Button>
                </div>
              )}
            </div>
          </Col>

          {/* 高级时间筛选选项 */}
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <span className="flex items-center space-x-1">
                  <span>智能时间筛选</span>
                  <Tooltip title="启用智能算法，优先推荐热门且时效性强的评论">
                    <InfoCircleOutlined className="text-gray-400" />
                  </Tooltip>
                </span>
              }
            >
              <div className="space-y-2">
                <Form.Item 
                  name="onlyRecentTrending" 
                  valuePropName="checked" 
                  className="mb-1"
                >
                  <Switch size="small" />
                  <span className="ml-2 text-sm">仅热门评论</span>
                  <Tooltip title="只选择有一定互动量的评论，提高转化率">
                    <InfoCircleOutlined className="ml-1 text-gray-400" />
                  </Tooltip>
                </Form.Item>
                
                <Form.Item 
                  name="excludeOldReplies" 
                  valuePropName="checked" 
                  className="mb-0"
                >
                  <Switch size="small" />
                  <span className="ml-2 text-sm">排除冷门旧评论</span>
                  <Tooltip title="自动过滤掉互动较少的陈旧评论">
                    <InfoCircleOutlined className="ml-1 text-gray-400" />
                  </Tooltip>
                </Form.Item>
              </div>
            </Form.Item>
          </Col>

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

          <Col xs={24} md={8}>
            <Form.Item
              name="minLikes"
              label="最小点赞数"
            >
              <InputNumber
                min={0}
                placeholder="0"
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
                placeholder="0"
                className="w-full"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="minViews"
              label="最小浏览量"
            >
              <InputNumber
                min={0}
                placeholder="0"
                className="w-full"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        {/* 设备分配 */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item
              name="assignedDevices"
              label={
                <span className="flex items-center space-x-1">
                  <span>执行设备</span>
                  <Tooltip title="选择执行监控任务的设备，不同设备将自动避免重复操作">
                    <InfoCircleOutlined className="text-gray-400" />
                  </Tooltip>
                </span>
              }
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

        {/* 查重提示 */}
        <Alert
          message="自动查重保护"
          description="系统将自动检测并避免同一设备在24小时内对同一用户重复关注，或对同一评论重复回复，确保操作的合理性和安全性。"
          type="info"
          showIcon
          className="mb-4"
        />

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-2">
          <Button onClick={() => form.resetFields()}>
            重置
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={keywords.length === 0 || onlineDevices.length === 0}
          >
            {editingTask ? '更新任务' : '创建任务'}
          </Button>
        </div>

        {onlineDevices.length === 0 && (
          <Alert
            message="无可用设备"
            description="当前没有在线设备，请先连接设备后再创建监控任务。"
            type="warning"
            showIcon
            className="mt-4"
          />
        )}
      </Form>
    </Card>
  );
};