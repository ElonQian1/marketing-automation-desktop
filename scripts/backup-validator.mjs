#!/usr/bin/env node
// scripts/backup-validator.mjs
// module: backup | layer: services | role: 备份验证和完整性检查
// summary: 提供备份完整性验证、文件对比和恢复测试功能

import { execSync } from 'child_process';
import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join, basename, relative } from 'path';
import { createHash } from 'crypto';

class BackupValidator {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.checksumAlgorithm = options.checksumAlgorithm || 'md5';
    
    this.results = {
      valid: true,
      errors: [],
      warnings: [],
      stats: {
        totalFiles: 0,
        validFiles: 0,
        missingFiles: 0,
        corruptedFiles: 0,
        sizeMismatch: 0
      }
    };
  }

  // 验证单个备份
  async validateBackup(backupId) {
    console.log(`🔍 验证备份: ${backupId}`);
    
    const backupRoot = `backups/frontend/${backupId}`;
    if (!existsSync(backupRoot)) {
      throw new Error(`备份目录不存在: ${backupRoot}`);
    }

    // 加载备份清单
    const manifest = this.loadBackupManifest(backupRoot);
    if (!manifest) {
      this.addError('无法加载备份清单');
      return this.results;
    }

    console.log(`📋 清单信息: ${manifest.stats?.total_files || '未知'} 个文件`);

    // 验证备份结构
    await this.validateBackupStructure(backupRoot, manifest);
    
    // 验证文件完整性
    await this.validateFileIntegrity(backupRoot, manifest);
    
    // 验证关键文件
    await this.validateCriticalFiles(backupRoot, manifest);
    
    // 生成验证报告
    this.generateValidationReport(backupId);
    
    return this.results;
  }

  // 加载备份清单
  loadBackupManifest(backupRoot) {
    // 尝试加载增强版清单
    let manifestPath = join(backupRoot, 'enhanced-backup-manifest.json');
    if (existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        this.log('✅ 已加载增强版备份清单');
        return manifest;
      } catch (error) {
        this.addWarning(`增强版清单加载失败: ${error.message}`);
      }
    }
    
    // 尝试加载标准清单
    manifestPath = join(backupRoot, 'backup-manifest.json');
    if (existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        this.log('⚠️ 使用标准版备份清单');
        return manifest;
      } catch (error) {
        this.addError(`标准清单加载失败: ${error.message}`);
      }
    }
    
    return null;
  }

  // 验证备份结构
  async validateBackupStructure(backupRoot, manifest) {
    this.log('🏗️ 验证备份结构...');
    
    // 检查预期的目录结构
    const expectedDirs = ['components', 'modules', 'pages', 'config'];
    
    for (const dir of expectedDirs) {
      const dirPath = join(backupRoot, dir);
      if (existsSync(dirPath) && statSync(dirPath).isDirectory()) {
        this.log(`✅ 目录存在: ${dir}`);
      } else {
        this.addWarning(`目录缺失或不是目录: ${dir}`);
      }
    }
    
    // 检查必要文件
    const requiredFiles = ['enhanced-backup-manifest.json', 'backup-summary.txt'];
    
    for (const file of requiredFiles) {
      const filePath = join(backupRoot, file);
      if (existsSync(filePath)) {
        this.log(`✅ 必要文件存在: ${file}`);
      } else {
        // 对于旧版备份，降级为警告
        if (file === 'enhanced-backup-manifest.json' && existsSync(join(backupRoot, 'backup-manifest.json'))) {
          this.addWarning(`使用旧版清单格式: ${file}`);
        } else {
          this.addWarning(`必要文件缺失: ${file}`);
        }
      }
    }
  }

  // 验证文件完整性
  async validateFileIntegrity(backupRoot, manifest) {
    this.log('🔍 验证文件完整性...');
    
    const backupFiles = this.collectBackupFiles(backupRoot);
    this.results.stats.totalFiles = backupFiles.length;
    
    for (const backupFile of backupFiles) {
      try {
        const relativePath = relative(backupRoot, backupFile);
        
        // 跳过清单和元数据文件
        if (this.isMetadataFile(relativePath)) {
          continue;
        }
        
        // 检查文件可读性
        const content = readFileSync(backupFile);
        
        // 验证文件大小
        const stat = statSync(backupFile);
        if (stat.size === 0 && !relativePath.endsWith('.gitkeep')) {
          this.addWarning(`空文件: ${relativePath}`);
        }
        
        // 计算校验和
        const checksum = this.calculateChecksum(content);
        
        // 对于关键代码文件，进行语法检查
        if (this.isCodeFile(relativePath)) {
          this.validateCodeFile(backupFile, relativePath);
        }
        
        this.results.stats.validFiles++;
        this.log(`✅ 文件完整: ${relativePath} (${stat.size} bytes, ${checksum.slice(0, 8)}...)`);
        
      } catch (error) {
        this.addError(`文件验证失败 ${relative(backupRoot, backupFile)}: ${error.message}`);
        this.results.stats.corruptedFiles++;
      }
    }
  }

  // 验证关键文件
  async validateCriticalFiles(backupRoot, manifest) {
    this.log('🔑 验证关键文件...');
    
    const criticalFiles = manifest.paths?.critical_files || manifest.critical_files || [];
    
    for (const criticalFile of criticalFiles) {
      const backupFilePath = this.findBackupFile(backupRoot, criticalFile);
      
      if (!backupFilePath) {
        this.addError(`关键文件缺失: ${criticalFile}`);
        this.results.stats.missingFiles++;
        continue;
      }
      
      try {
        // 验证关键配置文件格式
        if (criticalFile.endsWith('.json')) {
          const content = readFileSync(backupFilePath, 'utf8');
          JSON.parse(content); // 验证JSON格式
          this.log(`✅ JSON文件有效: ${criticalFile}`);
        }
        
        if (criticalFile.endsWith('.ts') || criticalFile.endsWith('.tsx')) {
          // 可以添加TypeScript语法检查
          this.log(`✅ TypeScript文件存在: ${criticalFile}`);
        }
        
        this.results.stats.validFiles++;
        
      } catch (error) {
        this.addError(`关键文件验证失败 ${criticalFile}: ${error.message}`);
        this.results.stats.corruptedFiles++;
      }
    }
  }

  // 查找备份文件
  findBackupFile(backupRoot, originalPath) {
    const possiblePaths = [
      join(backupRoot, originalPath),
      join(backupRoot, 'config', basename(originalPath)),
      join(backupRoot, 'components', basename(originalPath)),
      join(backupRoot, 'modules', basename(originalPath)),
      join(backupRoot, 'pages', basename(originalPath))
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        return path;
      }
    }
    
    return null;
  }

  // 收集备份中的所有文件
  collectBackupFiles(backupRoot) {
    const files = [];
    
    const walkDir = (dir) => {
      const items = readdirSync(dir);
      
      for (const item of items) {
        const itemPath = join(dir, item);
        const stat = statSync(itemPath);
        
        if (stat.isDirectory()) {
          walkDir(itemPath);
        } else if (stat.isFile()) {
          files.push(itemPath);
        }
      }
    };
    
    walkDir(backupRoot);
    return files;
  }

  // 验证代码文件语法
  validateCodeFile(filePath, relativePath) {
    try {
      const content = readFileSync(filePath, 'utf8');
      
      // 基本语法检查
      if (relativePath.endsWith('.json')) {
        JSON.parse(content);
      }
      
      if (relativePath.endsWith('.tsx') || relativePath.endsWith('.ts')) {
        // 检查基本的TypeScript语法错误
        if (content.includes('import') && !content.includes('from')) {
          this.addWarning(`可能的导入语法错误: ${relativePath}`);
        }
      }
      
      // 检查文件编码
      if (content.includes('\uFFFD')) {
        this.addWarning(`可能的编码问题: ${relativePath}`);
      }
      
    } catch (error) {
      this.addWarning(`代码文件检查失败 ${relativePath}: ${error.message}`);
    }
  }

  // 计算文件校验和
  calculateChecksum(content) {
    return createHash(this.checksumAlgorithm).update(content).digest('hex');
  }

  // 判断是否为元数据文件
  isMetadataFile(relativePath) {
    const metadataFiles = [
      'enhanced-backup-manifest.json',
      'backup-manifest.json',
      'backup-summary.txt',
      'pre-restore-manifest.json'
    ];
    
    return metadataFiles.some(file => relativePath.includes(file));
  }

  // 判断是否为代码文件
  isCodeFile(relativePath) {
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss'];
    return codeExtensions.some(ext => relativePath.endsWith(ext));
  }

  // 比较两个备份
  async compareBackups(backupId1, backupId2) {
    console.log(`🔄 对比备份: ${backupId1} vs ${backupId2}`);
    
    const backup1Root = `backups/frontend/${backupId1}`;
    const backup2Root = `backups/frontend/${backupId2}`;
    
    if (!existsSync(backup1Root) || !existsSync(backup2Root)) {
      throw new Error('一个或多个备份不存在');
    }
    
    const manifest1 = this.loadBackupManifest(backup1Root);
    const manifest2 = this.loadBackupManifest(backup2Root);
    
    const comparison = {
      backup1: backupId1,
      backup2: backupId2,
      differences: [],
      stats: {
        commonFiles: 0,
        onlyInBackup1: 0,
        onlyInBackup2: 0,
        differentContent: 0
      }
    };
    
    const files1 = new Set(this.collectBackupFiles(backup1Root).map(f => relative(backup1Root, f)));
    const files2 = new Set(this.collectBackupFiles(backup2Root).map(f => relative(backup2Root, f)));
    
    // 查找共同文件和差异
    for (const file of files1) {
      if (files2.has(file)) {
        comparison.stats.commonFiles++;
        
        // 比较文件内容
        const file1Path = join(backup1Root, file);
        const file2Path = join(backup2Root, file);
        
        if (!this.isMetadataFile(file) && this.filesAreDifferent(file1Path, file2Path)) {
          comparison.differences.push({
            type: 'content_diff',
            file,
            description: '文件内容不同'
          });
          comparison.stats.differentContent++;
        }
      } else {
        comparison.differences.push({
          type: 'only_in_backup1',
          file,
          description: `仅存在于 ${backupId1}`
        });
        comparison.stats.onlyInBackup1++;
      }
    }
    
    for (const file of files2) {
      if (!files1.has(file)) {
        comparison.differences.push({
          type: 'only_in_backup2',
          file,
          description: `仅存在于 ${backupId2}`
        });
        comparison.stats.onlyInBackup2++;
      }
    }
    
    console.log(`📊 对比结果:`);
    console.log(`   共同文件: ${comparison.stats.commonFiles}`);
    console.log(`   仅在 ${backupId1}: ${comparison.stats.onlyInBackup1}`);
    console.log(`   仅在 ${backupId2}: ${comparison.stats.onlyInBackup2}`);
    console.log(`   内容不同: ${comparison.stats.differentContent}`);
    
    return comparison;
  }

  // 检查两个文件是否不同
  filesAreDifferent(file1, file2) {
    try {
      const content1 = readFileSync(file1);
      const content2 = readFileSync(file2);
      
      const hash1 = this.calculateChecksum(content1);
      const hash2 = this.calculateChecksum(content2);
      
      return hash1 !== hash2;
    } catch (error) {
      return true; // 如果无法读取，认为是不同的
    }
  }

  // 生成验证报告
  generateValidationReport(backupId) {
    const report = {
      validation_info: {
        backup_id: backupId,
        timestamp: new Date().toISOString(),
        validator_version: '1.0.0'
      },
      results: {
        valid: this.results.valid,
        total_errors: this.results.errors.length,
        total_warnings: this.results.warnings.length
      },
      stats: this.results.stats,
      errors: this.results.errors,
      warnings: this.results.warnings,
      summary: this.generateSummary()
    };
    
    const reportPath = `backup-validation-${backupId}-${Date.now()}.json`;
    require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 验证报告已生成: ${reportPath}`);
    
    // 输出简要结果
    console.log('\n📊 验证结果:');
    console.log(`   总文件数: ${this.results.stats.totalFiles}`);
    console.log(`   有效文件: ${this.results.stats.validFiles}`);
    console.log(`   缺失文件: ${this.results.stats.missingFiles}`);
    console.log(`   损坏文件: ${this.results.stats.corruptedFiles}`);
    console.log(`   错误数量: ${this.results.errors.length}`);
    console.log(`   警告数量: ${this.results.warnings.length}`);
    console.log(`   整体状态: ${this.results.valid ? '✅ 有效' : '❌ 无效'}`);
    
    return report;
  }

  // 生成摘要
  generateSummary() {
    const { stats, errors, warnings } = this.results;
    
    if (errors.length === 0 && warnings.length === 0) {
      return '✅ 备份完全有效，所有文件通过验证';
    }
    
    if (errors.length > 0) {
      return `❌ 发现 ${errors.length} 个严重错误，备份可能不可用`;
    }
    
    return `⚠️ 发现 ${warnings.length} 个警告，备份基本可用但建议检查`;
  }

  // 工具方法
  log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }

  addError(message) {
    this.results.errors.push(message);
    this.results.valid = false;
    console.error(`❌ ${message}`);
  }

  addWarning(message) {
    this.results.warnings.push(message);
    console.warn(`⚠️ ${message}`);
  }
}

// 命令行参数解析
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
备份验证工具

用法: node scripts/backup-validator.mjs <command> [options]

命令:
  validate <backup-id>           验证指定备份
  compare <id1> <id2>           比较两个备份
  list                          列出所有备份
  help                          显示帮助

选项:
  --verbose                     详细输出
  --checksum ALGORITHM          校验算法 (默认: md5)

示例:
  node scripts/backup-validator.mjs validate 2024-11-06T10-30-15
  node scripts/backup-validator.mjs compare backup1 backup2 --verbose
  node scripts/backup-validator.mjs list
    `);
    process.exit(0);
  }

  const command = args[0];
  const options = { verbose: false, checksumAlgorithm: 'md5' };
  const params = [];

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--verbose':
        options.verbose = true;
        break;
      case '--checksum':
        options.checksumAlgorithm = args[++i];
        break;
      default:
        params.push(args[i]);
        break;
    }
  }

  return { command, params, options };
}

