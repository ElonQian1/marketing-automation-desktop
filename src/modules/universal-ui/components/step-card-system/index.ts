// src/modules/universal-ui/components/step-card-system/index.ts
// module: universal-ui | layer: components | role: system-export
// summary: 步骤卡片系统统一导出入口，防止内部组件被误用

/**
 * 步骤卡片系统 - 统一导出
 *
 * 🎯 重要说明：
 * StepCardSystem 是一个完整的系统，由以下部件协同工作：
 * - InteractionLayer: 处理拖拽、编辑、视觉交互
 * - IntelligentLayer: 处理智能分析、策略优化
 * - PresentationLayer: 统一的视觉呈现
 *
 * ⚠️ 使用规范：
 * - 只使用 StepCardSystem 作为入口
 * - 不要直接导入内部 Layer 组件
 * - 系统会自动协调各层的工作
 */

// === 主要使用接口 ===
export { StepCardSystem } from "./StepCardSystem";
// 暂时注释掉缺失的组件，等待后续实现
// export { StepCardSystemProvider } from './StepCardSystemProvider';

// === 类型定义 ===
export type {
  StepCardSystemProps,
  StepCardInteractionConfig,
  StepCardIntelligentConfig,
  StepCardSystemCallbacks,
} from "./types/step-card-system-types";

// === Hook 接口 ===
// 暂时注释掉缺失的 Hook，等待后续实现
// export { useStepCardSystem } from './hooks/useStepCardSystem';

// ⚠️ 内部组件不导出，防止误用
// 以下组件是系统内部实现，不应该被外部直接使用：
// - StepCardInteractionLayer
// - StepCardIntelligentLayer
// - StepCardPresentationLayer

/**
 * 使用示例：
 *
 * ```tsx
 * import { StepCardSystem } from '@/modules/universal-ui/components/step-card-system';
 *
 * <StepCardSystem
 *   stepData={stepData}
 *   interactionConfig={{ enableDrag: true, enableEdit: true }}
 *   intelligentConfig={{ enableAnalysis: true, enableAutoUpgrade: true }}
 * />
 * ```
 */
