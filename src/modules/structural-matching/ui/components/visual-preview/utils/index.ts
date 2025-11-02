// src/modules/structural-matching/ui/components/visual-preview/utils/index.ts
// module: structural-matching | layer: ui | role: 导出
// summary: 工具函数层统一导出

export {
  generateCropDebugInfo,
  logCropDebugInfo,
  validateCropConfig,
  createDebugVisualization,
  type CropDebugInfo,
} from './structural-matching-debug-helper';

export {
  extractSubtreeElementsFromXml,
  extractParentElementFromXml,
  extractElementByIdFromXml,
} from './structural-matching-subtree-extractor';

export {
  debugXmlAttributeExtraction,
  debugVisualUIElements,
  debugAttributeMapping,
} from './structural-matching-xml-debug-tool';

export {
  adaptBackendElementToVisualUI,
  adaptBackendElementsToVisualUI,
  type BackendElementData,
} from './structural-matching-data-adapter';
