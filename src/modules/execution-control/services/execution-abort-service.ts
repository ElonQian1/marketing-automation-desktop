// src/modules/execution-control/services/execution-abort-service.ts
// module: execution-control | layer: services | role: 执行中止服务
// summary: 提供脚本执行中止功能，包含前端状态管理和后端通信

import { invoke } from '@tauri-apps/api/core';
import { message } from 'antd';

export interface ExecutionAbortRequest {
  reason?: string;
  force?: boolean;
}

export interface ExecutionAbortResult {
  success: boolean;
  message: string;
  stoppedAt?: {
    stepIndex: number;
    stepName: string;
  };
}

/**
 * 执行中止服务
 * 负责协调前端状态和后端中止操作
 */
export class ExecutionAbortService {
  private static instance: ExecutionAbortService;
  private abortController: AbortController | null = null;
  private currentExecutionId: string | null = null;

  static getInstance(): ExecutionAbortService {
    if (!ExecutionAbortService.instance) {
      ExecutionAbortService.instance = new ExecutionAbortService();
    }
    return ExecutionAbortService.instance;
  }

  /**
   * 开始执行时注册执行ID
   */
  startExecution(executionId: string): void {
    this.currentExecutionId = executionId;
    this.abortController = new AbortController();
    console.log(`🎬 [执行控制] 注册执行ID: ${executionId}`);
  }

  /**
   * 执行完成时清理
   */
  finishExecution(): void {
    console.log(`🏁 [执行控制] 清理执行状态: ${this.currentExecutionId}`);
    this.currentExecutionId = null;
    this.abortController = null;
  }

  /**
   * 检查是否有活跃的执行
   */
  hasActiveExecution(): boolean {
    return this.currentExecutionId !== null;
  }

  /**
   * 获取当前执行ID
   */
  getCurrentExecutionId(): string | null {
    return this.currentExecutionId;
  }

  /**
   * 中止当前执行
   */
  async abortExecution(request: ExecutionAbortRequest = {}): Promise<ExecutionAbortResult> {
    if (!this.hasActiveExecution()) {
      const result: ExecutionAbortResult = {
        success: false,
        message: '没有正在执行的脚本'
      };
      return result;
    }

    const executionId = this.currentExecutionId!;
    const reason = request.reason || '用户手动中止';
    
    console.log(`🛑 [执行控制] 开始中止执行: ${executionId}, 原因: ${reason}`);

    try {
      // 1. 设置前端中止信号
      if (this.abortController) {
        this.abortController.abort(reason);
        console.log(`🚫 [执行控制] 前端中止信号已发送`);
      }

      // 2. 调用后端中止接口
      const backendResult = await this.abortBackendExecution(executionId, request);
      
      // 3. 清理状态
      this.finishExecution();

      const result: ExecutionAbortResult = {
        success: true,
        message: `执行已中止: ${reason}`,
        stoppedAt: backendResult.stoppedAt
      };

      console.log(`✅ [执行控制] 中止完成:`, result);
      message.warning(`🛑 ${result.message}`, 5);
      
      return result;

    } catch (error) {
      console.error(`❌ [执行控制] 中止失败:`, error);
      
      // 即使后端调用失败，也要清理前端状态
      this.finishExecution();

      const errorMessage = error instanceof Error ? error.message : '未知错误';
      const result: ExecutionAbortResult = {
        success: false,
        message: `中止失败: ${errorMessage}`
      };

      message.error(`❌ ${result.message}`, 5);
      return result;
    }
  }

  /**
   * 调用后端中止接口
   */
  private async abortBackendExecution(
    executionId: string, 
    request: ExecutionAbortRequest
  ): Promise<{ stoppedAt?: { stepIndex: number; stepName: string } }> {
    try {
      // 尝试调用后端中止接口
      const result = await invoke('abort_script_execution', {
        executionId,
        reason: request.reason || '用户手动中止',
        force: request.force || false
      });

      console.log(`🎯 [执行控制] 后端中止成功:`, result);
      return result as any;

    } catch (error) {
      console.warn(`⚠️ [执行控制] 后端中止接口调用失败，可能后端不支持该功能:`, error);
      
      // 如果后端不支持中止接口，尝试其他方式
      try {
        // 尝试调用通用中止接口
        await invoke('cancel_current_operation');
        console.log(`🔄 [执行控制] 使用通用中止接口成功`);
        return {};
      } catch (secondError) {
        console.warn(`⚠️ [执行控制] 通用中止接口也失败:`, secondError);
        
        // 最后尝试：强制终止所有 ADB 操作
        try {
          await invoke('force_stop_all_adb_operations');
          console.log(`🔨 [执行控制] 强制停止 ADB 操作成功`);
          return {};
        } catch (thirdError) {
          console.error(`❌ [执行控制] 所有中止方式都失败:`, thirdError);
          throw new Error('无法中止后端执行，请手动重启应用');
        }
      }
    }
  }

  /**
   * 获取中止信号（用于执行过程中检查）
   */
  getAbortSignal(): AbortSignal | null {
    return this.abortController?.signal || null;
  }

  /**
   * 检查是否已被中止
   */
  isAborted(): boolean {
    return this.abortController?.signal.aborted || false;
  }
}