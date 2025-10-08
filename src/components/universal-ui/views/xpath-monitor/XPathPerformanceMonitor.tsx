import React, { useState, useEffect } from 'react';
import { Card, Progress, Button, Typography, Statistic, Row, Col, Space, Tag, Alert } from 'antd';
import { 
  BarChartOutlined, 
  ClearOutlined, 
  ReloadOutlined,
  ThunderboltOutlined,
  DatabaseOutlined 
} from '@ant-design/icons';
import XPathService from '../../../../utils/xpath/XPathService';

const { Title, Text } = Typography;

interface PerformanceData {
  validationHits: number;
  validationMisses: number;
  generationHits: number;
  generationMisses: number;
  totalComputeTime: number;
  cacheMemoryUsage: number;
}

/**
 * XPath 性能监控组件
 * 实时显示 XPath 服务的缓存命中率、性能指标和内存使用情况
 */
export const XPathPerformanceMonitor: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // 获取性能数据
  const fetchPerformanceData = () => {
    try {
      const stats = XPathService.getCacheStats();
      setPerformanceData(stats);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('获取 XPath 性能数据失败:', error);
    }
  };

  // 自动刷新
  useEffect(() => {
    fetchPerformanceData(); // 初始加载

    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(fetchPerformanceData, 2000); // 每2秒刷新
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh]);

  // 计算命中率
  const calculateHitRate = (hits: number, misses: number): number => {
    const total = hits + misses;
    return total > 0 ? (hits / total) * 100 : 0;
  };

  // 清除缓存
  const handleClearCache = () => {
    XPathService.clearCache();
    fetchPerformanceData();
  };

  // 格式化内存使用量
  const formatMemoryUsage = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  // 获取命中率状态
  const getHitRateStatus = (rate: number): 'success' | 'normal' | 'exception' => {
    if (rate >= 80) return 'success';
    if (rate >= 50) return 'normal';
    return 'exception';
  };

  if (!performanceData) {
    return (
      <Card title="XPath 性能监控" loading>
        <Text>正在加载性能数据...</Text>
      </Card>
    );
  }

  const validationHitRate = calculateHitRate(
    performanceData.validationHits, 
    performanceData.validationMisses
  );
  const generationHitRate = calculateHitRate(
    performanceData.generationHits, 
    performanceData.generationMisses
  );

  const validationTotal = performanceData.validationHits + performanceData.validationMisses;
  const generationTotal = performanceData.generationHits + performanceData.generationMisses;

  return (
    <div className="xpath-performance-monitor">
      <Card
        title={
          <Space>
            <BarChartOutlined />
            <Title level={4} style={{ margin: 0 }}>XPath 性能监控</Title>
            {autoRefresh && <Tag color="green">自动刷新</Tag>}
          </Space>
        }
        extra={
          <Space>
            <Button 
              size="small" 
              type={autoRefresh ? 'primary' : 'default'}
              onClick={() => setAutoRefresh(!autoRefresh)}
              icon={<ThunderboltOutlined />}
            >
              {autoRefresh ? '停止自动刷新' : '启用自动刷新'}
            </Button>
            <Button 
              size="small" 
              onClick={fetchPerformanceData}
              icon={<ReloadOutlined />}
            >
              刷新
            </Button>
            <Button 
              size="small" 
              danger 
              onClick={handleClearCache}
              icon={<ClearOutlined />}
            >
              清除缓存
            </Button>
          </Space>
        }
      >
        {/* 缓存命中率 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card size="small" title="验证缓存">
              <Statistic
                title="命中率"
                value={validationHitRate}
                precision={1}
                suffix="%"
                valueStyle={{ 
                  color: getHitRateStatus(validationHitRate) === 'success' ? '#3f8600' : 
                         getHitRateStatus(validationHitRate) === 'normal' ? '#cf1322' : '#722ed1'
                }}
              />
              <Progress 
                percent={validationHitRate} 
                status={getHitRateStatus(validationHitRate)}
                size="small"
                style={{ marginTop: 8 }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  命中: {performanceData.validationHits} | 
                  未命中: {performanceData.validationMisses} | 
                  总计: {validationTotal}
                </Text>
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="生成缓存">
              <Statistic
                title="命中率"
                value={generationHitRate}
                precision={1}
                suffix="%"
                valueStyle={{ 
                  color: getHitRateStatus(generationHitRate) === 'success' ? '#3f8600' : 
                         getHitRateStatus(generationHitRate) === 'normal' ? '#cf1322' : '#722ed1'
                }}
              />
              <Progress 
                percent={generationHitRate} 
                status={getHitRateStatus(generationHitRate)}
                size="small"
                style={{ marginTop: 8 }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  命中: {performanceData.generationHits} | 
                  未命中: {performanceData.generationMisses} | 
                  总计: {generationTotal}
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 性能指标 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Statistic
              title="总计算时间"
              value={performanceData.totalComputeTime}
              precision={2}
              suffix="ms"
              prefix={<ThunderboltOutlined />}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="内存使用"
              value={formatMemoryUsage(performanceData.cacheMemoryUsage)}
              prefix={<DatabaseOutlined />}
            />
          </Col>
        </Row>

        {/* 性能建议 */}
        {validationHitRate < 50 && validationTotal > 10 && (
          <Alert
            message="验证缓存命中率较低"
            description="建议检查是否存在重复的验证请求，或考虑预热常用的 XPath 表达式。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {generationHitRate < 50 && generationTotal > 10 && (
          <Alert
            message="生成缓存命中率较低"
            description="元素生成请求可能较为分散，这是正常现象。如果性能存在问题，可考虑优化生成逻辑。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {performanceData.cacheMemoryUsage > 1024 * 1024 && (
          <Alert
            message="缓存内存使用量较高"
            description={`当前使用 ${formatMemoryUsage(performanceData.cacheMemoryUsage)}，建议定期清理缓存或调整缓存大小配置。`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 最后更新时间 */}
        {lastUpdate && (
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Text type="secondary">
              最后更新: {lastUpdate.toLocaleTimeString()}
            </Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default XPathPerformanceMonitor;