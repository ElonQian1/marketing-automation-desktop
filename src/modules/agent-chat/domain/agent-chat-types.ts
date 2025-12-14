// src/modules/agent-chat/domain/agent-chat-types.ts
// module: agent-chat | layer: domain | role: 类型定义
// summary: AI Agent 对话相关的类型定义

/**
 * AI 提供商类型
 */
export type AgentProvider = 'openai' | 'hunyuan' | 'deepseek' | 'custom';

/**
 * 消息角色
 */
export type AgentMessageRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * 对话消息
 */
export interface AgentMessage {
  id: string;
  role: AgentMessageRole;
  content: string;
  timestamp: Date;
  toolCalls?: AgentToolCall[];
  toolCallId?: string;
  isStreaming?: boolean;
  error?: string;
}

/**
 * 工具调用
 */
export interface AgentToolCall {
  id: string;
  name: string;
  arguments: string;
  result?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

/**
 * 会话状态
 */
export type SessionStatus = 
  | 'idle' 
  | 'thinking' 
  | 'waiting_for_tools' 
  | 'paused' 
  | 'completed' 
  | 'error';

/**
 * Agent 会话
 */
export interface AgentSession {
  id: string;
  title: string;
  messages: AgentMessage[];
  status: SessionStatus;
  model: string;
  totalTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Agent 配置请求
 */
export interface AgentConfigRequest {
  provider: AgentProvider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

/**
 * Agent 响应
 */
export interface AgentResponse {
  success: boolean;
  message: string;
  sessionId?: string;
  error?: string;
}

/**
 * Token 使用统计
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * 对话响应
 */
export interface ChatResponse {
  success: boolean;
  reply: string;
  error?: string;
  /** Token 使用统计 */
  tokenUsage?: TokenUsage;
}

/**
 * 工具信息
 */
export interface ToolInfo {
  name: string;
  description: string;
}

/**
 * 快捷操作
 */
export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
  description: string;
}
