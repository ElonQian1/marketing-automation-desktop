const fs = require('fs');
const path = require('path');

// 读取XML文件
const xmlContent = fs.readFileSync(path.join(__dirname, 'debug_xml', 'current_ui_dump.xml'), 'utf8');

// 简单的XML解析函数
function parseElements(xmlContent) {
  const elements = [];
  let elementId = 0;
  
  // 匹配所有node标签
  const nodeRegex = /<node[^>]*>/g;
  let match;
  
  while ((match = nodeRegex.exec(xmlContent)) !== null) {
    const nodeText = match[0];
    
    // 提取属性
    const getText = (attr) => {
      const regex = new RegExp(`${attr}="([^"]*)"`, 'i');
      const match = nodeText.match(regex);
      return match ? match[1] : '';
    };
    
    const getBounds = () => {
      const boundsStr = getText('bounds');
      if (!boundsStr) return { left: 0, top: 0, right: 0, bottom: 0 };
      
      const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
      if (!match) return { left: 0, top: 0, right: 0, bottom: 0 };
      
      return {
        left: parseInt(match[1]),
        top: parseInt(match[2]),
        right: parseInt(match[3]),
        bottom: parseInt(match[4])
      };
    };
    
    const element = {
      id: `element_${elementId++}`,
      text: getText('text'),
      element_type: getText('class'),
      resource_id: getText('resource-id'),
      content_desc: getText('content-desc'),
      is_clickable: getText('clickable') === 'true',
      bounds: getBounds(),
      package: getText('package')
    };
    
    elements.push(element);
  }
  
  return elements;
}

// 解析元素
const elements = parseElements(xmlContent);

console.log('🔍 分析导航栏元素结构：');

// 查找导航栏相关元素
const navigationElements = elements.filter(el => 
  el.bounds.top >= 1420 && el.bounds.bottom <= 1484
);

console.log(`\n📱 导航栏区域元素 (Y坐标 1420-1484)：`);
navigationElements.forEach((el, index) => {
  const isHidden = el.bounds.left === 0 && el.bounds.top === 0 && 
                   el.bounds.right === 0 && el.bounds.bottom === 0;
  
  console.log(`  ${index + 1}. ${el.id}`);
  console.log(`     文本: "${el.text}" ${isHidden ? '[隐藏元素]' : ''}`);
  console.log(`     类型: ${el.element_type}`);
  console.log(`     可点击: ${el.is_clickable}`);
  console.log(`     位置: [${el.bounds.left},${el.bounds.top}][${el.bounds.right},${el.bounds.bottom}]`);
  console.log('');
});

// 查找包含"联系人"文本的元素
const contactElements = elements.filter(el => 
  el.text && el.text.includes('联系人')
);

console.log(`\n📝 包含"联系人"文本的元素：`);
contactElements.forEach((el, index) => {
  const isHidden = el.bounds.left === 0 && el.bounds.top === 0 && 
                   el.bounds.right === 0 && el.bounds.bottom === 0;
  
  console.log(`  ${index + 1}. ${el.id}`);
  console.log(`     文本: "${el.text}"`);
  console.log(`     类型: ${el.element_type}`);
  console.log(`     可点击: ${el.is_clickable}`);
  console.log(`     隐藏元素: ${isHidden}`);
  console.log(`     位置: [${el.bounds.left},${el.bounds.top}][${el.bounds.right},${el.bounds.bottom}]`);
  console.log('');
});

// 分析点击的按钮 (根据日志，应该是element_38)
const clickedButton = elements[38]; // element_38 对应索引38
if (clickedButton) {
  console.log(`\n🎯 被点击的按钮 (${clickedButton.id})：`);
  console.log(`   文本: "${clickedButton.text}"`);
  console.log(`   类型: ${clickedButton.element_type}`);
  console.log(`   可点击: ${clickedButton.is_clickable}`);
  console.log(`   位置: [${clickedButton.bounds.left},${clickedButton.bounds.top}][${clickedButton.bounds.right},${clickedButton.bounds.bottom}]`);
  
  // 查找它的子元素（基于位置包含关系）
  const children = elements.filter(el => 
    el.bounds.left >= clickedButton.bounds.left &&
    el.bounds.top >= clickedButton.bounds.top &&
    el.bounds.right <= clickedButton.bounds.right &&
    el.bounds.bottom <= clickedButton.bounds.bottom &&
    el.id !== clickedButton.id
  );
  
  console.log(`\n   🔗 子元素 (${children.length}个)：`);
  children.forEach((child, index) => {
    const isHidden = child.bounds.left === 0 && child.bounds.top === 0 && 
                     child.bounds.right === 0 && child.bounds.bottom === 0;
    
    console.log(`     ${index + 1}. ${child.id}`);
    console.log(`        文本: "${child.text}" ${isHidden ? '[隐藏]' : ''}`);
    console.log(`        类型: ${child.element_type}`);
    console.log(`        位置: [${child.bounds.left},${child.bounds.top}][${child.bounds.right},${child.bounds.bottom}]`);
  });
}