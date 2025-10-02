// 循环卡片头部组件

import React from 'react';
import {
  Typography,
  Tag,
  Tooltip,
  Space,
  Button,
  Input,
} from 'antd';
import ConfirmPopover from '@/components/universal-ui/common-popover/ConfirmPopover';
import {
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  DragOutlined,
  PlayCircleOutlined,
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
  return (
    <div
      style={{
        backgroundColor: '#eff6ff',
        opacity: 0.8,
        margin: -8,
        padding: 12,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        borderBottom: '2px solid #bfdbfe',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* 拖拽手柄 */}
        <div className="loop-header-handle">
          <DragOutlined style={{ color: '#1e40af', fontSize: '18px', fontWeight: 'bold' }} />
        </div>

        {/* 循环图标 */}
        <div className="loop-icon-pill">
          <ReloadOutlined style={{ fontSize: '14px' }} />
        </div>

        {/* 标题编辑 */}
        {isEditing ? (
          <Input
            value={tempConfig.name}
            onChange={(e) =>
              onTempConfigChange({ name: e.target.value })
            }
            style={{ width: 200 }}
            autoFocus
            onPressEnter={onEditSave}
          />
        ) : (
          <Text strong style={{ color: '#1e3a8a', fontSize: '18px', fontWeight: 'bold' }}>
            {tempConfig.name}
          </Text>
        )}

        {/* 状态标签 */}
        <Tag color="blue" style={{ fontWeight: 'bold', padding: '4px 12px' }}>
          循环开始
        </Tag>

        {/* 循环次数标签 */}
        {tempConfig.iterations && (
          <Tag style={{ backgroundColor: '#f3f4f6', borderColor: '#d1d5db' }}>
            {tempConfig.iterations}次
          </Tag>
        )}
      </div>

      {/* 操作按钮 */}
      <Space>
        {isEditing ? (
          <>
            <Button
              size="small"
              type="primary"
              onClick={onEditSave}
              style={{
                backgroundColor: '#eff6ff',
                borderColor: '#bfdbfe',
                color: '#2563eb',
              }}
            >
              保存
            </Button>
            <Button size="small" onClick={onEditCancel}>
              取消
            </Button>
          </>
        ) : (
          <>
            <Tooltip title="编辑循环配置">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={onEditStart}
                style={{
                  backgroundColor: '#eff6ff',
                  borderColor: '#bfdbfe',
                  color: '#2563eb',
                }}
              />
            </Tooltip>
            <Tooltip title="删除循环">
              <ConfirmPopover
                mode="default"
                title="确认删除"
                description="删除循环将同时删除循环内的所有步骤，此操作无法撤销。"
                onConfirm={() => onDeleteLoop(tempConfig.loopId)}
                okText="确认删除"
                cancelText="取消"
              >
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  style={{
                    backgroundColor: '#fef2f2',
                    borderColor: '#fecaca',
                  }}
                />
              </ConfirmPopover>
            </Tooltip>
          </>
        )}
      </Space>
    </div>
  );
};