// src/types/smartSelection.ts
// module: types | layer: domain | role: 智能选择系统核心类型定义
// summary: 定义智能选择系统的协议、策略、指纹等核心接口

/**
 * 元素指纹 - 用于精确识别和重定位元素
 */
export interface ElementFingerprint {
  // 文本特征
  text_content?: string;           // 元素文本内容
  text_hash?: string;              // 文本内容哈希
  
  // 结构特征
  class_chain?: string[];          // 类名链 ["LinearLayout", "TextView"]
  resource_id?: string;            // 完整资源ID
  resource_id_suffix?: string;     // 资源ID后缀 (如 "content" from "com.app:id/content")
  
  // 位置特征
  bounds_signature?: {             // 相对位置签名（0-1比例）
    x: number;                     // 中心X坐标比例
    y: number;                     // 中心Y坐标比例
    width: number;                 // 宽度比例
    height: number;                // 高度比例
  };
  
  // 上下文特征
  parent_class?: string;           // 父元素类名
  sibling_count?: number;          // 兄弟元素数量
  child_count?: number;            // 子元素数量
  
  // 层次特征
  depth_level?: number;            // 在DOM树中的深度
  relative_index?: number;         // 在兄弟元素中的索引
  
  // 属性特征
  clickable?: boolean;             // 是否可点击
  enabled?: boolean;               // 是否启用
  selected?: boolean;              // 是否选中
  
  // 额外标识符
  content_desc?: string;           // content-description
  package_name?: string;           // 包名
}

/**
 * 匹配上下文 - 定义匹配环境和约束
 */
export interface MatchingContext {
  // 容器约束
  container_xpath?: string;        // 限制搜索的容器XPath
  container_bounds?: {             // 容器边界
    left: number;
    top: number;  
    right: number;
    bottom: number;
  };
  
  // 可点击父元素
  clickable_parent_xpath?: string; // 最终要点击的可点击父元素
  
  // 多语言支持
  i18n_aliases?: string[];         // 文本同义词 ["关注", "+关注", "Follow"]
  
  // 匹配断言
  light_assertions?: {
    must_contain_text?: string[];  // 必须包含的文本
    must_be_clickable?: boolean;   // 必须可点击
    must_be_visible?: boolean;     // 必须可见
    exclude_text?: string[];       // 排除包含这些文本的元素 ["已关注", "关注中"]
  };
  
  // 搜索范围
  search_radius?: number;          // 上下文搜索半径（像素）
  max_candidates?: number;         // 最大候选数量
}

/**
 * 选择策略模式
 */
export type SelectionMode = 
  | 'auto'             // 自动模式：根据候选数量智能选择（零侵入兼容）
  | 'match-original'   // 精确匹配原选择的元素
  | 'first'            // 选择第一个
  | 'last'             // 选择最后一个  
  | 'random'           // 随机选择一个
  | 'all';             // 选择全部（批量操作）

/**
 * 选择配置
 */
export interface SelectionConfig {
  mode: SelectionMode;
  
  // 排序规则
  order?: 'dom' | 'visual-yx' | 'visual-xy'; // DOM顺序 | 视觉Y→X | 视觉X→Y
  
  // 随机选择配置
  random_seed?: number;            // 随机种子，用于复现
  
  // 批量操作配置（仅all模式）
  batch_config?: {
    interval_ms: number;           // 点击间隔（毫秒）
    max_count?: number;            // 最大点击数量限制
    jitter_ms?: number;            // 随机抖动时间
    continue_on_error: boolean;    // 遇到错误是否继续
    show_progress: boolean;        // 是否显示进度
  };
  
  // 过滤配置
  filters?: {
    exclude_states?: string[];     // 排除的状态文本
    min_confidence?: number;       // 最低置信度阈值
    position_tolerance?: number;   // 位置容错范围（像素）
  };
}

/**
 * 策略变体类型
 */
export type StrategyVariant =
  | 'SelfId'                      // 精确ID匹配
  | 'RegionTextToParent'          // 区域文本到父元素
  | 'RegionLocalIndexWithCheck'   // 区域局部索引加校验
  | 'NeighborRelative'            // 邻居相对位置
  | 'GlobalIndexWithStrongChecks' // 全局索引强校验
  | 'AbsoluteXPathFallback';      // 绝对XPath兜底

