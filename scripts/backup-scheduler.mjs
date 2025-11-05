#!/usr/bin/env node
// scripts/backup-scheduler.mjs
// module: backup | layer: services | role: 前端备份调度器
// summary: 提供自动化、定时和智能备份调度功能

import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';
import { EnhancedFrontendBackup } from './enhanced-frontend-backup.mjs';

class BackupScheduler {
  constructor(options = {}) {
    this.configFile = options.configFile || 'backup-scheduler-config.json';
    this.logFile = options.logFile || 'logs/backup-scheduler.log';
    this.pidFile = options.pidFile || 'backup-scheduler.pid';
    
    this.config = this.loadConfig();
    this.isRunning = false;
    this.currentBackupProcess = null;
    
    // 确保日志目录存在
    mkdirSync('logs', { recursive: true });
  }

  // 加载配置
  loadConfig() {
    const defaultConfig = {
      schedules: [
        {
          name: 'hourly-incremental',
          type: 'incremental',
          interval: 3600000, // 1小时
          enabled: true,
          conditions: {
            minFileChanges: 3,
            excludeHours: [0, 1, 2, 3, 4, 5] // 凌晨不备份
          }
        },
        {
          name: 'daily-full',
          type: 'full',
          interval: 86400000, // 24小时
          enabled: true,
          conditions: {
            hour: 9, // 每天上午9点
            minFileChanges: 0
          }
        },
        {
          name: 'git-hook',
          type: 'incremental',
          trigger: 'git-pre-commit',
          enabled: true,
          conditions: {
            minFileChanges: 1
          }
        }
      ],
      retention: {
        maxIncrementalBackups: 24,
        maxFullBackups: 7,
        maxTotalBackups: 30
      },
      monitoring: {
        webhookUrl: null,
        emailNotification: false,
        slackChannel: null
      }
    };

    if (existsSync(this.configFile)) {
      try {
        const config = JSON.parse(readFileSync(this.configFile, 'utf8'));
        return { ...defaultConfig, ...config };
      } catch (error) {
        this.log('warn', `配置文件加载失败，使用默认配置: ${error.message}`);
        return defaultConfig;
      }
    } else {
      // 创建默认配置文件
      writeFileSync(this.configFile, JSON.stringify(defaultConfig, null, 2));
      this.log('info', `已创建默认配置文件: ${this.configFile}`);
      return defaultConfig;
    }
  }

  // 保存配置
  saveConfig() {
    writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
  }

  // 日志记录
  log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    console.log(logEntry.trim());
    
