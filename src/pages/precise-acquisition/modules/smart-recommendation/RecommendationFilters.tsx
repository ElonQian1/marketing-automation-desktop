import React, { useState } from 'react';
import {
  Card,
  Form,
  Row,
  Col,
  InputNumber,
  Select,
  Slider,
  Switch,
  Button,
  Space,
  Divider,
  Typography,
  Tag,
  Collapse
} from 'antd';
import {
  FilterOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import type { RecommendationCriteria, RecommendationFilterState } from './types';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

interface RecommendationFiltersProps {
  filters: RecommendationFilterState;
  onFiltersChange: (filters: RecommendationFilterState) => void;
  onRefresh: () => void;
}

/**
 * 智能推荐筛选配置面板
 */
export const RecommendationFilters: React.FC<RecommendationFiltersProps> = ({
  filters,
  onFiltersChange,
  onRefresh
}) => {
  const [form] = Form.useForm();
  const [expanded, setExpanded] = useState(false);

  // 处理筛选条件变化
  const handleCriteriaChange = (field: keyof RecommendationCriteria, value: any) => {
    const newCriteria = {
      ...filters.criteria,
      [field]: value
    };
    onFiltersChange({
      ...filters,
      criteria: newCriteria
    });
  };

  // 处理排序变化
  const handleSortChange = (sortBy: string, sortOrder?: 'asc' | 'desc') => {
    onFiltersChange({
      ...filters,
      sortBy: sortBy as any,
      sortOrder: sortOrder || filters.sortOrder
    });
  };

  // 重置筛选条件
  const handleReset = () => {
    const defaultFilters: RecommendationFilterState = {
      criteria: {
        minViews: 10000,
        minLikes: 1000,
        minComments: 100,
        minEngagement: 5,
        timeRange: 'week',
        publishedWithin: 168, // 7天
        platforms: ['xiaohongshu', 'douyin']
      },
      sortBy: 'score',
      sortOrder: 'desc',
      statusFilter: 'pending'
    };
    
    onFiltersChange(defaultFilters);
    form.setFieldsValue(defaultFilters.criteria);
  };

  return (
    <Card size="small">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FilterOutlined />
          <Title level={5} className="m-0">智能推荐筛选</Title>
        </div>
        
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={onRefresh}
            size="small"
          >
            刷新推荐
          </Button>
          <Button 
            icon={<SettingOutlined />} 
            onClick={() => setExpanded(!expanded)}
            size="small"
          >
            {expanded ? '收起' : '展开'}配置
          </Button>
        </Space>
      </div>

      {/* 快速配置区域 */}
      <Row gutter={16} className="mb-4">
        <Col span={6}>
          <div className="text-sm text-gray-500 mb-1">排序方式</div>
          <Select
            value={filters.sortBy}
            onChange={(value) => handleSortChange(value)}
            size="small"
            className="w-full"
          >
            <Option value="score">推荐评分</Option>
            <Option value="views">浏览量</Option>
            <Option value="likes">点赞量</Option>
            <Option value="comments">评论量</Option>
            <Option value="engagement">互动率</Option>
            <Option value="time">发布时间</Option>
          </Select>
        </Col>
        
        <Col span={4}>
          <div className="text-sm text-gray-500 mb-1">排序</div>
          <Select
            value={filters.sortOrder}
            onChange={(value) => handleSortChange(filters.sortBy, value)}
            size="small"
            className="w-full"
          >
            <Option value="desc">降序</Option>
            <Option value="asc">升序</Option>
          </Select>
        </Col>
        
        <Col span={6}>
          <div className="text-sm text-gray-500 mb-1">状态筛选</div>
          <Select
            value={filters.statusFilter}
            onChange={(value) => onFiltersChange({ ...filters, statusFilter: value })}
            size="small"
            className="w-full"
          >
            <Option value="all">全部状态</Option>
            <Option value="pending">待处理</Option>
            <Option value="added">已添加</Option>
            <Option value="ignored">已忽略</Option>
          </Select>
        </Col>
        
        <Col span={8}>
          <div className="text-sm text-gray-500 mb-1">平台筛选</div>
          <Select
            mode="multiple"
            value={filters.criteria.platforms}
            onChange={(value) => handleCriteriaChange('platforms', value)}
            size="small"
            className="w-full"
            placeholder="选择平台"
          >
            <Option value="xiaohongshu">小红书</Option>
            <Option value="douyin">抖音</Option>
          </Select>
        </Col>
      </Row>

      {/* 详细配置折叠面板 */}
      <Collapse activeKey={expanded ? ['1'] : []} ghost>
        <Panel header="" key="1" showArrow={false}>
          <Form form={form} layout="vertical" className="space-y-4">
            {/* 数据阈值配置 */}
            <div>
              <Title level={5}>数据阈值</Title>
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item label="最小浏览量" name="minViews">
                    <InputNumber
                      value={filters.criteria.minViews}
                      onChange={(value) => handleCriteriaChange('minViews', value)}
                      min={0}
                      step={1000}
                      placeholder="如: 10000"
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
                
                <Col span={6}>
                  <Form.Item label="最小点赞量" name="minLikes">
                    <InputNumber
                      value={filters.criteria.minLikes}
                      onChange={(value) => handleCriteriaChange('minLikes', value)}
                      min={0}
                      step={100}
                      placeholder="如: 1000"
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
                
                <Col span={6}>
                  <Form.Item label="最小评论量" name="minComments">
                    <InputNumber
                      value={filters.criteria.minComments}
                      onChange={(value) => handleCriteriaChange('minComments', value)}
                      min={0}
                      step={10}
                      placeholder="如: 100"
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
                
                <Col span={6}>
                  <Form.Item label="最小互动率 (%)" name="minEngagement">
                    <InputNumber
                      value={filters.criteria.minEngagement}
                      onChange={(value) => handleCriteriaChange('minEngagement', value)}
                      min={0}
                      max={100}
                      step={0.1}
                      placeholder="如: 5.0"
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider />

            {/* 增长趋势 */}
            <div>
              <Title level={5}>增长趋势</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="最小增长率 (%)" name="minGrowthRate">
                    <Slider
                      value={filters.criteria.minGrowthRate || 0}
                      onChange={(value) => handleCriteriaChange('minGrowthRate', value)}
                      min={0}
                      max={500}
                      step={10}
                      marks={{
                        0: '0%',
                        50: '50%',
                        100: '100%',
                        200: '200%',
                        500: '500%'
                      }}
                    />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item label="时间范围" name="timeRange">
                    <Select
                      value={filters.criteria.timeRange}
                      onChange={(value) => handleCriteriaChange('timeRange', value)}
                      className="w-full"
                    >
                      <Option value="hour">最近1小时</Option>
                      <Option value="day">最近1天</Option>
                      <Option value="week">最近1周</Option>
                      <Option value="month">最近1月</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider />

            {/* 其他筛选 */}
            <div>
              <Title level={5}>其他筛选</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="发布时间范围 (小时)" name="publishedWithin">
                    <Select
                      value={filters.criteria.publishedWithin}
                      onChange={(value) => handleCriteriaChange('publishedWithin', value)}
                      className="w-full"
                    >
                      <Option value={24}>最近24小时</Option>
                      <Option value={72}>最近3天</Option>
                      <Option value={168}>最近7天</Option>
                      <Option value={720}>最近30天</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item label="地域筛选" name="regions">
                    <Select
                      mode="multiple"
                      value={filters.criteria.regions}
                      onChange={(value) => handleCriteriaChange('regions', value)}
                      placeholder="选择地域"
                      className="w-full"
                    >
                      <Option value="北京">北京</Option>
                      <Option value="上海">上海</Option>
                      <Option value="广州">广州</Option>
                      <Option value="深圳">深圳</Option>
                      <Option value="杭州">杭州</Option>
                      <Option value="成都">成都</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-2">
              <Button onClick={handleReset}>重置</Button>
              <Button type="primary" onClick={onRefresh}>
                应用筛选
              </Button>
            </div>
          </Form>
        </Panel>
      </Collapse>

      {/* 当前筛选条件摘要 */}
      <div className="mt-3 p-3 bg-gray-50 rounded">
        <Text className="text-sm text-gray-600">当前筛选条件：</Text>
        <div className="mt-1 space-x-1">
          {filters.criteria.minViews && (
            <Tag className="text-xs">浏览量≥{(filters.criteria.minViews / 10000).toFixed(1)}万</Tag>
          )}
          {filters.criteria.minLikes && (
            <Tag className="text-xs">点赞量≥{filters.criteria.minLikes}</Tag>
          )}
          {filters.criteria.minComments && (
            <Tag className="text-xs">评论量≥{filters.criteria.minComments}</Tag>
          )}
          {filters.criteria.minEngagement && (
            <Tag className="text-xs">互动率≥{filters.criteria.minEngagement}%</Tag>
          )}
          {filters.criteria.platforms && filters.criteria.platforms.length > 0 && (
            <Tag className="text-xs">
              平台: {filters.criteria.platforms.map(p => p === 'xiaohongshu' ? '小红书' : '抖音').join(', ')}
            </Tag>
          )}
        </div>
      </div>
    </Card>
  );
};