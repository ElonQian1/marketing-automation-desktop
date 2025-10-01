/**
 * 简化版数据筛选增强组件
 * 基于浏览量、点赞量、评论量等指标实现智能推荐和筛选
 */

import React, { useState } from 'react';
import {
  Card,
  Form,
  InputNumber,
  Select,
  Switch,
  Button,
  Row,
  Col,
  Typography,
  Tooltip,
  Alert,
  Tag,
  Statistic
} from 'antd';
import {
  FilterOutlined,
  BulbOutlined,
  InfoCircleOutlined,
  FireOutlined,
  StarOutlined,
  RiseOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

export interface DataFilter {
  minViews: number;
  maxViews: number;
  minLikes: number;
  maxLikes: number;
  minComments: number;
  maxComments: number;
  minEngagementRate: number;
  timeRange: number;
  hotOnly: boolean;
  trendingOnly: boolean;
}

export interface SmartRecommendation {
  type: 'hot' | 'trending' | 'quality' | 'potential';
  title: string;
  description: string;
  filters: Partial<DataFilter>;
  score: number;
  icon: React.ReactNode;
  color: string;
}

interface DataFilterEnhancementProps {
  onFilterChange: (filters: DataFilter) => void;
  initialFilters?: Partial<DataFilter>;
}

export const DataFilterEnhancement: React.FC<DataFilterEnhancementProps> = ({
  onFilterChange,
  initialFilters = {}
}) => {
  const [form] = Form.useForm();
  const [currentFilters, setCurrentFilters] = useState<DataFilter>({
    minViews: 1000,
    maxViews: 1000000,
    minLikes: 10,
    maxLikes: 10000,
    minComments: 5,
    maxComments: 1000,
    minEngagementRate: 2,
    timeRange: 24,
    hotOnly: false,
    trendingOnly: false,
    ...initialFilters
  });

  // 智能推荐策略
  const smartRecommendations: SmartRecommendation[] = [
    {
      type: 'hot',
      title: '热门爆款',
      description: '高浏览高互动内容',
      filters: {
        minViews: 50000,
        minLikes: 500,
        minComments: 50,
        hotOnly: true,
        timeRange: 24
      },
      score: 95,
      icon: <FireOutlined />,
      color: 'red'
    },
    {
      type: 'trending',
      title: '趋势上升',
      description: '增长迅速的内容',
      filters: {
        minViews: 10000,
        minLikes: 100,
        minComments: 20,
        trendingOnly: true,
        timeRange: 12
      },
      score: 88,
      icon: <RiseOutlined />,
      color: 'orange'
    },
    {
      type: 'quality',
      title: '高质量',
      description: '优质认可内容',
      filters: {
        minViews: 5000,
        minLikes: 100,
        minComments: 15,
        minEngagementRate: 3,
        timeRange: 48
      },
      score: 82,
      icon: <StarOutlined />,
      color: 'gold'
    },
    {
      type: 'potential',
      title: '潜力内容',
      description: '竞争较小有潜力',
      filters: {
        minViews: 2000,
        maxViews: 20000,
        minLikes: 20,
        maxLikes: 200,
        minComments: 5,
        maxComments: 50,
        timeRange: 72
      },
      score: 75,
      icon: <BulbOutlined />,
      color: 'blue'
    }
  ];

  // 应用推荐筛选
  const applyRecommendation = (recommendation: SmartRecommendation) => {
    const newFilters = { ...currentFilters, ...recommendation.filters };
    setCurrentFilters(newFilters);
    form.setFieldsValue(newFilters);
    onFilterChange(newFilters);
  };

  // 处理筛选变化
  const handleFilterChange = (changedValues: any, allValues: DataFilter) => {
    setCurrentFilters(allValues);
    onFilterChange(allValues);
  };

  return (
    <div className="space-y-6">
      {/* 智能推荐 */}
      <Card title={
        <div className="flex items-center space-x-2">
          <BulbOutlined className="text-blue-500" />
          <span>智能筛选推荐</span>
        </div>
      }>
        <Row gutter={[16, 16]}>
          {smartRecommendations.map(rec => (
            <Col xs={24} sm={12} md={6} key={rec.type}>
              <Card
                size="small"
                hoverable
                className="cursor-pointer"
                onClick={() => applyRecommendation(rec)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Tag color={rec.color} icon={rec.icon}>
                      {rec.title}
                    </Tag>
                    <Text className="text-xs">{rec.score}</Text>
                  </div>
                  <Text className="text-xs text-gray-600">{rec.description}</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 筛选配置 */}
      <Card title={
        <div className="flex items-center space-x-2">
          <FilterOutlined className="text-green-500" />
          <span>数据筛选配置</span>
        </div>
      }>
        <Form
          form={form}
          layout="vertical"
          initialValues={currentFilters}
          onValuesChange={handleFilterChange}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                name="minViews"
                label={
                  <span className="flex items-center space-x-1">
                    <span>最小浏览量</span>
                    <Tooltip title="设置内容的最小浏览量要求">
                      <InfoCircleOutlined className="text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="minLikes"
                label={
                  <span className="flex items-center space-x-1">
                    <span>最小点赞数</span>
                    <Tooltip title="设置内容的最小点赞数要求">
                      <InfoCircleOutlined className="text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="minComments"
                label={
                  <span className="flex items-center space-x-1">
                    <span>最小评论数</span>
                    <Tooltip title="设置内容的最小评论数要求">
                      <InfoCircleOutlined className="text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="minEngagementRate"
                label={
                  <span className="flex items-center space-x-1">
                    <span>最小互动率(%)</span>
                    <Tooltip title="互动率 = (点赞+评论*3)/浏览量*100">
                      <InfoCircleOutlined className="text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <InputNumber min={0} max={100} step={0.1} className="w-full" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="timeRange"
                label={
                  <span className="flex items-center space-x-1">
                    <span>时间范围</span>
                    <Tooltip title="仅筛选指定时间内的内容">
                      <InfoCircleOutlined className="text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <Select>
                  <Option value={1}>最近 1 小时</Option>
                  <Option value={6}>最近 6 小时</Option>
                  <Option value={12}>最近 12 小时</Option>
                  <Option value={24}>最近 24 小时</Option>
                  <Option value={48}>最近 2 天</Option>
                  <Option value={168}>最近 7 天</Option>
                  <Option value={0}>不限制</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <div className="space-y-4">
                <Form.Item name="hotOnly" valuePropName="checked" className="mb-2">
                  <Switch />
                  <span className="ml-2">仅热门内容</span>
                </Form.Item>

                <Form.Item name="trendingOnly" valuePropName="checked" className="mb-0">
                  <Switch />
                  <span className="ml-2">仅趋势内容</span>
                </Form.Item>
              </div>
            </Col>
          </Row>

          {/* 当前配置摘要 */}
          <Alert
            message="当前筛选配置"
            description={
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="浏览量要求"
                    value={currentFilters.minViews}
                    prefix="≥"
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="点赞数要求"
                    value={currentFilters.minLikes}
                    prefix="≥"
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="互动率要求"
                    value={currentFilters.minEngagementRate}
                    suffix="%"
                    prefix="≥"
                  />
                </Col>
              </Row>
            }
            type="info"
            className="mt-4"
          />

          <div className="flex justify-end space-x-2 mt-4">
            <Button onClick={() => form.resetFields()}>
              重置筛选
            </Button>
            <Button type="primary" onClick={() => onFilterChange(currentFilters)}>
              应用筛选
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};