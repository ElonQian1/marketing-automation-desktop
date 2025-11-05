#!/usr/bin/env node
// scripts/enhanced-frontend-restore.mjs
// module: backup | layer: services | role: 增强版前端组件恢复系统
// summary: 提供智能恢复、验证、回滚等功能

import { execSync } from 'child_process';
import { readdirSync, statSync, copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync, renameSync } from 'fs';
import { join, dirname, basename, relative } from 'path';
import { createHash } from 'crypto';

class EnhancedFrontendRestore {
  constructor(backupId, options = {}) {
    this.backupId = backupId;
    this.backupRoot = `backups/frontend/${backupId}`;
    this.dryRun = options.dryRun || false;
    this.force = options.force || false;
    this.selective = options.selective || [];
    this.createBackup = options.createBackup !== false; // 默认创建恢复前备份
    
    this.stats = {
      startTime: Date.now(),
      restoredFiles: 0,
      skippedFiles: 0,
      conflictFiles: 0,
      errors: 0
    };

    this.manifest = null;
    this.conflicts = [];
  }

  // 加载备份清单
  loadManifest() {
    const manifestPath = join(this.backupRoot, 'enhanced-backup-manifest.json');
    if (!existsSync(manifestPath)) {
      // 尝试加载旧版清单
      const oldManifestPath = join(this.backupRoot, 'backup-manifest.json');
      if (!existsSync(oldManifestPath)) {
        throw new Error(`备份清单不存在: ${manifestPath}`);
      }
      this.manifest = JSON.parse(readFileSync(oldManifestPath, 'utf8'));
      console.log('⚠️ 使用旧版备份清单格式');
    } else {
      this.manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      console.log('✅ 已加载增强版备份清单');
    }
  }

  // 验证备份完整性
  validateBackup() {
    console.log('🔍 验证备份完整性...');
    
    if (!existsSync(this.backupRoot)) {
      throw new Error(`备份目录不存在: ${this.backupRoot}`);
    }

    // 检查关键文件
    const criticalFiles = this.manifest.paths?.critical_files || this.manifest.critical_files || [];
    let missingFiles = 0;
    
    for (const file of criticalFiles) {
      const backupFilePath = this.findBackupFile(file);
      if (!backupFilePath || !existsSync(backupFilePath)) {
        console.warn(`⚠️ 备份中缺少关键文件: ${file}`);
        missingFiles++;
      }
    }

    if (missingFiles > 0) {
      console.warn(`⚠️ 发现 ${missingFiles} 个缺失的关键文件`);
      if (!this.force) {
        throw new Error('备份不完整，使用 --force 强制恢复');
      }
    } else {
      console.log('✅ 备份完整性验证通过');
    }
  }

