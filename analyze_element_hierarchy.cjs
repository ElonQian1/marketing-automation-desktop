const fs = require('fs');

// 读取XML文件
const xml = fs.readFileSync('debug_xml/current_ui_dump.xml', 'utf8');

// 解析XML并添加element_id
let elementId = 0;
const lines = xml.split('\n');
const processedLines = [];

for (const line of lines) {
  if (line.trim().startsWith('<node ')) {
    // 计算缩进层级（用于确定嵌套深度）
    const indent = line.match(/^(\s*)/)[1].length;
    const lineWithId = line.replace('<node ', `<node element_id="element_${elementId}" `);
    processedLines.push({
      elementId: `element_${elementId}`,
      indent: indent,
      line: lineWithId,
      originalLine: line
    });
    elementId++;
  } else {
    processedLines.push({
      elementId: null,
      line: line,
      originalLine: line
    });
  }
}

// 找到element_38和element_40
let element38 = null;
let element40 = null;

processedLines.forEach((item, index) => {
  if (item.elementId === 'element_38') {
    element38 = {
      ...item,
      index: index
    };
  }
  if (item.elementId === 'element_40') {
    element40 = {
      ...item,
      index: index
    };
  }
});

console.log('=== Element 38 分析 ===');
if (element38) {
  console.log('Element ID:', element38.elementId);
  console.log('行号:', element38.index);
  console.log('缩进层级:', element38.indent);
  console.log('内容:', element38.originalLine.trim().substring(0, 100) + '...');
  
  // 提取关键属性
  const line = element38.originalLine;
  const resourceId = line.match(/resource-id="([^"]*)"/) ? line.match(/resource-id="([^"]*)"/)[1] : '';
  const className = line.match(/class="([^"]*)"/) ? line.match(/class="([^"]*)"/)[1] : '';
  const text = line.match(/text="([^"]*)"/) ? line.match(/text="([^"]*)"/)[1] : '';
  const bounds = line.match(/bounds="([^"]*)"/) ? line.match(/bounds="([^"]*)"/)[1] : '';
  
  console.log('Resource ID:', resourceId);
  console.log('Class:', className);
  console.log('Text:', text);
  console.log('Bounds:', bounds);
}

console.log('\n=== Element 40 分析 ===');
if (element40) {
  console.log('Element ID:', element40.elementId);
  console.log('行号:', element40.index);
  console.log('缩进层级:', element40.indent);
  console.log('内容:', element40.originalLine.trim().substring(0, 100) + '...');
  
  // 提取关键属性
  const line = element40.originalLine;
  const resourceId = line.match(/resource-id="([^"]*)"/) ? line.match(/resource-id="([^"]*)"/)[1] : '';
  const className = line.match(/class="([^"]*)"/) ? line.match(/class="([^"]*)"/)[1] : '';
  const text = line.match(/text="([^"]*)"/) ? line.match(/text="([^"]*)"/)[1] : '';
  const bounds = line.match(/bounds="([^"]*)"/) ? line.match(/bounds="([^"]*)"/)[1] : '';
  
  console.log('Resource ID:', resourceId);
  console.log('Class:', className);
  console.log('Text:', text);
  console.log('Bounds:', bounds);
}

console.log('\n=== 层级关系分析 ===');
if (element38 && element40) {
  const isSameLevel = element38.indent === element40.indent;
  console.log('Element 38 缩进:', element38.indent);
  console.log('Element 40 缩进:', element40.indent);
  console.log('是否同级:', isSameLevel ? '是' : '否');
  
  if (!isSameLevel) {
    if (element38.indent < element40.indent) {
      console.log('Element 38 是 Element 40 的祖先节点');
    } else {
      console.log('Element 40 是 Element 38 的祖先节点');
    }
  }
  
  // 查找它们的父节点
  console.log('\n=== 父节点分析 ===');
  
  // 向上查找element_38的父节点
  for (let i = element38.index - 1; i >= 0; i--) {
    const item = processedLines[i];
    if (item.elementId && item.indent < element38.indent) {
      console.log('Element 38 的父节点:', item.elementId, '(缩进:', item.indent + ')');
      break;
    }
  }
  
  // 向上查找element_40的父节点
  for (let i = element40.index - 1; i >= 0; i--) {
    const item = processedLines[i];
    if (item.elementId && item.indent < element40.indent) {
      console.log('Element 40 的父节点:', item.elementId, '(缩进:', item.indent + ')');
      break;
    }
  }
}