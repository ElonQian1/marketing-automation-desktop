// src/modules/adb/application/services/ConnectionManagementService.ts
// module: adb | layer: application | role: app-service
// summary: 应用服务

// modules/adb/application/services | ConnectionManagementService | 连接管理专门服务
// 负责ADB服务器的启动停止、连接测试和状态检查，从巨型AdbApplicationService中拆分出来

import { AdbConnection, AdbConfig } from '../../domain/entities/AdbConnection';
import { ConnectionService } from '../../../../domain/adb/services/ConnectionService';
import { StoreOperations } from '../../../../application/services/common';

/**
 * 连接管理服务
 * 专门负责ADB连接相关的业务逻辑
 */
export class ConnectionManagementService {
  constructor(
    private connectionService: ConnectionService
  ) {}

  /**
   * 初始化ADB连接
   */
  async initializeConnection(config?: AdbConfig): Promise<AdbConnection> {
    const connection = await this.connectionService.initializeConnection(config);
    const store = StoreOperations.getStore();
    store.setConnection(connection);
    store.setConfig(config || AdbConfig.default());
    return connection;
  }

  /**
   * 测试ADB连接
   */
  async testConnection(): Promise<boolean> {
    try {
      return await this.connectionService.testConnection();
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * 启动ADB服务器
   */
  async startAdbServer(): Promise<void> {
    await StoreOperations.withLoadingAndErrorHandling(async () => {
      await this.connectionService.startServer();
      console.log('✅ [ConnectionManagementService] ADB服务器已启动');
    }, 'ADB服务器启动');
  }

  /**
   * 停止ADB服务器
   */
  async stopAdbServer(): Promise<void> {
    await StoreOperations.withLoadingAndErrorHandling(async () => {
      await this.connectionService.stopServer();
      console.log('🛑 [ConnectionManagementService] ADB服务器已停止');
    }, 'ADB服务器停止');
  }

  /**
   * 重启ADB服务器
   */
  async restartAdbServer(): Promise<void> {
    await StoreOperations.withLoadingAndErrorHandling(async () => {
      await this.connectionService.restartServer();
      console.log('🔄 [ConnectionManagementService] ADB服务器已重启');
    }, 'ADB服务器重启');
  }

  /**
   * 检查ADB服务器状态
   */
  async checkAdbServerStatus(): Promise<boolean> {
    try {
      return await this.connectionService.checkServerStatus();
    } catch (error) {
      console.error('检查ADB服务器状态失败:', error);
      return false;
    }
  }

  /**
   * 获取当前连接信息
   */
  getCurrentConnection(): AdbConnection | null {
    const store = StoreOperations.getStore();
    return store.connection;
  }

  /**
   * 清理ADB密钥
   */
  async clearAdbKeys(): Promise<void> {
    await this.connectionService.clearAdbKeys();
    console.log('🔑 [ConnectionManagementService] ADB密钥已清理');
  }

  /**
   * 无线调试配对
   */
  async pairWireless(hostPort: string, code: string): Promise<string> {
    return await this.connectionService.pairWireless(hostPort, code);
  }
}