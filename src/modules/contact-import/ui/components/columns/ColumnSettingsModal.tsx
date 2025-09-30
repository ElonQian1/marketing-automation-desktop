import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Space, Checkbox, InputNumber, Tooltip, Divider, theme } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ColumnRuntimeConfig } from './useColumnSettings';

interface Props {
  open: boolean;
  onClose: () => void;
  configs: ColumnRuntimeConfig[];
  onToggle: (key: string, visible: boolean) => void;
  onWidthChange: (key: string, width?: number) => void;
  onReset: () => void;
  onReorder?: (keys: string[]) => void;
}

type BindProps = { [key: string]: any };

type RowProps = {
  item: ColumnRuntimeConfig;
  containerBind?: BindProps;
  transform: any;
  transition: string | undefined;
  isDragging: boolean;
  isOverlay?: boolean;
  onToggle: (key: string, visible: boolean) => void;
  onWidthChange: (key: string, width?: number) => void;
};

const RowInner = React.forwardRef<HTMLDivElement, RowProps>(({ item, containerBind, transform, transition, isDragging, isOverlay, onToggle, onWidthChange }, ref) => {
  const { token } = theme.useToken();
  const transformStyle = transform ? CSS.Transform.toString(transform) : undefined;
  const isGhost = isDragging && !isOverlay;
  const style: React.CSSProperties = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
    padding: '6px 10px',
    borderRadius: 8,
    userSelect: 'none',
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    background: isOverlay ? (token?.colorBgElevated ?? '#fff') : (isDragging ? (token?.colorFillTertiary ?? '#f5f5f5') : undefined),
    color: isOverlay ? (token?.colorText ?? '#000') : undefined,
    // 当行处于拖拽时，仅隐藏列表中的原行（ghost），保留 DragOverlay 可见
    opacity: isGhost ? 0 : 1,
    transform: isGhost ? undefined : transformStyle,
    transition: isGhost ? undefined : transition,
    boxShadow: isOverlay ? '0 4px 12px rgba(0,0,0,0.12)' : undefined,
    pointerEvents: isOverlay ? 'none' : undefined,
    zIndex: isOverlay ? 1000 : undefined,
    willChange: 'transform',
  }), [transformStyle, transition, isDragging, isGhost, isOverlay]);

  return (
  <div ref={ref} {...(containerBind || {})} style={style} title="拖拽以调整顺序" data-dnd-overlay={isOverlay ? '1' : undefined}>
      <Space>
        <span style={{ cursor: 'grab', color: '#999' }}>
          <MenuOutlined />
        </span>
        <span data-no-dnd onPointerDownCapture={(e) => e.stopPropagation()}>
          <Checkbox checked={item.visible} onChange={e => onToggle(item.key, e.target.checked)}>
            {item.title}
          </Checkbox>
        </span>
      </Space>
      <Space size={6} style={{ pointerEvents: isDragging ? 'none' : undefined }}>
        <Tooltip title="列宽（像素）">
          <span data-no-dnd onPointerDownCapture={(e) => e.stopPropagation()}>
            <InputNumber
              size="small"
              min={60}
              max={600}
              placeholder="宽"
              value={item.width}
              onChange={(v) => onWidthChange(item.key, typeof v === 'number' ? v : undefined)}
              style={{ width: 90 }}
            />
          </span>
        </Tooltip>
      </Space>
    </div>
  );
});

const Row = React.memo(RowInner, (prev, next) => {
  // 仅当可见/宽度/拖拽状态或变换发生变化时才重渲染
  return (
    prev.item.visible === next.item.visible &&
    prev.item.width === next.item.width &&
    prev.isDragging === next.isDragging &&
    prev.isOverlay === next.isOverlay &&
    prev.transition === next.transition &&
    (prev.transform ? CSS.Transform.toString(prev.transform) : '') === (next.transform ? CSS.Transform.toString(next.transform) : '')
  );
});

const SortableRow: React.FC<{
  item: ColumnRuntimeConfig;
  onToggle: (key: string, visible: boolean) => void;
  onWidthChange: (key: string, width?: number) => void;
}> = ({ item, onToggle, onWidthChange }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.key });
  return (
    <Row
      ref={setNodeRef}
      item={item}
      containerBind={{ ...listeners, ...attributes }}
      transform={transform}
      transition={transition}
      isDragging={isDragging}
      isOverlay={false}
      onToggle={onToggle}
      onWidthChange={onWidthChange}
    />
  );
};

const ColumnSettingsModal: React.FC<Props> = ({ open, onClose, configs, onToggle, onWidthChange, onReset, onReorder }) => {
  const [items, setItems] = useState<ColumnRuntimeConfig[]>(configs);
  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => setItems(configs), [configs]);

  // 自定义 PointerSensor：忽略带有 data-no-dnd 的交互区域，避免误触发拖拽
  class NoDndOnInteractiveSensor extends PointerSensor {
    static activators = [{
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent }: React.PointerEvent<Element>, _options: any) => {
        const target = (nativeEvent.target as HTMLElement) || null;
        if (!target) return true;
        if (target.closest('[data-no-dnd]')) return false;
        const tag = target.tagName.toLowerCase();
        if (['input', 'textarea', 'select', 'button', 'label'].includes(tag)) return false;
        return true;
      },
    }];
  }

  const sensors = useSensors(
    useSensor(NoDndOnInteractiveSensor as unknown as any, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex(i => i.key === active.id);
    const newIndex = items.findIndex(i => i.key === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    onReorder?.(next.map(i => i.key));
    setActiveId(null);
  };

  return (
    <Modal
      title="列设置"
      open={open}
      onCancel={onClose}
      onOk={onClose}
      okText="完成"
      cancelText="关闭"
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.key)} strategy={verticalListSortingStrategy}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {items.map((c) => (
              <SortableRow key={c.key} item={c} onToggle={onToggle} onWidthChange={onWidthChange} />
            ))}
            <Divider style={{ margin: '8px 0' }} />
            <a onClick={onReset}>恢复默认</a>
          </Space>
        </SortableContext>
        <DragOverlay dropAnimation={null}>
          {activeId ? (
            <Row
              item={items.find(i => i.key === activeId)!}
              transform={undefined}
              transition={undefined}
              isDragging={true}
              isOverlay={true}
              onToggle={onToggle}
              onWidthChange={onWidthChange}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </Modal>
  );
};

export default ColumnSettingsModal;
