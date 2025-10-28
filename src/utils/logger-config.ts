// src/utils/logger-config.ts
// module: utils | layer: infrastructure | role: logger-configuration
// summary: 日志级别控制器 - 优化控制台输出

/**
 * 🎯 日志级别配置
 * 
 * 使用场景：
 * 1. 开发调试时，可以开启所有日志
 * 2. 生产环境或日志过多时，只保留错误和警告
 * 3. 追踪特定问题时，可以只开启相关类别的日志
 */
export const LOG_LEVELS = {
  // ============ 必须保留 ============
  CRITICAL_ERROR: true,   // ❌ 致命错误（XML缺失、后端失败等）
  WARNING: true,          // ⚠️ 警告信息（缓存未命中、数据不完整等）
  DATA_FLOW: true,        // 🔄 数据流日志（元素选择、XML获取、后端发送）
  
  // ============ 可选噪音（默认关闭） ============
  COMPONENT_MOUNT: false, // 🚀 组件挂载/卸载（CompactStrategyMenu、DraggableStepCard等）
  RENDER: false,          // 🎯 组件渲染日志（每次render都触发）
  PROGRESS: false,        // 📊 进度更新日志（5/25/65/85/95/100%）
  STATE_SYNC: false,      // 🔄 状态同步日志（analyzing→completed等）
  CONFIG: false,          // 📋 配置日志（pageFinderProps等）
  EVENT: false,           // 📡 事件日志（analysis:progress、analysis:done等）
  BRIDGE: false,          // 🔗 桥接日志（job映射、卡片同步等）
};

/**
 * 🚫 防抖日志 - 避免短时间内重复打印相同日志
 * 
 * @param key - 日志唯一标识
 * @param message - 日志消息
 * @param args - 附加参数
 * @param interval - 防抖时间间隔（毫秒），默认5秒
 */
const logCache = new Map<string, number>();

export function logOnce(
  key: string,
  message: string,
  args?: any,
  interval: number = 5000
): void {
  const now = Date.now();
  const lastLog = logCache.get(key);
  
  if (!lastLog || now - lastLog > interval) {
    if (args) {
      console.log(message, args);
    } else {
      console.log(message);
    }
    logCache.set(key, now);
  }
}

/**
 * 🔍 条件日志 - 只在条件满足时打印
 * 
 * @param condition - 是否打印的条件
 * @param level - 日志级别（对应 LOG_LEVELS 的 key）
 * @param message - 日志消息
 * @param args - 附加参数
 */
export function logIf(
  condition: boolean,
  level: keyof typeof LOG_LEVELS,
  message: string,
  args?: any
): void {
  if (condition && LOG_LEVELS[level]) {
    if (args) {
      console.log(message, args);
    } else {
      console.log(message);
    }
  }
}

/**
 * 📊 进度日志聚合器 - 合并相同任务的进度更新
 * 
 * 使用场景：
 * - 分析进度从 5% → 25% → 65% → 85% → 95% → 100%
 * - 只打印关键节点（0%, 25%, 50%, 75%, 100%）
 */
const progressCache = new Map<string, number>();

export function logProgress(
  jobId: string,
  progress: number,
  message: string,
  args?: any
): void {
  if (!LOG_LEVELS.PROGRESS) return;
  
  const lastProgress = progressCache.get(jobId) || 0;
  const isKeyMilestone = progress === 0 || progress === 25 || progress === 50 || progress === 75 || progress === 100;
  const progressJump = Math.abs(progress - lastProgress) >= 25; // 进度跳跃超过25%
  
  if (isKeyMilestone || progressJump) {
    if (args) {
      console.log(message, { ...args, progress: `${progress}%` });
    } else {
      console.log(message, { progress: `${progress}%` });
    }
    progressCache.set(jobId, progress);
  }
}

/**
 * 🎨 彩色日志工具
 */
export const colorLog = {
  error: (message: string, args?: any) => {
    console.error(`%c${message}`, 'color: #ff4d4f; font-weight: bold;', args);
  },
  warn: (message: string, args?: any) => {
    console.warn(`%c${message}`, 'color: #faad14; font-weight: bold;', args);
  },
  success: (message: string, args?: any) => {
    console.log(`%c${message}`, 'color: #52c41a; font-weight: bold;', args);
  },
  info: (message: string, args?: any) => {
    console.log(`%c${message}`, 'color: #1890ff;', args);
  },
  dataFlow: (message: string, args?: any) => {
    if (LOG_LEVELS.DATA_FLOW) {
      console.log(`%c${message}`, 'color: #722ed1; font-weight: bold;', args);
    }
  },
};

/**
 * 🔧 调试工具：临时启用所有日志
 */
export function enableAllLogs(): void {
  Object.keys(LOG_LEVELS).forEach(key => {
    (LOG_LEVELS as any)[key] = true;
  });
  console.log('✅ 所有日志已启用');
}

/**
 * 🔇 调试工具：只保留错误和警告
 */
export function silentMode(): void {
  Object.keys(LOG_LEVELS).forEach(key => {
    if (key !== 'CRITICAL_ERROR' && key !== 'WARNING') {
      (LOG_LEVELS as any)[key] = false;
    }
  });
  console.log('🔇 静默模式：只保留错误和警告');
}

/**
 * 🎯 调试工具：数据流追踪模式
 */
export function dataFlowMode(): void {
  silentMode();
  LOG_LEVELS.DATA_FLOW = true;
  console.log('🔍 数据流追踪模式');
}

// 暴露到全局，方便控制台调试
if (typeof window !== 'undefined') {
  (window as any).loggerConfig = {
    levels: LOG_LEVELS,
    enableAll: enableAllLogs,
    silent: silentMode,
    dataFlow: dataFlowMode,
  };
  
  console.log(
    '%c📋 日志配置已加载',
    'color: #1890ff; font-size: 14px; font-weight: bold;',
    '\n使用 window.loggerConfig 进行控制：',
    '\n  - loggerConfig.enableAll()  // 启用所有日志',
    '\n  - loggerConfig.silent()     // 静默模式（只保留错误）',
    '\n  - loggerConfig.dataFlow()   // 数据流追踪模式',
    '\n  - loggerConfig.levels       // 查看当前配置'
  );
}
