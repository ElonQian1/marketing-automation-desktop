// src/modules/universal-ui/components/enhanced-element-selection-popover.tsx
// module: universal-ui | layer: ui | role: component
// summary: 增强的元素选择气泡，支持主动触发分析、直接确定、不等分析等功能

import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Progress,
  Alert,
  Divider,
  Tag,
  Switch,
  Tooltip,
  Row,
  Col
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
  InfoCircleOutlined,
  StopOutlined
} from '@ant-design/icons';

import type {
  ElementSelectionContext,
  AnalysisJob,
  StrategyCandidate
} from '../types/intelligent-analysis-types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { calculateSelectionHash, debugSelectionHash } from '../utils/selection-hash';

const { Text } = Typography;

/**
 * 气泡状态
 */
export type PopoverState = 
  | 'idle'      // 空闲状态，显示基础选项
  | 'analyzing' // 分析中，显示进度
  | 'analyzed'  // 分析完成，显示结果
  | 'failed';   // 分析失败

/**
 * 增强元素选择气泡属性
 */
export interface EnhancedElementSelectionPopoverProps {
  /** 元素选择上下文 */
  elementContext: ElementSelectionContext;
  /** 当前气泡状态 */
  state: PopoverState;
  /** 当前分析作业 */
  currentJob?: AnalysisJob;
  /** 是否锁定容器 */
  lockContainer?: boolean;
  /** 是否显示XPath预览 */
  showXPathPreview?: boolean;
  /** 是否可见 */
  visible?: boolean;
  /** 是否显示调试信息 */
  showDebugInfo?: boolean;
  
  // 事件回调
  /** 启动智能分析 */
  onStartAnalysis?: () => void;
  /** 直接确定（创建步骤卡片） */
  onDirectConfirm?: () => void;
  /** 不等分析完成，直接确定 */
  onConfirmWithoutWaiting?: () => void;
  /** 发现元素 */
  onDiscoverElements?: () => void;
  /** 取消选择 */
  onCancel?: () => void;
  /** 隐藏气泡 */
  onHide?: () => void;
  /** 取消分析 */
  onCancelAnalysis?: () => void;
  /** 切换容器锁定 */
  onToggleLockContainer?: (locked: boolean) => void;
  /** 预览XPath */
  onPreviewXPath?: () => void;
  /** 使用推荐策略 */
  onUseRecommended?: (strategy: StrategyCandidate) => void;
  /** 查看策略详情 */
  onViewStrategyDetails?: () => void;
}

/**
 * 增强的元素选择气泡组件
 */
