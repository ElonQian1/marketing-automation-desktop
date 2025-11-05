#!/usr/bin/env node
// scripts/enhanced-frontend-backup.mjs
// module: backup | layer: services | role: 增强版前端组件备份系统
// summary: 提供完善的时间戳备份、增量备份、自动清理等功能

import { execSync } from 'child_process';
import { readdirSync, statSync, copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname, basename, extname, relative } from 'path';
import { createHash } from 'crypto';

class EnhancedFrontendBackup {
  constructor(options = {}) {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    this.backupRoot = options.backupRoot || `backups/frontend/${this.timestamp}`;
    this.maxBackups = options.maxBackups || 10;
    this.incrementalMode = options.incremental || false;
    this.compressionLevel = options.compression || 'none';
    
    // 扩展的备份目录配置
    this.criticalDirs = [
      'src/components',
      'src/modules',
      'src/pages', 
      'src/hooks',
      'src/services',
      'src/stores',
      'src/store',
      'src/utils',
      'src/types',
      'src/lib',
      'src/assets/icons',
      'src/shared'
    ];

    // 关键配置文件
    this.criticalFiles = [
      'src/App.tsx',
      'src/main.tsx', 
      'src/index.css',
      'src/globals.css',
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'tsconfig.app.json',
      'tsconfig.node.json',
      'vite.config.ts',
      'tailwind.config.js',
      'postcss.config.js',
      'eslint.config.cjs',
      'index.html',
      '.env.example'
    ];

    this.stats = {
      startTime: Date.now(),
      directories: 0,
      totalFiles: 0,
      criticalFiles: 0,
      incrementalFiles: 0,
      skippedFiles: 0,
      backupSize: 0,
      checksums: new Map()
    };
  }

  // 生成文件哈希值用于增量备份
  generateFileHash(filePath) {
    try {
      const content = readFileSync(filePath);
      return createHash('md5').update(content).digest('hex');
    } catch (error) {
      console.warn(`⚠️ 无法计算文件哈希 ${filePath}:`, error.message);
      return null;
    }
  }

  // 加载上次备份的哈希记录
  loadLastBackupHashes() {
    const hashesFile = 'backups/frontend/last-backup-hashes.json';
    if (existsSync(hashesFile)) {
      try {
        const content = readFileSync(hashesFile, 'utf8');
        return new Map(Object.entries(JSON.parse(content)));
      } catch (error) {
        console.warn('⚠️ 无法加载上次备份哈希记录:', error.message);
      }
    }
    return new Map();
  }

  // 保存当前备份的哈希记录
  saveCurrentBackupHashes() {
    const hashesFile = 'backups/frontend/last-backup-hashes.json';
    mkdirSync(dirname(hashesFile), { recursive: true });
    const hashObject = Object.fromEntries(this.stats.checksums);
    writeFileSync(hashesFile, JSON.stringify(hashObject, null, 2));
  }

  // 检查文件是否需要备份（增量模式）
  shouldBackupFile(filePath, lastHashes) {
    if (!this.incrementalMode) return true;
    
    const currentHash = this.generateFileHash(filePath);
    if (!currentHash) return true;
    
    this.stats.checksums.set(filePath, currentHash);
    
    const lastHash = lastHashes.get(filePath);
    return !lastHash || lastHash !== currentHash;
  }

  // 创建备份目录结构
  createBackupStructure() {
    console.log(`🗂️ 创建备份目录: ${this.backupRoot}`);
    mkdirSync(this.backupRoot, { recursive: true });
    
    // 创建分类子目录
    const subDirs = ['components', 'modules', 'pages', 'config', 'assets', 'docs'];
    subDirs.forEach(dir => {
      mkdirSync(join(this.backupRoot, dir), { recursive: true });
    });
  }

  // 智能目录备份
  backupDirectory(srcDir, backupDir, lastHashes) {
    try {
      mkdirSync(backupDir, { recursive: true });
      
      const items = readdirSync(srcDir);
      let fileCount = 0;
      
      for (const item of items) {
        const srcPath = join(srcDir, item);
        const backupPath = join(backupDir, item);
        const stat = statSync(srcPath);
        
        // 跳过不需要的文件和目录
        if (this.shouldSkipItem(item, srcPath)) {
          continue;
        }
        
        if (stat.isDirectory()) {
          fileCount += this.backupDirectory(srcPath, backupPath, lastHashes);
        } else if (stat.isFile()) {
          if (this.shouldBackupFile(srcPath, lastHashes)) {
            this.copyFileWithMetadata(srcPath, backupPath);
            fileCount++;
          } else {
            this.stats.skippedFiles++;
          }
        }
      }
      
      if (fileCount > 0) {
        this.stats.directories++;
      }
      
      return fileCount;
    } catch (error) {
      console.warn(`⚠️ 备份目录失败 ${srcDir}:`, error.message);
      return 0;
    }
  }