    try {
      const fs = require('fs');
      fs.appendFileSync(this.logFile, logEntry);
    } catch (error) {
      console.warn(`日志写入失败: ${error.message}`);
    }
  }

  // 检查是否满足备份条件
  async checkBackupConditions(schedule) {
    const conditions = schedule.conditions || {};
    
    // 检查时间条件
    const now = new Date();
    const hour = now.getHours();
    
    if (conditions.excludeHours && conditions.excludeHours.includes(hour)) {
      this.log('debug', `跳过备份 ${schedule.name}: 当前时间在排除范围内`);
      return false;
    }
    
    if (conditions.hour !== undefined && conditions.hour !== hour) {
      this.log('debug', `跳过备份 ${schedule.name}: 不在指定时间`);
      return false;
    }
    
    // 检查文件变更数量
    if (conditions.minFileChanges > 0) {
      const changeCount = await this.getFileChangeCount();
      if (changeCount < conditions.minFileChanges) {
        this.log('debug', `跳过备份 ${schedule.name}: 文件变更数量不足 (${changeCount} < ${conditions.minFileChanges})`);
        return false;
      }
    }
    
    // 检查Git状态
    if (schedule.trigger === 'git-pre-commit') {
      const hasChanges = await this.hasGitChanges();
      if (!hasChanges) {
        this.log('debug', `跳过备份 ${schedule.name}: 无Git变更`);
        return false;
      }
    }
    
    return true;
  }

  // 获取文件变更数量
  async getFileChangeCount() {
    try {
      const result = execSync('git status --porcelain', { encoding: 'utf8' });
      return result.split('\n').filter(line => line.trim()).length;
    } catch (error) {
      this.log('warn', `获取Git状态失败: ${error.message}`);
      return 0;
    }
  }

  // 检查是否有Git变更
  async hasGitChanges() {
    try {
      const result = execSync('git status --porcelain', { encoding: 'utf8' });
      return result.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  // 执行备份
  async executeBackup(schedule) {
    const backupType = schedule.type || 'incremental';
    this.log('info', `开始执行备份: ${schedule.name} (类型: ${backupType})`);
    
    const startTime = Date.now();
    
    try {
      const options = {
        incremental: backupType === 'incremental',
        maxBackups: this.config.retention.maxTotalBackups
      };
      
      const backup = new EnhancedFrontendBackup(options);
      await backup.execute();
      
      const duration = Date.now() - startTime;
      this.log('info', `备份完成: ${schedule.name}, 用时: ${duration}ms`);
      
      // 发送通知
      await this.sendNotification('success', {
        schedule: schedule.name,
        type: backupType,
        duration,
        files: backup.stats.totalFiles,
        size: backup.stats.backupSize
      });
      
      // 更新最后备份时间
      this.updateLastBackupTime(schedule.name);
      
      return true;
      
    } catch (error) {
      this.log('error', `备份失败: ${schedule.name}: ${error.message}`);
      
      await this.sendNotification('error', {
        schedule: schedule.name,
        error: error.message
      });
      
      return false;
    }
  }

  // 更新最后备份时间
  updateLastBackupTime(scheduleName) {
    const statusFile = 'backup-scheduler-status.json';
    let status = {};
    
    if (existsSync(statusFile)) {
      try {
        status = JSON.parse(readFileSync(statusFile, 'utf8'));
      } catch (error) {
        this.log('warn', `状态文件读取失败: ${error.message}`);
      }
    }
    
    status[scheduleName] = {
      lastBackup: new Date().toISOString(),
      lastSuccess: new Date().toISOString()
    };
    
    writeFileSync(statusFile, JSON.stringify(status, null, 2));
  }

  // 获取最后备份时间
  getLastBackupTime(scheduleName) {
    const statusFile = 'backup-scheduler-status.json';
    if (!existsSync(statusFile)) return null;
    
    try {
      const status = JSON.parse(readFileSync(statusFile, 'utf8'));
      return status[scheduleName]?.lastBackup ? new Date(status[scheduleName].lastBackup) : null;
    } catch (error) {
      return null;
    }
  }

  // 检查是否需要执行备份
  shouldExecuteSchedule(schedule) {
    if (!schedule.enabled) return false;
    
    const lastBackup = this.getLastBackupTime(schedule.name);
    const now = Date.now();
    
    // 如果是基于时间间隔的调度
    if (schedule.interval) {
      if (!lastBackup) return true; // 从未备份过
      
      const timeSinceLastBackup = now - lastBackup.getTime();
      return timeSinceLastBackup >= schedule.interval;
    }
    
    // 如果是基于触发器的调度（如Git钩子）
    if (schedule.trigger) {
      return true; // 触发器调度总是检查条件
    }
    
    return false;
  }

  // 清理旧备份
  async cleanupOldBackups() {
    this.log('info', '开始清理旧备份...');
    
    try {
      const { maxIncrementalBackups, maxFullBackups, maxTotalBackups } = this.config.retention;
      
      // 执行清理逻辑
      const result = execSync(
        `node scripts/backup-cleanup.mjs --max-incremental ${maxIncrementalBackups} --max-full ${maxFullBackups} --max-total ${maxTotalBackups}`,
        { encoding: 'utf8' }
      );
      
      this.log('info', '备份清理完成');
      
    } catch (error) {
      this.log('warn', `备份清理失败: ${error.message}`);
    }
  }

  // 发送通知
  async sendNotification(type, data) {
    const monitoring = this.config.monitoring;
    
    // Webhook通知
    if (monitoring.webhookUrl) {
      try {
        const payload = {
          type,
          timestamp: new Date().toISOString(),
          data
        };
        
        const response = await fetch(monitoring.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          this.log('warn', `Webhook通知失败: ${response.statusText}`);
        }
        
      } catch (error) {
        this.log('warn', `Webhook通知失败: ${error.message}`);
      }
    }
    
    // 其他通知方式可以在这里扩展
  }

  // 启动调度器
  async start() {
    if (this.isRunning) {
      this.log('warn', '调度器已在运行');
      return;
    }
    
    this.isRunning = true;
    this.log('info', '备份调度器启动');
    
    // 写入PID文件
    writeFileSync(this.pidFile, process.pid.toString());
    
    // 主循环
    while (this.isRunning) {
      try {
        await this.runScheduleCheck();
        
        // 等待1分钟再进行下一次检查
        await this.sleep(60000);
        
      } catch (error) {
        this.log('error', `调度器运行错误: ${error.message}`);
        await this.sleep(60000); // 出错时也要等待
      }
    }
    
    // 清理PID文件
    if (existsSync(this.pidFile)) {
      require('fs').unlinkSync(this.pidFile);
    }
    
    this.log('info', '备份调度器已停止');
  }

  // 执行调度检查
  async runScheduleCheck() {
    for (const schedule of this.config.schedules) {
      if (this.shouldExecuteSchedule(schedule)) {
        const conditionsMet = await this.checkBackupConditions(schedule);
        
        if (conditionsMet) {
          await this.executeBackup(schedule);
        }
      }
    }
    
    // 定期清理旧备份（每6小时一次）
    const lastCleanup = this.getLastBackupTime('cleanup') || new Date(0);
    const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);
    
    if (lastCleanup.getTime() < sixHoursAgo) {
      await this.cleanupOldBackups();
      this.updateLastBackupTime('cleanup');
    }
  }

  // 停止调度器
  stop() {
    this.log('info', '正在停止备份调度器...');
    this.isRunning = false;
    
    if (this.currentBackupProcess) {
      this.currentBackupProcess.kill('SIGTERM');
    }
  }

  // 获取状态
  getStatus() {
    const statusFile = 'backup-scheduler-status.json';
    let status = {};
    
    if (existsSync(statusFile)) {
      try {
        status = JSON.parse(readFileSync(statusFile, 'utf8'));
      } catch (error) {
        // 忽略错误
      }
    }
    
    return {
      running: this.isRunning,
      config: this.config,
      lastBackups: status,
      logFile: this.logFile,
      pidFile: this.pidFile
    };
  }

  // 工具方法
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 命令行参数解析
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const options = {};

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--config':
        options.configFile = args[++i];
        break;
      case '--daemon':
        options.daemon = true;
        break;
      case '--log':
        options.logFile = args[++i];
        break;
    }
  }

  return { command, options };
}

