// 临时调试脚本：追踪 useForm 调用源
// 在浏览器控制台中运行此脚本来追踪 useForm 警告的来源

(function() {
  // 保存原始的 console.warn
  const originalWarn = console.warn;
  
  // 覆盖 console.warn 来捕获 useForm 警告
  console.warn = function(...args) {
    const message = args.join(' ');
    
    // 检查是否是 useForm 相关警告
    if (message.includes('Instance created by `useForm` is not connected to any Form element')) {
      console.log('🚨 捕获到 useForm 警告!');
      console.log('📍 调用堆栈:');
      console.trace();
      
      // 尝试获取更详细的 React 组件堆栈
      if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
        const internals = window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        if (internals.ReactCurrentOwner && internals.ReactCurrentOwner.current) {
          console.log('🎯 当前 React 组件:', internals.ReactCurrentOwner.current);
        }
      }
    }
    
    // 调用原始的 warn
    originalWarn.apply(console, args);
  };
  
  console.log('✅ useForm 调试追踪已启用');
})();