// src/modules/ai/domain/step-card-schema.ts
// module: ai | layer: domain | role: 步骤卡片 Schema 定义
// summary: 定义步骤卡片的 JSON Schema 和相关类型

import type { ResponseFormat } from './ai-types';

/**
 * 定位器类型
 */
export type LocatorKind = 
  | 'xpath'
  | 'resource_id'
  | 'text'
  | 'bounds'
  | 'css'
  | 'accessibility_id';

/**
 * 策略类型
 */
export type StrategyType =
  | 'self_anchor'
  | 'child_anchor'
  | 'local_index'
  | 'global_index'
  | 'ocr_match'
  | 'image_template';

/**
 * 定位器
 */
export interface Locator {
  kind: LocatorKind;
  value: string;
}

/**
 * 步骤卡片（AI 生成的结构化输出）
 */
export interface StepCard {
  strategyType: StrategyType;
  locator: Locator;
  confidence: number;
  fallbacks?: Locator[];
  notes?: string;
  reasoning?: string;
}

/**
 * 步骤卡片 JSON Schema
 */
export const StepCardSchema: ResponseFormat = {
  name: 'StepCard',
  schema: {
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
        description: '定位策略类型',
      },
      locator: {
        type: 'object',
        required: ['kind', 'value'],
        properties: {
          kind: {
            type: 'string',
            enum: ['xpath', 'resource_id', 'text', 'bounds', 'css', 'accessibility_id'],
            description: '定位器类型',
          },
          value: {
            type: 'string',
            description: '定位器值',
          },
        },
        additionalProperties: false,
      },
      confidence: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: '置信度（0-1）',
      },
      fallbacks: {
        type: 'array',
        items: {
          type: 'object',
          required: ['kind', 'value'],
          properties: {
            kind: {
              type: 'string',
              enum: ['xpath', 'resource_id', 'text', 'bounds', 'css', 'accessibility_id'],
            },
            value: {
              type: 'string',
            },
          },
          additionalProperties: false,
        },
        description: '备选定位器列表',
      },
      notes: {
        type: 'string',
        description: '步骤说明',
      },
      reasoning: {
        type: 'string',
        description: 'AI 的推理过程',
      },
    },
    additionalProperties: false,
  },
  strict: true,
};
