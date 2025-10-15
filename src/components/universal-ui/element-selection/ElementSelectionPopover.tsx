// src/components/universal-ui/element-selection/ElementSelectionPopover.tsx
// module: ui | layer: ui | role: component
// summary: 元素选择气泡组件（含智能分析功能）

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ConfirmPopover from '../common-popover/ConfirmPopover';
import { PopoverActionButtons } from './components/PopoverActionButtons';
import type { PopoverActionTokens } from './components/tokens';
import type { UIElement } from '../../../api/universalUIAPI';
import { useSmartPopoverPosition } from './utils/popoverPositioning';
import { ElementDiscoveryModal } from './element-discovery';
import { StrategyAnalysisModal } from './strategy-analysis/StrategyAnalysisModal';
import { useIntelligentAnalysisAdapter } from '../../../hooks/universal-ui/useIntelligentAnalysisAdapter';
import { getIntelligentAnalysisConfig } from '../../../config/intelligentAnalysisConfig';
import { isDevDebugEnabled } from '../../../utils/debug';
import type { StrategyCandidate } from '../../../modules/universal-ui/types/intelligent-analysis-types';
import type { UnifiedAnalysisContext } from '../../../hooks/universal-ui/useIntelligentAnalysisAdapter';

export interface ElementSelectionState {
  element: UIElement;
  position: { x: number; y: number };
  confirmed: boolean;
}

export interface ElementSelectionPopoverProps {
  visible: boolean;
  selection: ElementSelectionState | null;
  xmlContent?: string; // XML内容支持，用于元素发现模态框
  onConfirm: () => void;
  onCancel: () => void; // 取消选择并关闭
  onHide?: () => void;  // 隐藏元素（与业务 hide 行为绑定）
  
  // 智能分析功能
  enableIntelligentAnalysis?: boolean; // 是否启用智能分析功能
  stepId?: string; // 关联的步骤ID，用于结果回填
  onStrategySelect?: (strategy: StrategyCandidate) => void; // 策略选择回调
  allElements?: UIElement[];
  onElementSelect?: (element: UIElement) => void;
  actionTokens?: Partial<PopoverActionTokens>; // 注入尺寸/间距令牌
  // 定位增强配置（可选）
  autoPlacement?: boolean;
  autoPlacementMode?: 'area' | 'linear';
  snapToAnchor?: boolean;
  clampRatio?: number; // 0-1, 默认 0.9
  // 点击外部自动取消（默认 true），特殊页面可关闭
  autoCancelOnOutsideClick?: boolean;
}

