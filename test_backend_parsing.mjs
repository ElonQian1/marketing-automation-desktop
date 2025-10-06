import fs from 'fs';
import { invoke } from '@tauri-apps/api/core';

async function testBackendParsing() {
    try {
        console.log('🔍 测试后端XML解析...');
        
        // 读取XML文件
        const xmlContent = fs.readFileSync('debug_xml/current_ui_dump.xml', 'utf-8');
        console.log('📄 XML文件长度:', xmlContent.length);
        
        // 调用后端解析（不过滤）
        const elements = await invoke('parse_cached_xml_to_elements', {
            xml_content: xmlContent,
            enable_filtering: false
        });
        
        console.log('✅ 后端解析结果:');
        console.log('总元素数:', elements.length);
        
        // 统计可点击元素
        const clickableElements = elements.filter(el => el.is_clickable === true);
        console.log('可点击元素数:', clickableElements.length);
        
        console.log('\n可点击元素详情:');
        clickableElements.forEach((el, i) => {
            console.log(`${i + 1}. 文本: "${el.text}", ID: "${el.resource_id || ''}", 类型: "${el.element_type}"`);
        });
        
        // 测试启用过滤的情况
        console.log('\n🧪 测试启用过滤的情况...');
        const filteredElements = await invoke('parse_cached_xml_to_elements', {
            xml_content: xmlContent,
            enable_filtering: true
        });
        
        console.log('过滤后总元素数:', filteredElements.length);
        const filteredClickable = filteredElements.filter(el => el.is_clickable === true);
        console.log('过滤后可点击元素数:', filteredClickable.length);
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

testBackendParsing();