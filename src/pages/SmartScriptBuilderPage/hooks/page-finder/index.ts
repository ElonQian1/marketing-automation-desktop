/**
 * Page Finder 模块化导出
 * 提供简化的页面查找器Hook和相关类型
 */

// 主Hook导出
export { usePageFinderModular as usePageFinder } from './usePageFinderModular';

// 处理器类导出
export { SnapshotHandler } from './handlers/SnapshotHandler';
export { ElementSelectionHandler } from './handlers/ElementSelectionHandler';

// 类型导出
export type {
  UsePageFinderDeps,
  UsePageFinderReturn,
  PageAnalyzerOptions,
  SnapshotFixMode,
  DeviceInfo,
  SnapshotHandlerConfig,
  ElementSelectionHandlerConfig,
} from './types/index';

// 便利导出
export { usePageFinderModular } from './usePageFinderModular';