// src/modules/universal-ui/components/intelligent-draggable-step-card.tsx
// module: universal-ui | layer: components | role: unified-intelligent-component
// summary: 智能拖拽步骤卡片，融合DraggableStepCard的交互能力和UnifiedStepCard的智能分析能力

import React, { useState, useMemo } from "react";
import { Card, Space, Typography, Button, Progress, Alert, Tag, Row, Col, Dropdown, Tooltip } from "antd";
import {
  DragOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  RocketOutlined,
  EyeOutlined,
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  CopyOutlined,
  MoreOutlined,
} from "@ant-design/icons";

import type { IntelligentStepCard } from "../types/intelligent-analysis-types";

const { Text } = Typography;

/**
 * 智能拖拽步骤卡片属性
 * 融合传统拖拽功能和智能分析工作流
 */
export interface IntelligentDraggableStepCardProps {
  /** 步骤卡片数据 */
  stepCard: IntelligentStepCard;
  /** 步骤索引 */
  stepIndex?: number;
  /** 自定义类名 */
  className?: string;
  
  // === 拖拽相关（来自DraggableStepCard） ===
  /** 是否支持拖拽 */
  draggable?: boolean;
  /** 是否正在拖拽 */
  isDragging?: boolean;
  /** 拖拽句柄属性 */
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;

  // === 智能分析相关（来自UnifiedStepCard） ===
  /** 升级到推荐策略 */
  onUpgradeStrategy?: () => void;
  /** 重试分析 */
  onRetryAnalysis?: () => void;
  /** 切换策略 */
  onSwitchStrategy?: (strategyKey: string, followSmart: boolean) => void;
  /** 取消分析 */
  onCancelAnalysis?: () => void;

  // === 传统操作相关（来自DraggableStepCard） ===
  /** 编辑步骤 */
  onEdit?: () => void;
  /** 删除步骤 */
  onDelete?: () => void;
  /** 测试步骤 */
  onTest?: () => void;
  /** 复制步骤 */
  onCopy?: () => void;
  /** 查看详情 */
  onViewDetails?: () => void;
  /** 切换启用/禁用 */
  onToggle?: () => void;

  // === 高级配置 ===
  /** 显示调试信息 */
  showDebugInfo?: boolean;
  /** 显示智能分析功能 */
  enableIntelligentAnalysis?: boolean;
  /** 显示传统拖拽功能 */
  enableDraggableFeatures?: boolean;
}

/**
 * 智能拖拽步骤卡片
 * 
 * 🎯 设计理念：
 * 1. 保留DraggableStepCard的完整交互能力
 * 2. 集成UnifiedStepCard的智能分析工作流
 * 3. 通过特性开关灵活控制功能启用
 * 4. 统一命名规范，符合项目规范
 */
