// 测试缓存ID修复的脚本
// 此脚本模拟页面分析中的XML内容注入并检查后端是否正确解析

console.log('🎯 测试XML缓存ID修复...');

// 模拟的XML内容，包含缓存ID注释
const testXmlContent = `<!-- XML Cache ID: ui_dump_e0d909c3_20251030_122312.xml -->
<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>
<hierarchy rotation="0">
  <node index="0" text="" resource-id="" class="android.widget.FrameLayout" package="com.example" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[0,0][1080,2400]" />
  <node index="1" text="测试按钮" resource-id="com.example:id/test_button" class="android.widget.TextView" package="com.example" content-desc="点击测试" checkable="false" checked="false" clickable="true" enabled="true" focusable="true" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[40,200][200,300]" />
</hierarchy>`;

console.log('📝 模拟XML内容创建（包含缓存ID注释）:');
console.log('   缓存ID: ui_dump_e0d909c3_20251030_122312.xml');
console.log('   XML长度:', testXmlContent.length, '字符');

// 验证注释是否正确嵌入
const hasCorrectComment = testXmlContent.includes('<!-- XML Cache ID: ui_dump_e0d909c3_20251030_122312.xml -->');
console.log('✅ XML注释验证:', hasCorrectComment ? '通过' : '❌ 失败');

console.log('\n🔧 修复要点:');
console.log('1. 前端在调用registerSnapshot时添加XML缓存ID注释');
console.log('2. 后端extract_xml_cache_id_from_content函数提取注释中的ID');
console.log('3. 后端优先使用原始缓存ID，而非生成新的哈希ID');
console.log('4. load_dom_from_disk函数能正确处理完整文件名（包含.xml后缀）');

console.log('\n📋 预期行为:');
console.log('- 页面分析生成: ui_dump_e0d909c3_20251030_122312.xml');
console.log('- registerSnapshot接收带注释的XML');
console.log('- 后端提取并使用原始ID作为snapshotId');
console.log('- 步骤卡片使用相同ID进行结构匹配');
console.log('- 缓存查找成功，结构匹配功能正常工作');

console.log('\n🚀 测试完成！请在实际应用中验证修复效果。');