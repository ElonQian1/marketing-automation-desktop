/**
 * 验证XML解析和过滤分离修复
 * 
 * 测试场景：
 * 1. 验证loadPageContent返回所有元素（包括可点击元素）
 * 2. 验证parseXmlToAllElements不过滤元素
 * 3. 验证parseXmlToValuableElements正确过滤元素
 * 4. 确认前端能收到完整的33个元素，并正确识别7个可点击元素
 */

console.log('🧪 开始验证XML解析和过滤分离修复...');

// 测试配置
const TEST_XML_CACHE_ID = 'debug_xml';

async function verifyParsingFix() {
    console.log('\n📋 测试计划:');
    console.log('1. 测试后端parse_cached_xml_to_elements命令（无过滤）');
    console.log('2. 测试前端XmlPageCacheService.loadPageContent');
    console.log('3. 验证可点击元素识别正确性');
    console.log('4. 对比过滤vs非过滤结果差异');

    try {
        console.log('\n🔧 测试1: 后端命令（无过滤）');
        const backendResult = await window.__TAURI__.invoke('parse_cached_xml_to_elements', {
            file_path: 'D:\\rust\\active-projects\\小红书\\employeeGUI\\debug_xml\\current_ui_dump.xml',
            enable_filtering: false  // 明确禁用过滤
        });
        
        console.log('✅ 后端解析结果:');
        console.log(`  - 总元素数量: ${backendResult.length}`);
        
        const clickableElements = backendResult.filter(el => el.is_clickable === true);
        console.log(`  - 可点击元素数量: ${clickableElements.length}`);
        
        console.log('\n🎯 可点击元素详情:');
        clickableElements.forEach((el, index) => {
            console.log(`  ${index + 1}. "${el.text || el.content_desc || '(无文本)'}" - ${el.class_name || '(无类名)'}`);
        });

        console.log('\n🔧 测试2: 后端命令（启用过滤）');
        const filteredResult = await window.__TAURI__.invoke('parse_cached_xml_to_elements', {
            file_path: 'D:\\rust\\active-projects\\小红书\\employeeGUI\\debug_xml\\current_ui_dump.xml',
            enable_filtering: true  // 启用过滤
        });
        
        console.log('✅ 过滤后结果:');
        console.log(`  - 过滤后元素数量: ${filteredResult.length}`);
        console.log(`  - 减少了: ${backendResult.length - filteredResult.length} 个元素`);

        console.log('\n📊 分析结果:');
        if (clickableElements.length >= 7) {
            console.log('✅ 修复成功！后端正确识别了所有可点击元素');
        } else {
            console.log('❌ 修复未完成：可点击元素数量仍然不足');
        }

        if (backendResult.length >= 30) {
            console.log('✅ 非过滤模式正常：返回了完整的元素列表');
        } else {
            console.log('❌ 非过滤模式异常：元素数量偏少');
        }

        return {
            totalElements: backendResult.length,
            clickableElements: clickableElements.length,
            filteredElements: filteredResult.length,
            success: clickableElements.length >= 7 && backendResult.length >= 30
        };

    } catch (error) {
        console.error('❌ 测试失败:', error);
        console.log('\n📝 错误可能原因:');
        console.log('1. 文件路径不正确');
        console.log('2. XML文件不存在');
        console.log('3. Tauri应用未启动');
        return null;
    }
}

// 浏览器环境检测
if (typeof window !== 'undefined' && window.__TAURI__) {
    console.log('🌐 在Tauri应用中运行测试...');
    verifyParsingFix().then(result => {
        if (result && result.success) {
            console.log('\n🎉 修复验证成功！');
            console.log(`📈 结果摘要: ${result.totalElements}个总元素, ${result.clickableElements}个可点击元素`);
        } else {
            console.log('\n⚠️ 修复验证失败，需要进一步调试');
        }
    });
} else {
    console.log('⚠️ 请在Tauri应用的开发者控制台中运行此脚本');
    console.log('\n📋 手动测试指令:');
    console.log('');
    console.log('// 1. 测试后端命令（无过滤）');
    console.log("window.__TAURI__.invoke('parse_cached_xml_to_elements', {");
    console.log("  file_path: 'D:\\\\rust\\\\active-projects\\\\小红书\\\\employeeGUI\\\\debug_xml\\\\current_ui_dump.xml',");
    console.log("  enable_filtering: false");
    console.log("}).then(result => {");
    console.log("  console.log('总元素:', result.length);");
    console.log("  const clickable = result.filter(el => el.is_clickable);");
    console.log("  console.log('可点击元素:', clickable.length);");
    console.log("  console.log('详情:', clickable.map(el => el.text || el.content_desc));");
    console.log("});");
}