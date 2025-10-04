import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { StoreOperations } from '../common/StoreOperations';
import { DiagnosticResult, DiagnosticCategory, DiagnosticStatus } from '../../../domain/adb';

// 后端事件载荷类型（与 Rust 后端保持同步的最小必要字段）
interface AdbCommandLog {
  command: string;
  args: string[];
  output: string;
  error?: string | null;
  exit_code?: number | null;
  duration_ms: number;
  timestamp: string;
  device_id?: string | null;
  session_id?: string | null;
}

interface BackendLogEntry {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  category: string;
  source: string;
  message: string;
  details?: string | null;
  device_id?: string | null;
  session_id: string;
}

/**
 * ADB 日志桥接服务
 * 
 * 专门负责日志桥接、事件监听、后端日志处理等功能
 * 从 AdbApplicationService 中提取，实现单一职责原则
 */
export class AdbLogBridgeService {
  private logUnlisteners: UnlistenFn[] = [];
  private logBridgeReady = false;

  /**
   * 设置日志桥接订阅
   */
  async setupLogBridgeSubscriptions(): Promise<void> {
    if (this.logBridgeReady) {
      console.log('📡 [AdbLogBridgeService] 日志桥接已就绪，跳过重复初始化');
      return;
    }

    try {
      console.log('📡 [AdbLogBridgeService] 开始设置日志桥接订阅...');

      // 1. 订阅 ADB 命令日志
      const adbCommandUnlisten = await listen<AdbCommandLog>('adb-command-log', (event) => {
        this.processAdbCommandLog(event.payload);
      });
      this.logUnlisteners.push(adbCommandUnlisten);

      // 2. 订阅后端通用日志
      const backendLogUnlisten = await listen<BackendLogEntry>('backend-log', (event) => {
        this.processBackendLogEntry(event.payload);
      });
      this.logUnlisteners.push(backendLogUnlisten);

      // 3. 订阅设备事件日志（如果需要）
      const deviceEventUnlisten = await listen<any>('device-event', (event) => {
        this.processDeviceEvent(event.payload);
      });
      this.logUnlisteners.push(deviceEventUnlisten);

      this.logBridgeReady = true;
      console.log('✅ [AdbLogBridgeService] 日志桥接订阅设置完成');

    } catch (error) {
      console.error('❌ [AdbLogBridgeService] 日志桥接设置失败:', error);
      throw error;
    }
  }

  /**
   * 处理 ADB 命令日志
   */
  private processAdbCommandLog(logEntry: AdbCommandLog): void {
    try {
      const store = StoreOperations.getStore();
      
      // 将 ADB 命令日志转换为诊断结果
      const diagnosticResult = this.convertAdbLogToDiagnostic(logEntry);
      
      // 添加到诊断结果列表
      const currentResults = store.diagnosticResults;
      store.setDiagnosticResults([...currentResults, diagnosticResult]);

      // 如果是错误，也设置到错误状态
      if (logEntry.error && logEntry.exit_code !== 0) {
        StoreOperations.setError(new Error(`ADB命令失败: ${logEntry.error}`));
      }

    } catch (error) {
      console.error('❌ [AdbLogBridgeService] 处理ADB命令日志失败:', error);
    }
  }

  /**
   * 处理后端日志条目
   */
  private processBackendLogEntry(logEntry: BackendLogEntry): void {
    try {
      const store = StoreOperations.getStore();
      
      // 将后端日志转换为诊断结果
      const diagnosticResult = this.convertBackendLogToDiagnostic(logEntry);
      
      // 只有警告和错误级别的日志才添加到诊断结果
      if (logEntry.level === 'WARN' || logEntry.level === 'ERROR') {
        const currentResults = store.diagnosticResults;
        store.setDiagnosticResults([...currentResults, diagnosticResult]);
      }

      // 错误级别的日志设置到错误状态
      if (logEntry.level === 'ERROR') {
        StoreOperations.setError(new Error(logEntry.message));
      }

    } catch (error) {
      console.error('❌ [AdbLogBridgeService] 处理后端日志失败:', error);
    }
  }

