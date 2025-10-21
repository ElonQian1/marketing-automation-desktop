// src/modules/prospecting/services/prospecting-intent-analyzer.ts
// module: prospecting | layer: services | role: AI意图分析服务
// summary: 基于现有AI模块的评论意图识别服务

import { invoke } from '@tauri-apps/api/core';
import type {
  ProspectingRawComment,
  ProspectingAnalysisResult,
  ProspectingIntentType,
  ProspectingEntities
} from '../domain';

/**
 * AI 意图分析工具 Schema
 */
export const ProspectingIntentTool = {
  type: "function" as const,
  function: {
    name: "analyze_comment_intent",
    description: "分析社交媒体评论的意图并返回结构化结果",
    parameters: {
      type: "object",
      required: ["intent", "confidence", "entities", "suggested_reply", "tags"],
      properties: {
        intent: {
          type: "string",
          enum: ["询价", "询地址", "售后", "咨询", "购买", "比较", "无效"],
          description: "识别的用户意图类型"
        },
        confidence: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "意图识别的置信度"
        },
        entities: {
          type: "object",
          properties: {
            product: { type: "string", description: "产品名称" },
            quantity: { type: "string", description: "数量" },
            location: { type: "string", description: "地理位置" },
            contact: { type: "string", description: "联系方式" },
            priceRange: { type: "string", description: "价格范围" },
            brand: { type: "string", description: "品牌" },
            model: { type: "string", description: "型号" }
          },
          description: "从评论中提取的实体信息"
        },
        suggested_reply: {
          type: "string",
          description: "建议的回复内容，要友好专业"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "相关标签，如['高价值客户', '紧急', '潜在大单']"
        }
      }
    }
  }
};

/**
 * 评论意图分析器
 */
export class ProspectingIntentAnalyzer {
  /**
   * 分析单条评论
   */
  async analyzeComment(comment: ProspectingRawComment): Promise<ProspectingAnalysisResult> {
    try {
      // 调用 Tauri 后端的 AI 聊天接口
      const response = await invoke('ai_chat', {
        messages: [
          {
            role: "system",
            content: `你是一个专业的社交媒体评论意图识别助手。
            
分析用户评论的商业意图，重点识别：
- 询价：询问价格、费用、成本等
- 询地址：询问门店位置、地址、实体店等  
- 售后：售后服务、退换货、维修等问题
- 咨询：一般性产品咨询、使用方法等
- 购买：明确的购买意向表达
- 比较：与其他产品或品牌的比较
- 无效：无关评论、垃圾信息等

注意识别中文网络语言、俚语、缩写等。提取关键信息如产品名、数量、位置等。生成专业友好的建议回复。`
          },
          {
            role: "user",
            content: `请分析以下评论：
            
平台：${comment.platform}
作者：${comment.author}
内容：${comment.content}
${comment.videoUrl ? `视频链接：${comment.videoUrl}` : ''}

请识别意图并生成结构化分析结果。`
          }
        ],
        tools: [ProspectingIntentTool],
        toolChoice: "auto",
        stream: false
      });

      // 解析AI返回的结果
      const responseData = response as any;
      const toolCall = responseData?.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.name === "analyze_comment_intent") {
        const analysisData = JSON.parse(toolCall.function.arguments);
        
        return {
          commentId: comment.id,
          intent: analysisData.intent as ProspectingIntentType,
          confidence: analysisData.confidence,
          entities: analysisData.entities as ProspectingEntities,
          suggestedReply: analysisData.suggested_reply,
          tags: analysisData.tags || [],
          analyzedAt: Date.now()
        };
      }

      // 如果AI没有使用工具调用，返回默认结果
      return this.createDefaultAnalysis(comment);
      
    } catch (error) {
      console.error('[ProspectingIntentAnalyzer] 分析评论失败:', error);
      return this.createDefaultAnalysis(comment, error as Error);
    }
  }

  /**
   * 批量分析评论
   */
  async analyzeBatch(
    comments: ProspectingRawComment[], 
    options: {
      concurrency?: number;
      onProgress?: (completed: number, total: number) => void;
    } = {}
  ): Promise<ProspectingAnalysisResult[]> {
    const { concurrency = 3, onProgress } = options;
    const results: ProspectingAnalysisResult[] = [];
    let completed = 0;

    // 简单的并发控制
    const semaphore = new Array(concurrency).fill(null);
    let commentIndex = 0;

    const workers = semaphore.map(async () => {
      while (commentIndex < comments.length) {
        const index = commentIndex++;
        const comment = comments[index];
        
        try {
          const result = await this.analyzeComment(comment);
          results[index] = result;
          completed++;
          onProgress?.(completed, comments.length);
        } catch (error) {
          console.error(`[ProspectingIntentAnalyzer] 分析评论 ${comment.id} 失败:`, error);
          results[index] = this.createDefaultAnalysis(comment, error as Error);
          completed++;
          onProgress?.(completed, comments.length);
        }
      }
    });

    await Promise.all(workers);
    
    // 返回按原顺序排列的结果
    return results.filter(r => r !== undefined);
  }

  /**
   * 创建默认分析结果（当AI分析失败时）
   */
  private createDefaultAnalysis(comment: ProspectingRawComment, error?: Error): ProspectingAnalysisResult {
    // 简单的规则匹配作为兜底
    let intent: ProspectingIntentType = '无效';
    let confidence = 0.1;
    let suggestedReply = '感谢您的关注！';
    
    const content = comment.content.toLowerCase();
    
    if (/价格|多少钱|费用|成本/.test(content)) {
      intent = '询价';
      confidence = 0.6;
      suggestedReply = '感谢询价！请私信我们获取详细报价信息。';
    } else if (/地址|位置|门店|实体店/.test(content)) {
      intent = '询地址';
      confidence = 0.6;
      suggestedReply = '感谢咨询！请私信我们获取门店地址信息。';
    } else if (/售后|退货|维修|问题/.test(content)) {
      intent = '售后';
      confidence = 0.6;
      suggestedReply = '感谢反馈！请联系我们的客服处理售后问题。';
    } else if (/怎么|如何|使用/.test(content)) {
      intent = '咨询';
      confidence = 0.5;
      suggestedReply = '感谢咨询！我们会为您详细介绍产品信息。';
    }

    return {
      commentId: comment.id,
      intent,
      confidence,
      entities: {},
      suggestedReply,
      tags: error ? ['分析失败'] : ['规则匹配'],
      analyzedAt: Date.now()
    };
  }
}