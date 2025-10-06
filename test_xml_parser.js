// 测试新的XML解析器功能
const { invoke } = window.__TAURI__.tauri;

async function testXmlParser() {
    try {
        console.log("🧪 开始测试新的XML解析器...");
        
        // 模拟读取 current_ui_dump.xml 文件
        const xmlPath = "debug_xml/current_ui_dump.xml";
        
        // 调用新的 parse_cached_xml_to_elements 命令
        const result = await invoke('parse_cached_xml_to_elements', {
            xmlContent: null, // 使用缓存文件路径
            filePath: xmlPath
        });
        
        console.log("✅ XML解析成功！");
        console.log(`🎯 提取的元素数量: ${result.length}`);
        console.log("📋 前5个元素:", result.slice(0, 5));
        
        // 查找包含特定文字的元素
        const contactElements = result.filter(element => 
            (element.text && element.text.includes('联系人')) ||
            (element.text && element.text.includes('电话')) ||
            (element.text && element.text.includes('收藏'))
        );
        
        console.log(`🔍 找到包含联系人相关文字的元素: ${contactElements.length}`);
        contactElements.forEach((element, index) => {
            console.log(`  ${index + 1}. 文字: "${element.text}", bounds: ${element.bounds}`);
        });
        
        return result;
        
    } catch (error) {
        console.error("❌ XML解析失败:", error);
        throw error;
    }
}

// 在浏览器控制台中运行测试
if (typeof window !== 'undefined' && window.__TAURI__) {
    // 立即执行测试
    testXmlParser().then(result => {
        console.log("🎉 测试完成，共解析出", result.length, "个元素");
    }).catch(error => {
        console.error("💥 测试失败:", error);
    });
} else {
    console.log("⚠️ 请在Tauri应用中运行此测试");
}