// src/modules/structural-matching/ui/components/visual-preview/structural-element-visual-preview.tsx
// module: structural-matching | layer: ui | role: 元素结构可视化预览
// summary: 专门为元素结构树设计的轻量级可视化预览组件，复用PagePreview核心逻辑

import React, { useState, useRef, useEffect } from 'react';
import { Typography, Spin } from 'antd';
import { useElementSelectionManager } from '../../../../../components/universal-ui/element-selection/useElementSelectionManager';
import type { UIElement } from '../../../../../api/universalUIAPI';

const { Title, Text } = Typography;

/**
 * 简化的元素数据接口，适配从树节点转换而来的数据
 */
export interface StructuralElement {
  id: string;
  text?: string;
  content_desc?: string;
  class_name?: string;
  bounds?: string;
  clickable?: boolean;
  resource_id?: string;
  // 位置信息（解析自bounds字符串）
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * 可视化预览组件属性
 */
export interface StructuralElementVisualPreviewProps {
  /** 要显示的元素列表 */
  elements: StructuralElement[];
  /** 当前高亮的元素ID */
  highlightedElementId?: string | null;
  /** XML内容，用于解析视图尺寸 */
  xmlContent?: string;
  /** 高度限制 */
  maxHeight?: number;
  /** 是否显示加载状态 */
  loading?: boolean;
}

/**
 * 解析bounds字符串为位置信息
 * 例: "[13,1158][534,2023]" -> { x: 13, y: 1158, width: 521, height: 865 }
 */
function parseBoundsToPosition(bounds?: string): { x: number; y: number; width: number; height: number } | null {
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
 * 解析XML内容获取视图尺寸
 */
function parseXmlViewport(xmlContent?: string): { width: number; height: number } | null {
  if (!xmlContent) return null;
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    const viewportNode = xmlDoc.querySelector('[bounds]');
    
    if (viewportNode) {
      const bounds = viewportNode.getAttribute('bounds');
      const position = parseBoundsToPosition(bounds || '');
      if (position) {
        return { width: position.width, height: position.height };
      }
    }
    
    // 如果找不到bounds，尝试解析根节点的尺寸信息
    const rootNode = xmlDoc.documentElement;
    if (rootNode && rootNode.hasAttribute('bounds')) {
      const bounds = rootNode.getAttribute('bounds');
      const position = parseBoundsToPosition(bounds || '');
      if (position) {
        return { width: position.width, height: position.height };
      }
    }
    
    // 默认尺寸，基于常见手机分辨率
    return { width: 1080, height: 2400 };
  } catch (error) {
    console.warn('⚠️ [StructuralElementVisualPreview] XML解析失败:', error);
    return { width: 1080, height: 2400 };
  }
}

/**
 * 元素结构可视化预览组件
 */
export const StructuralElementVisualPreview: React.FC<StructuralElementVisualPreviewProps> = ({
  elements,
  highlightedElementId,
  xmlContent,
  maxHeight = 500,
  loading = false
}) => {
  const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 解析XML获取视图尺寸
  useEffect(() => {
    const viewportSize = parseXmlViewport(xmlContent);
    setViewport(viewportSize);
  }, [xmlContent]);

  // 转换元素数据为可视化格式
  const visualElements = React.useMemo(() => {
    return elements.map(element => {
      const position = parseBoundsToPosition(element.bounds);
      return {
        ...element,
        position: position || { x: 0, y: 0, width: 100, height: 50 }
      };
    }).filter(el => el.position);
  }, [elements]);

  // 创建简化的选择管理器（只用于hover状态）
  const selectionManager = useElementSelectionManager(
    visualElements as UIElement[], 
    undefined, 
    { enableHover: true, hoverDelay: 100 }
  );

  // 监听高亮元素变化，更新hover状态
  useEffect(() => {
    selectionManager.handleElementHover(highlightedElementId);
  }, [highlightedElementId, selectionManager]);

  // 计算缩放比例和容器尺寸
  const { scale, scaledWidth, scaledHeight } = React.useMemo(() => {
    if (!viewport) return { scale: 1, scaledWidth: 300, scaledHeight: 500 };
    
    const containerWidth = 300; // 固定预览宽度
    const maxContainerHeight = maxHeight - 100; // 预留标题和边距空间
    
    const scaleByWidth = containerWidth / viewport.width;
    const scaleByHeight = maxContainerHeight / viewport.height;
    const finalScale = Math.min(scaleByWidth, scaleByHeight, 1); // 不放大，只缩小
    
    return {
      scale: finalScale,
      scaledWidth: viewport.width * finalScale,
      scaledHeight: viewport.height * finalScale
    };
  }, [viewport, maxHeight]);

  if (loading || !viewport) {
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

  if (visualElements.length === 0) {
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
        <Text type="secondary">无可视化元素</Text>
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
          📱 元素结构可视化
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          设备尺寸: {viewport.width} × {viewport.height} | 缩放: {(scale * 100).toFixed(0)}%
        </Text>
      </div>

      {/* 可视化预览区域 */}
      <div 
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
          backgroundColor: '#f9f9f9'
        }}
      >
        <div style={{
          position: 'relative',
          width: scaledWidth,
          height: scaledHeight,
          backgroundColor: '#ffffff',
          border: '1px solid #ddd',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {/* 渲染元素 */}
          {visualElements.map((element) => {
            const displayState = selectionManager.getElementDisplayState(element.id);
            const isHighlighted = element.id === highlightedElementId;
            
            // 计算缩放后的位置
            const elementLeft = element.position.x * scale;
            const elementTop = element.position.y * scale;
            const elementWidth = Math.max(element.position.width * scale, 2);
            const elementHeight = Math.max(element.position.height * scale, 2);

            // 根据元素类型确定颜色
            const getElementColor = () => {
              if (element.clickable) return '#52c41a'; // 绿色 - 可点击
              if (element.text) return '#1890ff'; // 蓝色 - 有文本
              if (element.content_desc) return '#faad14'; // 橙色 - 有描述
              return '#8c8c8c'; // 灰色 - 普通元素
            };

            const backgroundColor = getElementColor();
            const opacity = isHighlighted || displayState.isHovered ? 0.8 : 0.5;
            const borderColor = isHighlighted ? '#ff4d4f' : displayState.isHovered ? '#faad14' : backgroundColor;
            const borderWidth = isHighlighted ? 3 : displayState.isHovered ? 2 : 1;

            return (
              <div
                key={element.id}
                title={`${element.class_name || 'Unknown'}\n${element.text || element.content_desc || 'No text'}`}
                style={{
                  position: 'absolute',
                  left: elementLeft,
                  top: elementTop,
                  width: elementWidth,
                  height: elementHeight,
                  backgroundColor,
                  opacity,
                  border: `${borderWidth}px solid ${borderColor}`,
                  borderRadius: Math.min(elementWidth, elementHeight) > 8 ? 2 : 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: isHighlighted ? 'scale(1.05)' : displayState.isHovered ? 'scale(1.02)' : 'scale(1)',
                  zIndex: isHighlighted ? 100 : displayState.isHovered ? 50 : 10,
                  boxShadow: isHighlighted 
                    ? '0 4px 12px rgba(255,77,79,0.4)' 
                    : displayState.isHovered 
                    ? '0 2px 8px rgba(0,0,0,0.2)' 
                    : 'none'
                }}
                onMouseEnter={() => {
                  selectionManager.handleElementHover(element.id);
                }}
                onMouseLeave={() => {
                  selectionManager.handleElementHover(null);
                }}
              >
                {/* 显示元素文本（如果尺寸足够） */}
                {elementWidth > 30 && elementHeight > 20 && (element.text || element.content_desc) && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: Math.max(8, Math.min(12, elementHeight / 3)),
                    color: '#fff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                    textAlign: 'center',
                    padding: 2,
                    overflow: 'hidden',
                    wordBreak: 'break-all'
                  }}>
                    {(element.text || element.content_desc || '').substring(0, 10)}
                  </div>
                )}

                {/* 可点击元素标识 */}
                {element.clickable && elementWidth > 15 && elementHeight > 15 && (
                  <div style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 8,
                    height: 8,
                    backgroundColor: '#fff',
                    borderRadius: '50%',
                    border: '1px solid #52c41a',
                    zIndex: 20
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部信息栏 */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid #e0e0e0',
        backgroundColor: '#f5f5f5',
        fontSize: 12
      }}>
        <Text type="secondary">
          总计 {visualElements.length} 个元素 
          {highlightedElementId && (
            <span style={{ marginLeft: 8, color: '#ff4d4f', fontWeight: 'bold' }}>
              | 当前高亮: {highlightedElementId}
            </span>
          )}
        </Text>
      </div>
    </div>
  );
};