// 主函数
async function main() {
  try {
    const { command, params, options } = parseArgs();
    const validator = new BackupValidator(options);

    switch (command) {
      case 'validate':
        if (params.length === 0) {
          throw new Error('请提供备份ID');
        }
        await validator.validateBackup(params[0]);
        break;

      case 'compare':
        if (params.length < 2) {
          throw new Error('请提供两个备份ID进行比较');
        }
        await validator.compareBackups(params[0], params[1]);
        break;

      case 'list':
        const backupsDir = 'backups/frontend';
        if (existsSync(backupsDir)) {
          const backups = readdirSync(backupsDir)
            .filter(name => statSync(join(backupsDir, name)).isDirectory())
            .sort()
            .reverse();
          
          console.log('📁 可用备份:');
          for (const backup of backups) {
            const manifestPath = join(backupsDir, backup, 'enhanced-backup-manifest.json');
            let info = '';
            
            if (existsSync(manifestPath)) {
              try {
                const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
                const stats = manifest.stats;
                info = `(${stats.total_files} 文件, ${stats.backup_size_human})`;
              } catch (error) {
                info = '(信息读取失败)';
              }
            }
            
            console.log(`   ${backup} ${info}`);
          }
        } else {
          console.log('📁 备份目录不存在');
        }
        break;

      default:
        throw new Error(`未知命令: ${command}`);
    }

  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { BackupValidator };