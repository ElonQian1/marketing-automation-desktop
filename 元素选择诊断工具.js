// 🔍 元素选择诊断工具
(function elementSelectionDiagnostic() {
  const diagnostics = [];

  // 拦截元素选择相关的日志
  const originalLog = console.log;
  
  function parseBounds(boundsStr) {
    // 解析 "[0,1321][1080,1447]" 格式
    const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (!match) return null;
    
    return {
      x1: parseInt(match[1]),
      y1: parseInt(match[2]),
      x2: parseInt(match[3]),
      y2: parseInt(match[4]),
      width: parseInt(match[3]) - parseInt(match[1]),
      height: parseInt(match[4]) - parseInt(match[2]),
      area: (parseInt(match[3]) - parseInt(match[1])) * (parseInt(match[4]) - parseInt(match[2]))
    };
  }

  window.diagnoseTap = {
    // 分析最后一次点击
    lastTap() {
      console.log('🔍 分析最后一次元素选择...\n');
      
      // 从 localStorage 或内存中获取最后的选择数据
      const lastSelection = sessionStorage.getItem('lastElementSelection');
      if (!lastSelection) {
        console.warn('⚠️ 没有找到最近的选择数据');
        return;
      }

      const data = JSON.parse(lastSelection);
      console.log('📦 原始选择数据:', data);

      // 分析选择区域
      if (data.bounds) {
        const bounds = parseBounds(data.bounds);
        console.log('\n📐 选择区域分析:');
        console.log(`  位置: (${bounds.x1}, ${bounds.y1}) → (${bounds.x2}, ${bounds.y2})`);
        console.log(`  尺寸: ${bounds.width}×${bounds.height} px`);
        console.log(`  面积: ${bounds.area.toLocaleString()} px²`);

        // 判断是否是容器
        if (bounds.area > 50000) {
          console.warn('⚠️ 警告：选择区域过大，可能是容器而非按钮！');
          console.warn('💡 建议：缩小选择范围，精确选择目标按钮');
        }

        if (bounds.width > 500 || bounds.height > 300) {
          console.warn('⚠️ 警告：选择区域宽度或高度过大');
        }
      }

      // 分析 XPath
      if (data.xpath) {
        console.log('\n🎯 XPath 分析:');
        console.log(`  原始 XPath: ${data.xpath}`);

        if (data.xpath.includes('FrameLayout')) {
          console.warn('⚠️ 警告：选中了 FrameLayout（容器），通常不可点击！');
          console.warn('💡 建议：选择容器内的具体子元素');
        }

        if (!data.xpath.includes('@text') && !data.xpath.includes('@content-desc') && !data.xpath.includes('@resource-id')) {
          console.warn('⚠️ 警告：XPath 缺少唯一标识符（text/content-desc/resource-id）');
          console.warn('💡 建议：可能导致匹配到多个元素');
        }
      }

      // 分析评分结果
      if (data.candidateScores) {
        console.log('\n🎯 候选评分分析:');
        data.candidateScores.forEach((candidate, index) => {
          const status = candidate.score > 0.8 ? '✅' : candidate.score > 0.5 ? '⚠️' : '❌';
          console.log(`  ${status} 候选 ${index + 1}: ${candidate.score.toFixed(3)} - ${candidate.text || '(无文本)'}`);
        });

        const bestScore = Math.max(...data.candidateScores.map(c => c.score));
        if (bestScore < 0.5) {
          console.error('❌ 致命：最佳候选评分过低（< 0.5）');
          console.error('💡 可能原因：');
          console.error('   1. 选择了错误的元素（容器而非按钮）');
          console.error('   2. 元素属性不匹配');
          console.error('   3. XML 数据与当前屏幕不一致');
        }
      }
    },

    // 检查 XML 缓存状态
    checkXmlCache() {
      console.log('💾 检查 XML 缓存状态...\n');

      // 检查 XmlCacheManager
      if (window.XmlCacheManager) {
        console.log('✅ XmlCacheManager 存在');
        // TODO: 调用实际的缓存检查方法
      } else {
        console.warn('⚠️ XmlCacheManager 未找到（可能是模块未导出）');
      }

      // 检查最近的缓存日志
      const recentLogs = diagnostics.filter(d => 
        d.type === 'xmlCache' && Date.now() - d.timestamp < 60000
      );

      if (recentLogs.length > 0) {
        console.log(`\n📊 最近 ${recentLogs.length} 条 XML 缓存操作:`);
        recentLogs.forEach(log => {
          console.log(`  ${log.emoji} ${log.message}`);
        });
      } else {
        console.warn('⚠️ 最近 1 分钟内没有 XML 缓存操作');
      }
    },

    // 实时监控
    startMonitor() {
      console.log('🔍 开始实时监控元素选择...');
      
      window.addEventListener('elementSelected', (event) => {
        console.log('\n🎯 捕获到元素选择事件:');
        console.log(event.detail);
        
        // 保存到 sessionStorage
        sessionStorage.setItem('lastElementSelection', JSON.stringify(event.detail));
        
        // 立即诊断
        setTimeout(() => this.lastTap(), 100);
      });

      console.log('✅ 监控已启动，选择元素时会自动诊断');
    },

    // 显示帮助
    help() {
      console.log('🔍 元素选择诊断工具 - 使用指南\n');
      console.log('命令列表:');
      console.log('  window.diagnoseTap.lastTap()      - 分析最后一次点击');
      console.log('  window.diagnoseTap.checkXmlCache() - 检查 XML 缓存状态');
      console.log('  window.diagnoseTap.startMonitor()  - 开始实时监控');
      console.log('  window.diagnoseTap.help()          - 显示此帮助');
      console.log('\n常见问题:');
      console.log('  1. 评分过低 (< 0.5) → 可能选择了容器而非按钮');
      console.log('  2. 选择区域过大 → 缩小选择范围');
      console.log('  3. XPath 是 FrameLayout → 选择具体子元素');
    }
  };

  // 自动启动监控
  // window.diagnoseTap.startMonitor();

  console.log('🔍 元素选择诊断工具已加载！');
  console.log('💡 输入 window.diagnoseTap.help() 查看使用方法');
})();
