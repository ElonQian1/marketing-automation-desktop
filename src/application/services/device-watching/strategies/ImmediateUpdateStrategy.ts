/**
 * 立即更新策略
 * 
 * 不延迟，立即更新设备列表
 * 适用于调试或需要实时响应的场景
 */
import { Device } from '../../../../domain/adb';
import { IDeviceUpdateStrategy, StrategyConfig } from './IDeviceUpdateStrategy';

export class ImmediateUpdateStrategy implements IDeviceUpdateStrategy {
  readonly name = 'immediate';
  private readonly enableLogging: boolean;

  constructor(config: StrategyConfig = {}) {
    this.enableLogging = config.enableLogging ?? true;
  }

  handleDeviceChange(devices: Device[], onUpdate: (devices: Device[]) => void): void {
    this.log('⚡ 立即更新设备列表:', {
      deviceCount: devices.length,
      deviceIds: devices.map(d => d.id)
    });

    onUpdate(devices);
  }

  cleanup(): void {
    // 无需清理
  }

  reset(): void {
    // 无状态，无需重置
  }

  private log(message: string, data?: any): void {
    if (!this.enableLogging) return;

    if (data) {
      console.log(`[ImmediateStrategy] ${message}`, data);
    } else {
      console.log(`[ImmediateStrategy] ${message}`);
    }
  }
}
