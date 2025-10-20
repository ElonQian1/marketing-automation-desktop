// src/components/strategy-selector/UnifiedCompactStrategyMenu.tsx
// module: components | layer: ui | role: 统一策略菜单
// summary: 使用统一状态管理的策略菜单，替代旧版本的多系统状态

import React from 'react';
import { Dropdown, Button, Tooltip, Progress } from 'antd';
import { RefreshCcwIcon, LightbulbIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';
import { useStepCardStore } from '../../store/stepcards';
import { useStepScoreStore } from '../../stores/step-score-store';
import { useUnifiedSmartAnalysis } from '../../hooks/useUnifiedSmartAnalysis';
import { ConfidenceTag } from '../../modules/universal-ui';

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
  stepId?: string; // 步骤ID，用于显示推荐徽章
  onStrategyReady?: (cardId: string, strategy: unknown) => void;
}

export const UnifiedCompactStrategyMenu: React.FC<UnifiedCompactStrategyMenuProps> = ({
  elementData,
  disabled = false,
  cardId: existingCardId,
  stepId,
  onStrategyReady,
}) => {
  const { 
    createAndAnalyze, 
    retry, 
    debug 
  } = useUnifiedSmartAnalysis();
  
  const { getCard } = useStepCardStore();
  const { getByCardId, generateKey, get: getScore } = useStepScoreStore();
  
  const [currentCardId, setCurrentCardId] = React.useState<string | null>(existingCardId || null);

  // 当前卡片信息
  const currentCard = currentCardId ? getCard(currentCardId) : null;
  
  // 🆕 优先从共享缓存获取置信度（专家建议的核心）
  const cachedScore = currentCardId ? getByCardId(currentCardId) : null;
  const elementScore = cachedScore || (elementData.uid ? getScore(generateKey(elementData.uid)) : null);

  // 推荐映射（根据朋友的建议）
  const recommendedStrategyKeys = {
    'step6': 'self_anchor',
    'step4': 'text_semantic', 
    'step2': 'attr_exact',
    'step1': 'ai_flow',
    'step3': 'hierarchy_search',
    'step5': 'content_match'
  };

  // 判断是否为推荐策略
  const isRecommendedStrategy = (strategyKey: string): boolean => {
    if (!stepId) return false;
    return recommendedStrategyKeys[stepId as keyof typeof recommendedStrategyKeys] === strategyKey;
  };

  // 获取显示状态
  const getDisplayStatus = (): { 
    text: string; 
    loading: boolean; 
  } => {
    if (!currentCard) return { text: '🧠 智能·自动链', loading: false };
    
    const status = currentCard.status;
    const progress = currentCard.progress || 0;
    
    // 调试状态变化
    console.debug('[UnifiedMenu] 🎯 状态更新', {
      cardId: currentCard.id?.slice(-6),
      status,
      progress,
      jobId: currentCard.jobId?.slice(-6)
    });
    
    switch (status) {
      case 'analyzing':
        return { 
          text: `🧠 智能·自动链 🔄 ${progress}%`, 
          loading: true 
        };
      case 'ready': {
        // 检查是否有推荐策略和置信度
        const strategy = currentCard.strategy;
        const primaryStrategy = strategy?.primary;
        const isRecommended = primaryStrategy ? isRecommendedStrategy(primaryStrategy) : false;
        const confidence = currentCard.meta?.singleStepScore?.confidence || 
                          (strategy?.candidates?.find(c => c.key === primaryStrategy)?.confidence);
        
        let displayText = '🧠 智能·单步 ✅';
        
        if (isRecommended) {
          displayText = '🧠 智能·单步 荐';
        }
        
        if (confidence !== undefined) {
          const confidencePercent = Math.round(confidence * 100);
          displayText += ` ${confidencePercent}%`;
        }
        
        return { 
          text: displayText, 
          loading: false
        };
      }
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
      const { primary, backups = [], candidates = [] } = currentCard.strategy;
      
      // 查找主策略的置信度
      const primaryCandidate = candidates.find(c => c.key === primary);
      const primaryConfidence = primaryCandidate?.confidence ?? 0;
      const primaryName = primaryCandidate?.name || primary;
      
      const isPrimaryRecommended = isRecommendedStrategy(primary);
      
      items.push({
        key: 'primary',
        label: (
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: '180px', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: '500' }}>⭐ {primaryName}</span>
                {isPrimaryRecommended && (
                  <span style={{
                    background: 'var(--g-badge, rgba(16, 185, 129, 0.15))',
                    color: 'var(--g-fg, #10B981)',
                    border: '1px solid var(--g-border, rgba(16, 185, 129, 0.3))',
                    fontSize: '10px',
                    padding: '1px 4px',
                    borderRadius: '3px',
                    fontWeight: 'bold'
                  }}>
                    荐
                  </span>
                )}
              </div>
              <span style={{ 
                color: primaryConfidence >= 0.8 ? '#10B981' : primaryConfidence >= 0.6 ? '#F59E0B' : '#EF4444',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {Math.round(primaryConfidence * 100)}%
              </span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '3px', 
              background: 'rgba(148, 163, 184, 0.2)', 
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${primaryConfidence * 100}%`, 
                height: '100%',
                background: primaryConfidence >= 0.8 ? '#10B981' : primaryConfidence >= 0.6 ? '#F59E0B' : '#EF4444',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        ),
        onClick: () => console.log('执行推荐策略:', primary)
      });

      // 添加备选策略及其置信度
      backups.forEach((backup, index) => {
        const backupCandidate = candidates.find(c => c.key === backup);
        const backupConfidence = backupCandidate?.confidence ?? 0;
        const backupName = backupCandidate?.name || backup;
        const isBackupRecommended = isRecommendedStrategy(backup);
        
        items.push({
          key: `backup-${index}`,
          label: (
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '180px', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔄 {backupName}</span>
                  {isBackupRecommended && (
                    <span style={{
                      background: 'var(--g-badge, rgba(16, 185, 129, 0.15))',
                      color: 'var(--g-fg, #10B981)',
                      border: '1px solid var(--g-border, rgba(16, 185, 129, 0.3))',
                      fontSize: '10px',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      fontWeight: 'bold'
                    }}>
                      荐
                    </span>
                  )}
                </div>
                <span style={{ 
                  color: backupConfidence >= 0.8 ? '#10B981' : backupConfidence >= 0.6 ? '#F59E0B' : '#EF4444',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  {Math.round(backupConfidence * 100)}%
                </span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '2px', 
                background: 'rgba(148, 163, 184, 0.2)', 
                borderRadius: '1px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${backupConfidence * 100}%`, 
                  height: '100%',
                  background: backupConfidence >= 0.8 ? '#10B981' : backupConfidence >= 0.6 ? '#F59E0B' : '#EF4444',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          ),
          onClick: () => console.log('执行备选策略:', backup)
        });
      });
      
      // 添加分隔线和策略详情
      if (candidates.length > 0) {
        items.push({ type: 'divider' });
        
        items.push({
          key: 'strategy-info',
          label: (
            <div style={{ 
              fontSize: '11px', 
              color: '#94A3B8', 
              padding: '4px 0',
              borderTop: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              智能分析完成，共找到 {candidates.length} 个策略选项
            </div>
          ),
          disabled: true
        });
      }
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
            minWidth: '140px',
            transition: 'all 0.2s ease'
          }}
        >
          {displayStatus.text}
          <span style={{ marginLeft: '4px' }}>▾</span>
        </Button>
      </Dropdown>

      {/* 置信度显示 - 优先使用共享缓存 */}
      {currentCard?.status === 'ready' && (elementScore?.confidence !== undefined || currentCard.confidence !== undefined) && (
        <ConfidenceTag 
          confidence={elementScore?.confidence ?? currentCard.confidence ?? 0}
          evidence={elementScore?.evidence ?? currentCard.evidence}
          size="small"
          showLabel={false}
        />
      )}

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