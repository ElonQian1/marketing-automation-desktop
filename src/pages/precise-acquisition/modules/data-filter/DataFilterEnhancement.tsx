/**
 * 数据筛选增强组件
 * 基于浏览量、点赞量、评论量等指标实现智能推荐和筛选
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  InputNumber,
  Select,
  Switch,
  Button,
  Space,
  Row,
  Col,
  Typography,
  Tooltip,
  Alert,
  Slider,
  Tag,
  Progress,
  Statistic,
  Badge,
} from "antd";
import {
  FilterOutlined,
  BulbOutlined,
  InfoCircleOutlined,
  BarChartOutlined,
  RiseOutlined,
  FireOutlined,
  StarOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

export interface DataFilter {
  minViews: number;
  maxViews: number;
  minLikes: number;
  maxLikes: number;
  minComments: number;
  maxComments: number;
  minEngagementRate: number; // 互动率
  minGrowthRate: number; // 增长率
  timeRange: number; // 时间范围（小时）
  hotOnly: boolean; // 仅热门内容
  trendingOnly: boolean; // 仅趋势内容
  qualityScore: number; // 质量分数阈值
}

export interface SmartRecommendation {
  type: "hot" | "trending" | "quality" | "potential";
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
  showRecommendations?: boolean;
}

export const DataFilterEnhancement: React.FC<DataFilterEnhancementProps> = ({
  onFilterChange,
  initialFilters = {},
  showRecommendations = true,
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
    minGrowthRate: 10,
    timeRange: 24,
    hotOnly: false,
    trendingOnly: false,
    qualityScore: 60,
    ...initialFilters,
  });

  // 智能推荐策略
  const smartRecommendations: SmartRecommendation[] = [
    {
      type: "hot",
      title: "热门爆款内容",
      description: "高浏览量、高互动率的热门内容，转化效果好",
      filters: {
        minViews: 50000,
        minLikes: 500,
        minComments: 50,
        minEngagementRate: 5,
        hotOnly: true,
        timeRange: 24,
      },
      score: 95,
      icon: <FireOutlined />,
      color: "red",
    },
    {
      type: "trending",
      title: "趋势上升内容",
      description: "增长迅速的内容，抓住流量红利期",
      filters: {
        minViews: 10000,
        minLikes: 100,
        minComments: 20,
        minGrowthRate: 50,
        trendingOnly: true,
        timeRange: 12,
      },
      score: 88,
      icon: <RiseOutlined />,
      color: "orange",
    },
    {
      type: "quality",
      title: "高质量内容",
      description: "质量分数高，用户认可度强的优质内容",
      filters: {
        minViews: 5000,
        minLikes: 100,
        minComments: 15,
        minEngagementRate: 3,
        qualityScore: 80,
        timeRange: 48,
      },
      score: 82,
      icon: <StarOutlined />,
      color: "gold",
    },
    {
      type: "potential",
      title: "潜力内容",
      description: "数据适中但有潜力的内容，竞争相对较小",
      filters: {
        minViews: 2000,
        maxViews: 20000,
        minLikes: 20,
        maxLikes: 200,
        minComments: 5,
        maxComments: 50,
        minEngagementRate: 1.5,
        timeRange: 72,
      },
      score: 75,
      icon: <BulbOutlined />,
      color: "blue",
    },
  ];

  // 计算互动率
  const calculateEngagementRate = (
    likes: number,
    comments: number,
    views: number
  ): number => {
    if (views === 0) return 0;
    return ((likes + comments * 3) / views) * 100;
  };

  // 计算质量分数
  const calculateQualityScore = (filters: DataFilter): number => {
    const viewsScore = Math.min((filters.minViews / 10000) * 20, 20);
    const likesScore = Math.min((filters.minLikes / 100) * 15, 15);
    const commentsScore = Math.min((filters.minComments / 20) * 15, 15);
    const engagementScore = Math.min(filters.minEngagementRate * 10, 30);
    const growthScore = Math.min(filters.minGrowthRate * 2, 20);

    return Math.round(
      viewsScore + likesScore + commentsScore + engagementScore + growthScore
    );
  };

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

  // 重置筛选
  const resetFilters = () => {
    const defaultFilters: DataFilter = {
      minViews: 1000,
      maxViews: 1000000,
      minLikes: 10,
      maxLikes: 10000,
      minComments: 5,
      maxComments: 1000,
      minEngagementRate: 2,
      minGrowthRate: 10,
      timeRange: 24,
      hotOnly: false,
      trendingOnly: false,
      qualityScore: 60,
    };
    setCurrentFilters(defaultFilters);
    form.setFieldsValue(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const currentQualityScore = calculateQualityScore(currentFilters);

  return (
    <div className="space-y-6">
      {/* 智能推荐卡片 */}
      {showRecommendations && (
        <Card
          title={
            <div className="flex items-center space-x-2">
              <BulbOutlined className="text-blue-500" />
              <span>智能筛选推荐</span>
            </div>
          }
        >
          <Row gutter={[16, 16]}>
            {smartRecommendations.map((rec) => (
              <Col xs={24} sm={12} md={6} key={rec.type}>
                <Card
                  size="small"
                  hoverable
                  className="h-full cursor-pointer border-l-4"
                  style={{ borderLeftColor: rec.color }}
                  onClick={() => applyRecommendation(rec)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Tag color={rec.color} icon={rec.icon}>
                          {rec.title}
                        </Tag>
                      </div>
                      <Badge
                        count={rec.score}
                        overflowCount={99}
                        color={rec.color}
                      />
                    </div>
                    <Text className="text-xs text-gray-600">
                      {rec.description}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* 筛选配置 */}
      <Card
        title={
          <div className="flex items-center space-x-2">
            <FilterOutlined className="text-green-500" />
            <span>数据筛选配置</span>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={currentFilters}
          onValuesChange={handleFilterChange}
        >
          {/* 基础数据筛选 */}
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Title level={5}>基础数据指标</Title>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <span className="flex items-center space-x-1">
                    <span>浏览量范围</span>
                    <Tooltip title="设置内容的浏览量筛选范围">
                      <InfoCircleOutlined className="text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <Row gutter={8}>
                  <Col span={12}>
                    <Form.Item name="minViews" className="mb-0">
                      <InputNumber
                        min={0}
                        placeholder="最小值"
                        className="w-full"
                        formatter={(value) =>
                          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        }
                        parser={(value) =>
                          Number(value!.replace(/\$\s?|(,*)/g, "")) as 0
                        }
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="maxViews" className="mb-0">
                      <InputNumber
                        min={0}
                        placeholder="最大值"
                        className="w-full"
                        formatter={(value) =>
                          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        }
                        parser={(value) =>
                          Number(value!.replace(/\$\s?|(,*)/g, "")) as 0
                        }
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <span className="flex items-center space-x-1">
                    <span>点赞量范围</span>
                    <Tooltip title="设置内容的点赞量筛选范围">
                      <InfoCircleOutlined className="text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <Row gutter={8}>
                  <Col span={12}>
                    <Form.Item name="minLikes" className="mb-0">
                      <InputNumber
                        min={0}
                        placeholder="最小值"
                        className="w-full"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="maxLikes" className="mb-0">
                      <InputNumber
                        min={0}
                        placeholder="最大值"
                        className="w-full"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <span className="flex items-center space-x-1">
                    <span>评论量范围</span>
                    <Tooltip title="设置内容的评论量筛选范围">
                      <InfoCircleOutlined className="text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <Row gutter={8}>
                  <Col span={12}>
                    <Form.Item name="minComments" className="mb-0">
                      <InputNumber
                        min={0}
                        placeholder="最小值"
                        className="w-full"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="maxComments" className="mb-0">
                      <InputNumber
                        min={0}
                        placeholder="最大值"
                        className="w-full"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="timeRange"
                label={
                  <span className="flex items-center space-x-1">
                    <span>时间范围（小时）</span>
                    <Tooltip title="仅筛选指定时间内发布的内容">
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
                  <Option value={48}>最近 48 小时</Option>
                  <Option value={72}>最近 72 小时</Option>
                  <Option value={168}>最近 7 天</Option>
                  <Option value={720}>最近 30 天</Option>
                  <Option value={0}>不限制</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* 高级筛选 */}
          <Row gutter={[16, 16]} className="mt-6">
            <Col span={24}>
              <Title level={5}>高级筛选指标</Title>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="minEngagementRate"
                label={
                  <span className="flex items-center space-x-1">
                    <span>最小互动率 (%)</span>
                    <Tooltip title="互动率 = (点赞数 + 评论数×3) / 浏览量 × 100">
                      <InfoCircleOutlined className="text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <InputNumber
                  min={0}
                  max={100}
                  step={0.1}
                  className="w-full"
                  formatter={(value) => `${value}%`}
                  parser={(value) => Number(value!.replace("%", "")) as 0 | 100}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="minGrowthRate"
                label={
                  <span className="flex items-center space-x-1">
                    <span>最小增长率 (%)</span>
                    <Tooltip title="近期数据相比历史平均的增长百分比">
                      <InfoCircleOutlined className="text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <InputNumber
                  min={0}
                  max={1000}
                  className="w-full"
                  formatter={(value) => `${value}%`}
                  parser={(value) =>
                    Number(value!.replace("%", "")) as 0 | 1000
                  }
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="qualityScore"
                label={
                  <span className="flex items-center space-x-1">
                    <span>质量分数阈值</span>
                    <Tooltip title="综合多个指标计算的内容质量分数">
                      <InfoCircleOutlined className="text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <Slider
                  min={0}
                  max={100}
                  marks={{
                    0: "0",
                    25: "低",
                    50: "中",
                    75: "高",
                    100: "100",
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <div className="space-y-4">
                <Form.Item
                  name="hotOnly"
                  valuePropName="checked"
                  className="mb-2"
                >
                  <Switch size="small" />
                  <span className="ml-2">仅热门内容</span>
                  <Tooltip title="只筛选被标记为热门的内容">
                    <InfoCircleOutlined className="ml-1 text-gray-400" />
                  </Tooltip>
                </Form.Item>

                <Form.Item
                  name="trendingOnly"
                  valuePropName="checked"
                  className="mb-0"
                >
                  <Switch size="small" />
                  <span className="ml-2">仅趋势内容</span>
                  <Tooltip title="只筛选数据增长趋势明显的内容">
                    <InfoCircleOutlined className="ml-1 text-gray-400" />
                  </Tooltip>
                </Form.Item>
              </div>
            </Col>
          </Row>

          {/* 当前配置摘要 */}
          <Alert
            message="当前筛选配置摘要"
            description={
              <div className="space-y-2">
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="质量分数"
                      value={currentQualityScore}
                      suffix="/ 100"
                      valueStyle={{
                        color:
                          currentQualityScore >= 80
                            ? "#3f8600"
                            : currentQualityScore >= 60
                            ? "#faad14"
                            : "#cf1322",
                      }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="筛选强度"
                      value={
                        currentFilters.minViews > 10000
                          ? "严格"
                          : currentFilters.minViews > 1000
                          ? "适中"
                          : "宽松"
                      }
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="预期转化"
                      value={
                        currentQualityScore >= 80
                          ? "高"
                          : currentQualityScore >= 60
                          ? "中"
                          : "低"
                      }
                    />
                  </Col>
                </Row>
              </div>
            }
            type="info"
            className="mt-4"
          />

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-2 mt-4">
            <Button onClick={resetFilters}>重置筛选</Button>
            <Button
              type="primary"
              onClick={() => onFilterChange(currentFilters)}
            >
              应用筛选
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};
