// src/modules/ai/services/ai-openai-provider.ts
// module: ai | layer: services | role: OpenAI Provider 实现
// summary: OpenAI API 的适配器实现，支持聊天、流式、嵌入向量

import OpenAI from 'openai';
import type {
  AIRequest,
  AIResponse,
  StreamEvent,
  IAIClient,
  AIProvider,
  ProviderConfig,
} from '../domain/ai-types';
import { withRetry } from './ai-retry';
import { getGlobalLogger } from './ai-logger';

/**
 * OpenAI Provider 实现
 */
export class OpenAIProvider implements IAIClient {
  private client: OpenAI;
  private provider: AIProvider = 'openai';
  private logger = getGlobalLogger();

  constructor(private config: ProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: config.timeout || 60000,
      maxRetries: 0, // 我们自己管理重试
    });
  }

  getProvider(): AIProvider {
    return this.provider;
  }

  /**
   * 聊天请求（非流式）
   */
  async chat<T = any>(request: AIRequest): Promise<AIResponse<T>> {
    const startTime = Date.now();
    const requestId = this.logger.logRequest(
      this.provider,
      request.model,
      'chat',
      { stream: false }
    );

    try {
      const result = await withRetry(
        () => this.executeChatRequest(request),
        this.config.retryConfig!,
        (attempt, error) => {
          this.logger.logRetry(
            this.provider,
            request.model,
            'chat',
            requestId,
            attempt,
            error
          );
        }
      );

      const duration = Date.now() - startTime;
      this.logger.logResponse(
        this.provider,
        request.model,
        'chat',
        requestId,
        duration,
        result.usage?.totalTokens
      );

      return result as AIResponse<T>;
    } catch (error) {
      this.logger.logError(
        this.provider,
        request.model,
        'chat',
        requestId,
        error as Error
      );
      throw error;
    }
  }

  /**
   * 执行聊天请求
   */
  private async executeChatRequest<T>(request: AIRequest): Promise<AIResponse<T>> {
    // 构建 tools 参数
    const tools = request.tools?.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));

    // 构建 response_format 参数（结构化输出）
    const response_format = request.responseSchema
      ? {
          type: 'json_schema' as const,
          json_schema: {
            name: request.responseSchema.name,
            schema: request.responseSchema.schema,
            strict: request.responseSchema.strict ?? true,
          },
        }
      : undefined;

    // 调用 OpenAI API
    const completion = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages as any,
      tools,
      response_format,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens,
      top_p: request.topP,
    });

    const choice = completion.choices[0];
    const message = choice.message;

    // 提取 tool calls
    const toolCalls = message.tool_calls?.map(call => {
      // Type guard for function tool calls
      if (call.type === 'function' && 'function' in call) {
        return {
          id: call.id,
          name: call.function.name,
          arguments: JSON.parse(call.function.arguments),
        };
      }
      return null;
    }).filter((call): call is NonNullable<typeof call> => call !== null);

    // 提取输出内容
    let output: any = message.content || '';
    if (request.responseSchema && typeof output === 'string') {
      try {
        output = JSON.parse(output);
      } catch {
        // 保持字符串格式
      }
    }

    return {
      raw: completion,
      output: output as T,
      toolCalls,
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
      },
      requestId: completion.id,
    };
  }

  /**
   * 流式聊天请求
   */
  async *chatStream(request: AIRequest): AsyncGenerator<StreamEvent, void, unknown> {
    const requestId = this.logger.logRequest(
      this.provider,
      request.model,
      'chat_stream',
      { stream: true }
    );

    try {
      // 构建 tools 参数
      const tools = request.tools?.map(tool => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));

      // 流式调用
      const stream = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages as any,
        tools,
        temperature: request.temperature ?? 0.2,
        max_tokens: request.maxTokens,
        stream: true,
      });

      let accumulatedContent = '';
      const accumulatedToolCalls: any[] = [];

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        if (!delta) continue;

        // 文本内容
        if (delta.content) {
          accumulatedContent += delta.content;
          yield {
            type: 'delta',
            delta: delta.content,
          };
        }

        // Tool calls
        if (delta.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            const index = toolCall.index;
            if (!accumulatedToolCalls[index]) {
              accumulatedToolCalls[index] = {
                id: toolCall.id || '',
                name: toolCall.function?.name || '',
                arguments: '',
              };
            }

            if (toolCall.function?.arguments) {
              accumulatedToolCalls[index].arguments += toolCall.function.arguments;
            }

            // 发送增量事件
            yield {
              type: 'tool_call',
              toolCall: {
                id: accumulatedToolCalls[index].id,
                name: accumulatedToolCalls[index].name,
                arguments: accumulatedToolCalls[index].arguments,
              },
            };
          }
        }
      }

      // 完成事件
      yield { type: 'done', done: true };

      this.logger.logResponse(
        this.provider,
        request.model,
        'chat_stream',
        requestId,
        0
      );
    } catch (error) {
      this.logger.logError(
        this.provider,
        request.model,
        'chat_stream',
        requestId,
        error as Error
      );
      yield {
        type: 'error',
        error: error as Error,
      };
    }
  }

  /**
   * 生成嵌入向量
   */
  async embed(texts: string[]): Promise<number[][]> {
    const model = this.config.embedModel || 'text-embedding-3-large';
    const requestId = this.logger.logRequest(
      this.provider,
      model,
      'embed',
      { textCount: texts.length }
    );

    try {
      const result = await withRetry(
        async () => {
          const response = await this.client.embeddings.create({
            model,
            input: texts,
          });
          return response.data.map(item => item.embedding);
        },
        this.config.retryConfig!,
        (attempt, error) => {
          this.logger.logRetry(
            this.provider,
            model,
            'embed',
            requestId,
            attempt,
            error
          );
        }
      );

      this.logger.logResponse(
        this.provider,
        model,
        'embed',
        requestId,
        0
      );

      return result;
    } catch (error) {
      this.logger.logError(
        this.provider,
        model,
        'embed',
        requestId,
        error as Error
      );
      throw error;
    }
  }
}
