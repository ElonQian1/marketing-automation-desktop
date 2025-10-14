// src/modules/universal-ui/ui/components/universal-publish-readiness-modal.tsx
// module: universal-ui | layer: ui | role: component
// summary: 发布准备度闸门，检查步骤分析完成度并提供补齐选项

import React, { useState, useMemo } from 'react';
import { Modal, Space, Button, Alert, Progress, Typography, List, Tag, Divider, Statistic, Row, Col } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  FileProtectOutlined 
} from '@ant-design/icons';
import type { IntelligentStepCard } from '../../types/intelligent-analysis-types';

const { Text, Paragraph } = Typography;

export interface UniversalPublishReadinessModalProps {
  /** 是否显示模态框 */
  visible: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 步骤卡片列表 */
  steps: IntelligentStepCard[];
  /** 直接发布回调 */
  onPublish: () => void;
  /** 一键完成分析后发布回调 */
  onCompleteAnalysisAndPublish: () => Promise<void>;
  /** 取消发布回调 */
  onCancel?: () => void;
  /** 自定义标题 */
  title?: string;
}

/**
 * 发布准备度闸门组件
 * 
 * 🎯 功能：
 * - 展示步骤分析完成度统计
 * - 列出待完成分析的步骤
 * - 提供"一键完成分析后再发布"选项
 * - 允许"直接发布（带兜底/快照）"
 * - 符合文档7要求：发布准备度核对
 * 
 * @example
 * ```tsx
 * <UniversalPublishReadinessModal
 *   visible={showModal}
 *   onClose={() => setShowModal(false)}
 *   steps={allSteps}
 *   onPublish={handlePublish}
 *   onCompleteAnalysisAndPublish={handleCompleteAndPublish}
 * />
 * ```
 */
