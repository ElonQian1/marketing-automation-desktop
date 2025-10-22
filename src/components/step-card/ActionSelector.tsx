// src/components/step-card/ActionSelector.tsx
// module: ui | layer: components | role: 动作选择器
// summary: 步骤卡片中的动作类型选择组件

import React from 'react';
import { Segmented, Space, InputNumber, Input, Select } from 'antd';
import { PlayCircleOutlined, CaretRightOutlined, EditOutlined } from '@ant-design/icons';
import type { ActionKind, StepAction } from '../../types/smartScript';

export interface ActionSelectorProps {
  action?: StepAction;
  onChange: (action: StepAction) => void;
  size?: 'small' | 'middle';
}

export const ActionSelector: React.FC<ActionSelectorProps> = ({
  action = { kind: 'tap' },
  onChange,
  size = 'small'
}) => {
  const handleKindChange = (kind: ActionKind) => {
    const newAction: StepAction = {
      ...action,
      kind,
      params: getDefaultParamsForKind(kind)
    };
    onChange(newAction);
  };

  const handleParamChange = (key: string, value: unknown) => {
    const newAction: StepAction = {
      ...action,
      params: {
        ...action.params,
        [key]: value
      }
    };
    onChange(newAction);
  };

  const getDefaultParamsForKind = (kind: ActionKind) => {
    switch (kind) {
      case 'tap':
        return { tapOffset: { x: 0.5, y: 0.5 } };
      case 'long_press':
        return { tapOffset: { x: 0.5, y: 0.5 }, durationMs: 2000 };
      case 'double_tap':
        return { tapOffset: { x: 0.5, y: 0.5 }, durationMs: 100 };
      case 'swipe':
        return { 
          swipe: { 
            direction: 'up' as const, 
            distancePx: 200, 
            durationMs: 300 
          } 
        };
      case 'input':
        return { text: '', clearBefore: true };
      case 'wait':
        return { waitMs: 1000 };
      default:
        return {};
    }
  };

  const renderParams = () => {
    const { kind, params = {} } = action;

    switch (kind) {
      case 'tap':
      case 'long_press':
      case 'double_tap':
        return (
          <Space size="small">
            <Select
              value={getTapOffsetPreset(params.tapOffset)}
              onChange={(preset) => handleTapOffsetChange(preset, params.tapOffset)}
              size={size}
              style={{ width: 80 }}
              options={[
                { value: 'center', label: '中心' },
                { value: 'tl', label: '左上' },
                { value: 'custom', label: '自定义' }
              ]}
            />
            {kind === 'long_press' && (
              <InputNumber
                value={params.durationMs || 2000}
                onChange={(val) => handleParamChange('durationMs', val)}
                size={size}
                style={{ width: 80 }}
                placeholder="时长"
                addonAfter="ms"
                min={100}
                max={10000}
              />
            )}
          </Space>
        );

      case 'swipe':
        return (
          <Space size="small">
            <Select
              value={params.swipe?.direction || 'up'}
              onChange={(direction) => handleParamChange('swipe', {
                ...params.swipe,
                direction
              })}
              size={size}
              style={{ width: 60 }}
              options={[
                { value: 'up', label: '↑' },
                { value: 'down', label: '↓' },
                { value: 'left', label: '←' },
                { value: 'right', label: '→' }
              ]}
            />
            <InputNumber
              value={params.swipe?.distancePx || 200}
              onChange={(val) => handleParamChange('swipe', {
                ...params.swipe,
                distancePx: val
              })}
              size={size}
              style={{ width: 70 }}
              placeholder="距离"
              addonAfter="px"
              min={50}
              max={1000}
            />
          </Space>
        );

      case 'input':
        return (
          <Input
            value={params.text || ''}
            onChange={(e) => handleParamChange('text', e.target.value)}
            size={size}
            style={{ width: 120 }}
            placeholder="输入文本"
          />
        );

      case 'wait':
        return (
          <InputNumber
            value={params.waitMs || 1000}
            onChange={(val) => handleParamChange('waitMs', val)}
            size={size}
            style={{ width: 80 }}
            placeholder="等待"
            addonAfter="ms"
            min={100}
            max={30000}
          />
        );

      default:
        return null;
    }
  };

  const getTapOffsetPreset = (offset?: { x: number; y: number }) => {
    if (!offset) return 'center';
    if (offset.x === 0.5 && offset.y === 0.5) return 'center';
    if (offset.x === 0.1 && offset.y === 0.1) return 'tl';
    return 'custom';
  };

  const handleTapOffsetChange = (preset: string, currentOffset?: { x: number; y: number }) => {
    let newOffset;
    switch (preset) {
      case 'center':
        newOffset = { x: 0.5, y: 0.5 };
        break;
      case 'tl':
        newOffset = { x: 0.1, y: 0.1 };
        break;
      default:
        newOffset = currentOffset || { x: 0.5, y: 0.5 };
        break;
    }
    handleParamChange('tapOffset', newOffset);
  };

  return (
    <div>
      {/* 动作类型选择器 */}
      <div style={{ marginBottom: size === 'small' ? 4 : 8 }}>
        <Segmented
          value={action.kind}
          onChange={handleKindChange}
          size={size}
          options={[
            {
              label: '点选',
              value: 'tap',
              icon: <CaretRightOutlined />
            },
            {
              label: '长按',
              value: 'long_press',
              icon: <CaretRightOutlined />
            },
            {
              label: '滑动',
              value: 'swipe',
              icon: <PlayCircleOutlined />
            },
            {
              label: '输入',
              value: 'input',
              icon: <EditOutlined />
            },
            {
              label: '等待',
              value: 'wait',
              icon: <PlayCircleOutlined />
            },
            {
              label: '仅查找',
              value: 'find_only',
              icon: <PlayCircleOutlined />
            }
          ]}
        />
      </div>

      {/* 参数配置区 */}
      {action.kind !== 'find_only' && (
        <div>
          {renderParams()}
        </div>
      )}
    </div>
  );
};