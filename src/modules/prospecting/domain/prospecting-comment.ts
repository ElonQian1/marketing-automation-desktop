// src/modules/prospecting/domain/prospecting-comment.ts
// module: prospecting | layer: domain | role: 评论实体定义
// summary: 社交媒体评论的核心业务实体

/**
 * 社交媒体平台枚举
 */
export type ProspectingSocialPlatform = 'douyin' | 'xhs' | 'weibo' | 'kuaishou';

/**
 * 原始评论数据
 */
export interface ProspectingRawComment {
  /** 唯一标识 */
  id: string;
  /** 平台类型 */
  platform: ProspectingSocialPlatform;
  /** 视频/帖子链接 */
  videoUrl?: string;
  /** 评论作者 */
  author: string;
  /** 评论内容 */
  content: string;
  /** 时间戳 */
  timestamp?: number;
  /** 作者头像 */
  avatarUrl?: string;
  /** 点赞数 */
  likeCount?: number;
  /** 原始数据（用于调试） */
  metadata?: Record<string, any>;
}

/**
 * 意图类型枚举
 */
export type ProspectingIntentType = 
  | '询价'          // 询问价格
  | '询地址'        // 询问地址/门店位置
  | '售后'          // 售后服务问题
  | '咨询'          // 一般性咨询
  | '购买'          // 明确购买意向
  | '比较'          // 产品比较
  | '无效';         // 无效评论

/**
 * AI分析结果
 */
export interface ProspectingAnalysisResult {
  /** 评论ID */
  commentId: string;
  /** 识别的意图 */
  intent: ProspectingIntentType;
  /** 置信度 (0-1) */
  confidence: number;
  /** 提取的实体信息 */
  entities: ProspectingEntities;
  /** AI建议的回复 */
  suggestedReply: string;
  /** 标签 */
  tags: string[];
  /** 分析时间 */
  analyzedAt: number;
}

/**
 * 提取的实体信息
 */
export interface ProspectingEntities {
  /** 产品名称 */
  product?: string;
  /** 数量 */
  quantity?: string;
  /** 地理位置 */
  location?: string;
  /** 联系方式 */
  contact?: string;
  /** 价格范围 */
  priceRange?: string;
  /** 品牌 */
  brand?: string;
  /** 型号 */
  model?: string;
}

/**
 * 完整的评论信息（原始+分析结果）
 */
export interface ProspectingComment extends ProspectingRawComment {
  /** AI分析结果 */
  analysis?: ProspectingAnalysisResult;
  /** 是否已回复 */
  isReplied?: boolean;
  /** 回复时间 */
  repliedAt?: number;
  /** 实际发送的回复内容 */
  actualReply?: string;
}