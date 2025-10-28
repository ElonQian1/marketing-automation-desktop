// 🎯 智能日志过滤器 V2 - 聚焦问题诊断
(function intelligentLogFilter() {
  const original = {
    log: console.log,
    warn: console.warn,
    error: console.error
  };

  // 🔍 关键问题标记（高亮显示）
  const CRITICAL_PATTERNS = {
    xmlCache: ['XML缓存', 'xmlCacheId', 'xmlContentLength', 'XML已保存'],
    dataIntegrity: ['数据完整性', 'original_xml', 'original_data'],
    elementSelection: ['智能修正', '用户选择的区域', '可点击子元素', '误选了容器'],
    evaluation: ['多候选评估', '综合评分', '最佳匹配', 'score='],
    execution: ['智能执行', '点击坐标', '执行成功', '执行失败'],
    errors: ['关键数据缺失', 'V3链式执行失败', 'ADB命令失败', '未找到XML缓存']
  };

  // 🚫 噪音模式（完全屏蔽）
  const NOISE_PATTERNS = [
    'PagePreview 坐标系诊断',
    '图片渲染成功',
    '尝试加载图片',
    '设置 data URL 源',
    'RealTimeDeviceTracker',
    'GlobalWire',
    '长时间无事件'
  ];

  // 📊 统计信息
  const stats = {
    total: 0,
    filtered: 0,
    critical: 0
  };

  function shouldLog(msg) {
    stats.total++;

    // 检查是否是噪音
    if (NOISE_PATTERNS.some(pattern => msg.includes(pattern))) {
      stats.filtered++;
      return false;
    }

    // 检查是否是关键信息
    for (const [category, patterns] of Object.entries(CRITICAL_PATTERNS)) {
      if (patterns.some(pattern => msg.includes(pattern))) {
        stats.critical++;
        return { critical: true, category };
      }
    }

    return false;
  }

  // 重写 console.log
  console.log = function(...args) {
    const msg = args.join(' ');
    const result = shouldLog(msg);

    if (result) {
      if (result.critical) {
        // 关键信息高亮
        const emoji = {
          xmlCache: '💾',
          dataIntegrity: '✅',
          elementSelection: '⚠️',
          evaluation: '🎯',
          execution: '🚀',
          errors: '❌'
        }[result.category] || '📌';

        original.log(`${emoji} [${result.category.toUpperCase()}]`, ...args);
      } else {
        original.log(...args);
      }
    }
  };

  // 保留 warn 和 error
  console.warn = function(...args) {
    const msg = args.join(' ');
    if (!NOISE_PATTERNS.some(p => msg.includes(p))) {
      original.warn('⚠️', ...args);
    }
  };

  console.error = function(...args) {
    original.error('❌', ...args);
  };

  // 暴露控制函数
  window.logFilter = {
    enableAll() {
      console.log = original.log;
      console.warn = original.warn;
      console.error = original.error;
      console.log('🔓 日志过滤器已禁用，显示所有日志');
    },

    stats() {
      const reduction = ((stats.filtered / stats.total) * 100).toFixed(1);
      console.log('📊 日志统计:', {
        总日志数: stats.total,
        已过滤: stats.filtered,
        关键信息: stats.critical,
        过滤率: `${reduction}%`
      });
    },

    addNoise(...patterns) {
      NOISE_PATTERNS.push(...patterns);
      console.log('🚫 已添加噪音模式:', patterns);
    },

    addCritical(category, ...patterns) {
      if (!CRITICAL_PATTERNS[category]) {
        CRITICAL_PATTERNS[category] = [];
      }
      CRITICAL_PATTERNS[category].push(...patterns);
      console.log(`✅ 已添加关键模式到 ${category}:`, patterns);
    },

    showCategories() {
      console.log('📋 当前关键类别:');
      for (const [category, patterns] of Object.entries(CRITICAL_PATTERNS)) {
        console.log(`  ${category}: ${patterns.length} 个模式`);
      }
    }
  };

  console.log('🎯 智能日志过滤器 V2 已启动！');
  console.log('💡 使用 window.logFilter.stats() 查看统计');
  console.log('💡 使用 window.logFilter.enableAll() 显示所有日志');
})();
