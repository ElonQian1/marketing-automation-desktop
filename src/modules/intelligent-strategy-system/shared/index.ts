/**
 * 智能策略系统 - 共享工具模块
 * 统一导出所有工具类，消除项目中的重复代码
 */

// Bounds 相关工具
export { BoundsCalculator, type BoundsRect, type BoundsInfo } from './bounds/BoundsCalculator';

// Element 相关工具  
export { ElementValidator, type ElementLike } from './element-utils/ElementValidator';
export { 
  XPathGenerator, 
  type XPathStrategy, 
  type XPathGeneratorConfig 
} from './element-utils/XPathGenerator';

// 导入类用于便捷工具
import { BoundsCalculator } from './bounds/BoundsCalculator';
import { ElementValidator } from './element-utils/ElementValidator';
import { XPathGenerator } from './element-utils/XPathGenerator';

// 便捷重导出常用功能
export const SharedUtils = {
  // Bounds 工具
  parseBounds: BoundsCalculator.parseBounds,
  calculateDistance: BoundsCalculator.calculateDistance,
  calculateDirection: BoundsCalculator.calculateDirection,
  
  // Element 工具
  hasValidResourceId: ElementValidator.hasValidResourceId,
  hasMeaningfulText: ElementValidator.hasMeaningfulText,
  isClickable: ElementValidator.isClickable,
  getElementIdentifier: ElementValidator.getElementIdentifier,
  
  // XPath 工具
  generateXPath: XPathGenerator.generate,
  generateXPathCandidates: XPathGenerator.generateCandidates,
  isValidXPath: XPathGenerator.isValidXPath
} as const;