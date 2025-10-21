// src/features/leadHunt/backendAnalysis.ts  
// module: lead-hunt | layer: features | role: 后端批量分析接口
// summary: 调用后端批量分析API，支持进度跟踪和重试

import { batchAnalysisService, BatchAnalysisService, type BatchAnalysisProgress } from '../../services/batchAnalysisService';

export interface BackendAnalysisOptions {
  /** 并发数（可选，默认使用AI设置） */
  concurrency?: number;
  /** 最大重试次数（可选，默认3次） */
  maxRetries?: number;
  /** 进度回调函数 */
  onProgress?: (progress: BatchAnalysisProgress) => void;
}

/**
 * 使用后端批量分析评论
 * @param commentIds 评论ID列表
 * @param options 分析选项
 * @returns Promise<void> - 分析会异步完成，结果保存到数据库
 */
export async function analyzeCommentsOnBackend(
  commentIds: string[],
  options: BackendAnalysisOptions = {}
): Promise<string> {
  if (commentIds.length === 0) {
    throw new Error('评论ID列表不能为空');
  }

  // 生成批次ID
  const batchId = BatchAnalysisService.generateBatchId();
  
  console.log(`[BackendAnalysis] 启动批量分析: batchId=${batchId}, count=${commentIds.length}`);

  try {
    await batchAnalysisService.startBatchAnalysis(
      commentIds,
      batchId,
      {
        concurrency: options.concurrency,
        maxRetries: options.maxRetries,
      },
      options.onProgress
    );

    return batchId;
  } catch (error) {
    console.error('[BackendAnalysis] 启动失败:', error);
    throw new Error(`批量分析启动失败: ${error}`);
  }
}

/**
 * 取消进度监听
 * @param batchId 批次ID
 */
export function cancelProgressListener(batchId: string): void {
  batchAnalysisService.removeProgressListener(batchId);
}