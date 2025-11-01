// Element_43 渲染测试脚本 - 开发环境专用
// 用于分析当前XML解析器如何处理element_43案例

import fs from 'fs';

console.log('🔍 Element_43 渲染问题分析');
console.log('================================');

// 读取XML文件
const xmlPath = './debug_xml/ui_dump_e0d909c3_20251030_122312.xml';
if (!fs.existsSync(xmlPath)) {
    console.error('❌ XML文件不存在:', xmlPath);
    process.exit(1);
}

const xmlContent = fs.readFileSync(xmlPath, 'utf8');
console.log('✅ 成功读取XML文件');

// 模拟前端解析逻辑
function parseXMLForElement43Analysis(xmlString) {
    // 使用正则表达式替代DOM解析器（Node.js环境限制）
    const nodeRegex = /<node[^>]*>/g;
    const nodes = [];
    let match;
    
    while ((match = nodeRegex.exec(xmlString)) !== null) {
        const nodeText = match[0];
        
        // 解析属性
        const bounds = nodeText.match(/bounds="([^"]+)"/)?.[1] || '';
        const clickable = nodeText.match(/clickable="(true|false)"/)?.[1] === 'true';
        const text = nodeText.match(/text="([^"]*)"/)?.[1] || '';
        const contentDesc = nodeText.match(/content-desc="([^"]*)"/)?.[1] || '';
        const className = nodeText.match(/class="([^"]+)"/)?.[1] || '';
        const resourceId = nodeText.match(/resource-id="([^"]*)"/)?.[1] || '';
        
        nodes.push({
            bounds,
            clickable,
            text,
            contentDesc,
            className: className.split('.').pop() || 'Unknown',
            resourceId,
            rawNode: nodeText
        });
    }
    
    return nodes;
}

const allNodes = parseXMLForElement43Analysis(xmlContent);
console.log(`📊 总共解析到 ${allNodes.length} 个节点`);

// 分析Element_43相关节点
const targetBounds = '[13,1158][534,2023]';
const element43Nodes = allNodes.filter((node, index) => {
    return node.bounds === targetBounds || 
           node.bounds.includes('1158') || 
           node.bounds.includes('2023');
}).map((node, _, arr) => {
    const originalIndex = allNodes.indexOf(node);
    return {
        elementId: `element_${originalIndex}`,
        ...node,
        originalIndex
    };
});

console.log('\n🎯 Element_43 区域相关节点分析:');
console.log('=================================');

element43Nodes.forEach((node, i) => {
    console.log(`\n${i + 1}. ${node.elementId} (XML索引: ${node.originalIndex})`);
    console.log(`   Bounds: ${node.bounds}`);
    console.log(`   Clickable: ${node.clickable ? '✅ YES' : '❌ NO'}`);
    console.log(`   Text: "${node.text || '(空)'}"`);
    console.log(`   Content-Desc: "${node.contentDesc ? node.contentDesc.slice(0, 40) + '...' : '(空)'}"`);
    console.log(`   Class: ${node.className}`);
    console.log(`   Resource-ID: ${node.resourceId || '(无)'}`);
});

// 重点分析：相同bounds的重叠问题
console.log('\n⚠️ 重叠问题分析 - 相同bounds的节点:');
console.log('=====================================');

const sameBoundsNodes = element43Nodes.filter(node => node.bounds === targetBounds);
console.log(`发现 ${sameBoundsNodes.length} 个节点使用相同bounds ${targetBounds}:`);

sameBoundsNodes.forEach((node, i) => {
    console.log(`\n${i + 1}. ${node.elementId} - ${node.clickable ? '✅ 可点击' : '❌ 不可点击'}`);
    console.log(`   Class: ${node.className}`);
    console.log(`   Content-Desc: "${node.contentDesc || '(无)'}"`);
    console.log(`   推荐操作: ${node.clickable ? '保留（用户真正想点击的）' : '过滤掉（冗余容器）'}`);
});

// 当前渲染逻辑模拟
console.log('\n📋 当前渲染逻辑模拟 (XmlParser.parseXML):');
console.log('==========================================');

function simulateCurrentRendering(nodes) {
    const rendered = [];
    
    nodes.forEach((node, index) => {
        const elementId = `element_${index}`;
        
        // 模拟 isValidElement 检查
        const bounds = node.bounds;
        const position = parseBounds(bounds);
        
        if (bounds && bounds !== '[0,0][0,0]' && position.width > 0 && position.height > 0) {
            rendered.push({
                id: elementId,
                bounds: bounds,
                clickable: node.clickable,
                text: node.text,
                contentDesc: node.contentDesc,
                className: node.className,
                shouldRender: true,
                reason: '通过基础检查'
            });
        } else {
            rendered.push({
                id: elementId,
                bounds: bounds,
                clickable: node.clickable,
                shouldRender: false,
                reason: '未通过基础检查'
            });
        }
    });
    
    return rendered;
}

function parseBounds(boundsStr) {
    if (!boundsStr) return { width: 0, height: 0 };
    const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (!match) return { width: 0, height: 0 };
    
    const [, left, top, right, bottom] = match.map(Number);
    return {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top
    };
}

const renderResult = simulateCurrentRendering(allNodes);
const element43AreaRendered = renderResult.filter(r => {
    return allNodes[parseInt(r.id.split('_')[1])].bounds === targetBounds ||
           allNodes[parseInt(r.id.split('_')[1])].bounds.includes('1158');
}).filter(r => r.shouldRender);

console.log(`在Element_43区域会渲染 ${element43AreaRendered.length} 个元素:`);

element43AreaRendered.forEach((item, i) => {
    const originalNode = allNodes[parseInt(item.id.split('_')[1])];
    console.log(`\n${i + 1}. ${item.id}`);
    console.log(`   Bounds: ${item.bounds}`);
    console.log(`   Clickable: ${item.clickable ? '✅ YES' : '❌ NO'}`);
    console.log(`   问题: ${!item.clickable ? '用户点击无响应，造成困惑' : '正常可点击'}`);
});

// 修复建议
console.log('\n🔧 修复建议:');
console.log('============');

const problematicNodes = element43AreaRendered.filter(item => !item.clickable);
const validNodes = element43AreaRendered.filter(item => item.clickable);

console.log(`❌ 需要过滤的节点: ${problematicNodes.length}个`);
problematicNodes.forEach(item => {
    console.log(`   - ${item.id}: 不可点击的容器，应该被过滤`);
});

console.log(`\n✅ 应该保留的节点: ${validNodes.length}个`);
validNodes.forEach(item => {
    console.log(`   - ${item.id}: 可点击，用户交互目标`);
});

console.log('\n🎯 总结:');
console.log(`当前会渲染 ${element43AreaRendered.length} 个元素，其中 ${problematicNodes.length} 个无用`);
console.log(`修复后应该只渲染 ${validNodes.length} 个有效元素`);
console.log('主要问题：外层不可点击容器与内层可点击容器重叠，导致用户点击困惑');