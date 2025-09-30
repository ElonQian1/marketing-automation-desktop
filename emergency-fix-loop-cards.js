/**
 * 循环卡片紧急修复脚本
 * 专门解决循环卡片黑底黑字的问题
 * 
 * 使用方法：
 * 1. 在浏览器控制台直接运行此脚本
 * 2. 或者复制到书签栏作为 Bookmarklet
 */

console.log('🚨 循环卡片紧急修复脚本启动...');

// 循环卡片选择器
const LOOP_CARD_SELECTORS = [
  '.loop-step-card',
  '.step-card',
  '.white-background-allowed',
  '[data-loop-badge]',
  '.loop-surface',
  '.loop-card',
  '.loop-anchor',
  '.loop-container',
  '.step-container'
];

// 问题样式检测
function hasProblematicStyles(element) {
  const computed = window.getComputedStyle(element);
  const color = computed.color;
  const bgColor = computed.backgroundColor;
  
  // 检测黑底黑字或白底白字的问题
  const isBlackOnBlack = (
    (color.includes('0, 0, 0') || color === 'black') &&
    (bgColor.includes('0, 0, 0') || bgColor === 'black' || bgColor.includes('45, 45, 45'))
  );
  
  const isWhiteOnWhite = (
    (color.includes('255, 255, 255') || color === 'white') &&
    (bgColor.includes('255, 255, 255') || bgColor === 'white')
  );
  
  return isBlackOnBlack || isWhiteOnWhite;
}

// 强制应用白色主题
function forceWhiteTheme(element) {
  // 强制白色背景和黑色文字
  element.style.setProperty('background-color', 'white', 'important');
  element.style.setProperty('background', 'white', 'important');
  element.style.setProperty('color', '#333333', 'important');
  element.style.setProperty('border-color', '#d9d9d9', 'important');
  
  // 移除可能的暗色主题类
  element.classList.remove('dark', 'dark-theme', 'theme-dark');
  
  // 添加白色主题标记
  element.setAttribute('data-white-theme-forced', 'true');
  
  console.log('🎨 已修复循环卡片:', element);
}

// 修复子元素
function fixChildElements(container) {
  const allChildren = container.querySelectorAll('*');
  
  allChildren.forEach(child => {
    const computed = window.getComputedStyle(child);
    
    // 修复文字颜色
    if (computed.color.includes('255, 255, 255') || computed.color === 'white') {
      child.style.setProperty('color', '#333333', 'important');
    }
    
    // 修复背景颜色（除了特殊组件）
    if (!child.classList.contains('ant-btn') && 
        !child.classList.contains('ant-tag') &&
        !child.classList.contains('ant-switch')) {
      
      const bgColor = computed.backgroundColor;
      if (bgColor.includes('0, 0, 0') || 
          bgColor === 'black' || 
          bgColor.includes('45, 45, 45')) {
        child.style.setProperty('background-color', 'transparent', 'important');
      }
    }
    
    // 修复Ant Design组件
    if (child.classList.contains('ant-btn')) {
      if (!child.classList.contains('ant-btn-dangerous')) {
        child.style.setProperty('background-color', 'white', 'important');
        child.style.setProperty('color', '#333333', 'important');
        child.style.setProperty('border-color', '#d9d9d9', 'important');
      }
    }
    
    if (child.classList.contains('ant-tag')) {
      if (child.classList.contains('ant-tag-blue')) {
        child.style.setProperty('background-color', '#e6f7ff', 'important');
        child.style.setProperty('color', '#1890ff', 'important');
      } else {
        child.style.setProperty('background-color', '#f0f0f0', 'important');
        child.style.setProperty('color', '#333333', 'important');
      }
    }
    
    // 修复图标
    if (child.classList.contains('anticon')) {
      if (!child.style.color || computed.color.includes('255, 255, 255')) {
        child.style.setProperty('color', '#666666', 'important');
      }
    }
  });
}

// 主修复函数
function fixLoopCards() {
  let fixedCount = 0;
  
  LOOP_CARD_SELECTORS.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
      // 跳过已修复的元素
      if (element.getAttribute('data-white-theme-forced') === 'true') {
        return;
      }
      
      // 强制白色主题
      forceWhiteTheme(element);
      
      // 修复子元素
      fixChildElements(element);
      
      fixedCount++;
    });
  });
  
  console.log(`✅ 循环卡片修复完成，共修复 ${fixedCount} 个卡片`);
  return fixedCount;
}

