// src/modules/agent-chat/services/agent-chat-service.ts
// module: agent-chat | layer: services | role: API 调用服务
// summary: 封装与 Tauri Agent 插件的通信

import { invoke } from '@tauri-apps/api/core';
import type {
  AgentConfigRequest,
  AgentResponse,
  ChatResponse,
  ToolInfo,
  AgentSession,
} from '../domain/agent-chat-types';

/**
 * Agent Chat 服务
 * 
 * 封装所有与后端 AI Agent 插件的通信
 */
export const agentChatService = {
  /**
   * 配置 AI 提供商
   */
  async configure(request: AgentConfigRequest): Promise<AgentResponse> {
    try {
      const result = await invoke<AgentResponse>('plugin:agent|configure', {
        request: {
          provider: request.provider,
          api_key: request.apiKey,
          base_url: request.baseUrl,
          model: request.model,
        },
      });
      return result;
    } catch (error) {
      return {
        success: false,
        message: '配置失败',
        error: String(error),
      };
    }
  },

  /**
   * 发送消息
   */
  async chat(message: string): Promise<ChatResponse> {
    try {
      const result = await invoke<ChatResponse>('plugin:agent|chat', {
        message,
      });
      return result;
    } catch (error) {
      return {
        success: false,
        reply: '',
        error: String(error),
      };
    }
  },

  /**
   * 分析脚本
   */
  async analyzeScript(scriptId: string): Promise<ChatResponse> {
    try {
      const result = await invoke<ChatResponse>('plugin:agent|analyze_script', {
        scriptId,
      });
      return result;
    } catch (error) {
      return {
        success: false,
        reply: '',
        error: String(error),
      };
    }
  },

  /**
   * 修复脚本
   */
  async fixScript(scriptId: string, issue: string): Promise<ChatResponse> {
    try {
      const result = await invoke<ChatResponse>('plugin:agent|fix_script', {
        scriptId,
        issue,
      });
      return result;
    } catch (error) {
      return {
        success: false,
        reply: '',
        error: String(error),
      };
    }
  },

  /**
   * 执行自然语言任务
   */
  async executeTask(task: string): Promise<ChatResponse> {
    try {
      const result = await invoke<ChatResponse>('plugin:agent|execute_task', {
        task,
      });
      return result;
    } catch (error) {
      return {
        success: false,
        reply: '',
        error: String(error),
      };
    }
  },

  /**
   * 获取当前会话
   */
  async getSession(): Promise<AgentSession | null> {
    try {
      const result = await invoke<AgentSession | null>('plugin:agent|get_session');
      return result;
    } catch (error) {
      console.error('获取会话失败:', error);
      return null;
    }
  },

  /**
   * 清除会话
   */
  async clearSession(): Promise<AgentResponse> {
    try {
      const result = await invoke<AgentResponse>('plugin:agent|clear_session');
      return result;
    } catch (error) {
      return {
        success: false,
        message: '清除会话失败',
        error: String(error),
      };
    }
  },

  /**
   * 获取可用工具列表
   */
  async listTools(): Promise<ToolInfo[]> {
    try {
      const result = await invoke<ToolInfo[]>('plugin:agent|list_tools');
      return result;
    } catch (error) {
      console.error('获取工具列表失败:', error);
      return [];
    }
  },

  /**
   * 测试连接
   */
  async testConnection(): Promise<AgentResponse> {
    try {
      const result = await invoke<AgentResponse>('plugin:agent|test_connection');
      return result;
    } catch (error) {
      return {
        success: false,
        message: '连接测试失败',
        error: String(error),
      };
    }
  },
};
