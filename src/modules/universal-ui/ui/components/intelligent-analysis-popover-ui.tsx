// src/modules/universal-ui/ui/components/intelligent-analysis-popover-ui.tsx
// module: universal-ui | layer: ui | role: component  
// summary: 智能分析气泡UI组件 - 负责展示分析相关的按钮和状态（UI展示层）

import React, { useState, useCallback } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Progress, 
  Alert, 
  Divider,
  Tag,
  Switch
} from 'antd';
import {
  ThunderboltOutlined,
  CheckOutlined,
  SearchOutlined,
  CloseOutlined,
  EyeInvisibleOutlined,
  LoadingOutlined,
  LockOutlined,
  CodeOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { useIntelligentAnalysisWorkflow } from "../../hooks/use-intelligent-analysis-workflow";
import type { ElementSelectionContext } from "../../types/intelligent-analysis-types";

const { Text } = Typography;

/**
 * 气泡状态
 */
export type PopoverState = 'idle' | 'analyzing' | 'analyzed' | 'failed';

/**
 * 智能分析气泡UI组件属性
 * 
 * 职责：
 * - 展示智能分析相关的按钮（🧠 智能分析、✅ 直接确定等）
 * - 显示分析进度和状态
 * - 提供锁定容器、XPath预览等辅助功能的UI
 * - 纯UI组件，不包含业务逻辑
 */
export interface IntelligentAnalysisPopoverUIProps {
  /** 元素选择上下文 */
  elementContext: ElementSelectionContext;
  /** 气泡状态 */
  state: PopoverState;
  /** 分析进度 0-100 */
  analysisProgress?: number;
  /** 预计剩余时间（毫秒） */
  estimatedTimeLeft?: number;
  /** 是否锁定容器 */
  lockContainer?: boolean;
  /** 是否显示XPath预览 */
  showXPathPreview?: boolean;
  /** 是否可见 */
  visible?: boolean;
  
  // 事件回调
  /** 启动智能分析 */
  onStartAnalysis?: () => void;
  /** 直接确定（创建步骤卡片） */
  onDirectConfirm?: () => void;
  /** 发现元素 */
  onDiscoverElements?: () => void;
  /** 取消选择 */
  onCancel?: () => void;
  /** 隐藏气泡 */
  onHide?: () => void;
  /** 切换容器锁定 */
  onToggleLockContainer?: (locked: boolean) => void;
  /** 预览XPath */
  onPreviewXPath?: () => void;
  /** 不等分析直接确定 */
  onConfirmWithoutWaiting?: () => void;
}

/**
 * 智能分析气泡UI组件
 * 
 * 职责：
 * - 展示智能分析工作流的按钮和状态
 * - 根据分析状态切换UI展示（空闲/分析中/完成/失败）
 * - 提供用户交互的视觉反馈
 * - 纯UI组件，业务逻辑由父组件（IntelligentAnalysisController）处理
 */
export const IntelligentAnalysisPopoverUI: React.FC<IntelligentAnalysisPopoverUIProps> = ({
  elementContext,
  state,
  analysisProgress = 0,
  estimatedTimeLeft = 0,
  lockContainer = false,
  // showXPathPreview = false,
  visible = true,
  onStartAnalysis,
  onDirectConfirm,
  onDiscoverElements,
  onCancel,
  onHide,
  onToggleLockContainer,
  onPreviewXPath,
  onConfirmWithoutWaiting
}) => {
  const [localLockContainer, setLocalLockContainer] = useState(lockContainer);

  const { currentJobs } = useIntelligentAnalysisWorkflow();
  
  // 兼容性适配：从Map中获取当前作业
  const currentJob = Array.from(currentJobs.values())[0] || null;

  /**
   * 处理容器锁定切换
   */
  const handleToggleLockContainer = useCallback((checked: boolean) => {
    setLocalLockContainer(checked);
    onToggleLockContainer?.(checked);
  }, [onToggleLockContainer]);

  /**
   * 获取预计时间显示文本
   */
  const getEstimatedTimeText = (timeMs: number): string => {
    if (timeMs <= 0) return '';
    const seconds = Math.ceil(timeMs / 1000);
    return `预计 ${seconds}s`;
  };

  if (!visible) {
    return null;
  }

  return (
    <Card 
      className="light-theme-force universal-enhanced-element-popover"
      size="small"
      style={{ 
        width: 320,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        border: '1px solid var(--border-2, #e2e8f0)'
      }}
      title={
        <Space>
          <Text strong>选中元素</Text>
          {elementContext.elementText && (
            <Tag color="blue" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {elementContext.elementText}
            </Tag>
          )}
        </Space>
      }
      extra={
        <Button 
          type="text" 
          size="small" 
          icon={<CloseOutlined />}
          onClick={onCancel}
        />
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        
        {/* 元素信息 */}
        <div style={{ 
          background: 'var(--bg-2, #f8fafc)',
          padding: 8,
          borderRadius: 4,
          fontSize: 12
        }}>
          <div>类型: {elementContext.elementType || '未知'}</div>
          {elementContext.elementBounds && (
            <div>位置: {elementContext.elementBounds}</div>
          )}
          <div>路径: {elementContext.elementPath}</div>
        </div>

        {/* 分析状态区域 */}
        {state === 'analyzing' && (
          <Alert
            type="info"
            message="智能分析进行中..."
            description={
              <div>
                <Progress 
                  percent={analysisProgress} 
                  size="small" 
                  status="active"
                  style={{ marginBottom: 8 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span>分析进度 {analysisProgress}%</span>
                  <span>{getEstimatedTimeText(estimatedTimeLeft)}</span>
                </div>
              </div>
            }
            icon={<LoadingOutlined />}
            showIcon
          />
        )}

        {state === 'analyzed' && currentJob?.result?.smartCandidates && (
          <Alert
            type="success"
            message="分析完成"
            description={`发现 ${currentJob.result.smartCandidates.length} 个策略候选，推荐置信度 ${Math.round((currentJob.result.smartCandidates[0]?.confidence || 0) * 100)}%`}
            icon={<CheckOutlined />}
            showIcon
          />
        )}

        {state === 'failed' && (
          <Alert
            type="error"
            message="分析失败"
            description="分析超时或上下文不足"
            showIcon
          />
        )}

        {/* 辅助选项 */}
        <div>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <LockOutlined style={{ fontSize: 12 }} />
                <Text style={{ fontSize: 12 }}>锁定容器</Text>
              </Space>
              <Switch 
                size="small"
                checked={localLockContainer}
                onChange={handleToggleLockContainer}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <CodeOutlined style={{ fontSize: 12 }} />
                <Text style={{ fontSize: 12 }}>预览绝对XPath</Text>
              </Space>
              <Button 
                size="small" 
                type="link" 
                onClick={onPreviewXPath}
                style={{ padding: 0, height: 'auto' }}
              >
                预览
              </Button>
            </div>
          </Space>
        </div>

        <Divider style={{ margin: '8px 0' }} />

        {/* 主要操作按钮 */}
        <Space direction="vertical" style={{ width: '100%' }}>
          
          {/* 智能分析按钮 */}
          {state === 'idle' && (
            <Button 
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={onStartAnalysis}
              block
            >
              🧠 智能分析
            </Button>
          )}

          {/* 分析中的操作 */}
          {state === 'analyzing' && (
            <div>
              <Button 
                type="default"
                icon={<CheckOutlined />}
                onClick={onConfirmWithoutWaiting}
                block
                style={{ marginBottom: 8 }}
              >
                不等了，直接确定
              </Button>
              <Text type="secondary" style={{ fontSize: 11, textAlign: 'center', display: 'block' }}>
                将使用静态兜底策略创建步骤，分析完成后自动绑定
              </Text>
            </div>
          )}

          {/* 分析完成的操作 */}
          {state === 'analyzed' && currentJob?.result?.smartCandidates && (
            <div>
              <Button 
                type="primary"
                icon={<RocketOutlined />}
                onClick={onDirectConfirm}
                block
                style={{ marginBottom: 8 }}
              >
                使用推荐策略
              </Button>
              <Button 
                type="default"
                onClick={onDirectConfirm}
                block
                size="small"
              >
                查看所有候选
              </Button>
            </div>
          )}

          {/* 基础操作 */}
          {(state === 'idle' || state === 'failed') && (
            <Button 
              type="default"
              icon={<CheckOutlined />}
              onClick={onDirectConfirm}
              block
            >
              ✅ 直接确定
            </Button>
          )}
          
          <Button 
            type="default"
            icon={<SearchOutlined />}
            onClick={onDiscoverElements}
            block
          >
            🔍 发现元素
          </Button>
        </Space>

        <Divider style={{ margin: '8px 0' }} />

        {/* 底部操作 */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            size="small" 
            type="text" 
            icon={<EyeInvisibleOutlined />}
            onClick={onHide}
          >
            隐藏
          </Button>
          <Button 
            size="small" 
            type="text" 
            icon={<CloseOutlined />}
            onClick={onCancel}
          >
            取消
          </Button>
        </div>

        {/* 调试信息 */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            fontSize: 10, 
            color: '#999', 
            marginTop: 8, 
            padding: 4, 
            background: '#f5f5f5',
            borderRadius: 2
          }}>
            Debug: {state} | Job: {currentJob?.jobId} | Progress: {analysisProgress}%
          </div>
        )}
      </Space>
    </Card>
  );
};

export default IntelligentAnalysisPopoverUI;