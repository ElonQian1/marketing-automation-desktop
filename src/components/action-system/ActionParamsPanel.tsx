// src/components/action-system/ActionParamsPanel.tsx
// module: action-system | layer: ui | role: 操作参数配置面板
// summary: 不同操作类型的参数配置面板

import React from 'react';
import { 
 
  Input, 
  InputNumber, 
  Slider, 
  Checkbox, 
  Space, 
  Card,
  Typography 
} from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import type { ActionType, ActionParams } from '../../types/action-types';
import { getActionConfig } from '../../types/action-types';

const { Text } = Typography;
const { TextArea } = Input;

interface ActionParamsPanelProps {
  action: ActionType;
  onChange: (params: ActionParams) => void;
  size?: 'small' | 'middle';
  title?: string;
}

export const ActionParamsPanel: React.FC<ActionParamsPanelProps> = ({
  action,
  onChange,
  size = 'middle',
  title = '操作参数'
}) => {
  const config = getActionConfig(action.type);
  const params = action.params || {};

  const updateParams = (newParams: Partial<ActionParams>) => {
    onChange({ ...params, ...newParams });
  };

  const renderParamsContent = () => {
    switch (action.type) {
      case 'input':
        return (
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div>
              <Text strong style={{ fontSize: 13 }}>输入内容</Text>
              <Text type="danger"> *</Text>
            </div>
            <TextArea
              value={params.text || ''}
              onChange={(e) => updateParams({ text: e.target.value })}
              placeholder="请输入要输入的文本内容"
              rows={2}
              size={size}
            />
            <Checkbox
              checked={params.clear_before || false}
              onChange={(e) => updateParams({ clear_before: e.target.checked })}
            >
              输入前清空现有内容
            </Checkbox>
          </Space>
        );

      case 'swipe_up':
      case 'swipe_down':
      case 'swipe_left':
      case 'swipe_right':
        return (
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div>
              <Text strong style={{ fontSize: 13 }}>滑动距离 (像素)</Text>
            </div>
            <Slider
              value={params.distance || 200}
              min={50}
              max={500}
              step={10}
              onChange={(value) => updateParams({ distance: value })}
              marks={{ 50: '50px', 200: '200px', 500: '500px' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              当前: {params.distance || 200}px
            </Text>
            
            <div>
              <Text strong style={{ fontSize: 13 }}>滑动时长 (毫秒)</Text>
            </div>
            <Slider
              value={params.duration || 300}
              min={100}
              max={1000}
              step={50}
              onChange={(value) => updateParams({ duration: value })}
              marks={{ 100: '快', 300: '中', 1000: '慢' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              当前: {params.duration || 300}ms
            </Text>
          </Space>
        );

      case 'long_press':
        return (
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div>
              <Text strong style={{ fontSize: 13 }}>长按时长 (毫秒)</Text>
            </div>
            <Slider
              value={params.duration || 2000}
              min={500}
              max={5000}
              step={100}
              onChange={(value) => updateParams({ duration: value })}
              marks={{ 500: '0.5s', 2000: '2s', 5000: '5s' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              当前: {((params.duration || 2000) / 1000).toFixed(1)}秒
            </Text>
          </Space>
        );

      case 'scroll':
        return (
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div>
              <Text strong style={{ fontSize: 13 }}>目标位置</Text>
            </div>
            <Space.Compact style={{ width: '100%' }}>
              <InputNumber
                addonBefore="X"
                value={params.target_x || 0}
                onChange={(value) => updateParams({ target_x: value || 0 })}
                placeholder="横坐标"
                size={size}
                style={{ width: '50%' }}
              />
              <InputNumber
                addonBefore="Y"
                value={params.target_y || 0}
                onChange={(value) => updateParams({ target_y: value || 0 })}
                placeholder="纵坐标"
                size={size}
                style={{ width: '50%' }}
              />
            </Space.Compact>
            
            <div style={{ marginTop: 8 }}>
              <Text strong style={{ fontSize: 13 }}>滚动时长 (毫秒)</Text>
            </div>
            <Slider
              value={params.duration || 500}
              min={200}
              max={2000}
              step={100}
              onChange={(value) => updateParams({ duration: value })}
              marks={{ 200: '快', 500: '中', 2000: '慢' }}
            />
          </Space>
        );

      case 'wait':
        return (
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div>
              <Text strong style={{ fontSize: 13 }}>等待时长 (毫秒)</Text>
            </div>
            <Slider
              value={params.duration || 1000}
              min={100}
              max={10000}
              step={100}
              onChange={(value) => updateParams({ duration: value })}
              marks={{ 100: '0.1s', 1000: '1s', 5000: '5s', 10000: '10s' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              当前: {((params.duration || 1000) / 1000).toFixed(1)}秒
            </Text>
          </Space>
        );

      default:
        return (
          <div style={{ 
            textAlign: 'center', 
            padding: '16px', 
            color: 'var(--text-3, #94a3b8)' 
          }}>
            <Text type="secondary">此操作无需额外参数</Text>
          </div>
        );
    }
  };

  // 如果操作类型不需要参数，不渲染面板
  if (!config.hasParams) {
    return null;
  }

  return (
    <Card 
      size="small" 
      className="light-theme-force action-params-panel"
      title={
        <Space>
          <SettingOutlined style={{ color: config.color }} />
          <span style={{ color: config.color }}>{title}</span>
        </Space>
      }
      bodyStyle={{ padding: '12px' }}
    >
      {renderParamsContent()}
    </Card>
  );
};

export default ActionParamsPanel;