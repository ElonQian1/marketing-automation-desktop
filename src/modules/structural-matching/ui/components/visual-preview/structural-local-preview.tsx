// src/modules/structural-matching/ui/components/visual-preview/structural-local-preview.tsx
// module: structural-matching | layer: ui | role: 局部结构可视化预览
// summary: 专门为元素结构树设计的局部可视化预览组件，复用PagePreview核心逻辑但只显示相关元素

import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Spin } from 'antd';
import { PagePreview } from '../../../../../components/universal-ui/views/visual-view/components/PagePreview';
import { useElementSelectionManager } from '../../../../../components/universal-ui/element-selection/useElementSelectionManager';
import type { VisualUIElement, VisualElementCategory } from '../../../../../components/universal-ui/views/visual-view/types/visual-types';
import type { UIElement } from '../../../../../api/universalUIAPI';
import XmlCacheManager from '../../../../../services/xml-cache-manager';
import { parseXML } from '../../../../../components/universal-ui/xml-parser';

const { Title, Text } = Typography;

/**
 * 局部结构可视化预览组件属性
 */
export interface StructuralLocalPreviewProps {
  /** 选中的元素数据 */
  selectedElement: Record<string, unknown>;
  /** 当前高亮的元素ID（从树节点联动） */
  highlightedElementId?: string | null;
  /** 预览区域最大高度 */
  maxHeight?: number;
  /** 是否显示加载状态 */
  loading?: boolean;
}

/**
 * 解析bounds字符串为位置信息
 */
function parseBounds(bounds: string | undefined): { x: number; y: number; width: number; height: number } | null {
  if (!bounds || typeof bounds !== 'string') return null;
  
  const match = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!match) return null;
  
  const [, x1, y1, x2, y2] = match.map(Number);
  return {
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1
  };
}

/**
 * 从XML数据中提取局部相关元素
 * 策略：以选中元素为中心，包含其父元素、子元素、同级元素和视觉接近的元素
 */
function extractLocalElements(
  allElements: UIElement[], 
  selectedElementData: Record<string, unknown>
): UIElement[] {
  const selectedBounds = parseBounds(selectedElementData.bounds as string);
  if (!selectedBounds || allElements.length === 0) return [];

  // 1. 找到选中元素在XML中的对应项
  const selectedElement = allElements.find(el => {
    const elBounds = parseBounds(el.bounds);
    if (!elBounds) return false;
    
    // 通过位置和文本匹配
    return Math.abs(elBounds.x - selectedBounds.x) < 5 &&
           Math.abs(elBounds.y - selectedBounds.y) < 5 &&
           Math.abs(elBounds.width - selectedBounds.width) < 10 &&
           Math.abs(elBounds.height - selectedBounds.height) < 10;
  });

  if (!selectedElement) {
    console.warn('⚠️ [StructuralLocalPreview] 未找到匹配的选中元素');
    return allElements.slice(0, 20); // 兜底：返回前20个元素
  }

  console.log('🎯 [StructuralLocalPreview] 找到选中元素:', selectedElement);

  // 2. 计算局部区域范围（选中元素周围的扩展区域）
  const expandRatio = 1.5; // 扩展倍数
  const centerX = selectedBounds.x + selectedBounds.width / 2;
  const centerY = selectedBounds.y + selectedBounds.height / 2;
  const expandedWidth = selectedBounds.width * expandRatio;
  const expandedHeight = selectedBounds.height * expandRatio;
  
  const localRegion = {
    left: centerX - expandedWidth / 2,
    top: centerY - expandedHeight / 2,
    right: centerX + expandedWidth / 2,
    bottom: centerY + expandedHeight / 2
  };

  // 3. 筛选相关元素
  const relevantElements = allElements.filter(element => {
    const bounds = parseBounds(element.bounds);
    if (!bounds) return false;

    // 检查元素是否在局部区域内或与之相交
    const elementRight = bounds.x + bounds.width;
    const elementBottom = bounds.y + bounds.height;
    
    const intersects = !(
      elementRight < localRegion.left ||
      bounds.x > localRegion.right ||
      elementBottom < localRegion.top ||
      bounds.y > localRegion.bottom
    );

    // 也包含重要的父元素和子元素（即使在区域外）
    const isParentOrChild = element.id === selectedElement.id ||
                           element.id.startsWith(selectedElement.id + '_') ||
                           selectedElement.id.startsWith(element.id + '_');

    return intersects || isParentOrChild;
  });

  console.log(`🔍 [StructuralLocalPreview] 提取局部元素: ${relevantElements.length}/${allElements.length}`, {
    selectedBounds,
    localRegion,
    relevantElementsCount: relevantElements.length
  });

  return relevantElements;
}

