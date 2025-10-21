// src/modules/ai/index.ts
// module: ai | layer: public | role: 门牌导出
// summary: AI 模块的统一对外导出接口

// === Domain 层 ===
export type {
  AIProvider,
  AIModel,
  MessageRole,
  AIMessage,
  ToolSpec,
  ToolCall,
  ResponseFormat,
  StreamEventType,
  StreamEvent,
  AIRequest,
  AIResponse,
  RetryConfig,
  ProviderConfig,
  IAIClient,
} from './domain/ai-types';

export { AIErrorType, AIError } from './domain/ai-types';

export type { AIModuleConfig } from './domain/ai-config';
export { DEFAULT_RETRY_CONFIG, getConfigFromEnv, validateConfig } from './domain/ai-config';

export type {
  LocatorKind,
  StrategyType,
  Locator,
  StepCard,
} from './domain/step-card-schema';
export { StepCardSchema } from './domain/step-card-schema';

export {
  ToolFetchXml,
  ToolQueryIndex,
  ToolTapElement,
  ToolAnalyzeElement,
  ToolCaptureScreen,
  ALL_TOOLS,
  getToolByName,
} from './domain/tools-schema';

// === Application 层 ===
export type { GenerateStepCardInput } from './application/ai-generate-step-card-use-case';
export { GenerateStepCardUseCase } from './application/ai-generate-step-card-use-case';

// === Services 层 ===
export { createAIClient, aiClientManager, getAIClient } from './services/ai-factory';
export { OpenAIProvider } from './services/ai-openai-provider';
export {
  isRetryableError,
  convertToAIError,
  calculateRetryDelay,
  withRetry,
  RateLimiter,
} from './services/ai-retry';
export { AILogger, getGlobalLogger } from './services/ai-logger';

// === Hooks 层 ===
export { useAI } from './hooks/use-ai';
export { useGenerateStepCard, generateStepCard } from './hooks/useGenerateStepCard';
export type { StepCardStrategyType, LocatorConfig, StepCardConfig } from './hooks/useGenerateStepCard';
