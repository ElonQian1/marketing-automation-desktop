// 直接测试XML解析功能
console.log("🧪 开始测试XML解析器...");

// 模拟调用 parse_cached_xml_to_elements 
// 这将模拟前端的调用方式

const testData = {
    xmlContent: null, // 使用缓存文件
    filePath: "debug_xml/current_ui_dump.xml"
};

console.log("📝 测试参数:", testData);
console.log("✅ 测试脚本准备完成，请在浏览器控制台中运行以下代码:");

const codeToRun = `
const { invoke } = window.__TAURI__.tauri;

async function testXmlParser() {
    try {
        console.log("🧪 开始测试新的XML解析器...");
        
        const result = await invoke('parse_cached_xml_to_elements', {
            xmlContent: null, 
            filePath: "debug_xml/current_ui_dump.xml"
        });

        console.log("✅ XML解析成功！");
        console.log("🎯 提取的元素数量:", result.length);
        console.log("📋 前3个元素:", result.slice(0, 3));
        
        // 查找包含联系人相关文字的元素
        const contactElements = result.filter(element =>
            (element.text && (
                element.text.includes('联系人') ||
                element.text.includes('电话') ||
                element.text.includes('收藏')
            ))
        );

        console.log("🔍 找到包含联系人相关文字的元素:", contactElements.length);
        contactElements.forEach((element, index) => {
            console.log(\`  \${index + 1}. 文字: "\${element.text}", bounds: \${element.bounds}\`);
        });

        console.log("🎉 XML解析测试完成！原来只能解析4个元素，现在解析了:", result.length, "个元素");
        return result;

    } catch (error) {
        console.error("❌ XML解析失败:", error);
        throw error;
    }
}

testXmlParser();
`;

console.log(codeToRun);