// src/pages/precise-acquisition/modules/duplication-protection/index.ts
// module: ui | layer: ui | role: page
// summary: 页面组件

/**
 * 智能查重防护系统
 */

export { DuplicationRuleManager } from './DuplicationRuleManager';
export { DuplicationDetector } from './DuplicationDetector';
export { DuplicationConfigPanel } from './DuplicationConfigPanel';
export { DuplicationLogViewer } from './DuplicationLogViewer';

export type {
  DuplicationRule,
  DuplicationCheck,
  DuplicationHistory,
  DuplicationEvent,
  DuplicationConfig,
  DuplicationAnalytics
} from './types';