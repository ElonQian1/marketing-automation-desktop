/**
 * 设备监听服务
 * 
 * 职责：
 * 1. 管理设备更新策略（防抖/立即/节流）
 * 2. 协调设备管理器和状态更新
 * 3. 提供统一的设备监听接口
 * 
 * 优势：
 * - 策略可配置（通过构造函数切换）
 * - 职责单一（只管设备监听逻辑）
 * - 易于测试（依赖注入）
 */
import { Device } from '../../../domain/adb';
import { DeviceManagerService } from '../../../domain/adb/services/DeviceManagerService';
import { IDeviceUpdateStrategy } from './strategies/IDeviceUpdateStrategy';
import { DebounceUpdateStrategy } from './strategies/DebounceUpdateStrategy';
import { ImmediateUpdateStrategy } from './strategies/ImmediateUpdateStrategy';
import { deviceWatchingLogger } from './logger/DeviceWatchingLogger';
import { getDeviceWatchingConfig } from './ProductionConfigManager';

export interface DeviceWatchingConfig {
  /**
   * 更新策略类型
   * - 'debounce': 防抖策略（默认，300ms/500ms延迟）
   * - 'immediate': 立即更新
   * - 'custom': 自定义策略
   */
  strategyType?: 'debounce' | 'immediate' | 'custom';
  
  /**
   * 自定义策略实例（当 strategyType='custom' 时使用）
   */
  customStrategy?: IDeviceUpdateStrategy;
  
  /**
   * 启用日志
   */
  enableLogging?: boolean;
}

export class DeviceWatchingService {
  private deviceManager: DeviceManagerService;
  private updateStrategy: IDeviceUpdateStrategy;
  private deviceWatcher: (() => void) | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(
    deviceManager: DeviceManagerService,
    config: DeviceWatchingConfig = {}
  ) {
    this.deviceManager = deviceManager;
    this.updateStrategy = this.createStrategy(config);
    
    // 应用生产配置
    const productionConfig = getDeviceWatchingConfig();
    deviceWatchingLogger.info('DeviceWatchingService 已初始化', {
      策略: config.strategyType || 'debounce',
      生产配置: productionConfig.enableDiagnostics
    }, 'DeviceWatchingService');
  }

  /**
   * 创建更新策略
   */
  private createStrategy(config: DeviceWatchingConfig): IDeviceUpdateStrategy {
    const { strategyType = 'debounce', customStrategy } = config;

    if (strategyType === 'custom' && customStrategy) {
      this.log('📐 使用自定义策略:', customStrategy.name);
      return customStrategy;
    }

    if (strategyType === 'immediate') {
      this.log('⚡ 使用立即更新策略');
      return new ImmediateUpdateStrategy();
    }

    // 默认使用防抖策略
    this.log('⏱️ 使用防抖策略 (300ms/500ms)');
    return new DebounceUpdateStrategy({
      debounceDelay: 300,
      emptyListDelay: 500
    });
  }

  /**
   * 开始监听设备变化
   */
  startWatching(onUpdate: (devices: Device[]) => void): void {
    if (this.deviceWatcher) {
      this.log('⚠️ 已有活跃的设备监听器，先停止再启动');
      this.stopWatching();
    }

    this.log('🔄 启动设备监听...');

    this.deviceWatcher = this.deviceManager.watchDeviceChanges((devices) => {
      this.log('📡 收到设备变化事件:', {
        deviceCount: devices.length,
        strategy: this.updateStrategy.name
      });

      // 委托给策略处理
      this.updateStrategy.handleDeviceChange(devices, onUpdate);
    });

    this.log('✅ 设备监听已启动，策略:', this.updateStrategy.name);

    // 启动健康检查机制
    this.startHealthCheck(onUpdate);
  }

  /**
   * 停止监听设备变化
   */
  stopWatching(): void {
    if (!this.deviceWatcher) {
      this.log('⚠️ 没有活跃的设备监听器');
      return;
    }

    this.log('🛑 停止设备监听...');

    // 停止健康检查
    this.stopHealthCheck();

    // 清理监听器
    this.deviceWatcher();
    this.deviceWatcher = null;

    // 清理策略资源
    this.updateStrategy.cleanup();

    this.log('✅ 设备监听已停止');
  }

