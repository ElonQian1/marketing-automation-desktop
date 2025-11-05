#!/usr/bin/env node
// scripts/frontend-restore.mjs  
// 前端组件恢复脚本

import { execSync } from 'child_process';
import { readdirSync, statSync, copyFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const backupId = process.argv[2];

if (!backupId) {
  console.error('❌ 请提供备份ID');
  console.log('用法: npm run restore:frontend <backup-id>');
  console.log('可用备份: ');
  
  try {
    const backups = readdirSync('backups/frontend');
    backups.forEach(id => console.log(`  - ${id}`));
  } catch {
    console.log('  (无可用备份)');
  }
  process.exit(1);
}

const BACKUP_PATH = `backups/frontend/${backupId}`;

function validateBackup() {
  if (!existsSync(BACKUP_PATH)) {
    console.error(`❌ 备份不存在: ${BACKUP_PATH}`);
    process.exit(1);
  }
  
  const manifestPath = join(BACKUP_PATH, 'backup-manifest.json');
  if (!existsSync(manifestPath)) {
    console.error('❌ 备份清单缺失');
    process.exit(1);
  }
  
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  console.log(`📋 备份信息:`);
  console.log(`   时间: ${manifest.timestamp}`);
  console.log(`   Git提交: ${manifest.git_commit}`);
  console.log(`   文件数: ${manifest.stats.total_files}`);
  
  return manifest;
}

function restoreDirectory(backupDir, targetDir) {
  if (!existsSync(backupDir)) return 0;
  
  const items = readdirSync(backupDir);
  let restoredCount = 0;
  
  for (const item of items) {
    const backupPath = join(backupDir, item);
    const targetPath = join(targetDir, item);
    const stat = statSync(backupPath);
    
    if (stat.isDirectory()) {
      require('fs').mkdirSync(targetPath, { recursive: true });
      restoredCount += restoreDirectory(backupPath, targetPath);
    } else {
      require('fs').mkdirSync(require('path').dirname(targetPath), { recursive: true });
      copyFileSync(backupPath, targetPath);
      restoredCount++;
    }
  }
  
  return restoredCount;
}

function main() {
  console.log(`🔄 开始恢复前端备份: ${backupId}`);
  
  const manifest = validateBackup();
  
  // 创建当前状态备份
  const currentBackup = `backups/frontend/before-restore-${Date.now()}`;
  console.log(`💾 创建当前状态备份: ${currentBackup}`);
  execSync(`node scripts/frontend-backup.mjs`, { stdio: 'inherit' });
  
  let totalRestored = 0;
  
  // 恢复关键目录
  for (const dir of manifest.critical_dirs) {
    const backupDir = join(BACKUP_PATH, dir);
    if (existsSync(backupDir)) {
      console.log(`📁 恢复目录: ${dir}`);
      const count = restoreDirectory(backupDir, dir);
      totalRestored += count;
      console.log(`   ✅ 已恢复 ${count} 个文件`);
    }
  }
  
  // 恢复关键文件
  for (const file of manifest.critical_files) {
    const backupFile = join(BACKUP_PATH, file);
    if (existsSync(backupFile)) {
      require('fs').mkdirSync(require('path').dirname(file), { recursive: true });
      copyFileSync(backupFile, file);
      console.log(`✅ 已恢复: ${file}`);
      totalRestored++;
    }
  }
  
  console.log(`\n✅ 恢复完成! 共恢复 ${totalRestored} 个文件`);
  console.log('🔧 建议运行类型检查: npm run type-check');
}

main();