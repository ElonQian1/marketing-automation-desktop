const fs = require('fs');

// 读取XML文件
const xml = fs.readFileSync('debug_xml/current_ui_dump.xml', 'utf8');

console.log('=== 联系人导航按钮容器完整子孙元素结构分析 ===\n');

// 查找联系人按钮容器 - bounds="[256,1420][464,1484]"
const contactButtonPattern = /(<node[^>]*bounds="\[256,1420\]\[464,1484\]"[^>]*>)(.*?)(?=<node index="2")/s;
const contactButtonMatch = xml.match(contactButtonPattern);

if (contactButtonMatch) {
  const containerHeader = contactButtonMatch[1];
  const containerContent = contactButtonMatch[2];
  
  console.log('🏗️ 联系人导航按钮容器信息:');
  console.log(containerHeader);
  console.log();
  
  // 解析容器内的所有节点
  const nodes = [];
  let elementId = 0;
  
  // 计算到联系人按钮容器之前的节点数量，用于确定起始element_id
  const beforeContainer = xml.substring(0, xml.indexOf(containerHeader));
  const beforeContainerNodeCount = (beforeContainer.match(/<node/g) || []).length;
  
  console.log(`📍 容器在XML中的位置: element_${beforeContainerNodeCount}`);
  console.log();
  
  // 分析容器内的结构
  console.log('📋 容器内部结构分析:');
  
  // 手动解析每个节点
  const nodeMatches = [...containerContent.matchAll(/<node([^>]*)>(.*?)<\/node>|<node([^>]*)\s*\/>/gs)];
  
  nodeMatches.forEach((match, index) => {
    const currentElementId = beforeContainerNodeCount + 1 + index;
    const nodeAttributes = match[1] || match[3] || '';
    
    // 提取关键属性
    const indexMatch = nodeAttributes.match(/index="([^"]*)"/);
    const textMatch = nodeAttributes.match(/text="([^"]*)"/);
    const resourceIdMatch = nodeAttributes.match(/resource-id="([^"]*)"/);
    const classMatch = nodeAttributes.match(/class="([^"]*)"/);
    const boundsMatch = nodeAttributes.match(/bounds="([^"]*)"/);
    const clickableMatch = nodeAttributes.match(/clickable="([^"]*)"/);
    
    const nodeInfo = {
      elementId: `element_${currentElementId}`,
      index: indexMatch ? indexMatch[1] : '',
      text: textMatch ? textMatch[1] : '',
      resourceId: resourceIdMatch ? resourceIdMatch[1] : '',
      className: classMatch ? classMatch[1] : '',
      bounds: boundsMatch ? boundsMatch[1] : '',
      clickable: clickableMatch ? clickableMatch[1] : 'false',
      hasContent: !!match[2] && !match[2].trim().startsWith('<')
    };
    
    nodes.push(nodeInfo);
  });
  
  // 显示层级结构
  console.log('🌳 完整层级结构树:');
  console.log();
  
  let treeLevel = 0;
  const indent = (level) => '  '.repeat(level);
  
  console.log(`${indent(0)}📦 联系人导航按钮容器 (element_${beforeContainerNodeCount})`);
  console.log(`${indent(0)}   └─ class: android.widget.LinearLayout`);
  console.log(`${indent(0)}   └─ bounds: [256,1420][464,1484]`);
  console.log(`${indent(0)}   └─ clickable: true`);
  console.log(`${indent(0)}   └─ selected: true (当前选中的导航项)`);
  console.log();
  
  nodes.forEach((node, index) => {
    const level = parseInt(node.index) + 1;
    const icon = node.className.includes('ImageView') ? '🖼️' : 
                 node.className.includes('TextView') ? '📝' : 
                 node.className.includes('LinearLayout') ? '📋' : '🔹';
    
    console.log(`${indent(level)}${icon} ${node.elementId}`);
    console.log(`${indent(level)}   ├─ index: ${node.index}`);
    console.log(`${indent(level)}   ├─ class: ${node.className}`);
    if (node.text) {
      console.log(`${indent(level)}   ├─ text: "${node.text}"`);
    }
    if (node.resourceId) {
      console.log(`${indent(level)}   ├─ resource-id: ${node.resourceId}`);
    }
    console.log(`${indent(level)}   ├─ bounds: ${node.bounds}`);
    console.log(`${indent(level)}   └─ clickable: ${node.clickable}`);
    
    // 特殊标注
    if (node.bounds === '[0,0][0,0]') {
      console.log(`${indent(level)}   ⚠️  隐藏元素 (bounds=[0,0][0,0])`);
    }
    if (node.text === '联系人') {
      console.log(`${indent(level)}   ⭐ 这是目标文本元素`);
    }
    if (node.className.includes('ImageView')) {
      console.log(`${indent(level)}   🎯 这是图标元素`);
    }
    console.log();
  });
  
  console.log('=== 🔍 关键发现与分析 ===\n');
  
  // 统计分析
  const imageViews = nodes.filter(n => n.className.includes('ImageView'));
  const textViews = nodes.filter(n => n.className.includes('TextView'));
  const linearLayouts = nodes.filter(n => n.className.includes('LinearLayout'));
  const hiddenElements = nodes.filter(n => n.bounds === '[0,0][0,0]');
  const clickableElements = nodes.filter(n => n.clickable === 'true');
  
  console.log('📊 元素统计:');
  console.log(`   🖼️  ImageView: ${imageViews.length} 个`);
  console.log(`   📝 TextView: ${textViews.length} 个`);
  console.log(`   📋 LinearLayout: ${linearLayouts.length} 个`);
  console.log(`   👻 隐藏元素: ${hiddenElements.length} 个`);
  console.log(`   🖱️  可点击元素: ${clickableElements.length} 个`);
  console.log();
  
  console.log('🎯 关键元素识别:');
  imageViews.forEach(node => {
    console.log(`   🖼️  ${node.elementId}: ${node.resourceId} (${node.bounds})`);
  });
  textViews.forEach(node => {
    console.log(`   📝 ${node.elementId}: "${node.text}" (${node.bounds})`);
  });
  console.log();
  
  console.log('⚠️  特殊情况:');
  hiddenElements.forEach(node => {
    console.log(`   👻 ${node.elementId}: 隐藏${node.className.split('.').pop()} "${node.text}"`);
  });
  
} else {
  console.log('❌ 未找到联系人导航按钮容器');
}

