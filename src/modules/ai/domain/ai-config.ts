// src/modules/ai/domain/ai-config.ts
// module: ai | layer: domain | role: 配置管理
// summary: AI 模块的配置定义和默认值

import type { AIProvider, ProviderConfig, RetryConfig } from './ai-types';

/**
 * 默认重试配置
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 200,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * AI 模块配置
 */
export interface AIModuleConfig {
  provider: AIProvider;
  openai?: ProviderConfig;
  hunyuan?: ProviderConfig;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
  enableLogging?: boolean;
}

/**
 * 从环境变量获取配置
 */
export function getConfigFromEnv(): AIModuleConfig {
  const provider = (import.meta.env.VITE_AI_PROVIDER || 'openai') as AIProvider;
  
  const config: AIModuleConfig = {
    provider,
    defaultTemperature: 0.2,
    defaultMaxTokens: 4096,
    enableLogging: import.meta.env.DEV,
  };

  // OpenAI 配置
  if (import.meta.env.VITE_OPENAI_API_KEY) {
    config.openai = {
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      baseURL: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
      defaultModel: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
      embedModel: import.meta.env.VITE_OPENAI_EMBED_MODEL || 'text-embedding-3-large',
      timeout: 60000,
      retryConfig: DEFAULT_RETRY_CONFIG,
    };
  }

  // 混元配置
  if (import.meta.env.VITE_HUNYUAN_API_KEY) {
    config.hunyuan = {
      apiKey: import.meta.env.VITE_HUNYUAN_API_KEY,
      baseURL: import.meta.env.VITE_HUNYUAN_BASE_URL || 'https://api.hunyuan.cloud.tencent.com/v1',
      defaultModel: import.meta.env.VITE_HUNYUAN_MODEL || 'hunyuan-turbo-latest',
      embedModel: 'hunyuan-embedding',
      timeout: 60000,
      retryConfig: DEFAULT_RETRY_CONFIG,
    };
  }

  return config;
}

/**
 * 验证配置
 */
export function validateConfig(config: AIModuleConfig): void {
  if (!config.provider) {
    throw new Error('[AI Config] Provider is required');
  }

  const providerConfig = config[config.provider];
  if (!providerConfig) {
    throw new Error(`[AI Config] Configuration for provider "${config.provider}" is missing`);
  }

  if (!providerConfig.apiKey) {
    throw new Error(`[AI Config] API key for provider "${config.provider}" is missing`);
  }

  if (!providerConfig.baseURL) {
    throw new Error(`[AI Config] Base URL for provider "${config.provider}" is missing`);
  }
}
