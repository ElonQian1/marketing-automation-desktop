// src/types/loopScript.ts
// module: shared | layer: types | role: 类型定义
// summary: TypeScript接口和类型声明

// 扩展智能脚本类型以支持循环逻辑

// 扩展步骤类型，添加循环控制类型
export enum LoopActionType {
  LOOP_START = 'loop_start',
  LOOP_END = 'loop_end'
}

// 循环配置接口
export interface LoopConfig {
  /** 循环ID，用于匹配开始和结束 */
  loopId: string;
  /** 循环次数 */
  iterations: number;
  /** 循环条件（可选，用于更复杂的循环逻辑） */
  condition?: string;
  /** 是否启用循环 */
  enabled: boolean;
  /** 循环名称 */
  name: string;
  /** 循环描述 */
  description?: string;
}

// 扩展的SmartScriptStep，支持循环
export interface ExtendedSmartScriptStep {
  id: string;
  step_type: string; // 包含原有类型和循环类型
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  enabled: boolean;
  order: number;
  
  // 循环相关字段
  loop_config?: LoopConfig; // 循环配置（仅循环开始步骤使用）
  parent_loop_id?: string; // 父循环ID，表示该步骤属于哪个循环
  is_in_loop?: boolean; // 是否在循环体内
  
  // 🧠 策略选择器支持
  enableStrategySelector?: boolean; // 是否启用策略选择器
  strategySelector?: {
    selectedStrategy: string;
    selectedStep: string;
    analysis: {
      status: 'ready' | 'analyzing' | 'completed' | 'failed';
      progress: number;
      result: unknown;
      error: string | null;
    };
  }; // 策略选择器状态数据
  
  // 原有扩展字段
  find_condition?: unknown;
  verification?: unknown;
  retry_config?: unknown;
  fallback_actions?: ExtendedSmartScriptStep[];
  pre_conditions?: string[];
  post_conditions?: string[];
}

// 循环执行结果
export interface LoopExecutionResult {
  success: boolean;
  loop_id: string;
  loop_name: string;
  total_iterations: number;
  completed_iterations: number;
  failed_iterations: number;
  duration_ms: number;
  step_results: unknown[]; // 每次循环的步骤执行结果
  error_message?: string;
}

// 扩展的脚本执行结果，支持循环信息
export interface ExtendedSmartExecutionResult {
  success: boolean;
  total_steps: number;
  executed_steps: number;
  failed_steps: number;
  skipped_steps: number;
  duration_ms: number;
  logs: unknown[];
  final_page_state?: string;
  extracted_data: Record<string, unknown>;
  message: string;
  
  // 循环执行信息
  loop_results?: LoopExecutionResult[];
  total_loops: number;
  completed_loops: number;
  failed_loops: number;
}