// src/modules/intelligent-strategy-system/i18n/ElementTextDictionary.ts
// module: shared | layer: unknown | role: module-component
// summary: 模块组件

/**
 * 多语言元素文本词典
 * 
 * Step 0 规范化输入的重要组成部分
 * 用于支持跨语言的元素识别和匹配
 */

export interface I18nTextEntry {
  /** 主键（中文） */
  primary: string;
  /** 所有等价文本（包括多语言） */
  variants: string[];
  /** 元素类型标签 */
  category: string;
  /** 优先级（数字越大优先级越高） */
  priority: number;
}

/**
 * 文本信息查询结果
 */
export interface TextLookupResult {
  /** 规范化后的文本 */
  normalized: string;
  /** 检测到的语言 */
  language?: string;
  /** 同义词列表 */
  synonyms: string[];
  /** 文本类型 */
  type: string;
  /** 是否找到匹配 */
  found: boolean;
}

/**
 * 元素文本多语言词典
 * 支持底部导航、功能按钮等常见UI元素的多语言识别
 */
export const ELEMENT_TEXT_DICTIONARY: Record<string, I18nTextEntry> = {
  // === 底部导航栏 ===
  '收藏': {
    primary: '收藏',
    variants: ['收藏', 'Favorites', 'Starred', 'Bookmark', '즐겨찾기', 'お気に入り'],
    category: 'navigation',
    priority: 100
  },
  
  '联系人': {
    primary: '联系人',
    variants: ['联系人', 'Contacts', 'People', 'Address Book', '연락처', '連絡先'],
    category: 'navigation', 
    priority: 100
  },
  
  '电话': {
    primary: '电话',
    variants: ['电话', 'Phone', 'Call', 'Dial', 'Dialer', '전화', '電話'],
    category: 'navigation',
    priority: 100
  },
  
  '消息': {
    primary: '消息',
    variants: ['消息', 'Messages', 'SMS', 'Text', 'Chat', '메시지', 'メッセージ'],
    category: 'navigation',
    priority: 100
  },
  
  // === 功能按钮 ===
  '确定': {
    primary: '确定',
    variants: ['确定', 'OK', 'Confirm', 'Done', 'Apply', '확인', '確定'],
    category: 'action',
    priority: 90
  },
  
  '取消': {
    primary: '取消',
    variants: ['取消', 'Cancel', 'Dismiss', 'Close', '취소', 'キャンセル'],
    category: 'action',
    priority: 90
  },
  
  '搜索': {
    primary: '搜索',
    variants: ['搜索', 'Search', 'Find', 'Query', '검색', '検索'],
    category: 'action',
    priority: 85
  },
  
  // === 设置菜单 ===
  '设置': {
    primary: '设置',
    variants: ['设置', 'Settings', 'Preferences', 'Config', '설정', '設定'],
    category: 'menu',
    priority: 80
  },
  
  '更多': {
    primary: '更多',
    variants: ['更多', 'More', 'Menu', 'Options', '더보기', 'もっと'],
    category: 'menu',
    priority: 75
  },
  
  // === 社交媒体特有 ===
  '关注': {
    primary: '关注',
    variants: ['关注', 'Follow', 'Subscribe', '팔로우', 'フォロー'],
    category: 'social',
    priority: 85
  },
  
  '点赞': {
    primary: '点赞',
    variants: ['点赞', 'Like', 'Heart', 'Thumbs Up', '좋아요', 'いいね'],
    category: 'social',
    priority: 80
  },
  
  '分享': {
    primary: '分享',
    variants: ['分享', 'Share', 'Send', 'Forward', '공유', 'シェア'],
    category: 'social',
    priority: 80
  },
  
  '评论': {
    primary: '评论',
    variants: ['评论', 'Comment', 'Reply', 'Discuss', '댓글', 'コメント'],
    category: 'social',
    priority: 80
  }
};

/**
 * 根据文本查找所有可能的等价文本
 */
export function findEquivalentTexts(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const normalizedText = text.trim().toLowerCase();
  
  // 查找包含该文本的词典条目
  for (const entry of Object.values(ELEMENT_TEXT_DICTIONARY)) {
    const variants = entry.variants.map(v => v.toLowerCase());
    if (variants.includes(normalizedText)) {
      return [...entry.variants]; // 返回所有变体
    }
  }
  
  // 如果没找到，返回原文本
  return [text];
}

/**
 * 检查两个文本是否等价（支持多语言）
 */
export function areTextsEquivalent(text1: string, text2: string): boolean {
  if (!text1 || !text2) return false;
  if (text1 === text2) return true;
  
  const variants1 = findEquivalentTexts(text1);
  const variants2 = findEquivalentTexts(text2);
  
  // 检查是否有交集
  return variants1.some(v1 => 
    variants2.some(v2 => v1.toLowerCase() === v2.toLowerCase())
  );
}

/**
 * 生成文本的所有变体用于XPath匹配
 */
export function generateTextVariationsForXPath(text: string): string {
  const variants = findEquivalentTexts(text);
  if (variants.length <= 1) {
    return `@text="${text}"`;
  }
  
  // 生成多个or条件
  const conditions = variants.map(variant => `@text="${variant}"`);
  return `(${conditions.join(' or ')})`;
}

/**
 * 获取文本的完整信息（Step 0增强使用）
 */
export function getTextInfo(text: string): TextLookupResult {
  if (!text || !text.trim()) {
    return {
      normalized: text,
      language: undefined,
      synonyms: [],
      type: 'generic',
      found: false
    };
  }

  const cleanText = text.trim();
  
  // 查找匹配的词典条目
  for (const [key, entry] of Object.entries(ELEMENT_TEXT_DICTIONARY)) {
    if (entry.variants.some(variant => 
      variant.toLowerCase() === cleanText.toLowerCase()
    )) {
      return {
        normalized: entry.primary,
        language: detectLanguage(cleanText),
        synonyms: entry.variants.filter(v => v !== entry.primary),
        type: entry.category,
        found: true
      };
    }
  }
  
  // 未找到匹配项的处理
  return {
    normalized: cleanText,
    language: detectLanguage(cleanText),
    synonyms: [],
    type: 'generic',
    found: false
  };
}

/**
 * 简单的语言检测
 */
function detectLanguage(text: string): string {
  // 中文检测
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  
  // 日文检测  
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  
  // 韩文检测
  if (/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/.test(text)) return 'ko';
  
  // 英文检测（默认）
  if (/^[a-zA-Z\s]+$/.test(text)) return 'en';
  
  return 'unknown';
}

/**
 * 按类别获取词典条目
 */
export function getTextsByCategory(category: string): I18nTextEntry[] {
  return Object.values(ELEMENT_TEXT_DICTIONARY)
    .filter(entry => entry.category === category)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * 获取所有支持的语言
 */
export function getSupportedLanguages(): string[] {
  return ['中文', 'English', '한국어', '日本語'];
}