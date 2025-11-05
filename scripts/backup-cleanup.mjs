#!/usr/bin/env node
// scripts/backup-cleanup.mjs  
// module: backup | layer: services | role: 备份清理和存储管理
// summary: 提供智能备份清理、存储优化和归档功能

import { execSync } from 'child_process';
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join, basename } from 'path';

class BackupCleanup {
  constructor(options = {}) {
    this.maxIncrementalBackups = options.maxIncremental || 24;
    this.maxFullBackups = options.maxFull || 7;
    this.maxTotalBackups = options.maxTotal || 30;
    this.maxAgeHours = options.maxAgeHours || 720; // 30天
    this.minFreeSpaceMB = options.minFreeSpace || 1000;
    this.dryRun = options.dryRun || false;
    this.archiveMode = options.archive || false;
    
    this.stats = {
      deletedBackups: 0,
      reclaimedSpaceMB: 0,
      archivedBackups: 0,
      errors: 0
    };
  }

  // 获取所有备份信息
  getAllBackups() {
    const backupsDir = 'backups/frontend';
    if (!existsSync(backupsDir)) {
      console.log('📁 备份目录不存在');
      return [];
    }

    const backups = [];
    const entries = readdirSync(backupsDir);

    for (const entry of entries) {
      const entryPath = join(backupsDir, entry);
      const stat = statSync(entryPath);

      if (!stat.isDirectory()) continue;

      // 跳过非时间戳格式的目录
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/.test(entry) && 
          !/^\d{8}_\d{6}$/.test(entry) &&
          !entry.startsWith('pre-restore-')) {
        continue;
      }

      try {
        const backupInfo = this.analyzeBackup(entryPath, entry);
        if (backupInfo) {
          backups.push(backupInfo);
        }
      } catch (error) {
        console.warn(`⚠️ 分析备份失败 ${entry}: ${error.message}`);
      }
    }