/**
 * 策略计划项
 */
export interface StrategyPlanItem {
  id: string;                     // 策略ID
  kind: StrategyVariant;          // 策略类型
  confidence: number;             // 预期置信度 (0-1)
  description: string;            // 策略描述
  params?: Record<string, any>;   // 策略参数
}

/**
 * 策略计划
 */
export interface StrategyPlan {
  selected: StrategyPlanItem;     // 当前选择的策略
  plan: StrategyPlanItem[];       // 有序策略链（从强到弱）
  recommended_index: number;      // 推荐策略索引
}

/**
 * 执行限制
 */
export interface ExecutionLimits {
  allow_backend_fallback: boolean;    // 允许后端策略回退
  time_budget_ms: number;             // 总时间预算
  per_candidate_budget_ms: number;    // 单候选项时间预算
  strict_mode: boolean;               // 严格模式（更严格的匹配要求）
  max_retry_count: number;            // 最大重试次数
}

/**
 * 智能选择协议 - 扩展StepCard的核心协议
 */
export interface SmartSelectionProtocol {
  // 核心定位信息
  anchor: {
    container_xpath?: string;       // 限域容器
    clickable_parent_xpath?: string; // 统一落点
    fingerprint: ElementFingerprint; // 元素指纹
  };
  
  // 选择策略
  selection: SelectionConfig;
  
  // 匹配上下文
  matching_context?: MatchingContext;
  
  // 策略计划
  strategy_plan?: StrategyPlan;
  
  // 执行限制
  limits?: ExecutionLimits;
  
  // 兼容性字段
  fallback?: {
    absolute_xpath?: string;        // 保留原有XPath兜底
    allow_fallback: boolean;        // 是否允许XPath兜底
  };
}

/**
 * 智能选择结果
 */
export interface SmartSelectionResult {
  success: boolean;
  message: string;
  
  // 匹配信息
  matched_elements: {
    total_found: number;            // 总共找到的元素数量
    filtered_count: number;         // 过滤后的数量
    selected_count: number;         // 实际选择的数量
    confidence_scores: number[];    // 各元素的置信度评分
  };
  
  // 执行信息
  execution_info?: {
    used_strategy: StrategyVariant; // 实际使用的策略
    fallback_used: boolean;         // 是否使用了兜底策略
    execution_time_ms: number;      // 执行耗时
    click_coordinates?: Array<{x: number, y: number}>; // 点击坐标列表
  };
  
  // 调试信息
  debug_info?: {
    candidate_analysis: string[];   // 候选分析日志
    strategy_attempts: string[];    // 策略尝试日志
    error_details?: string;         // 错误详情
  };
}

/**
 * 批量执行结果
 */
export interface BatchExecutionResult {
  total_targets: number;          // 总目标数量
  successful_clicks: number;      // 成功点击数量
  failed_clicks: number;          // 失败点击数量
  skipped_clicks: number;         // 跳过的点击数量
  total_time_ms: number;          // 总执行时间
  
  // 详细结果
  click_results: Array<{
    index: number;                  // 点击索引
    success: boolean;               // 是否成功
    coordinates: {x: number, y: number}; // 点击坐标
    error_message?: string;         // 错误消息
    time_ms: number;                // 单次耗时
  }>;
  
  // 进度信息
  progress_logs: string[];        // 进度日志
}

/**
 * 容错配置
 */
export interface ToleranceConfig {
  position_drift: number;         // 位置漂移容错范围（像素）
  retry_on_failure: number;       // 失败重试次数
  fallback_strategy: boolean;     // 是否启用兜底策略
  min_similarity_threshold: number; // 最低相似度阈值
}

/**
 * 智能选择统计
 */
export interface SmartSelectionStats {
  total_selections: number;       // 总选择次数
  success_rate: number;           // 成功率
  average_confidence: number;     // 平均置信度
  strategy_usage: Record<StrategyVariant, number>; // 各策略使用次数
  performance_metrics: {
    avg_execution_time_ms: number;
    avg_candidates_found: number;
    most_common_failures: string[];
  };
}