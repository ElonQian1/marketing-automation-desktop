// 测试 XPath 索引解析的简单脚本

const testXPath = "//*[@resource-id=\"com.xingin.xhs:id/0_resource_name_obfuscated\"][5]";

console.log("测试 XPath 表达式:", testXPath);

// 模拟 extract_bounds_from_xml 的逻辑
function parseXPathIndex(xpath) {
  console.log("🔍 分析XPath表达式:", xpath);
  
  // 检查是否有 resource-id
  if (xpath.includes("@resource-id")) {
    // 提取 resource-id
    let resourceId;
    if (xpath.includes('@resource-id="')) {
      const start = xpath.indexOf('@resource-id="') + 14;
      const end = xpath.indexOf('"', start);
      resourceId = xpath.substring(start, end);
    }
    
    console.log("🎯 提取resource-id:", resourceId);
    
    // 检查是否有索引语法，如 [5] 或 [1]
    let targetIndex;
    const lastBracket = xpath.lastIndexOf('[');
    if (lastBracket > xpath.indexOf('@resource-id')) {
      const bracketStart = lastBracket + 1;
      const bracketEnd = xpath.indexOf(']', bracketStart);
      if (bracketEnd > bracketStart) {
        const indexStr = xpath.substring(bracketStart, bracketEnd);
        const index = parseInt(indexStr);
        if (!isNaN(index)) {
          targetIndex = index;
        }
      }
    }
    
    console.log("🎯 目标索引:", targetIndex);
    return { resourceId, targetIndex };
  }
}

const result = parseXPathIndex(testXPath);
console.log("解析结果:", result);