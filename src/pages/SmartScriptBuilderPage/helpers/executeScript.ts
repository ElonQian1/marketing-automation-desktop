// src/pages/SmartScriptBuilderPage/helpers/executeScript.ts
// module: ui | layer: ui | role: page
// summary: 页面组件

import { invoke } from "@tauri-apps/api/core";
import { message } from "antd";
import { normalizeScriptStepsForBackend } from "../helpers/normalizeSteps";
import type { ExtendedSmartScriptStep } from "../../../types/loopScript";
import { 
  routeAndExecuteStep, 
  identifyStepType,
  STEP_TYPE_NAMES,
  STEP_TYPE_ICONS
} from "./step-type-router";
import { ExecutionFlowController } from "../../../modules/execution-flow-control/application/execution-flow-use-case";
import { ExecutionFailureStrategy } from "../../../modules/execution-flow-control/domain/failure-handling-strategy";
import { extractFailureConfigFromStep } from "../../../modules/execution-flow-control/utils/step-type-adapter";
import { ExecutionAbortService } from "../../../modules/execution-control/services/execution-abort-service";

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
  logs: string[];
  final_page_state?: string;
  extracted_data: Record<string, unknown>;
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
      devices.find((d) => {
        const deviceWithOnline = d as { isOnline?: () => boolean };
        return deviceWithOnline.isOnline && deviceWithOnline.isOnline();
      })?.id ||
      devices[0]?.id || 
      "e0d909c3"; // 使用你的实际设备ID作为默认值
    
    console.log("📱 [批量执行] 最终选中的设备:", selectedDevice);
    
    if (!selectedDevice) {
      message.error("无法确定目标设备，请检查设备连接");
      return;
    }

    // 🔥 创建执行控制和流程控制
    const abortService = ExecutionAbortService.getInstance();
    const flowController = new ExecutionFlowController(expandedSteps, {
      onStepResult: (result) => {
        console.log('📊 [执行流程] 步骤结果:', result);
      },
      onStateChange: (state) => {
        console.log('🔄 [执行流程] 状态变化:', state);
      }
    });
    const executionId = `script_exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 注册执行
    abortService.startExecution(executionId);

    const hideStartMessage = message.loading("🚀 正在执行智能脚本...", 0);

    ctx.setIsExecuting(true);
    try {
      console.log("🎯 [批量执行] 准备开始混合模式执行...");
      
      // 🔥 使用V3批量执行：为每个步骤创建ChainSpec并顺序执行
      let successCount = 0;
      let failCount = 0;
      const totalSteps = expandedSteps.length;
      let currentStepIndex = 0;
      
      while (currentStepIndex < expandedSteps.length) {
        // 🚫 检查是否被中止
        if (abortService.isAborted()) {
          console.log("🛑 [批量执行] 检测到中止信号，停止执行");
          message.warning("🛑 脚本执行已被中止", 3);
          break;
        }

        const step = expandedSteps[currentStepIndex];
        const stepType = identifyStepType(step);
        const stepIcon = STEP_TYPE_ICONS[stepType] || "📍";
        const stepTypeName = STEP_TYPE_NAMES[stepType] || "未知";
        
        console.log(`\\n${stepIcon} [批量执行] 步骤 ${currentStepIndex + 1}/${totalSteps}: ${step.name}`);
        console.log(`   原始类型: ${step.step_type}`);
        console.log(`   识别类型: ${stepTypeName} (${stepType})`);
        console.log(`   参数预览:`, {
          hasXPath: !!step.parameters?.xpath,
          hasInput: !!step.parameters?.input_text,
          hasKeyCode: !!step.parameters?.key_code,
          hasDirection: !!step.parameters?.direction
        });

        // 检查是否配置了失败处理
        const failureConfig = extractFailureConfigFromStep(step);
        if (failureConfig) {
          console.log(`⚙️ [失败处理] 步骤配置了失败策略: ${failureConfig.strategy}`, failureConfig);
        }
        
        try {
          // 🎯 使用统一路由器执行步骤
          const result = await routeAndExecuteStep(
            selectedDevice,
            step,
            // V3点击引擎执行函数
            async (clickStep: ExtendedSmartScriptStep) => {
              const params = {
                element_path: clickStep.parameters?.selected_xpath || clickStep.parameters?.xpath || "",
                targetText: clickStep.parameters?.targetText || clickStep.parameters?.text || "",
                target_content_desc: clickStep.parameters?.target_content_desc || "",
                original_data: clickStep.parameters?.original_data || {},
                smartSelection: {
                  mode: "first",
                  minConfidence: 0.8,
                  targetText: clickStep.parameters?.targetText || clickStep.parameters?.text || "",
                  batchConfig: {
                    maxCount: 1,
                    intervalMs: 1000,
                    continueOnError: false,
                    showProgress: true
                  }
                }
              };
              
              // 🔥 修复：从步骤类型动态获取action，而不是硬编码
              const action = clickStep.step_type || "smart_selection";
              
              const chainSpec = {
                chainId: `step_execution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                orderedSteps: [{
                  inline: {
                    stepId: clickStep.id,
                    action: action,  // ✅ 使用步骤实际类型
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

              return await invoke("execute_chain_test_v3", {
                envelope: {
                  deviceId: selectedDevice,
                  app: {
                    package: "com.ss.android.ugc.aweme",
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
            },
            { width: 1080, height: 2340 } // TODO: 从设备信息动态获取
          );
          
          if (result.success) {
            console.log(`✅ [${result.executorType}] 步骤 ${currentStepIndex + 1} 执行成功:`, result.message);
            successCount++;
            currentStepIndex++;
          } else {
            throw new Error(result.message);
          }
          
          // 等待间隔 (检查中止信号)
          if (currentStepIndex < expandedSteps.length) {
            console.log("⏱️ [批量执行] 等待1秒后继续...");
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 再次检查中止信号
            if (abortService.isAborted()) {
              console.log("🛑 [批量执行] 等待期间检测到中止信号");
              break;
            }
          }
          
        } catch (stepError) {
          console.error(`❌ [批量执行] 步骤 ${currentStepIndex + 1} 执行失败:`, stepError);
          
          // 🔥 新增：失败处理逻辑
          if (failureConfig) {
            console.log(`🔧 [失败处理] 处理步骤失败，策略: ${failureConfig.strategy}`);
            
            switch (failureConfig.strategy) {
              case ExecutionFailureStrategy.STOP_SCRIPT:
                console.log(`🛑 [失败处理] 终止脚本执行`);
                message.error(`🛑 脚本已终止: 步骤${currentStepIndex + 1}失败`, 8);
                throw new Error(`脚本已终止: 步骤${currentStepIndex + 1}失败`);

              case ExecutionFailureStrategy.CONTINUE_NEXT:
                console.log(`⏭️ [失败处理] 跳过当前步骤，继续下一步`);
                message.warning(`⏭️ 跳过步骤 ${currentStepIndex + 1}，继续执行`, 3);
                failCount++;
                currentStepIndex++;
                break;

              case ExecutionFailureStrategy.JUMP_TO_STEP:
                if (failureConfig.jumpToStepId) {
                  const targetIndex = expandedSteps.findIndex(s => s.id === failureConfig.jumpToStepId);
                  if (targetIndex !== -1) {
                    console.log(`🎯 [失败处理] 跳转到步骤 ${targetIndex + 1}`);
                    message.info(`🎯 跳转到步骤 ${targetIndex + 1}`, 3);
                    failCount++;
                    currentStepIndex = targetIndex;
                  } else {
                    console.warn(`⚠️ [失败处理] 未找到目标步骤，继续下一步`);
                    message.warning(`⚠️ 未找到目标步骤，继续下一步`, 3);
                    failCount++;
                    currentStepIndex++;
                  }
                } else {
                  console.warn(`⚠️ [失败处理] 跳转策略但未指定目标步骤，继续下一步`);
                  failCount++;
                  currentStepIndex++;
                }
                break;

              case ExecutionFailureStrategy.RETRY_CURRENT:
                const maxRetries = failureConfig.maxRetries || 3;
                const currentRetries = (step as any)._retryCount || 0;
                if (currentRetries < maxRetries) {
                  console.log(`🔄 [失败处理] 重试当前步骤 (${currentRetries + 1}/${maxRetries})`);
                  message.info(`🔄 重试步骤 ${currentStepIndex + 1} (${currentRetries + 1}/${maxRetries})`, 3);
                  (step as any)._retryCount = currentRetries + 1;
                  // currentStepIndex 不变，重新执行当前步骤
                } else {
                  console.log(`❌ [失败处理] 重试次数已达上限，跳过步骤`);
                  message.warning(`❌ 步骤 ${currentStepIndex + 1} 重试次数已达上限，跳过`, 3);
                  failCount++;
                  currentStepIndex++;
                }
                break;

              case ExecutionFailureStrategy.SKIP_CURRENT:
                console.log(`⏭️ [失败处理] 跳过当前步骤`);
                message.warning(`⏭️ 跳过步骤 ${currentStepIndex + 1}`, 3);
                failCount++;
                currentStepIndex++;
                break;

              default:
                console.log(`❓ [失败处理] 未知策略，使用默认处理`);
                failCount++;
                currentStepIndex++;
            }
          } else {
            // 没有配置失败处理，使用原有逻辑
            failCount++;
            
            // 是否继续执行
            const executorConfig = ctx.getExecutorConfig();
            if (!executorConfig.smart_recovery_enabled) {
              console.warn("⚠️ [批量执行] smart_recovery_enabled=false，提前终止");
              break;
            }
            currentStepIndex++;
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
      // 🔥 清理执行控制状态
      abortService.finishExecution();
      
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