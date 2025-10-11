// scripts/add_headers_strategic.cjs
// 作用：分层批量添加标准化文件头（按优先级处理）
// 策略：核心模块 → 应用层 → 组件层 → 工具层

const fs = require('fs');
const path = require('path');

// 优先级处理路径（从高到低）
const PRIORITY_PATHS = {
  'P1_核心API': ['src/api'],
  'P2_应用服务': ['src/application', 'src/services'],
  'P3_领域层': ['src/domain'],
  'P4_组件层': ['src/components'],
  'P5_页面层': ['src/pages'],
  'P6_模块层': ['src/modules'],
  'P7_工具层': ['src/utils', 'src/lib', 'src/helpers'],
  'P8_其他': ['src/types', 'src/constants', 'src/hooks']
};

// 检查文件是否需要添加文件头
function needsHeader(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 检查是否已有标准3行文件头格式
    const lines = content.split(/\r?\n/);
    
    if (lines.length < 3) return true;
    
    // 验证标准格式: // src/... | module: ... | role: ... | summary: ...
    const headerPattern = /^\/\/ src\/.*$/;
    const modulePattern = /^\/\/ module:.*\| layer:.*\| role:.*$/;  
    const summaryPattern = /^\/\/ summary:.*$/;
    
    return !(
      headerPattern.test(lines[0]) &&
      modulePattern.test(lines[1]) &&
      summaryPattern.test(lines[2])
    );
  } catch (error) {
    console.warn(`⚠️  无法读取文件: ${filePath}`);
    return false;
  }
}

// 智能生成文件头
function generateHeader(filePath) {
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const fileName = path.basename(filePath);
  const dirPath = path.dirname(relativePath);
  
  // 智能识别模块
  let module = 'shared';
  let layer = 'unknown';
  let role = 'component';
  let summary = `${fileName} 文件`;
  
  // 根据路径智能判断
  if (dirPath.includes('api')) {
    module = 'api';
    layer = 'api';
    role = 'interface';
    summary = 'Tauri 命令接口';
  } else if (dirPath.includes('domain')) {
    module = dirPath.includes('adb') ? 'adb' : 
              dirPath.includes('contact') ? 'contact-import' :
              dirPath.includes('script') ? 'script-builder' : 'domain';
    layer = 'domain';
    role = dirPath.includes('entities') ? 'entity' :
           dirPath.includes('services') ? 'service' : 
           dirPath.includes('repositories') ? 'repository' : 'domain-logic';
    summary = `${role === 'entity' ? '实体' : role === 'service' ? '服务' : role === 'repository' ? '仓储' : '领域逻辑'}定义`;
  } else if (dirPath.includes('application')) {
    module = dirPath.includes('adb') ? 'adb' : 
              dirPath.includes('contact') ? 'contact-import' :
              dirPath.includes('script') ? 'script-builder' : 'application';
    layer = 'application';
    role = dirPath.includes('store') ? 'store' : 
           dirPath.includes('hooks') ? 'hook' : 
           dirPath.includes('services') ? 'app-service' : 'application-logic';
    summary = `${role === 'store' ? '状态管理' : role === 'hook' ? 'React Hook' : role === 'app-service' ? '应用服务' : '应用逻辑'}`;
  } else if (dirPath.includes('components')) {
    module = 'ui';
    layer = 'ui';
    role = 'component';
    summary = 'UI 组件';
  } else if (dirPath.includes('pages')) {
    module = 'ui';
    layer = 'ui';
    role = 'page';
    summary = '页面组件';
  } else if (dirPath.includes('modules')) {
    // 模块特定识别
    if (dirPath.includes('contact-import')) {
      module = 'contact-import';
      layer = dirPath.includes('ui') ? 'ui' : 
              dirPath.includes('services') ? 'application' : 
              dirPath.includes('domain') ? 'domain' : 'module';
    } else if (dirPath.includes('precise-acquisition')) {
      module = 'prospecting';
      layer = 'application';
    } else if (dirPath.includes('smart-script')) {
      module = 'script-builder';
      layer = 'application';
    }
    role = 'module-component';
    summary = '模块组件';
  } else if (dirPath.includes('utils') || dirPath.includes('lib') || dirPath.includes('helpers')) {
    module = 'shared';
    layer = 'utils';
    role = 'utility';
    summary = '工具函数';
  }
  
  return [
    `// ${relativePath}`,
    `// module: ${module} | layer: ${layer} | role: ${role}`,
    `// summary: ${summary}`
  ].join('\r\n') + '\r\n';
}

// 添加文件头到文件
function addHeaderToFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const header = generateHeader(filePath);
    const newContent = header + '\r\n' + content;
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  } catch (error) {
    console.error(`❌ 处理文件失败 ${filePath}:`, error.message);
    return false;
  }
}

// 批量处理指定优先级
async function processFiles(priorityKey, maxFiles = 50) {
  const dirs = PRIORITY_PATHS[priorityKey];
  if (!dirs) {
    console.error(`❌ 未知优先级: ${priorityKey}`);
    return;
  }
  
  console.log(`\n🎯 处理优先级: ${priorityKey}`);
  console.log(`📂 目标目录: ${dirs.join(', ')}`);
  
  let processedCount = 0;
  let skippedCount = 0;
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  目录不存在: ${dir}`);
      continue;
    }
    
    const files = [];
    
    // 递归收集 TypeScript 文件
    function collectFiles(currentDir) {
      try {
        const entries = fs.readdirSync(currentDir);
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            collectFiles(fullPath);
          } else if (entry.match(/\.(ts|tsx)$/) && !entry.endsWith('.d.ts')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(`⚠️  读取目录失败 ${currentDir}:`, error.message);
      }
    }
    
    collectFiles(dir);
    
    // 过滤需要处理的文件
    const filesToProcess = files.filter(needsHeader).slice(0, maxFiles - processedCount);
    
    console.log(`📄 ${dir}: 发现 ${files.length} 个文件，需处理 ${filesToProcess.length} 个`);
    
    // 处理文件
    for (const file of filesToProcess) {
      if (processedCount >= maxFiles) break;
      
      if (addHeaderToFile(file)) {
        console.log(`✅ ${path.relative(process.cwd(), file)}`);
        processedCount++;
      } else {
        skippedCount++;
      }
    }
    
    if (processedCount >= maxFiles) break;
  }
  
  console.log(`\n📊 ${priorityKey} 处理完成:`);
  console.log(`   ✅ 成功: ${processedCount} 个文件`);
  console.log(`   ⚠️  跳过: ${skippedCount} 个文件`);
  
  return processedCount;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const priorityKey = args[0];
  const maxFiles = parseInt(args[1]) || 50;
  
  if (!priorityKey) {
    console.log('\n📋 可用优先级:');
    Object.keys(PRIORITY_PATHS).forEach(key => {
      console.log(`   ${key}: ${PRIORITY_PATHS[key].join(', ')}`);
    });
    console.log('\n使用方法:');
    console.log('  node scripts/add_headers_strategic.cjs P1_核心API 30');
    console.log('  node scripts/add_headers_strategic.cjs P2_应用服务 50');
    return;
  }
  
  console.log(`🚀 开始批量添加文件头...`);
  console.log(`📋 优先级: ${priorityKey}`);
  console.log(`🔢 最大处理: ${maxFiles} 个文件\n`);
  
  const processed = await processFiles(priorityKey, maxFiles);
  
  console.log(`\n🎉 批量处理完成! 共处理 ${processed} 个文件`);
  console.log(`💡 运行检查: npm run headers:check`);
}

main().catch(console.error);