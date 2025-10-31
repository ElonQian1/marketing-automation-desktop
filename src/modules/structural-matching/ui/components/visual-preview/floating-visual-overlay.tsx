// src/modules/structural-matching/ui/components/visual-preview/floating-visual-overlay.tsx
// module: structural-matching | layer: ui | role: 悬浮可视化覆盖层
// summary: 悬浮显示的局部结构可视化组件，类似页面分析的可视化视图

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Typography } from 'antd';
import { PagePreview } from '../../../../../components/universal-ui/views/visual-view/components/PagePreview';
import { useElementSelectionManager } from '../../../../../components/universal-ui/element-selection/useElementSelectionManager';
import type { VisualUIElement, VisualElementCategory } from '../../../../../components/universal-ui/types';
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
  console.log('🔍 [FloatingVisualOverlay] extractLocalElements 开始调试:', {
    selectedElementData,
    allElementsCount: allElements.length,
    firstElement: allElements[0],
    selectedElementDataKeys: Object.keys(selectedElementData)
  });

  // 兼容多种bounds数据格式
  let selectedBounds: { x: number; y: number; width: number; height: number } | null = null;
  
  if (typeof selectedElementData.bounds === 'string') {
    selectedBounds = parseBounds(selectedElementData.bounds);
  } else if (selectedElementData.bounds && typeof selectedElementData.bounds === 'object') {
    // 如果是position对象格式 {x, y, width, height}
    const pos = selectedElementData.bounds as Record<string, unknown>;
    if (typeof pos.x === 'number' && typeof pos.y === 'number') {
      selectedBounds = {
        x: pos.x,
        y: pos.y,
        width: (pos.width as number) || 0,
        height: (pos.height as number) || 0
      };
    }
    // 如果是标准bounds对象 {left, top, right, bottom}
    else if (typeof pos.left === 'number' && typeof pos.top === 'number') {
      selectedBounds = {
        x: pos.left,
        y: pos.top,
        width: (pos.right as number) - pos.left,
        height: (pos.bottom as number) - pos.top
      };
    }
  }
  // 如果是position字段
  else if (selectedElementData.position && typeof selectedElementData.position === 'object') {
    const pos = selectedElementData.position as Record<string, unknown>;
    selectedBounds = {
      x: (pos.x as number) || 0,
      y: (pos.y as number) || 0,
      width: (pos.width as number) || 0,
      height: (pos.height as number) || 0
    };
  }
  
  console.log('🎯 [FloatingVisualOverlay] 解析后的选中元素边界:', {
    原始bounds: selectedElementData.bounds,
    解析后selectedBounds: selectedBounds,
    所有元素样本: allElements.slice(0, 3).map(el => ({
      id: el.id,
      text: el.text,
      bounds: el.bounds,
      position: el.position
    }))
  });
  
  if (!selectedBounds || allElements.length === 0) {
    console.warn('⚠️ [FloatingVisualOverlay] 无法提取局部元素:', { selectedBounds, allElementsCount: allElements.length });
    return allElements.slice(0, 15); // 返回前15个元素作为演示
  }

  // 找到选中元素 - 使用多种匹配策略
  const selectedElement = allElements.find(el => {
    // 策略1：通过bounds字符串匹配
    if (el.bounds && typeof selectedElementData.bounds === 'string') {
      if (el.bounds === selectedElementData.bounds) {
        console.log('✅ [匹配策略1] 通过bounds字符串匹配成功:', el.id);
        return true;
      }
    }
    
    // 策略2：通过position对象匹配
    if (el.position && selectedBounds) {
      const posMatch = Math.abs(el.position.x - selectedBounds.x) < 5 &&
             Math.abs(el.position.y - selectedBounds.y) < 5 &&
             Math.abs(el.position.width - selectedBounds.width) < 10 &&
             Math.abs(el.position.height - selectedBounds.height) < 10;
      if (posMatch) {
        console.log('✅ [匹配策略2] 通过position对象匹配成功:', el.id);
        return true;
      }
    }
    
    // 策略3：通过bounds解析后匹配
    if (el.bounds && selectedBounds) {
      const elBounds = parseBounds(el.bounds);
      if (elBounds) {
        const boundsMatch = Math.abs(elBounds.x - selectedBounds.x) < 5 &&
               Math.abs(elBounds.y - selectedBounds.y) < 5 &&
               Math.abs(elBounds.width - selectedBounds.width) < 10 &&
               Math.abs(elBounds.height - selectedBounds.height) < 10;
        if (boundsMatch) {
          console.log('✅ [匹配策略3] 通过解析bounds匹配成功:', el.id);
          return true;
        }
      }
    }
    
    // 策略4：通过text和ID匹配
    const textMatch = el.text && selectedElementData.text && 
                     el.text === selectedElementData.text;
    const idMatch = el.id && selectedElementData.id &&
                   el.id === selectedElementData.id;
                   
    if (textMatch || idMatch) {
      console.log('✅ [匹配策略4] 通过text/id匹配成功:', el.id);
      return true;
    }
    
    return false;
  });

  if (!selectedElement) {
    console.warn('⚠️ [FloatingVisualOverlay] 未找到匹配的选中元素，返回演示数据:', {
      selectedBounds,
      totalElements: allElements.length,
      匹配尝试的数据: {
        selectedText: selectedElementData.text,
        selectedId: selectedElementData.id,
        selectedBounds: selectedElementData.bounds
      }
    });
    return allElements.slice(0, 15); // 显示前15个元素作为演示
  }

  console.log('✅ [FloatingVisualOverlay] 找到匹配元素:', selectedElement);

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
  
  // 🆕 窗口状态管理
  const [windowSize, setWindowSize] = useState({ width: 500, height: 400 });
  const [windowPosition, setWindowPosition] = useState({ x: 280, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🆕 拖拽处理函数
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return; // 只在标题栏拖拽
    setIsDragging(true);
    setDragStart({
      x: e.clientX - windowPosition.x,
      y: e.clientY - windowPosition.y
    });
  }, [windowPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setWindowPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
    if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      setWindowSize({
        width: Math.max(300, resizeStart.width + deltaX),
        height: Math.max(200, resizeStart.height + deltaY)
      });
    }
  }, [isDragging, isResizing, dragStart, resizeStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // 🆕 调整大小处理函数
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: windowSize.width,
      height: windowSize.height
    });
  }, [windowSize]);

  // 🆕 全局鼠标事件监听
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // 🆕 内容自适应高度计算
  const getContentHeight = useCallback(() => {
    if (isCollapsed) return 0;
    if (isDataLoading) return 150;
    if (localElements.length === 0) return 200;
    // 根据元素数量动态计算高度
    const baseHeight = 100;
    const itemHeight = 30;
    const calculatedHeight = baseHeight + (localElements.length * itemHeight);
    return Math.min(calculatedHeight, 600); // 最大高度限制
  }, [isCollapsed, isDataLoading, localElements.length]);

  // 🆕 自适应窗口大小
  useEffect(() => {
    const contentHeight = getContentHeight();
    const headerHeight = 44;
    const totalHeight = headerHeight + contentHeight;
    
    setWindowSize(prev => ({
      ...prev,
      height: Math.max(totalHeight, 200)
    }));
  }, [getContentHeight]);

  // 智能定位函数
  const getOverlayPosition = () => {
    return {
      left: windowPosition.x,
      top: windowPosition.y
    };
  };
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
        
        console.log('🔧 [FloatingVisualOverlay] 准备解析XML:', {
          xmlContentPreview: cacheEntry.xmlContent.substring(0, 200) + '...',
          xmlLength: cacheEntry.xmlContent.length
        });
        
        const parseResult = parseXML(cacheEntry.xmlContent);
        
        console.log('🎯 [FloatingVisualOverlay] XML解析结果:', {
          parseResult: parseResult,
          elementsCount: parseResult?.elements?.length || 0,
          hasParseResult: !!parseResult,
          parseResultKeys: parseResult ? Object.keys(parseResult) : []
        });
        
        if (parseResult && parseResult.elements) {
          setAllElements(parseResult.elements);
          console.log('✅ [FloatingVisualOverlay] 设置allElements成功:', {
            elementsCount: parseResult.elements.length,
            firstElement: parseResult.elements[0]
          });
        } else {
          console.error('❌ [FloatingVisualOverlay] 解析结果无效:', parseResult);
          setAllElements([]);
        }
        
        console.log('🎯 [FloatingVisualOverlay] XML解析完成:', {
          totalElements: parseResult?.elements?.length || 0,
          hasElements: (parseResult?.elements?.length || 0) > 0
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
    console.log('🔄 [FloatingVisualOverlay] useEffect [提取局部元素] 触发:', {
      allElementsCount: allElements.length,
      visible,
      hasSelectedElement: !!selectedElement,
      selectedElement: selectedElement
    });
    
    if (allElements.length > 0 && visible) {
      console.log('🔄 [FloatingVisualOverlay] 开始提取局部元素:', {
        totalElements: allElements.length,
        visible,
        hasSelectedElement: !!selectedElement
      });
      
      const contextWrapper = selectedElement as Record<string, unknown>;
      const actualElement = (contextWrapper?.selectedElement as Record<string, unknown>) || selectedElement;
      
      console.log('🎯 [FloatingVisualOverlay] 准备调用extractLocalElements:', {
        allElementsCount: allElements.length,
        actualElement: actualElement,
        actualElementKeys: Object.keys(actualElement || {}),
        contextWrapper: contextWrapper
      });
      
      const extracted = extractLocalElements(allElements, actualElement);
      setLocalElements(extracted);
      
      console.log('✅ [FloatingVisualOverlay] 局部元素提取完成:', {
        extractedCount: extracted.length,
        totalCount: allElements.length
      });
    } else {
      console.log('⚠️ [FloatingVisualOverlay] 跳过局部元素提取:', {
        allElementsCount: allElements.length,
        visible,
        reason: allElements.length === 0 ? 'allElements为空' : !visible ? 'visible为false' : '未知原因'
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
          width: windowSize.width,
          height: isCollapsed ? 44 : windowSize.height,
          backgroundColor: 'var(--bg-light-base, #ffffff)',
          border: '3px solid #1890ff',
          borderRadius: 12,
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(24, 144, 255, 0.2)',
          zIndex: 10999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeInScale 0.2s ease-out',
          cursor: isDragging ? 'grabbing' : 'default',
          transition: isCollapsed ? 'height 0.3s ease' : 'none'
        }}
      >
        {/* 标题栏 - 可拖拽 */}
        <div 
          style={{
            padding: '12px 16px',
            backgroundColor: '#1890ff',
            color: 'white',
            borderRadius: '10px 10px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'grab',
            userSelect: 'none',
            borderBottom: isCollapsed ? 'none' : '1px solid rgba(255,255,255,0.2)'
          }}
          onMouseDown={handleMouseDown}
        >
          <div style={{ flex: 1 }}>
            <Title level={5} style={{ margin: 0, color: 'white', fontSize: 14 }}>
              🎈 局部结构可视化预览
            </Title>
            {!isCollapsed && (
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                实时显示选中元素的结构布局
              </Text>
            )}
          </div>
          
          {/* 工具按钮 */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {highlightedElementId && !isCollapsed && (
              <div style={{ textAlign: 'right', marginRight: 12 }}>
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
            
            {/* 折叠/展开按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: 4,
                color: 'white',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: 12
              }}
              title={isCollapsed ? '展开' : '折叠'}
            >
              {isCollapsed ? '▼' : '▲'}
            </button>
            
            {/* 关闭按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // 这里应该调用父组件的关闭回调
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: 4,
                color: 'white',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: 12
              }}
              title="关闭"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 可视化内容区域 */}
        {!isCollapsed && (
          <div style={{ 
            flex: 1, 
            overflow: 'hidden', 
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}>
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
        )}

        {/* 调整大小手柄 */}
        {!isCollapsed && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 20,
              height: 20,
              cursor: 'nw-resize',
              background: 'linear-gradient(-45deg, transparent 0%, transparent 30%, #1890ff 30%, #1890ff 50%, transparent 50%, transparent 80%, #1890ff 80%)',
              zIndex: 1
            }}
            onMouseDown={handleResizeMouseDown}
            title="拖拽调整大小"
          />
        )}

        {/* 底部信息栏 */}
        {!isCollapsed && (
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
        )}
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