export const IntelligentDraggableStepCard: React.FC<IntelligentDraggableStepCardProps> = ({
  stepCard,
  stepIndex,
  className = "",
  draggable = true,
  isDragging = false,
  dragHandleProps,
  onUpgradeStrategy,
  onRetryAnalysis,
  onSwitchStrategy,
  onCancelAnalysis,
  onEdit,
  onDelete,
  onTest,
  onCopy,
  onViewDetails,
  onToggle,
  showDebugInfo = false,
  enableIntelligentAnalysis = true,
  enableDraggableFeatures = true,
}) => {
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);

  /**
   * 获取智能分析状态条（来自UnifiedStepCard逻辑）
   */
  const analysisStatusBar = useMemo(() => {
    if (!enableIntelligentAnalysis) return null;

    switch (stepCard.analysisState) {
      case "analyzing":
        return {
          type: "info" as const,
          message: "🧠 智能分析进行中...",
          description: `${stepCard.analysisProgress}%｜预计 2s（暂用兜底策略可执行）`,
          icon: <LoadingOutlined />,
          showProgress: true,
          actionButton: (
            <Button size="small" type="text" icon={<LoadingOutlined />} onClick={onCancelAnalysis}>
              取消分析
            </Button>
          ),
        };

      case "analysis_completed":
        const hasUpgrade = stepCard.recommendedStrategy && stepCard.recommendedStrategy.confidence >= 0.82;
        return hasUpgrade ? {
          type: "warning" as const,
          message: `发现更优策略：${stepCard.recommendedStrategy?.name}`,
          description: `（${Math.round((stepCard.recommendedStrategy?.confidence || 0) * 100)}%）`,
          icon: <RocketOutlined />,
          showProgress: false,
          actionButton: (
            <Button size="small" type="primary" icon={<RocketOutlined />} onClick={onUpgradeStrategy}>
              一键升级
            </Button>
          ),
        } : {
          type: "success" as const,
          message: "✅ 智能分析完成",
          description: `已应用最佳策略`,
          icon: <CheckCircleOutlined />,
          showProgress: false,
          actionButton: null,
        };

      case "analysis_failed":
        return {
          type: "error" as const,
          message: "❌ 智能分析失败：超时/上下文不足",
          icon: <ExclamationCircleOutlined />,
          showProgress: false,
          actionButton: (
            <Button size="small" icon={<ReloadOutlined />} onClick={onRetryAnalysis}>
              重试分析
            </Button>
          ),
        };

      default:
        return null;
    }
  }, [stepCard, enableIntelligentAnalysis, onUpgradeStrategy, onRetryAnalysis, onCancelAnalysis]);

  /**
   * 操作菜单项（融合传统和智能功能）
   */
  const menuItems = useMemo(() => {
    const items = [];

    // 传统操作
    if (enableDraggableFeatures) {
      if (onEdit) {
        items.push({
          key: 'edit',
          icon: <EditOutlined />,
          label: '编辑步骤',
          onClick: onEdit,
        });
      }
      if (onCopy) {
        items.push({
          key: 'copy',
          icon: <CopyOutlined />,
          label: '复制步骤',
          onClick: onCopy,
        });
      }
      if (onToggle) {
        items.push({
          key: 'toggle',
          icon: <SettingOutlined />,
          label: '切换启用状态',
          onClick: onToggle,
        });
      }
    }

    // 智能分析操作
    if (enableIntelligentAnalysis) {
      if (items.length > 0) {
        items.push({ type: 'divider' });
      }
      
      items.push({
        key: 'analysis-details',
        icon: <ThunderboltOutlined />,
        label: '智能分析详情',
        onClick: () => setShowAnalysisDetails(!showAnalysisDetails),
      });

      if (onRetryAnalysis) {
        items.push({
          key: 'retry-analysis',
          icon: <ReloadOutlined />,
          label: '重新分析',
          onClick: onRetryAnalysis,
        });
      }
    }

    // 危险操作
    if (onDelete) {
      if (items.length > 0) {
        items.push({ type: 'divider' });
      }
      items.push({
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除步骤',
        onClick: onDelete,
        danger: true,
      });
    }

    return items;
  }, [
    enableDraggableFeatures, 
    enableIntelligentAnalysis, 
    onEdit, onCopy, onToggle, onDelete, onRetryAnalysis,
    showAnalysisDetails
  ]);

  return (
    <Card
      className={`intelligent-draggable-step-card light-theme-force ${className} ${isDragging ? 'dragging' : ''}`}
      style={{
        opacity: isDragging ? 0.7 : 1,
        transform: isDragging ? 'rotate(2deg) scale(0.98)' : 'none',
        transition: isDragging ? 'none' : 'all 0.2s ease',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.2)' : undefined,
      }}
      title={
        <Row justify="space-between" align="middle">
          <Col flex="1">
            <Space>
              {/* 拖拽句柄 */}
              {draggable && enableDraggableFeatures && (
                <div
                  {...dragHandleProps}
                  style={{ 
                    cursor: isDragging ? 'grabbing' : 'grab',
                    padding: '4px',
                    borderRadius: '4px',
                    background: isDragging ? '#f0f0f0' : 'transparent'
                  }}
                >
                  <DragOutlined />
                </div>
              )}
              
              <Text strong>
                {stepIndex ? `步骤 ${stepIndex}` : stepCard.stepName}
              </Text>
              
              <Tag color="blue">{stepCard.stepType}</Tag>
              
              {/* 当前策略标签 */}
              {stepCard.activeStrategy && (
                <Tag 
                  color={stepCard.activeStrategy === stepCard.fallbackStrategy ? "orange" : "green"}
                  icon={<ThunderboltOutlined />}
                >
                  {stepCard.activeStrategy.name}
                  {stepCard.activeStrategy === stepCard.fallbackStrategy && " (兜底)"}
                </Tag>
              )}
            </Space>
          </Col>
          
          <Col>
            <Space>
              {/* 快速测试按钮 */}
              {enableDraggableFeatures && onTest && (
                <Tooltip title="测试步骤">
                  <Button size="small" type="text" icon={<PlayCircleOutlined />} onClick={onTest} />
                </Tooltip>
              )}
              
              {/* 查看详情按钮 */}
              {onViewDetails && (
                <Tooltip title="查看详情">
                  <Button size="small" type="text" icon={<EyeOutlined />} onClick={onViewDetails} />
                </Tooltip>
              )}
              
              {/* 更多操作菜单 */}
              <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                <Button size="small" type="text" icon={<MoreOutlined />} />
              </Dropdown>
            </Space>
          </Col>
        </Row>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {/* 智能分析状态条 */}
        {analysisStatusBar && (
          <Alert
            type={analysisStatusBar.type}
            message={analysisStatusBar.message}
            description={analysisStatusBar.description}
            icon={analysisStatusBar.icon}
            showIcon
            action={analysisStatusBar.actionButton}
          />
        )}

        {/* 智能分析进度条 */}
        {analysisStatusBar?.showProgress && (
          <Progress
            percent={stepCard.analysisProgress}
            size="small"
            status="active"
            format={() => `${stepCard.analysisProgress}%`}
          />
        )}

        {/* 策略信息展示（智能分析功能） */}
        {enableIntelligentAnalysis && stepCard.activeStrategy && (
          <div className="strategy-info" style={{ 
            padding: '12px', 
            background: 'var(--bg-light-base, #f8fafc)', 
            borderRadius: '6px',
            border: '1px solid var(--border-light, #e2e8f0)'
          }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Text strong>当前策略: {stepCard.activeStrategy.name}</Text>
              </Col>
              <Col>
                <Tag color="blue">
                  置信度: {Math.round(stepCard.activeStrategy.confidence * 100)}%
                </Tag>
              </Col>
            </Row>
            <Text type="secondary" className="text-sm">
              {stepCard.activeStrategy.description}
            </Text>
          </div>
        )}

        {/* 智能分析详情（可折叠） */}
        {enableIntelligentAnalysis && showAnalysisDetails && stepCard.smartCandidates.length > 0 && (
          <div className="analysis-details" style={{ 
            padding: '12px', 
            background: 'var(--bg-light-base, #f0f9ff)', 
            borderRadius: '6px',
            border: '1px solid var(--border-light, #bfdbfe)'
          }}>
            <Text strong className="block mb-2">可选策略:</Text>
            <Space direction="vertical" style={{ width: '100%' }}>
              {stepCard.smartCandidates.slice(0, 3).map((candidate) => (
                <Row key={candidate.key} justify="space-between" align="middle">
                  <Col flex="1">
                    <Space direction="vertical">
                      <Text>{candidate.name}</Text>
                      <Text type="secondary" className="text-xs">
                        {candidate.description}
                      </Text>
                    </Space>
                  </Col>
                  <Col>
                    <Space>
                      <Tag color={candidate.confidence > 0.8 ? "green" : "blue"}>
                        {Math.round(candidate.confidence * 100)}%
                      </Tag>
                      <Button 
                        size="small" 
                        type="link"
                        onClick={() => onSwitchStrategy?.(candidate.key, true)}
                      >
                        切换
                      </Button>
                    </Space>
                  </Col>
                </Row>
              ))}
            </Space>
          </div>
        )}

        {/* 调试信息 */}
        {showDebugInfo && (
          <details style={{ fontSize: '12px', color: '#666' }}>
            <summary>调试信息</summary>
            <pre style={{ fontSize: '11px', marginTop: '8px', overflow: 'auto' }}>
              {JSON.stringify({
                stepId: stepCard.stepId,
                analysisState: stepCard.analysisState,
                strategyMode: stepCard.strategyMode,
                selectionHash: stepCard.selectionHash?.slice(0, 8) + "...",
                enableIntelligentAnalysis,
                enableDraggableFeatures,
              }, null, 2)}
            </pre>
          </details>
        )}
      </Space>
    </Card>
  );
};

export default IntelligentDraggableStepCard;