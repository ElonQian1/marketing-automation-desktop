// src/modules/ai/application/ai-generate-step-card-use-case.ts
// module: ai | layer: application | role: 生成步骤卡片用例
// summary: 使用 AI 生成智能步骤卡片的业务逻辑

import type { IAIClient, AIRequest } from '../domain/ai-types';
import type { StepCard } from '../domain/step-card-schema';
import { StepCardSchema } from '../domain/step-card-schema';
import { ToolFetchXml, ToolQueryIndex, ToolAnalyzeElement } from '../domain/tools-schema';

/**
 * 生成步骤卡片用例的输入
 */
export interface GenerateStepCardInput {
  xmlSnippet: string;
  targetDescription?: string;
  context?: string;
  model?: string;
}

/**
 * 生成步骤卡片用例
 */
export class GenerateStepCardUseCase {
  constructor(private aiClient: IAIClient) {}

  /**
   * 执行用例
   */
  async execute(input: GenerateStepCardInput): Promise<StepCard> {
    const { xmlSnippet, targetDescription, context, model } = input;

    // 构建系统提示词
    const systemPrompt = this.buildSystemPrompt();

    // 构建用户提示词
    const userPrompt = this.buildUserPrompt(xmlSnippet, targetDescription, context);

    // 构建 AI 请求
    const request: AIRequest = {
      model: model || this.getDefaultModel(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      tools: [ToolFetchXml, ToolQueryIndex, ToolAnalyzeElement],
      responseSchema: StepCardSchema,
      temperature: 0.2,
      maxTokens: 2000,
    };

    // 发送请求
    const response = await this.aiClient.chat<StepCard>(request);

    // 处理 tool calls（如果有）
    if (response.toolCalls && response.toolCalls.length > 0) {
      // TODO: 实现 tool call 的处理逻辑
      console.log('[AI] Tool calls detected:', response.toolCalls);
    }

    // 返回结构化输出
    if (!response.output) {
      throw new Error('[AI] Failed to generate step card: no output received');
    }

    return response.output;
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(): string {
    return `你是一个专业的 ADB UI 自动化分析专家。你的任务是分析 Android XML 布局结构，并为目标元素生成最稳定可靠的定位策略。

**核心原则**：
1. 优先选择稳定性高的定位方式（resource-id > text > xpath）
2. 考虑元素的上下文关系（父子、兄弟节点）
3. 为关键步骤提供备选定位方案
4. 评估并标注置信度（0-1）

**策略类型说明**：
- self_anchor: 元素自身属性定位（resource-id、text等）
- child_anchor: 通过父元素定位子元素
- local_index: 使用页面内索引定位
- global_index: 使用全局索引定位
- ocr_match: OCR 文字识别定位
- image_template: 图像模板匹配定位

**输出要求**：
严格按照 JSON Schema 返回结构化数据，包含 strategyType、locator、confidence、fallbacks（可选）、notes（可选）、reasoning（可选）。`;
  }

  /**
   * 构建用户提示词
   */
  private buildUserPrompt(
    xmlSnippet: string,
    targetDescription?: string,
    context?: string
  ): string {
    let prompt = '请基于以下信息生成最优的步骤卡片：\n\n';

    if (targetDescription) {
      prompt += `**目标元素描述**：${targetDescription}\n\n`;
    }

    if (context) {
      prompt += `**上下文信息**：${context}\n\n`;
    }

    prompt += `**XML 布局片段**：\n\`\`\`xml\n${xmlSnippet}\n\`\`\`\n\n`;
    prompt += '请分析并返回最佳的定位策略。';

    return prompt;
  }

  /**
   * 获取默认模型
   */
  private getDefaultModel(): string {
    const provider = this.aiClient.getProvider();
    return provider === 'hunyuan' ? 'hunyuan-turbo-latest' : 'gpt-4o-mini';
  }
}
