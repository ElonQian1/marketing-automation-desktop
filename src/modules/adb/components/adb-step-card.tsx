// src/modules/adb/components/adb-step-card.tsx
// module: adb | layer: ui | role: component  
// summary: ADB调试步骤卡片，专门处理设备调试相关的步骤展示

import React from 'react';
import { Space } from 'antd';
import { AndroidOutlined, WifiOutlined, UsbOutlined } from '@ant-design/icons';
import { UnifiedStepCard } from '../../universal-ui/components/unified-step-card';
import type { IntelligentStepCard } from '../../universal-ui/types/intelligent-analysis-types';

/**
 * ADB步骤卡片属性
 */
export interface AdbStepCardProps {
  /** 步骤数据 */
  stepCard: IntelligentStepCard;
  /** 步骤索引 */
  stepIndex: number;
  /** 关联的设备ID */
  deviceId?: string;
  /** 设备连接状态 */
  deviceStatus?: 'connected' | 'disconnected' | 'unauthorized' | 'unknown';
  /** 是否显示设备信息 */
  showDeviceInfo?: boolean;
  /** 设备名称 */
  deviceName?: string;
  /** 自定义类名 */
  className?: string;
  
  // ADB特有回调
  /** 连接设备 */
  onConnectDevice?: (deviceId: string) => void;
  /** 断开设备 */
  onDisconnectDevice?: (deviceId: string) => void;
  /** 重新授权 */
  onReauthorize?: (deviceId: string) => void;
  /** 查看设备详情 */
  onViewDeviceDetails?: (deviceId: string) => void;
  /** 执行ADB命令 */
  onExecuteAdbCommand?: (command: string) => void;
  
  // 智能分析回调
  /** 升级策略 */
  onUpgradeStrategy?: () => void;
  /** 重试分析 */
  onRetryAnalysis?: () => void;
  /** 切换策略 */
  onSwitchStrategy?: (strategyKey: string, followSmart: boolean) => void;
}

/**
 * 设备状态配置
 */
const DEVICE_STATUS_CONFIG = {
  connected: {
    label: '已连接',
    color: 'success',
    icon: <WifiOutlined />,
    badgeStatus: 'success' as const
  },
  disconnected: {
    label: '已断开',
    color: 'default',
    icon: <UsbOutlined />,
    badgeStatus: 'default' as const
  },
  unauthorized: {
    label: '未授权',
    color: 'warning',
    icon: <AndroidOutlined />,
    badgeStatus: 'warning' as const
  },
  unknown: {
    label: '未知',
    color: 'error',
    icon: <AndroidOutlined />,
    badgeStatus: 'error' as const
  }
} as const;

/**
 * ADB步骤卡片
 * 
 * 🎯 设计理念：
 * - 基于 UnifiedStepCard 扩展ADB调试功能
 * - 显示设备连接状态和调试信息
 * - 提供设备管理操作入口
 * - 遵循项目规范使用 useAdb() Hook（强制约束）
 */
