/**
 * 后端接口验证控制台
 * 
 * 提供后端接口验证、测试和监控功能
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Progress, 
  Alert, 
  Space, 
  Tag, 
  Statistic, 
  Row, 
  Col,
  Descriptions,
  message,
  Spin,
  Typography,
  Collapse
} from 'antd';
import { 
  PlayCircleOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  ApiOutlined,
  BugOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { BackendInterfaceValidationService, BackendTestResult, ValidationReport } from '../services/BackendInterfaceValidationService';

const { Title, Text } = Typography;
const { Panel } = Collapse;

interface BackendValidationConsoleProps {
  onValidationComplete?: (report: ValidationReport) => void;
}

/**
 * 后端验证控制台
 */
export const BackendValidationConsole: React.FC<BackendValidationConsoleProps> = ({
  onValidationComplete
}) => {
  const [validationService] = useState(() => new BackendInterfaceValidationService());
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [currentTest, setCurrentTest] = useState<string>('');

  /**
   * 运行完整验证
   */
  const runFullValidation = async () => {
    setLoading(true);
    setCurrentTest('初始化验证...');
    
    try {
      const validationReport = await validationService.runFullValidation();
      setReport(validationReport);
      
      if (validationReport.summary.failedTests === 0) {
        message.success('所有接口验证通过！');
      } else {
        message.warning(`验证完成，${validationReport.summary.failedTests} 个接口存在问题`);
      }
      
      onValidationComplete?.(validationReport);
      
    } catch (error) {
      message.error(`验证过程出错：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
      setCurrentTest('');
    }
  };

  /**
   * 测试数据库连接
   */
  const testDatabase = async () => {
    setLoading(true);
    setCurrentTest('测试数据库连接...');
    
    try {
      const result = await validationService.testDatabaseConnection();
      
      if (result.success) {
        message.success(`数据库连接正常，响应时间：${result.responseTime}ms`);
      } else {
        message.error(`数据库连接失败：${result.error}`);
      }
      
    } catch (error) {
      message.error(`数据库测试出错：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
      setCurrentTest('');
    }
  };

  /**
   * 渲染统计概览
   */
  const renderSummary = () => {
    if (!report) return null;
    
    const { summary } = report;
    const successRate = Math.round((summary.passedTests / summary.totalTests) * 100);
    
    return (
      <Card title="验证概览" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="总测试数"
              value={summary.totalTests}
              prefix={<ApiOutlined style={{ color: '#1890ff' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="通过数"
              value={summary.passedTests}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="失败数"
              value={summary.failedTests}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均响应时间"
              value={`${summary.averageResponseTime}ms`}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
            />
          </Col>
        </Row>
        
        <div style={{ marginTop: 16 }}>
          <Text strong>成功率: </Text>
          <Progress 
            percent={successRate} 
            status={successRate === 100 ? 'success' : successRate > 80 ? 'active' : 'exception'}
            format={() => `${successRate}%`}
          />
        </div>
      </Card>
    );
  };

  /**
   * 渲染控制按钮
   */
  const renderControls = () => (
    <Card title="验证控制" style={{ marginBottom: 16 }}>
      <Space>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          loading={loading}
          onClick={runFullValidation}
        >
          完整验证
        </Button>
        
        <Button
          icon={<DatabaseOutlined />}
          loading={loading}
          onClick={testDatabase}
        >
          测试数据库
        </Button>
        
        {report && (
          <Button
            icon={<BugOutlined />}
            onClick={() => validationService.cleanupTestData()}
          >
            清理测试数据
          </Button>
        )}
      </Space>
      
      {loading && currentTest && (
        <div style={{ marginTop: 16 }}>
          <Spin size="small" /> <Text type="secondary">{currentTest}</Text>
        </div>
      )}
    </Card>
  );

  /**
   * 结果表格列定义
   */
  const resultColumns = [
    {
      title: '接口名称',
      dataIndex: 'interface',
      key: 'interface',
      render: (name: string) => <code>{name}</code>
    },
    {
      title: '状态',
      dataIndex: 'success',
      key: 'success',
      render: (success: boolean) => (
        <Tag color={success ? 'green' : 'red'} icon={success ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}>
          {success ? '成功' : '失败'}
        </Tag>
      )
    },
    {
      title: '响应时间',
      dataIndex: 'responseTime',
      key: 'responseTime',
      render: (time: number) => {
        let color = 'green';
        if (time > 1000) color = 'red';
        else if (time > 500) color = 'orange';
        
        return <Tag color={color}>{time}ms</Tag>;
      }
    },
    {
      title: '错误信息',
      dataIndex: 'error',
      key: 'error',
      render: (error: string) => error ? (
        <Text type="danger" style={{ fontSize: '12px' }}>
          {error.length > 50 ? error.substring(0, 50) + '...' : error}
        </Text>
      ) : '-'
    }
  ];

  /**
   * 渲染建议
   */
  const renderRecommendations = () => {
    if (!report || report.recommendations.length === 0) return null;
    
    return (
      <Card title="优化建议" style={{ marginBottom: 16 }}>
        {report.recommendations.map((recommendation, index) => (
          <Alert
            key={index}
            message={recommendation}
            type={report.summary.failedTests > 0 ? 'warning' : 'info'}
            style={{ marginBottom: 8 }}
          />
        ))}
      </Card>
    );
  };

  /**
   * 按模块分组显示结果
   */
  const renderGroupedResults = () => {
    if (!report) return null;
    
    const groupedResults = report.results.reduce((groups: { [key: string]: BackendTestResult[] }, result) => {
      let group = '其他';
      
      if (result.interface.includes('watch_target')) group = '候选池模块';
      else if (result.interface.includes('comment')) group = '评论模块';
      else if (result.interface.includes('task')) group = '任务模块';
      else if (result.interface.includes('audit')) group = '审计日志模块';
      else if (result.interface.includes('dedup')) group = '去重模块';
      
      if (!groups[group]) groups[group] = [];
      groups[group].push(result);
      
      return groups;
    }, {});
    
    return (
      <Card title="详细测试结果">
        <Collapse>
          {Object.entries(groupedResults).map(([groupName, groupResults]) => {
            const failedCount = groupResults.filter(r => !r.success).length;
            const panelHeader = (
              <Space>
                <span>{groupName}</span>
                <Tag color={failedCount > 0 ? 'red' : 'green'}>
                  {groupResults.length - failedCount}/{groupResults.length} 通过
                </Tag>
              </Space>
            );
            
            return (
              <Panel key={groupName} header={panelHeader}>
                <Table
                  dataSource={groupResults}
                  columns={resultColumns}
                  rowKey="interface"
                  size="small"
                  pagination={false}
                />
              </Panel>
            );
          })}
        </Collapse>
      </Card>
    );
  };

  return (
    <div className="light-theme-force" style={{ background: 'var(--bg-light-base)', padding: 16 }}>
      <Title level={3}>
        <ApiOutlined /> 后端接口验证控制台
      </Title>
      
      {renderControls()}
      {renderSummary()}
      {renderRecommendations()}
      {renderGroupedResults()}
    </div>
  );
};

export default BackendValidationConsole;