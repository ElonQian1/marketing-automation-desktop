import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  rectIntersection,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export interface DraggableItem {
  id: string;
  title: string;
  content: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
}

export interface GridPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutItem extends DraggableItem {
  position: GridPosition;
  isVisible?: boolean;
  zIndex?: number;
}

interface DragDropGridProps {
  items: DraggableItem[];
  onLayoutChange?: (layout: LayoutItem[]) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const DragDropGrid: React.FC<DragDropGridProps> = ({
  items,
  onLayoutChange,
  className = '',
  style = {},
}) => {
  // 初始化布局
  const [layout, setLayout] = useState<LayoutItem[]>(() => {
    return items.map((item, index) => ({
      ...item,
      position: item.defaultPosition 
        ? { ...item.defaultPosition, ...item.defaultSize }
        : {
            x: 20 + (index % 3) * 420,
            y: 20 + Math.floor(index / 3) * 320,
            width: item.defaultSize?.width || 400,
            height: item.defaultSize?.height || 300,
          },
      isVisible: true,
      zIndex: index + 1,
    }));
  });

  const [activeId, setActiveId] = useState<string | null>(null);

  // 配置传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px的拖拽阈值
      },
    })
  );

  // 拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // 拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    
    if (delta.x !== 0 || delta.y !== 0) {
      setLayout(prevLayout => {
        const newLayout = prevLayout.map(item => {
          if (item.id === active.id) {
            return {
              ...item,
              position: {
                ...item.position,
                x: Math.max(0, item.position.x + delta.x),
                y: Math.max(0, item.position.y + delta.y),
              },
            };
          }
          return item;
        });
        
        onLayoutChange?.(newLayout);
        return newLayout;
      });
    }
    
    setActiveId(null);
  };

  // 更新项目位置
  const updateItemPosition = (id: string, position: Partial<GridPosition>) => {
    setLayout(prevLayout => {
      const newLayout = prevLayout.map(item => {
        if (item.id === id) {
          return {
            ...item,
            position: { ...item.position, ...position },
          };
        }
        return item;
      });
      
      onLayoutChange?.(newLayout);
      return newLayout;
    });
  };

  // 切换项目可见性
  const toggleItemVisibility = (id: string) => {
    setLayout(prevLayout => {
      const newLayout = prevLayout.map(item => {
        if (item.id === id) {
          return {
            ...item,
            isVisible: !item.isVisible,
          };
        }
        return item;
      });
      
      onLayoutChange?.(newLayout);
      return newLayout;
    });
  };

  // 聚焦项目（提升z-index）
  const focusItem = (id: string) => {
    setLayout(prevLayout => {
      const maxZ = Math.max(...prevLayout.map(item => item.zIndex || 0));
      const newLayout = prevLayout.map(item => {
        if (item.id === id) {
          return {
            ...item,
            zIndex: maxZ + 1,
          };
        }
        return item;
      });
      
      onLayoutChange?.(newLayout);
      return newLayout;
    });
  };

  // 当前拖拽项目
  const activeItem = useMemo(() => {
    return layout.find(item => item.id === activeId);
  }, [layout, activeId]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-base)',
    ...style,
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={`drag-drop-grid ${className}`} style={containerStyle}>
        {/* 渲染所有可见项目 */}
        {layout
          .filter(item => item.isVisible)
          .map(item => (
            <DraggablePanel
              key={item.id}
              item={item}
              onResize={(size) => updateItemPosition(item.id, size)}
              onFocus={() => focusItem(item.id)}
              onClose={() => toggleItemVisibility(item.id)}
            />
          ))}

        {/* 拖拽覆盖层 */}
        <DragOverlay>
          {activeItem ? (
            <div style={{
              width: activeItem.position.width,
              height: activeItem.position.height,
              backgroundColor: 'white',
              border: '2px dashed #1890ff',
              borderRadius: '6px',
              opacity: 0.8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#1890ff',
            }}>
              {activeItem.title}
            </div>
          ) : null}
        </DragOverlay>

        {/* 布局工具栏 */}
        <LayoutToolbar
          items={layout}
          onToggleVisibility={toggleItemVisibility}
        />
      </div>
    </DndContext>
  );
};

// 可拖拽面板组件
import { useDraggable } from '@dnd-kit/core';
import { Card, Button } from 'antd';
import { DragOutlined, CloseOutlined } from '@ant-design/icons';

interface DraggablePanelProps {
  item: LayoutItem;
  onResize: (size: Partial<GridPosition>) => void;
  onFocus: () => void;
  onClose: () => void;
}

const DraggablePanel: React.FC<DraggablePanelProps> = ({
  item,
  onResize,
  onFocus,
  onClose,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  });

  const style: React.CSSProperties = {
    position: 'absolute',
    left: item.position.x,
    top: item.position.y,
    width: item.position.width,
    height: item.position.height,
    zIndex: item.zIndex || 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseDown={onFocus}
    >
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              {...listeners}
              {...attributes}
              style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}
            >
              <DragOutlined />
            </div>
            <span>{item.title}</span>
          </div>
        }
        extra={
          <Button
            type="text"
            icon={<CloseOutlined />}
            size="small"
            onClick={onClose}
          />
        }
        style={{ height: '100%' }}
        bodyStyle={{ height: 'calc(100% - 57px)', overflow: 'auto' }}
      >
        {item.content}
      </Card>
      
      {/* 调整大小句柄 */}
      <ResizeHandle onResize={onResize} />
    </div>
  );
};

// 调整大小句柄
interface ResizeHandleProps {
  onResize: (size: Partial<GridPosition>) => void;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ onResize }) => {
  // 简化的调整大小实现
  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 20,
        height: 20,
        cursor: 'nw-resize',
        background: 'linear-gradient(-45deg, transparent 30%, #ccc 30%, #ccc 35%, transparent 35%)',
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        // TODO: 实现调整大小逻辑
      }}
    />
  );
};

// 布局工具栏
interface LayoutToolbarProps {
  items: LayoutItem[];
  onToggleVisibility: (id: string) => void;
}

const LayoutToolbar: React.FC<LayoutToolbarProps> = ({
  items,
  onToggleVisibility,
}) => {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        zIndex: 9999,
        background: 'var(--bg-light-base, #ffffff)',
        color: 'var(--text-inverse, #1e293b)',
        padding: '8px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      }}
      className="light-theme-force"
    >
      {/* 显示/隐藏按钮 */}
      {items.map(item => (
        <Button
          key={item.id}
          type={item.isVisible ? 'primary' : 'default'}
          size="small"
          onClick={() => onToggleVisibility(item.id)}
          style={{ margin: '2px' }}
        >
          {item.title}
        </Button>
      ))}
    </div>
  );
};