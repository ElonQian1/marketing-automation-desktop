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
  smartCandidates?: Array<{
    key: string;
    description: string;
    confidence: number;
    xpath: string;
  }>;
  recommendedKey?: string;
}

export interface TestState {
  analysisStarted: boolean;
  analysisCompleted: boolean;
  progressEvents: ProgressEventDetail[];
  completionEvents: CompletionEventDetail[];
  errors: string[];
}

export interface ConcurrentTestState {
  jobs: Map<string, {
    jobId: string;
    elementSelector: string;
    receivedEvents: any[];
    expectedEvents: number;
    actualEvents: number;
  }>;
  allEvents: any[];
  crossContamination: any[];
}

export interface XorTestState {
  completionHandlerCalls: number;
  duplicateProcessingDetected: boolean;
}

declare global {
  interface Window {
    // 进度事件跟踪
    progressEvents: ProgressEventDetail[];
    lastProgressEvent: ProgressEventDetail | null;
    
    // 完成事件跟踪
    completionEvents: CompletionEventDetail[];
    
    // 测试状态管理
    testState: TestState;
    concurrentTestState: ConcurrentTestState;
    xorTestState: XorTestState;
    
    // 测试辅助方法
    simulateProgressEvents: () => void;
    simulateNormalConvergence: (jobId: string) => void;
    simulateConcurrentJobs: (jobA: string, jobB: string) => void;
    registerJob: (jobId: string, elementSelector: string) => void;
  }
}