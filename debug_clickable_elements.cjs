// 调试可点击元素过滤问题
const fs = require('fs');
const path = require('path');

// 读取XML文件
const xmlPath = 'D:\\rust\\active-projects\\小红书\\employeeGUI\\debug_xml\\current_ui_dump.xml';
const xmlContent = fs.readFileSync(xmlPath, 'utf8');

console.log('📄 XML文件长度:', xmlContent.length);

// 使用正则表达式手动解析可点击元素
const nodeRegex = /<node[^>]+clickable="true"[^>]*>/g;
const clickableNodes = [];
let match;

while ((match = nodeRegex.exec(xmlContent)) !== null) {
  const nodeStr = match[0];
  
  // 提取属性
  const textMatch = nodeStr.match(/text="([^"]*)"/);
  const contentDescMatch = nodeStr.match(/content-desc="([^"]*)"/);
  const boundsMatch = nodeStr.match(/bounds="(\[[^\]]+\])"/);
  const classMatch = nodeStr.match(/class="([^"]*)"/);
  
  const element = {
    text: textMatch ? textMatch[1] : '',
    contentDesc: contentDescMatch ? contentDescMatch[1] : '',
    bounds: boundsMatch ? boundsMatch[1] : '',
    className: classMatch ? classMatch[1] : ''
  };
  
  clickableNodes.push(element);
}

console.log('\n🎯 找到的可点击元素:');
clickableNodes.forEach((element, index) => {
  console.log(`${index + 1}. ${element.text || element.contentDesc || '(无文本)'}`);
  console.log(`   类型: ${element.className}`);
  console.log(`   边界: ${element.bounds}`);
  console.log('');
});

console.log(`\n📊 总计可点击元素: ${clickableNodes.length}个`);

// 分析尺寸
console.log('\n📐 元素尺寸分析:');
clickableNodes.forEach((element, index) => {
  if (element.bounds) {
    const boundsMatch = element.bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (boundsMatch) {
      const [, left, top, right, bottom] = boundsMatch.map(Number);
      const width = right - left;
      const height = bottom - top;
      
      console.log(`${index + 1}. ${element.text || element.contentDesc || '(无文本)'}: ${width}x${height}`);
      
      if (width <= 20 || height <= 20) {
        console.log(`   ⚠️  尺寸过小，可能被后端过滤`);
      }
    }
  }
});