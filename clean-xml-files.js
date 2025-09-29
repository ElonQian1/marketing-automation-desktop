#!/usr/bin/env node

/**
 * 清理 debug_xml 目录下的 XML 文件
 * 移除第一行的 uiautomator dump 状态信息
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEBUG_XML_DIR = path.join(__dirname, 'debug_xml');

function cleanXmlFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 检查第一行是否包含 uiautomator dump 的状态信息
        const lines = content.split('\n');
        
        if (lines.length > 0 && lines[0].includes('UI hierchay dumped to:')) {
            console.log(`🔧 清理文件: ${path.basename(filePath)}`);
            
            // 移除第一行，保留其余内容
            const cleanedContent = lines.slice(1).join('\n');
            
            // 备份原文件
            const backupPath = filePath + '.backup';
            fs.writeFileSync(backupPath, content);
            
            // 写入清理后的内容
            fs.writeFileSync(filePath, cleanedContent);
            
            console.log(`✅ 已清理并备份: ${path.basename(filePath)}`);
            return true;
        } else {
            console.log(`✓ 文件已正常: ${path.basename(filePath)}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ 处理文件失败 ${filePath}:`, error.message);
        return false;
    }
}

function main() {
    console.log('🚀 开始清理 debug_xml 目录下的 XML 文件...\n');
    
    if (!fs.existsSync(DEBUG_XML_DIR)) {
        console.log('❌ debug_xml 目录不存在');
        return;
    }
    
    const files = fs.readdirSync(DEBUG_XML_DIR);
    const xmlFiles = files.filter(file => file.endsWith('.xml') && !file.endsWith('.backup'));
    
    if (xmlFiles.length === 0) {
        console.log('📂 没有找到 XML 文件');
        return;
    }
    
    console.log(`📁 找到 ${xmlFiles.length} 个 XML 文件\n`);
    
    let cleanedCount = 0;
    
    for (const xmlFile of xmlFiles) {
        const filePath = path.join(DEBUG_XML_DIR, xmlFile);
        if (cleanXmlFile(filePath)) {
            cleanedCount++;
        }
    }
    
    console.log(`\n📊 处理完成:`);
    console.log(`   - 总文件数: ${xmlFiles.length}`);
    console.log(`   - 已清理: ${cleanedCount}`);
    console.log(`   - 无需清理: ${xmlFiles.length - cleanedCount}`);
    
    if (cleanedCount > 0) {
        console.log('\n💡 提示: 原文件已备份为 .backup 后缀');
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}