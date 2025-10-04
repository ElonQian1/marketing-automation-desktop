/**
 * 设备监听模块导出
 */
export { DeviceWatchingService } from './DeviceWatchingService';
export type { DeviceWatchingConfig } from './DeviceWatchingService';

export type { IDeviceUpdateStrategy, StrategyConfig } from './strategies/IDeviceUpdateStrategy';
export { DebounceUpdateStrategy } from './strategies/DebounceUpdateStrategy';
export { ImmediateUpdateStrategy } from './strategies/ImmediateUpdateStrategy';
