// src/modules/deduplication-control/services/dedup-circuit-breaker-service.ts
// module: dedup | layer: services | role: circuit-breaker
// summary: 熔断器保护服务

/**
 * 熔断器服务
 *
 * 实现熔断器模式，提供系统保护机制
 */
import { invoke } from "@tauri-apps/api/core";
import {
  DedupCircuitBreakerState,
  DedupCircuitBreakerConfig,
  CircuitBreakerStatus,
  SafetyCheckRequest,
} from "../types";

/**
 * 熔断器存储服务
 */
export class DedupCircuitBreakerStorageService {
  /**
   * 获取熔断器状态
   */
  static async getCircuitBreakerStatus(
    accountId: string,
    taskType: "follow" | "reply"
  ): Promise<CircuitBreakerStatus> {
    try {
      const status = await invoke<{
        state: string;
        failure_count: number;
        success_count: number;
        failure_rate: number;
        last_failure_time?: string;
        last_success_time?: string;
        next_check_time?: string;
        state_history: Array<{
          state: string;
          timestamp: string;
          reason: string;
        }>;
      }>("plugin:automation|get_circuit_breaker_status", {
        accountId,
        taskType,
      });

      return {
        state: status.state as DedupCircuitBreakerState,
        failureCount: status.failure_count,
        successCount: status.success_count,
        failureRate: status.failure_rate,
        lastFailureTime: status.last_failure_time
          ? new Date(status.last_failure_time)
          : undefined,
        lastSuccessTime: status.last_success_time
          ? new Date(status.last_success_time)
          : undefined,
        nextCheckTime: status.next_check_time
          ? new Date(status.next_check_time)
          : undefined,
        stateHistory: status.state_history.map((item) => ({
          state: item.state as DedupCircuitBreakerState,
          timestamp: new Date(item.timestamp),
          reason: item.reason,
        })),
      };
    } catch (error) {
      console.error("获取熔断器状态失败:", error);
      // 返回默认关闭状态
      return {
        state: DedupCircuitBreakerState.CLOSED,
        failureCount: 0,
        successCount: 0,
        failureRate: 0,
        stateHistory: [],
      };
    }
  }

