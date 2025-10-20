// src/components/strategy-selector/CompactStrategyMenu.tsx
// module: ui | layer: ui | role: 紧凑策略选择菜单
// summary: 替代大块策略选择器的紧凑下拉菜单，集成到步骤卡片标题栏

import React, { useState } from 'react';
import { Dropdown, Button, Tooltip, Badge, Tag } from 'antd';
import { RefreshCcwIcon, ClipboardListIcon, SearchIcon, MoreHorizontalIcon } from 'lucide-react';
import { 
  StrategySelector as IStrategySelector, 
  StrategyEvents, 
  SmartStep 
} from '../../types/strategySelector';
import { useStepCardStore } from '../../store/stepcards';

const STRATEGY_ICONS = {
  'smart-auto': '🧠',
  'smart-single': '🎯', 
  'static': '📌'
};

const STRATEGY_LABELS = {
  'smart-auto': '智能·自动链',
  'smart-single': '智能·单步',
  'static': '静态策略'
};

const SMART_STEPS: { step: SmartStep; label: string }[] = [
  { step: 'step1', label: 'Step1 - 基础识别' },
  { step: 'step2', label: 'Step2 - 属性匹配' },
  { step: 'step3', label: 'Step3 - 结构分析' },
  { step: 'step4', label: 'Step4 - 语义理解' },
  { step: 'step5', label: 'Step5 - 上下文推理' },
  { step: 'step6', label: 'Step6 - 全局索引' },
];

interface CompactStrategyMenuProps {
  selector: IStrategySelector;
  events: StrategyEvents;
  disabled?: boolean;
  compact?: boolean;
  stepId?: string; // 新增：用于获取置信度数据
}

