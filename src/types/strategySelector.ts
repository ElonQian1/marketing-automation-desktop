// src/types/strategySelector.ts
// module: types | layer: types | role: 策略选择器类型定义
// summary: 定义策略选择器的数据结构和状态

/**
 * 🧠 策略选择器核心类型系统
 */

// 策略类型
export type StrategyType = 'smart-auto' | 'smart-single' | 'static';

// 智能策略步骤
export type SmartStep = 'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'step6';

// 候选策略项
export interface StrategyCandidate {
  key: string;                    // 策略唯一标识
  type: 'smart' | 'static';       // 策略类型
  name: string;                   // 策略显示名称
  confidence: number;             // 置信度 (0-1)
  selector: string;               // 选择器字符串 (XPath/CSS)
  description?: string;           // 策略描述
  stepName?: SmartStep;           // 智能策略对应的步骤
  estimatedTime?: number;         // 预估执行时间(ms)
  riskLevel?: 'low' | 'medium' | 'high'; // 风险等级
}

// 分析状态
export interface AnalysisState {
  status: 'idle' | 'analyzing' | 'completed' | 'failed';
  jobId?: string;                 // 分析任务ID
  progress?: number;              // 进度 (0-100)
  eta?: number;                   // 预估剩余时间(ms)
  error?: string;                 // 错误信息
  completedAt?: Date;             // 完成时间
}

// 策略选择器状态
export interface StrategySelector {
  // 当前选择的策略
  activeStrategy: {
    type: StrategyType;
    key?: string;                 // 具体策略的key
    stepName?: SmartStep;         // 智能单步的步骤名
  };
  
  // 分析状态
  analysis: AnalysisState;
  
  // 候选策略
  candidates?: {
    smart: StrategyCandidate[];   // 智能策略候选
    static: StrategyCandidate[];  // 静态策略候选
  };
  
  // 推荐策略
  recommended?: {
    key: string;
    confidence: number;
    autoApplied?: boolean;        // 是否自动应用
    appliedAt?: Date;             // 应用时间
  };
  
  // 配置
  config: {
    autoFollowSmart: boolean;     // 是否自动跟随智能推荐
    confidenceThreshold: number;  // 自动应用的置信度阈值 (默认0.82)
    enableFallback: boolean;      // 是否启用兜底策略
  };
}

// 策略选择器事件
export interface StrategyEvents {
  onStrategyChange: (selection: { type: StrategyType; key?: string; stepName?: SmartStep }) => void;
  onReanalyze: () => void;
  onSaveAsStatic: (candidate: StrategyCandidate) => void;
  onOpenElementInspector: () => void;
  onCancelAnalysis: (jobId: string) => void;
  onApplyRecommendation: (key: string) => void;
}