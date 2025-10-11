// src/modules/contact-import/ui/components/grid-layout/components/DragStatusPanel.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

// 拖拽状态面板 - 可视化显示拖拽状态和诊断信息
// 提供实时的拖拽问题监控和一键修复功能

import React, { useState } from 'react';
import { Card, Button, Space, Tag, Alert, Collapse, Typography, Row, Col, Statistic } from 'antd';
import { 
  BugOutlined, 
  ToolOutlined, 
  ReloadOutlined, 
  CheckCircleOutlined, 
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useDragDiagnostic } from '../hooks/useDragDiagnostic';
import { useDragFixer } from '../hooks/useDragFixer';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface DragStatusPanelProps {
  /** 是否显示面板 */
  visible?: boolean;
  /** 是否自动诊断 */
  autoDiagnose?: boolean;
  /** 修复强度 */
  fixerIntensity?: 'gentle' | 'moderate' | 'aggressive';
}

/**
 * 拖拽状态面板组件
 * 提供实时的拖拽状态监控和问题修复功能
 */
export const DragStatusPanel: React.FC<DragStatusPanelProps> = ({
  visible = true,
  autoDiagnose = true,
  fixerIntensity = 'moderate'
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const diagnostic = useDragDiagnostic(autoDiagnose);
  const fixer = useDragFixer({
    enabled: true,
    intensity: fixerIntensity,
    debug: process.env.NODE_ENV === 'development'
  });

  if (!visible) return null;

  const { report } = diagnostic;
  const hasConflicts = report?.conflicts.length ?? 0 > 0;
  const hasRecommendations = report?.recommendations.length ?? 0 > 0;

  const getStatusColor = () => {
    if (!report) return 'default';
    if (hasConflicts) return 'error';
    if (hasRecommendations) return 'warning';
    return 'success';
  };

  const getStatusText = () => {
    if (!report) return '检测中...';
    if (hasConflicts) return '发现问题';
    if (hasRecommendations) return '需要优化';
    return '正常运行';
  };

  const handleQuickFix = () => {
    fixer.triggerManualFix();
    diagnostic.triggerDiagnostic();
  };

  const handleShowConsoleReport = () => {
    diagnostic.logReport();
  };

  return (
    <Card
      size="small"
      title={
        <Space>
          <BugOutlined />
          拖拽状态监控
          <Tag color={getStatusColor()}>{getStatusText()}</Tag>
        </Space>
      }
      extra={
        <Space>
          <Button
            size="small"
            icon={<ToolOutlined />}
            type="primary"
            onClick={handleQuickFix}
          >
            一键修复
          </Button>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={diagnostic.triggerDiagnostic}
          >
            重新检测
          </Button>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      {/* 状态概览 */}
      {report && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic
              title="拖拽手柄"
              value={report.resizeHandles.clickable}
              suffix={`/ ${report.resizeHandles.count}`}
              valueStyle={{ 
                color: report.resizeHandles.clickable === report.resizeHandles.count ? '#3f8600' : '#cf1322' 
              }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="DnD上下文"
              value={report.dndContexts.dndKit + report.dndContexts.reactBeautifulDnd}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="修复次数"
              value={fixer.fixCount}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="事件监听器"
              value={report.eventListeners.pointerEvents + report.eventListeners.dragEvents}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
        </Row>
      )}

      {/* 冲突警告 */}
      {hasConflicts && (
        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined />}
          message="检测到拖拽冲突"
          description={
            <ul style={{ marginBottom: 0 }}>
              {report?.conflicts.map((conflict, index) => (
                <li key={index}>{conflict}</li>
              ))}
            </ul>
          }
          style={{ marginBottom: 12 }}
          action={
            <Button size="small" type="text" onClick={handleQuickFix}>
              立即修复
            </Button>
          }
        />
      )}

      {/* 建议提示 */}
      {hasRecommendations && !hasConflicts && (
        <Alert
          type="warning"
          showIcon
          icon={<InfoCircleOutlined />}
          message="优化建议"
          description={
            <ul style={{ marginBottom: 0 }}>
              {report?.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          }
          style={{ marginBottom: 12 }}
        />
      )}

      {/* 正常状态 */}
      {!hasConflicts && !hasRecommendations && report && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          message="拖拽状态正常"
          description="所有拖拽功能运行正常，未发现冲突。"
          style={{ marginBottom: 12 }}
        />
      )}

      {/* 详细信息 */}
      <Collapse 
        ghost 
        size="small"
        activeKey={showDetails ? ['details'] : []}
        onChange={(keys) => setShowDetails(keys.includes('details'))}
      >
        <Panel header="详细诊断信息" key="details">
          {report && (
            <div>
              <Paragraph>
                <Text strong>检测时间: </Text>
                <Text code>{new Date(report.timestamp).toLocaleString()}</Text>
              </Paragraph>

              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text strong>列宽拖拽手柄:</Text>
                  <br />
                  <Text>总数: {report.resizeHandles.count}</Text>
                  <br />
                  <Text>可见: {report.resizeHandles.visible}</Text>
                  <br />
                  <Text>可点击: {report.resizeHandles.clickable}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>DnD上下文:</Text>
                  <br />
                  <Text>@dnd-kit: {report.dndContexts.dndKit}</Text>
                  <br />
                  <Text>react-beautiful-dnd: {report.dndContexts.reactBeautifulDnd}</Text>
                  <br />
                  <Text>其他: {report.dndContexts.other}</Text>
                </Col>
              </Row>

              <div style={{ marginTop: 16 }}>
                <Space>
                  <Button size="small" onClick={handleShowConsoleReport}>
                    查看控制台报告
                  </Button>
                  <Text type="secondary">
                    修复器状态: {fixer.isActive ? '活跃' : '待机'}
                  </Text>
                  <Text type="secondary">
                    强度: {fixerIntensity}
                  </Text>
                </Space>
              </div>
            </div>
          )}
        </Panel>
      </Collapse>
    </Card>
  );
};

export default DragStatusPanel;