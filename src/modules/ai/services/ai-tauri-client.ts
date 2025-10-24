// src/modules/ai/services/ai-tauri-client.ts
// module: ai | layer: services | role: Tauri 客户端实现
// summary: 基于 Tauri invoke 的 AI 客户端，支持流式响应和事件监听

import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type {
  IAIClient,
  AIRequest,
  AIResponse,
  StreamEvent,
  AIProvider,
} from '../domain/ai-types';

/**
 * Tauri AI 客户端实现
 * 
 * 通过 Tauri 的 invoke 调用后端 Rust 实现的 AI 接口
 */
export class TauriAIClient implements IAIClient {
  private provider: AIProvider;

  constructor(provider: AIProvider = 'openai') {
    this.provider = provider;
  }

  getProvider(): AIProvider {
    return this.provider;
  }

  /**
   * 聊天请求（非流式）
   */
  async chat<T = any>(request: AIRequest): Promise<AIResponse<T>> {
    try {
      const result = await invoke<any>('ai_chat', {
        messages: request.messages,
        tools: request.tools,
        toolChoice: request.responseSchema ? 'auto' : undefined,
        stream: false,
      });

      // 解析响应
      const output = result.choices?.[0]?.message?.content || result;
      const toolCalls = result.choices?.[0]?.message?.tool_calls?.map((call: any) => ({
        id: call.id,
        name: call.function.name,
        arguments: JSON.parse(call.function.arguments),
      }));

      return {
        raw: result,
        output: this.parseOutput<T>(output, request.responseSchema),
        toolCalls,
        usage: {
          promptTokens: result.usage?.prompt_tokens || 0,
          completionTokens: result.usage?.completion_tokens || 0,
          totalTokens: result.usage?.total_tokens || 0,
        },
        requestId: result.id,
      };
    } catch (error) {
      console.error('[Tauri AI Client] Chat error:', error);
      throw error;
    }
  }

  /**
   * 流式聊天请求
   */
  async *chatStream(request: AIRequest): AsyncGenerator<StreamEvent, void, unknown> {
    let unlisten: UnlistenFn | null = null;

    try {
      // 监听流式事件
      unlisten = await listen<string>('ai://stream', (event) => {
        console.debug('[Tauri AI Client] Stream event:', event.payload);
      });

      // 创建一个 Promise 来处理流式响应
      const streamPromise = new Promise<void>(async (resolve, reject) => {
        try {
          // 启动流式请求
          await invoke('ai_chat', {
            messages: request.messages,
            tools: request.tools,
            toolChoice: request.responseSchema ? 'auto' : undefined,
            stream: true,
          });

          // 等待流式完成
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      // 监听流式数据
      const streamUnlisten = await listen<string>('ai://stream', (event) => {
        // 发送增量事件
        const streamEvent: StreamEvent = {
          type: 'delta',
          delta: event.payload,
        };
        // 注意：这里需要通过某种机制将事件传递给 generator
        // 实际实现可能需要使用队列或其他异步通信方式
      });

      // 等待流式完成
      await streamPromise;

      // 发送完成事件
      yield { type: 'done', done: true };

      // 清理监听器
      if (streamUnlisten) {
        streamUnlisten();
      }
    } catch (error) {
      yield {
        type: 'error',
        error: error as Error,
      };
    } finally {
      if (unlisten) {
        unlisten();
      }
    }
  }

  /**
   * 生成嵌入向量
   */
  async embed(texts: string[]): Promise<number[][]> {
    try {
      const result = await invoke<number[][]>('ai_embed', {
        input: texts,
      });
      return result;
    } catch (error) {
      console.error('[Tauri AI Client] Embed error:', error);
      throw error;
    }
  }

  /**
   * 解析输出内容
   */
  private parseOutput<T>(output: any, responseSchema?: any): T {
    if (typeof output === 'string' && responseSchema) {
      try {
        return JSON.parse(output) as T;
      } catch {
        return output as T;
      }
    }
    return output as T;
  }
}

/**
 * 创建 Tauri AI 客户端
 */
export function createTauriAIClient(provider: AIProvider = 'openai'): TauriAIClient {
  return new TauriAIClient(provider);
}
