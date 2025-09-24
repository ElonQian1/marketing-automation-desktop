import { SmartActionType } from "../../../types/smartComponents";

// 与页面内原常量保持完全一致，纯搬迁，勿改动结构/默认值/文案
export const SMART_ACTION_CONFIGS = {
  // 通讯录自动化操作 - 置顶优先显示
  [SmartActionType.CONTACT_IMPORT_WORKFLOW]: {
    name: "通讯录导入",
    description: "完整的通讯录导入工作流程",
    icon: "📱",
    color: "green",
    category: "contact",
    parameters: [],
    advanced: [
      {
        key: "confidence_threshold",
        label: "置信度阈值",
        type: "slider",
        min: 0.1,
        max: 1.0,
        default: 0.8,
      },
      { key: "retry_count", label: "重试次数", type: "number", default: 3 },
      {
        key: "timeout_ms",
        label: "超时时间(ms)",
        type: "number",
        default: 10000,
      },
    ],
  },

  [SmartActionType.SMART_FIND_ELEMENT]: {
    name: "智能元素查找",
    description: "动态查找并定位UI元素",
    icon: "🔍",
    color: "purple",
    category: "smart",
    parameters: [
      {
        key: "search_criteria",
        label: "搜索条件",
        type: "textarea",
        required: true,
      },
      {
        key: "click_if_found",
        label: "找到后点击",
        type: "boolean",
        default: false,
      },
      {
        key: "extract_attributes",
        label: "提取属性",
        type: "multiselect",
        options: ["text", "bounds", "resource_id", "class_name"],
        default: ["text", "bounds"],
      },
    ],
    advanced: [
      { key: "bounds_filter", label: "坐标范围过滤", type: "bounds" },
      {
        key: "element_type_filter",
        label: "元素类型过滤",
        type: "select",
        options: ["Button", "TextView", "EditText", "ImageView", "Any"],
        default: "Any",
      },
    ],
  },

  [SmartActionType.RECOGNIZE_PAGE]: {
    name: "页面识别",
    description: "智能识别当前页面状态",
    icon: "📱",
    color: "orange",
    category: "smart",
    parameters: [
      {
        key: "expected_state",
        label: "期望页面状态",
        type: "select",
        required: false,
        options: [
          "Unknown",
          "Home",
          "AppMainPage",
          "Loading",
          "Dialog",
          "Settings",
          "ListPage",
          "DetailPage",
        ],
      },
      {
        key: "confidence_threshold",
        label: "置信度阈值",
        type: "slider",
        min: 0.1,
        max: 1.0,
        default: 0.7,
      },
    ],
    advanced: [
      {
        key: "save_recognition_result",
        label: "保存识别结果",
        type: "boolean",
        default: true,
      },
      {
        key: "screenshot_on_fail",
        label: "失败时截图",
        type: "boolean",
        default: true,
      },
    ],
  },

  [SmartActionType.VERIFY_ACTION]: {
    name: "操作验证",
    description: "验证操作是否成功执行",
    icon: "✅",
    color: "red",
    category: "verification",
    parameters: [
      {
        key: "verify_type",
        label: "验证类型",
        type: "select",
        required: true,
        options: [
          "text_change",
          "page_state_change",
          "element_exists",
          "element_disappears",
        ],
        default: "text_change",
      },
      {
        key: "expected_result",
        label: "期望结果",
        type: "text",
        required: true,
      },
      {
        key: "timeout_ms",
        label: "验证超时(ms)",
        type: "number",
        default: 5000,
      },
    ],
    advanced: [
      {
        key: "retry_interval_ms",
        label: "重试间隔(ms)",
        type: "number",
        default: 1000,
      },
      { key: "max_retries", label: "最大重试次数", type: "number", default: 3 },
    ],
  },

  [SmartActionType.WAIT_FOR_PAGE_STATE]: {
    name: "等待页面状态",
    description: "等待页面切换到指定状态",
    icon: "⏳",
    color: "cyan",
    category: "smart",
    parameters: [
      {
        key: "expected_state",
        label: "期望页面状态",
        type: "select",
        required: true,
        options: [
          "Home",
          "AppMainPage",
          "Loading",
          "Dialog",
          "Settings",
          "ListPage",
          "DetailPage",
        ],
      },
      {
        key: "timeout_ms",
        label: "超时时间(ms)",
        type: "number",
        default: 10000,
      },
      {
        key: "check_interval_ms",
        label: "检查间隔(ms)",
        type: "number",
        default: 1000,
      },
    ],
  },

  [SmartActionType.EXTRACT_ELEMENT]: {
    name: "提取元素信息",
    description: "提取UI元素的详细信息",
    icon: "📊",
    color: "magenta",
    category: "data",
    parameters: [
      {
        key: "target_elements",
        label: "目标元素",
        type: "textarea",
        required: true,
      },
      {
        key: "extract_fields",
        label: "提取字段",
        type: "multiselect",
        required: true,
        options: [
          "text",
          "bounds",
          "center",
          "clickable",
          "resource_id",
          "class_name",
        ],
        default: ["text", "bounds", "clickable"],
      },
    ],
    advanced: [
      { key: "save_to_variable", label: "保存到变量", type: "text" },
      {
        key: "format_output",
        label: "输出格式",
        type: "select",
        options: ["json", "csv", "plain"],
        default: "json",
      },
    ],
  },

  [SmartActionType.SMART_NAVIGATION]: {
    name: "智能导航",
    description: "智能识别并点击导航栏按钮（底部、顶部、侧边、悬浮导航栏）",
    icon: "🧭",
    color: "geekblue",
    category: "smart",
    parameters: [
      {
        key: "navigation_type",
        label: "导航栏类型",
        type: "select",
        required: true,
        options: ["bottom", "top", "side", "floating"],
        default: "bottom",
      },
      { key: "app_name", label: "应用名称", type: "text", required: true },
      { key: "button_name", label: "按钮名称", type: "text", required: true },
      {
        key: "click_action",
        label: "点击方式",
        type: "select",
        options: ["single_tap", "double_tap", "long_press"],
        default: "single_tap",
      },
    ],
    advanced: [
      { key: "position_ratio", label: "位置范围", type: "bounds" },
      {
        key: "button_patterns",
        label: "按钮模式",
        type: "multiselect",
        options: [
          "首页",
          "市集",
          "发布",
          "消息",
          "我",
          "微信",
          "通讯录",
          "发现",
        ],
      },
      { key: "retry_count", label: "重试次数", type: "number", default: 3 },
      {
        key: "timeout_ms",
        label: "超时时间(ms)",
        type: "number",
        default: 10000,
      },
    ],
  },

  // 应用操作 - 新增
  [SmartActionType.LAUNCH_APP]: {
    name: "打开应用",
    description: "智能选择并启动设备上的应用程序",
    icon: "🚀",
    color: "cyan",
    category: "app",
    parameters: [
      {
        key: "app_selection_method",
        label: "应用选择方式",
        type: "select",
        required: true,
        options: ["manual", "auto_detect", "popular"],
        default: "manual",
      },
      {
        key: "wait_after_launch",
        label: "启动后等待时间(ms)",
        type: "number",
        default: 3000,
      },
      {
        key: "verify_launch",
        label: "验证启动成功",
        type: "boolean",
        default: true,
      },
    ],
    advanced: [
      {
        key: "fallback_method",
        label: "失败后操作",
        type: "select",
        options: ["retry", "ignore", "error"],
        default: "retry",
      },
      {
        key: "max_retry_count",
        label: "最大重试次数",
        type: "number",
        default: 3,
      },
    ],
  },

  [SmartActionType.COMPLETE_WORKFLOW]: {
    name: "完整工作流程",
    description: "执行完整的自动化工作流程",
    icon: "🚀",
    color: "gold",
    category: "workflow",
    parameters: [
      {
        key: "workflow_type",
        label: "工作流程类型",
        type: "select",
        required: true,
        options: [
          "xiaohongshu_follow",
          "contact_import",
          "app_automation",
          "custom",
        ],
      },
      {
        key: "workflow_config",
        label: "工作流程配置",
        type: "textarea",
        required: true,
      },
    ],
    advanced: [
      {
        key: "enable_smart_recovery",
        label: "启用智能恢复",
        type: "boolean",
        default: true,
      },
      {
        key: "detailed_logging",
        label: "详细日志记录",
        type: "boolean",
        default: true,
      },
      {
        key: "screenshot_on_error",
        label: "出错时截图",
        type: "boolean",
        default: true,
      },
    ],
  },

  // 循环控制操作
  [SmartActionType.LOOP_START]: {
    name: "循环开始",
    description: "标记循环体的开始",
    icon: "🔄",
    color: "blue",
    category: "loop",
    parameters: [
      {
        key: "loop_name",
        label: "循环名称",
        type: "text",
        required: true,
        default: "新循环",
      },
      {
        key: "loop_count",
        label: "循环次数",
        type: "number",
        required: true,
        default: 3,
      },
      {
        key: "break_condition",
        label: "跳出条件",
        type: "select",
        options: ["none", "page_change", "element_found", "element_not_found"],
        default: "none",
      },
      {
        key: "break_condition_value",
        label: "跳出条件值",
        type: "text",
        required: false,
      },
    ],
    advanced: [
      {
        key: "max_iterations",
        label: "最大迭代次数",
        type: "number",
        default: 100,
      },
      {
        key: "delay_between_loops",
        label: "循环间延迟(ms)",
        type: "number",
        default: 500,
      },
      {
        key: "enable_debug_logging",
        label: "启用调试日志",
        type: "boolean",
        default: false,
      },
    ],
  },

  [SmartActionType.LOOP_END]: {
    name: "循环结束",
    description: "标记循环体的结束",
    icon: "🏁",
    color: "blue",
    category: "loop",
    parameters: [
      { key: "loop_id", label: "对应循环ID", type: "text", required: true },
    ],
    advanced: [
      {
        key: "log_iteration_results",
        label: "记录迭代结果",
        type: "boolean",
        default: true,
      },
    ],
  },
} as const;

export type SmartActionConfigs = typeof SMART_ACTION_CONFIGS;