  // 判断是否应该跳过文件/目录
  shouldSkipItem(itemName, fullPath) {
    // 跳过的目录
    const skipDirs = ['.git', 'node_modules', 'dist', 'build', '.vscode', '.idea', 'coverage', '.next'];
    // 跳过的文件扩展名
    const skipExtensions = ['.log', '.tmp', '.cache', '.DS_Store'];
    // 跳过的文件名模式
    const skipPatterns = [/^\./, /~$/, /\.backup$/, /\.old$/];
    
    if (skipDirs.includes(itemName)) return true;
    if (skipExtensions.some(ext => itemName.endsWith(ext))) return true;
    if (skipPatterns.some(pattern => pattern.test(itemName))) return true;
    
    return false;
  }

  // 带元数据的文件复制
  copyFileWithMetadata(srcPath, backupPath) {
    try {
      mkdirSync(dirname(backupPath), { recursive: true });
      copyFileSync(srcPath, backupPath);
      
      // 记录文件信息
      const stat = statSync(srcPath);
      this.stats.backupSize += stat.size;
      this.stats.totalFiles++;
      
      // 如果是关键文件，计数
      if (this.criticalFiles.some(cf => srcPath.endsWith(cf))) {
        this.stats.criticalFiles++;
      }
      
      return true;
    } catch (error) {
      console.warn(`⚠️ 复制文件失败 ${srcPath}:`, error.message);
      return false;
    }
  }

  // 备份单个关键文件
  backupCriticalFile(filePath, lastHashes) {
    try {
      if (!existsSync(filePath)) {
        console.warn(`⚠️ 关键文件不存在: ${filePath}`);
        return false;
      }

      if (!this.shouldBackupFile(filePath, lastHashes)) {
        console.log(`⏭️ 跳过未变更文件: ${filePath}`);
        this.stats.skippedFiles++;
        return true;
      }

      // 根据文件类型选择目标目录
      let targetDir = 'config';
      if (filePath.includes('src/')) {
        if (filePath.includes('components')) targetDir = 'components';
        else if (filePath.includes('modules')) targetDir = 'modules';
        else if (filePath.includes('pages')) targetDir = 'pages';
      }

      const backupPath = join(this.backupRoot, targetDir, basename(filePath));
      
      if (this.copyFileWithMetadata(filePath, backupPath)) {
        console.log(`✅ 已备份关键文件: ${filePath} -> ${targetDir}/`);
        return true;
      }
      return false;
    } catch (error) {
      console.warn(`⚠️ 备份关键文件失败 ${filePath}:`, error.message);
      return false;
    }
  }

  // 生成详细的备份清单
  generateEnhancedManifest() {
    const manifest = {
      backup_info: {
        timestamp: new Date().toISOString(),
        backup_id: this.timestamp,
        backup_type: this.incrementalMode ? 'incremental' : 'full',
        compression: this.compressionLevel,
        duration_ms: Date.now() - this.stats.startTime
      },
      git_info: {
        commit: this.getGitCommit(),
        branch: this.getGitBranch(),
        status: this.getGitStatus()
      },
      stats: {
        directories: this.stats.directories,
        total_files: this.stats.totalFiles,
        critical_files: this.stats.criticalFiles,
        incremental_files: this.stats.incrementalFiles,
        skipped_files: this.stats.skippedFiles,
        backup_size_bytes: this.stats.backupSize,
        backup_size_human: this.formatBytes(this.stats.backupSize)
      },
      paths: {
        critical_files: this.criticalFiles,
        critical_dirs: this.criticalDirs,
        backup_root: this.backupRoot
      },
      restore: {
        command: `npm run restore:frontend ${this.timestamp}`,
        script: `node scripts/enhanced-frontend-restore.mjs ${this.timestamp}`,
        validation: `npm run validate:backup ${this.timestamp}`
      },
      checksum_count: this.stats.checksums.size
    };
    
    const manifestPath = join(this.backupRoot, 'enhanced-backup-manifest.json');
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    // 同时生成简化版本用于快速查看
    const summaryPath = join(this.backupRoot, 'backup-summary.txt');
    const summary = [
      `备份时间戳: ${this.timestamp}`,
      `备份类型: ${this.incrementalMode ? '增量备份' : '完整备份'}`,
      `文件总数: ${this.stats.totalFiles}`,
      `关键文件: ${this.stats.criticalFiles}`,
      `跳过文件: ${this.stats.skippedFiles}`,
      `备份大小: ${this.formatBytes(this.stats.backupSize)}`,
      `用时: ${Date.now() - this.stats.startTime}ms`,
      `Git提交: ${this.getGitCommit()}`,
      `恢复命令: npm run restore:frontend ${this.timestamp}`
    ].join('\n');
    
    writeFileSync(summaryPath, summary);
    
    console.log(`📋 增强备份清单已创建: ${manifestPath}`);
    console.log(`📄 备份摘要已创建: ${summaryPath}`);
  }

