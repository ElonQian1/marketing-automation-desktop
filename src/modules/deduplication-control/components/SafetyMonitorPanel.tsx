/**
 * 安全监控面板
 * 
 * 提供实时安全状态监控、统计图表和告警信息
 */
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Alert, 
  Table, 
  Tag, 
  Timeline, 
  Button,
  Space,
  Select,
  DatePicker,
  Tooltip,
  Badge,
  Typography,
  Descriptions,
  Empty
} from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  CloseCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { 
  SafetyStatistics,
  SafetyCheckResult,
  CircuitBreakerState,
  CircuitBreakerStatus
} from '../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface SafetyMonitorPanelProps {
  statistics: SafetyStatistics | null;
  recentChecks: SafetyCheckResult[];
  healthStatus: {
    status: 'healthy' | 'warning' | 'critical' | 'unknown';
    score: number;
    message: string;
    details?: any;
  };
  onRefresh: () => void;
  onLoadStatistics: (accountId: string, timeRange: { start: Date; end: Date }) => void;
  loading?: boolean;
}

/**
 * 系统健康状态卡片
 */
const HealthStatusCard: React.FC<{
  healthStatus: SafetyMonitorPanelProps['healthStatus'];
  onRefresh: () => void;
  loading?: boolean;
}> = ({ healthStatus, onRefresh, loading }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#52c41a';
      case 'warning': return '#faad14';
      case 'critical': return '#f5222d';
      default: return '#d9d9d9';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleOutlined />;
      case 'warning': return <ExclamationCircleOutlined />;
      case 'critical': return <CloseCircleOutlined />;
      default: return <ExclamationCircleOutlined />;
    }
  };
  
  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ color: 'var(--text-inverse)' }}>系统健康状态</Text>
          <Button 
            icon={<ReloadOutlined />} 
            size="small" 
            onClick={onRefresh}
            loading={loading}
          >
            刷新
          </Button>
        </div>
      }
      style={{ background: 'var(--bg-light-base)' }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <Progress
            type="circle"
            percent={healthStatus.score}
            strokeColor={getStatusColor(healthStatus.status)}
            format={() => (
              <div>
                <div style={{ fontSize: 24, color: getStatusColor(healthStatus.status) }}>
                  {getStatusIcon(healthStatus.status)}
                </div>
                <div style={{ fontSize: 14, marginTop: 4 }}>
                  {healthStatus.score}%
                </div>
              </div>
            )}
          />
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <Badge 
            status={healthStatus.status === 'healthy' ? 'success' : 
                   healthStatus.status === 'warning' ? 'warning' : 'error'} 
            text={healthStatus.message}
          />
        </div>
        
        {healthStatus.details && (
          <Descriptions size="small" column={2}>
            <Descriptions.Item label="总检查次数">
              {healthStatus.details.totalChecks}
            </Descriptions.Item>
            <Descriptions.Item label="通过次数">
              {healthStatus.details.passedChecks}
            </Descriptions.Item>
            <Descriptions.Item label="拦截次数">
              {healthStatus.details.blockedChecks}
            </Descriptions.Item>
            <Descriptions.Item label="通过率">
              {healthStatus.details.passRate}%
            </Descriptions.Item>
          </Descriptions>
        )}
      </Space>
    </Card>
  );
};

/**
 * 统计数据卡片
 */
