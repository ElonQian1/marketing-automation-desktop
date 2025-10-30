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
        const stepType = identifyStepType(step);
        const stepIcon = STEP_TYPE_ICONS[stepType] || "📍";
        const stepTypeName = STEP_TYPE_NAMES[stepType] || "未知";
        
        console.log(`\n${stepIcon} [批量执行] 步骤 ${i + 1}/${totalSteps}: ${step.name}`);
        console.log(`   原始类型: ${step.step_type}`);
        console.log(`   识别类型: ${stepTypeName} (${stepType})`);
        console.log(`   参数预览:`, {
          hasXPath: !!step.parameters?.xpath,
          hasInput: !!step.parameters?.input_text,
          hasKeyCode: !!step.parameters?.key_code,
          hasDirection: !!step.parameters?.direction
        });
        
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
          
          // 🔧 新增：检查是否需要循环执行
          if (result.needsLoopExecution && result.loopId) {
            console.log(`🔄 [循环处理] 检测到循环开始，执行前端循环逻辑`);
            
            // 前端循环展开：重复执行循环内的步骤
            const loopIterations = result.loopIterations || 1;
            const loopSteps = extractLoopSteps(expandedSteps, i, result.loopId);
            
            if (loopSteps.length > 0) {
              console.log(`🔄 [循环处理] 找到 ${loopSteps.length} 个循环内步骤，将执行 ${loopIterations} 次`);
              
              for (let iteration = 1; iteration <= loopIterations; iteration++) {
                console.log(`\n🔄 [循环执行] 第 ${iteration}/${loopIterations} 次循环开始`);
                
                for (let loopStepIndex = 0; loopStepIndex < loopSteps.length; loopStepIndex++) {
                  const loopStep = loopSteps[loopStepIndex];
                  console.log(`📜 [循环执行] 循环 ${iteration} - 步骤 ${loopStepIndex + 1}/${loopSteps.length}: ${loopStep.name}`);
                  
                  // 执行循环内的单个步骤
                  const loopStepResult = await routeAndExecuteStep(
                    selectedDevice,
                    loopStep,
                    // V3点击引擎执行函数（复用上面的逻辑）
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
                      
                      const action = clickStep.step_type || "smart_selection";
                      
                      const chainSpec = {
                        chainId: `loop_execution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        orderedSteps: [{
                          inline: {
                            stepId: clickStep.id,
                            action: action,
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
                    { width: 1080, height: 2340 }
                  );
                  
                  if (!loopStepResult.success) {
                    throw new Error(`循环第 ${iteration} 次，步骤 ${loopStepIndex + 1} 失败: ${loopStepResult.message}`);
                  }
                  
                  console.log(`✅ [循环执行] 循环 ${iteration} - 步骤 ${loopStepIndex + 1} 成功`);
                  
                  // 步骤间等待
                  if (loopStepIndex < loopSteps.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }
                }
                
                console.log(`✅ [循环执行] 第 ${iteration}/${loopIterations} 次循环完成`);
                
                // 循环间等待（如果不是最后一次循环）
                if (iteration < loopIterations) {
                  console.log(`⏱️ [循环执行] 循环间隔等待 1 秒...`);
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }
              
              console.log(`🎉 [循环处理] 所有 ${loopIterations} 次循环执行完成`);
            }
            
            // 跳过循环内的所有步骤，直到loop_end
            const loopEndIndex = findLoopEndIndex(expandedSteps, i, result.loopId);
            if (loopEndIndex !== -1) {
              i = loopEndIndex; // 跳转到loop_end位置
              console.log(`✅ [循环处理] 跳转到步骤 ${i + 1} (loop_end)`);
            }
            
            successCount++;
            continue;
          }
          
          if (result.success) {
            console.log(`✅ [${result.executorType}] 步骤 ${i + 1} 执行成功:`, result.message);
            successCount++;
          } else {
            throw new Error(result.message);
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

/**
 * 🔧 新增：提取循环内的步骤
 */
function extractLoopSteps(
  allSteps: ExtendedSmartScriptStep[],
  loopStartIndex: number,
  loopId: string
): ExtendedSmartScriptStep[] {
  const loopSteps: ExtendedSmartScriptStep[] = [];
  
  for (let i = loopStartIndex + 1; i < allSteps.length; i++) {
    const step = allSteps[i];
    
    // 遇到对应的 loop_end 就停止
    if (step.step_type === 'loop_end' && step.parameters?.loop_id === loopId) {
      break;
    }
    
    // 跳过嵌套的循环控制步骤（暂不支持嵌套循环）
    if (step.step_type === 'loop_start' || step.step_type === 'loop_end') {
      console.warn(`⚠️ [循环处理] 跳过嵌套循环控制步骤: ${step.step_type}`);
      continue;
    }
    
    loopSteps.push(step);
  }
  
  console.log(`🔍 [循环处理] 提取到 ${loopSteps.length} 个循环内步骤`, loopSteps.map(s => s.name));
  return loopSteps;
}

/**
 * 🔧 新增：查找循环结束的位置
 */
function findLoopEndIndex(
  steps: ExtendedSmartScriptStep[], 
  loopStartIndex: number, 
  loopId: string
): number {
  for (let i = loopStartIndex + 1; i < steps.length; i++) {
    const step = steps[i];
    if (step.step_type === 'loop_end' && step.parameters?.loop_id === loopId) {
      return i;
    }
  }
  
  console.warn(`⚠️ [循环处理] 未找到对应的loop_end: loopId=${loopId}`);
  return -1;
}
