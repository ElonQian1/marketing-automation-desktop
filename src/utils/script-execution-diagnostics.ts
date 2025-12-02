// src/utils/script-execution-diagnostics.ts
// module: utils | layer: utils | role: utility
// summary: 脚本执行诊断工具

import { invoke } from "@tauri-apps/api/core";

export interface DiagnosticResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export class ScriptExecutionDiagnostics {
  
  /**
   * 运行完整的诊断检查
   */
  static async runFullDiagnostics(deviceId: string): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    
    // 1. 检查设备连接
    try {
      const devices = await invoke("get_adb_devices_safe") as string[];
      const isDeviceConnected = devices.includes(deviceId);
      
      if (!isDeviceConnected) {
        results.push({
          check: "设备连接",
          status: "fail", 
          message: `设备 ${deviceId} 未找到`,
          details: devices
        });
      } else {
        results.push({
          check: "设备连接",
          status: "pass",
          message: "设备连接正常"
        });
      }
    } catch (error) {
      results.push({
        check: "设备连接", 
        status: "fail",
        message: `无法检查设备: ${error}`
      });
    }
    
    // 2. 检查ADB路径
    try {
      const adbPath = await invoke("plugin:system_diagnostic|get_adb_path") as string;
      results.push({
        check: "ADB路径",
        status: "pass", 
        message: `ADB路径: ${adbPath}`
      });
    } catch (error) {
      results.push({
        check: "ADB路径",
        status: "fail",
        message: `无法获取ADB路径: ${error}`
      });
    }
    
    // 3. 检查环境变量
    try {
      const envInfo = await invoke("plugin:system_diagnostic|get_env_info") as any;
      if (envInfo.USE_NEW_BACKEND === "1") {
        results.push({
          check: "执行引擎",
          status: "warning",
          message: "使用V2后端引擎（可能有问题）",
          details: envInfo
        });
      } else {
        results.push({
          check: "执行引擎", 
          status: "pass",
          message: "使用稳定的V1引擎"
        });
      }
    } catch (error) {
      results.push({
        check: "环境变量",
        status: "warning",
        message: `无法检查环境: ${error}`
      });
    }
    
    // 4. 测试设备响应
    try {
      const testResult = await invoke("plugin:system_diagnostic|test_device", {
        deviceId: deviceId
      }) as any;
      
      if (testResult.success) {
        results.push({
          check: "设备响应",
          status: "pass",
          message: "设备响应正常"
        });
      } else {
        results.push({
          check: "设备响应",
          status: "fail", 
          message: `设备响应异常: ${testResult.message}`,
          details: testResult
        });
      }
    } catch (error) {
      results.push({
        check: "设备响应",
        status: "warning",
        message: `无法测试设备响应: ${error}`
      });
    }
    
    return results;
  }
  
  /**
   * 显示诊断报告
   */
  static displayDiagnostics(results: DiagnosticResult[]): void {
    console.log("🔍 脚本执行诊断报告:");
    console.log("━".repeat(50));
    
    results.forEach((result, index) => {
      const icon = result.status === 'pass' ? '✅' : 
                   result.status === 'fail' ? '❌' : '⚠️';
      
      console.log(`${icon} ${index + 1}. ${result.check}: ${result.message}`);
      
      if (result.details) {
        console.log(`   详情:`, result.details);
      }
    });
    
    console.log("━".repeat(50));
    
    const failCount = results.filter(r => r.status === 'fail').length;
    const warnCount = results.filter(r => r.status === 'warning').length;
    
    if (failCount > 0) {
      console.log(`❌ 发现 ${failCount} 个严重问题`);
    }
    if (warnCount > 0) {
      console.log(`⚠️ 发现 ${warnCount} 个警告`);
    }
    if (failCount === 0 && warnCount === 0) {
      console.log("✅ 所有检查通过");
    }
  }
}

// 添加到window对象，方便调试
declare global {
  interface Window {
    __runScriptDiagnostics: (deviceId: string) => Promise<void>;
  }
}

if (typeof window !== 'undefined') {
  window.__runScriptDiagnostics = async (deviceId: string) => {
    const results = await ScriptExecutionDiagnostics.runFullDiagnostics(deviceId);
    ScriptExecutionDiagnostics.displayDiagnostics(results);
  };
}