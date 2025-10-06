const fs = require('fs');

// 读取XML文件
const xml = fs.readFileSync('debug_xml/current_ui_dump.xml', 'utf8');

// 手动计算element_id - 根据<node出现的顺序
const nodeMatches = xml.match(/<node[^>]*>/g);
console.log('总共找到', nodeMatches.length, '个节点');

// 分析底部导航栏区域 - 查找ImageView和联系人文本
console.log('\n=== 底部导航栏结构分析 ===');

// 查找bottom_navgation区域
const bottomNavMatch = xml.match(/resource-id="com\.hihonor\.contacts:id\/bottom_navgation".*?(?=<\/node>)/s);
if (bottomNavMatch) {
  const bottomNavContent = bottomNavMatch[0];
  console.log('找到底部导航栏区域');
  
  // 在这个区域内查找ImageView和联系人文本
  const imageViewMatches = bottomNavContent.match(/<node[^>]*class="android\.widget\.ImageView"[^>]*>/g);
  const contactTextMatches = bottomNavContent.match(/<node[^>]*text="联系人"[^>]*>/g);
  
  console.log('\nImageView 元素数量:', imageViewMatches ? imageViewMatches.length : 0);
  console.log('联系人文本元素数量:', contactTextMatches ? contactTextMatches.length : 0);
  
  if (imageViewMatches) {
    imageViewMatches.forEach((match, index) => {
      console.log(`\nImageView ${index + 1}:`);
      console.log(match);
    });
  }
  
  if (contactTextMatches) {
    contactTextMatches.forEach((match, index) => {
      console.log(`\n联系人文本 ${index + 1}:`);
      console.log(match);
    });
  }
}

// 基于我们之前的分析，element_38应该是第二个ImageView，element_40应该是联系人文本
console.log('\n=== 根据之前分析推断的Element ID ===');

// 计算到底部导航栏之前有多少个<node>
const beforeBottomNav = xml.substring(0, xml.indexOf('bottom_navgation'));
const beforeBottomNavNodes = (beforeBottomNav.match(/<node/g) || []).length;

console.log('底部导航栏之前的节点数:', beforeBottomNavNodes);

// 在底部导航栏内部分析层级结构
const bottomNavStartIndex = xml.indexOf('bottom_navgation');
const bottomNavSection = xml.substring(bottomNavStartIndex);

// 查找第二个LinearLayout（联系人按钮容器）
const secondLinearLayoutMatch = bottomNavSection.match(/(<node[^>]*class="android\.widget\.LinearLayout"[^>]*>.*?)<node[^>]*class="android\.widget\.LinearLayout"[^>]*>/s);

if (secondLinearLayoutMatch) {
  const secondLinearLayoutContent = secondLinearLayoutMatch[0];
  console.log('\n找到第二个LinearLayout（联系人按钮区域）');
  
  // 在这个区域查找ImageView和联系人文本的相对位置
  const imageViewIndex = secondLinearLayoutContent.indexOf('ImageView');
  const contactTextIndex = secondLinearLayoutContent.indexOf('联系人');
  
  console.log('ImageView位置:', imageViewIndex);
  console.log('联系人文本位置:', contactTextIndex);
  
  if (imageViewIndex !== -1 && contactTextIndex !== -1) {
    console.log('两者都在同一个LinearLayout容器内');
    
    // 分析嵌套结构
    const imageViewNode = secondLinearLayoutContent.substring(imageViewIndex - 50, imageViewIndex + 100);
    const contactTextNode = secondLinearLayoutContent.substring(contactTextIndex - 50, contactTextIndex + 100);
    
    console.log('\nImageView节点片段:');
    console.log(imageViewNode);
    
    console.log('\n联系人文本节点片段:');
    console.log(contactTextNode);
  }
}

// 根据XML结构分析同级关系
console.log('\n=== 同级关系分析 ===');
console.log('根据XML结构分析:');
console.log('- 底部导航栏包含多个LinearLayout容器');
console.log('- 每个容器代表一个导航按钮');
console.log('- 联系人按钮容器内包含:');
console.log('  - ImageView (图标) - element_38');
console.log('  - LinearLayout container');
console.log('    - TextView (联系人文本) - element_40');
console.log('');
console.log('结论: element_38 (ImageView) 和 element_40 (TextView) 不是同级关系');
console.log('element_40 是 element_38 的侄子节点 (通过container LinearLayout间接相关)');