// src/modules/structural-matching/ui/components/element-structure-tree/element-structure-tree-with-hover.tsx
// module: structural-matching | layer: ui | role: 带悬停预览的元素结构树
// summary: 在原有ElementStructureTree基础上添加悬停预览功能

import React, { useState, useEffect, useRef } from 'react';
import { ElementStructureTree } from './element-structure-tree';
import { HoverElementPreview } from '../hover-preview';
import { FieldType } from '../../../domain/constants/field-types';
import { FieldConfig } from '../../../domain/models/hierarchical-field-config';
import XmlCacheManager from '../../../../../services/xml-cache-manager';

export interface ElementStructureTreeWithHoverProps {
  /** 选中的元素 */
  selectedElement: Record<string, unknown>;

  /** 获取字段配置 */
  getFieldConfig: (elementPath: string, fieldType: FieldType) => FieldConfig;

  /** 切换字段启用状态 */
  onToggleField: (elementPath: string, fieldType: FieldType) => void;

  /** 更新字段配置 */
  onUpdateField?: (
    elementPath: string,
    fieldType: FieldType,
    updates: Partial<FieldConfig>
  ) => void;
}

/**
 * 带悬停预览功能的元素结构树
 */
export const ElementStructureTreeWithHover: React.FC<ElementStructureTreeWithHoverProps> = (props) => {
  const [hoverState, setHoverState] = useState({
    visible: false,
    mousePosition: { x: 0, y: 0 },
    elementData: null as any
  });
  
  const [xmlContent, setXmlContent] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 加载XML内容
  useEffect(() => {
    const loadXmlContent = async () => {
      try {
        const contextWrapper = props.selectedElement as Record<string, unknown>;
        const actualElement = (contextWrapper?.selectedElement as Record<string, unknown>) || props.selectedElement;
        
        const xmlCacheId = actualElement?.xmlCacheId as string;
        if (!xmlCacheId) return;

        const xmlCacheManager = XmlCacheManager.getInstance();
        const cacheEntry = await xmlCacheManager.getCachedXml(xmlCacheId);
        if (cacheEntry) {
          setXmlContent(cacheEntry.xmlContent);
        }
      } catch (error) {
        console.error('加载XML内容失败:', error);
      }
    };

    loadXmlContent();
  }, [props.selectedElement]);

  // 处理鼠标悬停事件
  const handleMouseEnter = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // 查找最近的树节点
    const treeNode = target.closest('.ant-tree-node-content-wrapper, .ant-tree-title');
    if (!treeNode) return;

    // 从DOM中提取元素数据
    const nodeElement = treeNode.closest('[data-element-info]');
    if (!nodeElement) return;

    try {
      const elementInfoStr = nodeElement.getAttribute('data-element-info');
      if (!elementInfoStr) return;

      const elementData = JSON.parse(elementInfoStr);
      
      // 清除之前的超时
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      // 延迟显示预览
      hoverTimeoutRef.current = setTimeout(() => {
        setHoverState({
          visible: true,
          mousePosition: { x: event.clientX, y: event.clientY },
          elementData
        });
      }, 300); // 300ms延迟

    } catch (error) {
      console.warn('解析元素数据失败:', error);
    }
  };

  const handleMouseLeave = () => {
    // 清除超时
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // 延迟隐藏预览
    setTimeout(() => {
      setHoverState(prev => ({ ...prev, visible: false }));
    }, 100);
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (hoverState.visible) {
      setHoverState(prev => ({
        ...prev,
        mousePosition: { x: event.clientX, y: event.clientY }
      }));
    }
  };

  // 添加事件监听器
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mouseenter', handleMouseEnter, true);
    container.addEventListener('mouseleave', handleMouseLeave, true);
    container.addEventListener('mousemove', handleMouseMove, true);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter, true);
      container.removeEventListener('mouseleave', handleMouseLeave, true);
      container.removeEventListener('mousemove', handleMouseMove, true);
      
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [hoverState.visible]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* 原始的元素结构树 */}
      <ElementStructureTree {...props} />
      
      {/* 悬停预览组件 */}
      <HoverElementPreview
        visible={hoverState.visible}
        mousePosition={hoverState.mousePosition}
        elementData={hoverState.elementData}
        xmlContent={xmlContent}
      />
    </div>
  );
};