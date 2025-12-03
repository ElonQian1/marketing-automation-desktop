// src/application/services/device-watching/strategies/DebounceUpdateStrategy.ts
// module: application | layer: application | role: app-service
// summary: 应用服务

/**
 * 防抖动更新策略
 * 
 * 延迟更新设备列表，避免频繁刷新
 * - 有设备时：300ms 延迟
 * - 空列表时：500ms 确认延迟（避免误判）
 */
import { Device } from '../../../../domain/adb';
import { IDeviceUpdateStrategy, StrategyConfig } from './IDeviceUpdateStrategy';

export class DebounceUpdateStrategy implements IDeviceUpdateStrategy {
  readonly name = 'debounce';

  private debounceTimer: NodeJS.Timeout | null = null;
  private lastDeviceCount: number = 0;
  private readonly debounceDelay: number;
  private readonly emptyListDelay: number;
  private readonly enableLogging: boolean;
  // 保护：记录最近一次“非空设备列表”的快照与时间，防止短时间内的空列表抖动误清空
  private latestDevicesSnapshot: Device[] = [];
  private lastNonEmptyDevicesSnapshot: Device[] = [];
  private lastNonEmptyAt: number = 0;

  constructor(config: StrategyConfig = {}) {
    this.debounceDelay = config.debounceDelay ?? 300;
    this.emptyListDelay = config.emptyListDelay ?? 500;
    this.enableLogging = config.enableLogging ?? true;
  }

  handleDeviceChange(devices: Device[], onUpdate: (devices: Device[]) => void): void {
    // 只在设备数量变化时打印日志
    if (devices.length !== this.lastDeviceCount) {
      this.log('📱 设备数量变化:', { from: this.lastDeviceCount, to: devices.length });
    }

    // 清除之前的定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // 记录最新一次收到的设备列表
    this.latestDevicesSnapshot = devices;
    if (devices.length > 0) {
      // 记录最近一次“非空列表”与时间戳，用于抵御短时间内的空列表抖动
      this.lastNonEmptyDevicesSnapshot = devices;
      this.lastNonEmptyAt = Date.now();
    }

    // 非空：立即更新（同步调用），保证"重要情况即时刷新"，且避免微任务顺序导致的丢更新
    if (devices.length > 0) {
      const toApply = devices;
      this.lastDeviceCount = toApply.length;
      onUpdate(toApply);
      return;
    }

    // 空列表需要额外确认（防抖保护）
    if (devices.length === 0 && this.lastDeviceCount > 0) {
      this.log('⚠️ 收到空设备列表，等待后续事件确认...', {
        delay: `${this.emptyListDelay}ms`
      });

      this.debounceTimer = setTimeout(() => {
        // 保护：在确认窗口内若曾出现过非空事件，则优先采用最近非空结果，避免被瞬时抖动清空
        const now = Date.now();
        let toApply = this.latestDevicesSnapshot;
        if (
          toApply.length === 0 &&
          this.lastNonEmptyDevicesSnapshot.length > 0 &&
          now - this.lastNonEmptyAt < this.emptyListDelay
        ) {
          this.log('�️ 忽略短时间内的空列表抖动，沿用最近的非空列表');
          toApply = this.lastNonEmptyDevicesSnapshot;
        } else {
          this.log('�🔍 防抖动超时，确认设备列表为空');
        }

        onUpdate(toApply);
        this.lastDeviceCount = toApply.length;
      }, this.emptyListDelay);
      return;
    }

    // 兜底：若既非“非空立即”也非“空列表确认”，按常规延迟提交（此分支理论上很少触达）
    this.debounceTimer = setTimeout(() => {
      const toApply = this.latestDevicesSnapshot;
      const oldCount = this.lastDeviceCount;
      this.lastDeviceCount = toApply.length;
      this.log('✅ 已更新设备列表(兜底):', { oldCount, newCount: toApply.length });
      onUpdate(toApply);
    }, this.debounceDelay);
  }

  cleanup(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  reset(): void {
    this.cleanup();
    this.lastDeviceCount = 0;
    this.log('🔄 策略状态已重置');
  }

  private log(message: string, data?: any): void {
    if (!this.enableLogging) return;

    if (data) {
      console.log(`[DebounceStrategy] ${message}`, data);
    } else {
      console.log(`[DebounceStrategy] ${message}`);
    }
  }
}
