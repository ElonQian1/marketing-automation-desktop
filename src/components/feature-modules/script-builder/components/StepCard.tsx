/**
 * 脚本步骤卡片组件
 * 显示单个脚本步骤的信息，支持拖拽、编辑、删除等操作
 */

import React, { useState } from 'react';
import {
  Card,
  Tag,
  Button,
  Dropdown,
  Space,
  Tooltip,
  Progress,
  Typography,
  Switch,
  MenuProps,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  DragOutlined,
  MoreOutlined,
  EyeOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ScriptStep, StepStatus, StepValidation } from '../types';

const { Text, Paragraph } = Typography;

/**
 * 步骤状态颜色映射
 */
const STATUS_COLORS: Record<StepStatus, string> = {
  pending: 'default',
  running: 'processing',
  completed: 'success',
  failed: 'error',
  skipped: 'warning',
};

/**
 * 步骤状态图标映射
 */
const STATUS_ICONS: Record<StepStatus, React.ReactNode> = {
  pending: <ClockCircleOutlined />,
  running: <PlayCircleOutlined spin />,
  completed: <CheckCircleOutlined />,
  failed: <ExclamationCircleOutlined />,
  skipped: <PauseCircleOutlined />,
};

/**
 * 步骤类型图标映射
 */
const TYPE_ICONS: Record<string, React.ReactNode> = {
  tap: '👆',
  input: '✏️',
  swipe: '👆',
  wait: '⏱️',
  screenshot: '📷',
  loop: '🔄',
  condition: '❓',
  custom: '⚙️',
};

/**
 * StepCard 组件属性
 */
interface StepCardProps {
  /** 步骤数据 */
  step: ScriptStep;
  /** 步骤索引 */
  index: number;
  /** 是否选中 */
  isSelected?: boolean;
  /** 是否正在执行 */
  isExecuting?: boolean;
  /** 执行进度（0-100） */
  executionProgress?: number;
  /** 验证结果 */
  validation?: StepValidation;
  /** 是否可拖拽 */
  draggable?: boolean;
  /** 是否显示详细信息 */
  showDetails?: boolean;
  /** 点击步骤时的回调 */
  onStepClick?: (step: ScriptStep) => void;
  /** 编辑步骤 */
  onEdit?: (step: ScriptStep) => void;
  /** 删除步骤 */
  onDelete?: (stepId: string) => void;
  /** 复制步骤 */
  onDuplicate?: (stepId: string) => void;
  /** 切换启用状态 */
  onToggleEnabled?: (stepId: string, enabled: boolean) => void;
  /** 运行单个步骤 */
  onRunSingle?: (stepId: string) => void;
  /** 查看步骤详情 */
  onViewDetails?: (step: ScriptStep) => void;
  /** 开始拖拽 */
  onDragStart?: (e: React.DragEvent, step: ScriptStep, index: number) => void;
  /** 拖拽结束 */
  onDragEnd?: (e: React.DragEvent) => void;
}

/**
 * 步骤卡片组件
 */