export const UniversalPublishReadinessModal: React.FC<UniversalPublishReadinessModalProps> = ({
  visible,
  onClose,
  steps,
  onPublish,
  onCompleteAnalysisAndPublish,
  onCancel,
  title = '发布准备度检查'
}) => {
  const [isCompleting, setIsCompleting] = useState(false);

  /**
   * 计算统计数据
   */
  const statistics = useMemo(() => {
    const total = steps.length;
    const completed = steps.filter(s => s.analysisState === 'analysis_completed').length;
    const analyzing = steps.filter(s => s.analysisState === 'analyzing' || s.analysisState === 'pending_analysis').length;
    const pending = steps.filter(s => s.analysisState === 'idle').length;
    const failed = steps.filter(s => s.analysisState === 'analysis_failed').length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isFullyCompleted = completed === total;
    const hasPendingAnalysis = analyzing + pending > 0;

    return {
      total,
      completed,
      analyzing,
      pending,
      failed,
      completionRate,
      isFullyCompleted,
      hasPendingAnalysis
    };
  }, [steps]);

  /**
   * 获取待完成的步骤
   */
  const pendingSteps = useMemo(() => {
    return steps.filter(s => 
      s.analysisState === 'idle' || 
      s.analysisState === 'pending_analysis' ||
      s.analysisState === 'analyzing'
    );
  }, [steps]);

  /**
   * 获取失败的步骤
   */
  const failedSteps = useMemo(() => {
    return steps.filter(s => s.analysisState === 'analysis_failed');
  }, [steps]);

  /**
   * 处理一键完成分析
   */
  const handleCompleteAndPublish = async () => {
    setIsCompleting(true);
    try {
      await onCompleteAnalysisAndPublish();
    } finally {
      setIsCompleting(false);
    }
  };

  /**
   * 获取状态标签
   */
  const getStateTag = (state: string) => {
    const stateConfig = {
      'analysis_completed': { color: 'success', icon: <CheckCircleOutlined />, text: '已完成' },
      'analyzing': { color: 'processing', icon: <ClockCircleOutlined />, text: '分析中' },
      'pending_analysis': { color: 'warning', icon: <ClockCircleOutlined />, text: '等待中' },
      'idle': { color: 'default', icon: <ExclamationCircleOutlined />, text: '未开始' },
      'analysis_failed': { color: 'error', icon: <ExclamationCircleOutlined />, text: '失败' },
    };
    
    const config = stateConfig[state as keyof typeof stateConfig] || stateConfig.idle;
    
    return (
      <Tag icon={config.icon} color={config.color} className="light-theme-force">
        {config.text}
      </Tag>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <FileProtectOutlined style={{ color: 'var(--primary, #1890ff)' }} />
          <span>{title}</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel || onClose}
      width={700}
      footer={null}
      className="light-theme-force"
    >
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        {/* 完成度统计 */}
        <Alert
          type={statistics.isFullyCompleted ? 'success' : statistics.hasPendingAnalysis ? 'warning' : 'info'}
          showIcon
          message={
            <div>
              <Text strong>
                分析完成度：{statistics.completed}/{statistics.total}
              </Text>
              {statistics.isFullyCompleted && (
                <Text type="success" style={{ marginLeft: 12 }}>
                  ✅ 所有步骤已完成智能分析，可安全发布
                </Text>
              )}
            </div>
          }
          description={
            <div style={{ marginTop: 8 }}>
              <Progress 
                percent={statistics.completionRate} 
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                status={statistics.isFullyCompleted ? 'success' : 'active'}
              />
            </div>
          }
        />

        {/* 详细统计 */}
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="已完成"
              value={statistics.completed}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: 20 }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="分析中"
              value={statistics.analyzing}
              prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff', fontSize: 20 }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="待开始"
              value={statistics.pending}
              prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontSize: 20 }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="失败"
              value={statistics.failed}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f', fontSize: 20 }}
            />
          </Col>
        </Row>

        {/* 待完成步骤列表 */}
        {pendingSteps.length > 0 && (
          <>
            <Divider orientation="left">
              <Text type="secondary">待完成步骤 ({pendingSteps.length})</Text>
            </Divider>
            <List
              size="small"
              bordered
              dataSource={pendingSteps}
              className="light-theme-force"
              style={{ 
                maxHeight: 200, 
                overflow: 'auto',
                backgroundColor: 'var(--bg-light-base, #ffffff)'
              }}
              renderItem={(step, index) => (
                <List.Item
                  extra={getStateTag(step.analysisState)}
                >
                  <Space>
                    <Text type="secondary" style={{ width: 24 }}>
                      {index + 1}.
                    </Text>
                    <Text strong>{step.stepName}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ({step.stepType})
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </>
        )}

        {/* 失败步骤列表 */}
        {failedSteps.length > 0 && (
          <>
            <Divider orientation="left">
              <Text type="danger">分析失败步骤 ({failedSteps.length})</Text>
            </Divider>
            <List
              size="small"
              bordered
              dataSource={failedSteps}
              className="light-theme-force"
              style={{ 
                maxHeight: 150, 
                overflow: 'auto',
                backgroundColor: 'var(--bg-light-base, #ffffff)'
              }}
              renderItem={(step) => (
                <List.Item>
                  <Space direction="vertical" size={2}>
                    <Text strong>{step.stepName}</Text>
                    <Text type="danger" style={{ fontSize: 12 }}>
                      错误：{step.analysisError || '未知错误'}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </>
        )}

        {/* 发布说明 */}
        <Alert
          type="info"
          showIcon
          message="发布选项说明"
          description={
            <Space direction="vertical" size={4}>
              <Paragraph style={{ margin: 0, fontSize: 12 }}>
                <Text strong>• 一键完成分析后再发布：</Text>
                <br />
                <Text type="secondary">
                  对所有待完成步骤并发补齐智能分析，完成后立即发布。包内自带最新分析，接收方"开箱即用"。
                </Text>
              </Paragraph>
              <Paragraph style={{ margin: 0, fontSize: 12 }}>
                <Text strong>• 直接发布（带兜底/快照）：</Text>
                <br />
                <Text type="secondary">
                  使用当前状态发布，未完成分析的步骤使用兜底策略。包内包含元素信息和XML快照，接收方可一键重算。
                </Text>
              </Paragraph>
            </Space>
          }
        />

        {/* 操作按钮 */}
        <Divider style={{ margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button onClick={onCancel || onClose}>
            取消发布
          </Button>

          <Space>
            {statistics.hasPendingAnalysis && (
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                loading={isCompleting}
                onClick={handleCompleteAndPublish}
              >
                一键完成分析后再发布
                {statistics.hasPendingAnalysis && ` (${pendingSteps.length}个)`}
              </Button>
            )}
            
            <Button
              type={statistics.isFullyCompleted ? 'primary' : 'default'}
              icon={<RocketOutlined />}
              onClick={onPublish}
              disabled={isCompleting}
            >
              {statistics.isFullyCompleted ? '立即发布' : '直接发布（带兜底/快照）'}
            </Button>
          </Space>
        </div>
      </Space>
    </Modal>
  );
};

export default UniversalPublishReadinessModal;
