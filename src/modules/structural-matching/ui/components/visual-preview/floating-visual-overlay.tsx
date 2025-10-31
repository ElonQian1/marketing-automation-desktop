// src/modules/structural-matching/ui/components/visual-preview/floating-visual-overlay.tsx
// module: structural-matching | layer: ui | role: 悬浮可视化覆盖层
// summary: 悬浮显示的局部结构可视化组件，类似页面分析的可视化视图

import React, { useState, useEffect, useRef } from 'react';
import { Typography } from 'antd';
import { PagePreview } from '../../../../../components/universal-ui/views/visual-view/components/PagePreview';
import { useElementSelectionManager } from '../../../../../components/universal-ui/element-selection/useElementSelectionManager';
import type { VisualUIElement, VisualElementCategory } from '../../../../../components/universal-ui/views/visual-view/types/visual-types';
import XmlCacheManager from '../../../../../services/xml-cache-manager';
import { parseXML } from '../../../../../components/universal-ui/xml-parser';

const { Title, Text } = Typography;

/**
 * 悬浮可视化覆盖层属性
 */
export interface FloatingVisualOverlayProps {
  /** 是否显示悬浮层 */
  visible: boolean;
  /** 选中的元素数据 */
  selectedElement: Record<string, unknown>;
  /** 当前高亮的元素ID */
  highlightedElementId?: string | null;
  /** 鼠标位置（用于定位悬浮层） */
  mousePosition?: { x: number; y: number };
  /** 延迟显示时间（毫秒） */
  delay?: number;
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
 */
function extractLocalElements(
  allElements: VisualUIElement[], 
  selectedElementData: Record<string, unknown>
): VisualUIElement[] {
  const selectedBounds = parseBounds(selectedElementData.bounds as string);
  if (!selectedBounds || allElements.length === 0) return [];

  // 找到选中元素
  const selectedElement = allElements.find(el => {
    const elBounds = parseBounds(el.bounds);
    if (!elBounds) return false;
    
    const positionMatch = Math.abs(elBounds.x - selectedBounds.x) < 5 &&
           Math.abs(elBounds.y - selectedBounds.y) < 5 &&
           Math.abs(elBounds.width - selectedBounds.width) < 10 &&
           Math.abs(elBounds.height - selectedBounds.height) < 10;
           
    const textMatch = el.text && selectedElementData.text && 
                     el.text === selectedElementData.text;
                     
    return positionMatch || textMatch;
  });

  if (!selectedElement) {
    return allElements.slice(0, 15); // 显示前15个元素作为演示
  }

  // 计算局部区域范围
  const expandRatio = 2.5; // 更大的扩展区域用于悬浮显示
  const centerX = selectedBounds.x + selectedBounds.width / 2;
  const centerY = selectedBounds.y + selectedBounds.height / 2;
  const expandedWidth = Math.max(selectedBounds.width * expandRatio, 400);
  const expandedHeight = Math.max(selectedBounds.height * expandRatio, 400);
  
  const localRegion = {
    left: centerX - expandedWidth / 2,
    top: centerY - expandedHeight / 2,
    right: centerX + expandedWidth / 2,
    bottom: centerY + expandedHeight / 2
  };

  // 筛选相关元素
  const relevantElements = allElements.filter(element => {
    const bounds = parseBounds(element.bounds);
    if (!bounds) return false;

    const elementRight = bounds.x + bounds.width;
    const elementBottom = bounds.y + bounds.height;
    
    const intersects = !(
      elementRight < localRegion.left ||
      bounds.x > localRegion.right ||
      elementBottom < localRegion.top ||
      bounds.y > localRegion.bottom
    );

    const isParentOrChild = element.id === selectedElement.id ||
                           element.id.startsWith(selectedElement.id + '_') ||
                           selectedElement.id.startsWith(element.id + '_');

    return intersects || isParentOrChild;
  });

  // console.log(`🎈 [FloatingVisualOverlay] 提取悬浮显示元素: ${relevantElements.length}/${allElements.length}`);
  return relevantElements;
}

/**
 * 默认元素分类
 */
const DEFAULT_CATEGORIES: VisualElementCategory[] = [
  { name: 'interactive', color: '#52c41a', icon: '🎯', description: '可交互元素', elements: [] },
  { name: 'static', color: '#1890ff', icon: '📝', description: '静态元素', elements: [] },
  { name: 'container', color: '#722ed1', icon: '📦', description: '容器元素', elements: [] }
];

/**
 * 悬浮可视化覆盖层组件
 */
export const FloatingVisualOverlay: React.FC<FloatingVisualOverlayProps> = ({
  visible,
  selectedElement,
  highlightedElementId,
  mousePosition,
  delay = 500
}) => {
  const [xmlContent, setXmlContent] = useState<string>('');
  const [allElements, setAllElements] = useState<VisualUIElement[]>([]);
  const [localElements, setLocalElements] = useState<VisualUIElement[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // 组件挂载调试
  useEffect(() => {
    console.log('🎈 [FloatingVisualOverlay] 组件挂载 - 初始状态:', {
      visible,
      selectedElement: !!selectedElement,
      highlightedElementId,
      hasMousePosition: !!mousePosition
    });
  }, [visible, selectedElement, highlightedElementId, mousePosition]);

  // 延迟显示悬浮层 - 修改为立即显示
  useEffect(() => {
    const currentTimeoutRef = timeoutRef.current;
    if (currentTimeoutRef) {
      clearTimeout(currentTimeoutRef);
    }

    if (visible) {
      // 立即显示，无延迟
      setShowOverlay(true);
    } else {
      setShowOverlay(false);
    }

    return () => {
      if (currentTimeoutRef) {
        clearTimeout(currentTimeoutRef);
      }
    };
  }, [visible, delay]);

  // 从XML缓存获取数据
  useEffect(() => {
    if (!visible || !selectedElement) return;

    const loadXmlData = async () => {
      try {
        setIsDataLoading(true);
        
        const contextWrapper = selectedElement as Record<string, unknown>;
        const actualElement = (contextWrapper?.selectedElement as Record<string, unknown>) || selectedElement;
        
        const xmlCacheId = actualElement?.xmlCacheId as string;
        if (!xmlCacheId) {
          console.warn('⚠️ [FloatingVisualOverlay] 🔴 缺少XML缓存ID - 无法加载数据');
          setIsDataLoading(false);
          return;
        }

        console.log('🔍 [FloatingVisualOverlay] 开始加载XML数据:', { xmlCacheId });

        const xmlCacheManager = XmlCacheManager.getInstance();
        const cacheEntry = await xmlCacheManager.getCachedXml(xmlCacheId);
        if (!cacheEntry) {
          console.warn('⚠️ [FloatingVisualOverlay] 🔴 XML缓存不存在:', { xmlCacheId });
          setIsDataLoading(false);
          return;
        }

        console.log('✅ [FloatingVisualOverlay] XML数据加载成功:', { 
          xmlCacheId, 
          xmlLength: cacheEntry.xmlContent.length 
        });

        setXmlContent(cacheEntry.xmlContent);
        
        const parseResult = parseXML(cacheEntry.xmlContent);
        setAllElements(parseResult.elements);
        
        console.log('🎯 [FloatingVisualOverlay] XML解析完成:', {
          totalElements: parseResult.elements.length,
          hasElements: parseResult.elements.length > 0
        });

      } catch (error) {
        console.error('❌ [FloatingVisualOverlay] 加载XML数据失败:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadXmlData();
  }, [visible, selectedElement]);

  // 提取局部元素
  useEffect(() => {
    if (allElements.length > 0 && visible) {
      console.log('🔄 [FloatingVisualOverlay] 开始提取局部元素:', {
        totalElements: allElements.length,
        visible,
        hasSelectedElement: !!selectedElement
      });
      
      const contextWrapper = selectedElement as Record<string, unknown>;
      const actualElement = (contextWrapper?.selectedElement as Record<string, unknown>) || selectedElement;
      
      const extracted = extractLocalElements(allElements, actualElement);
      setLocalElements(extracted);
      
      console.log('✅ [FloatingVisualOverlay] 局部元素提取完成:', {
        extractedCount: extracted.length,
        totalCount: allElements.length
      });
    }
  }, [allElements, selectedElement, visible]);

  // 选择管理器
  const selectionManager = useElementSelectionManager(
    [],
    undefined,
    { enableHover: true, hoverDelay: 100 }
  );

  // 监听高亮元素变化
  useEffect(() => {
    if (highlightedElementId) {
      selectionManager.handleElementHover(highlightedElementId);
    } else {
      selectionManager.handleElementHover(null);
    }
  }, [highlightedElementId, selectionManager]);

  // 计算悬浮层位置
  const getOverlayPosition = () => {
    if (!mousePosition) {
      // 默认位置：右上角，确保可见
      return { 
        top: '120px', 
        right: '50px',
        position: 'fixed' as const
      };
    }

    const overlayWidth = 500;
    const overlayHeight = 400;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = mousePosition.x + 20; // 鼠标右侧偏移
    let top = mousePosition.y - overlayHeight / 2; // 垂直居中

    // 防止超出视口
    if (left + overlayWidth > viewportWidth) {
      left = mousePosition.x - overlayWidth - 20; // 显示在鼠标左侧
    }
    if (top < 20) {
      top = 20;
    }
    if (top + overlayHeight > viewportHeight - 20) {
      top = viewportHeight - overlayHeight - 20;
    }

    return { top: `${top}px`, left: `${left}px` };
  };

  if (!showOverlay) {
    console.log('🚫 [FloatingVisualOverlay] 悬浮层未显示 - 原因:', { 
      showOverlay, 
      visible, 
      isDataLoading, 
      elementsCount: localElements.length,
      selectedElement: !!selectedElement,
      xmlContent: xmlContent.length 
    });
    return null;
  }

  console.log('✅ [FloatingVisualOverlay] 🎯 正在渲染悬浮层:', { 
    showOverlay, 
    visible, 
    isDataLoading, 
    elementsCount: localElements.length,
    position: getOverlayPosition(),
    hasSelectedElement: !!selectedElement,
    xmlContentLength: xmlContent.length
  });

  return (
    <>
      {/* 背景遮罩 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          zIndex: 10998,
          pointerEvents: 'none'
        }}
      />
      
      {/* 悬浮可视化面板 */}
      <div
        ref={overlayRef}
        className="light-theme-force"
        style={{
          position: 'fixed',
          ...getOverlayPosition(),
          width: 500,
          height: 400,
          backgroundColor: 'var(--bg-light-base, #ffffff)',
          border: '3px solid #1890ff',
          borderRadius: 12,
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(24, 144, 255, 0.2)',
          zIndex: 10999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeInScale 0.2s ease-out'
        }}
      >
        {/* 标题栏 */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#1890ff',
          color: 'white',
          borderRadius: '10px 10px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <Title level={5} style={{ margin: 0, color: 'white', fontSize: 14 }}>
              🎈 局部结构可视化预览
            </Title>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
              实时显示选中元素的结构布局
            </Text>
          </div>
          {highlightedElementId && (
            <div style={{ textAlign: 'right' }}>
              <Text style={{ 
                fontSize: 11, 
                color: '#ffd666',
                fontWeight: 'bold',
                display: 'block'
              }}>
                🎯 高亮: {highlightedElementId}
              </Text>
            </div>
          )}
        </div>

        {/* 可视化内容区域 */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {isDataLoading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  border: '3px solid #f0f0f0',
                  borderTop: '3px solid #1890ff',
                  borderRadius: '50%',
                  margin: '0 auto 12px',
                  animation: 'spin 1s linear infinite'
                }} />
                <Text type="secondary">解析结构中...</Text>
              </div>
            </div>
          ) : localElements.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ 
                  fontSize: 48, 
                  marginBottom: 12,
                  animation: 'pulse 2s infinite'
                }}>🎈</div>
                <Title level={5} style={{ margin: '0 0 8px', color: '#1890ff' }}>
                  悬浮预览已激活
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  正在等待元素数据...
                </Text>
                <div style={{ marginTop: 12, fontSize: 11, color: '#999' }}>
                  XML内容长度: {xmlContent.length}<br/>
                  总元素数: {allElements.length}<br/>
                  局部元素数: {localElements.length}
                </div>
              </div>
            </div>
          ) : (
            <PagePreview
              finalElements={localElements}
              filteredElements={localElements}
              categories={DEFAULT_CATEGORIES}
              hideCompletely={false}
              xmlContent={xmlContent}
              deviceFramePadding={12}
              selectionManager={selectionManager}
              selectedElementId={highlightedElementId || ''}
              originalUIElements={[]}
              showScreenshot={false}
              showGrid={false}
              showCrosshair={false}
              overlayOpacity={0.9}
              screenshotDim={0.2}
              rotate90={false}
              previewZoom={0.8}
              offsetX={0}
              offsetY={0}
            />
          )}
        </div>

        {/* 底部信息栏 */}
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#f5f5f5',
          borderRadius: '0 0 10px 10px',
          fontSize: 11,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text type="secondary">
            📱 显示 {localElements.length} 个局部元素
          </Text>
          <div>
            {highlightedElementId && (
              <Text style={{ 
                marginRight: 8, 
                color: '#1890ff', 
                fontWeight: 'bold',
                fontSize: 11
              }}>
                🔗 联动中
              </Text>
            )}
            <Text type="secondary" style={{ fontSize: 11 }}>
              实时预览
            </Text>
          </div>
        </div>
      </div>

      {/* CSS 动画样式 */}
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
};