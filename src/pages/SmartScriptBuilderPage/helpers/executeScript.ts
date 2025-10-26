// src/pages/SmartScriptBuilderPage/helpers/executeScript.ts
// module: ui | layer: ui | role: page
// summary: 页面组件

import { invoke } from "@tauri-apps/api/core";
import { message } from "antd";
import { normalizeScriptStepsForBackend } from "../helpers/normalizeSteps";
import type { ExtendedSmartScriptStep } from "../../../types/loopScript";
import { ScriptExecutionDiagnostics } from "../../../utils/script-execution-diagnostics";

// 轻量设备类型，满足本模块使用
interface SimpleDevice {
  id: string;
  name?: string;
  status?: unknown;
}

// 与页面中定义的类型保持形状一致（本地复制，避免循环依赖）
interface SmartExecutionResult {
  success: boolean;
  total_steps: number;
  executed_steps: number;
  failed_steps: number;
  skipped_steps: number;
  duration_ms: number;
  logs: any[];
  final_page_state?: string;
  extracted_data: Record<string, any>;
  message: string;
}

type Ctx = {
  getSteps: () => ExtendedSmartScriptStep[];
  getDevices: () => SimpleDevice[];
  getCurrentDeviceId: () => string;
  getExecutorConfig: () => {
    auto_verification_enabled: boolean;
    smart_recovery_enabled: boolean;
    detailed_logging: boolean;
  };
  setExecutionResult: (r: SmartExecutionResult) => void;
  setIsExecuting: (v: boolean) => void;
};

