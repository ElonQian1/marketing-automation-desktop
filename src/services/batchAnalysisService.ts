// src/services/batchAnalysisService.ts
// module: lead-hunt | layer: services | role: 批量分析前端服务
// summary: 调用后端批量分析API和监听进度事件

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface BatchAnalysisProgress {
  batchId: string;
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentComment: string | null;
  status: 'processing' | 'completed' | 'failed' | 'partial';
}

export interface BatchAnalysisOptions {
  concurrency?: number;
  maxRetries?: number;
}

/**
 * 批量分析服务
 */
export class BatchAnalysisService {
  private progressListeners: Map<string, (progress: BatchAnalysisProgress) => void> = new Map();

  constructor() {
    this.setupEventListener();
  }

  /**
   * 启动批量分析
   */
  async startBatchAnalysis(
    commentIds: string[],
    batchId: string,
    options?: BatchAnalysisOptions,
    onProgress?: (progress: BatchAnalysisProgress) => void
  ): Promise<void> {
    // 注册进度监听器
    if (onProgress) {
      this.progressListeners.set(batchId, onProgress);
    }

    try {
      await invoke('lh_analyze_comments', {
        commentIds,
        batchId,
        concurrency: options?.concurrency,
        maxRetries: options?.maxRetries,
      });
    } catch (error) {
      // 清理监听器
      this.progressListeners.delete(batchId);
      throw error;
    }
  }

  /**
   * 取消进度监听
   */
  removeProgressListener(batchId: string): void {
    this.progressListeners.delete(batchId);
  }

  /**
   * 设置事件监听器
   */
  private async setupEventListener(): Promise<void> {
    await listen<BatchAnalysisProgress>('ai://progress', (event) => {
      const progress = event.payload;
      const listener = this.progressListeners.get(progress.batchId);
      
      if (listener) {
        listener(progress);
        
        // 如果分析完成，自动清理监听器
        if (progress.status === 'completed' || progress.status === 'failed') {
          this.progressListeners.delete(progress.batchId);
        }
      }
    });
  }

  /**
   * 生成批次ID
   */
  static generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 全局单例
export const batchAnalysisService = new BatchAnalysisService();