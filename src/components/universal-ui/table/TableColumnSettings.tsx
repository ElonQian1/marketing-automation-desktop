/**
 * 统一的列设置组件 - 配合useTableColumns使用
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Button, 
  Checkbox, 
  Divider, 
  InputNumber, 
  Modal, 
  Space, 
  Typography, 
  List,
  Tooltip,
} from 'antd';
import { SettingOutlined, ReloadOutlined, DragOutlined } from '@ant-design/icons';
import type { UseTableColumnsResult, TableColumnState } from './useTableColumns';

const { Text } = Typography;

export interface TableColumnSettingsProps {
  tableColumns: UseTableColumnsResult;
  trigger?: 'button' | 'custom';
  children?: React.ReactNode;
}

export const TableColumnSettings: React.FC<TableColumnSettingsProps> = ({
  tableColumns,
  trigger = 'button',
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  // 使用 useCallback 优化事件处理器
  const handleDragStart = useCallback((e: React.DragEvent, columnKey: string) => {
    setDraggedColumn(columnKey);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetKey) return;

    const allColumns = tableColumns.allColumns;
    const draggedIndex = allColumns.findIndex(col => col.key === draggedColumn);
    const targetIndex = allColumns.findIndex(col => col.key === targetKey);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // 重新排序
    const newOrder = [...allColumns];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    tableColumns.setOrder(newOrder.map(col => col.key));
    setDraggedColumn(null);
  }, [draggedColumn, tableColumns]);

  const handleOpenModal = useCallback(() => setOpen(true), []);
  const handleCloseModal = useCallback(() => setOpen(false), []);

  // 使用 useMemo 优化列项渲染
  const renderColumnItem = useCallback((column: TableColumnState) => {
    const itemStyle = useMemo(() => ({
      padding: '8px 12px',
      border: '1px solid #f0f0f0',
      borderRadius: 4,
      marginBottom: 8,
      backgroundColor: draggedColumn === column.key ? '#f6ffed' : '#fff',
      cursor: 'move',
    }), [draggedColumn, column.key]);

    return (
      <div
        key={column.key}
        draggable
        onDragStart={(e) => handleDragStart(e, column.key)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, column.key)}
        style={itemStyle}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <DragOutlined style={{ color: '#999', cursor: 'grab' }} />
            <Checkbox
              checked={column.visible}
              onChange={(e) => tableColumns.setVisible(column.key, e.target.checked)}
            >
              {column.title}
            </Checkbox>
          </Space>
          <Tooltip title="设置列宽度">
            <InputNumber
              size="small"
              min={60}
              max={600}
              value={column.width}
              onChange={(value) => value && tableColumns.setWidth(column.key, value)}
              style={{ width: 80 }}
              addonAfter="px"
            />
          </Tooltip>
        </Space>
      </div>
    );
  }, [draggedColumn, handleDragStart, handleDragOver, handleDrop, tableColumns]);

  // 使用 useMemo 优化模态框内容
  const modalContent = useMemo(() => (
    <Modal
      title="列设置"
      open={open}
      onCancel={handleCloseModal}
      footer={[
        <Button key="reset" onClick={tableColumns.reset}>
          <ReloadOutlined />
          重置
        </Button>,
        <Button key="close" type="primary" onClick={handleCloseModal}>
          确定
        </Button>,
      ]}
      width={500}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text type="secondary">
          拖拽调整顺序，勾选显示/隐藏列，调整列宽度
        </Text>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {tableColumns.allColumns.map(renderColumnItem)}
        </div>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <Space>
          <Text type="secondary">
            已显示 {tableColumns.visibleCount} / {tableColumns.totalCount} 列
          </Text>
        </Space>
      </Space>
    </Modal>
  ), [open, handleCloseModal, tableColumns, renderColumnItem]);

  // 使用 useMemo 优化触发器元素
  const triggerElement = useMemo(() => {
    if (trigger === 'button') {
      return (
        <Button icon={<SettingOutlined />} onClick={handleOpenModal}>
          列设置
        </Button>
      );
    }
    return (
      <div onClick={handleOpenModal} style={{ cursor: 'pointer' }}>
        {children}
      </div>
    );
  }, [trigger, children, handleOpenModal]);

  return (
    <>
      {triggerElement}
      {modalContent}
    </>
  );
};