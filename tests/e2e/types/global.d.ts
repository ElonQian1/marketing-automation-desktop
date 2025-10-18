// tests/e2e/types/global.d.ts
// module: testing | layer: e2e | role: E2E测试全局类型声明
// summary: 为E2E测试中的浏览器环境扩展Window接口

export interface ProgressEventDetail {
  progress: number;
  jobId: string;
  timestamp?: number;
}

export interface CompletionEventDetail {
  progress: number;
  jobId: string;
  success: boolean;
}

declare global {
  interface Window {
    // 进度事件跟踪
    progressEvents: ProgressEventDetail[];
    lastProgressEvent: ProgressEventDetail | null;
    
    // 完成事件跟踪
    completionEvents: CompletionEventDetail[];
    
    // 测试辅助方法
    simulateProgressEvents: () => void;
  }
}