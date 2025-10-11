// src/pages/app-launch-test/AppLaunchTestPageModular.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { theme } from 'antd';
import { useAdb } from '../../application/hooks/useAdb';
import { ControlPanelSection } from './components/ControlPanelSection';
import { LaunchResultSection } from './components/LaunchResultSection';
import { LaunchHistorySection } from './components/LaunchHistorySection';
import { FeatureDescriptionSection } from './components/FeatureDescriptionSection';
import type { 
  AppInfo, 
  AppLaunchResult 
} from './types/AppLaunchTestTypes';

/**
 * 应用启动检测测试页面 - 模块化版本
 * 用于测试和演示新的智能应用启动状态检测功能
 */
const AppLaunchTestPageModular: React.FC = () => {
  const { token } = theme.useToken();
  const { devices, refreshDevices } = useAdb(); // 使用统一的设备状态
  
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<AppLaunchResult | null>(null);
  const [launchHistory, setLaunchHistory] = useState<AppLaunchResult[]>([]);

  // 获取设备列表
  useEffect(() => {
    loadDevices();
  }, []);

  // 获取应用列表
  useEffect(() => {
    if (selectedDevice) {
      loadApps();
    }
  }, [selectedDevice]);

  const loadDevices = async () => {
    try {
      await refreshDevices(); // 使用统一的刷新方法
      if (devices.length > 0) {
        setSelectedDevice(devices[0].id);
      }
    } catch (error) {
      console.error('获取设备列表失败:', error);
    }
  };

  const loadApps = async () => {
    if (!selectedDevice) return;
    
    try {
      const result = await invoke<AppInfo[]>('get_device_apps', { 
        deviceId: selectedDevice 
      });
      
      // 过滤出常用应用并排序
      const filteredApps = result
        .filter(app => !app.is_system_app)
        .sort((a, b) => a.app_name.localeCompare(b.app_name));
      
      setApps(filteredApps);
      
      // 默认选择小红书
      const xhsApp = filteredApps.find(app => app.package_name === 'com.xingin.xhs');
      if (xhsApp) {
        setSelectedApp(xhsApp.package_name);
      }
    } catch (error) {
      console.error('获取应用列表失败:', error);
    }
  };

  const handleLaunchApp = async () => {
    if (!selectedDevice || !selectedApp) return;
    
    setIsLaunching(true);
    setLaunchResult(null);

    try {
      const result = await invoke<AppLaunchResult>('launch_device_app', {
        deviceId: selectedDevice,
        packageName: selectedApp
      });
      
      setLaunchResult(result);
      setLaunchHistory(prev => [result, ...prev.slice(0, 9)]); // 保留最近10次
    } catch (error) {
      console.error('启动应用失败:', error);
      setLaunchResult({
        success: false,
        message: `启动失败: ${error}`,
        package_name: selectedApp,
        launch_time_ms: 0,
        startup_issues: [String(error)]
      });
    } finally {
      setIsLaunching(false);
    }
  };

  const getStateColor = (state: string): string => {
    switch (state) {
      case 'Ready': return 'success';
      case 'Loading': return 'processing';
      case 'SplashScreen': return 'warning';
      case 'PermissionDialog': return 'warning';
      case 'LoginRequired': return 'warning';
      case 'NetworkCheck': return 'warning';
      case 'NotStarted': return 'default';
      default: return 'error';
    }
  };

  const getStateText = (state: string): string => {
    const stateMap: { [key: string]: string } = {
      'Ready': '就绪',
      'Loading': '加载中',
      'SplashScreen': '启动画面',
      'PermissionDialog': '权限弹窗',
      'LoginRequired': '需要登录',
      'NetworkCheck': '网络检查',
      'NotStarted': '未启动',
    };
    return stateMap[state] || state;
  };

  return (
    <div style={{ 
      padding: token.paddingLG, 
      maxWidth: '1200px', 
      margin: '0 auto' 
    }}>
      <div style={{ marginBottom: token.marginLG }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: token.fontWeightStrong, 
          color: token.colorText, 
          marginBottom: token.marginXS 
        }}>
          应用启动状态检测测试
        </h1>
        <p style={{ color: token.colorTextSecondary, margin: 0 }}>
          测试新的智能应用启动检测功能，确保应用真正就绪后再执行自动化操作
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
        gap: token.marginLG 
      }}>
        <ControlPanelSection
          devices={devices}
          selectedDevice={selectedDevice}
          setSelectedDevice={setSelectedDevice}
          apps={apps}
          selectedApp={selectedApp}
          setSelectedApp={setSelectedApp}
          isLaunching={isLaunching}
          onLaunchApp={handleLaunchApp}
          onRefreshDevices={loadDevices}
        />

        <LaunchResultSection
          isLaunching={isLaunching}
          launchResult={launchResult}
          getStateColor={getStateColor}
          getStateText={getStateText}
        />
      </div>

      <LaunchHistorySection
        launchHistory={launchHistory}
        apps={apps}
        getStateColor={getStateColor}
        getStateText={getStateText}
      />

      <FeatureDescriptionSection />
    </div>
  );
};

export default AppLaunchTestPageModular;