  /**
   * 启动健康检查（每30秒检查一次监听器状态）
   */
  private startHealthCheck(onUpdate: (devices: Device[]) => void): void {
    this.stopHealthCheck(); // 确保之前的检查已停止

    this.healthCheckInterval = setInterval(async () => {
      try {
        // 检查是否仍在监听
        if (!this.isWatching()) {
          this.log('⚠️ 健康检查：监听器已失效，尝试重新启动...');
          this.startWatching(onUpdate);
          return;
        }

        // 检查底层 RealTimeDeviceTracker 的回调数量
        try {
          const { getGlobalDeviceTracker } = await import('../../../infrastructure/RealTimeDeviceTracker');
          const tracker = getGlobalDeviceTracker();
          const callbackCount = tracker.getCallbackCount();
          
          if (callbackCount === 0) {
            this.log('� 健康检查：检测到RealTimeDeviceTracker无回调监听器，强制重启监听链路...');
            
            // 强制重新建立整个监听链路
            if (this.deviceWatcher) {
              this.deviceWatcher();
              this.deviceWatcher = null;
            }
            
            // 重新启动监听器
            this.deviceWatcher = this.deviceManager.watchDeviceChanges((devices) => {
              this.log('📡 收到设备变化事件:', {
                deviceCount: devices.length,
                strategy: this.updateStrategy.name
              });

              // 委托给策略处理
              this.updateStrategy.handleDeviceChange(devices, onUpdate);
            });

            this.log('✅ 健康检查：监听链路已强制重启');
          } else {
            this.log('💓 健康检查：监听器正常，回调数量:', callbackCount);
          }
        } catch (importError) {
          this.log('⚠️ 健康检查：无法检查RealTimeDeviceTracker状态:', importError);
          
          // 降级：重新注册监听器
          if (this.deviceWatcher) {
            this.deviceWatcher();
            this.deviceWatcher = null;
          }
          
          this.deviceWatcher = this.deviceManager.watchDeviceChanges((devices) => {
            this.log('📡 收到设备变化事件:', {
              deviceCount: devices.length,
              strategy: this.updateStrategy.name
            });
            this.updateStrategy.handleDeviceChange(devices, onUpdate);
          });
          
          this.log('✅ 健康检查：已执行降级重启');
        }

        // 获取当前设备数量并记录
        const devices = await this.deviceManager.getDevices();
        this.log('💓 健康检查完成，当前设备数量:', devices.length);
        
      } catch (error) {
        this.log('❌ 健康检查失败:', error);
      }
    }, 30000); // 30秒检查一次

    this.log('💓 健康检查已启动');
  }

  /**
   * 停止健康检查
   */
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      this.log('💓 健康检查已停止');
    }
  }

  /**
   * 重置策略状态
   */
  resetStrategy(): void {
    this.log('🔄 重置策略状态:', this.updateStrategy.name);
    this.updateStrategy.reset();
  }

  /**
   * 切换更新策略
   */
  switchStrategy(newStrategy: IDeviceUpdateStrategy): void {
    const oldStrategyName = this.updateStrategy.name;
    
    this.log('🔀 切换策略:', {
      from: oldStrategyName,
      to: newStrategy.name
    });

    // 清理旧策略
    this.updateStrategy.cleanup();

    // 切换到新策略
    this.updateStrategy = newStrategy;

    this.log('✅ 策略已切换:', newStrategy.name);
  }

  /**
   * 获取当前策略名称
   */
  getCurrentStrategyName(): string {
    return this.updateStrategy.name;
  }

  /**
   * 检查是否正在监听
   */
  isWatching(): boolean {
    return this.deviceWatcher !== null;
  }

  private log(message: string, data?: any): void {
    deviceWatchingLogger.debug(message, data, 'DeviceWatchingService');
  }
}
