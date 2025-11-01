// src/modules/structural-matching/ui/components/visual-preview/floating-visual-overlay-adapter.tsx
// module: structural-matching | layer: ui | role: 适配器组件
// summary: 旧版FloatingVisualOverlay接口的适配器

import React, { useMemo } from 'react';
import { FloatingVisualWindow } from './floating-window';
import type { StepCardData } from './floating-window/types';
import type { VisualUIElement } from '../../../../../components/universal-ui/types';

/**
 * 旧版悬浮可视化覆盖层属性接口（保持向后兼容）
 */
export interface FloatingVisualOverlayProps {
  /** 是否显示悬浮层 */
  visible: boolean;
  /** 选中的元素数据 */
  selectedElement: Record<string, unknown> | null;
  /** 高亮元素ID */
  highlightedElementId?: string | null;
  /** 鼠标位置 */
  mousePosition?: { x: number; y: number };
  /** 显示延迟 */
  delay?: number;
}

/**
 * 将旧版selectedElement转换为新版StepCardData格式
 */
function convertToStepCardData(selectedElement: Record<string, unknown> | null): StepCardData | undefined {
  if (!selectedElement) return undefined;

  // 处理可能的嵌套结构
  type NestedElement = {
    selectedElement?: Record<string, unknown>;
  };
  const actualElement = (selectedElement as NestedElement)?.selectedElement || selectedElement;

  // 定义已知的字段类型
  type KnownElement = {
    id?: string;
    xmlCacheId?: string;
    xpath?: string;
    bounds?: string | { left: number; top: number; right: number; bottom: number };
    text?: string;
    resourceId?: string;
    className?: string;
    [key: string]: unknown;
  };

  type BoundsObject = { left: number; top: number; right: number; bottom: number };

  const element = actualElement as KnownElement;

  // 处理bounds字段 - 确保转换为字符串格式
  let boundsString: string | undefined;
  if (typeof element.bounds === 'string') {
    boundsString = element.bounds;
  } else if (element.bounds && typeof element.bounds === 'object') {
    const boundsObj = element.bounds as BoundsObject;
    boundsString = `[${boundsObj.left},${boundsObj.top}][${boundsObj.right},${boundsObj.bottom}]`;
  }

  // 创建兼容的original_element
  const compatibleElement: VisualUIElement = {
    id: element.id || '',
    text: element.text || '',
    description: '', // 默认值
    type: element.className || '',
    category: 'unknown', // 默认分类
    position: element.bounds && typeof element.bounds === 'object' 
      ? {
          x: (element.bounds as BoundsObject).left || 0,
          y: (element.bounds as BoundsObject).top || 0,
          width: ((element.bounds as BoundsObject).right || 0) - ((element.bounds as BoundsObject).left || 0),
          height: ((element.bounds as BoundsObject).bottom || 0) - ((element.bounds as BoundsObject).top || 0),
        }
      : { x: 0, y: 0, width: 0, height: 0 },
    clickable: true,
    importance: 'medium' as const,
    userFriendlyName: element.text || element.id || '',
    resourceId: element.resourceId,
    className: element.className,
    bounds: boundsString, // 使用转换后的字符串格式
  };

  // 转换为StepCardData格式
  const stepCardData: StepCardData = {
    original_element: compatibleElement,
    xmlCacheId: element.xmlCacheId,
    elementContext: {
      xpath: element.xpath,
      bounds: boundsString,
      text: element.text,
      resourceId: element.resourceId,
      className: element.className,
    },
  };

  return stepCardData;
}

/**
 * 旧版FloatingVisualOverlay的适配器组件
 * 将旧版接口转换为新版模块化组件
 */
export const FloatingVisualOverlay: React.FC<FloatingVisualOverlayProps> = ({
  visible,
  selectedElement,
  highlightedElementId,
  mousePosition,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  delay = 0, // 保持接口兼容，但实际不使用
}) => {
  // 转换数据格式
  const stepCardData = useMemo(() => 
    convertToStepCardData(selectedElement), 
    [selectedElement]
  );

  // 计算初始位置
  const initialPosition = useMemo(() => {
    if (mousePosition) {
      return {
        x: Math.max(50, mousePosition.x - 300), // 窗口宽度的一半
        y: Math.max(50, mousePosition.y + 20),  // 鼠标下方一点
      };
    }
    return { x: 100, y: 100 };
  }, [mousePosition]);

  console.log('🔄 [FloatingVisualOverlay适配器] 转换数据:', {
    visible,
    hasSelectedElement: !!selectedElement,
    stepCardData,
    highlightedElementId,
    initialPosition,
  });

  return (
    <FloatingVisualWindow
      visible={visible}
      stepCardData={stepCardData}
      highlightedElementId={highlightedElementId}
      initialPosition={initialPosition}
    />
  );
};