export const EnhancedElementSelectionPopover: React.FC<EnhancedElementSelectionPopoverProps> = ({
  elementContext,
  state,
  currentJob,
  lockContainer = false,
  // showXPathPreview = false, // 暂未使用
  visible = true,
  showDebugInfo = false,
  onStartAnalysis,
  onDirectConfirm,
  onConfirmWithoutWaiting,
  onDiscoverElements,
  onCancel,
  onHide,
  onCancelAnalysis,
  onToggleLockContainer,
  onPreviewXPath,
  onUseRecommended,
  onViewStrategyDetails
}) => {
  const [localLockContainer, setLocalLockContainer] = useState(lockContainer);
  
  // 计算选择哈希
  // const selectionHash = useMemo(() =>
  //   calculateSelectionHash(elementContext),
  //   [elementContext]
  // ); // 暂未使用  // 调试信息
  const debugInfo = useMemo(() => 
    showDebugInfo ? debugSelectionHash(elementContext) : null, 
    [elementContext, showDebugInfo]
  );
  
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
  const getEstimatedTimeText = (timeMs?: number): string => {
    if (!timeMs || timeMs <= 0) return '';
    const seconds = Math.ceil(timeMs / 1000);
    return `预计 ${seconds}s`;
  };
  
  /**
   * 渲染元素信息区域
   */
  const renderElementInfo = () => (
    <div style={{ 
      background: 'var(--bg-2, #f8fafc)',
      padding: 12,
      borderRadius: 6,
      marginBottom: 12
    }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Row justify="space-between">
          <Col>
            <Text strong style={{ fontSize: 13 }}>选中元素</Text>
          </Col>
          <Col>
            {elementContext.elementText && (
              <Tag color="blue" style={{ fontSize: 11, maxWidth: 120, overflow: 'hidden' }}>
                {elementContext.elementText}
              </Tag>
            )}
          </Col>
        </Row>
        
        <div style={{ fontSize: 11, color: 'var(--text-3, #64748b)' }}>
          <div>类型: {elementContext.elementType || '未知'}</div>
          {elementContext.elementBounds && (
            <div>位置: {elementContext.elementBounds}</div>
          )}
          <div style={{ wordBreak: 'break-all' }}>
            路径: {elementContext.elementPath}
          </div>
        </div>
      </Space>
    </div>
  );
  
  /**
   * 渲染分析状态区域
   */
  const renderAnalysisStatus = () => {
    switch (state) {
      case 'analyzing':
        if (!currentJob) return null;
        return (
          <Alert
            type="info"
            message="智能分析进行中..."
            description={
              <div>
                <Progress 
                  percent={currentJob.progress} 
                  size="small" 
                  status="active"
                  style={{ marginBottom: 8 }}
                />
                <Row justify="space-between" style={{ fontSize: 12 }}>
                  <Col>分析进度 {currentJob.progress}%</Col>
                  <Col>{getEstimatedTimeText(currentJob.estimatedTimeLeft)}</Col>
                </Row>
              </div>
            }
            icon={<LoadingOutlined />}
            showIcon
            style={{ marginBottom: 12 }}
          />
        );
        
      case 'analyzed':
        if (!currentJob?.result) return null;
        const recommendedStrategy = currentJob.result.smartCandidates.find(
          c => c.key === currentJob.result!.recommendedKey
        );
        return (
          <Alert
            type="success"
            message="分析完成"
            description={
              <div>
                <div style={{ marginBottom: 8 }}>
                  发现 {currentJob.result.smartCandidates.length} 个智能策略候选
                </div>
                {recommendedStrategy && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      推荐: {recommendedStrategy.name} ({recommendedStrategy.confidence}%)
                    </span>
                    <Button 
                      size="small" 
                      type="primary"
                      onClick={() => onUseRecommended?.(recommendedStrategy)}
                    >
                      使用推荐
                    </Button>
                  </div>
                )}
              </div>
            }
            icon={<CheckOutlined />}
            showIcon
            style={{ marginBottom: 12 }}
          />
        );
        
      case 'failed':
        return (
          <Alert
            type="error"
            message="分析失败"
            description={currentJob?.error || "分析超时或上下文不足"}
            showIcon
            style={{ marginBottom: 12 }}
          />
        );
        
      default:
        return null;
    }
  };
  
  /**
   * 渲染辅助选项
   */
  const renderAuxiliaryOptions = () => (
    <div style={{ marginBottom: 12 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <LockOutlined style={{ fontSize: 12 }} />
              <Text style={{ fontSize: 12 }}>锁定容器</Text>
              <Tooltip title="锁定后分析时会优先考虑容器内的策略">
                <InfoCircleOutlined style={{ fontSize: 10, color: '#999' }} />
              </Tooltip>
            </Space>
          </Col>
          <Col>
            <Switch 
              size="small"
              checked={localLockContainer}
              onChange={handleToggleLockContainer}
            />
          </Col>
        </Row>
        
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <CodeOutlined style={{ fontSize: 12 }} />
              <Text style={{ fontSize: 12 }}>预览绝对XPath</Text>
            </Space>
          </Col>
          <Col>
            <Button 
              size="small" 
              type="link" 
              onClick={onPreviewXPath}
              style={{ padding: 0, height: 'auto' }}
            >
              预览
            </Button>
          </Col>
        </Row>
      </Space>
    </div>
  );
  
  /**
   * 渲染主要操作按钮
   */
  const renderMainActions = () => {
    switch (state) {
      case 'idle':
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={onStartAnalysis}
              block
            >
              🧠 智能分析
            </Button>
            
            <Button 
              type="default"
              icon={<CheckOutlined />}
              onClick={onDirectConfirm}
              block
            >
              ✅ 直接确定
            </Button>
          </Space>
        );
        
      case 'analyzing':
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              type="default"
              icon={<CheckOutlined />}
              onClick={onConfirmWithoutWaiting}
              block
            >
              不等了，直接确定
            </Button>
            
            <Text type="secondary" style={{ fontSize: 11, textAlign: 'center', display: 'block' }}>
              将使用兜底策略创建步骤，分析完成后自动绑定
            </Text>
            
            <Button 
              danger
              icon={<StopOutlined />}
              onClick={onCancelAnalysis}
              block
              size="small"
            >
              取消分析
            </Button>
          </Space>
        );
        
      case 'analyzed':
        const job = currentJob;
        const hasRecommendation = job?.result?.smartCandidates?.length > 0;
        
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            {hasRecommendation && (
              <>
                <Button 
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={onDirectConfirm}
                  block
                >
                  使用推荐策略
                </Button>
                
                <Button 
                  type="default"
                  onClick={onViewStrategyDetails}
                  block
                  size="small"
                >
                  查看所有候选 ({job?.result?.smartCandidates.length || 0})
                </Button>
              </>
            )}
            
            <Button 
              type="default"
              icon={<CheckOutlined />}
              onClick={onDirectConfirm}
              block
            >
              确定创建步骤
            </Button>
          </Space>
        );
        
      case 'failed':
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={onStartAnalysis}
              block
            >
              重试分析
            </Button>
            
            <Button 
              type="default"
              icon={<CheckOutlined />}
              onClick={onDirectConfirm}
              block
            >
              使用兜底策略
            </Button>
          </Space>
        );
        
      default:
        return null;
    }
  };
  
  /**
   * 渲染底部操作
   */
  const renderBottomActions = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
      <Space>
        <Button 
          size="small" 
          type="text" 
          icon={<SearchOutlined />}
          onClick={onDiscoverElements}
        >
          发现元素
        </Button>
        
        <Button 
          size="small" 
          type="text" 
          icon={<EyeInvisibleOutlined />}
          onClick={onHide}
        >
          隐藏
        </Button>
      </Space>
      
      <Button 
        size="small" 
        type="text" 
        icon={<CloseOutlined />}
        onClick={onCancel}
      >
        取消
      </Button>
    </div>
  );
  
  if (!visible) {
    return null;
  }
  
  return (
    <div className="light-theme-force enhanced-element-selection-popover">
      <Card 
        size="small"
        style={{ 
          width: 360,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          border: '1px solid var(--border-2, #e2e8f0)'
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* 元素信息 */}
          {renderElementInfo()}
          
          {/* 分析状态 */}
          {renderAnalysisStatus()}
          
          {/* 辅助选项 */}
          {renderAuxiliaryOptions()}
          
          <Divider style={{ margin: '8px 0' }} />
          
          {/* 主要操作 */}
          {renderMainActions()}
          
          {/* 底部操作 */}
          {renderBottomActions()}
          
          {/* 调试信息 */}
          {showDebugInfo && debugInfo && (
            <details style={{ 
              fontSize: 10, 
              color: '#999', 
              marginTop: 12, 
              padding: 8, 
              background: '#f5f5f5',
              borderRadius: 4
            }}>
              <summary>调试信息</summary>
              <div style={{ marginTop: 8 }}>
                <div><strong>Selection Hash:</strong> {debugInfo.hash}</div>
                <div><strong>组件:</strong></div>
                <pre style={{ margin: '4px 0', fontSize: 9 }}>
                  {JSON.stringify(debugInfo.components, null, 2)}
                </pre>
                <div><strong>状态:</strong> {state}</div>
                {currentJob && (
                  <div><strong>Job ID:</strong> {currentJob.jobId}</div>
                )}
              </div>
            </details>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default EnhancedElementSelectionPopover;