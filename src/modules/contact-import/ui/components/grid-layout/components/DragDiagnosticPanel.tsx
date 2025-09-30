// 拖拽诊断面板 - 实时显示拖拽健康状态和快速修复
// 帮助开发者快速定位和修复拖拽问题

import React, { useState } from 'react';
import { Card, Button, Space, Tag, Alert, Statistic, Row, Col, Typography, Divider, Modal } from 'antd';
import { 
  HeartOutlined,
  WarningOutlined, 
  BugOutlined,
  ToolOutlined,
  ReloadOutlined,
  CodeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useDragHealthCheck } from '../hooks/useDragHealthCheck';
import { useDragRestore } from '../hooks/useDragRestore';

const { Text, Paragraph } = Typography;

interface DragDiagnosticPanelProps {
  /** 是否显示面板 */
  visible?: boolean;
  /** 面板大小 */
  size?: 'small' | 'default' | 'large';
}

/**
 * 拖拽诊断面板组件
 * 提供实时健康检查和一键修复功能
 */
export const DragDiagnosticPanel: React.FC<DragDiagnosticPanelProps> = ({
  visible = true,
  size = 'small'
}) => {
  const [showQuickFixModal, setShowQuickFixModal] = useState(false);
  
  const healthCheck = useDragHealthCheck(visible);
  const dragRestore = useDragRestore({
    enabled: visible,
    mode: 'gentle',
    debug: false
  });

  if (!visible) return null;

  const { healthCheck: report } = healthCheck;
  
  const getStatusIcon = () => {
    if (!report) return <ReloadOutlined spin />;
    switch (report.overall) {
      case 'healthy': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'degraded': return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'broken': return <BugOutlined style={{ color: '#ff4d4f' }} />;
      default: return <ReloadOutlined />;
    }
  };

  const getStatusColor = () => {
    if (!report) return 'default';
    switch (report.overall) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'broken': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = () => {
    if (!report) return '检查中...';
    switch (report.overall) {
      case 'healthy': return '健康';
      case 'degraded': return '降级';
      case 'broken': return '损坏';
      default: return '未知';
    }
  };

  const handleQuickFix = () => {
    if (!report) return;
    
    const workingRatio = report.stats.totalHandles > 0 ? 
      report.stats.workingHandles / report.stats.totalHandles : 1;
    
    if (workingRatio === 0) {
      // 完全损坏，使用重建模式
      dragRestore.triggerRestore('rebuild');
    } else if (workingRatio < 0.5) {
      // 大部分损坏，使用重置模式
      dragRestore.triggerRestore('reset');
    } else {
      // 部分问题，使用温和模式
      dragRestore.triggerRestore('gentle');
    }
    
    // 延迟重新检查
    setTimeout(() => {
      healthCheck.triggerCheck();
    }, 500);
  };

  const showQuickFixCode = () => {
    setShowQuickFixModal(true);
  };

  const renderHealthStats = () => {
    if (!report) return null;
    
    return (
      <Row gutter={8}>
        <Col span={6}>
          <Statistic
            title="总数"
            value={report.stats.totalHandles}
            valueStyle={{ fontSize: '14px' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="工作"
            value={report.stats.workingHandles}
            valueStyle={{ 
              fontSize: '14px',
              color: report.stats.workingHandles === report.stats.totalHandles ? '#52c41a' : '#ff4d4f'
            }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="可见"
            value={report.stats.visibleHandles}
            valueStyle={{ fontSize: '14px' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="光标"
            value={report.stats.cursorCorrect}
            valueStyle={{ fontSize: '14px' }}
          />
        </Col>
      </Row>
    );
  };

  const renderIssues = () => {
    if (!report || report.issues.length === 0) return null;

    const criticalIssues = report.issues.filter(i => i.type === 'critical');
    const warningIssues = report.issues.filter(i => i.type === 'warning');

    return (
      <div style={{ marginTop: 12 }}>
        {criticalIssues.length > 0 && (
          <Alert
            type="error"
            showIcon
            message={`${criticalIssues.length} 个严重问题`}
            description={criticalIssues.slice(0, 2).map(issue => issue.message).join('; ')}
            style={{ marginBottom: 8 }}
          />
        )}
        
        {warningIssues.length > 0 && (
          <Alert
            type="warning"
            showIcon
            message={`${warningIssues.length} 个警告`}
            description={warningIssues.slice(0, 2).map(issue => issue.message).join('; ')}
          />
        )}
      </div>
    );
  };

  return (
    <>
      <Card
        size={size === 'large' ? 'default' : size}
        title={
          <Space size="small">
            <HeartOutlined />
            <Text style={{ fontSize: size === 'small' ? '12px' : '14px' }}>拖拽诊断</Text>
            <Tag 
              icon={getStatusIcon()} 
              color={getStatusColor()}
              style={{ fontSize: size === 'small' ? '11px' : '12px' }}
            >
              {getStatusText()}
            </Tag>
          </Space>
        }
        extra={
          <Space size="small">
            <Button
              size="small"
              type="primary"
              icon={<ToolOutlined />}
              onClick={handleQuickFix}
              disabled={!report}
            >
              修复
            </Button>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={healthCheck.triggerCheck}
            >
              检查
            </Button>
          </Space>
        }
        style={{ marginBottom: 12 }}
        styles={{ body: { padding: size === 'small' ? '8px 12px' : '12px 16px' } }}
      >
        {/* 统计数据 */}
        {renderHealthStats()}
        
        {/* 问题列表 */}
        {renderIssues()}
        
        {/* 健康状态 */}
        {report && report.overall === 'healthy' && (
          <Alert
            type="success"
            showIcon
            message="拖拽功能正常"
            style={{ marginTop: 12 }}
          />
        )}

        {/* 操作按钮 */}
        <Divider style={{ margin: '8px 0' }} />
        <Space size="small">
          <Button
            size="small"
            icon={<CodeOutlined />}
            onClick={showQuickFixCode}
            disabled={!report}
          >
            修复代码
          </Button>
          <Button
            size="small"
            onClick={healthCheck.logHealthReport}
            disabled={!report}
          >
            控制台报告
          </Button>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            检查次数: {healthCheck.checkCount}
          </Text>
        </Space>
      </Card>

      {/* 快速修复代码模态框 */}
      <Modal
        title="快速修复代码"
        open={showQuickFixModal}
        onCancel={() => setShowQuickFixModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowQuickFixModal(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        <Paragraph>
          <Text strong>将以下代码复制到浏览器控制台执行：</Text>
        </Paragraph>
        <Paragraph>
          <Text code copyable style={{ whiteSpace: 'pre-wrap' }}>
            {healthCheck.getQuickFixCode()}
          </Text>
        </Paragraph>
        <Alert
          type="info"
          showIcon
          message="使用说明"
          description="打开浏览器开发者工具 (F12)，切换到 Console 标签，粘贴上述代码并按回车执行。"
        />
      </Modal>
    </>
  );
};

export default DragDiagnosticPanel;