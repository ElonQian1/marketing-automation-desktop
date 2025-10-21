// src/ai/schemas/leadIntent.schema.ts
// module: ai | layer: schemas | role: Lead意图识别函数调用工具
// summary: 定义AI识别社媒评论意图的函数调用schema

export const LeadIntentTool = {
  type: "function" as const,
  function: {
    name: "return_lead_analysis",
    description: "识别社交媒体评论的用户意图，提取关键实体信息，并生成建议回复",
    parameters: {
      type: "object",
      required: ["intent", "confidence", "entities", "reply_suggestion"],
      properties: {
        intent: {
          type: "string",
          enum: ["询价", "询地址", "售后", "咨询", "无效"],
          description: "评论的主要意图分类",
        },
        confidence: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "意图判断的置信度（0-1之间）",
        },
        entities: {
          type: "object",
          description: "从评论中提取的关键实体信息",
          properties: {
            product: {
              type: "string",
              description: "提及的产品名称",
            },
            quantity: {
              type: "string",
              description: "数量信息（如一套、两个等）",
            },
            location: {
              type: "string",
              description: "地理位置信息（省市区等）",
            },
            phone: {
              type: "string",
              description: "联系电话（如有）",
            },
            priceTarget: {
              type: "string",
              description: "价格范围或预算",
            },
          },
        },
        reply_suggestion: {
          type: "string",
          description: "针对该评论的建议回复内容",
        },
        tags: {
          type: "array",
          items: {
            type: "string",
          },
          description: "评论的特征标签（如紧急、高价值客户等）",
        },
      },
    },
  },
};

export type LeadIntent = "询价" | "询地址" | "售后" | "咨询" | "无效";

export interface LeadEntities {
  product?: string;
  quantity?: string;
  location?: string;
  phone?: string;
  priceTarget?: string;
}

export interface LeadAnalysis {
  id: string;
  platform: string;
  intent: LeadIntent;
  confidence: number;
  entities: LeadEntities;
  reply_suggestion: string;
  tags?: string[];
}
