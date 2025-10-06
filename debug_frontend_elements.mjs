/**
 * 调试前端接收到的元素数据
 * 分析可点击属性识别问题
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 开始分析前端元素数据...');

// 模拟前端XML解析逻辑（简化版，直接解析XML字符串）
function parseXmlContentFrontend(xmlContent) {
  const elements = [];
  
  // 使用正则表达式提取所有node元素
  const nodeRegex = /<node[^>]+>/g;
  const matches = xmlContent.match(nodeRegex);
  
  if (!matches) return elements;
  
  matches.forEach((nodeStr, index) => {
    // 提取属性
    const getAttr = (attr) => {
      const match = nodeStr.match(new RegExp(`${attr}="([^"]*)"`, 'i'));
      return match ? match[1] : '';
    };
    
    const bounds = getAttr('bounds');
    const text = getAttr('text');
    const resourceId = getAttr('resource-id');
    const className = getAttr('class');
    const clickableAttr = getAttr('clickable');
    const clickable = clickableAttr === 'true';
    
    if (bounds) {
      elements.push({
        id: `element_${index}`,
        text: text || '',
        element_type: className || 'View',
        resource_id: resourceId || '',
        bounds: parseBounds(bounds),
        is_clickable: clickable,
        clickable_attr: clickableAttr, // 原始属性值
        is_scrollable: getAttr('scrollable') === 'true',
        is_enabled: getAttr('enabled') !== 'false',
        checkable: getAttr('checkable') === 'true',
        checked: getAttr('checked') === 'true',
        selected: getAttr('selected') === 'true',
        password: getAttr('password') === 'true',
        content_desc: getAttr('content-desc') || '',
        full_node: nodeStr // 保存完整节点用于调试
      });
    }
  });
  
  return elements;
}

function parseBounds(boundsStr) {
  const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!match) return { left: 0, top: 0, right: 0, bottom: 0 };
  
  const [, left, top, right, bottom] = match.map(Number);
  return { left, top, right, bottom };
}

// 读取XML文件
const xmlFile = path.join(process.cwd(), 'debug_xml', 'current_ui_dump.xml');
const xmlContent = fs.readFileSync(xmlFile, 'utf-8');

console.log('📄 XML文件大小:', xmlContent.length, '字符');

// 分析元素
const elements = parseXmlContentFrontend(xmlContent);

console.log('📊 解析结果统计:');
console.log('  - 总元素数:', elements.length);
console.log('  - 可点击元素数:', elements.filter(e => e.is_clickable).length);

console.log('\n🎯 可点击元素详情:');
elements.filter(e => e.is_clickable).forEach((element, index) => {
  console.log(`${index + 1}. ID: ${element.id}`);
  console.log(`   文本: "${element.text}"`);
  console.log(`   类型: ${element.element_type}`);
  console.log(`   Resource ID: ${element.resource_id}`);
  console.log(`   原始clickable: "${element.clickable_attr}"`);
  console.log(`   解析后is_clickable: ${element.is_clickable}`);
  console.log(`   位置: [${element.bounds.left},${element.bounds.top}][${element.bounds.right},${element.bounds.bottom}]`);
  console.log('');
});

console.log('\n🔍 非可点击元素抽样（前5个）:');
elements.filter(e => !e.is_clickable).slice(0, 5).forEach((element, index) => {
  console.log(`${index + 1}. ID: ${element.id}`);
  console.log(`   文本: "${element.text}"`);
  console.log(`   类型: ${element.element_type}`);
  console.log(`   原始clickable: "${element.clickable_attr}"`);
  console.log('');
});

console.log('✅ 分析完成');