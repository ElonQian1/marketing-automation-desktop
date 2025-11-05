// src/modules/structural-matching/ui/components/parameter-inference-indicator.tsx
// module: structural-matching | layer: ui | role: 参数推断状态指示器
// summary: 显示步骤卡片参数推断状态和结果的指示器组件

import React, { useMemo } from 'react';
import { 
  Typography, 
  Alert, 
  Card, 
  Space, 
  Button, 
  Tag, 
  Progress,
  Descriptions,
  Divider,
  Empty
} from 'antd';
import { 
  SettingOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useParameterInferenceStatus } from '../hooks/use-parameter-inference-status';
import type { RuntimeInferenceResult } from '../../services/step-card-parameter-inference/runtime-parameter-inference-service';

const { Text, Paragraph } = Typography;

export interface ParameterInferenceIndicatorProps {
  /** 步骤卡片ID */
  stepCardId: string;
  /** 是否显示详细信息 */
  showDetails?: boolean;
  /** 是否显示操作按钮 */
  showActions?: boolean;
  /** 紧凑模式 */
  compact?: boolean;
}

/**
 * 获取状态显示配置
 */
const getStatusConfig = (status: string, error?: string | null) => {
  switch (status) {
    case 'completed':
      return {
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        color: 'success' as const,
        text: '推理完成',
        description: '参数推理成功完成'
      };
    case 'failed':
      return {
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        color: 'error' as const,
        text: '推理失败',
        description: error || '参数推理过程中发生错误'
      };
    case 'pending':
      return {
        icon: <LoadingOutlined style={{ color: '#1890ff' }} />,
        color: 'processing' as const,
        text: '推理中',
        description: '正在分析XML结构和推断参数'
      };
    case 'not_needed':
      return {
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        color: 'default' as const,
        text: '无需推理',
        description: '此步骤已有完整的结构匹配配置'
      };
    case 'disabled':
    default:
      return {
        icon: <ExclamationCircleOutlined style={{ color: '#d9d9d9' }} />,
        color: 'default' as const,
        text: '不可用',
        description: '此步骤类型不支持参数推理'
      };
  }
};

/**
 * 渲染推理结果详情
 */
const renderInferenceDetails = (result: RuntimeInferenceResult) => {
  if (!result.plan) {
    return null;
  }

  const plan = result.plan;
  
  return (
    <Card size="small" title="推理结果详情" style={{ marginTop: 16 }}>
      <Descriptions size="small" column={1} bordered>
        <Descriptions.Item label="策略类型">
          {plan.strategy || '未指定'}
        </Descriptions.Item>
        <Descriptions.Item label="字段配置">
          {plan.fieldConfigs ? Object.keys(plan.fieldConfigs).length : 0} 个字段
        </Descriptions.Item>
        <Descriptions.Item label="阈值设置">
          总体: {plan.globalThreshold || 0.8}
        </Descriptions.Item>
        {plan.metadata && (
          <Descriptions.Item label="元数据">
            <pre style={{ fontSize: '12px', margin: 0 }}>
              {JSON.stringify(plan.metadata, null, 2)}
            </pre>
          </Descriptions.Item>
        )}
      </Descriptions>
      
      {plan.fieldConfigs && (
        <>
          <Divider style={{ margin: '16px 0' }} />
          <div>
            <Text strong>字段配置详情:</Text>
            <div style={{ marginTop: 8 }}>
              {Object.entries(plan.fieldConfigs).map(([field, config]) => (
                <Card 
                  key={field} 
                  size="small" 
                  style={{ marginBottom: 8 }}
                  bodyStyle={{ padding: '8px 12px' }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong>{field}</Text>
                      <Tag color={config.enabled ? 'green' : 'default'}>
                        {config.enabled ? '启用' : '禁用'}
                      </Tag>
                    </div>
                    <div>
                      <Text type="secondary">权重: {config.weight}</Text>
                      <span style={{ margin: '0 8px', color: '#d9d9d9' }}>|</span>
                      <Text type="secondary">策略: {config.strategy}</Text>
                    </div>
                  </Space>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

/**
 * 参数推断状态指示器组件
 */
export const ParameterInferenceIndicator: React.FC<ParameterInferenceIndicatorProps> = ({
  stepCardId,
  showDetails = false,
  showActions = true,
  compact = false
}) => {
  const { inferenceResult, status, isInferring, error, triggerInference, clearInference } = 
    useParameterInferenceStatus(stepCardId);

  const statusConfig = useMemo(() => 
    getStatusConfig(status, error), [status, error]);

  // 紧凑模式显示
  if (compact) {
    return (
      <Space size="small">
        {statusConfig.icon}
        <Text>{statusConfig.text}</Text>
        {isInferring && <LoadingOutlined />}
      </Space>
    );
  }

  // 如果不显示详情且状态是disabled，返回简单提示
  if (!showDetails && status === 'disabled') {
    return (
      <Alert
        type="info"
        message="此步骤不支持参数推理"
        showIcon
        size="small"
      />
    );
  }

  return (
    <div className="parameter-inference-indicator">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        
        {/* 状态概览 */}
        <Alert
          type={statusConfig.color}
          message={
            <Space>
              {statusConfig.icon}
              {statusConfig.text}
              {isInferring && <Progress size="small" percent={50} status="active" showInfo={false} />}
            </Space>
          }
          description={statusConfig.description}
          showIcon={false}
          action={showActions && (
            <Space>
              {(status === 'pending' || status === 'disabled') && (
                <Button
                  size="small"
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={triggerInference}
                  loading={isInferring}
                  disabled={status === 'disabled'}
                >
                  开始推理
                </Button>
              )}
              {inferenceResult && (
                <Button
                  size="small"
                  onClick={clearInference}
                  disabled={isInferring}
                >
                  清除结果
                </Button>
              )}
            </Space>
          )}
        />

        {/* 错误详情 */}
        {error && status === 'failed' && (
          <Alert
            type="error"
            message="推理失败详情"
            description={
              <pre style={{ 
                fontSize: '12px', 
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word' 
              }}>
                {error}
              </pre>
            }
            showIcon
          />
        )}

        {/* 推理结果详情 */}
        {showDetails && inferenceResult && status === 'completed' && 
          renderInferenceDetails(inferenceResult)
        }

        {/* 空状态 */}
        {showDetails && !inferenceResult && !isInferring && status !== 'disabled' && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无推理结果"
          />
        )}
      </Space>
    </div>
  );
};

export default ParameterInferenceIndicator;