  // 清理旧备份
  cleanupOldBackups() {
    try {
      const backupsDir = 'backups/frontend';
      if (!existsSync(backupsDir)) return;
      
      const backups = readdirSync(backupsDir)
        .filter(name => /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/.test(name))
        .map(name => ({
          name,
          path: join(backupsDir, name),
          time: new Date(name.replace(/T/, ' ').replace(/-/g, ':'))
        }))
        .sort((a, b) => b.time - a.time);
      
      if (backups.length > this.maxBackups) {
        const toDelete = backups.slice(this.maxBackups);
        console.log(`🧹 清理 ${toDelete.length} 个旧备份...`);
        
        for (const backup of toDelete) {
          try {
            execSync(`rm -rf "${backup.path}"`, { stdio: 'ignore' });
            console.log(`🗑️ 已删除旧备份: ${backup.name}`);
          } catch (error) {
            console.warn(`⚠️ 删除备份失败 ${backup.name}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ 清理旧备份时出错:', error.message);
    }
  }

  // Git 相关工具方法
  getGitCommit() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  getGitBranch() {
    try {
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  getGitStatus() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      return status.trim() ? 'dirty' : 'clean';
    } catch {
      return 'unknown';
    }
  }

  // 格式化字节大小
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 主执行方法
  async execute() {
    console.log('🚀 开始增强版前端组件备份...');
    console.log(`📊 模式: ${this.incrementalMode ? '增量备份' : '完整备份'}`);
    console.log(`🏷️ 时间戳: ${this.timestamp}`);
    
    this.createBackupStructure();
    
    // 加载上次备份的哈希记录（用于增量备份）
    const lastHashes = this.incrementalMode ? this.loadLastBackupHashes() : new Map();
    if (this.incrementalMode && lastHashes.size > 0) {
      console.log(`🔍 加载了 ${lastHashes.size} 个文件的历史哈希记录`);
    }

    // 备份关键目录
    for (const dir of this.criticalDirs) {
      if (existsSync(dir)) {
        console.log(`📁 备份目录: ${dir}`);
        const backupDir = join(this.backupRoot, relative('src', dir) || dir);
        const fileCount = this.backupDirectory(dir, backupDir, lastHashes);
        console.log(`   ✅ 目录 ${dir}: ${fileCount} 个文件`);
      } else {
        console.log(`⏭️ 跳过不存在的目录: ${dir}`);
      }
    }
    
    // 备份关键文件
    console.log('\n📄 备份关键配置文件...');
    let criticalFileCount = 0;
    for (const file of this.criticalFiles) {
      if (this.backupCriticalFile(file, lastHashes)) {
        criticalFileCount++;
      }
    }
    
    // 保存当前备份的哈希记录
    if (this.incrementalMode) {
      this.saveCurrentBackupHashes();
      console.log(`💾 已保存 ${this.stats.checksums.size} 个文件的哈希记录`);
    }

    // 生成详细清单
    this.generateEnhancedManifest();
    
    // 清理旧备份
    this.cleanupOldBackups();
    
    // 输出总结
    console.log('\n✅ 增强版前端备份完成!');
    console.log(`📊 统计信息:`);
    console.log(`   📁 目录: ${this.stats.directories}`);
    console.log(`   📄 文件总数: ${this.stats.totalFiles}`);
    console.log(`   🔑 关键文件: ${this.stats.criticalFiles}`);
    console.log(`   ⏭️ 跳过文件: ${this.stats.skippedFiles}`);
    console.log(`   💾 备份大小: ${this.formatBytes(this.stats.backupSize)}`);
    console.log(`   ⏱️ 用时: ${Date.now() - this.stats.startTime}ms`);
    console.log(`💾 备份位置: ${this.backupRoot}`);
    console.log(`🆔 备份ID: ${this.timestamp}`);
    console.log(`🔧 恢复命令: npm run restore:frontend ${this.timestamp}`);
  }
}

// 命令行参数解析
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    incremental: false,
    maxBackups: 10,
    compression: 'none'
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--incremental':
      case '-i':
        options.incremental = true;
        break;
      case '--max-backups':
        options.maxBackups = parseInt(args[++i]) || 10;
        break;
      case '--compression':
        options.compression = args[++i] || 'none';
        break;
      case '--help':
      case '-h':
        console.log(`
增强版前端备份工具

用法: node scripts/enhanced-frontend-backup.mjs [选项]

选项:
  -i, --incremental     启用增量备份模式
  --max-backups N       保留最多N个备份 (默认: 10)
  --compression TYPE    压缩类型 (none|gzip) (默认: none)
  -h, --help           显示帮助信息

示例:
  node scripts/enhanced-frontend-backup.mjs                    # 完整备份
  node scripts/enhanced-frontend-backup.mjs --incremental     # 增量备份
  node scripts/enhanced-frontend-backup.mjs --max-backups 5  # 最多保留5个备份
        `);
        process.exit(0);
    }
  }

  return options;
}

// 主函数
async function main() {
  try {
    const options = parseArgs();
    const backup = new EnhancedFrontendBackup(options);
    await backup.execute();
  } catch (error) {
    console.error('❌ 备份失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { EnhancedFrontendBackup };