const fs = require('fs');

// 读取XML文件
const xml = fs.readFileSync('debug_xml/current_ui_dump.xml', 'utf8');

console.log('=== Element_38 和 Element_40 层级关系分析 ===\n');

// 手动计算每个<node>的element_id
const nodeMatches = [...xml.matchAll(/<node[^>]*>/g)];
console.log(`总共找到 ${nodeMatches.length} 个<node>元素\n`);

// 查找底部导航栏中的关键元素
console.log('=== 底部导航栏中的ImageView和联系人文本 ===');

// 从grep结果可以看到，底部导航栏中的"联系人"文本有特殊的bounds="[0,0][0,0]"
// 这是隐藏文本的标志

// 寻找底部导航栏区域的起始位置
const bottomNavIndex = xml.indexOf('bottom_navgation');
console.log('找到底部导航栏位置:', bottomNavIndex);

// 分析到底部导航栏为止的节点数量
const beforeBottomNav = xml.substring(0, bottomNavIndex);
const beforeBottomNavNodeCount = (beforeBottomNav.match(/<node/g) || []).length;
console.log('底部导航栏之前的节点数:', beforeBottomNavNodeCount);

// 现在分析底部导航栏内的结构
const bottomNavSection = xml.substring(bottomNavIndex);

// 查找第二个LinearLayout（联系人按钮容器）- 从grep结果看bounds="[256,1420][464,1484]"
const contactButtonMatch = bottomNavSection.match(/bounds="\[256,1420\]\[464,1484\]".*?(?=<node index="2")/s);

if (contactButtonMatch) {
  const contactButtonSection = contactButtonMatch[0];
  console.log('\n找到联系人按钮容器区域');
  
  // 在这个区域内查找ImageView
  const imageViewMatch = contactButtonSection.match(/<node[^>]*class="android\.widget\.ImageView"[^>]*>/);
  if (imageViewMatch) {
    console.log('\n找到ImageView元素:');
    console.log(imageViewMatch[0]);
    
    // 计算ImageView的element_id
    const beforeImageView = xml.substring(0, xml.indexOf(imageViewMatch[0]));
    const imageViewElementId = (beforeImageView.match(/<node/g) || []).length;
    console.log(`ImageView的element_id: element_${imageViewElementId}`);
  }
  
  // 查找联系人文本
  const contactTextMatch = contactButtonSection.match(/<node[^>]*text="联系人"[^>]*>/);
  if (contactTextMatch) {
    console.log('\n找到联系人文本元素:');
    console.log(contactTextMatch[0]);
    
    // 计算联系人文本的element_id
    const beforeContactText = xml.substring(0, xml.indexOf(contactTextMatch[0]));
    const contactTextElementId = (beforeContactText.match(/<node/g) || []).length;
    console.log(`联系人文本的element_id: element_${contactTextElementId}`);
    
    // 分析bounds
    const boundsMatch = contactTextMatch[0].match(/bounds="([^"]*)"/);
    if (boundsMatch) {
      console.log(`联系人文本的bounds: ${boundsMatch[1]}`);
      if (boundsMatch[1] === '[0,0][0,0]') {
        console.log('✅ 这是隐藏文本元素（bounds=[0,0][0,0]）');
      }
    }
  }
}

// 详细分析层级结构
console.log('\n=== 详细层级结构分析 ===');

// 根据XML结构分析，我们需要找到联系人按钮的完整结构
const contactButtonFullMatch = xml.match(/bounds="\[256,1420\]\[464,1484\]"[^>]*>(.*?)<node index="2"/s);

if (contactButtonFullMatch) {
  const fullStructure = contactButtonFullMatch[1];
  console.log('\n联系人按钮完整结构:');
  
  // 计算嵌套层级
  const lines = fullStructure.split('<node');
  let currentLevel = 0;
  
  lines.forEach((line, index) => {
    if (index === 0) return; // 跳过第一个空行
    
    // 检查是否是闭合标签
    if (line.includes('/>')) {
      console.log(`  Level ${currentLevel}: ${line.substring(0, 80)}...`);
    } else {
      console.log(`  Level ${currentLevel}: ${line.substring(0, 80)}...`);
      currentLevel++;
    }
  });
}

console.log('\n=== 最终结论 ===');
console.log('基于XML结构分析:');
console.log('');
console.log('联系人导航按钮结构:');
console.log('└── LinearLayout (联系人按钮容器) bounds="[256,1420][464,1484]"');
console.log('    ├── ImageView (element_38) bounds="[336,1436][384,1484]"');
console.log('    └── LinearLayout (container) bounds="[0,0][0,0]"');
console.log('        └── TextView (element_40) text="联系人" bounds="[0,0][0,0]"');
console.log('');
console.log('答案: ❌ element_38 和 element_40 不是同级的');
console.log('');
console.log('层级关系:');
console.log('- element_38 (ImageView) 是第一层子节点');
console.log('- element_40 (TextView) 是第三层子节点 (通过一个container LinearLayout)');
console.log('- element_40 是 element_38 的"侄子节点"');
console.log('');
console.log('这解释了为什么:');
console.log('1. 点击ImageView时，子元素tab是空的（ImageView没有直接子元素）');
console.log('2. 需要兄弟元素tab来显示同级的container及其子元素');
console.log('3. 联系人文本是隐藏的（bounds=[0,0][0,0]），需要特殊发现算法');