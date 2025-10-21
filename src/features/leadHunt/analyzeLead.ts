// src/features/leadHunt/analyzeLead.ts
// module: lead-hunt | layer: features | role: AI意图分析服务
// summary: 批量调用AI识别评论意图，提取实体，生成建议回复

import { invoke } from "@tauri-apps/api/core";
import { aiChat } from "@/lib/aiClient";
import { LeadIntentTool, type LeadAnalysis } from "@/ai/schemas/leadIntent.schema";

/**
 * 获取AI设置中的并发数
 */
async function getConcurrency(): Promise<number> {
  try {
    const settings = await invoke<{ concurrency: number }>("get_ai_settings");
    return settings.concurrency || 4;
  } catch (error) {
    console.warn("获取AI并发设置失败，使用默认值4:", error);
    return 4;
  }
}

export type RawComment = {
  id: string;
  platform: "douyin" | "xhs";
  videoUrl?: string;
  author: string;
  content: string;
  ts?: number;
};

/**
 * 分析单条评论的意图
 */
export async function analyzeOne(c: RawComment): Promise<LeadAnalysis> {
  try {
    const res: any = await aiChat({
      messages: [
        {
          role: "system",
          content: `你是社交媒体评论意图识别助手。请分析评论并通过函数返回结构化结果。

意图分类说明：
- 询价：询问价格、多少钱、费用等
- 询地址：询问地址、位置、在哪里、怎么去等
- 售后：投诉、退换货、质量问题、使用问题等
- 咨询：产品信息、功能咨询、购买流程等
- 无效：无关内容、广告、灌水等

建议回复要求：
- 语气友好专业
- 针对性强
- 引导进一步沟通`,
        },
        {
          role: "user",
          content: `平台: ${c.platform === "douyin" ? "抖音" : "小红书"}
作者: ${c.author}
评论内容: ${c.content}

请分析该评论的意图并给出建议回复。`,
        },
      ],
      tools: [LeadIntentTool],
      toolChoice: "auto",
      stream: false,
    });

    // 提取函数调用结果
    const call = res?.choices?.[0]?.message?.tool_calls?.[0];
    if (call?.function?.name === "return_lead_analysis") {
      const result = JSON.parse(call.function.arguments);
      return {
        id: c.id,
        platform: c.platform,
        intent: result.intent,
        confidence: result.confidence,
        entities: result.entities || {},
        reply_suggestion: result.reply_suggestion || "",
        tags: result.tags || [],
      };
    }

    // 降级处理：如果没有函数调用，返回默认结果
    return {
      id: c.id,
      platform: c.platform,
      intent: "无效",
      confidence: 0,
      entities: {},
      reply_suggestion: "抱歉，暂时无法识别该评论意图",
      tags: [],
    };
  } catch (error) {
    console.error(`分析评论失败 [${c.id}]:`, error);
    return {
      id: c.id,
      platform: c.platform,
      intent: "无效",
      confidence: 0,
      entities: {},
      reply_suggestion: "分析失败，请稍后重试",
      tags: ["错误"],
    };
  }
}

/**
 * 批量分析评论（支持并发控制）
 * @param items 评论列表
 * @param concurrency 并发数（默认4）
 */
export async function analyzeBatch(
  items: RawComment[],
  concurrency = 4
): Promise<LeadAnalysis[]> {
  const results: LeadAnalysis[] = [];
  let index = 0;

  // 工作协程
  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      const comment = items[currentIndex];
      
      try {
        const analysis = await analyzeOne(comment);
        results[currentIndex] = analysis;
      } catch (error) {
        console.error(`Worker failed for comment ${comment.id}:`, error);
        // 确保有结果
        results[currentIndex] = {
          id: comment.id,
          platform: comment.platform,
          intent: "无效",
          confidence: 0,
          entities: {},
          reply_suggestion: "分析失败",
          tags: ["错误"],
        };
      }
    }
  }

  // 启动多个并发worker
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () =>
    worker()
  );

  await Promise.all(workers);

  return results.filter(Boolean); // 过滤空值
}

/**
 * 带进度回调的批量分析
 * @param items 评论列表
 * @param onProgress 进度回调
 * @param concurrency 并发数（可选，默认从AI设置读取）
 */
export async function analyzeBatchWithProgress(
  items: RawComment[],
  onProgress: (current: number, total: number) => void,
  concurrency?: number
): Promise<LeadAnalysis[]> {
  // 如果没有指定并发数，从AI设置中读取
  const actualConcurrency = concurrency ?? await getConcurrency();
  const results: LeadAnalysis[] = [];
  let completed = 0;
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      const comment = items[currentIndex];

      try {
        const analysis = await analyzeOne(comment);
        results[currentIndex] = analysis;
      } catch (error) {
        console.error(`Worker failed for comment ${comment.id}:`, error);
        results[currentIndex] = {
          id: comment.id,
          platform: comment.platform,
          intent: "无效",
          confidence: 0,
          entities: {},
          reply_suggestion: "分析失败",
          tags: ["错误"],
        };
      }

      completed++;
      onProgress(completed, items.length);
    }
  }

  const workers = Array.from({ length: Math.min(actualConcurrency, items.length) }, () =>
    worker()
  );

  await Promise.all(workers);

  return results.filter(Boolean);
}
