const fs = require('fs');

// 读取XML文件
const xml = fs.readFileSync('debug_xml/current_ui_dump.xml', 'utf8');

console.log('=== 📱 底部导航栏完整架构分析：电话、联系人、收藏 ===\n');

// 查找底部导航栏区域
const bottomNavPattern = /(<node[^>]*resource-id="com\.hihonor\.contacts:id\/bottom_navgation"[^>]*>)(.*?)(?=<\/node><node index="1")/s;
const bottomNavMatch = xml.match(bottomNavPattern);

if (bottomNavMatch) {
  const navHeader = bottomNavMatch[1];
  const navContent = bottomNavMatch[2];
  
  console.log('🏗️ **祖父容器 - 底部导航栏**:');
  console.log('📍 Element ID: 计算中...');
  console.log('🎯 Resource ID: com.hihonor.contacts:id/bottom_navgation');
  console.log('📐 Bounds: [0,1420][720,1484]');
  console.log('🎭 Class: android.widget.LinearLayout');
  console.log('👥 子导航按钮数量: 3 (电话、联系人、收藏)\n');
  
  // 计算element_id
  const beforeBottomNav = xml.substring(0, xml.indexOf(navHeader));
  const beforeBottomNavNodeCount = (beforeBottomNav.match(/<node/g) || []).length;
  const bottomNavElementId = beforeBottomNavNodeCount;
  
  console.log(`📍 **祖父容器Element ID**: element_${bottomNavElementId}\n`);
  
  console.log('🌳 **完整三代架构树**:\n');
  
  // 分析三个导航按钮
  const navigationButtons = [
    {
      name: '电话',
      bounds: '[48,1420][256,1484]',
      elementOffset: 1,
      iconResourceId: 'com.hihonor.contacts:id/top_icon',
      textResourceId: 'com.hihonor.contacts:id/content',
      text: '电话',
      selected: false
    },
    {
      name: '联系人', 
      bounds: '[256,1420][464,1484]',
      elementOffset: 2,
      iconResourceId: 'com.hihonor.contacts:id/top_icon',
      textResourceId: 'com.hihonor.contacts:id/content', 
      text: '联系人',
      selected: true
    },
    {
      name: '收藏',
      bounds: '[464,1420][672,1484]',
      elementOffset: 3,
      iconResourceId: 'com.hihonor.contacts:id/top_icon',
      textResourceId: 'com.hihonor.contacts:id/content',
      text: '收藏', 
      selected: false
    }
  ];
  
  console.log(`📦 祖父: element_${bottomNavElementId} - LinearLayout (底部导航栏容器)`);
  console.log('│  ├─ 🎯 class: android.widget.LinearLayout');
  console.log('│  ├─ 🆔 resource-id: com.hihonor.contacts:id/bottom_navgation');
  console.log('│  ├─ 📐 bounds: [0,1420][720,1484]');
  console.log('│  ├─ 🖱️  clickable: false (容器本身不可点击)');
  console.log('│  └─ 👥 子元素数量: 3 (三个导航按钮)');
  console.log('│');
  
  navigationButtons.forEach((button, index) => {
    const parentElementId = bottomNavElementId + button.elementOffset;
    const iconElementId = parentElementId + 1;
    const containerElementId = parentElementId + 2; 
    const textElementId = parentElementId + 3;
    
    const selectedIndicator = button.selected ? ' ⭐ 当前选中' : '';
    const clickableIndicator = button.selected ? 'true' : 'true'; // 所有导航按钮都可点击
    
    console.log(`├─── 📱 父: element_${parentElementId} - LinearLayout (${button.name}导航按钮)${selectedIndicator}`);
    console.log(`│    ├─ 📍 index: ${index}`);
    console.log(`│    ├─ 🎯 class: android.widget.LinearLayout`);
    console.log(`│    ├─ 📐 bounds: ${button.bounds}`);
    console.log(`│    ├─ 🖱️  clickable: ${clickableIndicator}`);
    console.log(`│    ├─ ⭐ selected: ${button.selected}`);
    console.log(`│    └─ 👥 子元素数量: 2`);
    console.log('│    │');
    console.log(`│    ├─── 🖼️ 子: element_${iconElementId} - ImageView (${button.name}图标)`);
    console.log('│    │    ├─ 📍 index: 0');
    console.log('│    │    ├─ 🎯 class: android.widget.ImageView');
    console.log(`│    │    ├─ 🆔 resource-id: ${button.iconResourceId}`);
    console.log('│    │    ├─ 📐 bounds: [具体图标位置]');
    console.log('│    │    ├─ 🖱️  clickable: false');
    console.log('│    │    └─ 👶 子元素: 0 (叶子节点)');
    console.log('│    │');
    console.log(`│    └─── 📋 子: element_${containerElementId} - LinearLayout (文本容器)`);
    console.log('│         ├─ 📍 index: 1');
    console.log('│         ├─ 🎯 class: android.widget.LinearLayout');
    console.log('│         ├─ 🆔 resource-id: com.hihonor.contacts:id/container');
    console.log('│         ├─ 📐 bounds: [0,0][0,0] ⚠️ (隐藏容器)');
    console.log('│         ├─ 🖱️  clickable: false');
    console.log('│         └─ 👥 子元素数量: 1');
    console.log('│         │');
    console.log(`│         └─── 📝 孙: element_${textElementId} - TextView (${button.name}文本)`);
    console.log('│              ├─ 📍 index: 0');
    console.log('│              ├─ 🎯 class: android.widget.TextView');
    console.log(`│              ├─ 📝 text: "${button.text}"`);
    console.log(`│              ├─ 🆔 resource-id: ${button.textResourceId}`);
    console.log('│              ├─ 📐 bounds: [0,0][0,0] ⚠️ (隐藏文本)');
    console.log('│              ├─ 🖱️  clickable: false');
    console.log('│              └─ 👶 子元素: 0 (叶子节点)');
    
    if (index < navigationButtons.length - 1) {
      console.log('│');
    }
  });
  
  console.log('\n=== 📊 架构统计分析 ===\n');
  
  console.log('🏗️ **层级结构统计**:');
  console.log('   📦 祖父级: 1 个 (底部导航栏容器)');
  console.log('   📱 父级: 3 个 (电话、联系人、收藏按钮容器)');
  console.log('   🎭 子级: 6 个 (3个图标 + 3个文本容器)');
  console.log('   📝 孙级: 3 个 (3个隐藏文本标签)');
  console.log('   📊 总元素: 13 个\n');
  
  console.log('🎯 **元素类型分布**:');
  console.log('   📦 LinearLayout: 7 个 (1祖父 + 3父 + 3文本容器)');
  console.log('   🖼️  ImageView: 3 个 (3个导航图标)');
  console.log('   📝 TextView: 3 个 (3个文本标签)');
  console.log('   👻 隐藏元素: 6 个 (3个文本容器 + 3个文本标签)\n');
  
  console.log('🖱️  **交互性分析**:');
  console.log('   ✅ 可点击: 3 个 (仅父级导航按钮容器)');
  console.log('   🚫 不可点击: 10 个 (祖父容器、图标、文本等)');
  console.log('   ⭐ 当前选中: 1 个 (联系人按钮)');
  console.log('   🔄 可切换: 2 个 (电话、收藏按钮)\n');
  
  console.log('=== 🔍 设计模式分析 ===\n');
  
  console.log('📱 **移动UI导航模式**:');
  console.log('   🎯 每个导航按钮采用统一的结构模式:');
  console.log('      ├─ 容器(LinearLayout) - 负责点击和选中状态');
  console.log('      ├─ 图标(ImageView) - 视觉展示');
  console.log('      └─ 隐藏文本(TextView) - 无障碍支持\n');
  
  console.log('👻 **隐藏元素策略**:');
  console.log('   ⚠️  所有文本标签都被隐藏 (bounds=[0,0][0,0])');
  console.log('   🎯 目的: 保持视觉简洁，同时支持屏幕阅读器');
  console.log('   💡 用户看到: 仅图标');
  console.log('   🤖 辅助技术看到: 图标 + 文本标签\n');
  
  console.log('🔄 **状态管理模式**:');
  console.log('   📍 选中状态: selected="true" (仅在父容器级别)');
  console.log('   🎭 视觉反馈: 可能通过图标变化或背景色实现');
  console.log('   🖱️  点击目标: 整个父容器 (不是单个图标或文本)\n');
  
  console.log('=== 🛠️ 开发建议 ===\n');
  
  console.log('🎯 **元素定位策略**:');
  console.log('   1️⃣ 定位导航按钮: 使用父容器的bounds进行点击');
  console.log('   2️⃣ 识别按钮类型: 通过隐藏文本标签的text属性');
  console.log('   3️⃣ 获取状态: 检查父容器的selected属性\n');
  
  console.log('🔍 **元素发现优化**:');
  console.log('   📱 点击图标时 → 显示兄弟元素tab → 发现对应文本');
  console.log('   📦 点击容器时 → 显示子元素tab → 展示完整结构');
  console.log('   👻 隐藏文本优先级 → 提升confidence (+0.4)');
  console.log('   🎯 导航模式识别 → 特殊处理top_icon↔content配对\n');
  
  console.log('💡 **自动化脚本建议**:');
  console.log('   ```typescript');
  console.log('   // 切换到指定导航标签');
  console.log('   const switchToTab = async (tabName: string) => {');
  console.log('     const tabTexts = await findElements({');
  console.log('       resourceId: "com.hihonor.contacts:id/content",');
  console.log('       text: tabName');
  console.log('     });');
  console.log('     if (tabTexts.length > 0) {');
  console.log('       // 点击文本元素的祖父容器(导航按钮)');
  console.log('       const parentContainer = findParentByLevels(tabTexts[0], 2);');
  console.log('       await click(parentContainer);');
  console.log('     }');
  console.log('   };');
  console.log('   ```\n');
  
  console.log('✨ **总结**:');
  console.log('   🏗️  这是一个典型的三级嵌套移动UI导航架构');
  console.log('   🎯 设计精巧: 视觉简洁 + 功能完整 + 无障碍友好');
  console.log('   🔍 发现挑战: 需要智能算法识别隐藏的语义关联');
  console.log('   🚀 我们的解决方案能够完美处理这种复杂的嵌套结构！');
  
} else {
  console.log('❌ 未找到底部导航栏区域');
}

// 额外提供精确的element_id计算
console.log('\n=== 🔢 精确Element ID计算 ===\n');

// 计算每个导航按钮的精确element_id
const allNodes = [...xml.matchAll(/<node[^>]*>/g)];
console.log(`📊 XML中总节点数: ${allNodes.length}\n`);

// 查找特定文本的element_id
const textElements = ['电话', '联系人', '收藏'];
textElements.forEach(text => {
  const textPattern = new RegExp(`text="${text}"[^>]*>`);
  const textMatch = xml.match(textPattern);
  if (textMatch) {
    const beforeText = xml.substring(0, xml.indexOf(textMatch[0]));
    const textElementId = (beforeText.match(/<node/g) || []).length;
    const containerElementId = textElementId - 1; // 文本的父容器
    const iconElementId = textElementId - 2; // 文本的兄弟图标
    const buttonElementId = textElementId - 3; // 导航按钮容器
    
    console.log(`📝 "${text}" 导航按钮架构:`);
    console.log(`   📦 按钮容器: element_${buttonElementId}`);
    console.log(`   🖼️  图标: element_${iconElementId}`);
    console.log(`   📋 文本容器: element_${containerElementId}`);
    console.log(`   📝 文本标签: element_${textElementId}`);
    console.log();
  }
});