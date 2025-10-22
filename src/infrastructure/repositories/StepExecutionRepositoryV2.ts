// src/infrastructure/repositories/StepExecutionRepositoryV2.ts
// module: infrastructure | layer: infrastructure | role: V2 步骤执行仓储
// summary: 基于 RunStepV2 协议的步骤执行仓储，解决策略字段和动作参数问题

import { invoke } from '@tauri-apps/api/core';
import type { 
  RunStepRequestV2, 
  RunStepResponseV2,
  StepRunMode
} from '../../types/runStepV2';
import type { StepCardModel } from '../../types/stepActions';

export class StepExecutionRepositoryV2 {
  /**
   * 执行步骤 - V2 版本
   * 支持选择器优先 + 坐标兜底 + 执行后验证
   */
  async runStep(
    deviceId: string,
    mode: StepRunMode,
    stepCard: StepCardModel
  ): Promise<RunStepResponseV2> {
    console.log(`🚀 [StepExec V2] 开始执行: ${stepCard.name}, 模式: ${mode}`);
    
    try {
      // 转换为 V2 请求协议
      const { convertToV2Request } = await import('../../types/runStepV2');
      const request: RunStepRequestV2 = convertToV2Request(deviceId, mode, stepCard);
      
      console.log(`📋 [StepExec V2] 请求数据:`, request);
      console.log(`🔍 [StepExec V2] 策略: ${request.strategy}, 动作: ${request.step.action}`);

      // 调用 Tauri V2 命令
      const result = await invoke<RunStepResponseV2>('run_step_v2', { request });
      
      console.log(`${result.ok ? '✅' : '❌'} [StepExec V2] 执行结果:`, result);
      
      // 打印详细日志
      if (result.raw_logs?.length) {
        console.log(`📝 [StepExec V2] 后端日志:`);
        result.raw_logs.forEach((log, i) => console.log(`  ${i + 1}. ${log}`));
      }

      return result;
    } catch (error) {
      console.error(`❌ [StepExec V2] 执行异常:`, error);
      
      // 返回标准化错误响应
      return {
        ok: false,
        message: `执行异常: ${error}`,
        matched: undefined,
        executed_action: undefined,
        verify_passed: undefined,
        error_code: 'ADB_ERROR',
        raw_logs: [`执行异常: ${error}`],
      };
    }
  }

  /**
   * 仅匹配模式 - 便捷方法
   */
  async matchOnly(deviceId: string, stepCard: StepCardModel): Promise<RunStepResponseV2> {
    return this.runStep(deviceId, 'match-only', stepCard);
  }

  /**
   * 匹配并执行模式 - 便捷方法
   */
  async matchAndExecute(deviceId: string, stepCard: StepCardModel): Promise<RunStepResponseV2> {
    return this.runStep(deviceId, 'execute-step', stepCard);
  }
}