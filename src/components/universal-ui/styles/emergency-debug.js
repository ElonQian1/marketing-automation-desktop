/**
 * Universal UI 紧急调试脚本
 * 用于实时测试和调整视觉效果
 */

// 紧急对比度修复函数
function applyEmergencyContrast() {
  const universalUI = document.querySelector('.universal-page-finder');
  if (!universalUI) {
    console.log('❌ 未找到 Universal UI 容器');
    return;
  }
  
  console.log('🔧 应用紧急对比度修复...');
  
  // 强制应用高对比度样式
  const emergencyStyles = `
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%) !important;
    color: #ffffff !important;
    border: 1px solid #404040 !important;
    border-radius: 12px !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
    padding: 20px !important;
  `;
  
  universalUI.style.cssText += emergencyStyles;
  
  // 修复所有按钮
  const buttons = universalUI.querySelectorAll('button, .ant-btn');
  buttons.forEach(btn => {
    btn.style.cssText += `
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
      color: #ffffff !important;
      border: 1px solid #60a5fa !important;
      border-radius: 8px !important;
      padding: 8px 16px !important;
      font-weight: 500 !important;
      min-height: 36px !important;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2) !important;
      opacity: 1 !important;
      visibility: visible !important;
    `;
  });
  
  // 修复所有输入框
  const inputs = universalUI.querySelectorAll('input, .ant-input, textarea, .ant-select');
  inputs.forEach(input => {
    input.style.cssText += `
      background: rgba(255, 255, 255, 0.1) !important;
      color: #ffffff !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      border-radius: 6px !important;
    `;
  });
  
  // 修复所有文本
  const textElements = universalUI.querySelectorAll('*:not(input):not(textarea)');
  textElements.forEach(el => {
    if (el.children.length === 0 && el.textContent.trim()) {
      el.style.color = '#ffffff !important';
    }
  });
  
  console.log('✅ 紧急对比度修复已应用');
  console.log(`📊 修复统计: 按钮 ${buttons.length} 个, 输入框 ${inputs.length} 个`);
}

// 自动检测并应用修复
function autoDetectAndFix() {
  // 等待 DOM 加载
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoDetectAndFix);
    return;
  }
  
  // 检查是否存在 Universal UI
  const check = () => {
    const universalUI = document.querySelector('.universal-page-finder');
    if (universalUI) {
      console.log('🎯 检测到 Universal UI，应用紧急修复...');
      applyEmergencyContrast();
      
      // 监听动态变化
      const observer = new MutationObserver(() => {
        setTimeout(applyEmergencyContrast, 100);
      });
      
      observer.observe(universalUI, {
        childList: true,
        subtree: true
      });
      
    } else {
      console.log('⏳ 等待 Universal UI 加载...');
      setTimeout(check, 500);
    }
  };
  
  check();
}

// 主题快速切换功能
function quickThemeSwitch() {
  const universalUI = document.querySelector('.universal-page-finder');
  if (!universalUI) return;
  
  console.log('🎨 快速主题切换可用:');
  console.log('  使用 setHighContrast() - 高对比度模式');
  console.log('  使用 setMediumContrast() - 中等对比度模式');
  console.log('  使用 setLowContrast() - 低对比度模式');
  
  window.setHighContrast = () => {
    universalUI.style.cssText += `
      background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%) !important;
      color: #ffffff !important;
      border: 2px solid #ffffff !important;
    `;
    applyEmergencyContrast();
    console.log('✅ 已切换到高对比度模式');
  };
  
  window.setMediumContrast = () => {
    universalUI.style.cssText += `
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%) !important;
      color: #ffffff !important;
      border: 1px solid #404040 !important;
    `;
    applyEmergencyContrast();
    console.log('✅ 已切换到中等对比度模式');
  };
  
  window.setLowContrast = () => {
    universalUI.style.cssText += `
      background: linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%) !important;
      color: #e5e5e5 !important;
      border: 1px solid #525252 !important;
    `;
    console.log('✅ 已切换到低对比度模式');
  };
}

// 导出到全局
if (typeof window !== 'undefined') {
  window.applyEmergencyContrast = applyEmergencyContrast;
  window.autoDetectAndFix = autoDetectAndFix;
  window.quickThemeSwitch = quickThemeSwitch;
  
  // 自动启动
  autoDetectAndFix();
  quickThemeSwitch();
  
  console.log('🛠️ Universal UI 紧急调试工具已就绪!');
  console.log('📞 可用命令:');
  console.log('  applyEmergencyContrast() - 立即应用对比度修复');
  console.log('  autoDetectAndFix() - 自动检测并修复');
  console.log('  setHighContrast() - 高对比度模式');
  console.log('  setMediumContrast() - 中等对比度模式');
  console.log('  setLowContrast() - 低对比度模式');
}

export { applyEmergencyContrast, autoDetectAndFix, quickThemeSwitch };