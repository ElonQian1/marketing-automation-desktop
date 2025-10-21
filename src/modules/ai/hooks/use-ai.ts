// src/modules/ai/hooks/use-ai.ts
// module: ai | layer: hooks | role: AI 统一 Hook
// summary: 提供 AI 功能的统一 React Hook 接口

import { useState, useCallback, useEffect } from 'react';
import { aiClientManager, getAIClient } from '../services/ai-factory';
import { getConfigFromEnv } from '../domain/ai-config';
import type { StepCard } from '../domain/step-card-schema';
import type { GenerateStepCardInput } from '../application/ai-generate-step-card-use-case';
import { GenerateStepCardUseCase } from '../application/ai-generate-step-card-use-case';
import type { StreamEvent } from '../domain/ai-types';

/**
 * AI Hook 状态
 */
interface UseAIState {
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * AI Hook 返回值
 */
interface UseAIReturn extends UseAIState {
  generateStepCard: (input: GenerateStepCardInput) => Promise<StepCard | null>;
  generateStepCardStream: (
    input: GenerateStepCardInput,
    onEvent: (event: StreamEvent) => void
  ) => Promise<void>;
  embed: (texts: string[]) => Promise<number[][] | null>;
  clearError: () => void;
}

/**
 * AI 统一 Hook
 * 
 * @example
 * ```tsx
 * const { generateStepCard, isLoading, error } = useAI();
 * 
 * const handleGenerate = async () => {
 *   const stepCard = await generateStepCard({
 *     xmlSnippet: '<node resource-id="btn_submit">提交</node>',
 *     targetDescription: '提交按钮',
 *   });
 *   console.log(stepCard);
 * };
 * ```
 */
export function useAI(): UseAIReturn {
  const [state, setState] = useState<UseAIState>({
    isInitialized: false,
    isLoading: false,
    error: null,
  });

  // 初始化 AI 客户端
  useEffect(() => {
    if (!aiClientManager.isInitialized()) {
      try {
        const config = getConfigFromEnv();
        aiClientManager.initialize(config);
        setState(prev => ({ ...prev, isInitialized: true }));
      } catch (error) {
        console.error('[useAI] Failed to initialize AI client:', error);
        setState(prev => ({ ...prev, error: error as Error }));
      }
    } else {
      setState(prev => ({ ...prev, isInitialized: true }));
    }
  }, []);

  /**
   * 生成步骤卡片（非流式）
   */
  const generateStepCard = useCallback(
    async (input: GenerateStepCardInput): Promise<StepCard | null> => {
      if (!state.isInitialized) {
        console.error('[useAI] AI client not initialized');
        return null;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const client = getAIClient();
        const useCase = new GenerateStepCardUseCase(client);
        const result = await useCase.execute(input);
        
        setState(prev => ({ ...prev, isLoading: false }));
        return result;
      } catch (error) {
        console.error('[useAI] Failed to generate step card:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
        return null;
      }
    },
    [state.isInitialized]
  );

  /**
   * 生成步骤卡片（流式）
   */
  const generateStepCardStream = useCallback(
    async (
      input: GenerateStepCardInput,
      onEvent: (event: StreamEvent) => void
    ): Promise<void> => {
      if (!state.isInitialized) {
        console.error('[useAI] AI client not initialized');
        return;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const client = getAIClient();
        const useCase = new GenerateStepCardUseCase(client);
        
        // TODO: 实现流式生成
        // 目前先调用非流式版本
        const result = await useCase.execute(input);
        onEvent({ type: 'done', done: true });
        
        setState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error('[useAI] Failed to generate step card stream:', error);
        onEvent({ type: 'error', error: error as Error });
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
      }
    },
    [state.isInitialized]
  );

  /**
   * 生成嵌入向量
   */
  const embed = useCallback(
    async (texts: string[]): Promise<number[][] | null> => {
      if (!state.isInitialized) {
        console.error('[useAI] AI client not initialized');
        return null;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const client = getAIClient();
        const result = await client.embed(texts);
        
        setState(prev => ({ ...prev, isLoading: false }));
        return result;
      } catch (error) {
        console.error('[useAI] Failed to generate embeddings:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
        return null;
      }
    },
    [state.isInitialized]
  );

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    generateStepCard,
    generateStepCardStream,
    embed,
    clearError,
  };
}
