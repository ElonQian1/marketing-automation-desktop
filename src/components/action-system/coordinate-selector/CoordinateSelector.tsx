// src/components/action-system/coordinate-selector/CoordinateSelector.tsx
// module: action-system | layer: ui | role: 坐标选择器组件
// summary: 智能滑动坐标配置模块

import React, { useState, useCallback } from 'react';
import { 
  InputNumber, 
  Space, 
  Typography, 
  Card, 
  Button, 
  Divider,
  Tooltip 
} from 'antd';
import { AimOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ActionParams } from '../../../types/action-types';

const { Text } = Typography;

export interface CoordinateConfig {
  start_x?: number;
  start_y?: number;
  end_x?: number;
  end_y?: number;
  use_custom_coordinates?: boolean;
}

export interface CoordinateSelectorProps {
  params: ActionParams & CoordinateConfig;
  onChange: (newParams: Partial<ActionParams & CoordinateConfig>) => void;
  size?: 'small' | 'middle' | 'large';
  title?: string;
  screenSize?: { width: number; height: number };
  direction?: 'up' | 'down' | 'left' | 'right';
}

/**
 * 🎯 坐标选择器组件
 * 
 * 功能特性：
 * - 自定义滑动起始和结束坐标
 * - 智能预设坐标位置
 * - 可视化坐标预览
 * - 坐标验证和边界检查
 */
