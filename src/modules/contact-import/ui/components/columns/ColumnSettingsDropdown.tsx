import React, { useRef, useState } from 'react';
import { Dropdown, Button, Space, Checkbox, InputNumber, Divider, Tooltip } from 'antd';
import { SettingOutlined, RedoOutlined } from '@ant-design/icons';
import type { ColumnRuntimeConfig } from './useColumnSettings';

interface Props {
  configs: ColumnRuntimeConfig[];
  onToggle: (key: string, visible: boolean) => void;
  onWidthChange: (key: string, width?: number) => void;
  onReset: () => void;
  onReorder?: (keys: string[]) => void;
}

const ColumnSettingsDropdown: React.FC<Props> = ({ configs, onToggle, onWidthChange, onReset, onReorder }) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const overIndexRef = useRef<number | null>(null);

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    try {
      e.dataTransfer.effectAllowed = 'move';
      // 一些浏览器需要显式 setData 才能进入拖拽态
      e.dataTransfer.setData('text/plain', String(index));
    } catch {}
    setDragIndex(index);
  };
  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch {}
    overIndexRef.current = index;
  };
  const handleDrop = () => {
    if (dragIndex == null || overIndexRef.current == null || dragIndex === overIndexRef.current) return;
    const next = configs.map(c => c.key);
    const [moved] = next.splice(dragIndex, 1);
    next.splice(overIndexRef.current, 0, moved);
    onReorder?.(next);
    setDragIndex(null);
    overIndexRef.current = null;
  };

  const content = (
    <div style={{ padding: 8, maxWidth: 360 }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {configs.map((c, idx) => (
          <div
            key={c.key}
            draggable
            onDragStart={handleDragStart(idx)}
            onDragOver={handleDragOver(idx)}
            onDrop={handleDrop}
            style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', cursor: 'move', padding: '2px 4px', borderRadius: 4, background: dragIndex === idx ? '#f5f5f5' : undefined }}
          >
            <Checkbox checked={c.visible} onChange={e => onToggle(c.key, e.target.checked)}>
              {c.title}
            </Checkbox>
            <Space size={4}>
              <Tooltip title="列宽（像素）">
                <InputNumber size="small" min={60} max={600} placeholder="宽" value={c.width} onChange={(v) => onWidthChange(c.key, typeof v === 'number' ? v : undefined)} />
              </Tooltip>
            </Space>
          </div>
        ))}
        <Divider style={{ margin: '6px 0' }} />
        <Button size="small" icon={<RedoOutlined />} onClick={onReset}>
          恢复默认
        </Button>
      </Space>
    </div>
  );

  return (
    <Dropdown dropdownRender={() => content} trigger={[ 'click' ]} placement="bottomRight">
      <Button icon={<SettingOutlined />}>列设置</Button>
    </Dropdown>
  );
};

export default ColumnSettingsDropdown;
