// src/components/universal-ui/element-selection/components/PopoverActionButtons.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Space, Button, Row, Col, Typography, Badge } from 'antd';
import { 
  CheckOutlined, 
  EyeInvisibleOutlined, 
  SearchOutlined, 
  CloseOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
  StopOutlined,
  EyeOutlined,
  RedoOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { PopoverActionTokens, defaultPopoverActionTokens } from './tokens';
import type { 
  AnalysisState, 
  AnalysisProgress, 
  StrategyCandidate 
} from '../../../../modules/universal-ui/types/intelligent-analysis-types';

const { Text } = Typography;

export interface PopoverActionButtonsProps {
  onConfirm: (e?: React.MouseEvent) => void;
  onDiscovery?: (e?: React.MouseEvent) => void;
  onHide?: (e?: React.MouseEvent) => void;
  onCancel: (e?: React.MouseEvent) => void;
  disabled?: boolean;
  tokens?: Partial<PopoverActionTokens>;
  compact?: boolean;      // 强制紧凑
  autoCompact?: boolean;  // 根据屏幕宽度自动紧凑
  
  // 智能分析相关
  enableIntelligentAnalysis?: boolean;
  analysisState?: AnalysisState;
  analysisProgress?: AnalysisProgress | null;
  recommendedStrategy?: StrategyCandidate | null;
  onStartAnalysis?: (e?: React.MouseEvent) => void;
  onCancelAnalysis?: (e?: React.MouseEvent) => void;
  onViewAnalysisDetails?: (e?: React.MouseEvent) => void;
  onApplyStrategy?: (strategy: StrategyCandidate, e?: React.MouseEvent) => void;
  onRetryAnalysis?: (e?: React.MouseEvent) => void;
  // 🆕 快速创建步骤卡片（文档要求的"直接确定"功能）
  onQuickCreate?: (e?: React.MouseEvent) => void;
}

const useIsNarrow = (enabled?: boolean) => {
  const [narrow, setNarrow] = React.useState(false);
  React.useEffect(() => {
    if (!enabled) return;
    const mq = window.matchMedia('(max-width: 640px)');
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => setNarrow(!!e.matches);
    onChange(mq);
    const listener = (event: MediaQueryListEvent) => onChange(event);
    mq.addEventListener?.('change', listener);
    return () => mq.removeEventListener?.('change', listener);
  }, [enabled]);
  return narrow;
};

/**
 * Modular action button row for ElementSelectionPopover
 * - Supports both traditional workflow and intelligent analysis
 * - Different button layouts based on analysis state
 * - Responsive compact grid layout
 */
export const PopoverActionButtons: React.FC<PopoverActionButtonsProps> = ({
  onConfirm,
  onDiscovery,
  onHide,
  onCancel,
  disabled = false,
  tokens,
  compact,
  autoCompact,
  // 智能分析相关
  enableIntelligentAnalysis = false,
  analysisState = 'idle',
  analysisProgress,
  recommendedStrategy,
  onStartAnalysis,
  onCancelAnalysis,
  onViewAnalysisDetails,
  onApplyStrategy,
  onRetryAnalysis,
  // 🆕 快速创建步骤卡片
  onQuickCreate,
}) => {
  const t = { ...defaultPopoverActionTokens, ...(tokens || {}) };
  const isNarrow = useIsNarrow(autoCompact);
  const useCompact = compact || isNarrow;

  // 统一样式
  const btnStyle: React.CSSProperties = {
    fontSize: t.fontSize,
    minWidth: t.buttonMinWidth,
  };

  // 根据分析状态渲染不同的按钮组合
  const renderButtons = () => {
    if (!enableIntelligentAnalysis) {
      // 传统模式：确定 / 发现元素 / 隐藏 / 取消
      return renderTraditionalButtons();
    }

    switch (analysisState) {
      case 'idle':
        // 空闲状态：智能分析 / 直接确定 / 发现元素 / 取消
        return renderIdleButtons();
      case 'analyzing':
        // 分析中：进度显示 / 其他操作仍可用 / 取消分析 / 取消
        return renderAnalyzingButtons();
      case 'completed':
        // 完成状态：应用推荐 / 查看详情 / 直接确定 / 取消
        return renderCompletedButtons();
      case 'failed':
        // 失败状态：重试分析 / 直接确定 / 发现元素 / 取消
        return renderFailedButtons();
      default:
        return renderTraditionalButtons();
    }
  };

  // 传统按钮布局
  const renderTraditionalButtons = () => {
    if (!useCompact) {
      return (
        <Space size={t.gap} wrap={t.rowWrap}>
          <Button type="primary" size="small" icon={<CheckOutlined />} onClick={onConfirm} style={btnStyle} disabled={disabled}>
            确定
          </Button>
          {onDiscovery && (
            <Button size="small" icon={<SearchOutlined />} onClick={onDiscovery} style={btnStyle} disabled={disabled}>
              发现元素
            </Button>
          )}
          {onHide && (
            <Button size="small" icon={<EyeInvisibleOutlined />} onClick={onHide} style={btnStyle} disabled={disabled}>
              隐藏
            </Button>
          )}
          <Button size="small" icon={<CloseOutlined />} onClick={onCancel} style={btnStyle} ghost disabled={disabled}>
            取消
          </Button>
        </Space>
      );
    }

    return (
      <Row gutter={[t.gap, t.gap]} style={{ width: 240 }}>
        <Col span={12}>
          <Button block type="primary" size="small" icon={<CheckOutlined />} onClick={onConfirm} style={btnStyle} disabled={disabled}>
            确定
          </Button>
        </Col>
        <Col span={12}>
          {onDiscovery && (
            <Button block size="small" icon={<SearchOutlined />} onClick={onDiscovery} style={btnStyle} disabled={disabled}>
              发现元素
            </Button>
          )}
        </Col>
        {onHide && (
          <Col span={12}>
            <Button block size="small" icon={<EyeInvisibleOutlined />} onClick={onHide} style={btnStyle} disabled={disabled}>
              隐藏
            </Button>
          </Col>
        )}
        <Col span={12}>
          <Button block size="small" icon={<CloseOutlined />} onClick={onCancel} style={btnStyle} ghost disabled={disabled}>
            取消
          </Button>
        </Col>
      </Row>
    );
  };

  // 空闲状态按钮
  const renderIdleButtons = () => {
    if (!useCompact) {
      return (
        <Space size={t.gap} wrap={t.rowWrap}>
          <Button 
            type="primary" 
            size="small" 
            icon={<ThunderboltOutlined />} 
            onClick={onStartAnalysis} 
            style={btnStyle} 
            disabled={disabled}
          >
            智能分析
          </Button>
          <Button 
            size="small" 
            icon={<CheckOutlined />} 
            onClick={onQuickCreate || onConfirm} 
            style={btnStyle} 
            disabled={disabled}
          >
            直接确定
          </Button>
          {onDiscovery && (
            <Button size="small" icon={<SearchOutlined />} onClick={onDiscovery} style={btnStyle} disabled={disabled}>
              发现元素
            </Button>
          )}
          <Button size="small" icon={<CloseOutlined />} onClick={onCancel} style={btnStyle} ghost disabled={disabled}>
            取消
          </Button>
        </Space>
      );
    }

    return (
      <Row gutter={[t.gap, t.gap]} style={{ width: 240 }}>
        <Col span={12}>
          <Button 
            block 
            type="primary" 
            size="small" 
            icon={<ThunderboltOutlined />} 
            onClick={onStartAnalysis} 
            style={btnStyle} 
            disabled={disabled}
          >
            智能分析
          </Button>
        </Col>
        <Col span={12}>
          <Button 
            block 
            size="small" 
            icon={<CheckOutlined />} 
            onClick={onQuickCreate || onConfirm} 
            style={btnStyle} 
            disabled={disabled}
          >
            直接确定
          </Button>
        </Col>
        <Col span={12}>
          {onDiscovery && (
            <Button block size="small" icon={<SearchOutlined />} onClick={onDiscovery} style={btnStyle} disabled={disabled}>
              发现元素
            </Button>
          )}
        </Col>
        <Col span={12}>
          <Button block size="small" icon={<CloseOutlined />} onClick={onCancel} style={btnStyle} ghost disabled={disabled}>
            取消
          </Button>
        </Col>
      </Row>
    );
  };

  // 分析中状态按钮
  const renderAnalyzingButtons = () => {
    const progressElement = analysisProgress && (
      <div style={{ marginBottom: 8, textAlign: 'center' }}>
        <Text style={{ fontSize: '12px', color: '#666' }}>
          {analysisProgress.stepName} ({analysisProgress.currentStep}/{analysisProgress.totalSteps})
        </Text>
        <div style={{
          width: '100%',
          height: 4,
          backgroundColor: '#f0f0f0',
          borderRadius: 2,
          overflow: 'hidden',
          marginTop: 4
        }}>
          <div style={{
            width: `${(analysisProgress.currentStep / analysisProgress.totalSteps) * 100}%`,
            height: '100%',
            backgroundColor: '#1890ff',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    );

    if (!useCompact) {
      return (
        <div>
          {progressElement}
          <Space size={t.gap} wrap={t.rowWrap}>
            <Button 
              size="small" 
              icon={<StopOutlined />} 
              onClick={onCancelAnalysis} 
              style={btnStyle} 
              disabled={disabled}
            >
              取消分析
            </Button>
            <Button size="small" icon={<CheckOutlined />} onClick={onConfirm} style={btnStyle} disabled={disabled}>
              直接确定
            </Button>
            {onDiscovery && (
              <Button size="small" icon={<SearchOutlined />} onClick={onDiscovery} style={btnStyle} disabled={disabled}>
                发现元素
              </Button>
            )}
            <Button size="small" icon={<CloseOutlined />} onClick={onCancel} style={btnStyle} ghost disabled={disabled}>
              取消
            </Button>
          </Space>
        </div>
      );
    }

    return (
      <div>
        {progressElement}
        <Row gutter={[t.gap, t.gap]} style={{ width: 240 }}>
          <Col span={12}>
            <Button 
              block 
              size="small" 
              icon={<StopOutlined />} 
              onClick={onCancelAnalysis} 
              style={btnStyle} 
              disabled={disabled}
            >
              取消分析
            </Button>
          </Col>
          <Col span={12}>
            <Button block size="small" icon={<CheckOutlined />} onClick={onConfirm} style={btnStyle} disabled={disabled}>
              直接确定
            </Button>
          </Col>
          <Col span={12}>
            {onDiscovery && (
              <Button block size="small" icon={<SearchOutlined />} onClick={onDiscovery} style={btnStyle} disabled={disabled}>
                发现元素
              </Button>
            )}
          </Col>
          <Col span={12}>
            <Button block size="small" icon={<CloseOutlined />} onClick={onCancel} style={btnStyle} ghost disabled={disabled}>
              取消
            </Button>
          </Col>
        </Row>
      </div>
    );
  };

  // 分析完成状态按钮
  const renderCompletedButtons = () => {
    const strategyElement = recommendedStrategy && (
      <div style={{ marginBottom: 8, textAlign: 'center' }}>
        <Text style={{ fontSize: '12px', color: '#52c41a' }}>
          <TrophyOutlined style={{ marginRight: 4 }} />
          推荐: {recommendedStrategy.name}
        </Text>
        <Badge 
          count={`${recommendedStrategy.confidence}%`} 
          style={{ 
            backgroundColor: recommendedStrategy.confidence >= 90 ? '#52c41a' : 
                           recommendedStrategy.confidence >= 70 ? '#faad14' : '#ff4d4f',
            marginLeft: 8
          }} 
        />
      </div>
    );

    if (!useCompact) {
      return (
        <div>
          {strategyElement}
          <Space size={t.gap} wrap={t.rowWrap}>
            <Button 
              type="primary" 
              size="small" 
              icon={<TrophyOutlined />} 
              onClick={(e) => recommendedStrategy && onApplyStrategy?.(recommendedStrategy, e)} 
              style={btnStyle} 
              disabled={disabled || !recommendedStrategy}
            >
              应用推荐
            </Button>
            <Button 
              size="small" 
              icon={<EyeOutlined />} 
              onClick={onViewAnalysisDetails} 
              style={btnStyle} 
              disabled={disabled}
            >
              查看详情
            </Button>
            <Button size="small" icon={<CheckOutlined />} onClick={onConfirm} style={btnStyle} disabled={disabled}>
              直接确定
            </Button>
            <Button size="small" icon={<CloseOutlined />} onClick={onCancel} style={btnStyle} ghost disabled={disabled}>
              取消
            </Button>
          </Space>
        </div>
      );
    }

    return (
      <div>
        {strategyElement}
        <Row gutter={[t.gap, t.gap]} style={{ width: 240 }}>
          <Col span={12}>
            <Button 
              block 
              type="primary" 
              size="small" 
              icon={<TrophyOutlined />} 
              onClick={(e) => recommendedStrategy && onApplyStrategy?.(recommendedStrategy, e)} 
              style={btnStyle} 
              disabled={disabled || !recommendedStrategy}
            >
              应用推荐
            </Button>
          </Col>
          <Col span={12}>
            <Button 
              block 
              size="small" 
              icon={<EyeOutlined />} 
              onClick={onViewAnalysisDetails} 
              style={btnStyle} 
              disabled={disabled}
            >
              查看详情
            </Button>
          </Col>
          <Col span={12}>
            <Button block size="small" icon={<CheckOutlined />} onClick={onConfirm} style={btnStyle} disabled={disabled}>
              直接确定
            </Button>
          </Col>
          <Col span={12}>
            <Button block size="small" icon={<CloseOutlined />} onClick={onCancel} style={btnStyle} ghost disabled={disabled}>
              取消
            </Button>
          </Col>
        </Row>
      </div>
    );
  };

  // 分析失败状态按钮
  const renderFailedButtons = () => {
    if (!useCompact) {
      return (
        <Space size={t.gap} wrap={t.rowWrap}>
          <Button 
            type="primary" 
            size="small" 
            icon={<RedoOutlined />} 
            onClick={onRetryAnalysis} 
            style={btnStyle} 
            disabled={disabled}
          >
            重试分析
          </Button>
          <Button size="small" icon={<CheckOutlined />} onClick={onConfirm} style={btnStyle} disabled={disabled}>
            直接确定
          </Button>
          {onDiscovery && (
            <Button size="small" icon={<SearchOutlined />} onClick={onDiscovery} style={btnStyle} disabled={disabled}>
              发现元素
            </Button>
          )}
          <Button size="small" icon={<CloseOutlined />} onClick={onCancel} style={btnStyle} ghost disabled={disabled}>
            取消
          </Button>
        </Space>
      );
    }

    return (
      <Row gutter={[t.gap, t.gap]} style={{ width: 240 }}>
        <Col span={12}>
          <Button 
            block 
            type="primary" 
            size="small" 
            icon={<RedoOutlined />} 
            onClick={onRetryAnalysis} 
            style={btnStyle} 
            disabled={disabled}
          >
            重试分析
          </Button>
        </Col>
        <Col span={12}>
          <Button block size="small" icon={<CheckOutlined />} onClick={onConfirm} style={btnStyle} disabled={disabled}>
            直接确定
          </Button>
        </Col>
        <Col span={12}>
          {onDiscovery && (
            <Button block size="small" icon={<SearchOutlined />} onClick={onDiscovery} style={btnStyle} disabled={disabled}>
              发现元素
            </Button>
          )}
        </Col>
        <Col span={12}>
          <Button block size="small" icon={<CloseOutlined />} onClick={onCancel} style={btnStyle} ghost disabled={disabled}>
            取消
          </Button>
        </Col>
      </Row>
    );
  };

  return renderButtons();
};

export default PopoverActionButtons;
