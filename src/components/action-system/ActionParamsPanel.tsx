// src/components/action-system/ActionParamsPanel.tsx
// module: action-system | layer: ui | role: 操作参数配置面板
// summary: 不同操作类型的参数配置面板

import React, { useState } from 'react';
import { 
 
  Input, 
  InputNumber, 
  Slider, 
  Checkbox, 
  Space, 
  Card,
  Typography,
  Select 
} from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import type { ActionType, ActionParams } from '../../types/action-types';
import { getActionConfig } from '../../types/action-types';

const { Text } = Typography;
const { TextArea } = Input;

interface ActionParamsPanelProps {
  action: ActionType;
  initialParams?: ActionParams; // 🔥 新增：外部传入的初始参数
  onChange: (params: ActionParams) => void;
  size?: 'small' | 'middle' | 'large';
  title?: string;
}

export const ActionParamsPanel: React.FC<ActionParamsPanelProps> = ({
  action,
  initialParams,
  onChange,
  size = 'middle',
  title = '操作参数'
}) => {
  const config = getActionConfig(action.type);
  
  // 🔥 使用 useState 管理内部参数状态，避免外部循环依赖
  const [params, setParams] = useState<ActionParams>(() => {
    return initialParams || action.params || {};
  });

  // 🔄 同步外部参数变化到内部状态
  React.useEffect(() => {
    const externalParams = initialParams || action.params || {};
    setParams(externalParams);
  }, [initialParams, action.params]);

  const updateParams = (newParams: Partial<ActionParams>) => {
    const updatedParams = { ...params, ...newParams };
    setParams(updatedParams); // 更新内部状态
    onChange(updatedParams);   // 通知外部
  };

  const renderParamsContent = () => {
    switch (action.type) {
      case 'input':
        return (
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div>
              <Text strong style={{ fontSize: 13, color: 'var(--text-1, #F8FAFC)' }}>输入内容</Text>
              <Text type="danger"> *</Text>
            </div>
            <TextArea
              value={params.text || ''}
              onChange={(e) => updateParams({ text: e.target.value })}
              placeholder="请输入要输入的文本内容"
              rows={3}
              size={size}
              maxLength={500}
              showCount
            />
            
            <Checkbox
              checked={params.clear_before || false}
              onChange={(e) => updateParams({ clear_before: e.target.checked })}
              style={{ color: 'var(--text-1, #F8FAFC)' }}
            >
              <span style={{ color: 'var(--text-1, #F8FAFC)' }}>输入前清空现有内容</span>
            </Checkbox>
            
            <div style={{ marginTop: 12 }}>
              <Text strong style={{ fontSize: 13, color: 'var(--text-1, #F8FAFC)' }}>输入速度</Text>
            </div>
            <Select
              value={params.input_speed || 'normal'}
              onChange={(value) => updateParams({ input_speed: value })}
              style={{ width: '100%' }}
              size={size}
              options={[
                { label: '极快 (无延迟)', value: 'instant' },
                { label: '快速 (50ms延迟)', value: 'fast' },
                { label: '正常 (100ms延迟)', value: 'normal' },
                { label: '慢速 (200ms延迟)', value: 'slow' },
              ]}
            />
            
            <div style={{ marginTop: 8 }}>
              <Checkbox
                checked={params.simulate_human !== false}
                onChange={(e) => updateParams({ simulate_human: e.target.checked })}
              >
                模拟人类输入节奏
              </Checkbox>
            </div>
          </Space>
        );

      case 'swipe_up':
      case 'swipe_down':
      case 'swipe_left':
      case 'swipe_right':
        return (
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div>
              <Text strong style={{ fontSize: 13, color: 'var(--text-1, #F8FAFC)' }}>滑动方向</Text>
            </div>
            <Space.Compact style={{ width: '100%' }}>
              <Input.Group compact>
                <Space>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateParams({ direction: 'up' });
                    }}
                    style={{
                      padding: '4px 12px',
                      border: '1px solid var(--border-primary, #334155)',
                      borderRadius: '6px',
                      background: (params.direction === 'up') ? '#1890ff' : 'var(--bg-elevated, #1E293B)',
                      color: (params.direction === 'up') ? '#fff' : 'var(--text-1, #F8FAFC)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      pointerEvents: 'auto'
                    }}
                  >
                    ↑ 向上
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateParams({ direction: 'down' });
                    }}
                    style={{
                      padding: '4px 12px',
                      border: '1px solid var(--border-primary, #334155)',
                      borderRadius: '6px',
                      background: (params.direction === 'down') ? '#1890ff' : 'var(--bg-elevated, #1E293B)',
                      color: (params.direction === 'down') ? '#fff' : 'var(--text-1, #F8FAFC)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      pointerEvents: 'auto'
                    }}
                  >
                    ↓ 向下
                  </button>
                  <button
                    onClick={() => updateParams({ direction: 'left' })}
                    style={{
                      padding: '4px 12px',
                      border: '1px solid var(--border-primary, #334155)',
                      borderRadius: '6px',
                      background: (params.direction === 'left') ? '#1890ff' : 'var(--bg-elevated, #1E293B)',
                      color: (params.direction === 'left') ? '#fff' : 'var(--text-1, #F8FAFC)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    ← 向左
                  </button>
                  <button
                    onClick={() => updateParams({ direction: 'right' })}
                    style={{
                      padding: '4px 12px',
                      border: '1px solid var(--border-primary, #334155)',
                      borderRadius: '6px',
                      background: (params.direction === 'right') ? '#1890ff' : 'var(--bg-elevated, #1E293B)',
                      color: (params.direction === 'right') ? '#fff' : 'var(--text-1, #F8FAFC)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    → 向右
                  </button>
                </Space>
              </Input.Group>
            </Space.Compact>
            
            <div style={{ marginTop: 12 }}>
              <Text strong style={{ fontSize: 13, color: 'var(--text-1, #F8FAFC)' }}>滑动距离 (像素)</Text>
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
              <Text strong style={{ fontSize: 13, color: 'var(--text-1, #F8FAFC)' }}>滑动时长 (毫秒)</Text>
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
              <Text strong style={{ fontSize: 13, color: 'var(--text-1, #F8FAFC)' }}>执行次数</Text>
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
                <span style={{ color: 'var(--text-1, #F8FAFC)' }}>每次执行间隔等待</span>
              </Checkbox>
            </div>
            
            {params.wait_between && (
              <div>
                <Text strong style={{ fontSize: 13, color: 'var(--text-1, #F8FAFC)' }}>间隔时长 (毫秒)</Text>
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
            <InputNumber
              value={params.duration || 2000}
              min={500}
              max={10000}
              step={100}
              onChange={(value) => updateParams({ duration: value || 2000 })}
              placeholder="长按时长"
              size={size}
              style={{ width: '100%' }}
              addonAfter="ms"
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              建议: 0.5-3秒适合大多数场景，超过5秒可能触发系统手势
            </Text>
            
            <div style={{ marginTop: 12 }}>
              <Text strong style={{ fontSize: 13 }}>执行次数</Text>
            </div>
            <InputNumber
              value={params.repeat_count || 1}
              min={1}
              max={10}
              step={1}
              onChange={(value) => updateParams({ repeat_count: value || 1 })}
              placeholder="执行次数"
              size={size}
              style={{ width: '100%' }}
              addonAfter="次"
            />
            
            {(params.repeat_count || 1) > 1 && (
              <>
                <div style={{ marginTop: 12 }}>
                  <Checkbox
                    checked={params.wait_between || false}
                    onChange={(e) => updateParams({ wait_between: e.target.checked })}
                  >
                    长按之间等待间隔
                  </Checkbox>
                </div>
                
                {params.wait_between && (
                  <div>
                    <Text strong style={{ fontSize: 13 }}>间隔时长 (毫秒)</Text>
                    <InputNumber
                      value={params.wait_duration || 1000}
                      min={100}
                      max={5000}
                      step={100}
                      onChange={(value) => updateParams({ wait_duration: value || 1000 })}
                      placeholder="间隔时长"
                      size={size}
                      style={{ width: '100%', marginTop: 4 }}
                      addonAfter="ms"
                    />
                  </div>
                )}
              </>
            )}
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
            <InputNumber
              value={params.duration || 1000}
              min={100}
              max={30000}
              step={100}
              onChange={(value) => updateParams({ duration: value || 1000 })}
              placeholder="等待时长"
              size={size}
              style={{ width: '100%' }}
              addonAfter="ms"
            />
            
            <div style={{ marginTop: 12 }}>
              <Text strong style={{ fontSize: 13 }}>快速选择</Text>
            </div>
            <Space wrap>
              {[
                { label: '0.5秒', value: 500 },
                { label: '1秒', value: 1000 },
                { label: '2秒', value: 2000 },
                { label: '3秒', value: 3000 },
                { label: '5秒', value: 5000 },
                { label: '10秒', value: 10000 },
              ].map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => updateParams({ duration: value })}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid var(--border-primary, #334155)',
                    borderRadius: '4px',
                    background: (params.duration === value) ? '#1890ff' : 'var(--bg-elevated, #1E293B)',
                    color: (params.duration === value) ? '#fff' : 'var(--text-1, #F8FAFC)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {label}
                </button>
              ))}
            </Space>
            
            <Text type="secondary" style={{ fontSize: 12, marginTop: 8 }}>
              当前: {((params.duration || 1000) / 1000).toFixed(1)}秒 
              {params.duration && params.duration >= 5000 && ' ⚠️ 长时间等待可能影响用户体验'}
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
                onClick={(e) => {
                  e.stopPropagation();
                  updateParams({ click_type: 'single' });
                }}
                style={{
                  padding: '4px 12px',
                  border: '1px solid var(--border-primary, #334155)',
                  borderRadius: '6px',
                  background: (params.click_type === 'single' || !params.click_type) ? '#1890ff' : 'var(--bg-elevated, #1E293B)',
                  color: (params.click_type === 'single' || !params.click_type) ? '#fff' : 'var(--text-1, #F8FAFC)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  pointerEvents: 'auto'
                }}
              >
                单击
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateParams({ click_type: 'double' });
                }}
                style={{
                  padding: '4px 12px',
                  border: '1px solid var(--border-primary, #334155)',
                  borderRadius: '6px',
                  background: params.click_type === 'double' ? '#1890ff' : 'var(--bg-elevated, #1E293B)',
                  color: params.click_type === 'double' ? '#fff' : 'var(--text-1, #F8FAFC)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  pointerEvents: 'auto'
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
    <>
      <style>
        {`
          .action-params-panel .ant-typography,
          .action-params-panel .ant-checkbox-wrapper .ant-checkbox + span,
          .action-params-panel .dark-theme-text-override .ant-typography {
            color: var(--text-1, #F8FAFC) !important;
          }
          .action-params-panel .ant-typography[type="secondary"] {
            color: var(--text-3, #CBD5E1) !important;
          }
          .action-params-panel .ant-card-head-title,
          .action-params-panel .ant-card-head-title *,
          .action-params-panel .ant-card-head .ant-space-item span,
          .action-params-panel .ant-card-head-wrapper span {
            color: var(--text-1, #F8FAFC) !important;
          }
          .action-params-panel.light-theme-force .ant-card-head-title {
            color: var(--text-1, #F8FAFC) !important;
          }
          .action-params-panel .ant-input-number,
          .action-params-panel .ant-input,
          .action-params-panel .ant-select,
          .action-params-panel .ant-checkbox,
          .action-params-panel button {
            pointer-events: auto !important;
          }
        `}
      </style>
      <Card 
        size="small" 
        className="light-theme-force action-params-panel"
        title={
          <Space style={{ color: 'var(--text-1, #F8FAFC)' }}>
            <SettingOutlined style={{ color: config.color }} />
            <span style={{ color: 'var(--text-1, #F8FAFC) !important' }}>{title}</span>
          </Space>
        }
        bodyStyle={{ 
          padding: '12px',
          color: 'var(--text-1, #F8FAFC) !important'
        }}
        style={{
          color: 'var(--text-1, #F8FAFC) !important'
        }}
      >
        <div 
          className="dark-theme-text-override"
          style={{ 
            color: 'var(--text-1, #F8FAFC)'
          }}
        >
          {renderParamsContent()}
        </div>
      </Card>
    </>
  );
};

export default ActionParamsPanel;