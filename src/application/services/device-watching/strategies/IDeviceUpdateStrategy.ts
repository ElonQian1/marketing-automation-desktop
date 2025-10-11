// src/application/services/device-watching/strategies/IDeviceUpdateStrategy.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 设备更新策略接口
 * 
 * 定义设备列表更新的策略模式
 */
import { Device } from '../../../../domain/adb';

export interface IDeviceUpdateStrategy {
  /**
   * 策略名称
   */
  readonly name: string;

  /**
   * 处理设备变化
   * @param devices 新的设备列表
   * @param onUpdate 更新回调函数
   */
  handleDeviceChange(devices: Device[], onUpdate: (devices: Device[]) => void): void;

  /**
   * 清理资源（如定时器）
   */
  cleanup(): void;

  /**
   * 重置策略状态
   */
  reset(): void;
}

/**
 * 策略配置
 */
export interface StrategyConfig {
  /**
   * 防抖延迟（毫秒）
   */
  debounceDelay?: number;

  /**
   * 空列表确认延迟（毫秒）
   */
  emptyListDelay?: number;

  /**
   * 是否启用日志
   */
  enableLogging?: boolean;
}