export function createHandleExecuteScript(ctx: Ctx) {
  return async function handleExecuteScript() {
    console.log("� [旧版执行器] 开始执行智能脚本...");
    console.log("🔴 [旧版执行器] 这是 SmartScriptBuilderPage.tsx 的执行函数");

    const allSteps = ctx.getSteps();
    if (allSteps.length === 0) {
      message.warning("请先添加脚本步骤");
      return;
    }

    const expandedSteps = normalizeScriptStepsForBackend(allSteps);
    if (expandedSteps.length === 0) {
      message.warning("没有启用的步骤可执行");
      return;
    }

  console.log("📋 展开后的步骤数量:", expandedSteps.length);
  console.log("📝 展开后的步骤详情:", expandedSteps);

    // 获取当前选中的设备
    const devices = ctx.getDevices();
    const currentDeviceId = ctx.getCurrentDeviceId();
    console.log("📱 [旧版执行器] 可用设备列表:", devices);
    console.log("📱 [旧版执行器] 设备详细信息:", devices.map(d => ({
      id: d.id,
      name: d.name,
      status: d.status,
      isOnline: (d as any).isOnline ? (d as any).isOnline() : 'method not available'
    })));
    console.log("📱 [旧版执行器] 当前设备ID:", currentDeviceId);
    
    if (!currentDeviceId && devices.length === 0) {
      message.error("没有可用的设备，请先连接设备");
      return;
    }
    
    const selectedDevice = currentDeviceId || 
      devices.find((d) => d.status === "online")?.id || 
      devices.find((d) => (d as any).isOnline && (d as any).isOnline())?.id ||
      devices[0]?.id || 
      "ABJK022823000280"; // 使用你的实际设备ID作为默认值
    
    console.log("📱 [旧版执行器] 最终选中的设备:", selectedDevice);
    console.log("📱 [旧版执行器] 设备选择逻辑:", {
      hasCurrentDeviceId: !!currentDeviceId,
      onlineDevice: devices.find((d) => d.status === "online"),
      firstDevice: devices[0],
      fallbackDevice: "ABJK022823000280"
    });
    
    if (!selectedDevice) {
      message.error("无法确定目标设备，请检查设备连接");
      return;
    }

    const executorConfig = ctx.getExecutorConfig();
    console.log("🔧 执行配置:", executorConfig);

    // 显示开始执行的消息
    const hideStartMessage = message.loading('开始执行智能脚本...', 0);
    
    // 🔍 执行诊断检查
    console.log("🔍 [旧版执行器] 开始执行诊断检查...");
    try {
      const diagnostics = await ScriptExecutionDiagnostics.runFullDiagnostics(selectedDevice);
      ScriptExecutionDiagnostics.displayDiagnostics(diagnostics);
      
      // 检查是否有严重问题
      const hasFailures = diagnostics.some(d => d.status === 'fail');
      if (hasFailures) {
        hideStartMessage();
        const failureMessages = diagnostics
          .filter(d => d.status === 'fail')
          .map(d => `${d.check}: ${d.message}`)
          .join('; ');
        message.error(`❌ 诊断发现问题: ${failureMessages}`, 10);
        return;
      }
    } catch (diagError) {
      console.warn("⚠️ [旧版执行器] 诊断检查失败:", diagError);
      // 继续执行，但记录警告
    }
    
    ctx.setIsExecuting(true);
    try {
      // 改进的Tauri环境检测 - 直接尝试使用invoke函数
      console.log("🔍 开始Tauri环境检测...");
      console.log("window对象存在:", typeof window !== "undefined");
      console.log("__TAURI__对象:", typeof (window as any).__TAURI__);
      console.log("__TAURI__内容:", (window as any).__TAURI__);

      let isTauri = false;
      try {
        await invoke("get_adb_devices_safe");
        isTauri = true;
        console.log("✅ Tauri invoke 函数可用");
      } catch (invokeError) {
        console.log("❌ Tauri invoke 函数不可用:", invokeError);
        isTauri = false;
      }

      console.log("🌐 Tauri环境检测:", isTauri ? "是" : "否");

      if (!isTauri) {
        // 模拟执行结果（用于开发环境）
        console.log("🎭 使用模拟执行...");
        const mockResult: SmartExecutionResult = {
          success: true,
          total_steps: expandedSteps.length,
          executed_steps: expandedSteps.length,
          failed_steps: 0,
          skipped_steps: 0,
          duration_ms: 2500,
          logs: [],
          final_page_state: "Home",
          extracted_data: {},
          message: "模拟执行成功（开发环境）",
        };

        await new Promise((resolve) => setTimeout(resolve, 2000));
        ctx.setExecutionResult(mockResult);
        message.success(
          `智能脚本执行成功！执行了 ${mockResult.executed_steps} 个步骤，耗时 ${mockResult.duration_ms} ms`
        );
        ctx.setIsExecuting(false);
        return;
      }

      // 真实的Tauri调用
      try {
        console.log("🔌 [旧版执行器] 准备调用Tauri API...");
        
        // 🔍 检查可能影响执行的环境变量
        try {
          const envCheck = await invoke("get_environment_info") as any;
          console.log("🌍 [旧版执行器] 环境信息:", envCheck);
        } catch (envError) {
          console.warn("⚠️ [旧版执行器] 无法获取环境信息:", envError);
        }
        
        // 🔍 验证设备连接状态
        try {
          const deviceCheck = await invoke("get_adb_devices_safe") as string[];
          console.log("📱 [旧版执行器] ADB设备状态:", deviceCheck);
          
          // 检查目标设备是否在线（deviceCheck 是字符串数组，包含设备ID）
          const isTargetDeviceOnline = deviceCheck.includes(selectedDevice);
          console.log("🎯 [旧版执行器] 目标设备在线状态:", isTargetDeviceOnline);
          console.log("🎯 [旧版执行器] 可用设备列表:", deviceCheck);
          console.log("🎯 [旧版执行器] 目标设备ID:", selectedDevice);
          
          // 🚀 对于分布式脚本，放宽设备检查条件
          if (!isTargetDeviceOnline) {
            // 如果设备不在线，但我们有设备列表，可以尝试继续（适用于分布式场景）
            if (deviceCheck.length > 0) {
              console.log("⚠️ [旧版执行器] 目标设备不在线，但有其他设备可用，继续执行");
              message.warning(`⚠️ 目标设备 ${selectedDevice} 不在线，将尝试在可用设备上执行`, 5);
            } else {
              hideStartMessage();
              message.error(`❌ 目标设备 ${selectedDevice} 未连接或不在线`, 8);
              return;
            }
          }
          
          // 🧪 执行前设备响应测试
          try {
            console.log("🧪 [旧版执行器] 执行设备响应测试...");
            const testResult = await invoke("test_device_responsiveness", {
              deviceId: selectedDevice
            }) as any;
            console.log("🧪 [旧版执行器] 设备响应测试结果:", testResult);
            
            if (!testResult.success) {
              hideStartMessage();
              message.error(`❌ 设备响应测试失败: ${testResult.message}`, 8);
              return;
            }
          } catch (testError) {
            console.warn("⚠️ [旧版执行器] 设备响应测试失败:", testError);
            // 继续执行，但记录警告
          }
        } catch (deviceError) {
          console.error("❌ [旧版执行器] 无法检查设备状态:", deviceError);
          hideStartMessage();
          message.error("❌ 无法检查设备连接状态", 8);
          return;
        }

        const backendConfig = {
          continue_on_error: executorConfig.smart_recovery_enabled,
          auto_verification_enabled: executorConfig.auto_verification_enabled,
          smart_recovery_enabled: executorConfig.smart_recovery_enabled,
          detailed_logging: executorConfig.detailed_logging,
        };

        console.log("📤 [旧版执行器] 发送Tauri调用:", {
          command: "execute_smart_automation_script",
          deviceId: selectedDevice,
          stepsCount: expandedSteps.length,
          config: backendConfig,
        });
        
        // 🔍 详细记录发送给后端的步骤数据
        console.log("📋 [旧版执行器] 发送的步骤详细信息:");
        expandedSteps.forEach((step, index) => {
          console.log(`  步骤 ${index + 1}:`, {
            id: step.id,
            step_type: step.step_type,
            name: step.name,
            enabled: step.enabled,
            parameters: step.parameters
          });
        });

        const result = (await invoke("execute_smart_automation_script", {
          deviceId: selectedDevice,
          steps: expandedSteps,
          config: backendConfig,
        })) as SmartExecutionResult;

        console.log("📥 [旧版执行器] 收到Tauri响应:", result);
        console.log("📊 [旧版执行器] 执行结果详情:", {
          success: result.success,
          executed_steps: result.executed_steps,
          total_steps: result.total_steps,
          duration_ms: result.duration_ms,
          message: result.message,
          logs: result.logs
        });
        
        // 🔍 分析执行日志，查找可能的问题
        if (result.logs && result.logs.length > 0) {
          console.log("📋 [旧版执行器] 详细执行日志:");
          result.logs.forEach((log, index) => {
            console.log(`  ${index + 1}. ${log}`);
          });
          
          // 检查是否有可疑的成功模式
          const hasActualExecution = result.logs.some(log => 
            log.includes("执行步骤") || 
            log.includes("步骤成功") || 
            log.includes("步骤失败") ||
            log.includes("coordinate") ||
            log.includes("clicking") ||
            log.includes("input") ||
            log.includes("swipe")
          );
          
          if (!hasActualExecution && result.success) {
            console.warn("⚠️ [旧版执行器] 可疑成功：没有发现实际执行步骤的日志");
            message.warning("⚠️ 脚本可能没有实际执行，请检查设备状态", 8);
          }
        } else {
          console.warn("⚠️ [旧版执行器] 没有收到执行日志");
        }
        
        ctx.setExecutionResult(result);

        if (result.success) {
          const successMsg = `🎉 智能脚本执行成功！执行了 ${result.executed_steps}/${result.total_steps} 个步骤，耗时 ${result.duration_ms} ms`;
          console.log("🎉 [旧版执行器] 准备显示成功消息:", successMsg);
          hideStartMessage(); // 隐藏加载消息
          message.success(successMsg, 5); // 显示5秒
          console.log("✅ [旧版执行器] 成功消息已发送");
        } else {
          const warningMsg = `⚠️ 智能脚本执行完成，${result.executed_steps} 个成功，${result.failed_steps} 个失败`;
          console.log("⚠️ [旧版执行器] 准备显示警告消息:", warningMsg);
          hideStartMessage(); // 隐藏加载消息
          message.warning(warningMsg, 5); // 显示5秒
          console.log("⚠️ [旧版执行器] 警告消息已发送");
        }
      } catch (tauriError) {
        console.error("❌ [旧版执行器] Tauri API调用失败:", tauriError);
        console.error("❌ [旧版执行器] 错误类型:", typeof tauriError);
        console.error("❌ [旧版执行器] 错误详情:", JSON.stringify(tauriError, null, 2));
        
        hideStartMessage(); // 隐藏加载消息
        
        // 更详细的错误分析
        let errorMessage = "未知错误";
        if (tauriError instanceof Error) {
          errorMessage = tauriError.message;
        } else if (typeof tauriError === 'string') {
          errorMessage = tauriError;
        } else if (tauriError && typeof tauriError === 'object') {
          errorMessage = JSON.stringify(tauriError);
        }
        
        console.error("❌ [旧版执行器] 格式化错误信息:", errorMessage);
        message.error(`❌ 脚本执行失败: ${errorMessage}`, 8); // 显示8秒，更长时间方便查看错误
        
        console.warn("🎭 [旧版执行器] 不使用模拟执行，直接报错");
        
        // 设置失败结果而不是模拟成功
        const failedResult: SmartExecutionResult = {
          success: false,
          total_steps: expandedSteps.length,
          executed_steps: 0,
          failed_steps: expandedSteps.length,
          skipped_steps: 0,
          duration_ms: 0,
          logs: [`执行失败: ${errorMessage}`],
          final_page_state: undefined,
          extracted_data: {},
          message: `脚本执行失败: ${errorMessage}`,
        };

        ctx.setExecutionResult(failedResult);
      }
    } catch (error) {
      console.error("❌ [旧版执行器] 智能脚本执行失败:", error);
      console.error("❌ [旧版执行器] 错误类型:", typeof error);
      console.error("❌ [旧版执行器] 错误Stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      hideStartMessage(); // 隐藏加载消息
      
      let errorMessage = "未知执行错误";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      message.error(`❌ 智能脚本执行失败: ${errorMessage}`, 8); // 显示8秒
      
      // 设置失败结果
      const failedResult: SmartExecutionResult = {
        success: false,
        total_steps: expandedSteps.length,
        executed_steps: 0,
        failed_steps: expandedSteps.length,
        skipped_steps: 0,
        duration_ms: 0,
        logs: [`总体执行失败: ${errorMessage}`],
        final_page_state: undefined,
        extracted_data: {},
        message: `智能脚本执行失败: ${errorMessage}`,
      };
      
      ctx.setExecutionResult(failedResult);
    } finally {
      ctx.setIsExecuting(false);
      try {
        hideStartMessage(); // 确保在任何情况下都隐藏加载消息
      } catch (e) {
        // 忽略隐藏消息时的错误
        console.warn("隐藏加载消息时出错:", e);
      }
      console.log("🏁 [旧版执行器] 智能脚本执行流程结束");
    }
  };
}
