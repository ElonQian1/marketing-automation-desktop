// src/modules/smart-script-management/services/script-file-service.ts
// module: smart-script-management | layer: services | role: service
// summary: 脚本文件导入导出服务

import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import type { DistributedScript } from '../../../domain/distributed-script';

/**
 * 脚本文件服务 - 负责分布式脚本的文件导入导出操作
 */
export class ScriptFileService {
  
  /**
   * 导出分布式脚本到文件
   */
  static async exportDistributedScript(
    script: DistributedScript,
    defaultFileName?: string
  ): Promise<string | null> {
    try {
      const fileName = defaultFileName || `${script.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_distributed.json`;
      
      // 使用 Tauri 的保存对话框
      const savePath = await save({
        defaultPath: fileName,
        filters: [
          {
            name: '分布式脚本文件',
            extensions: ['json']
          }
        ]
      });

      if (savePath) {
        // 使用 Tauri 命令保存文件
        await invoke('plugin:file_manager|write_text', {
          path: savePath,
          content: JSON.stringify(script, null, 2)
        });
        
        return savePath;
      }
      
      return null;
    } catch (error) {
      console.error('导出分布式脚本失败:', error);
      throw new Error(`导出失败: ${error}`);
    }
  }

  /**
   * 从文件导入分布式脚本
   */
  static async importDistributedScript(): Promise<DistributedScript | null> {
    try {
      // 使用 Tauri 的文件选择对话框
      const selectedPath = await open({
        multiple: false,
        filters: [
          {
            name: '分布式脚本文件',
            extensions: ['json']
          }
        ]
      });

      if (selectedPath && typeof selectedPath === 'string') {
        // 使用 Tauri 命令读取文件内容
        const content = await invoke('plugin:file_manager|read_text', {
          path: selectedPath
        }) as string;
        
        // 解析 JSON 内容
        const script = JSON.parse(content) as DistributedScript;
        
        // 基本验证
        if (!script.id || !script.name || !script.steps) {
          throw new Error('文件格式不正确，缺少必要字段');
        }
        
        return script;
      }
      
      return null;
    } catch (error) {
      console.error('导入分布式脚本失败:', error);
      throw new Error(`导入失败: ${error}`);
    }
  }

  /**
   * 验证分布式脚本文件格式
   */
  static validateDistributedScript(script: any): script is DistributedScript {
    return (
      script &&
      typeof script.id === 'string' &&
      typeof script.name === 'string' &&
      Array.isArray(script.steps) &&
      typeof script.version === 'string' &&
      typeof script.createdAt === 'number' &&
      typeof script.updatedAt === 'number'
    );
  }
}