// src/modules/adb/application/services/DeviceManagementService.ts
// module: adb | layer: application | role: app-service
// summary: 应用服务

// modules/adb/application/services | DeviceManagementService | 设备管理专门服务
// 负责设备的增删改查、连接断开和状态管理，从巨型AdbApplicationService中拆分出来

import { Device } from '../../domain/entities/Device';
import { DeviceManagerService } from '../../../../domain/adb/services/DeviceManagerService';
import { StoreOperations } from '../../../../application/services/common';

/**
 * 设备管理服务
 * 专门负责设备相关的业务逻辑
 */
export class DeviceManagementService {
  constructor(
    private deviceManager: DeviceManagerService
  ) {}

  /**
   * 刷新设备列表
   */
  async refreshDevices(): Promise<Device[]> {
    return await StoreOperations.withLoadingAndErrorHandling(async () => {
      const devices = await this.deviceManager.getDevices();
      StoreOperations.updateDevices(devices);
      
      console.log(`📱 [DeviceManagementService] 设备列表已刷新，发现 ${devices.length} 台设备`);
      return devices;
    }, '刷新设备列表');
  }

  /**
   * 连接设备
   */
  async connectDevice(address: string): Promise<void> {
    await StoreOperations.withLoadingAndErrorHandling(async () => {
      await this.deviceManager.connectToDevice(address);
      
      // 刷新设备列表
      await this.refreshDevices();
    }, `连接设备 ${address}`);
  }

  /**
   * 断开设备连接
   */
  async disconnectDevice(deviceId: string): Promise<void> {
    await StoreOperations.withLoadingAndErrorHandling(async () => {
      await this.deviceManager.disconnectDevice(deviceId);
      
      // 如果断开的是当前选中的设备，清除选择
      const store = StoreOperations.getStore();
      if (store.selectedDeviceId === deviceId) {
        StoreOperations.selectDevice(null);
      }
      
      // 刷新设备列表
      await this.refreshDevices();
    }, `断开设备 ${deviceId}`);
  }

  /**
   * 选择设备
   */
  selectDevice(deviceId: string | null): void {
    if (deviceId) {
      const store = StoreOperations.getStore();
      const device = store.devices.find(d => d.id === deviceId);
      if (!device) {
        throw new Error(`设备 ${deviceId} 不存在`);
      }
    }
    StoreOperations.selectDevice(deviceId);
  }

  /**
   * 获取设备详细信息
   */
  async getDeviceInfo(deviceId: string): Promise<Record<string, string> | null> {
    return await this.deviceManager.getDeviceInfo(deviceId);
  }

  /**
   * 检查设备是否在线
   */
  async isDeviceOnline(deviceId: string): Promise<boolean> {
    return await this.deviceManager.isDeviceOnline(deviceId);
  }

  /**
   * 连接到常见的模拟器端口
   */
  async connectToCommonEmulatorPorts(): Promise<Device[]> {
    return await this.deviceManager.connectToCommonEmulatorPorts();
  }
}