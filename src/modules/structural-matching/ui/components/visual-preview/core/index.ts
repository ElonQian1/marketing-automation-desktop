// src/modules/structural-matching/ui/components/visual-preview/core/index.ts
// module: structural-matching | layer: ui | role: 导出
// summary: 核心算法层统一导出

export {
  calculateViewportAlignment,
  calculateSmartWindowPosition,
} from './structural-matching-viewport-alignment';

export {
  calculateCropConfig,
  absoluteToRelativeCoords,
  relativeToAbsoluteCoords,
  calculateElementVisibility,
  calculateOverlapArea,
  calculateCenter,
  calculateDistance,
} from './structural-matching-coordinate-transform';

export {
  correctElementBounds,
  recalculateChildElements,
} from './structural-matching-bounds-corrector';

export type { CorrectedElementBounds } from './structural-matching-bounds-corrector';

export {
  calculateSmartCrop,
  calculateSmartCropForElement,
  calculatePreciseCrop,
  isElementInCropArea,
} from './structural-matching-crop-calculator';

export type { PreciseCropResult } from './structural-matching-crop-calculator';

// 🎯 新增：模块化XML和数据加载器
export {
  parseXmlWithStrictHierarchy,
  recalculateHierarchyAfterCorrection,
  type StructuralMatchingHierarchyResult,
  type StructuralMatchingXmlParseOptions,
} from "./structural-matching-xml-hierarchy-parser";

export { StructuralMatchingXmlLoader } from "./structural-matching-xml-loader";

export { StructuralMatchingScreenshotLoader } from "./structural-matching-screenshot-loader";
