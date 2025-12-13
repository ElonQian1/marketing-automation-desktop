// src/modules/agent-chat/index.ts
// module: agent-chat | layer: module-root | role: 统一导出
// summary: AI Agent 对话模块的公开 API

// === Domain Types ===
export type {
  AgentProvider,
  ChatMessage,
  ToolCallInfo,
  AgentConfigRequest,
  AgentConfigResponse,
  AgentChatRequest,
  AgentChatResponse,
  AgentStatusResponse,
  AgentToolInfo,
} from './domain/agent-chat-types';

// === Services ===
export {
  AgentChatService,
} from './services/agent-chat-service';

// === Hooks ===
export {
  useAgentChat,
  type UseAgentChatOptions,
  type UseAgentChatReturn,
} from './hooks/useAgentChat';

// === UI Components ===
export { AgentChatPanel } from './ui/AgentChatPanel';
export { AgentChatMessage } from './ui/AgentChatMessage';
export { AgentChatInput } from './ui/AgentChatInput';
export { AgentConfigModal } from './ui/AgentConfigModal';
