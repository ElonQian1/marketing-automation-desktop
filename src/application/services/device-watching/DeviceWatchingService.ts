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
  private readonly enableLogging: boolean;

  constructor(
    deviceManager: DeviceManagerService,
    config: DeviceWatchingConfig = {}
  ) {
    this.deviceManager = deviceManager;
    this.enableLogging = config.enableLogging ?? true;
    this.updateStrategy = this.createStrategy(config);
  }

  /**
   * 创建更新策略
   */
  private createStrategy(config: DeviceWatchingConfig): IDeviceUpdateStrategy {
    const { strategyType = 'debounce', customStrategy, enableLogging } = config;

    if (strategyType === 'custom' && customStrategy) {
      this.log('📐 使用自定义策略:', customStrategy.name);
      return customStrategy;
    }

    if (strategyType === 'immediate') {
      this.log('⚡ 使用立即更新策略');
      return new ImmediateUpdateStrategy({ enableLogging });
    }

    // 默认使用防抖策略
    this.log('⏱️ 使用防抖策略 (300ms/500ms)');
    return new DebounceUpdateStrategy({
      debounceDelay: 300,
      emptyListDelay: 500,
      enableLogging
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

    // 清理监听器
    this.deviceWatcher();
    this.deviceWatcher = null;

    // 清理策略资源
    this.updateStrategy.cleanup();

    this.log('✅ 设备监听已停止');
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
    if (!this.enableLogging) return;

    if (data) {
      console.log(`[DeviceWatchingService] ${message}`, data);
    } else {
      console.log(`[DeviceWatchingService] ${message}`);
    }
  }
}
