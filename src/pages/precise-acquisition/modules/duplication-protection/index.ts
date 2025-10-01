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
  DuplicationEvent
} from './types';