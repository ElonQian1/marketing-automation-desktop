/**
 * 🔍 快速诊断脚本 - 在浏览器控制台运行
 * 
 * 使用方法：
 * 1. 打开开发者工具控制台 (F12)
 * 2. 复制粘贴本文件内容并回车
 * 3. 采集页面后，自动显示诊断结果
 */

(function() {
  console.log('%c🔍 诊断脚本已加载', 'color: #00ff00; font-size: 16px; font-weight: bold');
  
  // 拦截关键日志
  const originalLog = console.log;
  let xmlFileNameDetected = null;
  let xmlCacheIdDetected = null;
  let xmlContentLengthDetected = null;
  
  console.log = function(...args) {
    const message = args.join(' ');
    
    // 🔥 检测后端返回数据
    if (message.includes('🔥 [usePageFinderModal] 后端返回数据:')) {
      xmlFileNameDetected = args[1];
      console.log(
        '%c🔥🔥🔥 后端返回数据检测',
        'background: #ff0000; color: #fff; padding: 4px 8px; font-weight: bold',
        args[1]
      );
      
      if (!args[1].xmlFileName || args[1].fallbackUsed) {
        console.error(
          '%c❌ 问题发现！后端没有返回 xmlFileName',
          'background: #ff0000; color: #fff; padding: 4px 8px; font-weight: bold'
        );
        console.log('%c💡 解决方案：检查 Rust 后端 analyze_universal_ui_page 函数', 'color: #ffa500');
      }
    }
    
    // ✅ 检测 XML 保存
    if (message.includes('✅ [usePageFinderModal] XML已保存到缓存:')) {
      xmlCacheIdDetected = args[1].xmlCacheId;
      xmlContentLengthDetected = args[1].xmlContentLength;
      
      console.log(
        '%c✅ XML 缓存保存检测',
        'background: #00ff00; color: #000; padding: 4px 8px; font-weight: bold',
        args[1]
      );
      
      // 检查格式
      const isCorrectFormat = args[1].xmlCacheId.includes('ui_dump_') && args[1].xmlCacheId.endsWith('.xml');
      if (!isCorrectFormat) {
        console.error(
          '%c❌ xmlCacheId 格式错误！',
          'background: #ff0000; color: #fff; padding: 4px 8px; font-weight: bold',
          `\n当前: ${args[1].xmlCacheId}\n期望: ui_dump_xxx.xml`
        );
      }
      
      // 检查内容长度
      if (args[1].xmlContentLength === 0) {
        console.error(
          '%c❌ XML 内容为空！',
          'background: #ff0000; color: #fff; padding: 4px 8px; font-weight: bold'
        );
      }
    }
    
    // ✅ 检测元素附加 xmlCacheId
    if (message.includes('✅ [UniversalPageFinderModal] 附加xmlCacheId到元素:')) {
      console.log(
        '%c✅ 元素 xmlCacheId 附加检测',
        'background: #00ff00; color: #000; padding: 4px 8px; font-weight: bold',
        args[1]
      );
      
      if (xmlCacheIdDetected && args[1].xmlCacheId !== xmlCacheIdDetected) {
        console.error(
          '%c❌ xmlCacheId 不一致！',
          'background: #ff0000; color: #fff; padding: 4px 8px; font-weight: bold',
          `\n保存时: ${xmlCacheIdDetected}\n附加时: ${args[1].xmlCacheId}`
        );
      }
    }
    
    // ✅ 检测缓存获取
    if (message.includes('✅ [convertElementToContext] 从缓存获取XML成功:')) {
      console.log(
        '%c✅ XML 缓存获取检测',
        'background: #00ff00; color: #000; padding: 4px 8px; font-weight: bold',
        args[1]
      );
      
      if (args[1].xmlContentLength !== xmlContentLengthDetected) {
        console.error(
          '%c⚠️ XML 长度不一致！',
          'background: #ffa500; color: #000; padding: 4px 8px; font-weight: bold',
          `\n保存时: ${xmlContentLengthDetected}\n读取时: ${args[1].xmlContentLength}`
        );
      }
    }
    
    // ⚠️ 检测未找到缓存警告
    if (message.includes('⚠️ 未找到XML缓存:')) {
      console.error(
        '%c❌ 缓存未找到！',
        'background: #ff0000; color: #fff; padding: 4px 8px; font-weight: bold',
        args[1]
      );
      console.log('%c💡 可能原因：xmlCacheId 格式不匹配', 'color: #ffa500');
    }
    
    // 静音冗余日志
    const mutedPrefixes = [
      '🔄 [VisualElementView]',
      '📊 [VisualElementView]',
      '🔍 PagePreview 坐标系诊断',
      'XML 视口尺寸:',
      '截图实际尺寸:',
      'X 轴比例:',
      '校准已应用:',
      '✅ 视口与截图尺寸一致',
      '🎯 [CompactStrategyMenu] 数据检查:',
      '🔄 [StepCardStore] 更新状态',
      '📊 [BackendService] 收到分析进度更新',
      '📊 [Adapter] 收到进度更新',
      '[EVT] analysis:progress',
      '⚠️ [GlobalWire] progress事件找不到卡片'
    ];
    
    if (mutedPrefixes.some(prefix => message.includes(prefix))) {
      return; // 不打印
    }
    
    originalLog.apply(console, args);
  };
  
  // 显示使用说明
  console.log(`
%c📋 诊断脚本使用说明
%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ 采集页面：点击"采集页面"按钮
2️⃣ 选择元素：点击"通讯录"按钮
3️⃣ 快速创建：点击"快速创建"按钮
4️⃣ 查看结果：自动高亮显示关键日志

%c🎯 诊断重点：
  • 🔥 后端是否返回 xmlFileName
  • ✅ xmlCacheId 是否为 ui_dump_xxx.xml 格式
  • ✅ xmlContentLength 是否 > 50000
  • ✅ 缓存保存和读取是否一致

%c💡 临时减少日志噪音：
  window.logger?.mute('VisualElementView', 'PagePreview')

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `,
    'color: #00ff00; font-size: 16px; font-weight: bold',
    'color: #666',
    'color: #fff; background: #333; padding: 8px',
    'color: #ffa500'
  );
})();
