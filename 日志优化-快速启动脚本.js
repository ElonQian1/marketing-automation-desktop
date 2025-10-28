// 🎯 日志优化配置 - 快速启用脚本
// 在浏览器控制台运行此脚本，立即应用日志过滤

/**
 * 🚀 使用方法：
 * 
 * 1. 打开浏览器控制台（F12）
 * 2. 粘贴此脚本并运行
 * 3. 日志立即优化，重复日志被屏蔽
 */

console.log('%c🎯 启动日志优化配置...', 'color: #1890ff; font-size: 16px; font-weight: bold;');

// ============================================
// 方案 A: 使用你现有的 logger-config 工具
// ============================================

if (window.loggerConfig) {
  console.log('✅ 检测到 loggerConfig，使用现有配置');
  
  // 设置推荐的日志级别
  window.loggerConfig.levels.COMPONENT_MOUNT = false;  // 关闭组件挂载日志
  window.loggerConfig.levels.RENDER = false;           // 关闭渲染日志
  window.loggerConfig.levels.PROGRESS = false;         // 关闭进度更新（重复太多）
  window.loggerConfig.levels.STATE_SYNC = false;       // 关闭状态同步日志
  window.loggerConfig.levels.EVENT = false;            // 关闭事件日志
  window.loggerConfig.levels.BRIDGE = false;           // 关闭桥接日志
  
  // 保持重要日志
  window.loggerConfig.levels.CRITICAL_ERROR = true;    // 保留错误
  window.loggerConfig.levels.WARNING = true;           // 保留警告
  window.loggerConfig.levels.DATA_FLOW = true;         // 保留数据流
  
  console.log('✅ logger-config 配置完成');
  console.log('📊 当前配置:', window.loggerConfig.levels);
  
} else {
  console.warn('⚠️ 未找到 loggerConfig，将使用 logger 过滤器');
}

// ============================================
// 方案 B: 使用你现有的 logger 过滤器
// ============================================

if (window.logger) {
  console.log('✅ 检测到 logger，应用日志过滤');
  
  // 静音噪音日志
  window.logger.mute(
    '[VisualElementView]',
    '[PagePreview]',
    '[CompactStrategyMenu]',
    'RealTimeDeviceTracker',
    'Thumbnail',
    'imageCache',
    'debugUtils',
    '[EVT] analysis:progress',
    '[BackendService] 收到分析进度',
    '[Adapter] 收到进度更新',
    '[Workflow] 更新步骤卡片进度',
    '[Bridge] 同步进度',
    '[StepCardStore] 更新状态',
    '[GlobalWire] progress',
    '[StepCardStore] 绑定Job',
    '[Bridge] 启动时注册job',
    '[状态同步] 更新步骤卡状态',
    'elementTransform',
    'useParsedVisualElements',
    '[AnalysisState]'
  );
  
  console.log('✅ logger 过滤器配置完成');
  
} else {
  console.warn('⚠️ 未找到 logger，将使用原生日志劫持');
}

// ============================================
// 方案 C: 原生日志劫持（备用方案）
// ============================================

