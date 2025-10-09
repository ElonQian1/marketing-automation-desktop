/**
 * 设备状态管理Hook
 * 
 * 在精准获客模块中统一管理设备状态，避免重复代码
 */
import { useMemo } from 'react';
import type { Device } from '../../../../domain/adb/entities/Device';
import { shouldBypassDeviceCheck } from '../../../../config/developmentMode';

interface UseDeviceStatusReturn {
  hasDevices: boolean;
  selectedDevice: Device | null;
  showDeviceWarning: boolean;
  deviceCount: number;
  deviceStatus: 'connected' | 'disconnected' | 'bypassed';
}

export const useDeviceStatus = (
  onlineDevices: Device[],
  selectedDevice?: Device | null
): UseDeviceStatusReturn => {
  const bypass = shouldBypassDeviceCheck();
  
  return useMemo(() => {
    const hasDevices = onlineDevices.length > 0;
    const deviceCount = onlineDevices.length;
    const showDeviceWarning = !bypass && !hasDevices;
    
    let deviceStatus: 'connected' | 'disconnected' | 'bypassed';
    if (bypass) {
      deviceStatus = 'bypassed';
    } else if (hasDevices) {
      deviceStatus = 'connected';
    } else {
      deviceStatus = 'disconnected';
    }

    return {
      hasDevices,
      selectedDevice: selectedDevice || null,
      showDeviceWarning,
      deviceCount,
      deviceStatus
    };
  }, [onlineDevices, selectedDevice, bypass]);
};