const StatisticsCards: React.FC<{
  statistics: SafetyStatistics | null;
}> = ({ statistics }) => {
  if (!statistics) {
    return (
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4].map(i => (
          <Col span={6} key={i}>
            <Card loading style={{ background: 'var(--bg-light-base)' }}>
              <Statistic title="加载中..." value={0} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }
  
  const passRate = statistics.totalChecks > 0 ? 
    (statistics.passedChecks / statistics.totalChecks * 100) : 0;
  
  return (
    <Row gutter={[16, 16]}>
      <Col span={6}>
        <Card style={{ background: 'var(--bg-light-base)' }}>
          <Statistic
            title={<span style={{ color: 'var(--text-inverse)' }}>总检查次数</span>}
            value={statistics.totalChecks}
            valueStyle={{ color: 'var(--text-inverse)' }}
          />
        </Card>
      </Col>
      
      <Col span={6}>
        <Card style={{ background: 'var(--bg-light-base)' }}>
          <Statistic
            title={<span style={{ color: 'var(--text-inverse)' }}>通过次数</span>}
            value={statistics.passedChecks}
            valueStyle={{ color: '#52c41a' }}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </Col>
      
      <Col span={6}>
        <Card style={{ background: 'var(--bg-light-base)' }}>
          <Statistic
            title={<span style={{ color: 'var(--text-inverse)' }}>拦截次数</span>}
            value={statistics.blockedChecks}
            valueStyle={{ color: '#f5222d' }}
            prefix={<CloseCircleOutlined />}
          />
        </Card>
      </Col>
      
      <Col span={6}>
        <Card style={{ background: 'var(--bg-light-base)' }}>
          <Statistic
            title={<span style={{ color: 'var(--text-inverse)' }}>通过率</span>}
            value={passRate}
            precision={1}
            suffix="%"
            valueStyle={{ 
              color: passRate >= 90 ? '#52c41a' : passRate >= 70 ? '#faad14' : '#f5222d' 
            }}
          />
        </Card>
      </Col>
    </Row>
  );
};

/**
 * 拦截原因分析
 */
const BlockReasonsCard: React.FC<{
  statistics: SafetyStatistics | null;
}> = ({ statistics }) => {
  if (!statistics) {
    return (
      <Card title="拦截原因分析" loading style={{ background: 'var(--bg-light-base)' }}>
        <Empty />
      </Card>
    );
  }
  
  const { blockReasons } = statistics;
  const total = blockReasons.deduplication + blockReasons.rateLimit + blockReasons.circuitBreaker;
  
  if (total === 0) {
    return (
      <Card 
        title={<span style={{ color: 'var(--text-inverse)' }}>拦截原因分析</span>}
        style={{ background: 'var(--bg-light-base)' }}
      >
        <Empty description="暂无拦截记录" />
      </Card>
    );
  }
  
  const data = [
    {
      reason: '去重拦截',
      count: blockReasons.deduplication,
      percentage: (blockReasons.deduplication / total * 100).toFixed(1),
      color: '#1890ff'
    },
    {
      reason: '频控拦截',
      count: blockReasons.rateLimit,
      percentage: (blockReasons.rateLimit / total * 100).toFixed(1),
      color: '#52c41a'
    },
    {
      reason: '熔断拦截',
      count: blockReasons.circuitBreaker,
      percentage: (blockReasons.circuitBreaker / total * 100).toFixed(1),
      color: '#f5222d'
    }
  ];
  
  return (
    <Card 
      title={<span style={{ color: 'var(--text-inverse)' }}>拦截原因分析</span>}
      style={{ background: 'var(--bg-light-base)' }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {data.map(item => (
          <div key={item.reason}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: 4,
              color: 'var(--text-inverse)'
            }}>
              <span>{item.reason}</span>
              <span>{item.count} ({item.percentage}%)</span>
            </div>
            <Progress 
              percent={parseFloat(item.percentage)} 
              strokeColor={item.color}
              showInfo={false}
            />
          </div>
        ))}
      </Space>
    </Card>
  );
};

/**
 * 最近检查记录表格
 */
const RecentChecksTable: React.FC<{
  recentChecks: SafetyCheckResult[];
}> = ({ recentChecks }) => {
  const columns = [
    {
      title: '检查时间',
      dataIndex: 'checkTime',
      key: 'checkTime',
      width: 120,
      render: (time: Date) => time.toLocaleTimeString()
    },
    {
      title: '结果',
      dataIndex: 'allowed',
      key: 'allowed',
      width: 80,
      render: (allowed: boolean) => (
        <Tag color={allowed ? 'success' : 'error'}>
          {allowed ? '通过' : '拦截'}
        </Tag>
      )
    },
    {
      title: '风险评分',
      dataIndex: 'riskScore',
      key: 'riskScore',
      width: 100,
      render: (score: number) => (
        <Tag color={score <= 30 ? 'green' : score <= 70 ? 'orange' : 'red'}>
          {score}
        </Tag>
      )
    },
    {
      title: '拦截原因',
      key: 'blockReason',
      render: (record: SafetyCheckResult) => {
        const reasons = [];
        if (!record.deduplication.allowed) {
          reasons.push('去重');
        }
        if (!record.rateLimit.allowed) {
          reasons.push('频控');
        }
        if (record.circuitBreaker.state !== CircuitBreakerState.CLOSED) {
          reasons.push('熔断');
        }
        
        return reasons.length > 0 ? (
          <Space>
            {reasons.map(reason => (
              <Tag key={reason} size="small">{reason}</Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        );
      }
    },
    {
      title: '建议',
      dataIndex: 'recommendations',
      key: 'recommendations',
      render: (recommendations: any[]) => (
        <Tooltip title={recommendations.map(r => r.message).join('; ')}>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
          >
            查看
          </Button>
        </Tooltip>
      )
    }
  ];
  
  return (
    <Card 
      title={<span style={{ color: 'var(--text-inverse)' }}>最近检查记录</span>}
      style={{ background: 'var(--bg-light-base)' }}
    >
      <Table
        columns={columns}
        dataSource={recentChecks.slice(0, 10)} // 只显示最近10条
        rowKey={(record) => record.checkTime.getTime().toString()}
        size="small"
        pagination={false}
        locale={{ emptyText: '暂无检查记录' }}
      />
    </Card>
  );
};

/**
 * 主监控面板组件
 */
export const SafetyMonitorPanel: React.FC<SafetyMonitorPanelProps> = ({
  statistics,
  recentChecks,
  healthStatus,
  onRefresh,
  onLoadStatistics,
  loading
}) => {
  const [selectedAccount, setSelectedAccount] = useState<string>('default');
  const [timeRange, setTimeRange] = useState<[any, any] | null>(null);
  
  useEffect(() => {
    // 默认加载今天的数据
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    onLoadStatistics(selectedAccount, { start: startOfDay, end: endOfDay });
  }, [selectedAccount, onLoadStatistics]);
  
  const handleTimeRangeChange = (dates: any) => {
    setTimeRange(dates);
    if (dates && dates.length === 2) {
      onLoadStatistics(selectedAccount, {
        start: dates[0].toDate(),
        end: dates[1].toDate()
      });
    }
  };
  
  return (
    <div className="light-theme-force" style={{ background: 'var(--bg-light-base)' }}>
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0, color: 'var(--text-inverse)' }}>
              安全监控面板
            </Title>
            <Space>
              <Select
                placeholder="选择账号"
                value={selectedAccount}
                onChange={setSelectedAccount}
                style={{ width: 120 }}
              >
                <Option value="default">默认账号</Option>
                <Option value="account1">账号1</Option>
                <Option value="account2">账号2</Option>
              </Select>
              <RangePicker
                showTime
                value={timeRange}
                onChange={handleTimeRangeChange}
                style={{ width: 300 }}
              />
            </Space>
          </div>
        }
        style={{ background: 'var(--bg-light-base)' }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 健康状态和告警 */}
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <HealthStatusCard
                healthStatus={healthStatus}
                onRefresh={onRefresh}
                loading={loading}
              />
            </Col>
            <Col span={16}>
              <BlockReasonsCard statistics={statistics} />
            </Col>
          </Row>
          
          {/* 统计数据 */}
          <StatisticsCards statistics={statistics} />
          
          {/* 最近检查记录 */}
          <RecentChecksTable recentChecks={recentChecks} />
          
          {/* 风险分布 */}
          {statistics && (
            <Card 
              title={<span style={{ color: 'var(--text-inverse)' }}>风险分布</span>}
              style={{ background: 'var(--bg-light-base)' }}
            >
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Statistic
                    title={<span style={{ color: 'var(--text-inverse)' }}>低风险</span>}
                    value={statistics.riskDistribution.low}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title={<span style={{ color: 'var(--text-inverse)' }}>中风险</span>}
                    value={statistics.riskDistribution.medium}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title={<span style={{ color: 'var(--text-inverse)' }}>高风险</span>}
                    value={statistics.riskDistribution.high}
                    valueStyle={{ color: '#f5222d' }}
                  />
                </Col>
              </Row>
            </Card>
          )}
        </Space>
      </Card>
    </div>
  );
};