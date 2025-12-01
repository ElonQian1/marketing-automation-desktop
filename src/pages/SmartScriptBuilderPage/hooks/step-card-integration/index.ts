// src/pages/SmartScriptBuilderPage/hooks/step-card-integration/index.ts
// module: pages | layer: hooks | role: module exports
// summary: 步骤卡片集成模块统一导出

// Types
export type {
  ElementSelectionContext,
  ElementEnrichmentData,
  SmartMatchingConfig,
} from "./types";

// Utils
export {
  smartMergeChildTexts,
  generateStepTitle,
  extractEnrichmentFromXmlDoc,
  computeBoundsString,
  normalizeStepType,
  isMenuElementCheck,
  generateSmartStepName,
  buildSimpleChildren,
  generateValidXPath,
  buildFallbackXPath,
  validateXPath,
  buildSmartMatchingConfig,
} from "./utils";
