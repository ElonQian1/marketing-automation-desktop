// src/modules/structural-matching/ui/pages/structural-matching-architecture-demo.tsx
// module: structural-matching | layer: ui | role: 架构演示页面
// summary: 展示完整的最佳实践架构集成效果

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Space, 
  Typography, 
  Tabs, 
  Alert,
  Divider,
  Badge,
  Tag,
  Switch,
  message,
  Statistic,
  Progress,
  List,
  Descriptions
} from 'antd';
import { 
  ExperimentOutlined,
  MonitorOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from '@ant-design/icons';

import { 
  StructuralMatchingErrorBoundary,
  useStructuralMatchingEvents,
  useStructuralMatchingData,
  StructuralMatchingMonitoringDashboard
} from '../../index';

const { Title, Text, Paragraph } = Typography;

/**
 * 架构演示页面属性
 */
export interface StructuralMatchingArchitectureDemoProps {
  className?: string;
}



interface EventDisplay {
  id: string;
  type: string;
  timestamp: number;
  source?: string;
  payload?: unknown;
}

/**
 * 数据展示组件
 */
const DataViewer: React.FC = () => {
  const { data, loading, error } = useStructuralMatchingData({
    autoFetch: false,
    enableValidation: true,
    enableCaching: true
  });

  return (
    <Card title="统一数据服务" size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        {loading && (
          <Alert message="正在加载数据..." type="info" showIcon />
        )}
        
        {error && (
          <Alert 
            message="数据获取失败" 
            description={error.message}
            type="error" 
            showIcon 
          />
        )}
        
        {data && (
          <div>
            <div style={{ marginBottom: '12px' }}>
              <Space>
                <Tag color="blue">ID: {data.element.id || '无'}</Tag>
                <Tag color="green">文本: {data.element.text || '无'}</Tag>
                <Tag color="orange">类型: {data.element.type}</Tag>
              </Space>
            </div>
            
            {data.validation && (
              <div style={{ marginBottom: '12px' }}>
                <Text strong>验证结果: </Text>
                <Space>
                  <Badge 
                    status={data.validation.isValid ? 'success' : 'error'} 
                    text={data.validation.isValid ? '有效' : '无效'} 
                  />
                  {data.validation.score !== undefined && (
                    <Tag color={data.validation.score > 80 ? 'green' : data.validation.score > 60 ? 'orange' : 'red'}>
                      质量分: {data.validation.score}/100
                    </Tag>
                  )}
                </Space>
              </div>
            )}
            
            <div style={{ fontSize: '12px', color: '#666' }}>
              <div>创建时间: {new Date(data.dataSource.timestamp).toLocaleString()}</div>
              <div>数据源: {data.dataSource.type}</div>
            </div>
          </div>
        )}
        
        {!data && !loading && !error && (
          <Alert 
            message="暂无数据" 
            description="请启动数据模拟器或手动生成数据"
            type="warning" 
            showIcon 
          />
        )}
      </Space>
    </Card>
  );
};

/**
 * 事件监控组件
 */
const EventMonitor: React.FC = () => {
  const [events, setEvents] = useState<EventDisplay[]>([]);
  const [isListening, setIsListening] = useState(true);
  
  useStructuralMatchingEvents({
    componentId: 'EventMonitor',
    enableDebugLogs: false
  });

  // 模拟事件生成
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isListening) {
      intervalId = setInterval(() => {
        const eventTypes = ['DATA_FETCHED', 'DATA_VALIDATED', 'ERROR_OCCURRED', 'PERFORMANCE_MEASURED'];
        const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        setEvents(prev => [
          {
            id: `${Date.now()}_${Math.random()}`,
            type: randomType,
            timestamp: Date.now(),
            source: 'demo',
            payload: { simulated: true }
          },
          ...prev.slice(0, 19) // 保留最近20个事件
        ]);
      }, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      message.success('事件监听已开启');
    } else {
      message.info('事件监听已暂停');
    }
  };

  return (
    <Card 
      title="事件总线监控" 
      size="small"
      extra={
        <Switch 
          checked={isListening}
          onChange={toggleListening}
          checkedChildren="监听中"
          unCheckedChildren="已暂停"
        />
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ fontSize: '12px', color: '#666' }}>
          已捕获 {events.length} 个事件 • 监听状态: {isListening ? '活跃' : '暂停'}
        </div>
        
        <List
          size="small"
          dataSource={events.slice(0, 5)} // 只显示最近5个
          renderItem={event => (
            <List.Item>
              <Space>
                <Tag color="blue">{event.type}</Tag>
                <Text type="secondary">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </Text>
              </Space>
            </List.Item>
          )}
        />
      </Space>
    </Card>
  );
};

/**
 * 错误恢复演示
 */
const ErrorRecoveryDemo: React.FC = () => {
  const [errorCount, setErrorCount] = useState(0);
  const [recoveryCount, setRecoveryCount] = useState(0);

  const triggerError = () => {
    setErrorCount(prev => prev + 1);
    // 模拟错误恢复
    setTimeout(() => {
      setRecoveryCount(prev => prev + 1);
      message.success('错误已自动恢复');
    }, 1000);
    
    message.error('模拟错误已触发');
  };

  return (
    <Card title="智能错误恢复" size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Row gutter={16}>
          <Col span={12}>
            <Statistic title="错误次数" value={errorCount} />
          </Col>
          <Col span={12}>
            <Statistic title="恢复次数" value={recoveryCount} />
          </Col>
        </Row>
        
        <Button 
          type="primary" 
          danger 
          icon={<ThunderboltOutlined />}
          onClick={triggerError}
        >
          触发测试错误
        </Button>
        
        <Alert
          message="智能恢复策略"
          description="系统会自动检测错误类型并应用相应的恢复策略：重试、降级、缓存回退等"
          type="info"
          showIcon
        />
      </Space>
    </Card>
  );
};

