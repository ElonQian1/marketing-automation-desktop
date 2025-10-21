// src/modules/ai/hooks/useGenerateStepCard.ts
// module: ai | layer: hooks | role: AI 步骤卡片生成 Hook
// summary: 使用 AI 生成步骤卡片的配置和策略

import { aiChat } from '../../../lib/aiClient';

/**
 * 步骤卡片策略类型
 */
export type StepCardStrategyType =
  | 'self_anchor'
  | 'child_anchor'
  | 'local_index'
  | 'global_index'
  | 'ocr_match'
  | 'image_template';

/**
 * 定位器配置
 */
export interface LocatorConfig {
  kind: string;
  value: string;
}

/**
 * 步骤卡片配置
 */
export interface StepCardConfig {
  strategyType: StepCardStrategyType;
  locator: LocatorConfig;
  confidence: number;
  notes?: string;
}

/**
 * 生成步骤卡片
 * @param xml Android UI XML 片段
 * @returns 步骤卡片配置
 */
export async function generateStepCard(xml: string): Promise<StepCardConfig | null> {
  const tool = {
    name: 'return_step_card',
    description: '返回结构化步骤卡片配置',
    parameters: {
      type: 'object',
      required: ['strategyType', 'locator', 'confidence'],
      properties: {
        strategyType: {
          type: 'string',
          enum: [
            'self_anchor',
            'child_anchor',
            'local_index',
            'global_index',
            'ocr_match',
            'image_template',
          ],
        },
        locator: {
          type: 'object',
          required: ['kind', 'value'],
          properties: {
            kind: { type: 'string' },
            value: { type: 'string' },
          },
        },
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1,
        },
        notes: {
          type: 'string',
        },
      },
    },
  };

  try {
    const res: any = await aiChat({
      messages: [
        {
          role: 'system',
          content: '你是 ADB 智能页面分析器。只通过调用 return_step_card 返回结构化结果。',
        },
        {
          role: 'user',
          content: `基于以下 Android UI XML 片段，分析元素特征并给出最稳妥的步骤卡片配置：\n\n${xml}`,
        },
      ],
      tools: [tool],
      toolChoice: 'auto',
      stream: false,
    });

    // 提取 tool_calls（后端返回 OpenAI 兼容结构）
    const call = res?.choices?.[0]?.message?.tool_calls?.[0];
    if (call?.function?.name === 'return_step_card') {
      return JSON.parse(call.function.arguments);
    }

    return null;
  } catch (error) {
    console.error('[AI] Generate step card failed:', error);
    return null;
  }
}

/**
 * 使用 AI 生成步骤卡片的 Hook
 */
export function useGenerateStepCard() {
  return {
    generateStepCard,
  };
}