// 主函数
async function main() {
  const { command, options } = parseArgs();
  const scheduler = new BackupScheduler(options);
  
  switch (command) {
    case 'start':
      if (options.daemon) {
        // 守护进程模式
        console.log('以守护进程模式启动备份调度器...');
        const child = spawn(process.argv[0], [process.argv[1], 'run'], {
          detached: true,
          stdio: 'ignore'
        });
        child.unref();
        console.log(`备份调度器已启动，PID: ${child.pid}`);
      } else {
        await scheduler.start();
      }
      break;
      
    case 'run':
      // 实际运行调度器
      await scheduler.start();
      break;
      
    case 'stop':
      const pidFile = options.pidFile || 'backup-scheduler.pid';
      if (existsSync(pidFile)) {
        const pid = parseInt(readFileSync(pidFile, 'utf8'));
        try {
          process.kill(pid, 'SIGTERM');
          console.log(`已发送停止信号到进程 ${pid}`);
        } catch (error) {
          console.error(`停止进程失败: ${error.message}`);
        }
      } else {
        console.log('未找到运行中的调度器');
      }
      break;
      
    case 'status':
      const status = scheduler.getStatus();
      console.log('备份调度器状态:');
      console.log(JSON.stringify(status, null, 2));
      break;
      
    case 'test':
      console.log('测试备份调度器...');
      const testSchedule = {
        name: 'test-backup',
        type: 'incremental',
        enabled: true,
        conditions: { minFileChanges: 0 }
      };
      
      const success = await scheduler.executeBackup(testSchedule);
      console.log(success ? '✅ 测试备份成功' : '❌ 测试备份失败');
      break;
      
    case 'config':
      console.log('当前配置:');
      console.log(JSON.stringify(scheduler.config, null, 2));
      break;
      
    case 'help':
    default:
      console.log(`
备份调度器

用法: node scripts/backup-scheduler.mjs <command> [options]

命令:
  start                启动调度器
  stop                 停止调度器
  status               查看状态
  test                 测试备份
  config               显示配置
  help                 显示帮助

选项:
  --daemon             以守护进程模式启动
  --config FILE        指定配置文件
  --log FILE           指定日志文件

示例:
  node scripts/backup-scheduler.mjs start --daemon
  node scripts/backup-scheduler.mjs status
  node scripts/backup-scheduler.mjs test
      `);
      break;
  }
}

// 处理优雅退出
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在停止...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在停止...');
  process.exit(0);
});

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('调度器错误:', error.message);
    process.exit(1);
  });
}

export { BackupScheduler };