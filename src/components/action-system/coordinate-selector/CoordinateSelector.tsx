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
import styles from './CoordinateSelector.module.css';

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
    <div className={styles.coordinateSelector}>
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
          <Text strong className={styles.coordinateInfoText}>坐标模式</Text>
          <Button
            size="small"
            type={isCustomMode ? 'primary' : 'default'}
            onClick={toggleCustomMode}
            icon={<AimOutlined />}
            className={isCustomMode ? styles.activeButton : styles.defaultButton}
          >
            {isCustomMode ? '自定义坐标' : '自动计算'}
          </Button>
        </Space>

        {/* 当前坐标显示 */}
        <div className={styles.coordinateInfo}>
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
              <Text strong className={styles.coordinateInfoText}>快捷预设</Text>
            </div>
            <Space wrap>
              <Button 
                size="small" 
                onClick={() => applyPreset('center')}
                className={styles.defaultButton}
              >
                屏幕中心
              </Button>
              <Button 
                size="small" 
                onClick={() => applyPreset('top')}
                className={styles.defaultButton}
              >
                顶部区域
              </Button>
              <Button 
                size="small" 
                onClick={() => applyPreset('bottom')}
                className={styles.defaultButton}
              >
                底部区域
              </Button>
              <Button 
                size="small" 
                onClick={() => applyPreset('left')}
                className={styles.defaultButton}
              >
                左侧区域
              </Button>
              <Button 
                size="small" 
                onClick={() => applyPreset('right')}
                className={styles.defaultButton}
              >
                右侧区域
              </Button>
            </Space>

            <Divider style={{ margin: '8px 0' }} />

            {/* 起始坐标配置 */}
            <div>
              <Text strong className={styles.coordinateInfoText}>起始坐标</Text>
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
                  className={styles.coordinateInput}
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
                  className={styles.coordinateInput}
                />
              </Tooltip>
            </Space>

            {/* 结束坐标配置 */}
            <div>
              <Text strong className={styles.coordinateInfoText}>结束坐标</Text>
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
                  className={styles.coordinateInput}
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
                  className={styles.coordinateInput}
                />
              </Tooltip>
            </Space>

            {/* 重置按钮 */}
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={resetToDefault}
                className={styles.defaultButton}
              >
                重置默认
              </Button>
            </Space>
          </>
        )}

        {/* 提示信息 */}
        <Text 
          type="secondary" 
          className={styles.coordinateInfoText}
        >
          {isCustomMode 
            ? '💡 自定义模式：可精确设置滑动起始和结束坐标' 
            : '🤖 自动模式：根据方向和距离自动计算最佳坐标'
          }
        </Text>
      </Space>
        </Card>
      </div>
  );
};

export default CoordinateSelector;