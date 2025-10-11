// src/types/self-contained/elementLocator.ts
// module: shared | layer: types | role: 类型定义
// summary: TypeScript接口和类型声明

/**
 * ElementLocator 类型定义
 */

export interface ElementLocator {
  selectedBounds: { left: number; top: number; right: number; bottom: number };
  elementPath: string;
  confidence: number;
  additionalInfo?: {
    xpath?: string;
    resourceId?: string;
    text?: string;
    contentDesc?: string;
    className?: string;
    bounds?: string;
  };
}

export default ElementLocator;