  // 查找备份文件的实际路径
  findBackupFile(originalPath) {
    // 尝试多个可能的备份路径
    const possiblePaths = [
      join(this.backupRoot, originalPath),
      join(this.backupRoot, 'config', basename(originalPath)),
      join(this.backupRoot, 'components', basename(originalPath)),
      join(this.backupRoot, 'modules', basename(originalPath)),
      join(this.backupRoot, 'pages', basename(originalPath))
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        return path;
      }
    }
    return null;
  }

  // 检测冲突文件
  detectConflicts() {
    console.log('🔍 检测文件冲突...');
    this.conflicts = [];

    // 检查当前工作区的Git状态
    const gitStatus = this.getGitStatus();
    if (gitStatus !== 'clean' && !this.force) {
      throw new Error('工作区有未提交的更改，请先提交或使用 --force 强制恢复');
    }

    const criticalFiles = this.manifest.paths?.critical_files || this.manifest.critical_files || [];
    
    for (const file of criticalFiles) {
      if (existsSync(file)) {
        const currentHash = this.generateFileHash(file);
        const backupFilePath = this.findBackupFile(file);
        
        if (backupFilePath) {
          const backupHash = this.generateFileHash(backupFilePath);
          
          if (currentHash !== backupHash) {
            this.conflicts.push({
              file,
              currentHash,
              backupHash,
              action: 'overwrite'
            });
          }
        }
      }
    }

    if (this.conflicts.length > 0) {
      console.log(`⚠️ 发现 ${this.conflicts.length} 个文件冲突:`);
      this.conflicts.forEach(conflict => {
        console.log(`   📄 ${conflict.file}`);
      });
      
      if (!this.force) {
        console.log('使用 --force 强制覆盖或 --interactive 交互式解决');
        throw new Error('存在文件冲突');
      }
    } else {
      console.log('✅ 未发现文件冲突');
    }
  }

  // 创建恢复前备份
  createPreRestoreBackup() {
    if (!this.createBackup) {
      console.log('⏭️ 跳过恢复前备份');
      return null;
    }

    const preBackupId = `pre-restore-${Date.now()}`;
    const preBackupDir = `backups/frontend/${preBackupId}`;
    
    console.log(`💾 创建恢复前备份: ${preBackupId}`);
    
    try {
      mkdirSync(preBackupDir, { recursive: true });
      
      // 备份即将被覆盖的文件
      let backedUpCount = 0;
      for (const conflict of this.conflicts) {
        const srcFile = conflict.file;
        const backupFile = join(preBackupDir, srcFile);
        
        mkdirSync(dirname(backupFile), { recursive: true });
        copyFileSync(srcFile, backupFile);
        backedUpCount++;
      }
      
      // 创建恢复前备份清单
      const preRestoreManifest = {
        backup_id: preBackupId,
        timestamp: new Date().toISOString(),
        purpose: 'pre-restore-backup',
        original_backup: this.backupId,
        backed_up_files: this.conflicts.map(c => c.file),
        file_count: backedUpCount,
        git_commit: this.getGitCommit()
      };
      
      writeFileSync(
        join(preBackupDir, 'pre-restore-manifest.json'),
        JSON.stringify(preRestoreManifest, null, 2)
      );
      
      console.log(`✅ 恢复前备份完成: ${backedUpCount} 个文件`);
      return preBackupId;
      
    } catch (error) {
      console.warn('⚠️ 恢复前备份失败:', error.message);
      if (!this.force) {
        throw error;
      }
      return null;
    }
  }

  // 执行选择性恢复
  performSelectiveRestore() {
    console.log('🎯 执行选择性恢复...');
    
    for (const pattern of this.selective) {
      console.log(`🔍 查找匹配模式: ${pattern}`);
      
      // 在备份中查找匹配的文件
      const matchedFiles = this.findFilesInBackup(pattern);
      
      for (const backupFile of matchedFiles) {
        const relativePath = relative(this.backupRoot, backupFile);
        const targetPath = this.resolveTargetPath(relativePath);
        
        if (this.dryRun) {
          console.log(`[DRY RUN] 将恢复: ${backupFile} -> ${targetPath}`);
          continue;
        }
        
        try {
          mkdirSync(dirname(targetPath), { recursive: true });
          copyFileSync(backupFile, targetPath);
          console.log(`✅ 已恢复: ${relativePath}`);
          this.stats.restoredFiles++;
        } catch (error) {
          console.warn(`⚠️ 恢复失败 ${relativePath}:`, error.message);
          this.stats.errors++;
        }
      }
    }
  }

  // 执行完整恢复
  performFullRestore() {
    console.log('🔄 执行完整恢复...');
    
    const criticalFiles = this.manifest.paths?.critical_files || this.manifest.critical_files || [];
    const criticalDirs = this.manifest.paths?.critical_dirs || this.manifest.critical_dirs || [];
    
    // 恢复关键文件
    for (const file of criticalFiles) {
      const backupFilePath = this.findBackupFile(file);
      if (backupFilePath && existsSync(backupFilePath)) {
        this.restoreFile(backupFilePath, file);
      } else {
        console.warn(`⚠️ 备份中未找到文件: ${file}`);
        this.stats.skippedFiles++;
      }
    }
    
    // 恢复目录结构
    for (const dir of criticalDirs) {
      const backupDirPath = join(this.backupRoot, relative('src', dir) || dir);
      if (existsSync(backupDirPath)) {
        this.restoreDirectory(backupDirPath, dir);
      } else {
        console.warn(`⚠️ 备份中未找到目录: ${dir}`);
      }
    }
  }

  // 恢复单个文件
  restoreFile(backupFilePath, targetPath) {
    try {
      if (this.dryRun) {
        console.log(`[DRY RUN] 将恢复: ${backupFilePath} -> ${targetPath}`);
        return;
      }
      
      mkdirSync(dirname(targetPath), { recursive: true });
      copyFileSync(backupFilePath, targetPath);
      console.log(`✅ 已恢复文件: ${targetPath}`);
      this.stats.restoredFiles++;
      
    } catch (error) {
      console.warn(`⚠️ 恢复文件失败 ${targetPath}:`, error.message);
      this.stats.errors++;
    }
  }

  // 恢复目录
  restoreDirectory(backupDir, targetDir) {
    try {
      if (!existsSync(backupDir)) {
        return;
      }
      
      const items = readdirSync(backupDir);
      
      for (const item of items) {
        const backupItemPath = join(backupDir, item);
        const targetItemPath = join(targetDir, item);
        const stat = statSync(backupItemPath);
        
        if (stat.isDirectory()) {
          this.restoreDirectory(backupItemPath, targetItemPath);
        } else if (stat.isFile()) {
          this.restoreFile(backupItemPath, targetItemPath);
        }
      }
      
    } catch (error) {
      console.warn(`⚠️ 恢复目录失败 ${targetDir}:`, error.message);
      this.stats.errors++;
    }
  }

  // 在备份中查找文件
  findFilesInBackup(pattern) {
    const matchedFiles = [];
    
    const searchDir = (dir) => {
      if (!existsSync(dir)) return;
      
      const items = readdirSync(dir);
      for (const item of items) {
        const itemPath = join(dir, item);
        const stat = statSync(itemPath);
        
        if (stat.isDirectory()) {
          searchDir(itemPath);
        } else if (stat.isFile()) {
          if (item.includes(pattern) || itemPath.includes(pattern)) {
            matchedFiles.push(itemPath);
          }
        }
      }
    };
    
    searchDir(this.backupRoot);
    return matchedFiles;
  }

  // 解析目标路径
  resolveTargetPath(relativePath) {
    // 移除备份目录结构前缀
    if (relativePath.startsWith('config/')) {
      return relativePath.substring(7); // 移除 'config/'
    }
    if (relativePath.startsWith('components/')) {
      return `src/components/${basename(relativePath)}`;
    }
    if (relativePath.startsWith('modules/')) {
      return `src/modules/${basename(relativePath)}`;
    }
    if (relativePath.startsWith('pages/')) {
      return `src/pages/${basename(relativePath)}`;
    }
    
    return relativePath;
  }

  // 验证恢复结果
  validateRestore() {
    console.log('🔍 验证恢复结果...');
    
    const criticalFiles = this.manifest.paths?.critical_files || this.manifest.critical_files || [];
    let validationErrors = 0;
    
    for (const file of criticalFiles) {
      if (!existsSync(file)) {
        console.warn(`⚠️ 恢复后文件缺失: ${file}`);
        validationErrors++;
        continue;
      }
      
      // 检查文件是否可读
      try {
        readFileSync(file, 'utf8');
      } catch (error) {
        console.warn(`⚠️ 恢复后文件不可读 ${file}:`, error.message);
        validationErrors++;
      }
    }
    
    if (validationErrors === 0) {
      console.log('✅ 恢复验证通过');
    } else {
      console.warn(`⚠️ 发现 ${validationErrors} 个验证错误`);
    }
    
    return validationErrors === 0;
  }

  // 生成恢复报告
  generateRestoreReport(preBackupId) {
    const report = {
      restore_info: {
        backup_id: this.backupId,
        restore_timestamp: new Date().toISOString(),
        pre_restore_backup: preBackupId,
        duration_ms: Date.now() - this.stats.startTime,
        dry_run: this.dryRun,
        selective_patterns: this.selective
      },
      stats: this.stats,
      conflicts: this.conflicts.length,
      git_info: {
        commit_before: this.getGitCommit(),
        branch: this.getGitBranch()
      },
      validation: this.validateRestore()
    };
    
    const reportPath = `restore-report-${this.backupId}-${Date.now()}.json`;
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 恢复报告已生成: ${reportPath}`);
    return report;
  }

  // 工具方法
  generateFileHash(filePath) {
    try {
      const content = readFileSync(filePath);
      return createHash('md5').update(content).digest('hex');
    } catch {
      return null;
    }
  }

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

  // 主执行方法
  async execute() {
    console.log(`🔄 开始增强版前端恢复...`);
    console.log(`🆔 备份ID: ${this.backupId}`);
    console.log(`📂 备份位置: ${this.backupRoot}`);
    console.log(`🎯 模式: ${this.dryRun ? '预览模式' : '实际恢复'}`);
    
    if (this.selective.length > 0) {
      console.log(`🎯 选择性恢复: ${this.selective.join(', ')}`);
    }

    // 1. 加载和验证备份
    this.loadManifest();
    this.validateBackup();
    
    // 2. 检测冲突
    this.detectConflicts();
    
    // 3. 创建恢复前备份
    const preBackupId = this.createPreRestoreBackup();
    
    // 4. 执行恢复
    if (this.selective.length > 0) {
      this.performSelectiveRestore();
    } else {
      this.performFullRestore();
    }
    
    // 5. 生成报告
    const report = this.generateRestoreReport(preBackupId);
    
    // 输出总结
    console.log('\n✅ 增强版前端恢复完成!');
    console.log(`📊 统计信息:`);
    console.log(`   ✅ 成功恢复: ${this.stats.restoredFiles} 个文件`);
    console.log(`   ⏭️ 跳过文件: ${this.stats.skippedFiles} 个`);
    console.log(`   ⚠️ 冲突文件: ${this.stats.conflictFiles} 个`);
    console.log(`   ❌ 错误数量: ${this.stats.errors} 个`);
    console.log(`   ⏱️ 用时: ${Date.now() - this.stats.startTime}ms`);
    
    if (preBackupId) {
      console.log(`💾 恢复前备份: ${preBackupId}`);
      console.log(`🔄 回滚命令: npm run restore:frontend ${preBackupId}`);
    }
    
    console.log(`🔍 验证结果: ${report.validation ? '✅ 通过' : '❌ 失败'}`);
  }
}

// 命令行参数解析
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
增强版前端恢复工具

用法: node scripts/enhanced-frontend-restore.mjs <backup-id> [选项]

参数:
  backup-id            要恢复的备份时间戳ID

选项:
  --dry-run           预览模式，不实际执行恢复
  --force             强制恢复，忽略冲突和警告
  --no-backup         不创建恢复前备份
  --selective FILE    仅恢复匹配的文件（可多次使用）
  -h, --help          显示帮助信息

示例:
  node scripts/enhanced-frontend-restore.mjs 2024-11-06T10-30-15
  node scripts/enhanced-frontend-restore.mjs 2024-11-06T10-30-15 --dry-run
  node scripts/enhanced-frontend-restore.mjs 2024-11-06T10-30-15 --selective "*.tsx"
  node scripts/enhanced-frontend-restore.mjs 2024-11-06T10-30-15 --force --no-backup
    `);
    process.exit(0);
  }

  const backupId = args[0];
  const options = {
    dryRun: false,
    force: false,
    createBackup: true,
    selective: []
  };

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--force':
        options.force = true;
        break;
      case '--no-backup':
        options.createBackup = false;
        break;
      case '--selective':
        options.selective.push(args[++i]);
        break;
    }
  }

  return { backupId, options };
}

// 主函数
async function main() {
  try {
    const { backupId, options } = parseArgs();
    
    if (!backupId) {
      throw new Error('请提供备份ID');
    }

    const restore = new EnhancedFrontendRestore(backupId, options);
    await restore.execute();
    
  } catch (error) {
    console.error('❌ 恢复失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { EnhancedFrontendRestore };