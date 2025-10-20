// src/components/step-cards/UnifiedSmartStepCard.tsx
// module: components | layer: ui | role: 统一智能步骤卡片
// summary: 使用统一状态管理的智能步骤卡片，支持jobId精确事件路由

import React from 'react';
import { Card, Button, Spin, Progress, Select, Badge, Popover, Tag, Space } from 'antd';
import { 
  PlayCircleOutlined, 
  BulbOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useStepCardStore, type StepCard, type StepCardStatus } from '../../store/stepcards';
import { useUnifiedAnalysisEvents } from '../../services/unified-analysis-events';
import { invoke } from '@tauri-apps/api/core';
// 移除未使用的导入 - 现在直接用简单的 span 渲染徽章
// import { ConfidenceBadge } from '../common/ConfidenceBadge';
// import { ConfidenceBreakdown } from '../common/ConfidenceBreakdown';

const { Option } = Select;

export interface UnifiedSmartStepCardProps {
  cardId: string;
  mockElement?: {
    uid: string;
    xpath: string;
    text?: string;
    bounds?: string;
    resourceId?: string;
    className?: string;
  };
  className?: string;
  compact?: boolean;
  onExecute?: (cardId: string, strategy: string) => void;
  onRemove?: (cardId: string) => void;
}

function getStatusColor(status: StepCardStatus) {
  switch (status) {
    case 'draft': return 'default';
    case 'analyzing': return 'processing';
    case 'ready': return 'success';
    case 'failed': return 'error';
    case 'blocked': return 'warning';
    default: return 'default';
  }
}

function getStatusIcon(status: StepCardStatus) {
  switch (status) {
    case 'draft': return <ClockCircleOutlined />;
    case 'analyzing': return <Spin size="small" />;
    case 'ready': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    case 'failed': return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
    case 'blocked': return <StopOutlined style={{ color: '#faad14' }} />;
    default: return <ClockCircleOutlined />;
  }
}

function getStatusText(status: StepCardStatus) {
  switch (status) {
    case 'draft': return '待分析';
    case 'analyzing': return '分析中';
    case 'ready': return '就绪';
    case 'failed': return '失败';
    case 'blocked': return '阻塞';
    default: return '未知';
  }
}

