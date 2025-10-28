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
    console.log("🚀 [批量执行] 开始执行智能脚本...");
    console.log("🔴 [批量执行] 使用混合模式: V2滚动 + V3点击");

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

    console.log("📋 [批量执行] 展开后的步骤数量:", expandedSteps.length);
    console.log("📝 [批量执行] 展开后的步骤详情:", expandedSteps);

    // 获取当前选中的设备
    const devices = ctx.getDevices();
    const currentDeviceId = ctx.getCurrentDeviceId();
    console.log("📱 [批量执行] 可用设备列表:", devices);
    console.log("📱 [批量执行] 当前设备ID:", currentDeviceId);
    
    if (!currentDeviceId && devices.length === 0) {
      message.error("没有可用的设备，请先连接设备");
      return;
    }
    
    const selectedDevice = currentDeviceId || 
      devices.find((d) => d.status === "online")?.id || 
      devices.find((d) => (d as any).isOnline && (d as any).isOnline())?.id ||
      devices[0]?.id || 
      "e0d909c3"; // 使用你的实际设备ID作为默认值
    
    console.log("📱 [批量执行] 最终选中的设备:", selectedDevice);
    
    if (!selectedDevice) {
      message.error("无法确定目标设备，请检查设备连接");
      return;
    }

    // 显示开始执行的消息
    const hideStartMessage = message.loading('开始执行智能脚本（混合模式：V2滚动+V3点击）...', 0);
    
    ctx.setIsExecuting(true);
    try {
      console.log("🎯 [批量执行] 准备开始混合模式执行...");
      
      // 🔥 使用V3批量执行：为每个步骤创建ChainSpec并顺序执行
      let successCount = 0;
      let failCount = 0;
      const totalSteps = expandedSteps.length;
      
      for (let i = 0; i < expandedSteps.length; i++) {
        const step = expandedSteps[i];
        console.log(`\n🔄 [批量执行] 执行步骤 ${i + 1}/${totalSteps}: ${step.name}, step_type=${step.step_type}`);
        
        try {
          // 🎯 识别滚动步骤 - 使用V2引擎
          const isScrollStep = step.step_type === "smart_scroll" || 
                              step.step_type === "swipe" || 
                              step.name?.includes("滚动");
          
          if (isScrollStep) {
            // 🔄 滚动步骤使用V2引擎（已验证可用）
            console.log(`📜 [V2滚动] 检测到滚动步骤，使用V2引擎执行`);
            
            const direction = step.parameters?.direction || "down";
            const duration = step.parameters?.duration || 300;
            
            // 计算滚动坐标（屏幕中央垂直滑动）
            const screenWidth = 1080; // 可以从设备信息获取
            const screenHeight = 2340;
            const centerX = screenWidth / 2;
            
            let startY: number, endY: number;
            if (direction === "down") {
              // 向下滚动：从下往上滑
              startY = screenHeight * 0.7;
              endY = screenHeight * 0.3;
            } else if (direction === "up") {
              // 向上滚动：从上往下滑
              startY = screenHeight * 0.3;
              endY = screenHeight * 0.7;
            } else {
              startY = screenHeight * 0.7;
              endY = screenHeight * 0.3;
            }
            
            console.log(`📜 [V2滚动] 滚动参数: (${centerX},${startY}) → (${centerX},${endY}), 时长:${duration}ms`);
            
            // 调用V2的run_step_v2执行滑动（注意：所有参数必须包裹在request对象中）
            const v2Result = await invoke("run_step_v2", {
              request: {
                device_id: selectedDevice,
                mode: "execute_step",
                strategy: "intelligent",
                step: {
                  step_id: step.id,
                  step_name: step.name,
                  action: "swipe",
                  start_x: centerX,
                  start_y: startY,
                  end_x: centerX,
                  end_y: endY,
                  duration_ms: duration
                }
              }
            });
            
            console.log(`✅ [V2滚动] 步骤 ${i + 1} 执行成功:`, v2Result);
            successCount++;
            
          } else {
            // 🎯 点击步骤使用V3引擎
            console.log(`🎯 [V3点击] 检测到点击步骤，使用V3引擎执行`);
            
            const params = {
              element_path: step.parameters?.selected_xpath || step.parameters?.xpath || "",
              targetText: step.parameters?.targetText || step.parameters?.text || "",
              target_content_desc: step.parameters?.target_content_desc || "",
              original_data: step.parameters?.original_data || {},
              smartSelection: {
                mode: "first",
                minConfidence: 0.8,
                targetText: step.parameters?.targetText || step.parameters?.text || "",
                batchConfig: {
                  maxCount: 1,
                  intervalMs: 1000,
                  continueOnError: false,
                  showProgress: true
                }
              }
            };
            
            // 🎯 构建V3 ChainSpec
            const chainSpec = {
              chainId: `step_execution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              orderedSteps: [{
                inline: {
                  stepId: step.id,
                  action: "smart_selection",
                  params: params
                },
                ref: null
              }],
              mode: "execute",
              threshold: 0.5,
              constraints: {},
              quality: {},
              validation: {}
            };

            console.log("📤 [V3点击] 发送ChainSpec:", JSON.stringify(chainSpec, null, 2));

            // 调用V3执行接口
            const result = await invoke("execute_chain_test_v3", {
              envelope: {
                deviceId: selectedDevice,
                app: {
                  package: "com.ss.android.ugc.aweme", // 抖音包名
                  activity: null
                },
                snapshot: {
                  analysisId: null,
                  screenHash: null,
                  xmlCacheId: null
                },
                executionMode: "relaxed"
              },
              spec: chainSpec
            });

            console.log(`✅ [V3点击] 步骤 ${i + 1} 执行成功:`, result);
            successCount++;
          }
          
          // 等待间隔
          if (i < expandedSteps.length - 1) {
            console.log("⏱️ [批量执行] 等待1秒后继续...");
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (stepError) {
          console.error(`❌ [批量执行] 步骤 ${i + 1} 执行失败:`, stepError);
          failCount++;
          
          // 是否继续执行
          const executorConfig = ctx.getExecutorConfig();
          if (!executorConfig.smart_recovery_enabled) {
            console.warn("⚠️ [批量执行] smart_recovery_enabled=false，提前终止");
            break;
          }
        }
      }

      // 构建执行结果
      const result: SmartExecutionResult = {
        success: failCount === 0,
        total_steps: totalSteps,
        executed_steps: successCount,
        failed_steps: failCount,
        skipped_steps: totalSteps - successCount - failCount,
        duration_ms: 0,
        logs: [
          `混合模式执行完成: 成功${successCount}/${totalSteps}个步骤`,
          failCount > 0 ? `失败${failCount}个步骤` : ''
        ].filter(Boolean),
        final_page_state: undefined,
        extracted_data: {},
        message: failCount === 0 
          ? `✅ 所有步骤执行成功（${successCount}/${totalSteps}）`
          : `⚠️ 部分步骤失败（成功${successCount}，失败${failCount}）`
      };

      ctx.setExecutionResult(result);
      hideStartMessage();

      if (result.success) {
        message.success(`🎉 脚本执行成功！执行了 ${result.executed_steps}/${result.total_steps} 个步骤`, 5);
      } else {
        message.warning(`⚠️ 脚本执行完成，${result.executed_steps} 个成功，${result.failed_steps} 个失败`, 5);
      }
    } catch (error) {
      console.error("❌ [批量执行] 批量执行失败:", error);
      
      hideStartMessage();
      
      let errorMessage = "未知错误";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }
      
      message.error(`❌ 脚本执行失败: ${errorMessage}`, 8);
      
      // 设置失败结果
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
    } finally {
      ctx.setIsExecuting(false);
      try {
        hideStartMessage();
      } catch (e) {
        console.warn("隐藏加载消息时出错:", e);
      }
      console.log("🏁 [批量执行] 智能脚本执行流程结束");
    }
  };
}
