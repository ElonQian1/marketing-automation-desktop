/**
 * 数据转换模块类型定义
 */

import { UIElement } from '../../../api/universalUIAPI';
import { VisualUIElement } from '../xml-parser/types';

// 使用统一的元素上下文定义
import type { ElementContext } from '../../../modules/intelligent-strategy-system/shared/types/element';
export type { ElementContext };

// 转换选项
export interface ConversionOptions {
  generateXpath?: boolean;
  includeContext?: boolean;
  validateBounds?: boolean;
  defaultScreenSize?: {
    width: number;
    height: number;
  };
}

// 转换结果
export interface ConversionResult {
  uiElement: UIElement;
  context?: ElementContext;
  warnings: string[];
  metadata: {
    conversionTime: number;
    originalId: string;
    hasValidBounds: boolean;
  };
}

// 通用转换结果
export interface GenericConversionResult<T> {
  success: boolean;
  visualElement?: VisualUIElement;
  uiElement?: UIElement;
  result?: T;
  error?: Error;
  metadata: {
    conversionType: string;
    timestamp: number;
    hasPosition: boolean;
    hasText: boolean;
  };
}