import fs from 'fs';

// 读取XML文件
const xmlContent = fs.readFileSync('debug_xml/current_ui_dump.xml', 'utf-8');

// 计算clickable="true"的数量
const clickableMatches = xmlContent.match(/clickable="true"/g);
const clickableCount = clickableMatches ? clickableMatches.length : 0;

// 计算总的node数量
const nodeMatches = xmlContent.match(/<node/g);
const totalNodes = nodeMatches ? nodeMatches.length : 0;

console.log(`总节点数: ${totalNodes}`);
console.log(`clickable="true"数量: ${clickableCount}`);

// 提取所有clickable="true"的元素信息
const clickableElements = [];
const nodeRegex = /<node[^>]*clickable="true"[^>]*>/g;
let match;

while ((match = nodeRegex.exec(xmlContent)) !== null) {
    const nodeContent = match[0];
    
    // 提取关键属性
    const extractAttr = (attr) => {
        const regex = new RegExp(`${attr}="([^"]*)"`, 'i');
        const match = nodeContent.match(regex);
        return match ? match[1] : '';
    };
    
    clickableElements.push({
        text: extractAttr('text'),
        'resource-id': extractAttr('resource-id'),
        'class': extractAttr('class'),
        'content-desc': extractAttr('content-desc'),
        bounds: extractAttr('bounds')
    });
}

console.log('\n可点击元素详情:');
clickableElements.forEach((el, i) => {
    console.log(`${i + 1}. 文本: "${el.text}", ID: "${el['resource-id']}", 描述: "${el['content-desc']}", 类型: "${el.class}"`);
});