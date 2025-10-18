// src/components/strategy-selector/UnifiedCompactStrategyMenu.tsx
// module: components | layer: ui | role: 统一策略菜单
// summary: 使用统一状态管理的策略菜单，替代旧版本的多系统状态

import React from 'react';
import { Dropdown, Button, Tooltip, Progress, Space } from 'antd';
import { RefreshCcwIcon, LightbulbIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';
import { useStepCardStore } from '../../store/stepcards';
import { useUnifiedSmartAnalysis } from '../../hooks/useUnifiedSmartAnalysis';

interface UnifiedCompactStrategyMenuProps {
  elementData: {
    uid: string;
    xpath?: string;
    text?: string;
    bounds?: string;
    resourceId?: string;
    className?: string;
  };
  disabled?: boolean;
  compact?: boolean;
  cardId?: string; // 如果已有卡片ID
  onStrategyReady?: (cardId: string, strategy: any) => void;
}

export const UnifiedCompactStrategyMenu: React.FC<UnifiedCompactStrategyMenuProps> = ({
  elementData,
  disabled = false,
  compact = true,
  cardId: existingCardId,
  onStrategyReady,
}) => {
  const { 
    createAndAnalyze, 
    isAnalyzing, 
    getProgress, 
    getStatus, 
    hasStrategy, 
    retry, 
    debug 
  } = useUnifiedSmartAnalysis();
  
  const { getCard } = useStepCardStore();
  
  const [currentCardId, setCurrentCardId] = React.useState<string | null>(existingCardId || null);

  // 当前卡片信息
  const currentCard = currentCardId ? getCard(currentCardId) : null;

  // 获取显示状态
  const getDisplayStatus = () => {
    if (!currentCard) return { text: '🧠 智能·自动链', loading: false };
    
    const status = currentCard.status;
    const progress = currentCard.progress || 0;
    
    switch (status) {
      case 'analyzing':
        return { 
          text: `🧠 智能·自动链 🔄 ${progress}%`, 
          loading: true 
        };
      case 'ready':
        return { 
          text: `🧠 智能·自动链 ✅`, 
          loading: false 
        };
      case 'failed':
        return { 
          text: `🧠 智能·自动链 ❌`, 
          loading: false 
        };
      default:
        return { 
          text: '🧠 智能·自动链', 
          loading: false 
        };
    }
  };

  // 启动分析
  const startAnalysis = async () => {
    if (!debug.eventsReady) {
      console.warn('❌ 事件系统未就绪');
      return;
    }

    try {
      const cardId = await createAndAnalyze(elementData);
      setCurrentCardId(cardId);
      console.log('✅ [UnifiedCompactStrategyMenu] 分析已启动', { cardId });
    } catch (error) {
      console.error('❌ [UnifiedCompactStrategyMenu] 启动分析失败', error);
    }
  };

  // 重试分析
  const retryAnalysis = async () => {
    if (!currentCardId) return;
    
    try {
      await retry(currentCardId);
      console.log('♻️ [UnifiedCompactStrategyMenu] 重试分析');
    } catch (error) {
      console.error('❌ [UnifiedCompactStrategyMenu] 重试失败', error);
    }
  };

  // 监听策略就绪
  React.useEffect(() => {
    if (currentCard?.status === 'ready' && currentCard.strategy && onStrategyReady) {
      onStrategyReady(currentCardId!, currentCard.strategy);
    }
  }, [currentCard?.status, currentCard?.strategy, currentCardId, onStrategyReady]);

  const displayStatus = getDisplayStatus();

  // 构建下拉菜单
  const getMenu = () => {
    const items = [];

    if (!currentCard || currentCard.status === 'draft') {
      items.push({
        key: 'start',
        label: '🚀 启动智能分析',
        icon: <LightbulbIcon size={14} />,
        onClick: startAnalysis,
        disabled: !debug.eventsReady
      });
    }

    if (currentCard?.status === 'failed') {
      items.push({
        key: 'retry',
        label: '♻️ 重新分析',  
        icon: <RefreshCcwIcon size={14} />,
        onClick: retryAnalysis
      });
    }

    if (currentCard?.status === 'ready' && currentCard.strategy) {
      const { primary, backups = [] } = currentCard.strategy;
      
      items.push({
        key: 'primary',
        label: `⭐ ${primary} (推荐)`,
        onClick: () => console.log('执行推荐策略:', primary)
      });

      backups.forEach((backup, index) => {
        items.push({
          key: `backup-${index}`,
          label: `🔄 ${backup}`,
          onClick: () => console.log('执行备选策略:', backup)
        });
      });
    }

    // 调试信息
    if (process.env.NODE_ENV === 'development') {
      items.push(
        { type: 'divider' },
        {
          key: 'debug',
          label: `调试: 事件=${debug.eventsReady ? '✅' : '❌'} 卡片=${debug.totalCards}`,
          disabled: true
        }
      );
    }

    return { items };
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {/* 主按钮 */}
      <Dropdown 
        menu={getMenu()} 
        trigger={['click']}
        disabled={disabled}
      >
        <Button
          size="small" 
          type="default"
          loading={displayStatus.loading}
          style={{
            background: 'rgba(110, 139, 255, 0.1)',
            border: '1px solid rgba(110, 139, 255, 0.3)',
            color: '#F8FAFC',
            fontSize: '12px',
            minWidth: '120px'
          }}
        >
          {displayStatus.text}
          <span style={{ marginLeft: '4px' }}>▾</span>
        </Button>
      </Dropdown>

      {/* 状态指示器 */}
      {currentCard?.status === 'analyzing' && (
        <div style={{ width: '60px' }}>
          <Progress 
            percent={currentCard.progress || 0} 
            size="small" 
            showInfo={false}
            strokeColor="#6E8BFF"
          />
        </div>
      )}

      {/* 快捷操作按钮 */}
      {currentCard?.status === 'ready' && (
        <Tooltip title="策略已就绪">
          <CheckCircleIcon size={16} style={{ color: '#10B981' }} />
        </Tooltip>
      )}

      {currentCard?.status === 'failed' && (
        <Tooltip title={`分析失败: ${currentCard.error || '未知错误'}`}>
          <Button
            size="small"
            type="text"
            icon={<XCircleIcon size={14} />}
            style={{ color: '#EF4444' }}
            onClick={retryAnalysis}
          />
        </Tooltip>
      )}

      {/* 调试信息（开发模式） */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          fontSize: '10px', 
          color: '#64748B',
          marginLeft: '8px'
        }}>
          {currentCard ? `ID:${currentCard.id.slice(-6)}` : 'No Card'}
          {currentCard?.jobId && ` Job:${currentCard.jobId.slice(-6)}`}
        </div>
      )}
    </div>
  );
};