/**
 * 将UIElement转换为VisualUIElement
 */
function convertToVisualElements(elements: UIElement[]): VisualUIElement[] {
  return elements.map((element, index) => {
    const bounds = parseBounds(element.bounds);
    
    return {
      id: element.id || `element_${index}`,
      userFriendlyName: element.text || element.content_desc || element.class_name || 'Unknown',
      description: element.content_desc || element.text || '无描述',
      category: element.clickable ? 'interactive' : 'static',
      importance: element.clickable ? 'high' : 'medium',
      clickable: element.clickable || false,
      position: bounds || { x: 0, y: 0, width: 50, height: 20 },
      text: element.text || '',
      class_name: element.class_name || '',
      content_desc: element.content_desc || '',
      resource_id: element.resource_id || ''
    } as VisualUIElement;
  });
}

/**
 * 默认元素分类
 */
const DEFAULT_CATEGORIES: VisualElementCategory[] = [
  { name: 'interactive', color: '#52c41a', icon: '🎯', elements: [] },
  { name: 'static', color: '#1890ff', icon: '📝', elements: [] },
  { name: 'container', color: '#722ed1', icon: '📦', elements: [] }
];

/**
 * 局部结构可视化预览组件
 */
export const StructuralLocalPreview: React.FC<StructuralLocalPreviewProps> = ({
  selectedElement,
  highlightedElementId,
  maxHeight = 500,
  loading = false
}) => {
  const [xmlContent, setXmlContent] = useState<string>('');
  const [allElements, setAllElements] = useState<UIElement[]>([]);
  const [localElements, setLocalElements] = useState<VisualUIElement[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // 从XML缓存获取完整数据
  useEffect(() => {
    const loadXmlData = async () => {
      try {
        setIsDataLoading(true);
        
        const contextWrapper = selectedElement as Record<string, unknown>;
        const actualElement = (contextWrapper?.selectedElement as Record<string, unknown>) || selectedElement;
        
        // 获取XML缓存ID
        const xmlCacheId = actualElement?.xmlCacheId as string;
        if (!xmlCacheId) {
          console.warn('⚠️ [StructuralLocalPreview] 无XML缓存ID');
          setIsDataLoading(false);
          return;
        }

        // 从缓存获取XML内容
        const xmlCacheManager = XmlCacheManager.getInstance();
        const cacheEntry = await xmlCacheManager.getCachedXml(xmlCacheId);
        if (!cacheEntry) {
          console.warn('⚠️ [StructuralLocalPreview] 未找到缓存的XML内容');
          setIsDataLoading(false);
          return;
        }

        setXmlContent(cacheEntry.xmlContent);
        
        // 解析XML获取所有元素
        const parseResult = parseXML(cacheEntry.xmlContent);
        const parsedElements = parseResult.elements.map(visualElement => ({
          id: visualElement.id,
          text: visualElement.text || '',
          content_desc: visualElement.contentDesc || '',
          class_name: visualElement.className || '',
          bounds: visualElement.bounds || '',
          clickable: visualElement.clickable || false,
          resource_id: visualElement.resourceId || ''
        } as UIElement));
        setAllElements(parsedElements);
        
        console.log('✅ [StructuralLocalPreview] 加载XML数据成功:', {
          xmlLength: cacheEntry.xmlContent.length,
          totalElements: parsedElements.length
        });

      } catch (error) {
        console.error('❌ [StructuralLocalPreview] 加载XML数据失败:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadXmlData();
  }, [selectedElement]);

  // 当全部元素数据或选中元素变化时，提取局部元素
  useEffect(() => {
    if (allElements.length > 0) {
      const contextWrapper = selectedElement as Record<string, unknown>;
      const actualElement = (contextWrapper?.selectedElement as Record<string, unknown>) || selectedElement;
      
      const extracted = extractLocalElements(allElements, actualElement);
      const visualElements = convertToVisualElements(extracted);
      setLocalElements(visualElements);
      
      console.log('🏗️ [StructuralLocalPreview] 转换局部可视化元素:', {
        extractedCount: extracted.length,
        visualElementsCount: visualElements.length
      });
    }
  }, [allElements, selectedElement]);

  // 创建选择管理器
  const selectionManager = useElementSelectionManager(
    localElements.map(el => ({
      id: el.id,
      text: el.text,
      bounds: `[${el.position.x},${el.position.y}][${el.position.x + el.position.width},${el.position.y + el.position.height}]`,
      clickable: el.clickable,
      class_name: el.class_name,
      content_desc: el.content_desc,
      resource_id: el.resource_id
    } as UIElement)),
    undefined,
    { enableHover: true, hoverDelay: 100 }
  );

  // 监听高亮元素变化，更新选择管理器
  useEffect(() => {
    if (highlightedElementId) {
      selectionManager.handleElementHover(highlightedElementId);
    } else {
      selectionManager.handleElementHover(null);
    }
  }, [highlightedElementId, selectionManager]);

  // 显示加载状态
  if (loading || isDataLoading) {
    return (
      <div style={{ 
        width: '100%', 
        height: maxHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        backgroundColor: '#fafafa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">解析元素结构中...</Text>
          </div>
        </div>
      </div>
    );
  }

  // 显示无数据状态
  if (localElements.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: maxHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        backgroundColor: '#fafafa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">无可视化元素数据</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            请检查XML缓存或元素数据是否正确
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="light-theme-force" style={{
      width: '100%',
      height: maxHeight,
      border: '1px solid #e0e0e0',
      borderRadius: 8,
      backgroundColor: 'var(--bg-light-base, #ffffff)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* 标题栏 */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#f5f5f5'
      }}>
        <Title level={5} style={{ margin: 0, color: '#333', fontSize: 14 }}>
          🔍 局部结构可视化
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          显示选中元素周围的局部结构，与左侧树节点联动
        </Text>
        {highlightedElementId && (
          <Text style={{ 
            fontSize: 12, 
            color: '#ff4d4f',
            display: 'block',
            marginTop: 4,
            fontWeight: 'bold'
          }}>
            🎯 当前高亮: {highlightedElementId}
          </Text>
        )}
      </div>

      {/* 可视化预览区域 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <PagePreview
          finalElements={localElements}
          filteredElements={localElements}
          categories={DEFAULT_CATEGORIES}
          hideCompletely={false}
          xmlContent={xmlContent}
          deviceFramePadding={16}
          selectionManager={selectionManager}
          selectedElementId={highlightedElementId || ''}
          originalUIElements={allElements}
          showScreenshot={false}
          showGrid={false}
          showCrosshair={false}
          overlayOpacity={0.8}
          screenshotDim={0.3}
          rotate90={false}
          previewZoom={1}
          offsetX={0}
          offsetY={0}
        />
      </div>

      {/* 底部信息栏 */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid #e0e0e0',
        backgroundColor: '#f5f5f5',
        fontSize: 12
      }}>
        <Text type="secondary">
          显示 {localElements.length} 个局部元素（总计 {allElements.length} 个）
          {highlightedElementId && (
            <span style={{ marginLeft: 8, color: '#ff4d4f', fontWeight: 'bold' }}>
              | 联动高亮: {highlightedElementId}
            </span>
          )}
        </Text>
      </div>
    </div>
  );
};