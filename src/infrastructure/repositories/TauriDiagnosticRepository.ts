// src/infrastructure/repositories/TauriDiagnosticRepository.ts
// module: shared | layer: infrastructure | role: 基础设施
// summary: DDD架构基础设施层实现

import { invoke, isTauri } from '@tauri-apps/api/core';
import { IDiagnosticRepository } from '../../domain/adb/repositories/IDiagnosticRepository';
import { 
  DiagnosticResult, 
  DiagnosticCategory, 
  DiagnosticStatus 
} from '../../domain/adb/entities/DiagnosticResult';

/**
 * 跟踪的设备信息（来自 plugin:adb|get_tracking_list）
 */
interface TrackedDevice {
  id: string;
  status: string;
  connection_type: string;
}

/**
 * Tauri诊断仓储实现
 * 通过Tauri接口执行诊断检查
 */
export class TauriDiagnosticRepository implements IDiagnosticRepository {

  async runAllDiagnostics(): Promise<DiagnosticResult[]> {
    const diagnostics: DiagnosticResult[] = [];

    if (!isTauri()) {
      console.warn('Not running in Tauri environment, returning empty diagnostics');
      return diagnostics;
    }

    try {
      // 并行执行所有诊断检查
      const [
        adbPathResult,
        adbServerResult,
        deviceScanResult,
        usbDebuggingResult,
        driversResult
      ] = await Promise.allSettled([
        this.checkAdbPath(),
        this.checkAdbServer(),
        this.scanDevices(),
        this.checkUsbDebugging(),
        this.checkDrivers()
      ]);

      // 收集结果
      if (adbPathResult.status === 'fulfilled') {
        diagnostics.push(adbPathResult.value);
      }
      if (adbServerResult.status === 'fulfilled') {
        diagnostics.push(adbServerResult.value);
      }
      if (deviceScanResult.status === 'fulfilled') {
        diagnostics.push(deviceScanResult.value);
      }
      if (usbDebuggingResult.status === 'fulfilled') {
        diagnostics.push(usbDebuggingResult.value);
      }
      if (driversResult.status === 'fulfilled') {
        diagnostics.push(driversResult.value);
      }

    } catch (error) {
      console.error('Failed to run diagnostics:', error);
      diagnostics.push(
        DiagnosticResult.error(
          'diagnostic-error',
          '诊断执行错误',
          '诊断过程中发生异常',
          error instanceof Error ? error.message : String(error)
        )
      );
    }

    return diagnostics;
  }

  async runDiagnosticsByCategory(category: DiagnosticCategory): Promise<DiagnosticResult[]> {
    switch (category) {
      case DiagnosticCategory.PATH_DETECTION:
        return [await this.checkAdbPath()];
      
      case DiagnosticCategory.SERVER_STATUS:
        return [await this.checkAdbServer()];
      
      case DiagnosticCategory.DEVICE_CONNECTION:
        return [await this.scanDevices()];
      
      case DiagnosticCategory.PERMISSIONS:
        return [await this.checkUsbDebugging()];
      
      default:
        return await this.runAllDiagnostics();
    }
  }

  async runSingleDiagnostic(diagnosticId: string): Promise<DiagnosticResult> {
    switch (diagnosticId) {
      case 'adb-path':
        return await this.checkAdbPath();
      
      case 'adb-server':
        return await this.checkAdbServer();
      
      case 'device-scan':
        return await this.scanDevices();
      
      case 'usb-debugging':
        return await this.checkUsbDebugging();
      
      case 'drivers':
        return await this.checkDrivers();
      
      default:
        throw new Error(`未知的诊断ID: ${diagnosticId}`);
    }
  }

  async checkAdbPath(): Promise<DiagnosticResult> {
    try {
      const adbPath = await invoke<string>('plugin:adb|detect_path');
      return DiagnosticResult.success(
        'adb-path',
        'ADB路径检测',
        `已检测到ADB路径: ${adbPath}`
      );
    } catch (error) {
      return DiagnosticResult.error(
        'adb-path',
        'ADB路径检测',
        'ADB路径检测失败',
        error instanceof Error ? error.message : String(error),
        '请检查ADB是否正确安装，或手动设置ADB路径',
        false
      );
    }
  }

  async checkAdbServer(): Promise<DiagnosticResult> {
    try {
      // 检查服务器状态
      const version = await invoke<string>('plugin:adb|version');
      
      return DiagnosticResult.success(
        'adb-server',
        'ADB服务器状态',
        `ADB服务器运行正常，版本: ${version}`
      );
    } catch (error) {
      return DiagnosticResult.error(
        'adb-server',
        'ADB服务器状态',
        'ADB服务器未运行或异常',
        error instanceof Error ? error.message : String(error),
        '尝试重启ADB服务器，或以管理员权限运行程序',
        true,
        async () => {
          try {
            await invoke('plugin:adb|kill_server_simple');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await invoke('plugin:adb|start_server_simple');
            return true;
          } catch {
            return false;
          }
        }
      );
    }
  }

