/**
 * 模拟前端接收数据的完整流程测试
 * 从后端解析 -> ElementFilter -> 最终显示
 */

import fs from 'fs';
import path from 'path';

// 模拟后端解析结果（基于真实XML）
function simulateBackendParsing(xmlContent) {
  const elements = [];
  const nodeRegex = /<node[^>]+>/g;
  const matches = xmlContent.match(nodeRegex);
  
  if (!matches) return elements;
  
  matches.forEach((nodeStr, index) => {
    const getAttr = (attr) => {
      const match = nodeStr.match(new RegExp(`${attr}="([^"]*)"`, 'i'));
      return match ? match[1] : '';
    };
    
    const bounds = getAttr('bounds');
    if (bounds) {
      const element = {
        id: `element_${index}`,
        text: getAttr('text') || '',
        element_type: getAttr('class') || 'View',
        resource_id: getAttr('resource-id') || '',
        bounds: parseBounds(bounds),
        is_clickable: getAttr('clickable') === 'true',
        is_scrollable: getAttr('scrollable') === 'true',
        is_enabled: getAttr('enabled') !== 'false',
        checkable: getAttr('checkable') === 'true',
        checked: getAttr('checked') === 'true',
        selected: getAttr('selected') === 'true',
        password: getAttr('password') === 'true',
        content_desc: getAttr('content-desc') || ''
      };
      elements.push(element);
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

// 模拟ElementFilter.forElementDiscovery（应该不过滤）
function simulateElementDiscovery(elements) {
  console.log('🔍 ElementFilter.forElementDiscovery - 策略: NONE (不过滤)');
  return elements; // 不应该过滤任何元素
}

// 模拟前端过滤器逻辑
function simulateVisualElementFiltering(elements, config = {}) {
  const {
    searchText = '',
    selectedCategory = 'all',
    showOnlyClickable = false,
    hideCompletely = false,
    filterConfig = null
  } = config;
  
  console.log('🎯 模拟前端过滤器逻辑:');
  console.log('  - searchText:', searchText);
  console.log('  - selectedCategory:', selectedCategory);
  console.log('  - showOnlyClickable:', showOnlyClickable);
  console.log('  - hideCompletely:', hideCompletely);
  console.log('  - filterConfig:', filterConfig ? 'exists' : 'null');
  
  let filtered = elements;
  
  // 搜索过滤
  if (searchText.trim()) {
    const kw = searchText.trim().toLowerCase();
    filtered = filtered.filter(element => 
      element.text.toLowerCase().includes(kw) || 
      element.content_desc.toLowerCase().includes(kw)
    );
    console.log('  📝 搜索过滤后:', filtered.length, '个元素');
  }
  
  // 分类过滤
  if (selectedCategory !== 'all') {
    filtered = filtered.filter(element => element.category === selectedCategory);
    console.log('  📂 分类过滤后:', filtered.length, '个元素');
  }
  
  // 可点击过滤
  if (showOnlyClickable) {
    filtered = filtered.filter(element => element.is_clickable);
    console.log('  👆 可点击过滤后:', filtered.length, '个元素');
  }
  
  // 高级过滤（如果有配置）
  if (filterConfig) {
    console.log('  🔧 应用高级过滤配置...');
    // 这里应该应用FilterAdapter的逻辑
  }
  
  return filtered;
}

// 主测试流程
async function testCompleteFlow() {
  console.log('🚀 开始测试完整的前端数据流程...\n');
  
  // 1. 读取XML
  const xmlFile = path.join(process.cwd(), 'debug_xml', 'current_ui_dump.xml');
  const xmlContent = fs.readFileSync(xmlFile, 'utf-8');
  console.log('1️⃣ XML文件读取完成:', xmlContent.length, '字符\n');
  
  // 2. 模拟后端解析
  const backendElements = simulateBackendParsing(xmlContent);
  console.log('2️⃣ 后端解析结果:');
  console.log('  - 总元素数:', backendElements.length);
  console.log('  - 可点击元素数:', backendElements.filter(e => e.is_clickable).length);
  console.log('');
  
  // 3. 模拟ElementFilter.forElementDiscovery
  const discoveryElements = simulateElementDiscovery(backendElements);
  console.log('3️⃣ ElementFilter.forElementDiscovery结果:');
  console.log('  - 元素数:', discoveryElements.length);
  console.log('  - 可点击元素数:', discoveryElements.filter(e => e.is_clickable).length);
  console.log('');
  
  // 4. 模拟各种前端过滤场景
  console.log('4️⃣ 测试不同的前端过滤场景:\n');
  
  // 场景1: 默认设置（不过滤）
  const scenario1 = simulateVisualElementFiltering(discoveryElements, {});
  console.log('  场景1结果 - 默认设置:');
  console.log('    总元素:', scenario1.length);
  console.log('    可点击元素:', scenario1.filter(e => e.is_clickable).length);
  console.log('');
  
  // 场景2: 只显示可点击元素
  const scenario2 = simulateVisualElementFiltering(discoveryElements, {
    showOnlyClickable: true
  });
  console.log('  场景2结果 - 只显示可点击:');
  console.log('    总元素:', scenario2.length);
  console.log('    可点击元素:', scenario2.filter(e => e.is_clickable).length);
  console.log('');
  
  // 场景3: 搜索"登录"
  const scenario3 = simulateVisualElementFiltering(discoveryElements, {
    searchText: '登录'
  });
  console.log('  场景3结果 - 搜索"登录":');
  console.log('    总元素:', scenario3.length);
  console.log('    可点击元素:', scenario3.filter(e => e.is_clickable).length);
  console.log('');
  
  // 5. 详细显示可点击元素
  console.log('5️⃣ 所有可点击元素详情:');
  const clickableElements = discoveryElements.filter(e => e.is_clickable);
  clickableElements.forEach((element, index) => {
    console.log(`  ${index + 1}. "${element.text}" (${element.element_type})`);
    console.log(`     Resource-ID: ${element.resource_id}`);
    console.log(`     位置: [${element.bounds.left},${element.bounds.top}][${element.bounds.right},${element.bounds.bottom}]`);
  });
  
  console.log('\n✅ 测试完成!');
  
  // 6. 关键发现
  console.log('\n🔍 关键发现:');
  console.log('- XML解析正确识别了', clickableElements.length, '个可点击元素');
  console.log('- ElementFilter.forElementDiscovery 不应该过滤任何元素');
  console.log('- 如果前端只显示3个，问题可能在:');
  console.log('  1. 特定组件的showOnlyClickable设置');
  console.log('  2. 高级过滤器配置');
  console.log('  3. 搜索或分类过滤');
  console.log('  4. UI渲染逻辑');
}

testCompleteFlow().catch(console.error);