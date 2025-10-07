#!/usr/bin/env node

// 诊断LocalArchitectureAnalyzer的层级构建问题

import fs from 'fs';

console.log('🔍 诊断局部架构分析器层级构建问题...\n');

// 从XML中找到底部导航相关的XML结构
const xmlContent = fs.readFileSync('debug_xml/current_ui_dump.xml', 'utf-8');

// 解析底部导航结构
console.log('📋 从XML分析底部导航的真实结构:');
console.log('');

// 查找bottom_navgation容器
const bottomNavMatch = xmlContent.match(/<node[^>]*resource-id="com\.hihonor\.contacts:id\/bottom_navgation"[^>]*>/);
if (bottomNavMatch) {
  console.log('✅ 找到bottom_navigation容器');
  console.log('   应该是祖父级容器 (element_33)');
} else {
  console.log('❌ 未找到bottom_navigation容器');
}

// 分析导航按钮结构
const phoneButtonPattern = /<node[^>]*bounds="\[48,1420\]\[256,1484\]"[^>]*>/;
const contactButtonPattern = /<node[^>]*bounds="\[256,1420\]\[464,1484\]"[^>]*>/;
const favoriteButtonPattern = /<node[^>]*bounds="\[464,1420\]\[672,1484\]"[^>]*>/;

console.log('\n📞 导航按钮分析:');
if (xmlContent.match(phoneButtonPattern)) {
  console.log('✅ 电话按钮: [48,1420][256,1484] - 应该是element_34');
}
if (xmlContent.match(contactButtonPattern)) {
  console.log('✅ 联系人按钮: [256,1420][464,1484] - 应该是element_38 (目标)');
}
if (xmlContent.match(favoriteButtonPattern)) {
  console.log('✅ 收藏按钮: [464,1420][672,1484] - 应该是element_42');
}

// 分析文本元素问题
console.log('\n📝 文本元素分析:');
const textMatches = xmlContent.match(/text="(电话|联系人|收藏)"/g);
if (textMatches) {
  console.log('✅ 找到文本元素:', textMatches);
  console.log('⚠️ 但这些文本元素的bounds都是[0,0][0,0]，说明它们是隐藏元素');
} else {
  console.log('❌ 未找到文本元素');
}

// 分析层级结构问题
console.log('\n🏗️ 层级结构问题分析:');
console.log('问题1: bounds=[0,0][0,0]的隐藏元素可能没有被正确处理');
console.log('问题2: buildLocalHierarchy的跳过逻辑可能破坏了父子关系');
console.log('问题3: 文本元素的container父节点也是隐藏的');

console.log('\n💡 修复建议:');
console.log('1. 修改buildLocalHierarchy，正确处理跳过的XML节点');
console.log('2. 确保隐藏元素也能建立正确的父子关系');
console.log('3. 修复setRelationships方法，基于真实的parent-children关系进行分类');

// 查找具体的XML节点层级
console.log('\n🔍 XML层级详细分析:');

// 提取bottom_navigation到其子节点的XML片段
const navStart = xmlContent.indexOf('resource-id="com.hihonor.contacts:id/bottom_navgation"');
if (navStart > -1) {
  const nodeStart = xmlContent.lastIndexOf('<node', navStart);
  const nextNodeStart = xmlContent.indexOf('</node></node></node>', navStart + 1000);
  const navXml = xmlContent.substring(nodeStart, nextNodeStart + 21);
  
  console.log('📦 底部导航XML结构片段:');
  console.log(navXml.substring(0, 1000) + '...');
  
  // 分析层级深度
  const lines = navXml.split('\n');
  lines.slice(0, 20).forEach((line, index) => {
    if (line.includes('<node')) {
      const depth = (line.match(/  /g) || []).length;
      const bounds = line.match(/bounds="([^"]+)"/)?.[1] || '无bounds';
      const resourceId = line.match(/resource-id="([^"]+)"/)?.[1] || '无resource-id';
      const text = line.match(/text="([^"]+)"/)?.[1] || '无text';
      
      console.log(`  层级${depth}: bounds=${bounds}, resource-id=${resourceId}, text=${text}`);
    }
  });
}

console.log('\n✨ 期望的修复结果:');
console.log('element_33 (bottom_navigation) → parent');
console.log('element_34/38/42 (导航按钮) → children of element_33');  
console.log('element_35/39/43 (图标) → children of 导航按钮');
console.log('element_36/40/44 (文本容器) → children of 导航按钮');
console.log('element_37/41/45 (文本) → children of 文本容器');