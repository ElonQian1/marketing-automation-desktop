#!/usr/bin/env node

// 诊断XML解析和element ID映射问题

import fs from 'fs';

console.log('🔍 诊断XML解析和element ID映射问题...\n');

const xmlContent = fs.readFileSync('debug_xml/current_ui_dump.xml', 'utf-8');

// 模拟Rust后端的element ID生成逻辑
let idCounter = 0;
const elementMapping = [];

// 正则表达式匹配所有<node>标签
const nodeMatches = [...xmlContent.matchAll(/<node[^>]+>/g)];

console.log(`📊 找到 ${nodeMatches.length} 个 <node> 元素`);

nodeMatches.forEach((match, index) => {
  idCounter++;
  const elementId = `element_${idCounter}`;
  
  // 提取关键属性
  const boundsMatch = match[0].match(/bounds="([^"]+)"/);
  const resourceIdMatch = match[0].match(/resource-id="([^"]+)"/);
  const textMatch = match[0].match(/text="([^"]+)"/);
  const classMatch = match[0].match(/class="([^"]+)"/);
  const clickableMatch = match[0].match(/clickable="([^"]+)"/);
  
  const bounds = boundsMatch ? boundsMatch[1] : '';
  const resourceId = resourceIdMatch ? resourceIdMatch[1] : '';
  const text = textMatch ? textMatch[1] : '';
  const className = classMatch ? classMatch[1] : '';
  const clickable = clickableMatch ? clickableMatch[1] === 'true' : false;
  
  elementMapping.push({
    id: elementId,
    index: idCounter,
    bounds,
    resourceId,
    text,
    className,
    clickable,
    xmlFragment: match[0].substring(0, 100) + '...'
  });
});

console.log('\n🎯 底部导航相关元素映射:');

// 查找底部导航容器
const bottomNav = elementMapping.find(el => el.resourceId === 'com.hihonor.contacts:id/bottom_navgation');
if (bottomNav) {
  console.log(`✅ 底部导航容器: ${bottomNav.id} - ${bottomNav.bounds}`);
} else {
  console.log('❌ 未找到底部导航容器');
}

// 查找导航按钮
const navButtons = elementMapping.filter(el => 
  el.bounds === '[48,1420][256,1484]' ||    // 电话按钮
  el.bounds === '[256,1420][464,1484]' ||   // 联系人按钮  
  el.bounds === '[464,1420][672,1484]'      // 收藏按钮
);

console.log('\n📞 导航按钮映射:');
navButtons.forEach(button => {
  console.log(`${button.id}: ${button.bounds} (clickable: ${button.clickable})`);
});

// 查找文本元素
const textElements = elementMapping.filter(el => 
  el.text === '电话' || el.text === '联系人' || el.text === '收藏'
);

console.log('\n📝 文本元素映射:');
textElements.forEach(textEl => {
  console.log(`${textEl.id}: "${textEl.text}" - ${textEl.bounds} (hidden: ${textEl.bounds === '[0,0][0,0]'})`);
});

// 分析层级关系问题
console.log('\n🏗️ 层级关系分析:');

// 查找相关元素的顺序
const relevantIds = [33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
const relevantElements = relevantIds.map(id => elementMapping.find(el => el.id === `element_${id}`)).filter(Boolean);

relevantElements.forEach(el => {
  console.log(`${el.id}: ${el.className.split('.').pop()} - "${el.text}" - ${el.bounds}`);
  if (el.resourceId) {
    console.log(`  └─ resource-id: ${el.resourceId}`);
  }
});

console.log('\n💡 关键发现:');
console.log('1. element ID是基于XML文档顺序生成的，不是基于层级深度');
console.log('2. 隐藏文本元素 (bounds=[0,0][0,0]) 仍然被分配了element ID');
console.log('3. LocalArchitectureAnalyzer需要正确解析XML DOM，而不是依赖扁平化的UIElement列表');

console.log('\n🔧 修复方向:');
console.log('1. LocalArchitectureAnalyzer应该重新解析XML内容构建DOM树');
console.log('2. 基于DOM树的真实父子关系构建层级结构');
console.log('3. 然后将DOM节点映射回UIElement对象');
console.log('4. 最后应用正确的关系分类逻辑');

// 检查element_38附近的元素
console.log('\n🎯 element_38 (联系人按钮) 周围元素:');
const targetIndex = 38;
for (let i = targetIndex - 2; i <= targetIndex + 3; i++) {
  const el = elementMapping.find(el => el.id === `element_${i}`);
  if (el) {
    const marker = i === targetIndex ? ' ⭐ TARGET' : '';
    console.log(`${el.id}: ${el.className.split('.').pop()} - "${el.text}" - ${el.bounds}${marker}`);
  }
}