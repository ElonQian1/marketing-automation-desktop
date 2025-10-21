// src/modules/ai/services/ai-factory.ts
// module: ai | layer: services | role: AI 客户端工厂
// summary: 根据配置创建相应的 AI Provider 实例

import type { IAIClient } from '../domain/ai-types';
import type { AIModuleConfig } from '../domain/ai-config';
import { validateConfig } from '../domain/ai-config';
import { OpenAIProvider } from './ai-openai-provider';

/**
 * 创建 AI 客户端
 */
export function createAIClient(config: AIModuleConfig): IAIClient {
  // 验证配置
  validateConfig(config);

  // 根据 provider 创建相应的客户端
  switch (config.provider) {
    case 'openai':
      if (!config.openai) {
        throw new Error('[AI Factory] OpenAI configuration is missing');
      }
      return new OpenAIProvider(config.openai);

    case 'hunyuan':
      if (!config.hunyuan) {
        throw new Error('[AI Factory] Hunyuan configuration is missing');
      }
      // Hunyuan 使用 OpenAI 兼容接口，可以直接用 OpenAIProvider
      return new OpenAIProvider(config.hunyuan);

    default:
      throw new Error(`[AI Factory] Unsupported provider: ${config.provider}`);
  }
}

/**
 * AI 客户端单例管理
 */
class AIClientManager {
  private client: IAIClient | null = null;
  private config: AIModuleConfig | null = null;

  /**
   * 初始化客户端
   */
  initialize(config: AIModuleConfig): void {
    this.config = config;
    this.client = createAIClient(config);
  }

  /**
   * 获取客户端实例
   */
  getClient(): IAIClient {
    if (!this.client) {
      throw new Error('[AI Client Manager] AI client not initialized. Call initialize() first.');
    }
    return this.client;
  }

  /**
   * 是否已初始化
   */
  isInitialized(): boolean {
    return this.client !== null;
  }

  /**
   * 重置客户端
   */
  reset(): void {
    this.client = null;
    this.config = null;
  }

  /**
   * 获取当前配置
   */
  getConfig(): AIModuleConfig | null {
    return this.config;
  }
}

// 全局单例
export const aiClientManager = new AIClientManager();

/**
 * 获取 AI 客户端（便捷方法）
 */
export function getAIClient(): IAIClient {
  return aiClientManager.getClient();
}