export const CoordinateSelector: React.FC<CoordinateSelectorProps> = ({
  params,
  onChange,
  size = 'small',
  title = '滑动坐标配置',
  screenSize = { width: 1080, height: 1920 },
  direction = 'down'
}) => {
  const [isCustomMode, setIsCustomMode] = useState(params.use_custom_coordinates || false);

  // 计算默认坐标
  const getDefaultCoordinates = useCallback(() => {
    const { width, height } = screenSize;
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);
    const distance = params.distance || 600;
    const delta = Math.max(100, Math.min(distance, Math.floor(height * 0.8)));

    let start_x = cx, start_y = cy, end_x = cx, end_y = cy;
    
    switch (direction) {
      case 'up':
        start_y = cy - Math.floor(delta / 2);
        end_y = cy + Math.floor(delta / 2);
        break;
      case 'down':
        start_y = cy + Math.floor(delta / 2);
        end_y = cy - Math.floor(delta / 2);
        break;
      case 'left':
        start_x = cx - Math.floor(delta / 2);
        end_x = cx + Math.floor(delta / 2);
        break;
      case 'right':
        start_x = cx + Math.floor(delta / 2);
        end_x = cx - Math.floor(delta / 2);
        break;
      default:
        start_y = cy + Math.floor(delta / 2);
        end_y = cy - Math.floor(delta / 2);
    }

    return { start_x, start_y, end_x, end_y };
  }, [screenSize, direction, params.distance]);

  // 获取当前有效坐标
  const getCurrentCoordinates = useCallback(() => {
    if (isCustomMode && params.start_x !== undefined && params.start_y !== undefined) {
      return {
        start_x: params.start_x,
        start_y: params.start_y,
        end_x: params.end_x || params.start_x,
        end_y: params.end_y || params.start_y
      };
    }
    return getDefaultCoordinates();
  }, [isCustomMode, params, getDefaultCoordinates]);

  // 更新坐标参数
  const updateCoordinates = useCallback((newCoords: Partial<CoordinateConfig>) => {
    onChange({
      ...newCoords,
      use_custom_coordinates: isCustomMode
    });
  }, [onChange, isCustomMode]);

  // 切换自定义模式
  const toggleCustomMode = useCallback(() => {
    const newCustomMode = !isCustomMode;
    setIsCustomMode(newCustomMode);
    
    if (newCustomMode) {
      // 启用自定义模式：使用当前默认坐标作为起点
      const defaults = getDefaultCoordinates();
      updateCoordinates({
        ...defaults,
        use_custom_coordinates: true
      });
    } else {
      // 禁用自定义模式：清除自定义坐标
      updateCoordinates({
        start_x: undefined,
        start_y: undefined,
        end_x: undefined,
        end_y: undefined,
        use_custom_coordinates: false
      });
    }
  }, [isCustomMode, getDefaultCoordinates, updateCoordinates]);

  // 重置为默认坐标
  const resetToDefault = useCallback(() => {
    const defaults = getDefaultCoordinates();
    updateCoordinates(defaults);
  }, [getDefaultCoordinates, updateCoordinates]);

  // 预设坐标位置
  const applyPreset = useCallback((preset: 'center' | 'top' | 'bottom' | 'left' | 'right') => {
    const { width, height } = screenSize;
    const distance = params.distance || 600;
    
    let coordinates: CoordinateConfig;
    
    switch (preset) {
      case 'center':
        coordinates = getDefaultCoordinates();
        break;
      case 'top':
        coordinates = {
          start_x: Math.floor(width / 2),
          start_y: Math.floor(height * 0.2),
          end_x: Math.floor(width / 2),
          end_y: Math.floor(height * 0.2) + distance
        };
        break;
      case 'bottom':
        coordinates = {
          start_x: Math.floor(width / 2),
          start_y: Math.floor(height * 0.8),
          end_x: Math.floor(width / 2),
          end_y: Math.floor(height * 0.8) - distance
        };
        break;
      case 'left':
        coordinates = {
          start_x: Math.floor(width * 0.2),
          start_y: Math.floor(height / 2),
          end_x: Math.floor(width * 0.2) + distance,
          end_y: Math.floor(height / 2)
        };
        break;
      case 'right':
        coordinates = {
          start_x: Math.floor(width * 0.8),
          start_y: Math.floor(height / 2),
          end_x: Math.floor(width * 0.8) - distance,
          end_y: Math.floor(height / 2)
        };
        break;
    }
    
    updateCoordinates(coordinates);
  }, [screenSize, params.distance, getDefaultCoordinates, updateCoordinates]);

  const currentCoords = getCurrentCoordinates();

  return (
    <>
      {/* 🛡️ 坐标选择器样式隔离 - 强制深色主题基准线 */}
      <style>
        {`
          /* ===== 🛡️ 坐标选择器样式隔离基准线 ===== */
          .coordinate-selector-container {
            /* 重置基础样式，防止被外部影响 */
            all: unset !important;
            display: block !important;
            position: relative !important;
            box-sizing: border-box !important;
            
            /* 强制深色主题基准 */
            background-color: var(--bg-elevated, #1E293B) !important;
            color: var(--text-1, #F8FAFC) !important;
            border-radius: 8px !important;
            
            /* 防止全局样式污染 */
            font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif !important;
            font-size: 14px !important;
            line-height: 1.5 !important;
          }

          /* ===== 卡片容器强制深色样式 ===== */
          .coordinate-selector-container .ant-card,
          .coordinate-selector-container .ant-card-head,
          .coordinate-selector-container .ant-card-body {
            background-color: var(--bg-elevated, #1E293B) !important;
            background: var(--bg-elevated, #1E293B) !important;
            border-color: var(--border-primary, #334155) !important;
            color: var(--text-1, #F8FAFC) !important;
          }

          /* ===== 文本颜色强制控制 ===== */
          .coordinate-selector-container,
          .coordinate-selector-container *,
          .coordinate-selector-container .ant-typography,
          .coordinate-selector-container .ant-typography *,
          .coordinate-selector-container .ant-card-head-title,
          .coordinate-selector-container .ant-card-head-title *,
          .coordinate-selector-container .ant-space-item,
          .coordinate-selector-container .ant-space-item *,
          .coordinate-selector-container span,
          .coordinate-selector-container div {
            color: var(--text-1, #F8FAFC) !important;
          }

          /* ===== 🔧 按钮强制深色样式 - 解决白底白字问题 ===== */
          .coordinate-selector-container .ant-btn,
          .coordinate-selector-container .ant-btn *,
          .coordinate-selector-container .ant-btn-default,
          .coordinate-selector-container .ant-btn-primary,
          .coordinate-selector-container button,
          .coordinate-selector-container button * {
            background-color: var(--bg-elevated, #1E293B) !important;
            background: var(--bg-elevated, #1E293B) !important;
            border-color: var(--border-primary, #334155) !important;
            color: var(--text-1, #F8FAFC) !important;
            
            /* 防止被全局白色背景覆盖 */
            background-image: none !important;
          }

          /* ===== 按钮主题色状态 ===== */
          .coordinate-selector-container .ant-btn-primary {
            background-color: var(--brand, #4A5FD1) !important;
            background: var(--brand, #4A5FD1) !important;
            border-color: var(--brand, #4A5FD1) !important;
            color: #ffffff !important;
          }

          /* ===== 按钮交互状态 ===== */
          .coordinate-selector-container .ant-btn:hover,
          .coordinate-selector-container .ant-btn-default:hover,
          .coordinate-selector-container button:hover {
            background-color: var(--bg-secondary, #334155) !important;
            background: var(--bg-secondary, #334155) !important;
            border-color: var(--brand, #4A5FD1) !important;
            color: var(--text-1, #F8FAFC) !important;
          }

          .coordinate-selector-container .ant-btn-primary:hover {
            background-color: var(--brand-600, #5B73E8) !important;
            background: var(--brand-600, #5B73E8) !important;
            border-color: var(--brand-600, #5B73E8) !important;
            color: #ffffff !important;
          }

          /* ===== 输入框强制深色样式 ===== */
          .coordinate-selector-container .ant-input-number,
          .coordinate-selector-container .ant-input-number *,
          .coordinate-selector-container .ant-input-number-input,
          .coordinate-selector-container .ant-input-number .ant-input-number-input,
          .coordinate-selector-container .ant-input,
          .coordinate-selector-container .ant-input *,
          .coordinate-selector-container input,
          .coordinate-selector-container input[type="text"],
          .coordinate-selector-container input[type="number"] {
            background-color: var(--bg-elevated, #1E293B) !important;
            background: var(--bg-elevated, #1E293B) !important;
            border-color: var(--border-primary, #334155) !important;
            color: var(--text-1, #F8FAFC) !important;
            
            /* 防止被全局白色背景覆盖 */
            background-image: none !important;
          }

          /* ===== 输入框容器样式 ===== */
          .coordinate-selector-container .ant-input-number-wrapper,
          .coordinate-selector-container .ant-input-number-group-wrapper,
          .coordinate-selector-container .ant-input-number-group {
            background-color: transparent !important;
          }

          /* ===== 输入框前缀/后缀样式 ===== */
          .coordinate-selector-container .ant-input-number-group-addon,
          .coordinate-selector-container .ant-input-group-addon {
            background-color: var(--bg-secondary, #334155) !important;
            border-color: var(--border-primary, #334155) !important;
            color: var(--text-2, #E2E8F0) !important;
          }

          /* ===== 输入框交互状态 ===== */
          .coordinate-selector-container .ant-input-number:hover,
          .coordinate-selector-container .ant-input:hover {
            border-color: var(--brand, #4A5FD1) !important;
            background-color: var(--bg-elevated, #1E293B) !important;
          }

          .coordinate-selector-container .ant-input-number-focused,
          .coordinate-selector-container .ant-input-number:focus,
          .coordinate-selector-container .ant-input-number:focus-within,
          .coordinate-selector-container .ant-input:focus {
            border-color: var(--brand, #4A5FD1) !important;
            box-shadow: 0 0 0 2px rgba(74, 95, 209, 0.2) !important;
            background-color: var(--bg-elevated, #1E293B) !important;
            outline: none !important;
          }

          /* ===== 数字输入框控制按钮 ===== */
          .coordinate-selector-container .ant-input-number-handler-wrap {
            background-color: var(--bg-elevated, #1E293B) !important;
          }
          
          .coordinate-selector-container .ant-input-number-handler {
            color: var(--text-2, #E2E8F0) !important;
            border-color: var(--border-primary, #334155) !important;
          }
          
          .coordinate-selector-container .ant-input-number-handler:hover {
            color: var(--brand, #4A5FD1) !important;
          }

          /* ===== 信息显示区域样式 ===== */
          .coordinate-selector-container .coordinate-info-display {
            background-color: var(--bg-secondary, #334155) !important;
            background: var(--bg-secondary, #334155) !important;
            border-radius: 6px !important;
            color: var(--text-2, #E2E8F0) !important;
          }

          /* ===== 分割线样式 ===== */
          .coordinate-selector-container .ant-divider {
            border-color: var(--border-primary, #334155) !important;
          }

          /* ===== Tooltip 样式 ===== */
          .coordinate-selector-container .ant-tooltip-inner {
            background-color: var(--bg-base, #0F172A) !important;
            color: var(--text-1, #F8FAFC) !important;
          }

          /* ===== 占位符文字颜色 ===== */
          .coordinate-selector-container .ant-input::placeholder,
          .coordinate-selector-container .ant-input-number input::placeholder,
          .coordinate-selector-container input::placeholder {
            color: var(--text-3, #CBD5E1) !important;
            opacity: 0.7;
          }

          /* ===== 🚨 强制覆盖任何可能的白色背景 ===== */
          .coordinate-selector-container [style*="background: white"],
          .coordinate-selector-container [style*="background: #fff"],
          .coordinate-selector-container [style*="background: #ffffff"],
          .coordinate-selector-container [style*="background-color: white"],
          .coordinate-selector-container [style*="background-color: #fff"],
          .coordinate-selector-container [style*="background-color: #ffffff"] {
            background: var(--bg-elevated, #1E293B) !important;
            background-color: var(--bg-elevated, #1E293B) !important;
          }

          /* ===== 防止全局样式污染的最后防线 ===== */
          .coordinate-selector-container *[class*="ant-"] {
            background-color: var(--bg-elevated, #1E293B) !important;
            color: var(--text-1, #F8FAFC) !important;
          }

          /* ===== 确保所有文字都可见 ===== */
          .coordinate-selector-container .ant-typography-caption,
          .coordinate-selector-container .ant-typography,
          .coordinate-selector-container .coordinate-info-text {
            color: var(--text-1, #F8FAFC) !important;
          }
        `}
      </style>

      <div className="coordinate-selector-container">
        <Card 
          size="small" 
          title={
            <Space>
              <AimOutlined style={{ color: '#722ed1' }} />
              <span>{title}</span>
            </Space>
          }
          bodyStyle={{ padding: '12px' }}
        >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        
        {/* 模式切换 */}
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong style={{ fontSize: 13 }}>坐标模式</Text>
          <Button
            size="small"
            type={isCustomMode ? 'primary' : 'default'}
            onClick={toggleCustomMode}
            icon={<AimOutlined />}
          >
            {isCustomMode ? '自定义坐标' : '自动计算'}
          </Button>
        </Space>

        {/* 当前坐标显示 */}
        <div 
          className="coordinate-info-display"
          style={{ 
            padding: '8px 12px', 
            background: 'var(--bg-secondary, #334155)', 
            borderRadius: '6px',
            fontSize: '12px',
            color: 'var(--text-2, #E2E8F0)'
          }}
        >
          <Space direction="vertical" size={2}>
            <div>起始: ({currentCoords.start_x}, {currentCoords.start_y})</div>
            <div>结束: ({currentCoords.end_x}, {currentCoords.end_y})</div>
            <div>滑动距离: {Math.floor(Math.sqrt(
              Math.pow(currentCoords.end_x - currentCoords.start_x, 2) + 
              Math.pow(currentCoords.end_y - currentCoords.start_y, 2)
            ))}px</div>
          </Space>
        </div>

        {isCustomMode && (
          <>
            <Divider style={{ margin: '8px 0' }} />
            
            {/* 预设位置快捷按钮 */}
            <div>
              <Text strong style={{ fontSize: 13 }}>快捷预设</Text>
            </div>
            <Space wrap>
              <Button size="small" onClick={() => applyPreset('center')}>
                屏幕中心
              </Button>
              <Button size="small" onClick={() => applyPreset('top')}>
                顶部区域
              </Button>
              <Button size="small" onClick={() => applyPreset('bottom')}>
                底部区域
              </Button>
              <Button size="small" onClick={() => applyPreset('left')}>
                左侧区域
              </Button>
              <Button size="small" onClick={() => applyPreset('right')}>
                右侧区域
              </Button>
            </Space>

            <Divider style={{ margin: '8px 0' }} />

            {/* 起始坐标配置 */}
            <div>
              <Text strong style={{ fontSize: 13 }}>起始坐标</Text>
            </div>
            <Space>
              <Tooltip title="X坐标 (0-1080)">
                <InputNumber
                  size={size}
                  placeholder="X"
                  value={currentCoords.start_x}
                  min={0}
                  max={screenSize.width}
                  step={10}
                  onChange={(value) => updateCoordinates({ start_x: value || 0 })}
                  style={{ width: '80px' }}
                  addonBefore="X"
                />
              </Tooltip>
              <Tooltip title="Y坐标 (0-1920)">
                <InputNumber
                  size={size}
                  placeholder="Y"
                  value={currentCoords.start_y}
                  min={0}
                  max={screenSize.height}
                  step={10}
                  onChange={(value) => updateCoordinates({ start_y: value || 0 })}
                  style={{ width: '80px' }}
                  addonBefore="Y"
                />
              </Tooltip>
            </Space>

            {/* 结束坐标配置 */}
            <div>
              <Text strong style={{ fontSize: 13 }}>结束坐标</Text>
            </div>
            <Space>
              <Tooltip title="X坐标 (0-1080)">
                <InputNumber
                  size={size}
                  placeholder="X"
                  value={currentCoords.end_x}
                  min={0}
                  max={screenSize.width}
                  step={10}
                  onChange={(value) => updateCoordinates({ end_x: value || 0 })}
                  style={{ width: '80px' }}
                  addonBefore="X"
                />
              </Tooltip>
              <Tooltip title="Y坐标 (0-1920)">
                <InputNumber
                  size={size}
                  placeholder="Y"
                  value={currentCoords.end_y}
                  min={0}
                  max={screenSize.height}
                  step={10}
                  onChange={(value) => updateCoordinates({ end_y: value || 0 })}
                  style={{ width: '80px' }}
                  addonBefore="Y"
                />
              </Tooltip>
            </Space>

            {/* 重置按钮 */}
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={resetToDefault}
              >
                重置默认
              </Button>
            </Space>
          </>
        )}

        {/* 提示信息 */}
        <Text 
          type="secondary" 
          style={{ 
            fontSize: '11px', 
            lineHeight: '1.4',
            color: 'var(--text-3, #CBD5E1)'
          }}
        >
          {isCustomMode 
            ? '💡 自定义模式：可精确设置滑动起始和结束坐标' 
            : '🤖 自动模式：根据方向和距离自动计算最佳坐标'
          }
        </Text>
      </Space>
        </Card>
      </div>
    </>
  );
};

export default CoordinateSelector;