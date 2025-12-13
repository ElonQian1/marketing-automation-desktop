// src/modules/agent-chat/index.ts
// module: agent-chat | layer: module-root | role: 统一导出
// summary: AI Agent 对话模块的公开 API

// === Domain Types ===
export type {
  AgentProvider,
  AgentMessage,
  AgentMessageRole,
  AgentToolCall,
  SessionStatus,
  AgentSession,
  AgentConfigRequest,
  AgentResponse,
  ChatResponse,
  ToolInfo,
} from './domain/agent-chat-types';

// === Services ===
export { agentChatService } from './services/agent-chat-service';

// === Hooks ===
export { useAgentChat } from './hooks/useAgentChat';

// === UI Components ===
export { AgentChatPanel } from './ui/AgentChatPanel';
export { AgentChatMessage } from './ui/AgentChatMessage';
export { AgentChatInput } from './ui/AgentChatInput';
export { AgentConfigModal } from './ui/AgentConfigModal';