// 监控新增的循环卡片
function startMonitoring() {
  const observer = new MutationObserver((mutations) => {
    let needsFix = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // 检查是否是循环卡片
            const element = node;
            const isLoopCard = LOOP_CARD_SELECTORS.some(selector => 
              element.matches && element.matches(selector)
            );
            
            if (isLoopCard || element.querySelector && 
                LOOP_CARD_SELECTORS.some(selector => element.querySelector(selector))) {
              needsFix = true;
            }
          }
        });
      }
    });
    
    if (needsFix) {
      setTimeout(fixLoopCards, 100); // 稍微延迟以确保DOM更新完成
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('👀 循环卡片监控器已启动');
  return observer;
}

// 添加CSS强制规则
function addForceCSSRules() {
  const styleId = 'loop-card-emergency-fix';
  let existingStyle = document.getElementById(styleId);
  
  if (existingStyle) {
    existingStyle.remove();
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* 循环卡片紧急修复CSS */
    .loop-step-card,
    .step-card,
    .white-background-allowed,
    [data-loop-badge],
    .loop-surface,
    .loop-card,
    .loop-anchor,
    [data-white-theme-forced="true"] {
      background-color: white !important;
      background: white !important;
      color: #333333 !important;
      border-color: #d9d9d9 !important;
    }
    
    .loop-step-card *:not(.ant-btn):not(.ant-tag):not(.ant-switch),
    .step-card *:not(.ant-btn):not(.ant-tag):not(.ant-switch),
    .white-background-allowed *:not(.ant-btn):not(.ant-tag):not(.ant-switch),
    [data-loop-badge] *:not(.ant-btn):not(.ant-tag):not(.ant-switch),
    [data-white-theme-forced="true"] *:not(.ant-btn):not(.ant-tag):not(.ant-switch) {
      color: #333333 !important;
    }
    
    .loop-step-card .ant-btn:not(.ant-btn-dangerous),
    .step-card .ant-btn:not(.ant-btn-dangerous),
    .white-background-allowed .ant-btn:not(.ant-btn-dangerous),
    [data-white-theme-forced="true"] .ant-btn:not(.ant-btn-dangerous) {
      background-color: white !important;
      color: #333333 !important;
      border-color: #d9d9d9 !important;
    }
    
    .loop-step-card .ant-tag,
    .step-card .ant-tag,
    .white-background-allowed .ant-tag,
    [data-white-theme-forced="true"] .ant-tag {
      background-color: #f0f0f0 !important;
      color: #333333 !important;
      border-color: #d9d9d9 !important;
    }
    
    .loop-step-card .ant-tag.ant-tag-blue,
    .step-card .ant-tag.ant-tag-blue,
    .white-background-allowed .ant-tag.ant-tag-blue,
    [data-white-theme-forced="true"] .ant-tag.ant-tag-blue {
      background-color: #e6f7ff !important;
      color: #1890ff !important;
      border-color: #91d5ff !important;
    }
    
    .loop-step-card .anticon,
    .step-card .anticon,
    .white-background-allowed .anticon,
    [data-white-theme-forced="true"] .anticon {
      color: #666666 !important;
    }
  `;
  
  document.head.appendChild(style);
  console.log('📝 循环卡片紧急修复CSS已添加');
}

// 执行修复
console.log('🔧 开始循环卡片紧急修复...');

// 1. 添加强制CSS规则
addForceCSSRules();

// 2. 修复现有的循环卡片
const fixedCount = fixLoopCards();

// 3. 启动监控
const observer = startMonitoring();

// 4. 提供全局方法
window.fixLoopCardsEmergency = fixLoopCards;
window.addLoopCardCSS = addForceCSSRules;

console.log('✅ 循环卡片紧急修复完成！');
console.log(`📊 统计：修复了 ${fixedCount} 个循环卡片`);
console.log('🛠️  可用方法：');
console.log('   fixLoopCardsEmergency() - 手动重新修复');
console.log('   addLoopCardCSS() - 重新添加CSS规则');

// 返回修复结果
({
  fixedCount: fixedCount,
  observer: observer,
  success: true
});