  /**
   * 记录操作结果
   */
  static async recordOperationResult(
    accountId: string,
    taskType: "follow" | "reply",
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      await invoke("plugin:automation|record_circuit_breaker_operation", {
        accountId,
        taskType,
        success,
        errorMessage,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("记录熔断器操作结果失败:", error);
    }
  }

  /**
   * 更新熔断器状态
   */
  static async updateDedupCircuitBreakerState(
    accountId: string,
    taskType: "follow" | "reply",
    newState: DedupCircuitBreakerState,
    reason: string
  ): Promise<void> {
    try {
      await invoke("plugin:automation|update_circuit_breaker_state", {
        accountId,
        taskType,
        newState,
        reason,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("更新熔断器状态失败:", error);
    }
  }

  /**
   * 重置熔断器
   */
  static async resetCircuitBreaker(
    accountId: string,
    taskType: "follow" | "reply"
  ): Promise<void> {
    try {
      await invoke("plugin:automation|reset_circuit_breaker", {
        accountId,
        taskType,
      });
    } catch (error) {
      console.error("重置熔断器失败:", error);
    }
  }

  /**
   * 获取失败操作统计
   */
  static async getFailureStatistics(
    accountId: string,
    taskType: "follow" | "reply",
    timeWindowMinutes: number
  ): Promise<{
    totalOperations: number;
    failureCount: number;
    failureRate: number;
  }> {
    try {
      const stats = await invoke<{
        total_operations: number;
        failure_count: number;
        failure_rate: number;
      }>("plugin:automation|get_failure_statistics", {
        accountId,
        taskType,
        timeWindowMinutes,
      });

      return {
        totalOperations: stats.total_operations,
        failureCount: stats.failure_count,
        failureRate: stats.failure_rate,
      };
    } catch (error) {
      console.error("获取失败统计失败:", error);
      return { totalOperations: 0, failureCount: 0, failureRate: 0 };
    }
  }
}

/**
 * 熔断器决策引擎
 */
export class DedupCircuitBreakerDecisionEngine {
  private config: DedupCircuitBreakerConfig;

  constructor(config: DedupCircuitBreakerConfig) {
    this.config = config;
  }

  /**
   * 判断是否应该打开熔断器
   */
  shouldOpenCircuit(
    failureCount: number,
    failureRate: number,
    totalOperations: number
  ): boolean {
    // 检查最小请求数量
    if (totalOperations < this.config.minimumRequests) {
      return false;
    }

    // 检查失败计数阈值
    if (failureCount >= this.config.failureThreshold) {
      return true;
    }

    // 检查失败率阈值
    if (failureRate >= this.config.failureRateThreshold) {
      return true;
    }

    return false;
  }

  /**
   * 判断是否应该进入半开状态
   */
  shouldEnterHalfOpen(lastFailureTime: Date): boolean {
    if (!this.config.autoRecovery.enabled) {
      return false;
    }

    const now = new Date();
    const timeSinceLastFailure = now.getTime() - lastFailureTime.getTime();
    const openDurationMs = this.config.openDurationMinutes * 60 * 1000;

    return timeSinceLastFailure >= openDurationMs;
  }

  /**
   * 判断是否应该关闭熔断器
   */
  shouldCloseCircuit(successCount: number): boolean {
    return successCount >= this.config.autoRecovery.successThreshold;
  }

  /**
   * 计算下次检查时间
   */
  calculateNextCheckTime(currentState: DedupCircuitBreakerState): Date {
    const now = new Date();
    const nextCheck = new Date(now);

    switch (currentState) {
      case DedupCircuitBreakerState.OPEN:
        nextCheck.setMinutes(
          now.getMinutes() + this.config.openDurationMinutes
        );
        break;
      case DedupCircuitBreakerState.HALF_OPEN:
        nextCheck.setMinutes(
          now.getMinutes() + this.config.autoRecovery.checkIntervalMinutes
        );
        break;
      case DedupCircuitBreakerState.CLOSED:
        nextCheck.setMinutes(now.getMinutes() + this.config.timeWindowMinutes);
        break;
    }

    return nextCheck;
  }
}

/**
 * 主熔断器服务
 */
export class DedupCircuitBreakerService {
  private config: DedupCircuitBreakerConfig;
  private decisionEngine: DedupCircuitBreakerDecisionEngine;

  constructor(config: DedupCircuitBreakerConfig) {
    this.config = config;
    this.decisionEngine = new DedupCircuitBreakerDecisionEngine(config);
  }

  /**
   * 检查熔断器状态并决定是否允许操作
   */
  async checkCircuitBreaker(request: SafetyCheckRequest): Promise<{
    allowed: boolean;
    status: CircuitBreakerStatus;
    reason?: string;
  }> {
    if (!this.config.enabled) {
      return {
        allowed: true,
        status: {
          state: DedupCircuitBreakerState.CLOSED,
          failureCount: 0,
          successCount: 0,
          failureRate: 0,
          stateHistory: [],
        },
      };
    }

    const status =
      await DedupCircuitBreakerStorageService.getCircuitBreakerStatus(
        request.accountId,
        request.taskType
      );

    // 检查是否需要状态转换
    const updatedStatus = await this.updateDedupCircuitBreakerState(
      request,
      status
    );

    switch (updatedStatus.state) {
      case DedupCircuitBreakerState.CLOSED:
        return {
          allowed: true,
          status: updatedStatus,
        };

      case DedupCircuitBreakerState.OPEN:
        return {
          allowed: false,
          status: updatedStatus,
          reason: "熔断器开启状态，系统暂时不可用",
        };

      case DedupCircuitBreakerState.HALF_OPEN:
        // 半开状态下，允许少量请求通过
        const shouldAllow = await this.shouldAllowInHalfOpen(
          request,
          updatedStatus
        );
        return {
          allowed: shouldAllow,
          status: updatedStatus,
          reason: shouldAllow ? undefined : "熔断器半开状态，请求被限制",
        };

      default:
        return {
          allowed: false,
          status: updatedStatus,
          reason: "熔断器状态异常",
        };
    }
  }

  /**
   * 更新熔断器状态
   */
  private async updateDedupCircuitBreakerState(
    request: SafetyCheckRequest,
    currentStatus: CircuitBreakerStatus
  ): Promise<CircuitBreakerStatus> {
    const now = new Date();

    // 获取失败统计
    const stats = await DedupCircuitBreakerStorageService.getFailureStatistics(
      request.accountId,
      request.taskType,
      this.config.timeWindowMinutes
    );

    let newState = currentStatus.state;
    let reason = "";

    switch (currentStatus.state) {
      case DedupCircuitBreakerState.CLOSED:
        // 检查是否应该打开熔断器
        if (
          this.decisionEngine.shouldOpenCircuit(
            stats.failureCount,
            stats.failureRate,
            stats.totalOperations
          )
        ) {
          newState = DedupCircuitBreakerState.OPEN;
          reason = `失败率过高 (${(stats.failureRate * 100).toFixed(
            1
          )}%)，熔断器开启`;
        }
        break;

      case DedupCircuitBreakerState.OPEN:
        // 检查是否应该进入半开状态
        if (
          currentStatus.lastFailureTime &&
          this.decisionEngine.shouldEnterHalfOpen(currentStatus.lastFailureTime)
        ) {
          newState = DedupCircuitBreakerState.HALF_OPEN;
          reason = "熔断器进入半开状态，开始探测";
        }
        break;

      case DedupCircuitBreakerState.HALF_OPEN:
        // 检查是否应该关闭熔断器
        if (
          this.decisionEngine.shouldCloseCircuit(currentStatus.successCount)
        ) {
          newState = DedupCircuitBreakerState.CLOSED;
          reason = "连续成功次数达到阈值，熔断器关闭";
        }
        // 或者检查是否应该重新打开
        else if (
          this.decisionEngine.shouldOpenCircuit(
            stats.failureCount,
            stats.failureRate,
            stats.totalOperations
          )
        ) {
          newState = DedupCircuitBreakerState.OPEN;
          reason = "半开状态下仍有失败，重新开启熔断器";
        }
        break;
    }

    // 如果状态发生变化，更新数据库
    if (newState !== currentStatus.state) {
      await DedupCircuitBreakerStorageService.updateDedupCircuitBreakerState(
        request.accountId,
        request.taskType,
        newState,
        reason
      );

      // 更新状态对象
      currentStatus.state = newState;
      currentStatus.nextCheckTime =
        this.decisionEngine.calculateNextCheckTime(newState);
      currentStatus.stateHistory.push({
        state: newState,
        timestamp: now,
        reason,
      });
    }

    return currentStatus;
  }

  /**
   * 判断半开状态下是否允许请求
   */
  private async shouldAllowInHalfOpen(
    request: SafetyCheckRequest,
    _status: CircuitBreakerStatus
  ): Promise<boolean> {
    // 获取半开状态下的请求计数
    const recentOperations =
      await DedupCircuitBreakerStorageService.getFailureStatistics(
        request.accountId,
        request.taskType,
        5 // 最近5分钟
      );

    // 如果已达到半开状态的最大请求数，拒绝请求
    return recentOperations.totalOperations < this.config.halfOpenMaxRequests;
  }

  /**
   * 记录操作成功
   */
  async recordSuccess(request: SafetyCheckRequest): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    await DedupCircuitBreakerStorageService.recordOperationResult(
      request.accountId,
      request.taskType,
      true
    );
  }

  /**
   * 记录操作失败
   */
  async recordFailure(
    request: SafetyCheckRequest,
    errorMessage?: string
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    await DedupCircuitBreakerStorageService.recordOperationResult(
      request.accountId,
      request.taskType,
      false,
      errorMessage
    );
  }

  /**
   * 手动重置熔断器
   */
  async resetCircuitBreaker(
    accountId: string,
    taskType: "follow" | "reply"
  ): Promise<void> {
    await DedupCircuitBreakerStorageService.resetCircuitBreaker(
      accountId,
      taskType
    );
  }

  /**
   * 获取熔断器健康度评分 (0-100)
   */
  async getHealthScore(
    accountId: string,
    taskType: "follow" | "reply"
  ): Promise<number> {
    const status =
      await DedupCircuitBreakerStorageService.getCircuitBreakerStatus(
        accountId,
        taskType
      );

    switch (status.state) {
      case DedupCircuitBreakerState.CLOSED:
        // 基于失败率计算健康度
        return Math.max(0, 100 - status.failureRate * 100);

      case DedupCircuitBreakerState.HALF_OPEN:
        // 半开状态健康度中等
        return 50;

      case DedupCircuitBreakerState.OPEN:
        // 开启状态健康度最低
        return 0;

      default:
        return 0;
    }
  }

  /**
   * 获取恢复建议
   */
  getRecoveryRecommendations(status: CircuitBreakerStatus): string[] {
    const recommendations: string[] = [];

    switch (status.state) {
      case DedupCircuitBreakerState.OPEN:
        recommendations.push("系统已熔断，建议检查网络连接和设备状态");
        recommendations.push("等待自动恢复或手动重置熔断器");
        if (status.nextCheckTime) {
          recommendations.push(
            `预计 ${status.nextCheckTime.toLocaleTimeString()} 后进入半开状态`
          );
        }
        break;

      case DedupCircuitBreakerState.HALF_OPEN:
        recommendations.push("系统正在恢复中，请减少操作频率");
        recommendations.push("确保网络稳定后再继续操作");
        break;

      case DedupCircuitBreakerState.CLOSED:
        if (status.failureRate > 0.1) {
          // 失败率超过10%
          recommendations.push("系统运行正常，但失败率较高，建议关注");
          recommendations.push("检查网络质量和设备性能");
        }
        break;
    }

    return recommendations;
  }
}
