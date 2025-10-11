// src/pages/precise-acquisition/modules/smart-recommendation/SmartRecommendationPanel.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Empty,
  Spin,
  message,
  Pagination,
  Space,
  Typography,
  Statistic,
  Alert
} from 'antd';
import {
  TrophyOutlined,
  EyeOutlined,
  HeartOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { RecommendationFilters } from './RecommendationFilters';
import { RecommendationCard } from './RecommendationCard';
import { DataAnalysisEngine } from './DataAnalysisEngine';
import type { 
  RecommendationItem, 
  RecommendationFilterState, 
  RecommendationAction 
} from './types';
import { shouldBypassDeviceCheck } from '../../../../config/developmentMode';

const { Title, Text } = Typography;

interface SmartRecommendationPanelProps {
  onAddToMonitoring: (item: RecommendationItem) => void;
}

/**
 * 智能推荐监控面板
 * 根据数据指标自动推荐值得监控的账号和视频
 */
export const SmartRecommendationPanel: React.FC<SmartRecommendationPanelProps> = ({
  onAddToMonitoring
}) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<RecommendationItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  
  // 筛选状态
  const [filters, setFilters] = useState<RecommendationFilterState>({
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
  });

  const analysisEngine = DataAnalysisEngine.getInstance();

  // 加载推荐数据
  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      // 在实际项目中，这里会调用后端API
      // 目前使用模拟数据进行开发
      const mockData = analysisEngine.generateMockRecommendations(30);
      setRecommendations(mockData);
      message.success('推荐数据加载完成');
    } catch (error) {
      console.error('加载推荐数据失败:', error);
      message.error('加载推荐数据失败');
    } finally {
      setLoading(false);
    }
  }, [analysisEngine]);

  // 应用筛选和排序
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...recommendations];

    // 状态筛选
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === filters.statusFilter);
    }

    // 数据条件筛选
    filtered = analysisEngine.filterRecommendations(filtered, filters.criteria);

    // 排序
    filtered.sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (filters.sortBy) {
        case 'views':
          aValue = a.metrics.views;
          bValue = b.metrics.views;
          break;
        case 'likes':
          aValue = a.metrics.likes;
          bValue = b.metrics.likes;
          break;
        case 'comments':
          aValue = a.metrics.comments;
          bValue = b.metrics.comments;
          break;
        case 'engagement':
          aValue = a.metrics.engagement;
          bValue = b.metrics.engagement;
          break;
        case 'time':
          aValue = new Date(a.metrics.publishTime).getTime();
          bValue = new Date(b.metrics.publishTime).getTime();
          break;
        default: // score
          aValue = a.score;
          bValue = b.score;
      }

      return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setFilteredRecommendations(filtered);
    setCurrentPage(1); // 重置到第一页
  }, [recommendations, filters, analysisEngine]);

  // 处理推荐操作
  const handleRecommendationAction = useCallback(async (
    action: RecommendationAction, 
    item: RecommendationItem
  ) => {
    try {
      switch (action) {
        case 'add_to_monitoring':
          // 更新状态为已添加
          setRecommendations(prev => 
            prev.map(rec => 
              rec.id === item.id 
                ? { ...rec, status: 'added', updatedAt: new Date().toISOString() }
                : rec
            )
          );
          
          // 调用父组件的添加监控回调
          onAddToMonitoring(item);
          message.success(`已将"${item.title}"添加到监控列表`);
          break;
          
        case 'ignore':
          // 更新状态为已忽略
          setRecommendations(prev => 
            prev.map(rec => 
              rec.id === item.id 
                ? { ...rec, status: 'ignored', updatedAt: new Date().toISOString() }
                : rec
            )
          );
          message.success(`已忽略"${item.title}"`);
          break;
          
        case 'view_details':
          // 打开详情页面或外部链接
          window.open(item.url, '_blank');
          break;
      }
    } catch (error) {
      console.error('处理推荐操作失败:', error);
      message.error('操作失败，请重试');
    }
  }, [onAddToMonitoring]);

  // 处理筛选条件变化
  const handleFiltersChange = useCallback((newFilters: RecommendationFilterState) => {
    setFilters(newFilters);
  }, []);

  // 组件初始化和筛选条件变化时的效果
  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  // 计算分页数据
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = filteredRecommendations.slice(startIndex, endIndex);

  // 计算统计信息
  const stats = {
    total: recommendations.length,
    pending: recommendations.filter(r => r.status === 'pending').length,
    added: recommendations.filter(r => r.status === 'added').length,
    ignored: recommendations.filter(r => r.status === 'ignored').length,
    avgScore: recommendations.length > 0 
      ? recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length 
      : 0
  };

  return (
    <div className="space-y-6">
      {/* 开发模式提示 */}
      {shouldBypassDeviceCheck() && (
        <Alert
          message="开发模式"
          description="当前使用模拟数据进行智能推荐演示。实际环境中将连接真实数据源进行分析。"
          type="info"
          showIcon
          closable
        />
      )}

      {/* 统计概览 */}
      <Card>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="推荐总数"
              value={stats.total}
              prefix={<TrophyOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="待处理"
              value={stats.pending}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已添加"
              value={stats.added}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均评分"
              value={stats.avgScore}
              precision={1}
              suffix="分"
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 筛选配置 */}
      <RecommendationFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onRefresh={loadRecommendations}
      />

      {/* 推荐列表 */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <Title level={4} className="m-0">
            智能推荐结果
          </Title>
          <Text type="secondary">
            共找到 {filteredRecommendations.length} 个推荐项目
          </Text>
        </div>

        <Spin spinning={loading}>
          {currentData.length === 0 ? (
            <Empty
              description="暂无符合条件的推荐项目"
              className="py-8"
            />
          ) : (
            <>
              <Row gutter={[16, 16]}>
                {currentData.map(item => (
                  <Col key={item.id} xs={24} sm={12} lg={8} xl={6}>
                    <RecommendationCard
                      item={item}
                      onAction={handleRecommendationAction}
                    />
                  </Col>
                ))}
              </Row>

              {/* 分页 */}
              {filteredRecommendations.length > pageSize && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredRecommendations.length}
                    onChange={setCurrentPage}
                    showSizeChanger={false}
                    showQuickJumper
                    showTotal={(total, range) => 
                      `第 ${range[0]}-${range[1]} 项，共 ${total} 项`
                    }
                  />
                </div>
              )}
            </>
          )}
        </Spin>
      </Card>
    </div>
  );
};