  /**
   * 处理设备事件
   */
  private processDeviceEvent(eventData: any): void {
    try {
      console.debug('📱 [AdbLogBridgeService] 收到设备事件:', eventData);
      
      // 这里可以根据设备事件类型进行相应处理
      // 例如设备连接、断开、状态变化等
      
    } catch (error) {
      console.error('❌ [AdbLogBridgeService] 处理设备事件失败:', error);
    }
  }

  /**
   * 将 ADB 命令日志转换为诊断结果
   */
  private convertAdbLogToDiagnostic(logEntry: AdbCommandLog): DiagnosticResult {
    const id = `adb-command-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const commandStr = `${logEntry.command} ${logEntry.args.join(' ')}`;
    
    if (logEntry.error || (logEntry.exit_code && logEntry.exit_code !== 0)) {
      return DiagnosticResult.error(
        id,
        'ADB命令执行',
        `命令失败: ${commandStr}`,
        logEntry.error || `退出码: ${logEntry.exit_code}`,
        '检查设备连接和ADB服务状态'
      );
    } else {
      return DiagnosticResult.success(
        id,
        'ADB命令执行',
        `命令成功: ${commandStr}`
      );
    }
  }

  /**
   * 将后端日志转换为诊断结果
   */
  private convertBackendLogToDiagnostic(logEntry: BackendLogEntry): DiagnosticResult {
    const id = `backend-log-${logEntry.id}`;
    
    let status: DiagnosticStatus;
    switch (logEntry.level) {
      case 'ERROR':
        status = DiagnosticStatus.ERROR;
        break;
      case 'WARN':
        status = DiagnosticStatus.WARNING;
        break;
      default:
        status = DiagnosticStatus.SUCCESS;
        break;
    }

    const category = this.mapLogCategoryToDiagnosticCategory(logEntry.category);

    return new DiagnosticResult(
      id,
      logEntry.source || '后端服务',
      status,
      logEntry.message,
      logEntry.details || undefined,
      undefined, // suggestion
      false, // canAutoFix
      undefined, // autoFixAction
      new Date(logEntry.timestamp),
      category,
      logEntry.source,
      logEntry.device_id || undefined,
      logEntry.session_id
    );
  }

  /**
   * 映射日志类别到诊断类别
   */
  private mapLogCategoryToDiagnosticCategory(category: string): DiagnosticCategory {
    switch (category.toLowerCase()) {
      case 'device':
      case 'adb':
        return DiagnosticCategory.DEVICE_CONNECTION;
      case 'connection':
      case 'network':
        return DiagnosticCategory.DEVICE_CONNECTION;
      case 'permission':
      case 'auth':
        return DiagnosticCategory.PERMISSIONS;
      case 'server':
      case 'service':
        return DiagnosticCategory.SERVER_STATUS;
      case 'path':
      case 'detection':
        return DiagnosticCategory.PATH_DETECTION;
      default:
        return DiagnosticCategory.GENERAL;
    }
  }

  /**
   * 检查日志桥接是否就绪
   */
  isLogBridgeReady(): boolean {
    return this.logBridgeReady;
  }

  /**
   * 获取活跃监听器数量
   */
  getActiveListenerCount(): number {
    return this.logUnlisteners.length;
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    console.log('🧹 [AdbLogBridgeService] 清理日志桥接资源...');

    // 清理所有事件监听器
    this.logUnlisteners.forEach(unlisten => {
      try {
        unlisten();
      } catch (e) {
        console.warn('清理日志监听器失败:', e);
      }
    });
    this.logUnlisteners = [];

    this.logBridgeReady = false;

    console.log('🧹 [AdbLogBridgeService] 日志桥接资源清理完成');
  }
}