export const StepCard: React.FC<StepCardProps> = ({
  step,
  index,
  isSelected = false,
  isExecuting = false,
  executionProgress,
  validation,
  draggable = true,
  showDetails = false,
  onStepClick,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleEnabled,
  onRunSingle,
  onViewDetails,
  onDragStart,
  onDragEnd,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // 更多操作菜单
  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: '编辑步骤',
      icon: <EditOutlined />,
      onClick: () => onEdit?.(step),
    },
    {
      key: 'duplicate',
      label: '复制步骤',
      icon: <CopyOutlined />,
      onClick: () => onDuplicate?.(step.id),
    },
    {
      key: 'run',
      label: '单独运行',
      icon: <PlayCircleOutlined />,
      onClick: () => onRunSingle?.(step.id),
      disabled: !step.enabled,
    },
    {
      key: 'details',
      label: '查看详情',
      icon: <EyeOutlined />,
      onClick: () => onViewDetails?.(step),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: '删除步骤',
      danger: true,
      onClick: () => onDelete?.(step.id),
    },
  ];

  // 获取验证状态
  const getValidationStatus = () => {
    if (!validation) return null;
    if (!validation.isValid) return 'error';
    if (validation.warnings.length > 0) return 'warning';
    return 'success';
  };

  const validationStatus = getValidationStatus();

  // 渲染步骤参数摘要
  const renderParameterSummary = () => {
    const { parameters } = step;
    const summary: string[] = [];

    switch (step.type) {
      case 'tap':
        if (parameters.matching?.fields) {
          summary.push(`匹配: ${parameters.matching.fields.join(', ')}`);
        }
        if (parameters.coordinates) {
          const coords = parameters.coordinates as { x: number; y: number };
          summary.push(`坐标: (${coords.x}, ${coords.y})`);
        }
        break;

      case 'input':
        const inputParams = parameters as any;
        if (inputParams.text) {
          const displayText = inputParams.hidden 
            ? '***' 
            : inputParams.text.length > 20 
              ? `${inputParams.text.substring(0, 20)}...` 
              : inputParams.text;
          summary.push(`文本: ${displayText}`);
        }
        break;

      case 'swipe':
        const swipeParams = parameters as any;
        if (swipeParams.direction) {
          summary.push(`方向: ${swipeParams.direction}`);
        }
        if (swipeParams.distance) {
          summary.push(`距离: ${swipeParams.distance}px`);
        }
        break;

      case 'wait':
        const waitParams = parameters as any;
        if (waitParams.duration) {
          summary.push(`时间: ${waitParams.duration}ms`);
        }
        if (waitParams.condition) {
          summary.push(`条件: ${waitParams.condition.type}`);
        }
        break;

      case 'loop':
        const loopParams = parameters as any;
        if (loopParams.iterations) {
          summary.push(`次数: ${loopParams.iterations}`);
        }
        break;
    }

    if (parameters.delay) {
      summary.push(`延迟: ${parameters.delay}ms`);
    }

    return summary.join(' | ');
  };

  return (
    <Card
      size="small"
      className={`step-card ${isSelected ? 'selected' : ''} ${!step.enabled ? 'disabled' : ''}`}
      style={{
        marginBottom: 8,
        cursor: 'pointer',
        border: isSelected ? '2px solid #1890ff' : undefined,
        opacity: step.enabled ? 1 : 0.6,
        transition: 'all 0.2s ease',
        boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.1)' : undefined,
      }}
      bodyStyle={{ padding: '12px 16px' }}
      draggable={draggable && !isExecuting}
      onDragStart={(e) => onDragStart?.(e, step, index)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
    onClick={() => onStepClick?.(step)}
    >
      {/* 执行进度条 */}
      {isExecuting && executionProgress !== undefined && (
        <Progress
          percent={executionProgress}
          size="small"
          showInfo={false}
          style={{ marginBottom: 8 }}
        />
      )}

      <div className="step-card-content">
        {/* 头部：拖拽句柄、索引、类型图标、名称 */}
        <div className="step-card-header" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 8 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            {draggable && (
              <DragOutlined 
                style={{ 
                  marginRight: 8, 
                  cursor: 'grab',
                  color: '#999',
                  opacity: isHovered ? 1 : 0.5,
                }} 
              />
            )}
            
            <Tag color="blue" style={{ margin: 0, marginRight: 8, fontSize: '12px' }}>
              {index + 1}
            </Tag>
            
            <span style={{ marginRight: 8, fontSize: '16px' }}>
              {TYPE_ICONS[step.type] || '⚙️'}
            </span>
            
            <Text strong style={{ 
              marginRight: 8, 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}>
              {step.name}
            </Text>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* 验证状态 */}
            {validationStatus && (
              <Tooltip title={
                validation && !validation.isValid 
                  ? validation.errors.join(', ')
                  : validation?.warnings.join(', ') || '验证通过'
              }>
                <ExclamationCircleOutlined 
                  style={{ 
                    color: validationStatus === 'error' 
                      ? '#ff4d4f' 
                      : validationStatus === 'warning' 
                        ? '#faad14' 
                        : '#52c41a'
                  }} 
                />
              </Tooltip>
            )}

            {/* 步骤状态 */}
            <Tag 
              color={STATUS_COLORS[step.status]} 
              icon={STATUS_ICONS[step.status]}
              style={{ margin: 0 }}
            >
              {step.status}
            </Tag>

            {/* 启用/禁用开关 */}
            <Switch
              size="small"
              checked={step.enabled}
              onChange={(checked) => onToggleEnabled?.(step.id, checked)}
              onClick={(e: any) => e?.stopPropagation?.()}
            />

            {/* 更多操作 */}
            <Dropdown 
              menu={{ items: moreMenuItems }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button 
                type="text" 
                size="small" 
                icon={<MoreOutlined />}
                onClick={(e: any) => e?.stopPropagation?.()}
              />
            </Dropdown>
          </div>
        </div>

        {/* 描述 */}
        {step.description && (
          <Paragraph 
            style={{ 
              margin: '4px 0 8px 0', 
              fontSize: '13px', 
              color: '#666',
              lineHeight: '1.4',
            }}
            ellipsis={{ rows: 2, tooltip: step.description }}
          >
            {step.description}
          </Paragraph>
        )}

        {/* 参数摘要 */}
        {showDetails && (
          <div style={{ 
            fontSize: '12px', 
            color: '#888',
            background: '#f5f5f5',
            padding: '6px 8px',
            borderRadius: 4,
            marginTop: 8,
          }}>
            {renderParameterSummary() || '无参数'}
          </div>
        )}

        {/* 错误信息 */}
        {step.error && (
          <div style={{
            marginTop: 8,
            padding: '6px 8px',
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: 4,
            fontSize: '12px',
            color: '#ff4d4f',
          }}>
            错误: {step.error}
          </div>
        )}

        {/* 执行时间 */}
        {step.duration !== undefined && (
          <div style={{ 
            marginTop: 8, 
            fontSize: '12px', 
            color: '#999',
            textAlign: 'right',
          }}>
            执行时间: {step.duration}ms
          </div>
        )}
      </div>
    </Card>
  );
};