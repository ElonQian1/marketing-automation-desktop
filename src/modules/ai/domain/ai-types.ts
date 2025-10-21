// src/modules/ai/domain/ai-types.ts
// module: ai | layer: domain | role: 核心类型定义
// summary: AI 模块的核心类型、接口和枚举定义

/**
 * AI 提供商类型
 */
export type AIProvider = 'openai' | 'hunyuan';

/**
 * 支持的 AI 模型
 */
export type AIModel = string;

/**
 * 消息角色类型
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * AI 消息
 */
export interface AIMessage {
  role: MessageRole;
  content: string;
  name?: string;
  tool_call_id?: string;
}

/**
 * 工具函数规范
 */
export interface ToolSpec {
  name: string;
  description?: string;
  parameters: Record<string, any>; // JSON Schema
}

/**
 * 工具调用结果
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: any;
}

/**
 * 响应格式配置
 */
export interface ResponseFormat {
  name: string;
  schema: Record<string, any>;
  strict?: boolean;
}

/**
 * 流式事件类型
 */
export type StreamEventType = 
  | 'delta'
  | 'tool_call'
  | 'done'
  | 'error';

/**
 * 流式事件
 */
export interface StreamEvent {
  type: StreamEventType;
  delta?: string;
  toolCall?: ToolCall;
  done?: boolean;
  error?: Error;
}

/**
 * AI 请求配置
 */
export interface AIRequest {
  model: AIModel;
  messages: AIMessage[];
  tools?: ToolSpec[];
  responseSchema?: ResponseFormat;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  timeoutMs?: number;
}

/**
 * AI 响应
 */
export interface AIResponse<T = any> {
  raw?: any;
  output?: T;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  requestId?: string;
}

/**
 * AI 错误类型
 */
export enum AIErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  INVALID_REQUEST = 'INVALID_REQUEST',
  AUTHENTICATION = 'AUTHENTICATION',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * AI 错误
 */
export class AIError extends Error {
  constructor(
    public type: AIErrorType,
    message: string,
    public statusCode?: number,
    public retryable: boolean = false,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AIError';
  }
}

/**
 * 重试配置
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * AI 提供商配置
 */
export interface ProviderConfig {
  apiKey: string;
  baseURL: string;
  defaultModel: string;
  embedModel?: string;
  timeout?: number;
  retryConfig?: RetryConfig;
}

/**
 * AI 客户端接口（统一抽象）
 */
export interface IAIClient {
  /**
   * 发送聊天请求
   */
  chat<T = any>(request: AIRequest): Promise<AIResponse<T>>;

  /**
   * 发送流式聊天请求
   */
  chatStream(request: AIRequest): AsyncGenerator<StreamEvent, void, unknown>;

  /**
   * 生成嵌入向量
   */
  embed(texts: string[]): Promise<number[][]>;

  /**
   * 获取提供商名称
   */
  getProvider(): AIProvider;
}