const ElementSelectionPopoverComponent: React.FC<ElementSelectionPopoverProps> = ({
  visible,
  selection,
  xmlContent,
  onConfirm,
  onCancel,
  onHide,
  // 智能分析相关
  enableIntelligentAnalysis = false,
  stepId,
  onStrategySelect,
  allElements = [],
  onElementSelect,
  actionTokens,
  autoPlacement = true,
  autoPlacementMode = 'area',
  snapToAnchor = true,
  clampRatio = 0.9,
  autoCancelOnOutsideClick = true
}) => {
  const __DEV__ = process.env.NODE_ENV === 'development';
  const __DEBUG_VISUAL__ = isDevDebugEnabled('debug:visual');
  
  // 智能分析相关状态
  const [strategyAnalysisModalOpen, setStrategyAnalysisModalOpen] = useState(false);
  const analysisConfig = useMemo(() => getIntelligentAnalysisConfig(), []);
  const {
    analysisState,
    analysisProgress,
    analysisResult,
    startAnalysis,
    cancelAnalysis,
    resetAnalysis
  } = useIntelligentAnalysisAdapter(analysisConfig);
  
  const [discoveryModalOpen, setDiscoveryModalOpen] = useState(false);
  // 避免“同一次点击”引发的立刻关闭：打开后的短暂宽限期内禁用外部点击自动取消
  const [allowOutsideCancel, setAllowOutsideCancel] = useState(false);
  const outsideCancelTimerRef = useRef<number | null>(null);
  
  // 🔧 修复：使用 useMemo 稳定 ID 引用
  const popoverId = useMemo(() => {
    return `element-popover-${selection?.element.id || 'unknown'}`;
  }, [selection?.element.id]);

  // 🔧 修复：使用 useCallback 稳定函数引用
  const handleConfirm = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (__DEV__ && __DEBUG_VISUAL__) console.debug('🎯 [ElementSelectionPopover] 确认选择');
    onConfirm();
  }, [onConfirm]);

  const handleCancel = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (__DEV__ && __DEBUG_VISUAL__) {
      console.debug('🎯 [ElementSelectionPopover] 取消选择 - 开始执行');
      console.debug('🎯 [ElementSelectionPopover] onCancel函数:', typeof onCancel, onCancel);
    }
    onCancel();
    if (__DEV__ && __DEBUG_VISUAL__) console.debug('🎯 [ElementSelectionPopover] 取消选择 - 执行完成');
  }, [onCancel]);

  const handleDiscovery = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (__DEV__ && __DEBUG_VISUAL__) console.debug('🎯 [ElementSelectionPopover] 打开发现模态框');
    setDiscoveryModalOpen(true);
  }, []);

  // 智能分析相关事件处理
  const handleStartAnalysis = useCallback(async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!selection?.element) return;
    
    const context: UnifiedAnalysisContext = {
      element: selection.element,
      stepId,
      jobId: `analysis_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    };
    
    if (__DEV__) console.log('👆 [用户操作] 点击智能分析按钮', context);
    await startAnalysis(context);
  }, [selection?.element, stepId, startAnalysis]);

  const handleCancelAnalysis = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (__DEV__) console.log('🚫 [用户操作] 取消智能分析');
    cancelAnalysis();
  }, [cancelAnalysis]);

  const handleViewAnalysisDetails = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (__DEV__) console.log('🔍 [用户操作] 查看详细分析结果');
    setStrategyAnalysisModalOpen(true);
  }, []);

  const handleApplyStrategy = useCallback((strategy: StrategyCandidate, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (__DEV__) console.log('✨ [用户操作] 选择策略:', strategy.name);
    onStrategySelect?.(strategy);
    // 应用策略后通常也要确认选择
    onConfirm();
  }, [onStrategySelect, onConfirm]);

  const handleRetryAnalysis = useCallback(async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (__DEV__) console.log('🔄 [用户操作] 重试智能分析');
    resetAnalysis();
    await handleStartAnalysis(e);
  }, [resetAnalysis, handleStartAnalysis]);

  const handleStrategyModalClose = useCallback(() => {
    setStrategyAnalysisModalOpen(false);
  }, []);

  const handleStrategySelect = useCallback((strategy: StrategyCandidate) => {
    if (__DEV__) console.log('✅ [策略选择] 从模态框选择策略:', strategy.name);
    setStrategyAnalysisModalOpen(false);
    onStrategySelect?.(strategy);
    // 选择策略后也确认元素选择
    onConfirm();
  }, [onStrategySelect, onConfirm]);

  // 🔧 修复：简化的智能定位，减少重复计算
  const positioning = useSmartPopoverPosition(
    selection?.position || null,
    {
      preferredPlacement: 'top',
      popoverSize: { width: 220, height: 100 },
      margin: 12,
      autoPlacement,
      autoPlacementMode: autoPlacementMode as 'area' | 'linear',
      snapToAnchor,
      clampRatio,
    }
  );

  // 🔧 修复：简化的显示条件判断
  const shouldShow = useMemo(() => {
    return visible && selection && positioning;
  }, [visible, selection, positioning]);

  // 🔧 修复：打开后短暂忽略 outside click 导致的自动取消，避免“刚打开就消失”
  useEffect(() => {
    if (shouldShow) {
      setAllowOutsideCancel(false);
      // 100-150ms 的宽限期足以跨过同一轮事件循环的文档点击侦听
      if (outsideCancelTimerRef.current) {
        window.clearTimeout(outsideCancelTimerRef.current);
      }
      outsideCancelTimerRef.current = window.setTimeout(() => {
        setAllowOutsideCancel(true);
        outsideCancelTimerRef.current = null;
      }, 150);
    } else {
      // 隐藏时立刻关闭允许标志并清理定时器
      setAllowOutsideCancel(false);
      if (outsideCancelTimerRef.current) {
        window.clearTimeout(outsideCancelTimerRef.current);
        outsideCancelTimerRef.current = null;
      }
    }
    return () => {
      if (outsideCancelTimerRef.current) {
        window.clearTimeout(outsideCancelTimerRef.current);
        outsideCancelTimerRef.current = null;
      }
    };
  }, [shouldShow]);

  // 🔧 修复：ESC 键监听（简化版）
  useEffect(() => {
    if (!shouldShow) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (__DEV__ && __DEBUG_VISUAL__) console.debug('⌨️ [ElementSelectionPopover] ESC键取消');
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shouldShow, handleCancel]);

  // 🔧 修复：性能监控（简化版，仅在开发环境）
  useEffect(() => {
    if (__DEV__ && __DEBUG_VISUAL__ && shouldShow) {
      console.debug('🎯 [ElementSelectionPopover] 显示气泡', {
        elementId: selection?.element.id?.substring(0, 20),
        position: selection?.position
      });
    }
  }, [__DEV__, shouldShow, selection?.element?.id, selection?.position]);

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <div
        key={popoverId}
        className="element-selection-popover"
        style={{
          position: 'fixed',
          left: positioning!.position.x,
          top: positioning!.position.y,
          zIndex: 10000, // 🔧 固定 Z-index，避免复杂计算
          pointerEvents: 'none',
        }}
      >
        <ConfirmPopover
          open={visible}
          onCancel={() => handleCancel()}
          // 关键修复：当发现模态框打开时，禁用“外部点击自动取消”
          autoCancelOnOutsideClick={allowOutsideCancel && !discoveryModalOpen && autoCancelOnOutsideClick}
          title={
            <div style={{ maxWidth: '220px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                选择此元素？
              </div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                {selection.element.text || 
                 selection.element.resource_id || 
                 selection.element.class_name || '未知元素'}
              </div>
              
              <PopoverActionButtons
                onConfirm={handleConfirm}
                onDiscovery={allElements.length > 0 && onElementSelect ? handleDiscovery : undefined}
                onHide={onHide ? (e) => {
                  e?.stopPropagation?.();
                  if (__DEV__ && __DEBUG_VISUAL__) console.debug('🫥 [ElementSelectionPopover] 隐藏按钮被点击');
                  onHide();
                } : undefined}
                onCancel={(e) => {
                  if (__DEV__ && __DEBUG_VISUAL__) console.debug('🖱️ [ElementSelectionPopover] 取消按钮被点击');
                  handleCancel(e);
                }}
                tokens={actionTokens}
                autoCompact
                // 智能分析相关props
                enableIntelligentAnalysis={enableIntelligentAnalysis}
                analysisState={analysisState}
                analysisProgress={analysisProgress}
                recommendedStrategy={analysisResult?.recommendedStrategy || null}
                onStartAnalysis={handleStartAnalysis}
                onCancelAnalysis={handleCancelAnalysis}
                onViewAnalysisDetails={handleViewAnalysisDetails}
                onApplyStrategy={handleApplyStrategy}
                onRetryAnalysis={handleRetryAnalysis}
              />
            </div>
          }
          overlayStyle={{
            pointerEvents: 'auto',
            maxWidth: positioning?.suggestedMaxSize?.width,
            maxHeight: positioning?.suggestedMaxSize?.height,
            overflow: positioning?.clamped ? 'auto' : undefined,
          }}
          placement={positioning!.placement}
        >
          {/* 隐藏的触发元素 */}
          <div style={{ width: 1, height: 1, opacity: 0 }} />
  </ConfirmPopover>
      </div>

      {/* 元素发现模态框 */}
      {discoveryModalOpen && (
        <ElementDiscoveryModal
          open={discoveryModalOpen}
          onClose={() => setDiscoveryModalOpen(false)}
          targetElement={selection.element}
          allElements={allElements}
          xmlContent={xmlContent} // 🆕 传递XML内容
          onElementSelect={(element) => {
            if (__DEV__ && __DEBUG_VISUAL__) console.debug('🎯 ElementSelectionPopover: 选择新发现的元素', element.id);
            onElementSelect?.(element);
            setDiscoveryModalOpen(false);
          }}
          // 防止点击冒泡到 Popconfirm 的 outside 区域
          // @ts-expect-error - 组件内部容器需支持 onClick
          onClick={(e: React.MouseEvent) => { e.stopPropagation?.(); }}
        />
      )}
      
      {/* 策略分析模态框 */}
      {enableIntelligentAnalysis && analysisResult && selection?.element && (
        <StrategyAnalysisModal
          open={strategyAnalysisModalOpen}
          onClose={handleStrategyModalClose}
          element={selection.element}
          analysisResult={{
            recommendedStrategy: analysisResult.recommendedStrategy,
            alternatives: analysisResult.alternatives,
            analysisMetadata: {
              totalTime: analysisResult.metadata.analysisTime,
              elementComplexity: 'medium' as const,
              containerStability: 0.8,
              textStability: 0.9,
            },
          }}
          onStrategySelect={handleStrategySelect}
        />
      )}
    </>
  );
};

// 🔧 修复 React.memo 比较逻辑，确保事件处理器更新
const ElementSelectionPopover = React.memo(ElementSelectionPopoverComponent, (prevProps, nextProps) => {
  // 🎯 完整比较所有关键属性，包括事件处理器
  return (
    prevProps.visible === nextProps.visible &&
    prevProps.selection?.element.id === nextProps.selection?.element.id &&
    prevProps.selection?.position.x === nextProps.selection?.position.x &&
    prevProps.selection?.position.y === nextProps.selection?.position.y &&
    prevProps.allElements.length === nextProps.allElements.length &&
    // 🔧 修复：确保事件处理器变化时组件会重新渲染
    prevProps.onConfirm === nextProps.onConfirm &&
    prevProps.onCancel === nextProps.onCancel &&
    prevProps.onHide === nextProps.onHide &&
    prevProps.onElementSelect === nextProps.onElementSelect
  );
});

ElementSelectionPopover.displayName = 'ElementSelectionPopover';

// 同时提供具名导出与默认导出，兼容两种导入方式
export { ElementSelectionPopover };
export default ElementSelectionPopover;