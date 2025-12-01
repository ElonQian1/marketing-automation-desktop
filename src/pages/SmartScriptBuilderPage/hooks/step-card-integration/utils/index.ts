// src/pages/SmartScriptBuilderPage/hooks/step-card-integration/utils/index.ts
// module: pages | layer: hooks | role: utils index
// summary: 工具函数统一导出

export {
  smartMergeChildTexts,
  generateStepTitle,
  extractEnrichmentFromXmlDoc,
  computeBoundsString,
  normalizeStepType,
  isMenuElementCheck,
  generateSmartStepName,
  buildSimpleChildren,
} from "./element-text-utils";

export {
  generateValidXPath,
  buildFallbackXPath,
  validateXPath,
  buildSmartMatchingConfig,
} from "./xpath-utils";
