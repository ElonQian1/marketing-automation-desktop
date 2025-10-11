const fs = require('fs');
const path = require('path');

// 第五批要处理的文件列表 - infrastructure
const filesToProcess = [
  'src/infrastructure/EventManager.ts',
  'src/infrastructure/inspector/LocalSessionRepository.ts',
  'src/infrastructure/inspector/LocalStepRepository.ts',
  'src/infrastructure/inspector/LocatorService.ts',
  'src/infrastructure/RealTimeDeviceTracker.ts',
  'src/infrastructure/repositories/InMemoryWatchTargetRepository.ts',
  'src/infrastructure/repositories/PageAnalysisRepositoryFactory.ts',
  'src/infrastructure/repositories/RealTimeDeviceRepository.ts',
  'src/infrastructure/repositories/StaticTagWhitelistRepository.ts',
  'src/infrastructure/repositories/TauriAdbRepository.ts',
  'src/infrastructure/repositories/TauriContactAutomationRepository.ts',
  'src/infrastructure/repositories/TauriDeviceMetricsRepository.ts',
  'src/infrastructure/repositories/TauriDeviceRepository.ts',
  'src/infrastructure/repositories/TauriDiagnosticRepository.ts',
  'src/infrastructure/repositories/TauriPageAnalysisRepository.ts',
  'src/infrastructure/repositories/TauriSmartScriptRepository.ts',
  'src/infrastructure/repositories/TauriUiMatcherRepository.ts',
  'src/infrastructure/repositories/TauriWatchTargetRepository.ts'
];

function addHeader(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log('❌ 文件不存在:', filePath);
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 如果已经有我们的标准文件头格式，跳过
    if (content.includes('// module:') && content.includes('// summary:')) {
      console.log('⏭️ 跳过（已有标准头）:', filePath);
      return false;
    }

    // 分析文件路径确定模块和层
    let module = 'shared';
    let layer = 'application';
    let role = '';
    let summary = '';

    if (filePath.includes('/config/')) {
      layer = 'application';
      role = '配置管理';
      summary = '应用配置参数定义';
    } else if (filePath.includes('/constants/')) {
      layer = 'application';
      role = '常量定义';
      summary = '全局常量和枚举值';
    } else if (filePath.includes('.d.ts')) {
      layer = 'types';
      role = '类型声明';
      summary = 'TypeScript类型定义文件';
    } else if (filePath.includes('/hooks/')) {
      layer = 'application';
      role = '状态钩子';
      summary = 'React状态管理和业务逻辑封装';
    } else if (filePath.includes('/providers/')) {
      layer = 'application';
      role = '上下文提供者';
      summary = 'React Context状态提供和管理';
    } else if (filePath.includes('/shared/')) {
      layer = 'shared';
      role = '共享工具';
      summary = '跨模块共享的工具和类型';
    } else if (filePath.includes('/stores/')) {
      layer = 'application';
      role = '状态存储';
      summary = '全局状态管理存储';
    } else if (filePath.includes('/theme/')) {
      layer = 'ui';
      role = '主题系统';
      summary = '应用主题配置和切换逻辑';
    } else if (filePath.includes('/unified-view/')) {
      layer = 'ui';
      role = '统一视图';
      summary = '统一视图组件和逻辑';
    } else if (filePath.includes('/types/')) {
      layer = 'types';
      role = '类型定义';  
      summary = 'TypeScript接口和类型声明';
    } else if (filePath.includes('/examples/')) {
      layer = 'examples';
      role = '示例代码';
      summary = '功能演示和使用示例';
    } else if (filePath.includes('/test/')) {
      layer = 'testing';
      role = '测试代码';
      summary = '单元测试和集成测试';
    } else if (filePath.includes('/infrastructure/')) {
      layer = 'infrastructure';
      role = '基础设施';
      summary = 'DDD架构基础设施层实现';
    }

    const header = `// ${filePath}
// module: ${module} | layer: ${layer} | role: ${role}
// summary: ${summary}

`;

    const newContent = header + content;
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log('✅', filePath);
    return true;
  } catch (error) {
    console.log('❌ 处理失败:', filePath, error.message);
    return false;
  }
}

let processed = 0;
filesToProcess.forEach(file => {
  if (addHeader(file)) {
    processed++;
  }
});

console.log(`\n📊 处理完成: ${processed} 个文件`);