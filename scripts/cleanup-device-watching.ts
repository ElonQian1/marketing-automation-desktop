/**
 * 设备监听架构清理工具
 * 用于清理重复的诊断工具、测试代码和过度日志记录
 */

import * as fs from 'fs';
import * as path from 'path';

interface CleanupResult {
  removedFiles: string[];
  modifiedFiles: string[];
  errors: string[];
  summary: {
    removedLogStatements: number;
    removedDiagnosticTools: number;
    cleanedFiles: number;
  };
}

class DeviceWatchingCleanupTool {
  private readonly projectRoot: string;
  private readonly dryRun: boolean;
  private result: CleanupResult = {
    removedFiles: [],
    modifiedFiles: [],
    errors: [],
    summary: {
      removedLogStatements: 0,
      removedDiagnosticTools: 0,
      cleanedFiles: 0
    }
  };

  constructor(projectRoot: string, dryRun: boolean = true) {
    this.projectRoot = projectRoot;
    this.dryRun = dryRun;
  }

  /**
   * 执行完整清理
   */
  async performCleanup(): Promise<CleanupResult> {
    console.log('🧹 开始设备监听架构清理...');
    console.log(`📍 项目路径: ${this.projectRoot}`);
    console.log(`🔍 运行模式: ${this.dryRun ? '预览模式 (不实际修改)' : '实际清理'}`);

    try {
      // 1. 移除重复的诊断工具
      await this.removeLegacyDiagnosticTools();

      // 2. 清理过度日志记录
      await this.cleanupExcessiveLogging();

      // 3. 移除测试版本的代码
      await this.removeTestVersionCode();

      // 4. 清理空目录
      await this.cleanupEmptyDirectories();

      this.printSummary();
      return this.result;
    } catch (error) {
      this.result.errors.push(`清理过程中发生错误: ${error}`);
      throw error;
    }
  }

  /**
   * 移除旧版诊断工具
   */
  private async removeLegacyDiagnosticTools(): Promise<void> {
    console.log('\n📋 移除重复的诊断工具...');

    const legacyDiagnosticFiles = [
      'src/application/services/device-watching/DeviceWatchingDiagnostics.ts',
      'src/application/services/device-watching/CallbackChainDiagnostics.ts',
      'src/application/services/device-watching/DeviceListeningChainFixer.ts',
      'src/application/services/device-watching/DeviceChangeDetector.ts'
    ];

    for (const file of legacyDiagnosticFiles) {
      const fullPath = path.join(this.projectRoot, file);
      
      if (fs.existsSync(fullPath)) {
        console.log(`  ❌ 移除旧版诊断工具: ${file}`);
        
        if (!this.dryRun) {
          fs.unlinkSync(fullPath);
        }
        
        this.result.removedFiles.push(file);
        this.result.summary.removedDiagnosticTools++;
      }
    }
  }

  /**
   * 清理过度日志记录
   */
  private async cleanupExcessiveLogging(): Promise<void> {
    console.log('\\n📝 清理过度日志记录...');

    const filesToClean = [
      'src/application/services/AdbApplicationService.ts',
      'src/infrastructure/RealTimeDeviceTracker.ts',
      'src/infrastructure/repositories/RealTimeDeviceRepository.ts'
    ];

    for (const file of filesToClean) {
      const fullPath = path.join(this.projectRoot, file);
      
      if (fs.existsSync(fullPath)) {
        const cleanedContent = await this.cleanLoggingInFile(fullPath);
        
        if (cleanedContent.modified) {
          console.log(`  🔧 清理日志: ${file} (移除 ${cleanedContent.removedCount} 条日志)`);
          
          if (!this.dryRun) {
            fs.writeFileSync(fullPath, cleanedContent.content);
          }
          
          this.result.modifiedFiles.push(file);
          this.result.summary.removedLogStatements += cleanedContent.removedCount;
        }
      }
    }
  }