  async scanDevices(): Promise<DiagnosticResult> {
    try {
      // 🔧 修复: 使用插件命令获取跟踪的设备列表
      // 旧命令 'get_adb_devices_safe' 已废弃，导致每次调用都失败
      const devices = await invoke<TrackedDevice[]>('plugin:adb|get_tracking_list');
      // 只计算在线设备（status === 'device'）
      const onlineDevices = devices.filter(d => d.status === 'device');
      
      if (onlineDevices.length > 0) {
        return DiagnosticResult.success(
          'device-scan',
          '设备扫描',
          `检测到 ${onlineDevices.length} 个在线设备: ${onlineDevices.map(d => d.id).join(', ')}`
        );
      } else if (devices.length > 0) {
        // 有设备但不在线（可能是 offline 或 authorizing 状态）
        const statusList = devices.map(d => `${d.id}(${d.status})`).join(', ');
        return DiagnosticResult.warning(
          'device-scan',
          '设备扫描',
          `检测到 ${devices.length} 个设备，但无在线: ${statusList}`,
          '请检查设备USB调试授权状态'
        );
      } else {
        return DiagnosticResult.warning(
          'device-scan',
          '设备扫描',
          '没有检测到连接的设备',
          '请确保设备已连接并启用USB调试，或启动Android模拟器'
        );
      }
    } catch (error) {
      return DiagnosticResult.error(
        'device-scan',
        '设备扫描',
        '设备扫描失败',
        error instanceof Error ? error.message : String(error),
        '检查ADB服务状态和设备连接'
      );
    }
  }

  async checkUsbDebugging(): Promise<DiagnosticResult> {
    try {
      // 🔧 修复: 使用插件命令获取跟踪的设备列表
      const devices = await invoke<TrackedDevice[]>('plugin:adb|get_tracking_list');
      // 未授权设备的 status 是 'unauthorized' 或 'authorizing'
      const unauthorizedDevices = devices.filter(d => 
        d.status === 'unauthorized' || d.status === 'authorizing'
      );
      
      if (unauthorizedDevices.length > 0) {
        return DiagnosticResult.warning(
          'usb-debugging',
          'USB调试权限',
          `检测到 ${unauthorizedDevices.length} 个未授权设备`,
          '请在设备上确认USB调试授权对话框'
        );
      } else {
        return DiagnosticResult.success(
          'usb-debugging',
          'USB调试权限',
          'USB调试权限正常'
        );
      }
    } catch (error) {
      return DiagnosticResult.error(
        'usb-debugging',
        'USB调试权限',
        'USB调试权限检查失败',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  async checkDrivers(): Promise<DiagnosticResult> {
    // 这是一个简化的驱动检查，实际实现可能需要更复杂的逻辑
    try {
      // 🔧 修复: 使用插件命令获取跟踪的设备列表
      // 尝试获取设备列表来间接检查驱动状态
      await invoke<TrackedDevice[]>('plugin:adb|get_tracking_list');
      
      return DiagnosticResult.success(
        'drivers',
        '设备驱动',
        '设备驱动状态正常'
      );
    } catch (error) {
      return DiagnosticResult.warning(
        'drivers',
        '设备驱动',
        '可能存在驱动问题',
        '如果设备无法正常连接，请尝试重新安装设备驱动程序'
      );
    }
  }

  async executeAutoFix(diagnosticId: string): Promise<boolean> {
    try {
      const diagnostic = await this.runSingleDiagnostic(diagnosticId);
      if (diagnostic.isAutoFixable()) {
        return await diagnostic.executeAutoFix();
      }
      return false;
    } catch (error) {
      console.error(`Auto fix failed for ${diagnosticId}:`, error);
      return false;
    }
  }

  async getFixSuggestions(diagnosticResult: DiagnosticResult): Promise<string[]> {
    const suggestions: string[] = [];
    
    if (diagnosticResult.suggestion) {
      suggestions.push(diagnosticResult.suggestion);
    }

    // 根据诊断ID提供额外建议
    switch (diagnosticResult.id) {
      case 'adb-path':
        suggestions.push(
          '检查Android SDK是否正确安装',
          '将ADB路径添加到系统环境变量',
          '使用完整的ADB可执行文件路径'
        );
        break;
      
      case 'adb-server':
        suggestions.push(
          '以管理员权限运行程序',
          '检查防火墙设置',
          '重启计算机'
        );
        break;
      
      case 'device-scan':
        suggestions.push(
          '检查USB连接线',
          '尝试不同的USB端口',
          '重启设备',
          '检查设备是否处于开发者模式'
        );
        break;
      
      case 'usb-debugging':
        suggestions.push(
          '在设备设置中启用开发者选项',
          '在开发者选项中启用USB调试',
          '撤销USB调试授权后重新授权'
        );
        break;
    }

    return suggestions;
  }
}

