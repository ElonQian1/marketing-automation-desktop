// src/components/cache/xml-cache-performance-badge.tsx
// module: cache | layer: ui | role: performance-indicator
// summary: XML缓存性能状态徽章，显示优化效果

import React, { useState, useEffect } from 'react';
import { Badge, Tooltip, Button, Modal, Progress, Card, Row, Col, Statistic } from 'antd';
import { 
  ThunderboltOutlined, 
  CheckCircleOutlined, 
  WarningOutlined, 
  CloseCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  FireOutlined 
} from '@ant-design/icons';
import { xmlCachePerformanceMonitor, CachePerformanceMetrics } from '../../services/xml-cache-performance-monitor';
import { XmlCacheManager } from '../../services/xml-cache-manager';

interface CachePerformanceBadgeProps {
  /** 是否显示详细信息按钮 */
  showDetails?: boolean;
  /** 自动刷新间隔（秒），0为禁用 */
  refreshInterval?: number;
}

/**
 * XML缓存性能状态徽章
 * 
 * 功能：
 * 1. 实时显示缓存性能状态
 * 2. 提供一键优化按钮
 * 3. 详细的性能报告展示
 * 4. 用户友好的优化建议
 */
export const XmlCachePerformanceBadge: React.FC<CachePerformanceBadgeProps> = ({
  showDetails = true,
  refreshInterval = 30, // 默认30秒刷新
}) => {
  const [performanceSummary, setPerformanceSummary] = useState(xmlCachePerformanceMonitor.getPerformanceSummary());
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [performanceReport, setPerformanceReport] = useState<CachePerformanceMetrics | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  // 状态样式映射
  const getStatusConfig = (status: typeof performanceSummary.status) => {
    switch (status) {
      case 'excellent':
        return {
          color: '#52c41a',
          icon: <CheckCircleOutlined />,
          text: '优秀',
          badgeStatus: 'success' as const,
        };
      case 'good':
        return {
          color: '#1890ff',
          icon: <ThunderboltOutlined />,
          text: '良好',
          badgeStatus: 'processing' as const,
        };
      case 'fair':
        return {
          color: '#faad14',
          icon: <WarningOutlined />,
          text: '一般',
          badgeStatus: 'warning' as const,
        };
      case 'poor':
        return {
          color: '#ff4d4f',
          icon: <CloseCircleOutlined />,
          text: '较差',
          badgeStatus: 'error' as const,
        };
    }
  };

  // 更新性能数据
  const updatePerformanceData = () => {
    const summary = xmlCachePerformanceMonitor.getPerformanceSummary();
    const report = xmlCachePerformanceMonitor.generatePerformanceReport();
    
    setPerformanceSummary(summary);
    setPerformanceReport(report);
  };

  // 自动刷新
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(updatePerformanceData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // 初始化数据
  useEffect(() => {
    updatePerformanceData();
  }, []);

  // 执行缓存优化
  const handleOptimize = async () => {
    setOptimizing(true);
    
    try {
      const xmlCacheManager = XmlCacheManager.getInstance();
      
      // 执行多项优化操作
      console.log('🚀 开始缓存优化...');
      
      // 1. 清理过期缓存
      await xmlCacheManager.manualCleanup();
      
      // 2. 预热常用缓存
      await xmlCacheManager.warmupCache(15);
      
      // 3. 更新性能数据
      setTimeout(() => {
        updatePerformanceData();
        console.log('✅ 缓存优化完成');
      }, 1000);
      
    } catch (error) {
      console.error('❌ 缓存优化失败:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const statusConfig = getStatusConfig(performanceSummary.status);

  return (
    <>
      <Badge 
        status={statusConfig.badgeStatus}
        text={
          <span style={{ color: statusConfig.color, fontWeight: 500 }}>
            {statusConfig.icon} XML缓存: {statusConfig.text}
          </span>
        }
      />
      
      <Tooltip 
        title={`${performanceSummary.message} - ${performanceSummary.details}`}
        placement="bottom"
      >
        <Button 
          type="text" 
          size="small" 
          icon={<InfoCircleOutlined />}
          onClick={() => setDetailModalOpen(true)}
          style={{ marginLeft: 8, color: statusConfig.color }}
        >
          详情
        </Button>
      </Tooltip>

      {(performanceSummary.status === 'fair' || performanceSummary.status === 'poor') && (
        <Button 
          type="primary" 
          size="small" 
          icon={<FireOutlined />}
          onClick={handleOptimize}
          loading={optimizing}
          style={{ marginLeft: 8 }}
        >
          一键优化
        </Button>
      )}

      <Modal
        title={
          <span>
            {statusConfig.icon} XML缓存性能报告
            <Button 
              type="text" 
              size="small" 
              icon={<ReloadOutlined />}
              onClick={updatePerformanceData}
              style={{ marginLeft: 16 }}
            >
              刷新
            </Button>
          </span>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
          performanceReport && (performanceReport.userExperience.overallScore === 'fair' || 
                                performanceReport.userExperience.overallScore === 'poor') && (
            <Button 
              key="optimize" 
              type="primary" 
              icon={<FireOutlined />}
              onClick={handleOptimize}
              loading={optimizing}
            >
              执行优化
            </Button>
          ),
        ]}
        width={800}
      >
        {performanceReport && (
          <div className="light-theme-force">
            <Row gutter={[16, 16]}>
              {/* 总体性能 */}
              <Col span={24}>
                <Card size="small" title="总体性能">
                  <Row gutter={16}>
                    <Col span={6}>
                      <Statistic 
                        title="性能评分" 
                        value={statusConfig.text}
                        valueStyle={{ color: statusConfig.color }}
                        prefix={statusConfig.icon}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic 
                        title="平均加载时间" 
                        value={performanceReport.loadingTimes.averageMs} 
                        suffix="ms"
                        valueStyle={{ 
                          color: performanceReport.loadingTimes.averageMs < 100 ? '#52c41a' : 
                                 performanceReport.loadingTimes.averageMs < 300 ? '#1890ff' : '#ff4d4f'
                        }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic 
                        title="缓存命中率" 
                        value={Math.round(performanceReport.cacheHits.hitRate * 100)} 
                        suffix="%"
                        valueStyle={{ 
                          color: performanceReport.cacheHits.hitRate > 0.8 ? '#52c41a' : 
                                 performanceReport.cacheHits.hitRate > 0.6 ? '#1890ff' : '#ff4d4f'
                        }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic 
                        title="最快加载" 
                        value={performanceReport.loadingTimes.fastestLoadMs} 
                        suffix="ms"
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>

              {/* 缓存命中分析 */}
              <Col span={12}>
                <Card size="small" title="缓存命中分析">
                  <div style={{ marginBottom: 16 }}>
                    <div>内存命中: {performanceReport.cacheHits.memoryHits} 次</div>
                    <div>持久化命中: {performanceReport.cacheHits.persistentHits} 次</div>
                    <div>缓存失效: {performanceReport.cacheHits.misses} 次</div>
                  </div>
                  <Progress 
                    percent={Math.round(performanceReport.cacheHits.hitRate * 100)}
                    status={performanceReport.cacheHits.hitRate > 0.8 ? 'success' : 
                            performanceReport.cacheHits.hitRate > 0.6 ? 'active' : 'exception'}
                    strokeColor={performanceReport.cacheHits.hitRate > 0.8 ? '#52c41a' : 
                                 performanceReport.cacheHits.hitRate > 0.6 ? '#1890ff' : '#ff4d4f'}
                  />
                </Card>
              </Col>

              {/* 用户体验分析 */}
              <Col span={12}>
                <Card size="small" title="用户体验分析">
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: '#52c41a' }}>快速加载(&lt;100ms): {performanceReport.userExperience.fastLoads} 次</div>
                    <div style={{ color: '#1890ff' }}>可接受(100-500ms): {performanceReport.userExperience.acceptableLoads} 次</div>
                    <div style={{ color: '#ff4d4f' }}>慢速加载(&gt;500ms): {performanceReport.userExperience.slowLoads} 次</div>
                  </div>
                  <Progress 
                    percent={Math.round((performanceReport.userExperience.fastLoads / 
                            (performanceReport.userExperience.fastLoads + 
                             performanceReport.userExperience.acceptableLoads + 
                             performanceReport.userExperience.slowLoads)) * 100)}
                    status="active"
                    strokeColor="#52c41a"
                  />
                </Card>
              </Col>

              {/* 优化建议 */}
              <Col span={24}>
                <Card size="small" title="优化建议">
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {performanceReport.recommendations.map((recommendation, index) => (
                      <li key={index} style={{ marginBottom: 8 }}>
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </>
  );
};

export default XmlCachePerformanceBadge;