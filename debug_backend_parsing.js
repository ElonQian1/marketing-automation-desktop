// 调试后端XML解析逻辑
// 验证parse_cached_xml_to_elements命令的输出

const { invoke } = require('@tauri-apps/api/tauri');

console.log('🔍 开始调试后端XML解析过程...');

// 模拟前端调用后端命令
async function debugBackendParsing() {
    try {
        console.log('📤 调用后端命令: parse_cached_xml_to_elements');
        
        const result = await invoke('parse_cached_xml_to_elements', {
            xmlCacheId: 'debug_xml', 
            enableFiltering: false  // 禁用过滤，获取所有元素
        });
        
        console.log('📥 后端返回结果:');
        console.log('  - 总元素数量:', result.length);
        
        // 分析可点击元素
        const clickableElements = result.filter(el => el.is_clickable === true);
        console.log('  - 可点击元素数量:', clickableElements.length);
        
        console.log('\n🎯 可点击元素详情:');
        clickableElements.forEach((el, index) => {
            console.log(`  ${index + 1}. ${el.text || el.content_desc || '(无文本)'}`);
            console.log(`     - class: ${el.class_name || '(无)'}`);
            console.log(`     - bounds: [${el.bounds.left},${el.bounds.top}][${el.bounds.right},${el.bounds.bottom}]`);
            console.log(`     - 宽度x高度: ${el.bounds.right - el.bounds.left}x${el.bounds.bottom - el.bounds.top}`);
            console.log(`     - is_clickable: ${el.is_clickable}`);
            console.log('');
        });
        
        // 分析非可点击但有文本的元素
        const textElements = result.filter(el => 
            !el.is_clickable && 
            (el.text?.trim() || el.content_desc?.trim())
        );
        console.log(`📝 非可点击但有文本的元素: ${textElements.length}个`);
        
        // 检查是否有遗漏的可点击元素
        console.log('\n🔎 检查XML中的clickable="true"元素是否都被正确解析...');
        
    } catch (error) {
        console.error('❌ 调用后端命令失败:', error);
        console.log('\n📋 请在Tauri应用中运行此脚本，或检查:');
        console.log('  1. 后端parse_cached_xml_to_elements命令是否正确实现');
        console.log('  2. XML缓存是否存在于debug_xml目录');
        console.log('  3. 命令注册是否正确');
    }
}

// 如果在浏览器环境中运行，提供手动调试信息
if (typeof window !== 'undefined') {
    console.log('🌐 在浏览器环境中运行');
    console.log('📋 请在开发者控制台中手动运行:');
    console.log('');
    console.log('// 调用后端解析命令');
    console.log("window.__TAURI__.invoke('parse_cached_xml_to_elements', {");
    console.log("  xmlCacheId: 'debug_xml',"); 
    console.log("  enableFiltering: false");
    console.log("}).then(result => {");
    console.log("  console.log('后端解析结果:', result);");
    console.log("  const clickable = result.filter(el => el.is_clickable);");
    console.log("  console.log('可点击元素:', clickable);");
    console.log("});");
} else {
    // 在Node.js环境中运行
    debugBackendParsing();
}