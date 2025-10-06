import fs from 'fs';

// 读取XML文件并分析所有clickable="true"的元素
const xmlContent = fs.readFileSync('debug_xml/current_ui_dump.xml', 'utf-8');

// 找到所有clickable="true"的元素
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
    
    const bounds = extractAttr('bounds');
    const text = extractAttr('text');
    const resourceId = extractAttr('resource-id');
    const className = extractAttr('class');
    const contentDesc = extractAttr('content-desc');
    
    // 解析bounds
    let parsedBounds = null;
    if (bounds) {
        const boundsMatch = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
        if (boundsMatch) {
            const [, left, top, right, bottom] = boundsMatch.map(Number);
            parsedBounds = { left, top, right, bottom, width: right - left, height: bottom - top };
        }
    }
    
    clickableElements.push({
        text,
        resourceId,
        className,
        contentDesc,
        bounds,
        parsedBounds,
        rawNode: nodeContent.substring(0, 200) + '...'
    });
}

console.log(`总共找到 ${clickableElements.length} 个可点击元素：\n`);

clickableElements.forEach((el, i) => {
    console.log(`${i + 1}. 类型: ${el.className}`);
    console.log(`   文本: "${el.text}"`);
    console.log(`   ID: "${el.resourceId}"`);
    console.log(`   描述: "${el.contentDesc}"`);
    console.log(`   Bounds: ${el.bounds}`);
    if (el.parsedBounds) {
        console.log(`   尺寸: ${el.parsedBounds.width}x${el.parsedBounds.height}`);
        console.log(`   面积: ${el.parsedBounds.width * el.parsedBounds.height}px²`);
    }
    
    // 分析为什么可能被过滤
    const reasons = [];
    if (el.parsedBounds && (el.parsedBounds.width < 10 || el.parsedBounds.height < 10)) {
        reasons.push('尺寸太小 (< 10px)');
    }
    if (el.parsedBounds && (el.parsedBounds.width < 20 || el.parsedBounds.height < 20)) {
        reasons.push('尺寸较小 (< 20px)');
    }
    if (!el.text && !el.contentDesc && !el.resourceId) {
        reasons.push('无标识信息');
    }
    if (el.parsedBounds && el.parsedBounds.width === 0 && el.parsedBounds.height === 0) {
        reasons.push('零尺寸元素');
    }
    
    if (reasons.length > 0) {
        console.log(`   ⚠️ 可能被过滤原因: ${reasons.join(', ')}`);
    }
    
    console.log('');
});