console.log('\n=== 🛠️ 处理策略建议 ===\n');

console.log('🎯 针对这种复杂层级结构的处理方案:\n');

console.log('1️⃣ **层级遍历策略**:');
console.log('   • 容器元素 -> 直接子元素 -> 孙子元素');
console.log('   • 优先发现可见元素，再发现隐藏元素');
console.log('   • 使用递归深度优先遍历\n');

console.log('2️⃣ **元素关系映射**:');
console.log('   • ImageView (图标) ↔ TextView (文本标签)');
console.log('   • 容器clickable=true -> 整体可点击');
console.log('   • 建立"语义关联"而非仅"DOM父子关系"\n');

console.log('3️⃣ **兄弟元素发现算法**:');
console.log('   • 当点击ImageView时:');
console.log('     - 查找同级LinearLayout容器');
console.log('     - 递归搜索容器内的TextView');
console.log('     - 特别处理bounds=[0,0][0,0]的隐藏元素\n');

console.log('4️⃣ **智能Tab选择逻辑**:');
console.log('   • ImageView + 无直接子元素 -> 显示兄弟元素tab');
console.log('   • 隐藏文本元素优先级 +0.3 confidence');
console.log('   • 相同resource-id前缀的元素优先级 +0.2\n');

console.log('5️⃣ **用户体验优化**:');
console.log('   • 自动切换到最相关的tab页面');
console.log('   • 高亮显示语义相关的元素');
console.log('   • 提供"为什么显示这些元素"的解释\n');

console.log('6️⃣ **实现代码建议**:');
console.log('```typescript');
console.log('// 在findSiblingElements函数中');
console.log('const enhanceConfidenceForNavElements = (element, target) => {');
console.log('  let confidence = baseConfidence;');
console.log('  ');
console.log('  // 导航按钮特殊处理');
console.log('  if (target.resourceId?.includes("top_icon") && ');
console.log('      element.resourceId?.includes("content")) {');
console.log('    confidence += 0.4; // 图标-文本配对');
console.log('  }');
console.log('  ');
console.log('  // 隐藏元素优先级提升');
console.log('  if (element.bounds === "[0,0][0,0]" && element.text) {');
console.log('    confidence += 0.3;');
console.log('  }');
console.log('  ');
console.log('  return confidence;');
console.log('};');
console.log('```\n');

console.log('✨ **最佳实践总结**:');
console.log('   🔍 基于语义而非仅基于DOM结构进行元素发现');
console.log('   🧠 使用智能算法识别元素间的功能关联');
console.log('   🎯 针对移动UI的特殊模式（隐藏文本）做特殊处理');
console.log('   🚀 提供直观的用户体验，自动选择最相关的信息');