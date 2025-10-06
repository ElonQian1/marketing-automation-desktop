// 解析XML结构，生成element ID映射
import fs from 'fs';
import xml2js from 'xml2js';

// 读取XML文件
const xmlContent = fs.readFileSync('debug_xml/current_ui_dump.xml', 'utf8');

// 解析XML
const parser = new xml2js.Parser({
  explicitArray: false,
  mergeAttrs: true
});

let elementCounter = 0;
const elementMap = new Map();

function processNode(node, parentId = null, depth = 0) {
  elementCounter++;
  const elementId = `element_${elementCounter}`;
  
  const element = {
    id: elementId,
    index: node.index || '0',
    text: node.text || '',
    resource_id: node['resource-id'] || '',
    element_type: node.class || '',
    package: node.package || '',
    content_desc: node['content-desc'] || '',
    bounds: node.bounds || '',
    clickable: node.clickable === 'true',
    enabled: node.enabled === 'true',
    selected: node.selected === 'true',
    parentId: parentId,
    depth: depth,
    children: []
  };
  
  elementMap.set(elementId, element);
  
  // 输出重要的导航元素
  if (element.resource_id.includes('bottom_navgation') || 
      element.text.includes('电话') || 
      element.text.includes('联系人') || 
      element.text.includes('收藏') ||
      element.bounds.includes('1420')) {
    console.log(`${elementId}: ${element.element_type} - "${element.text}" - ${element.resource_id} - ${element.bounds}`);
  }
  
  // 递归处理子节点
  if (node.node) {
    const children = Array.isArray(node.node) ? node.node : [node.node];
    children.forEach(child => {
      const childId = processNode(child, elementId, depth + 1);
      element.children.push(childId);
    });
  }
  
  return elementId;
}

parser.parseString(xmlContent, (err, result) => {
  if (err) {
    console.error('解析XML失败:', err);
    return;
  }
  
  console.log('开始解析XML结构...\n');
  
  // 从根节点开始处理
  processNode(result.hierarchy.node);
  
  console.log(`\n总共找到 ${elementCounter} 个元素`);
  
  // 查找底部导航相关元素
  console.log('\n=== 底部导航结构分析 ===');
  
  for (const [id, element] of elementMap) {
    if (element.resource_id === 'com.hihonor.contacts:id/bottom_navgation') {
      console.log(`\n🧭 底部导航容器: ${id}`);
      console.log(`   类型: ${element.element_type}`);
      console.log(`   边界: ${element.bounds}`);
      console.log(`   子元素: ${element.children.length}个`);
      
      // 输出所有子元素
      element.children.forEach(childId => {
        const child = elementMap.get(childId);
        console.log(`\n   📦 子元素: ${childId}`);
        console.log(`      类型: ${child.element_type}`);
        console.log(`      边界: ${child.bounds}`);
        console.log(`      可点击: ${child.clickable}`);
        console.log(`      选中状态: ${child.selected}`);
        console.log(`      子元素: ${child.children.length}个`);
        
        // 输出孙子元素
        child.children.forEach(grandChildId => {
          const grandChild = elementMap.get(grandChildId);
          console.log(`         🔸 孙子: ${grandChildId} - ${grandChild.element_type} - "${grandChild.text}" - ${grandChild.resource_id}`);
        });
      });
    }
  }
});