export const UnifiedSmartStepCard: React.FC<UnifiedSmartStepCardProps> = ({
  cardId,
  mockElement,
  className,
  compact = false,
  onExecute,
  onRemove,
}) => {
  const card = useStepCardStore(state => state.getCard(cardId));
  const { attachJob, updateStatus } = useStepCardStore();
  const { isReady: eventsReady } = useUnifiedAnalysisEvents();
  
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  // 确保卡片存在
  if (!card) {
    return (
      <Card className={className} size="small">
        <div style={{ textAlign: 'center', color: '#999' }}>
          卡片不存在 (ID: {cardId})
        </div>
      </Card>
    );
  }

  // 启动智能分析
  const startAnalysis = async () => {
    if (!eventsReady) {
      console.warn('❌ 事件系统未就绪，无法启动分析');
      return;
    }

    try {
      setIsAnalyzing(true);
      updateStatus(cardId, 'analyzing');

      const elementData = mockElement || card.elementContext;
      if (!elementData) {
        throw new Error('缺少元素信息');
      }

      console.log('🚀 [UnifiedSmartStepCard] 启动智能分析', { cardId, elementData });

      // 调用后端分析接口
      const result = await invoke('start_intelligent_analysis', {
        element: {
          uid: mockElement?.uid || card.elementUid,
          xpath: elementData.xpath || '',
          text: elementData.text || '',
          bounds: elementData.bounds || '',
          resource_id: elementData.resourceId || '',
          class_name: elementData.className || '',
        }
      });

      const jobId = result as string;
      console.log('✅ [UnifiedSmartStepCard] 分析已启动', { cardId, jobId });

      // 关键：绑定 jobId 到步骤卡片
      attachJob(cardId, jobId);

    } catch (error) {
      console.error('❌ [UnifiedSmartStepCard] 分析启动失败', error);
      updateStatus(cardId, 'failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 执行选中的策略
  const executeStrategy = (strategy: string) => {
    console.log('▶️ [UnifiedSmartStepCard] 执行策略', { cardId, strategy });
    onExecute?.(cardId, strategy);
  };

  // 渲染策略选择器
  const renderStrategySelector = () => {
    if (!card.strategy) return null;

    const { primary, backups = [], candidates = [] } = card.strategy;
    const allOptions = [primary, ...backups].filter(Boolean);

    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
          推荐策略:
        </div>
        <Select
          style={{ width: '100%' }}
          value={primary}
          size="small"
          onChange={executeStrategy}
          dropdownRender={(menu) => (
            <div>
              {menu}
              {candidates.length > 0 && (
                <div style={{ borderTop: '1px solid #f0f0f0', padding: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: 4 }}>
                    候选元素:
                  </div>
                  {candidates.slice(0, 3).map((candidate, index) => (
                    <Tag key={index} style={{ marginBottom: 2, fontSize: '11px' }}>
                      {candidate.name} ({Math.round(candidate.confidence * 100)}%)
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          )}
        >
          {allOptions.map((option, index) => (
            <Option key={option} value={option}>
              {index === 0 && <ThunderboltOutlined style={{ marginRight: 4, color: '#1890ff' }} />}
              {option}
              {index === 0 && <span style={{ color: '#1890ff', fontSize: '11px' }}> (推荐)</span>}
            </Option>
          ))}
        </Select>
      </div>
    );
  };

  // 渲染进度条
  const renderProgress = () => {
    if (card.status !== 'analyzing' || !card.progress) return null;

    return (
      <div style={{ marginTop: 8 }}>
        <Progress 
          percent={card.progress} 
          size="small" 
          status={card.progress === 100 ? 'success' : 'active'}
          showInfo={false}
        />
        <div style={{ fontSize: '11px', color: '#999', textAlign: 'center', marginTop: 2 }}>
          分析进度 {card.progress}%
        </div>
      </div>
    );
  };

  // Compact 模式
  if (compact) {
    return (
      <Card 
        className={className}
        size="small"
        bodyStyle={{ padding: '8px 12px' }}
        style={{ marginBottom: 8 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge status={getStatusColor(card.status)} />
          <span style={{ flex: 1, fontSize: '13px' }}>
            {mockElement?.text || `元素 ${card.elementUid.slice(-8)}`}
          </span>
          {/* 直接显示置信度徽章 - 简化版本 */}
          {card.meta?.singleStepScore?.confidence && (card.status === 'ready' || card.status === 'completed') && (
            <span 
              className="confidence-badge" 
              data-testid="confidence-badge"
              style={{
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'var(--g-badge, #101010)',
                color: 'var(--g-fg, #f5f5f5)',
                border: '1px solid var(--g-border, #2d2d2d)',
                fontSize: '12px',
                lineHeight: '18px'
              }}
            >
              {`${Math.round(card.meta.singleStepScore.confidence * 100)}%`}
            </span>
          )}
          
          {card.status === 'draft' && (
            <Button 
              type="link" 
              size="small" 
              icon={<BulbOutlined />}
              loading={isAnalyzing}
              onClick={startAnalysis}
            >
              分析
            </Button>
          )}
          
          {card.status === 'ready' && card.strategy && (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => executeStrategy(card.strategy!.primary)}
            >
              执行
            </Button>
          )}
          
          {card.status === 'failed' && (
            <Popover content={card.error} title="错误详情">
              <Button type="link" size="small" danger icon={<ExclamationCircleOutlined />}>
                查看
              </Button>
            </Popover>
          )}
        </div>
        
        {renderProgress()}
      </Card>
    );
  }

  // 完整模式
  return (
    <Card 
      className={className}
      size="small"
      style={{ marginBottom: 12 }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {getStatusIcon(card.status)}
          <span style={{ fontSize: '14px' }}>
            {mockElement?.text || `步骤 ${card.elementUid.slice(-8)}`}
          </span>
          <Tag color={getStatusColor(card.status)}>
            {getStatusText(card.status)}
          </Tag>
          {/* 直接显示置信度徽章 - 完整模式 */}
          {card.meta?.singleStepScore?.confidence && (card.status === 'ready' || card.status === 'completed') && (
            <span 
              className="confidence-badge" 
              data-testid="confidence-badge"
              style={{
                padding: '4px 12px',
                borderRadius: '999px',
                background: 'var(--g-badge, #101010)',
                color: 'var(--g-fg, #f5f5f5)',
                border: '1px solid var(--g-border, #2d2d2d)',
                fontSize: '13px',
                fontWeight: 500,
                lineHeight: '20px'
              }}
            >
              置信度 {`${Math.round(card.meta.singleStepScore.confidence * 100)}%`}
            </span>
          )}
        </div>
      }
      extra={
        card.strategy?.score && (
          <Tag color="blue" style={{ margin: 0 }}>
            {Math.round(card.strategy.score * 100)}分
          </Tag>
        )
      }
    >
      {/* 元素信息 */}
      {mockElement && (
        <div style={{ marginBottom: 12, fontSize: '12px', color: '#666' }}>
          <div>XPath: <code>{mockElement.xpath}</code></div>
          {mockElement.resourceId && (
            <div>Resource ID: <code>{mockElement.resourceId}</code></div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <Space style={{ marginBottom: 12 }}>
        {card.status === 'draft' && (
          <Button 
            type="primary"
            icon={<BulbOutlined />}
            loading={isAnalyzing}
            onClick={startAnalysis}
            disabled={!eventsReady}
          >
            🧠 智能分析
          </Button>
        )}
        
        {card.status === 'ready' && card.strategy && (
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => executeStrategy(card.strategy!.primary)}
          >
            执行推荐策略
          </Button>
        )}
        
        {card.status === 'failed' && (
          <Button 
            type="default"
            icon={<BulbOutlined />}
            onClick={startAnalysis}
          >
            重新分析
          </Button>
        )}

        {onRemove && (
          <Button 
            type="text" 
            danger 
            size="small"
            onClick={() => onRemove(cardId)}
          >
            删除
          </Button>
        )}
      </Space>

      {/* 进度条 */}
      {renderProgress()}

      {/* 策略选择器 */}
      {renderStrategySelector()}

      {/* 错误信息 */}
      {card.status === 'failed' && card.error && (
        <div style={{ 
          marginTop: 12, 
          padding: 8, 
          background: '#fff1f0', 
          border: '1px solid #ffccc7',
          borderRadius: 4,
          fontSize: '12px',
          color: '#cf1322'
        }}>
          <ExclamationCircleOutlined style={{ marginRight: 4 }} />
          {card.error}
        </div>
      )}
    </Card>
  );
};