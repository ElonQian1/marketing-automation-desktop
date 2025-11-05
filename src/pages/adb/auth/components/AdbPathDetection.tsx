// src/pages/adb/auth/components/AdbPathDetection.tsx
// module: adb | layer: ui | role: component
// summary: ADB路径检测和配置组件

import React, { useState, useCallback, useEffect } from 'react';
import { Space, Button, Input, Checkbox, Typography, Alert, Spin } from 'antd';
import { FolderOpenOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { StatusIndicator } from './StatusComponents';
import { AuthStatus, type AdbPathConfig } from '../types';
import { useAdb } from '../../../../application/hooks/useAdb';

type UseAdbReturn = ReturnType<typeof useAdb>;

const { Text, Paragraph } = Typography;

interface AdbPathDetectionProps {
  config: AdbPathConfig;
  onDetecting: (isDetecting: boolean) => void;
  onPathDetected: (path: string | null) => void;
  onCustomPathChange: (path: string, isCustom: boolean) => void;
  onPathValidChange: (isValid: boolean) => void;
  onNext: () => void;
  busy: boolean;
  adb: UseAdbReturn;
  log: (msg: string) => void;
  addError: (error: { code: string; message: string }) => void;
}

export const AdbPathDetection: React.FC<AdbPathDetectionProps> = ({
  config,
  onDetecting,
  onPathDetected,
  onCustomPathChange,
  onPathValidChange,
  onNext,
  busy,
  adb,
  log,
  addError,
}) => {
  const [customPathInput, setCustomPathInput] = useState(config.customPath || '');

  // 自动检测ADB路径
  const handleAutoDetect = useCallback(async () => {
    try {
      onDetecting(true);
      log('开始自动检测ADB路径...');
      
      const detectedPath = await adb.autoDetectAdbPath();
      
      if (detectedPath) {
        log(`检测到ADB路径: ${detectedPath}`);
        onPathDetected(detectedPath);
        onPathValidChange(true);
      } else {
        log('未检测到ADB路径，请手动配置');
        onPathDetected(null);
        onPathValidChange(false);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '检测失败';
      log(`ADB路径检测失败: ${errorMsg}`);
      addError({ code: 'ADB_PATH_DETECTION_FAILED', message: errorMsg });
      onPathDetected(null);
      onPathValidChange(false);
    } finally {
      onDetecting(false);
    }
  }, [adb, onDetecting, onPathDetected, onPathValidChange, log, addError]);

  // 验证自定义路径
  const validateCustomPath = useCallback(async (path: string) => {
    if (!path.trim()) {
      onPathValidChange(false);
      return;
    }

    try {
      log(`验证ADB路径: ${path}`);
      // 这里可以添加路径验证逻辑
      // 暂时简单检查是否包含adb
      const isValid = path.toLowerCase().includes('adb') || path.endsWith('adb.exe');
      onPathValidChange(isValid);
      
      if (isValid) {
        log(`路径验证成功: ${path}`);
      } else {
        log(`路径验证失败: ${path}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '路径验证失败';
      log(`路径验证错误: ${errorMsg}`);
      onPathValidChange(false);
    }
  }, [onPathValidChange, log]);

  // 处理自定义路径输入
  const handleCustomPathChange = useCallback((value: string) => {
    setCustomPathInput(value);
    onCustomPathChange(value, true);
    validateCustomPath(value);
  }, [onCustomPathChange, validateCustomPath]);

  // 切换自定义路径模式
  const handleToggleCustomPath = useCallback((checked: boolean) => {
    onCustomPathChange(customPathInput, checked);
    if (checked) {
      validateCustomPath(customPathInput);
    } else {
      onPathValidChange(!!config.detectedPath);
    }
  }, [config.detectedPath, customPathInput, onCustomPathChange, onPathValidChange, validateCustomPath]);

  // 组件挂载时自动检测 - 只在组件首次挂载时执行
  useEffect(() => {
    if (!config.detectedPath && !config.isDetecting) {
      handleAutoDetect();
    }
    // 使用空依赖数组，只在组件挂载时执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusAndTitle = () => {
    if (config.isDetecting) {
      return { status: AuthStatus.IN_PROGRESS, title: '正在检测ADB路径...' };
    }
    
    const currentPath = config.isCustomPath ? config.customPath : config.detectedPath;
    const isValid = config.isPathValid;
    
    if (currentPath && isValid) {
      return { status: AuthStatus.SUCCESS, title: 'ADB路径配置完成' };
    } else if (currentPath && !isValid) {
      return { status: AuthStatus.ERROR, title: 'ADB路径无效' };
    } else {
      return { status: AuthStatus.IDLE, title: '请配置ADB路径' };
    }
  };

  const { status, title } = getStatusAndTitle();
  const currentPath = config.isCustomPath ? config.customPath : config.detectedPath;
  const canProceed = config.isPathValid && !config.isDetecting;

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <StatusIndicator
        status={status}
        title={title}
        description="ADB是Android调试工具，需要正确配置路径才能连接设备"
      />
      
      {/* 检测状态显示 */}
      {config.isDetecting && (
        <Alert
          message="正在检测ADB路径"
          description={
            <Space>
              <Spin size="small" />
              <Text>正在扫描常用安装路径...</Text>
            </Space>
          }
          type="info"
          showIcon
        />
      )}
      
      {/* 检测结果显示 */}
      {config.detectedPath && !config.isCustomPath && (
        <Alert
          message="自动检测成功"
          description={
            <Space direction="vertical">
              <Text strong>检测到的ADB路径:</Text>
              <Text code copyable>{config.detectedPath}</Text>
            </Space>
          }
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
        />
      )}
      
      {/* 自定义路径选项 */}
      <Space direction="vertical" style={{ width: '100%' }}>
        <Checkbox
          checked={config.isCustomPath}
          onChange={(e) => handleToggleCustomPath(e.target.checked)}
        >
          使用自定义ADB路径
        </Checkbox>
        
        {config.isCustomPath && (
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="请输入ADB可执行文件的完整路径"
              value={customPathInput}
              onChange={(e) => handleCustomPathChange(e.target.value)}
              status={config.isPathValid ? '' : 'error'}
              addonBefore={<FolderOpenOutlined />}
            />
          </Space.Compact>
        )}
        
        {config.isCustomPath && customPathInput && (
          <Alert
            message={config.isPathValid ? '路径格式正确' : '路径格式错误'}
            description={config.isPathValid ? '路径验证通过，可以继续下一步' : '请确保路径指向有效的ADB可执行文件'}
            type={config.isPathValid ? 'success' : 'error'}
            showIcon
          />
        )}
      </Space>
      
      {/* 当前使用的路径 */}
      {currentPath && (
        <div>
          <Text strong>当前ADB路径: </Text>
          <Text code>{currentPath}</Text>
          {config.isPathValid && <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />}
          {!config.isPathValid && <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginLeft: 8 }} />}
        </div>
      )}
      
      {/* 说明信息 */}
      <Alert
        message="提示"
        description={
          <Space direction="vertical">
            <Text>• ADB通常位于Android SDK的platform-tools目录下</Text>
            <Text>• 常见路径：C:\Users\[用户名]\AppData\Local\Android\Sdk\platform-tools\adb.exe</Text>
            <Text>• 如果未安装Android SDK，建议安装Android Studio获取完整工具链</Text>
          </Space>
        }
        type="info"
        showIcon
      />
      
      {/* 操作按钮 */}
      <Space>
        <Button
          onClick={handleAutoDetect}
          loading={config.isDetecting}
          disabled={busy}
        >
          重新检测
        </Button>
        <Button
          type="primary"
          onClick={onNext}
          disabled={!canProceed}
          loading={busy}
        >
          下一步
        </Button>
      </Space>
    </Space>
  );
};