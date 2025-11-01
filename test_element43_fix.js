// Element_43 修复验证测试
// 用于验证XmlParser修复后的渲染效果

import { XmlParser } from './src/components/universal-ui/xml-parser/XmlParser.js';
import fs from 'fs';

console.log('🧪 Element_43 修复验证测试');
console.log('==========================');

// 读取测试XML
const xmlPath = './debug_xml/ui_dump_e0d909c3_20251030_122312.xml';
if (!fs.existsSync(xmlPath)) {
    console.error('❌ XML文件不存在:', xmlPath);
    process.exit(1);
}

const xmlContent = fs.readFileSync(xmlPath, 'utf8');
console.log('✅ 成功读取XML文件');

// 使用修复后的XmlParser解析
try {
    const parseResult = XmlParser.parseXML(xmlContent);
    
    console.log('\n📊 解析结果统计:');
    console.log(`总元素数: ${parseResult.elements.length}`);
    console.log(`分类数: ${parseResult.categories.length}`);
    
    // 查找Element_43区域的元素
    const targetBounds = '[13,1158][534,2023]';
    const element43AreaElements = parseResult.elements.filter(element => {
        return element.bounds === targetBounds || 
               element.bounds?.includes('1158') || 
               element.bounds?.includes('2023');
    });
    
    console.log('\n🎯 Element_43区域元素分析:');
    console.log(`找到 ${element43AreaElements.length} 个相关元素`);
    
    element43AreaElements.forEach((element, i) => {
        console.log(`\n${i + 1}. ${element.id}`);
        console.log(`   Bounds: ${element.bounds}`);
        console.log(`   Clickable: ${element.clickable ? '✅ YES' : '❌ NO'}`);
        console.log(`   Text: "${element.text || '(空)'}"`);
        console.log(`   Content-Desc: "${element.description || '(空)'}"`);
        console.log(`   XML Index: ${element.xmlIndex}`);
    });
    
    // 验证重叠问题是否解决
    const sameBoundsElements = element43AreaElements.filter(e => e.bounds === targetBounds);
    console.log(`\n✅ 重叠验证: 相同bounds ${targetBounds} 的元素数量: ${sameBoundsElements.length}`);
    
    if (sameBoundsElements.length <= 1) {
        console.log('🎉 SUCCESS: 重叠问题已解决！');
    } else {
        console.log('❌ FAIL: 仍然存在重叠问题');
        sameBoundsElements.forEach(e => {
            console.log(`   - ${e.id}: ${e.clickable ? 'clickable' : 'not clickable'}`);
        });
    }
    
    // 验证可点击性
    const clickableElements = element43AreaElements.filter(e => e.clickable);
    console.log(`\n🎯 可点击元素: ${clickableElements.length} 个`);
    clickableElements.forEach(e => {
        console.log(`   - ${e.id}: bounds ${e.bounds}`);
    });
    
    console.log('\n🎯 测试结论:');
    console.log('===========');
    
    if (sameBoundsElements.length <= 1 && clickableElements.length > 0) {
        console.log('✅ 测试通过！Element_43渲染问题已修复');
        console.log('  - 重叠容器问题已解决');
        console.log('  - 保留了有效的可点击元素');
        console.log('  - 用户不会再遇到点击困惑');
    } else {
        console.log('❌ 测试失败，需要进一步修复');
    }
    
} catch (error) {
    console.error('❌ 解析失败:', error.message);
    console.error('需要检查XmlParser模块导入或实现');
}