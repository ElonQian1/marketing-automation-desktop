#!/usr/bin/env node
// scripts/frontend-backup.mjs
// 前端组件自动备份脚本

import { execSync } from 'child_process';
import { readdirSync, statSync, copyFileSync, mkdirSync } from 'fs';
import { join, dirname, basename, extname } from 'path';

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const BACKUP_ROOT = `backups/frontend/${TIMESTAMP}`;

// 需要备份的关键目录
const CRITICAL_DIRS = [
  'src/components',
  'src/modules',
  'src/pages', 
  'src/hooks',
  'src/services',
  'src/stores',
  'src/store'
];

// 需要备份的关键文件
const CRITICAL_FILES = [
  'src/App.tsx',
  'src/main.tsx',
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  'tailwind.config.js'
];

function createBackupStructure() {
  console.log(`🗂️ 创建备份目录: ${BACKUP_ROOT}`);
  mkdirSync(BACKUP_ROOT, { recursive: true });
}

function backupDirectory(srcDir, backupDir) {
  try {
    mkdirSync(backupDir, { recursive: true });
    
    const items = readdirSync(srcDir);
    let fileCount = 0;
    
    for (const item of items) {
      const srcPath = join(srcDir, item);
      const backupPath = join(backupDir, item);
      const stat = statSync(srcPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        fileCount += backupDirectory(srcPath, backupPath);
      } else if (stat.isFile() && /\.(tsx?|jsx?|css|scss|json)$/i.test(item)) {
        copyFileSync(srcPath, backupPath);
        fileCount++;
      }
    }
    
    return fileCount;
  } catch (error) {
    console.warn(`⚠️ 备份目录失败 ${srcDir}:`, error.message);
    return 0;
  }
}

function backupFile(filePath) {
  try {
    const backupPath = join(BACKUP_ROOT, filePath);
    mkdirSync(dirname(backupPath), { recursive: true });
    copyFileSync(filePath, backupPath);
    console.log(`✅ 已备份: ${filePath}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ 备份文件失败 ${filePath}:`, error.message);
    return false;
  }
}

function generateManifest(stats) {
  const manifest = {
    timestamp: new Date().toISOString(),
    backup_id: TIMESTAMP,
    stats: stats,
    git_commit: getGitCommit(),
    critical_files: CRITICAL_FILES,
    critical_dirs: CRITICAL_DIRS,
    restore_command: `npm run restore:frontend ${TIMESTAMP}`
  };
  
  const manifestPath = join(BACKUP_ROOT, 'backup-manifest.json');
  require('fs').writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`📋 备份清单已创建: ${manifestPath}`);
}

function getGitCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function main() {
  console.log('🚀 开始前端组件备份...');
  
  createBackupStructure();
  
  let totalFiles = 0;
  let totalDirs = 0;
  
  // 备份关键目录
  for (const dir of CRITICAL_DIRS) {
    if (require('fs').existsSync(dir)) {
      console.log(`📁 备份目录: ${dir}`);
      const backupDir = join(BACKUP_ROOT, dir);
      const fileCount = backupDirectory(dir, backupDir);
      totalFiles += fileCount;
      totalDirs++;
      console.log(`   ✅ 已备份 ${fileCount} 个文件`);
    }
  }
  
  // 备份关键文件
  let criticalFileCount = 0;
  for (const file of CRITICAL_FILES) {
    if (require('fs').existsSync(file)) {
      if (backupFile(file)) {
        criticalFileCount++;
      }
    }
  }
  
  const stats = {
    directories: totalDirs,
    total_files: totalFiles,
    critical_files: criticalFileCount,
    backup_size: getBacupSize()
  };
  
  generateManifest(stats);
  
  console.log('\n✅ 前端备份完成!');
  console.log(`📊 统计: ${stats.total_files} 文件, ${stats.directories} 目录`);
  console.log(`💾 备份位置: ${BACKUP_ROOT}`);
  console.log(`🆔 备份ID: ${TIMESTAMP}`);
}

function getBacupSize() {
  try {
    const result = execSync(`du -sh "${BACKUP_ROOT}"`, { encoding: 'utf8' });
    return result.split('\t')[0];
  } catch {
    return 'unknown';
  }
}

main();