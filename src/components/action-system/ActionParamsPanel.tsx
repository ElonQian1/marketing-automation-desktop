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
  Select,
  Collapse,
  Switch,
  Divider
} from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import type { ActionType, ActionParams } from '../../types/action-types';
import { getActionConfig } from '../../types/action-types';
import type { StepActionCommon } from '../../types/stepActions';
import { DEFAULT_ACTION_COMMON } from '../../types/stepActions';
import { CoordinateSelector } from './coordinate-selector';
import type { CoordinateConfig } from './coordinate-selector';

const { Text } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

interface ActionParamsPanelProps {
  action: ActionType;
  initialParams?: ActionParams; // 🔥 新增：外部传入的初始参数
  onChange: (params: ActionParams) => void;
  // 🔥 新增：通用执行配置
  common?: StepActionCommon;
  onCommonChange?: (common: StepActionCommon) => void;
  size?: 'small' | 'middle' | 'large';
  title?: string;
}

export const ActionParamsPanel: React.FC<ActionParamsPanelProps> = ({
  action,
  initialParams,
  onChange,
  common,
  onCommonChange,
  size = 'middle',
  title = '操作参数'
}) => {
  const config = getActionConfig(action.type);
  
  // 🔥 使用 useState 管理内部参数状态，避免外部循环依赖
  const [params, setParams] = useState<ActionParams>(() => {
    return initialParams || action.params || {};
  });
  
  // 🔥 通用执行配置状态（使用外部传入或默认值）
  const [commonConfig, setCommonConfig] = useState<StepActionCommon>(() => {
    return common || DEFAULT_ACTION_COMMON;
  });

  // 🔄 使用 useRef 来跟踪上次的外部参数，避免不必要的更新
  const lastExternalParamsRef = React.useRef<ActionParams>({});

  // 🔄 同步外部参数变化到内部状态（优化：避免循环依赖）
  React.useEffect(() => {
    const externalParams = initialParams || action.params || {};
    const lastParams = lastExternalParamsRef.current;
    
    // 只有当外部参数真正发生变化时才更新内部状态
    const hasRealChange = JSON.stringify(externalParams) !== JSON.stringify(lastParams);
    if (hasRealChange) {
      console.log('🔄 [ActionParamsPanel] 外部参数变化，同步到内部状态:', {
        action: action.type,
        oldParams: lastParams,
        newParams: externalParams
      });
      setParams(externalParams);
      lastExternalParamsRef.current = externalParams;
    }
  }, [initialParams, action.params, action.type]);

  const updateParams = (newParams: Partial<ActionParams>) => {
    const updatedParams = { ...params, ...newParams };
    console.log('🔄 [ActionParamsPanel] 参数更新:', {
      action: action.type,
      oldParams: params,
      newParams,
      updatedParams
    });
    setParams(updatedParams); // 更新内部状态
    onChange(updatedParams);   // 通知外部
  };
  
  // 🔥 更新通用配置
  const updateCommon = (newCommon: Partial<StepActionCommon>) => {
    const updatedCommon = { ...commonConfig, ...newCommon };
    console.log('🔄 [ActionParamsPanel] 通用配置更新:', {
      oldCommon: commonConfig,
      newCommon,
      updatedCommon
    });
    setCommonConfig(updatedCommon);
    onCommonChange?.(updatedCommon);
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
                  step={100}
                  onChange={(value) => updateParams({ wait_duration: value || 500 })}
                  placeholder="间隔时长"
                  size={size}
                  style={{ width: '100%', marginTop: 4 }}
                  addonAfter="ms"
                />
              </div>
            )}

            {/* 🎯 智能坐标配置模块 */}
            <div style={{ marginTop: 16 }}>
              <CoordinateSelector
                params={params as ActionParams & CoordinateConfig}
                onChange={(newCoords) => updateParams(newCoords)}
                size={size}
                direction={params.direction || 'down'}
                screenSize={{ width: 1080, height: 1920 }}
              />
            </div>
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
                { label: '30秒', value: 30000 },
                { label: '1分钟', value: 60000 },
                { label: '2分钟', value: 120000 },
                { label: '5分钟', value: 300000 },
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
          /* ===== 🛡️ 样式隔离基准线 - 防止外部样式干扰 ===== */
          .action-params-panel {
            /* 重置所有可能被外部影响的属性 */
            all: unset !important;
            display: block !important;
            position: relative !important;
            box-sizing: border-box !important;
            
            /* 强制深色主题基准 */
            background-color: var(--bg-elevated, #1E293B) !important;
            color: var(--text-1, #F8FAFC) !important;
            border-radius: 8px !important;
            
            /* 防止被全局样式覆盖的保护属性 */
            font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif !important;
            font-size: 14px !important;
            line-height: 1.5 !important;
          }

          /* ===== 基础文本颜色控制 - 确保所有文字在深色背景下可见 ===== */
          .action-params-panel,
          .action-params-panel *,
          .action-params-panel .ant-typography,
          .action-params-panel .ant-typography *,
          .action-params-panel .ant-checkbox-wrapper,
          .action-params-panel .ant-checkbox-wrapper span,
          .action-params-panel .ant-space-item,
          .action-params-panel .ant-space-item *,
          .action-params-panel .dark-theme-text-override,
          .action-params-panel .dark-theme-text-override * {
            color: var(--text-1, #F8FAFC) !important;
          }

          /* ===== 🔧 输入组件强制深色样式 - 解决白底白字问题 ===== */
          .action-params-panel .ant-input-number,
          .action-params-panel .ant-input-number *,
          .action-params-panel .ant-input-number-input,
          .action-params-panel .ant-input-number .ant-input-number-input,
          .action-params-panel .ant-input,
          .action-params-panel .ant-input *,
          .action-params-panel .ant-textarea,
          .action-params-panel .ant-textarea *,
          .action-params-panel .ant-select,
          .action-params-panel .ant-select *,
          .action-params-panel .ant-select .ant-select-selector,
          .action-params-panel .ant-select-selection-item,
          .action-params-panel .ant-select-selection-placeholder {
            background-color: var(--bg-elevated, #1E293B) !important;
            border-color: var(--border-primary, #334155) !important;
            color: var(--text-1, #F8FAFC) !important;
            
            /* 🚨 防止被全局白色背景覆盖 */
            background: var(--bg-elevated, #1E293B) !important;
            background-image: none !important;
          }

          /* ===== InputNumber 输入框特殊处理 ===== */
          .action-params-panel .ant-input-number-input-wrap,
          .action-params-panel .ant-input-number-input-wrap input,
          .action-params-panel .ant-input-number-input-wrap input[type="text"],
          .action-params-panel .ant-input-number-input-wrap .ant-input-number-input {
            background-color: var(--bg-elevated, #1E293B) !important;
            background: var(--bg-elevated, #1E293B) !important;
            color: var(--text-1, #F8FAFC) !important;
            border: none !important;
            outline: none !important;
          }

          /* ===== 输入组件 wrapper 容器 ===== */
          .action-params-panel .ant-input-number-wrapper,
          .action-params-panel .ant-input-number-group-wrapper,
          .action-params-panel .ant-input-number-group {
            background-color: transparent !important;
          }

          /* ===== 输入组件交互状态 ===== */
          .action-params-panel .ant-input-number:hover,
          .action-params-panel .ant-input:hover,
          .action-params-panel .ant-textarea:hover,
          .action-params-panel .ant-select:hover .ant-select-selector {
            border-color: var(--brand, #4A5FD1) !important;
            background-color: var(--bg-elevated, #1E293B) !important;
          }

          .action-params-panel .ant-input-number-focused,
          .action-params-panel .ant-input-number:focus,
          .action-params-panel .ant-input-number:focus-within,
          .action-params-panel .ant-input:focus,
          .action-params-panel .ant-textarea:focus,
          .action-params-panel .ant-select-focused .ant-select-selector {
            border-color: var(--brand, #4A5FD1) !important;
            box-shadow: 0 0 0 2px rgba(74, 95, 209, 0.2) !important;
            background-color: var(--bg-elevated, #1E293B) !important;
            outline: none !important;
          }

          /* ===== 输入框后缀/前缀样式 ===== */
          .action-params-panel .ant-input-number-group-addon,
          .action-params-panel .ant-input-group-addon {
            background-color: var(--bg-secondary, #334155) !important;
            border-color: var(--border-primary, #334155) !important;
            color: var(--text-2, #E2E8F0) !important;
          }

          /* ===== 数字输入框控制按钮样式 ===== */
          .action-params-panel .ant-input-number-handler-wrap {
            background-color: var(--bg-elevated, #1E293B) !important;
          }
          
          .action-params-panel .ant-input-number-handler {
            color: var(--text-2, #E2E8F0) !important;
            border-color: var(--border-primary, #334155) !important;
          }
          
          .action-params-panel .ant-input-number-handler:hover {
            color: var(--brand, #4A5FD1) !important;
          }

          /* ===== 复选框样式 ===== */
          .action-params-panel .ant-checkbox-wrapper .ant-checkbox + span,
          .action-params-panel .ant-checkbox-wrapper span {
            color: var(--text-1, #F8FAFC) !important;
          }

          .action-params-panel .ant-checkbox {
            border-color: var(--border-primary, #334155) !important;
          }

          .action-params-panel .ant-checkbox-checked .ant-checkbox-inner {
            background-color: var(--brand, #4A5FD1) !important;
            border-color: var(--brand, #4A5FD1) !important;
          }

          /* ===== 卡片标题样式 ===== */
          .action-params-panel .ant-card-head,
          .action-params-panel .ant-card-head-wrapper,
          .action-params-panel .ant-card-head-title,
          .action-params-panel .ant-card-head-title *,
          .action-params-panel .ant-card-head .ant-space-item span,
          .action-params-panel .ant-card-head-wrapper span {
            background-color: transparent !important;
            color: var(--text-1, #F8FAFC) !important;
          }

          .action-params-panel.light-theme-force .ant-card-head-title {
            color: var(--text-1, #F8FAFC) !important;
          }

          /* ===== 卡片主体样式 ===== */
          .action-params-panel .ant-card-body {
            background-color: transparent !important;
            color: var(--text-1, #F8FAFC) !important;
          }

          /* ===== 次要文本样式 ===== */
          .action-params-panel .ant-typography[type="secondary"] {
            color: var(--text-3, #CBD5E1) !important;
          }

          /* ===== 交互元素可点击性 ===== */
          .action-params-panel .ant-input-number,
          .action-params-panel .ant-input,
          .action-params-panel .ant-select,
          .action-params-panel .ant-checkbox,
          .action-params-panel button,
          .action-params-panel .ant-textarea {
            pointer-events: auto !important;
          }

          /* ===== 自定义按钮样式 ===== */
          .action-params-panel button {
            color: inherit !important;
          }

          /* ===== 禁用状态样式 ===== */
          .action-params-panel .ant-input-number-disabled,
          .action-params-panel .ant-input[disabled],
          .action-params-panel .ant-textarea[disabled] {
            background-color: var(--bg-base, #0F172A) !important;
            color: var(--text-3, #CBD5E1) !important;
            opacity: 0.6;
          }

          /* ===== 占位符文字颜色 ===== */
          .action-params-panel .ant-input::placeholder,
          .action-params-panel .ant-textarea::placeholder,
          .action-params-panel .ant-input-number input::placeholder,
          .action-params-panel .ant-input-number-input::placeholder,
          .action-params-panel .ant-select-selection-placeholder {
            color: var(--text-3, #CBD5E1) !important;
            opacity: 0.7;
          }

          /* ===== 🚨 强制覆盖任何可能的白色背景 ===== */
          .action-params-panel input,
          .action-params-panel input[type="text"],
          .action-params-panel input[type="number"],
          .action-params-panel textarea {
            background-color: var(--bg-elevated, #1E293B) !important;
            background: var(--bg-elevated, #1E293B) !important;
            color: var(--text-1, #F8FAFC) !important;
          }

          /* ===== 防止全局样式污染的最后防线 ===== */
          .action-params-panel [style*="background: white"],
          .action-params-panel [style*="background: #fff"],
          .action-params-panel [style*="background: #ffffff"],
          .action-params-panel [style*="background-color: white"],
          .action-params-panel [style*="background-color: #fff"],
          .action-params-panel [style*="background-color: #ffffff"] {
            background: var(--bg-elevated, #1E293B) !important;
            background-color: var(--bg-elevated, #1E293B) !important;
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
          
          {/* 🔥 新增：高级执行配置 */}
          <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.1)' }} />
          
          <Collapse 
            ghost
            className="light-theme-force"
            style={{ background: 'transparent' }}
          >
            <Panel 
              header={
                <Text strong style={{ color: 'var(--text-1, #F8FAFC)' }}>
                  ⚙️ 高级执行配置
                </Text>
              } 
              key="advanced"
            >
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {/* 选择器优先 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: 'var(--text-2, #CBD5E1)' }}>选择器优先</Text>
                  <Switch 
                    size="small"
                    checked={commonConfig.useSelector} 
                    onChange={(v) => updateCommon({ useSelector: v })}
                  />
                </div>
                
                {/* 坐标兜底 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: 'var(--text-2, #CBD5E1)' }}>坐标兜底</Text>
                  <Switch 
                    size="small"
                    checked={commonConfig.allowAbsolute} 
                    onChange={(v) => updateCommon({ allowAbsolute: v })}
                  />
                </div>
                
                {/* 置信度阈值 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: 'var(--text-2, #CBD5E1)' }}>置信度阈值</Text>
                  <InputNumber 
                    size="small"
                    min={0.1} 
                    max={1} 
                    step={0.05} 
                    value={commonConfig.confidenceThreshold}
                    onChange={(v) => updateCommon({ confidenceThreshold: Number(v) || 0.8 })}
                    style={{ width: 80 }}
                  />
                </div>
                
                {/* 重试次数 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: 'var(--text-2, #CBD5E1)' }}>重试次数</Text>
                  <InputNumber 
                    size="small"
                    min={0} 
                    max={5} 
                    value={commonConfig.retries}
                    onChange={(v) => updateCommon({ retries: Number(v) || 1 })}
                    style={{ width: 60 }}
                  />
                </div>
                
                {/* 执行后验证 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: 'var(--text-2, #CBD5E1)' }}>执行后验证</Text>
                  <Switch 
                    size="small"
                    checked={commonConfig.verifyAfter} 
                    onChange={(v) => updateCommon({ verifyAfter: v })}
                  />
                </div>
              </Space>
            </Panel>
          </Collapse>
        </div>
      </Card>
    </>
  );
};

export default ActionParamsPanel;