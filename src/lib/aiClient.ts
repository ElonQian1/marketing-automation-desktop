// src/lib/aiClient.ts
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export type ToolSpec = {
  name: string;
  description?: string;
  parameters: any;
};

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ToolChoice =
  | 'auto'
  | 'none'
  | { type: 'function'; function: { name: string } };

/**
 * 调用 AI 聊天接口
 */
export async function aiChat(payload: {
  messages: ChatMessage[];
  tools?: ToolSpec[];
  toolChoice?: ToolChoice;
  stream?: boolean;
}): Promise<any> {
  if (payload.stream) {
    const unlisten = await listen<string>('ai://stream', (e) => {
      // 在这里处理流式输出
      console.debug('[ai stream]', e.payload);
    });
    
    try {
      const res = await invoke('ai_chat', payload);
      return res;
    } finally {
      unlisten();
    }
  } else {
    return invoke('ai_chat', payload);
  }
}

/**
 * 调用 AI 嵌入向量接口
 */
export async function aiEmbed(input: string[]): Promise<number[][]> {
  return invoke<number[][]>('ai_embed', { input });
}

/**
 * 获取 AI 设置
 */
export async function getAISettings() {
  return invoke('get_ai_settings');
}

/**
 * 保存 AI 设置
 */
export async function saveAISettings(
  settings: any,
  openaiKey?: string,
  hunyuanKey?: string
) {
  return invoke('save_ai_settings', {
    settings,
    openaiKey: openaiKey || null,
    hunyuanKey: hunyuanKey || null,
  });
}

/**
 * 获取模型列表
 */
export async function listModels(): Promise<string[]> {
  return invoke<string[]>('list_models');
}
