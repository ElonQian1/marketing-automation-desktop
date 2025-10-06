#!/usr/bin/env node

/**
 * 调试元素发现功能的脚本
 * 专门验证为什么 element_40 "联系人" 文本没有出现在子元素发现中
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始调试元素发现功能...\n');

// 读取测试XML文件
const xmlPath = path.join(__dirname, 'temp_debug_dump.xml');
if (!fs.existsSync(xmlPath)) {
  console.error('❌ 测试XML文件不存在:', xmlPath);
  console.log('📝 请先在应用中保存XML文件到该位置进行分析');
  process.exit(1);
}

const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
console.log('✅ 成功读取XML文件\n');

// 解析XML
const { DOMParser } = require('xmldom');
const parser = new DOMParser();
const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

// 创建元素ID到节点的映射
const nodeMap = new Map();
const parentMap = new Map();

function traverseNodes(node, parent = null) {
  if (node.nodeType === 1) { // Element node
    const bounds = node.getAttribute('bounds');
    const text = node.getAttribute('text');
    const className = node.getAttribute('class');
    const resourceId = node.getAttribute('resource-id');
    const clickable = node.getAttribute('clickable') === 'true';
    
    // 生成类似前端的元素ID
    const elements = Array.from(xmlDoc.getElementsByTagName('*'));
    const index = elements.indexOf(node);
    const elementId = `element_${index + 37}`; // 从37开始是根据实际XML结构调整
    
    const elementInfo = {
      id: elementId,
      bounds,
      text,
      className,
      resourceId,
      clickable,
      parent: parent ? parent.id : null,
      children: []
    };
    
    nodeMap.set(elementId, elementInfo);
    if (parent) {
      parentMap.set(elementId, parent.id);
      parent.children.push(elementInfo);
    }
    
    // 递归处理子节点
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === 1) {
        traverseNodes(child, elementInfo);
      }
    }
  }
}

// 开始遍历
const rootNode = xmlDoc.documentElement;
traverseNodes(rootNode);

console.log(`📊 构建了 ${nodeMap.size} 个元素的映射关系\n`);

// 查找包含"联系人"的元素
const contactElements = [];
for (const [id, element] of nodeMap.entries()) {
  if (element.text && element.text.includes('联系人')) {
    contactElements.push({ id, ...element });
  }
}

console.log('📱 包含"联系人"的元素:');
contactElements.forEach((element, index) => {
  console.log(`  ${index + 1}. ${element.id}`);
  console.log(`     文本: "${element.text}"`);
  console.log(`     类型: ${element.className}`);
  console.log(`     位置: ${element.bounds}`);
  console.log(`     父元素: ${element.parent || '无'}`);
  console.log(`     子元素数量: ${element.children.length}`);
  console.log('');
});

// 查找导航按钮（可点击的容器元素）
const navigationButtons = [];
for (const [id, element] of nodeMap.entries()) {
  if (element.clickable && element.bounds && element.bounds !== '[0,0][0,0]') {
    // 检查是否在底部导航区域（假设底部导航在Y坐标1400以上）
    const boundsMatch = element.bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (boundsMatch) {
      const [, x1, y1, x2, y2] = boundsMatch.map(Number);
      if (y1 > 1300) { // 可能是底部导航
        navigationButtons.push({ id, ...element, x1, y1, x2, y2 });
      }
    }
  }
}

console.log('🧭 可能的导航按钮:');
navigationButtons.forEach((button, index) => {
  console.log(`  ${index + 1}. ${button.id}`);
  console.log(`     文本: "${button.text || '无'}"`);
  console.log(`     类型: ${button.className}`);
  console.log(`     位置: ${button.bounds}`);
  console.log(`     子元素数量: ${button.children.length}`);
  
  // 检查子元素
  if (button.children.length > 0) {
    console.log('     子元素:');
    button.children.forEach((child, childIndex) => {
      console.log(`       ${childIndex + 1}. ${child.id} - "${child.text || '无'}" (${child.className})`);
      if (child.bounds === '[0,0][0,0]') {
        console.log(`          ⚠️  隐藏元素 (bounds=[0,0][0,0])`);
      }
    });
  }
  console.log('');
});

// 分析层级关系：找到包含"联系人"文本的元素的父容器
console.log('🔗 分析层级关系:\n');

contactElements.forEach((contactElement) => {
  console.log(`📍 分析元素 ${contactElement.id} (包含"联系人"文本):`);
  
  // 向上查找父元素
  let currentParentId = contactElement.parent;
  let level = 1;
  
  while (currentParentId && level <= 5) {
    const parentElement = nodeMap.get(currentParentId);
    if (parentElement) {
      console.log(`  📂 第${level}级父元素: ${parentElement.id}`);
      console.log(`     文本: "${parentElement.text || '无'}"`);
      console.log(`     类型: ${parentElement.className}`);
      console.log(`     位置: ${parentElement.bounds}`);
      console.log(`     可点击: ${parentElement.clickable ? '是' : '否'}`);
      
      // 如果这个父元素是可点击的，检查它的所有子元素
      if (parentElement.clickable) {
        console.log(`     ✅ 这是一个可点击的父容器! 子元素列表:`);
        parentElement.children.forEach((child, childIndex) => {
          console.log(`       ${childIndex + 1}. ${child.id}`);
          console.log(`          文本: "${child.text || '无'}"`);
          console.log(`          类型: ${child.className}`);
          console.log(`          位置: ${child.bounds}`);
          if (child.bounds === '[0,0][0,0]') {
            console.log(`          🔍 隐藏元素 (应该被发现功能检测到)`);
          }
        });
        break; // 找到可点击的父容器就停止
      }
      
      currentParentId = parentElement.parent;
      level++;
    } else {
      break;
    }
  }
  console.log('');
});

// 模拟前端的子元素发现逻辑
console.log('🎯 模拟前端发现逻辑:\n');

// 假设用户点击了 element_37 (导航按钮容器)
const targetElementId = 'element_37';
const targetElement = nodeMap.get(targetElementId);

if (targetElement) {
  console.log(`🎯 模拟点击目标元素: ${targetElementId}`);
  console.log(`   文本: "${targetElement.text || '无'}"`);
  console.log(`   类型: ${targetElement.className}`);
  console.log(`   位置: ${targetElement.bounds}`);
  console.log(`   可点击: ${targetElement.clickable ? '是' : '否'}\n`);
  
  console.log('🔍 该元素的子元素发现结果:');
  
  if (targetElement.children.length === 0) {
    console.log('   ❌ 没有找到子元素');
  } else {
    targetElement.children.forEach((child, index) => {
      console.log(`   ${index + 1}. ${child.id}`);
      console.log(`      文本: "${child.text || '无'}"`);
      console.log(`      类型: ${child.className}`);
      console.log(`      位置: ${child.bounds}`);
      
      // 检查是否应该被发现逻辑找到
      const hasValidText = child.text && child.text.trim().length > 0;
      const isHidden = child.bounds === '[0,0][0,0]';
      
      console.log(`      应该被发现: ${hasValidText ? '是' : '否'} (有效文本)`);
      console.log(`      是隐藏元素: ${isHidden ? '是' : '否'}`);
      
      if (hasValidText && child.text.includes('联系人')) {
        console.log(`      🎉 这就是缺失的"联系人"文本元素!`);
      }
    });
  }
} else {
  console.log(`❌ 未找到目标元素: ${targetElementId}`);
}

console.log('\n🔧 调试建议:');
console.log('1. 检查前端元素ID映射是否正确');
console.log('2. 确认用户实际点击的是父容器(element_37)而不是子元素(element_38)'); 
console.log('3. 验证useElementDiscovery的层级分析逻辑');
console.log('4. 检查隐藏元素检测是否正常工作');
console.log('5. 确认使用的是正确版本的ElementSelectionPopover');