  /**
   * 清理单个文件中的过度日志
   */
  private async cleanLoggingInFile(filePath: string): Promise<{
    content: string;
    modified: boolean;
    removedCount: number;
  }> {
    const content = fs.readFileSync(filePath, 'utf-8');
    let modifiedContent = content;
    let removedCount = 0;

    // 移除详细调试日志（保留错误和警告）
    const excessiveLogPatterns = [
      // 移除过度详细的设备变化日志
      /console\\.log\\(['\"]🔔.*?开始通知.*?['\"][\\s\\S]*?\\);?/g,
      /console\\.log\\(['\"]🔔.*?调用上层回调.*?['\"][\\s\\S]*?\\);?/g,
      /console\\.log\\(['\"]✅.*?上层回调.*?执行成功['\"].*?\\);?/g,
      
      // 移除启动/停止的重复日志
      /console\\.log\\(['\"]🚀.*?跟踪器未运行，正在启动.*?['\"][\\s\\S]*?\\);?/g,
      /console\\.log\\(['\"]✅.*?实时设备跟踪器已启动['\"].*?\\);?/g,
      /console\\.log\\(['\"]✅.*?跟踪器已在运行['\"].*?\\);?/g,
      
      // 移除过度详细的诊断日志
      /console\\.log\\(['\"]🎯.*?回调被调用.*?['\"][\\s\\S]*?\\);?/g,
      /console\\.log\\(['\"]📱.*?检测到设备变化:.*?['\"][\\s\\S]*?\\);?/g,
      /console\\.log\\(['\"]✅.*?所有上层回调通知完成['\"].*?\\);?/g,
      
      // 移除启动时的详细状态日志
      /console\\.log\\(['\"]⚡.*?启动监听前立即推送.*?['\"][\\s\\S]*?\\);?/g,
      /console\\.log\\(['\"]✅.*?更新设备到 store:.*?['\"][\\s\\S]*?\\);?/g,
      /console\\.log\\(['\"]✅.*?设备监听服务已启动.*?['\"][\\s\\S]*?\\);?/g
    ];

    for (const pattern of excessiveLogPatterns) {
      const matches = modifiedContent.match(pattern);
      if (matches) {
        removedCount += matches.length;
        modifiedContent = modifiedContent.replace(pattern, '');
      }
    }

    // 清理多余的空行
    modifiedContent = modifiedContent.replace(/\\n\\s*\\n\\s*\\n/g, '\\n\\n');

    return {
      content: modifiedContent,
      modified: removedCount > 0,
      removedCount
    };
  }

  /**
   * 移除测试版本代码
   */
  private async removeTestVersionCode(): Promise<void> {
    console.log('\\n🧪 移除测试版本代码...');

    // 这里可以添加特定的测试代码清理逻辑
    // 比如移除带有 // TODO: remove in production 注释的代码块
  }

  /**
   * 清理空目录
   */
  private async cleanupEmptyDirectories(): Promise<void> {
    console.log('\\n📁 清理空目录...');

    const deviceWatchingDir = path.join(this.projectRoot, 'src/application/services/device-watching');
    
    if (fs.existsSync(deviceWatchingDir)) {
      const entries = fs.readdirSync(deviceWatchingDir);
      
      for (const entry of entries) {
        const fullPath = path.join(deviceWatchingDir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          const subEntries = fs.readdirSync(fullPath);
          
          if (subEntries.length === 0) {
            console.log(`  🗑️ 移除空目录: ${entry}`);
            
            if (!this.dryRun) {
              fs.rmdirSync(fullPath);
            }
          }
        }
      }
    }
  }

  /**
   * 更新导入声明，移除对已删除诊断工具的引用
   */
  private async updateImports(): Promise<void> {
    console.log('\\n🔗 更新导入声明...');

    const filesToUpdate = [
      'src/application/services/AdbApplicationService.ts',
      'src/application/hooks/useAdb.ts'
    ];

    const legacyImports = [
      "import { deviceWatchingDiagnostics } from './device-watching/DeviceWatchingDiagnostics';",
      "import { callbackChainDiagnostics } from './device-watching/CallbackChainDiagnostics';",
      "import { deviceChangeDetector } from './device-watching/DeviceChangeDetector';",
      "import { deviceListeningChainFixer } from './device-watching/DeviceListeningChainFixer';"
    ];

    for (const file of filesToUpdate) {
      const fullPath = path.join(this.projectRoot, file);
      
      if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf-8');
        let modified = false;

        for (const importStatement of legacyImports) {
          if (content.includes(importStatement)) {
            content = content.replace(importStatement, '');
            modified = true;
          }
        }

        if (modified) {
          console.log(`  🔧 更新导入: ${file}`);
          
          if (!this.dryRun) {
            fs.writeFileSync(fullPath, content);
          }
          
          if (!this.result.modifiedFiles.includes(file)) {
            this.result.modifiedFiles.push(file);
          }
        }
      }
    }
  }

  /**
   * 打印清理摘要
   */
  private printSummary(): void {
    console.log('\\n📊 清理摘要:');
    console.log(`  📁 移除文件: ${this.result.removedFiles.length}`);
    console.log(`  📝 修改文件: ${this.result.modifiedFiles.length}`);
    console.log(`  📋 移除日志语句: ${this.result.summary.removedLogStatements}`);
    console.log(`  🔧 移除诊断工具: ${this.result.summary.removedDiagnosticTools}`);
    console.log(`  ❌ 错误: ${this.result.errors.length}`);

    if (this.dryRun) {
      console.log('\\n⚠️ 这是预览模式，没有实际修改文件');
      console.log('💡 要执行实际清理，请运行: npm run clean:device-watching');
    } else {
      console.log('\\n✅ 清理完成！');
    }
  }
}

// 命令行接口
if (require.main === module) {
  const projectRoot = process.cwd();
  const dryRun = !process.argv.includes('--execute');

  const cleanupTool = new DeviceWatchingCleanupTool(projectRoot, dryRun);
  
  cleanupTool.performCleanup()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 清理失败:', error);
      process.exit(1);
    });
}

export { DeviceWatchingCleanupTool };