const CompactStrategyMenu: React.FC<CompactStrategyMenuProps> = ({
  selector,
  events,
  disabled = false,
  compact = true,
  stepId
}) => {
  const [showExpandedView, setShowExpandedView] = useState(false);
  
  // 获取置信度和策略数据
  const getCard = useStepCardStore(state => state.getCard);
  const card = stepId ? getCard(stepId) : null;
  const confidence = card?.meta?.singleStepScore?.confidence;
  const confidencePercent = confidence ? Math.round(confidence * 100) : 0;
  const recommendedKey = card?.strategy?.primary;

  // 获取当前策略的显示信息
  const getCurrentStrategyLabel = () => {
    if (!selector.activeStrategy) {
      return '🔄 未选择策略';
    }
    
    const { type, stepName } = selector.activeStrategy;
    const icon = STRATEGY_ICONS[type];
    const baseLabel = STRATEGY_LABELS[type];
    
    if (type === 'smart-single' && stepName) {
      const step = SMART_STEPS.find(s => s.step === stepName);
      return `${icon} ${step?.label || stepName}`;
    }
    
    return `${icon} ${baseLabel}`;
  };

  // 构建策略选择菜单
  const getStrategyMenu = () => {
    const items = [
      {
        key: 'smart-auto',
        icon: <span>🧠</span>,
        label: '智能·自动链',
        onClick: () => events.onStrategyChange({ type: 'smart-auto' })
      },
      {
        key: 'smart-single',
        icon: <span>🎯</span>,
        label: '智能·单步',
        children: SMART_STEPS.map(({ step, label }) => {
          // 映射recommendedKey到Step
          const keyMap: Record<string, string> = {
            self_anchor: 'step6',
            text_semantic: 'step4', 
            attr_exact: 'step2',
            struct_path: 'step3',
            context_nearby: 'step5',
            basic_locator: 'step1'
          };
          
          const isRecommended = recommendedKey && keyMap[recommendedKey] === step;
          
          return {
            key: `smart-single-${step}`,
            label: (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {isRecommended && <Badge status="processing" text="荐" />}
                  {confidencePercent > 0 && <Tag color="blue" size="small">{confidencePercent}%</Tag>}
                </div>
              </div>
            ),
            onClick: () => events.onStrategyChange({ type: 'smart-single', stepName: step })
          };
        })
      },
      {
        key: 'static',
        icon: <span>📌</span>,
        label: '静态策略',
        children: (selector.candidates?.static?.length ?? 0) > 0
          ? selector.candidates.static!.map(candidate => ({
              key: `static-${candidate.key}`,
              label: candidate.name,
              onClick: () => events.onStrategyChange({ type: 'static', key: candidate.key })
            }))
          : [{
              key: 'no-static',
              label: '暂无静态策略',
              disabled: true
            }]
      }
    ];

    return { items };
  };

  // 分析状态指示器
  const getAnalysisStatus = () => {
    const { analysis } = selector;
    
    if (analysis.status === 'analyzing') {
      return (
        <span style={{ 
          color: '#F59E0B', 
          fontSize: '12px', 
          marginLeft: '4px' 
        }}>
          🔄 {analysis.progress || 0}%
        </span>
      );
    }
    
    if (analysis.status === 'failed') {
      return (
        <span style={{ 
          color: '#EF4444', 
          fontSize: '12px', 
          marginLeft: '4px' 
        }}>
          ❌
        </span>
      );
    }
    
    if (analysis.status === 'completed') {
      return (
        <span style={{ 
          color: '#10B981', 
          fontSize: '12px', 
          marginLeft: '4px' 
        }}>
          ✅
        </span>
      );
    }
    
    return null;
  };

  // 调试：监控状态变化
  React.useEffect(() => {
    const debugInfo = {
      disabled,
      analysisStatus: selector.analysis.status,
      activeStrategy: selector.activeStrategy?.type,
      hasActiveStrategy: !!selector.activeStrategy,
      timestamp: new Date().toISOString(),
      isButtonDisabled: disabled || selector.analysis.status === 'analyzing'
    };
    console.log('🔍 [CompactStrategyMenu] 状态变化:', debugInfo);
  }, [disabled, selector.analysis.status, selector.activeStrategy]);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '4px',
      flexWrap: 'wrap'
    }}>
      {/* 主策略选择按钮 */}
      <Dropdown 
        menu={getStrategyMenu()} 
        trigger={['click']} 
        disabled={disabled && selector.analysis.status === 'analyzing'}
      >
        <Button
          size="small"
          type="default"
          loading={selector.analysis.status === 'analyzing'}
          style={{
            background: 'rgba(110, 139, 255, 0.1)',
            border: '1px solid rgba(110, 139, 255, 0.3)',
            color: '#F8FAFC',
            fontSize: '12px'
          }}
        >
          {getCurrentStrategyLabel()}
          {getAnalysisStatus()}
          <span style={{ marginLeft: '4px' }}>▾</span>
        </Button>
      </Dropdown>

      {/* 工具按钮组 */}
      <div style={{ display: 'flex', gap: '2px' }}>
        <Tooltip title="重新分析">
          <Button
            size="small"
            type="text"
            icon={<RefreshCcwIcon size={12} />}
            onClick={() => {
              console.log('🔄 [CompactStrategyMenu] 重新分析按钮点击:', {
                disabled,
                analysisStatus: selector.analysis.status,
                activeStrategy: selector.activeStrategy,
                hasSelector: !!selector,
                timestamp: new Date().toISOString()
              });
              
              // 无论当前状态如何，都触发重新分析（这会重置状态）
              events.onReanalyze();
            }}
            disabled={disabled}
            style={{
              color: '#64748B',
              border: 'none',
              padding: '2px 4px',
              minWidth: '24px',
              height: '24px'
            }}
          />
        </Tooltip>

        <Tooltip title={`查看候选 (${(selector.candidates?.smart?.length ?? 0) + (selector.candidates?.static?.length ?? 0)})`}>
          <Button
            size="small"
            type="text"
            icon={<ClipboardListIcon size={12} />}
            onClick={() => setShowExpandedView(!showExpandedView)}
            disabled={disabled}
            style={{
              color: '#64748B',
              border: 'none',
              padding: '2px 4px',
              minWidth: '24px',
              height: '24px'
            }}
          />
        </Tooltip>

        <Tooltip title="元素检查器">
          <Button
            size="small"
            type="text"
            icon={<SearchIcon size={12} />}
            onClick={events.onOpenElementInspector}
            disabled={disabled}
            style={{
              color: '#64748B',
              border: 'none',
              padding: '2px 4px',
              minWidth: '24px',
              height: '24px'
            }}
          />
        </Tooltip>
      </div>

      {/* 展开详情按钮 */}
      {compact && (
        <Tooltip title={showExpandedView ? "收起详情" : "展开详情"}>
          <Button
            size="small"
            type="text"
            icon={<MoreHorizontalIcon size={12} />}
            onClick={() => setShowExpandedView(!showExpandedView)}
            style={{
              color: '#64748B',
              border: 'none',
              padding: '2px 4px',
              minWidth: '24px',
              height: '24px'
            }}
          />
        </Tooltip>
      )}

      {/* 扩展视图：显示推荐和候选信息 */}
      {showExpandedView && (
        <div style={{
          width: '100%',
          marginTop: '8px',
          padding: '8px',
          background: 'rgba(30, 41, 59, 0.5)',
          borderRadius: '6px',
          border: '1px solid rgba(51, 65, 85, 0.5)',
          fontSize: '12px'
        }}>
          {/* 推荐策略 */}
          {selector.recommended && (
            <div style={{ 
              marginBottom: '8px', 
              padding: '6px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '4px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{ color: '#10B981', fontWeight: 500 }}>
                💡 推荐策略 (置信度: {Math.round(selector.recommended.confidence * 100)}%)
              </div>
              <Button
                size="small"
                type="primary"
                onClick={() => events.onApplyRecommendation(selector.recommended!.key)}
                style={{
                  marginTop: '4px',
                  fontSize: '11px',
                  height: '20px',
                  padding: '0 8px'
                }}
              >
                应用推荐
              </Button>
            </div>
          )}

          {/* 候选策略简要信息 */}
          <div style={{ color: '#CBD5E1' }}>
            智能候选: {selector.candidates?.smart?.length ?? 0} 个 | 
            静态候选: {selector.candidates?.static?.length ?? 0} 个
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactStrategyMenu;