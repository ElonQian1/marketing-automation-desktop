import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Space, Checkbox, InputNumber, Tooltip, Divider } from 'antd';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
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

const Row: React.FC<{
  item: ColumnRuntimeConfig;
  listeners: any;
  attributes: any;
  transform: any;
  transition: string | undefined;
  isDragging: boolean;
  onToggle: (key: string, visible: boolean) => void;
  onWidthChange: (key: string, width?: number) => void;
}> = ({ item, listeners, attributes, transform, transition, isDragging, onToggle, onWidthChange }) => {
  const style: React.CSSProperties = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
    padding: '6px 10px',
    borderRadius: 8,
    cursor: 'grab',
    background: isDragging ? '#f5f5f5' : undefined,
    transform: CSS.Transform.toString(transform),
    transition,
    boxShadow: isDragging ? '0 2px 8px rgba(0,0,0,0.12)' : undefined,
  }), [transform, transition, isDragging]);

  return (
    <div style={style} {...attributes} {...listeners} title="拖拽以调整顺序">
      <Checkbox checked={item.visible} onChange={e => onToggle(item.key, e.target.checked)}>
        {item.title}
      </Checkbox>
      <Space size={6}>
        <Tooltip title="列宽（像素）">
          <InputNumber
            size="small"
            min={60}
            max={600}
            placeholder="宽"
            value={item.width}
            onChange={(v) => onWidthChange(item.key, typeof v === 'number' ? v : undefined)}
            style={{ width: 90 }}
          />
        </Tooltip>
      </Space>
    </div>
  );
};

const SortableRow: React.FC<{
  item: ColumnRuntimeConfig;
  onToggle: (key: string, visible: boolean) => void;
  onWidthChange: (key: string, width?: number) => void;
}> = ({ item, onToggle, onWidthChange }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.key });
  return (
    <div ref={setNodeRef}>
      <Row
        item={item}
        listeners={listeners}
        attributes={attributes}
        transform={transform}
        transition={transition}
        isDragging={isDragging}
        onToggle={onToggle}
        onWidthChange={onWidthChange}
      />
    </div>
  );
};

const ColumnSettingsModal: React.FC<Props> = ({ open, onClose, configs, onToggle, onWidthChange, onReset, onReorder }) => {
  const [items, setItems] = useState<ColumnRuntimeConfig[]>(configs);
  useEffect(() => setItems(configs), [configs]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex(i => i.key === active.id);
    const newIndex = items.findIndex(i => i.key === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    onReorder?.(next.map(i => i.key));
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.key)} strategy={verticalListSortingStrategy}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {items.map((c) => (
              <SortableRow key={c.key} item={c} onToggle={onToggle} onWidthChange={onWidthChange} />
            ))}
            <Divider style={{ margin: '8px 0' }} />
            <a onClick={onReset}>恢复默认</a>
          </Space>
        </SortableContext>
      </DndContext>
    </Modal>
  );
};

export default ColumnSettingsModal;