/**
 * 数据模拟器组件
 */
const DataSimulator: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);

  const startSimulation = () => {
    setIsRunning(true);
    message.success('数据模拟器已启动');
    
    // 模拟数据生成
    const interval = setInterval(() => {
      setGeneratedCount(prev => prev + 1);
    }, 1000);

    // 存储interval ID以便清理
    (globalThis as { __simulationInterval?: NodeJS.Timeout }).__simulationInterval = interval;
  };

  const stopSimulation = () => {
    setIsRunning(false);
    const globalObj = globalThis as { __simulationInterval?: NodeJS.Timeout };
    if (globalObj.__simulationInterval) {
      clearInterval(globalObj.__simulationInterval);
    }
    message.info('数据模拟器已停止');
  };

  return (
    <Card title="数据模拟器" size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>生成数据: </Text>
          <Text>{generatedCount} 条</Text>
        </div>
        
        <Progress 
          percent={Math.min((generatedCount * 5) % 100, 95)} 
          size="small" 
          status={isRunning ? 'active' : 'normal'}
        />
        
        <Space>
          <Button 
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={startSimulation}
            disabled={isRunning}
          >
            启动
          </Button>
          <Button 
            icon={<PauseCircleOutlined />}
            onClick={stopSimulation}
            disabled={!isRunning}
          >
            停止
          </Button>
        </Space>
      </Space>
    </Card>
  );
};

/**
 * 性能监控组件
 */
const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState({
    responseTime: Math.floor(Math.random() * 100) + 50,
    throughput: Math.floor(Math.random() * 1000) + 500,
    errorRate: Math.random() * 5,
    cacheHitRate: Math.random() * 100
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        responseTime: Math.floor(Math.random() * 100) + 50,
        throughput: Math.floor(Math.random() * 1000) + 500,
        errorRate: Math.random() * 5,
        cacheHitRate: Math.random() * 100
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card title="性能指标" size="small">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Statistic 
            title="响应时间" 
            value={metrics.responseTime} 
            suffix="ms" 
            valueStyle={{ color: metrics.responseTime > 100 ? '#cf1322' : '#3f8600' }}
          />
        </Col>
        <Col span={12}>
          <Statistic 
            title="吞吐量" 
            value={metrics.throughput} 
            suffix="req/s" 
          />
        </Col>
        <Col span={12}>
          <Statistic 
            title="错误率" 
            value={metrics.errorRate} 
            suffix="%" 
            precision={2}
            valueStyle={{ color: metrics.errorRate > 2 ? '#cf1322' : '#3f8600' }}
          />
        </Col>
        <Col span={12}>
          <Statistic 
            title="缓存命中率" 
            value={metrics.cacheHitRate} 
            suffix="%" 
            precision={1}
            valueStyle={{ color: '#3f8600' }}
          />
        </Col>
      </Row>
    </Card>
  );
};

/**
 * 主演示组件
 */
export const StructuralMatchingArchitectureDemo: React.FC<StructuralMatchingArchitectureDemoProps> = ({ 
  className 
}) => {
  return (
    <StructuralMatchingErrorBoundary>
      <div className={className} style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>
            <ExperimentOutlined /> 结构匹配架构演示
          </Title>
          <Paragraph type="secondary">
            展示企业级架构的完整功能：统一数据服务、事件驱动通信、智能错误恢复、性能监控等
          </Paragraph>
        </div>

        <Tabs defaultActiveKey="overview">
          <Tabs.TabPane 
            tab={<span><MonitorOutlined />系统总览</span>} 
            key="overview"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={8}>
                <DataViewer />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <EventMonitor />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <PerformanceMonitor />
              </Col>
            </Row>
          </Tabs.TabPane>

          <Tabs.TabPane 
            tab={<span><SafetyOutlined />错误恢复</span>} 
            key="error-recovery"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <ErrorRecoveryDemo />
              </Col>
              <Col xs={24} lg={12}>
                <DataSimulator />
              </Col>
            </Row>
          </Tabs.TabPane>

          <Tabs.TabPane 
            tab={<span><DatabaseOutlined />监控中心</span>} 
            key="monitoring"
          >
            <StructuralMatchingMonitoringDashboard />
          </Tabs.TabPane>

          <Tabs.TabPane 
            tab={<span><SettingOutlined />架构信息</span>} 
            key="architecture"
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card title="架构特性" size="small">
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="数据统一">多源数据聚合与标准化</Descriptions.Item>
                    <Descriptions.Item label="事件驱动">组件解耦与异步通信</Descriptions.Item>
                    <Descriptions.Item label="错误恢复">智能故障检测与自动修复</Descriptions.Item>
                    <Descriptions.Item label="性能监控">实时指标收集与可视化</Descriptions.Item>
                    <Descriptions.Item label="缓存优化">多层缓存策略提升性能</Descriptions.Item>
                    <Descriptions.Item label="类型安全">完整的TypeScript类型支持</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
          </Tabs.TabPane>
        </Tabs>

        <Divider />
        
        <Alert
          message="🎉 架构优化完成"
          description="从全局变量模式升级到企业级服务架构，实现了数据统一、事件驱动、智能错误恢复和全面监控。"
          type="success"
          showIcon
          closable
        />
      </div>
    </StructuralMatchingErrorBoundary>
  );
};

export default StructuralMatchingArchitectureDemo;