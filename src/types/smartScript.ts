// src/types/smartScript.ts
// module: shared | layer: types | role: 类型定义
// summary: TypeScript接口和类型声明

// 动作类型定义
export type ActionKind = 
  | 'tap'
  | 'long_press' 
  | 'double_tap'
  | 'swipe'
  | 'input'
  | 'wait'
  | 'back'
  | 'keyevent'
  | 'find_only'; // 仅查找，不执行动作

// 步骤动作配置
export interface StepAction {
  kind: ActionKind;
  params?: {
    // tap, long_press, double_tap
    tapOffset?: { x: number; y: number }; // 相对元素bounds的偏移(0~1)，默认中心 {0.5,0.5}
    durationMs?: number;

    // swipe
    swipe?: {
      direction: 'up' | 'down' | 'left' | 'right';
      distancePx?: number;
      durationMs?: number;
      startOffset?: { x: number; y: number };
    };

    // input
    text?: string;
    clearBefore?: boolean;

    // wait
    waitMs?: number;

    // keyevent
    keyCode?: number;
  };

  postCheck?: {
    expectVisible?: boolean;
    expectGone?: boolean;
    textContains?: string;
    timeoutMs?: number;
  };
}

// 智能脚本相关类型定义
export interface SmartScriptStep {
  id: string;
  step_type: any; // 兼容 SmartActionType 和 string
  name: string;
  description: string;
  parameters: Record<string, any>;
  enabled: boolean;
  order: number;
  // 扩展字段以支持智能功能
  find_condition?: any;
  verification?: any;
  retry_config?: any;
  fallback_actions?: SmartScriptStep[];
  pre_conditions?: string[];
  post_conditions?: string[];
  // 新增：动作配置
  action?: StepAction;
}

export interface SingleStepTestResult {
  success: boolean;
  step_id: string;
  step_name: string;
  message: string;
  duration_ms: number;
  timestamp: number;
  page_state?: string;
  ui_elements: any[];
  logs: string[];
  error_details?: string;
  extracted_data: Record<string, any>;
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