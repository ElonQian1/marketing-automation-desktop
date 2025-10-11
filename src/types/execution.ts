// src/types/execution.ts
// module: shared | layer: types | role: 类型定义
// summary: TypeScript接口和类型声明

export interface ExecutorConfig {
  default_timeout_ms: number;
  default_retry_count: number;
  page_recognition_enabled: boolean;
  auto_verification_enabled: boolean;
  smart_recovery_enabled: boolean;
  detailed_logging: boolean;
}

export interface SmartExecutionResult {
  success: boolean;
  total_steps: number;
  executed_steps: number;
  failed_steps: number;
  skipped_steps: number;
  duration_ms: number;
  logs: any[];
  final_page_state?: string;
  extracted_data: Record<string, any>;
  message: string;
}