export const AdbStepCard: React.FC<AdbStepCardProps> = ({
  stepCard,
  stepIndex,
  deviceId,
  deviceStatus = 'unknown',
  showDeviceInfo = true,
  deviceName,
  className = '',
  onConnectDevice,
  onDisconnectDevice,
  onReauthorize,
  onViewDeviceDetails,
  onExecuteAdbCommand,
  onUpgradeStrategy,
  onRetryAnalysis,
  onSwitchStrategy
}) => {
  
  const statusConfig = DEVICE_STATUS_CONFIG[deviceStatus];
  
  // 组合类名
  const combinedClassName = [
    'adb-step-card',
    `device-${deviceStatus}`,
    className
  ].filter(Boolean).join(' ');
  
  // 自定义标题

  
  return (
    <div className={combinedClassName}>
      <UnifiedStepCard
        stepCard={{
          ...stepCard,
          stepName: `${stepCard.stepName}${deviceId ? ` (${deviceName || deviceId.slice(-8)})` : ''}`
        }}
        stepIndex={stepIndex}
        className="adb-unified"
        onUpgradeStrategy={onUpgradeStrategy}
        onRetryAnalysis={onRetryAnalysis}
        onSwitchStrategy={onSwitchStrategy}
      />
      
      {/* ADB特有操作区 */}
      <div className="adb-actions">
        <div className="device-controls">
          <Space>
            {deviceStatus === 'disconnected' && onConnectDevice && deviceId && (
              <button 
                className="adb-btn connect-btn"
                onClick={() => onConnectDevice(deviceId)}
              >
                🔌 连接设备
              </button>
            )}
            {deviceStatus === 'connected' && onDisconnectDevice && deviceId && (
              <button 
                className="adb-btn disconnect-btn"
                onClick={() => onDisconnectDevice(deviceId)}
              >
                🔌 断开设备
              </button>
            )}
            {deviceStatus === 'unauthorized' && onReauthorize && deviceId && (
              <button 
                className="adb-btn auth-btn"
                onClick={() => onReauthorize(deviceId)}
              >
                🔑 重新授权
              </button>
            )}
            {onViewDeviceDetails && deviceId && (
              <button 
                className="adb-btn details-btn"
                onClick={() => onViewDeviceDetails(deviceId)}
              >
                📱 设备详情
              </button>
            )}
          </Space>
        </div>
        
        {/* ADB命令快捷操作 */}
        <div className="adb-commands">
          <Space>
            {onExecuteAdbCommand && (
              <>
                <button 
                  className="adb-btn cmd-btn"
                  onClick={() => onExecuteAdbCommand('adb shell dumpsys window displays')}
                  title="获取屏幕信息"
                >
                  📱 屏幕信息
                </button>
                <button 
                  className="adb-btn cmd-btn"
                  onClick={() => onExecuteAdbCommand('adb shell uiautomator dump')}
                  title="获取UI结构"
                >
                  🌲 UI结构
                </button>
                <button 
                  className="adb-btn cmd-btn"
                  onClick={() => onExecuteAdbCommand('adb shell input keyevent 3')}
                  title="返回桌面"
                >
                  🏠 桌面
                </button>
              </>
            )}
          </Space>
        </div>
      </div>
      
      <style>{`
        .adb-step-card {
          margin: 12px 0;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .device-connected {
          border-left: 4px solid #52c41a;
        }
        
        .device-disconnected {
          border-left: 4px solid #d9d9d9;
        }
        
        .device-unauthorized {
          border-left: 4px solid #faad14;
        }
        
        .device-unknown {
          border-left: 4px solid #ff4d4f;
        }
        
        .adb-actions {
          padding: 12px 16px;
          background: linear-gradient(135deg, #f0f2f5 0%, #e6f7ff 100%);
          border-top: 1px solid #e8e8e8;
        }
        
        .device-controls {
          margin-bottom: 8px;
        }
        
        .adb-commands {
          border-top: 1px dashed #d9d9d9;
          padding-top: 8px;
        }
        
        .adb-btn {
          background: white;
          border: 1px solid #d9d9d9;
          border-radius: 4px;
          padding: 6px 10px;
          cursor: pointer;
          font-size: 11px;
          transition: all 0.2s ease;
        }
        
        .adb-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .connect-btn:hover {
          border-color: #52c41a;
          color: #52c41a;
          background: linear-gradient(135deg, #f6ffed, #d9f7be);
        }
        
        .disconnect-btn:hover {
          border-color: #ff4d4f;
          color: #ff4d4f;
          background: linear-gradient(135deg, #fff2f0, #ffccc7);
        }
        
        .auth-btn:hover {
          border-color: #faad14;
          color: #faad14;
          background: linear-gradient(135deg, #fffbe6, #fff1b8);
        }
        
        .details-btn:hover, .cmd-btn:hover {
          border-color: #1890ff;
          color: #1890ff;
          background: linear-gradient(135deg, #e6f7ff, #bae7ff);
        }
      `}</style>
    </div>
  );
};

export default AdbStepCard;