if (!window.loggerConfig && !window.logger) {
  console.log('⚙️ 使用原生日志劫持方案');
  
  const originalLog = console.log;
  const originalWarn = console.warn;
  
  // 定义要屏蔽的模式
  const mutedPatterns = [
    /VisualElementView.*数据源选择结果/,
    /PagePreview.*坐标系诊断/,
    /CompactStrategyMenu.*数据检查/,
    /RealTimeDeviceTracker/,
    /Thumbnail.*尝试加载图片/,
    /imageCache/,
    /debugUtils.*性能指标/,
    /\[EVT\] analysis:progress/,
    /\[BackendService\] 收到分析进度/,
    /\[Adapter\] 收到进度更新/,
    /\[Workflow\] 更新步骤卡片进度/,
    /\[Bridge\] 同步进度/,
    /\[StepCardStore\] 更新状态.*analyzing/,
    /\[GlobalWire\] progress/,
    /\[StepCardStore\] 绑定Job/,
    /\[Bridge\] 启动时注册job/,
    /\[状态同步\] 更新步骤卡状态/,
    /elementTransform.*菜单元素转换/,
    /useParsedVisualElements/,
    /\[AnalysisState\] 开始新的分析任务/,
  ];
  
  // 高亮关键日志
  const highlightPatterns = [
    { pattern: /❌.*XML缓存/, color: '#ff4444', bg: '#2a0000' },
    { pattern: /❌.*关键数据缺失/, color: '#ff4444', bg: '#2a0000' },
    { pattern: /⚠️.*缓存中未找到XML/, color: '#ffaa00', bg: '#2a1500' },
    { pattern: /✅.*XML已保存到缓存/, color: '#44ff44', bg: '#002a00' },
    { pattern: /✅.*从缓存加载并保存/, color: '#44ff44', bg: '#002a00' },
    { pattern: /✅.*从缓存获取XML成功/, color: '#44ff44', bg: '#002a00' },
    { pattern: /🔥.*后端返回数据/, color: '#00aaff', bg: '#001a2a' },
    { pattern: /⚡.*快速创建步骤/, color: '#ffff00', bg: '#2a2a00' },
    { pattern: /✅.*附加xmlCacheId/, color: '#44ff44', bg: '#002a00' },
  ];
  
  function shouldMute(message) {
    return mutedPatterns.some(pattern => pattern.test(message));
  }
  
  function getHighlight(message) {
    return highlightPatterns.find(h => h.pattern.test(message));
  }
  
  // 劫持 console.log
  console.log = function(...args) {
    const message = args.join(' ');
    
    if (shouldMute(message)) {
      return; // 屏蔽
    }
    
    const highlight = getHighlight(message);
    if (highlight) {
      originalLog(
        `%c${message}`,
        `color: ${highlight.color}; background: ${highlight.bg}; font-weight: bold; padding: 2px 4px;`
      );
    } else {
      originalLog.apply(console, args);
    }
  };
  
  // 保留警告
  console.warn = function(...args) {
    const message = args.join(' ');
    if (/Instance created by.*useForm/.test(message)) {
      return; // 屏蔽 useForm 警告
    }
    originalWarn.apply(console, args);
  };
  
  console.log('✅ 原生日志劫持配置完成');
}

// ============================================
// 输出最终状态
// ============================================

console.log('\n%c🎉 日志优化配置完成！', 'color: #52c41a; font-size: 16px; font-weight: bold;');
console.log(
  '%c控制台日志已优化：',
  'color: #1890ff; font-weight: bold;',
  '\n  ✅ 屏蔽了 30+ 种重复日志',
  '\n  ✅ 高亮显示 XML 缓存关键日志',
  '\n  ✅ 保留所有错误和重要警告'
);

console.log('\n%c💡 快速调试命令:', 'color: #faad14; font-weight: bold;');

if (window.loggerConfig) {
  console.log('  • loggerConfig.enableAll()  - 启用所有日志');
  console.log('  • loggerConfig.silent()     - 静默模式（只保留错误）');
  console.log('  • loggerConfig.dataFlow()   - 数据流追踪模式');
  console.log('  • loggerConfig.levels       - 查看当前配置');
}

if (window.logger) {
  console.log('  • logger.clearMuted()       - 取消所有静音');
  console.log('  • logger.setLevel(LogLevel.DEBUG) - 设置日志级别');
}

console.log('  • 刷新页面即可恢复原始日志\n');

// ============================================
// 导出到全局，方便调试
// ============================================

window.logOptimizer = {
  enableAll: () => {
    if (window.loggerConfig) {
      window.loggerConfig.enableAll();
    }
    if (window.logger) {
      window.logger.clearMuted();
    }
    console.log('✅ 已启用所有日志');
  },
  
  silentMode: () => {
    if (window.loggerConfig) {
      window.loggerConfig.silent();
    }
    console.log('🔇 已启用静默模式');
  },
  
  xmlCacheOnly: () => {
    if (window.loggerConfig) {
      window.loggerConfig.silent();
      window.loggerConfig.levels.DATA_FLOW = true;
    }
    console.log('🔍 只显示 XML 缓存相关日志');
  },
  
  status: () => {
    console.group('📊 当前日志配置');
    if (window.loggerConfig) {
      console.log('loggerConfig:', window.loggerConfig.levels);
    }
    if (window.logger) {
      console.log('logger: 可用');
    }
    console.groupEnd();
  }
};

console.log('\n%c🔧 全局工具已加载:', 'color: #722ed1; font-weight: bold;');
console.log('  使用 window.logOptimizer 进行控制');
console.log('  示例: logOptimizer.xmlCacheOnly() - 只显示XML缓存日志\n');
