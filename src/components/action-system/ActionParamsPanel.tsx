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
              <Text strong style={{ fontSize: 13 }}>滑动方向</Text>
            </div>
            <Space.Compact style={{ width: '100%' }}>
              <Input.Group compact>
                <Space>
                  <button
                    onClick={() => updateParams({ direction: 'up' })}
                    style={{
                      padding: '4px 12px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      background: (params.direction === 'up' || action.type === 'swipe_up') ? '#1890ff' : '#fff',
                      color: (params.direction === 'up' || action.type === 'swipe_up') ? '#fff' : '#000',
                      cursor: 'pointer'
                    }}
                  >
                    ↑ 向上
                  </button>
                  <button
                    onClick={() => updateParams({ direction: 'down' })}
                    style={{
                      padding: '4px 12px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      background: (params.direction === 'down' || action.type === 'swipe_down') ? '#1890ff' : '#fff',
                      color: (params.direction === 'down' || action.type === 'swipe_down') ? '#fff' : '#000',
                      cursor: 'pointer'
                    }}
                  >
                    ↓ 向下
                  </button>
                  <button
                    onClick={() => updateParams({ direction: 'left' })}
                    style={{
                      padding: '4px 12px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      background: (params.direction === 'left' || action.type === 'swipe_left') ? '#1890ff' : '#fff',
                      color: (params.direction === 'left' || action.type === 'swipe_left') ? '#fff' : '#000',
                      cursor: 'pointer'
                    }}
                  >
                    ← 向左
                  </button>
                  <button
                    onClick={() => updateParams({ direction: 'right' })}
                    style={{
                      padding: '4px 12px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      background: (params.direction === 'right' || action.type === 'swipe_right') ? '#1890ff' : '#fff',
                      color: (params.direction === 'right' || action.type === 'swipe_right') ? '#fff' : '#000',
                      cursor: 'pointer'
                    }}
                  >
                    → 向右
                  </button>
                </Space>
              </Input.Group>
            </Space.Compact>
            
            <div style={{ marginTop: 12 }}>
              <Text strong style={{ fontSize: 13 }}>滑动距离 (像素)</Text>
            </div>
            <InputNumber
              value={params.distance || 200}
              min={10}
              max={2000}
              step={10}
              onChange={(value) => updateParams({ distance: value || 200 })}
              placeholder="滑动距离"
              size={size}
              style={{ width: '100%' }}
              addonAfter="px"
            />
            
            <div style={{ marginTop: 12 }}>
              <Text strong style={{ fontSize: 13 }}>滑动时长 (毫秒)</Text>
            </div>
            <InputNumber
              value={params.duration || 300}
              min={50}
              max={3000}
              step={50}
              onChange={(value) => updateParams({ duration: value || 300 })}
              placeholder="滑动时长"
              size={size}
              style={{ width: '100%' }}
              addonAfter="ms"
            />
            
            <div style={{ marginTop: 12 }}>
              <Text strong style={{ fontSize: 13 }}>执行次数</Text>
            </div>
            <InputNumber
              value={params.repeat_count || 1}
              min={1}
              max={20}
              step={1}
              onChange={(value) => updateParams({ repeat_count: value || 1 })}
              placeholder="执行次数"
              size={size}
              style={{ width: '100%' }}
              addonAfter="次"
            />
            
            <div style={{ marginTop: 12 }}>
              <Checkbox
                checked={params.wait_between || false}
                onChange={(e) => updateParams({ wait_between: e.target.checked })}
              >
                每次执行间隔等待
              </Checkbox>
            </div>
            
            {params.wait_between && (
              <div>
                <Text strong style={{ fontSize: 13 }}>间隔时长 (毫秒)</Text>
                <InputNumber
                  value={params.wait_duration || 500}
                  min={100}
                  max={5000}
                  step={100}
                  onChange={(value) => updateParams({ wait_duration: value || 500 })}
                  placeholder="间隔时长"
                  size={size}
                  style={{ width: '100%', marginTop: 4 }}
                  addonAfter="ms"
                />
              </div>
            )}
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

      case 'click':
        return (
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div>
              <Text strong style={{ fontSize: 13 }}>点击类型</Text>
            </div>
            <Space>
              <button
                onClick={() => updateParams({ click_type: 'single' })}
                style={{
                  padding: '4px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  background: (params.click_type === 'single' || !params.click_type) ? '#1890ff' : '#fff',
                  color: (params.click_type === 'single' || !params.click_type) ? '#fff' : '#000',
                  cursor: 'pointer'
                }}
              >
                单击
              </button>
              <button
                onClick={() => updateParams({ click_type: 'double' })}
                style={{
                  padding: '4px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  background: params.click_type === 'double' ? '#1890ff' : '#fff',
                  color: params.click_type === 'double' ? '#fff' : '#000',
                  cursor: 'pointer'
                }}
              >
                双击
              </button>
            </Space>
            
            {params.click_type === 'double' && (
              <div>
                <div style={{ marginTop: 12 }}>
                  <Text strong style={{ fontSize: 13 }}>双击间隔 (毫秒)</Text>
                </div>
                <InputNumber
                  value={params.double_click_interval || 150}
                  min={50}
                  max={500}
                  step={10}
                  onChange={(value) => updateParams({ double_click_interval: value || 150 })}
                  placeholder="双击间隔"
                  size={size}
                  style={{ width: '100%' }}
                  addonAfter="ms"
                />
              </div>
            )}
            
            <div style={{ marginTop: 12 }}>
              <Text strong style={{ fontSize: 13 }}>执行次数</Text>
            </div>
            <InputNumber
              value={params.repeat_count || 1}
              min={1}
              max={20}
              step={1}
              onChange={(value) => updateParams({ repeat_count: value || 1 })}
              placeholder="执行次数"
              size={size}
              style={{ width: '100%' }}
              addonAfter="次"
            />
            
            <div style={{ marginTop: 12 }}>
              <Checkbox
                checked={params.wait_between || false}
                onChange={(e) => updateParams({ wait_between: e.target.checked })}
              >
                每次点击间隔等待
              </Checkbox>
            </div>
            
            {params.wait_between && (
              <div>
                <Text strong style={{ fontSize: 13 }}>间隔时长 (毫秒)</Text>
                <InputNumber
                  value={params.wait_duration || 500}
                  min={100}
                  max={5000}
                  step={100}
                  onChange={(value) => updateParams({ wait_duration: value || 500 })}
                  placeholder="间隔时长"
                  size={size}
                  style={{ width: '100%', marginTop: 4 }}
                  addonAfter="ms"
                />
              </div>
            )}
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