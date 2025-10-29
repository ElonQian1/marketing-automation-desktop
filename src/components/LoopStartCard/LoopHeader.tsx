// src/components/LoopStartCard/LoopHeader.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

// 循环卡片头部组件

import React from 'react';
import {
  Typography,
  Tag,
  Button,
  Input,
} from 'antd';
import ConfirmPopover from '../universal-ui/common-popover/ConfirmPopover';
import {
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { LoopHeaderProps } from './types';

const { Text } = Typography;

export const LoopHeader: React.FC<LoopHeaderProps> = ({
  tempConfig,
  isEditing,
  onEditStart,
  onEditSave,
  onEditCancel,
  onTempConfigChange,
  onDeleteLoop,
}) => {
  // 🎯 简化头部：与普通卡片保持一致的紧凑布局
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* 循环图标 + 拖拽手柄合并 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        color: '#0ea5e9',
        fontSize: '16px'
      }}>
        <span style={{ 
          marginRight: 4, 
          fontSize: '16px', 
          fontWeight: 'bold' 
        }}>
          ∞
        </span>
      </div>

      {/* 标题编辑 - 紧凑版 */}
      {isEditing ? (
        <Input
          value={tempConfig.name}
          onChange={(e) => onTempConfigChange({ name: e.target.value })}
          style={{ width: 120, fontSize: '14px' }}
          size="small"
          autoFocus
          onPressEnter={onEditSave}
        />
      ) : (
        <Text strong style={{ 
          color: '#0c4a6e', 
          fontSize: '14px', 
          fontWeight: 600 
        }}>
          {tempConfig.name || '🔄 循环开始'}
        </Text>
      )}

      {/* 状态标签 - 紧凑版 */}
      <Tag 
        color="blue" 
        style={{ 
          fontWeight: 500, 
          padding: '2px 8px',
          fontSize: '11px',
          lineHeight: '16px'
        }}
      >
        {tempConfig.iterations || 1}次
      </Tag>

      {/* 操作按钮 - 紧凑版 */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
        {isEditing ? (
          <>
            <Button size="small" type="link" onClick={onEditSave} style={{ 
              padding: '2px 6px',
              fontSize: '12px',
              color: '#059669'
            }}>
              ✓
            </Button>
            <Button size="small" type="link" onClick={onEditCancel} style={{
              padding: '2px 6px', 
              fontSize: '12px',
              color: '#6b7280'
            }}>
              ✕
            </Button>
          </>
        ) : (
          <>
            <Button
              size="small"
              type="text"
              icon={<EditOutlined style={{ fontSize: '12px' }} />}
              onClick={onEditStart}
              style={{ padding: '4px', minWidth: 'auto' }}
            />
            <ConfirmPopover
              mode="default"
              title="确认删除"
              description="删除循环将同时删除循环内的所有步骤。"
              onConfirm={() => onDeleteLoop(tempConfig.loopId)}
              okText="删除"
              cancelText="取消"
            >
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined style={{ fontSize: '12px' }} />}
                style={{ padding: '4px', minWidth: 'auto' }}
              />
            </ConfirmPopover>
          </>
        )}
      </div>
    </div>
  );
};