    // 按时间排序（最新的在前）
    backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return backups;
  }

  // 分析单个备份
  analyzeBackup(backupPath, backupId) {
    const info = {
      id: backupId,
      path: backupPath,
      type: 'unknown',
      size: 0,
      fileCount: 0,
      timestamp: null,
      isValid: false,
      canDelete: true,
      score: 0 // 重要性评分，越高越重要
    };

    try {
      // 解析时间戳
      info.timestamp = this.parseTimestamp(backupId);
      
      // 计算大小
      info.size = this.calculateDirectorySize(backupPath);
      
      // 计算文件数量
      info.fileCount = this.countFiles(backupPath);
      
      // 加载清单以确定类型
      const manifest = this.loadManifest(backupPath);
      if (manifest) {
        info.type = manifest.backup_info?.backup_type || 
                   (manifest.backup_type) || 
                   'full';
        info.isValid = true;
        
        // 计算重要性评分
        info.score = this.calculateImportanceScore(info, manifest);
      }
      
      // 特殊处理恢复前备份
      if (backupId.startsWith('pre-restore-')) {
        info.type = 'pre-restore';
        info.canDelete = true; // 恢复前备份可以删除
        info.score = 50; // 中等重要性
      }
      
    } catch (error) {
      console.warn(`⚠️ 备份分析出错 ${backupId}: ${error.message}`);
      info.canDelete = false; // 出错时不删除
    }

    return info;
  }

  // 解析时间戳
  parseTimestamp(backupId) {
    // ISO格式: 2024-11-06T10-30-15
    if (/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/.test(backupId)) {
      const dateStr = backupId.replace(/T(\d{2})-(\d{2})-(\d{2})$/, 'T$1:$2:$3');
      return new Date(dateStr);
    }
    
    // 数字格式: 20241106_103015
    if (/^\d{8}_\d{6}$/.test(backupId)) {
      const year = backupId.substr(0, 4);
      const month = backupId.substr(4, 2);
      const day = backupId.substr(6, 2);
      const hour = backupId.substr(9, 2);
      const minute = backupId.substr(11, 2);
      const second = backupId.substr(13, 2);
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    }
    
    // 恢复前备份: pre-restore-1699276800000
    if (backupId.startsWith('pre-restore-')) {
      const timestamp = parseInt(backupId.replace('pre-restore-', ''));
      return new Date(timestamp);
    }
    
    // 使用文件系统时间戳作为后备
    return new Date(0);
  }

  // 加载备份清单
  loadManifest(backupPath) {
    const manifestPaths = [
      join(backupPath, 'enhanced-backup-manifest.json'),
      join(backupPath, 'backup-manifest.json'),
      join(backupPath, 'pre-restore-manifest.json')
    ];

    for (const manifestPath of manifestPaths) {
      if (existsSync(manifestPath)) {
        try {
          return JSON.parse(readFileSync(manifestPath, 'utf8'));
        } catch (error) {
          console.warn(`⚠️ 清单解析失败 ${manifestPath}: ${error.message}`);
        }
      }
    }

    return null;
  }

  // 计算目录大小（MB）
  calculateDirectorySize(dirPath) {
    try {
      const result = execSync(`du -sm "${dirPath}"`, { encoding: 'utf8' });
      return parseInt(result.split('\t')[0]);
    } catch (error) {
      // Windows fallback
      try {
        let totalSize = 0;
        const calculateSize = (dir) => {
          const items = readdirSync(dir);
          for (const item of items) {
            const itemPath = join(dir, item);
            const stat = statSync(itemPath);
            if (stat.isDirectory()) {
              calculateSize(itemPath);
            } else {
              totalSize += stat.size;
            }
          }
        };
        calculateSize(dirPath);
        return Math.round(totalSize / (1024 * 1024)); // 转换为MB
      } catch (err) {
        return 0;
      }
    }
  }

  // 计算文件数量
  countFiles(dirPath) {
    try {
      let fileCount = 0;
      const countFilesRecursive = (dir) => {
        const items = readdirSync(dir);
        for (const item of items) {
          const itemPath = join(dir, item);
          const stat = statSync(itemPath);
          if (stat.isDirectory()) {
            countFilesRecursive(itemPath);
          } else {
            fileCount++;
          }
        }
      };
      countFilesRecursive(dirPath);
      return fileCount;
    } catch (error) {
      return 0;
    }
  }

  // 计算重要性评分
  calculateImportanceScore(info, manifest) {
    let score = 0;
    
    // 基础分数
    if (info.type === 'full') {
      score += 100; // 完整备份更重要
    } else if (info.type === 'incremental') {
      score += 50;
    }
    
    // 时间因子（越新越重要）
    const ageHours = (Date.now() - info.timestamp.getTime()) / (1000 * 60 * 60);
    if (ageHours < 24) {
      score += 50; // 24小时内
    } else if (ageHours < 168) {
      score += 30; // 一周内
    } else if (ageHours < 720) {
      score += 10; // 一月内
    }
    
    // 文件数量因子
    if (info.fileCount > 100) {
      score += 20;
    } else if (info.fileCount > 50) {
      score += 10;
    }
    
    // Git提交信息
    if (manifest.git_info?.status === 'clean') {
      score += 15; // 干净的工作区备份更重要
    }
    
    // 特殊标记
    if (manifest.backup_info?.duration_ms < 5000) {
      score -= 10; // 备份时间过短可能不完整
    }
    
    return score;
  }

  // 获取清理策略
  getCleanupStrategy(backups) {
    const strategy = {
      toDelete: [],
      toArchive: [],
      toKeep: [],
      reasons: []
    };

    // 按类型分组
    const fullBackups = backups.filter(b => b.type === 'full');
    const incrementalBackups = backups.filter(b => b.type === 'incremental');
    const preRestoreBackups = backups.filter(b => b.type === 'pre-restore');
    const otherBackups = backups.filter(b => !['full', 'incremental', 'pre-restore'].includes(b.type));

    // 清理策略1: 按数量限制
    this.applyCountLimits(fullBackups, this.maxFullBackups, strategy, '完整备份数量超限');
    this.applyCountLimits(incrementalBackups, this.maxIncrementalBackups, strategy, '增量备份数量超限');
    
    // 清理策略2: 按总数量限制
    const totalBackups = [...fullBackups, ...incrementalBackups].sort((a, b) => b.score - a.score);
    if (totalBackups.length > this.maxTotalBackups) {
      const excessBackups = totalBackups.slice(this.maxTotalBackups);
      for (const backup of excessBackups) {
        if (backup.canDelete && !strategy.toDelete.includes(backup)) {
          strategy.toDelete.push(backup);
          strategy.reasons.push(`${backup.id}: 总备份数量超限`);
        }
      }
    }

    // 清理策略3: 按时间清理
    const maxAgeMs = this.maxAgeHours * 60 * 60 * 1000;
    const cutoffTime = Date.now() - maxAgeMs;
    
    for (const backup of backups) {
      if (backup.timestamp.getTime() < cutoffTime && backup.canDelete) {
        if (!strategy.toDelete.includes(backup)) {
          strategy.toDelete.push(backup);
          strategy.reasons.push(`${backup.id}: 超过最大保存时间 (${this.maxAgeHours}小时)`);
        }
      }
    }

    // 清理策略4: 清理恢复前备份（保留最近3个）
    if (preRestoreBackups.length > 3) {
      const oldPreRestoreBackups = preRestoreBackups.slice(3);
      for (const backup of oldPreRestoreBackups) {
        strategy.toDelete.push(backup);
        strategy.reasons.push(`${backup.id}: 旧的恢复前备份`);
      }
    }

    // 清理策略5: 清理无效备份
    for (const backup of backups) {
      if (!backup.isValid && backup.canDelete) {
        strategy.toDelete.push(backup);
        strategy.reasons.push(`${backup.id}: 无效备份`);
      }
    }

    // 归档策略（如果启用）
    if (this.archiveMode) {
      const archiveCandidates = backups.filter(b => 
        b.type === 'full' && 
        b.score < 80 && 
        !strategy.toDelete.includes(b)
      );
      
      strategy.toArchive = archiveCandidates.slice(0, 5); // 最多归档5个
    }

    return strategy;
  }

  // 应用数量限制
  applyCountLimits(backups, maxCount, strategy, reason) {
    if (backups.length > maxCount) {
      // 按重要性排序，删除不重要的
      const sortedBackups = backups.sort((a, b) => b.score - a.score);
      const excessBackups = sortedBackups.slice(maxCount);
      
      for (const backup of excessBackups) {
        if (backup.canDelete) {
          strategy.toDelete.push(backup);
          strategy.reasons.push(`${backup.id}: ${reason}`);
        }
      }
    }
  }

  // 执行清理
  async executeCleanup(strategy) {
    console.log(`🗑️ 开始清理 ${strategy.toDelete.length} 个备份...`);
    
    if (this.dryRun) {
      console.log('🔍 预览模式 - 不会实际删除文件');
    }

    for (const backup of strategy.toDelete) {
      try {
        const sizeMB = backup.size;
        
        if (this.dryRun) {
          console.log(`[DRY RUN] 将删除: ${backup.id} (${sizeMB}MB)`);
        } else {
          // 实际删除
          execSync(`rm -rf "${backup.path}"`, { stdio: 'ignore' });
          console.log(`🗑️ 已删除: ${backup.id} (回收 ${sizeMB}MB)`);
        }
        
        this.stats.deletedBackups++;
        this.stats.reclaimedSpaceMB += sizeMB;
        
      } catch (error) {
        console.error(`❌ 删除失败 ${backup.id}: ${error.message}`);
        this.stats.errors++;
      }
    }

    // 执行归档
    if (strategy.toArchive.length > 0) {
      console.log(`📦 开始归档 ${strategy.toArchive.length} 个备份...`);
      
      for (const backup of strategy.toArchive) {
        try {
          await this.archiveBackup(backup);
          this.stats.archivedBackups++;
        } catch (error) {
          console.error(`❌ 归档失败 ${backup.id}: ${error.message}`);
          this.stats.errors++;
        }
      }
    }
  }

  // 归档备份
  async archiveBackup(backup) {
    const archiveDir = 'backups/archived';
    const archivePath = join(archiveDir, `${backup.id}.tar.gz`);
    
    if (!existsSync(archiveDir)) {
      require('fs').mkdirSync(archiveDir, { recursive: true });
    }
    
    if (this.dryRun) {
      console.log(`[DRY RUN] 将归档: ${backup.id} -> ${archivePath}`);
      return;
    }
    
    // 创建压缩档案
    execSync(`tar -czf "${archivePath}" -C "${backup.path}" .`);
    
    // 删除原始目录
    execSync(`rm -rf "${backup.path}"`);
    
    console.log(`📦 已归档: ${backup.id} -> ${basename(archivePath)}`);
  }

  // 生成清理报告
  generateCleanupReport(strategy, backups) {
    const report = {
      cleanup_info: {
        timestamp: new Date().toISOString(),
        dry_run: this.dryRun,
        settings: {
          max_incremental: this.maxIncrementalBackups,
          max_full: this.maxFullBackups,
          max_total: this.maxTotalBackups,
          max_age_hours: this.maxAgeHours
        }
      },
      before: {
        total_backups: backups.length,
        total_size_mb: backups.reduce((sum, b) => sum + b.size, 0),
        full_backups: backups.filter(b => b.type === 'full').length,
        incremental_backups: backups.filter(b => b.type === 'incremental').length
      },
      actions: {
        to_delete: strategy.toDelete.map(b => ({
          id: b.id,
          type: b.type,
          size_mb: b.size,
          age_hours: Math.round((Date.now() - b.timestamp.getTime()) / (1000 * 60 * 60))
        })),
        to_archive: strategy.toArchive.map(b => ({
          id: b.id,
          type: b.type,
          size_mb: b.size
        })),
        reasons: strategy.reasons
      },
      stats: this.stats,
      recommendations: this.generateRecommendations(backups, strategy)
    };

    const reportPath = `cleanup-report-${Date.now()}.json`;
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 清理报告已生成: ${reportPath}`);
    return report;
  }

  // 生成建议
  generateRecommendations(backups, strategy) {
    const recommendations = [];
    
    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
    if (totalSize > 5000) { // 5GB
      recommendations.push('备份占用空间较大，考虑启用归档模式');
    }
    
    const fullBackups = backups.filter(b => b.type === 'full');
    const incrementalBackups = backups.filter(b => b.type === 'incremental');
    
    if (fullBackups.length < 2) {
      recommendations.push('完整备份数量过少，建议定期创建完整备份');
    }
    
    if (incrementalBackups.length > fullBackups.length * 10) {
      recommendations.push('增量备份过多，建议增加完整备份频率');
    }
    
    if (strategy.toDelete.length === 0 && backups.length > 20) {
      recommendations.push('备份数量较多但无可清理项，考虑调整清理策略');
    }
    
    return recommendations;
  }

  // 主执行方法
  async execute() {
    console.log('🧹 开始智能备份清理...');
    console.log(`⚙️ 设置: 最大增量=${this.maxIncrementalBackups}, 最大完整=${this.maxFullBackups}, 最大总数=${this.maxTotalBackups}`);
    console.log(`⏰ 最大保留时间: ${this.maxAgeHours} 小时`);
    
    if (this.dryRun) {
      console.log('🔍 预览模式已启用');
    }

    // 1. 获取所有备份
    const backups = this.getAllBackups();
    console.log(`📁 发现 ${backups.length} 个备份`);

    if (backups.length === 0) {
      console.log('✅ 无需清理');
      return;
    }

    // 2. 制定清理策略
    const strategy = this.getCleanupStrategy(backups);
    
    console.log(`📊 清理计划:`);
    console.log(`   删除: ${strategy.toDelete.length} 个备份`);
    console.log(`   归档: ${strategy.toArchive.length} 个备份`);
    console.log(`   保留: ${backups.length - strategy.toDelete.length - strategy.toArchive.length} 个备份`);

    if (strategy.toDelete.length === 0 && strategy.toArchive.length === 0) {
      console.log('✅ 无需清理');
      return;
    }

    // 3. 执行清理
    await this.executeCleanup(strategy);

    // 4. 生成报告
    const report = this.generateCleanupReport(strategy, backups);

    // 5. 输出结果
    console.log('\n✅ 清理完成!');
    console.log(`🗑️ 删除备份: ${this.stats.deletedBackups} 个`);
    console.log(`📦 归档备份: ${this.stats.archivedBackups} 个`);
    console.log(`💾 回收空间: ${this.stats.reclaimedSpaceMB} MB`);
    console.log(`❌ 错误数量: ${this.stats.errors} 个`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 建议:');
      report.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }
  }
}

// 命令行参数解析
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
备份清理工具

用法: node scripts/backup-cleanup.mjs [options]

选项:
  --max-incremental N   最大增量备份数 (默认: 24)
  --max-full N          最大完整备份数 (默认: 7)
  --max-total N         最大总备份数 (默认: 30)
  --max-age-hours N     最大保留时间(小时) (默认: 720)
  --min-free-space N    最小剩余空间(MB) (默认: 1000)
  --dry-run             预览模式，不实际删除
  --archive             启用归档模式
  --help, -h            显示帮助

示例:
  node scripts/backup-cleanup.mjs --dry-run
  node scripts/backup-cleanup.mjs --max-incremental 12 --max-full 5
  node scripts/backup-cleanup.mjs --archive --max-age-hours 168
    `);
    process.exit(0);
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--max-incremental':
        options.maxIncremental = parseInt(args[++i]);
        break;
      case '--max-full':
        options.maxFull = parseInt(args[++i]);
        break;
      case '--max-total':
        options.maxTotal = parseInt(args[++i]);
        break;
      case '--max-age-hours':
        options.maxAgeHours = parseInt(args[++i]);
        break;
      case '--min-free-space':
        options.minFreeSpace = parseInt(args[++i]);
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--archive':
        options.archive = true;
        break;
    }
  }

  return options;
}

// 主函数
async function main() {
  try {
    const options = parseArgs();
    const cleanup = new BackupCleanup(options);
    await cleanup.execute();
  } catch (error) {
    console.error('❌ 清理失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { BackupCleanup };