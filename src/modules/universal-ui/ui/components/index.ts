// src/modules/universal-ui/ui/components/index.ts
// module: universal-ui | layer: ui | role: exports
// summary: 统一导出所有智能分析相关UI组件

// 暂用兜底徽标
export { UniversalFallbackBadge, UniversalRecommendedBadge } from './universal-fallback-badge';
export type { UniversalFallbackBadgeProps, UniversalRecommendedBadgeProps } from './universal-fallback-badge';

// 候选策略展示区
export { UniversalStrategyCandidatesSection } from './universal-strategy-candidates-section';
export type { UniversalStrategyCandidatesSectionProps } from './universal-strategy-candidates-section';

// 策略模式切换器
export { UniversalStrategyModeSelector } from './universal-strategy-mode-selector';
export type { UniversalStrategyModeSelectorProps } from './universal-strategy-mode-selector';

// 发布准备度闸门
export { UniversalPublishReadinessModal } from './universal-publish-readiness-modal';
export type { UniversalPublishReadinessModalProps } from './universal-publish-readiness-modal';

// 分析状态展示区（已存在）
export { UniversalAnalysisStatusSection } from './universal-analysis-status-section';

/**
 * 使用示例：
 * 
 * ```tsx
 * import { 
 *   UniversalFallbackBadge,
 *   UniversalStrategyCandidatesSection,
 *   UniversalStrategyModeSelector,
 *   UniversalPublishReadinessModal
 * } from '@/modules/universal-ui/ui/components';
 * 
 * // 在步骤卡片中使用
 * <UniversalFallbackBadge 
 *   isFallbackActive={stepCard.isFallbackActive}
 *   fallbackName={stepCard.fallbackStrategy.name}
 *   isAnalyzing={stepCard.analysisState === 'analyzing'}
 * />
 * 
 * <UniversalStrategyCandidatesSection
 *   smartCandidates={stepCard.smartCandidates}
 *   activeStrategyKey={stepCard.activeStrategy?.key}
 *   onApplyStrategy={handleApplyStrategy}
 * />
 * 
 * <UniversalStrategyModeSelector
 *   currentMode={stepCard.strategyMode}
 *   onModeChange={handleModeChange}
 *   smartCandidates={stepCard.smartCandidates}
 * />
 * 
 * // 在发布流程中使用
 * <UniversalPublishReadinessModal
 *   visible={showModal}
 *   steps={allSteps}
 *   onPublish={handlePublish}
 *   onCompleteAnalysisAndPublish={handleCompleteAndPublish}
 * />
 * ```
 */
