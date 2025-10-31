// src/services/backend-health-check.ts
// module: services | layer: services | role: 后端健康检查服务
// summary: 通过心跳机制监测 Rust backend 可用性

import { invoke } from '@tauri-apps/api/core';

interface HealthCheckResult {
  healthy: boolean;
  lastCheckTime: number;
  error?: string;
  message?: string;
  responseTime?: number;
  endpoint?: string;
  version?: string;
}

class BackendHealthChecker {
  private static instance: BackendHealthChecker;
  private healthStatus: HealthCheckResult = {
    healthy: true,
    lastCheckTime: Date.now(),
  };
  private checkInterval: number | null = null;
  private readonly INTERVAL_MS = 30000; // 30秒检查一次
  private readonly TIMEOUT_MS = 5000; // 5秒超时

  private constructor() {
    this.startMonitoring();
  }

  static getInstance(): BackendHealthChecker {
    if (!BackendHealthChecker.instance) {
      BackendHealthChecker.instance = new BackendHealthChecker();
    }
    return BackendHealthChecker.instance;
  }

  /**
   * 启动后台健康检查
   */
  startMonitoring(): void {
    if (this.checkInterval !== null) return;

    // 立即执行一次检查
    this.performCheck();

    // 设置定时检查
    this.checkInterval = window.setInterval(() => {
      this.performCheck();
    }, this.INTERVAL_MS);

    console.log('✅ Backend health monitoring started');
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('⏸️ Backend health monitoring stopped');
    }
  }

  /**
   * 执行健康检查（使用 ping 命令）
   */
  private async performCheck(): Promise<void> {
    const startTime = Date.now();

    try {
      // 使用轻量级 Tauri command 进行健康检查
      // 假设存在 'backend_ping' 命令，返回 { success: boolean }
      const result = await Promise.race([
        invoke<{ success: boolean }>('backend_ping'),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.TIMEOUT_MS)
        ),
      ]);

      const latency = Date.now() - startTime;

      if (result.success) {
        this.healthStatus = {
          healthy: true,
          lastCheckTime: Date.now(),
        };
                // const latency = Date.now() - startTime;
        // console.log(`✅ Backend health check passed (${latency}ms)`);
      } else {
        throw new Error('Backend ping returned false');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('⚠️ Backend health check failed:', errorMessage);

      this.healthStatus = {
        healthy: false,
        lastCheckTime: Date.now(),
        error: errorMessage,
      };
    }
  }

  /**
   * 获取当前健康状态
   */
  getStatus(): HealthCheckResult {
    return { ...this.healthStatus };
  }

  /**
   * 手动触发一次检查（同步返回缓存状态，异步更新）
   */
  checkNow(): HealthCheckResult {
    this.performCheck(); // 异步执行
    return this.getStatus(); // 立即返回当前状态
  }

  /**
   * 判断后端是否健康（带过期检查）
   */
  isHealthy(): boolean {
    const now = Date.now();
    const timeSinceLastCheck = now - this.healthStatus.lastCheckTime;

    // 如果超过2倍检查间隔未更新，视为不健康
    if (timeSinceLastCheck > this.INTERVAL_MS * 2) {
      console.warn('⚠️ Backend health status is stale');
      return false;
    }

    return this.healthStatus.healthy;
  }
}

// 导出单例
export const backendHealthChecker = BackendHealthChecker.getInstance();

// 导出便捷函数
export const isBackendHealthy = (): boolean => {
  return backendHealthChecker.isHealthy();
};

export const getBackendHealthStatus = (): HealthCheckResult => {
  return backendHealthChecker.getStatus();
};

export const checkBackendHealth = (): HealthCheckResult => {
  return backendHealthChecker.checkNow();
};
