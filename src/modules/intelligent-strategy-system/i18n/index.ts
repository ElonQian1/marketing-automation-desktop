/**
 * i18n模块统一导出
 * 
 * 多语言支持和文本规范化功能
 */

export {
  ELEMENT_TEXT_DICTIONARY,
  findEquivalentTexts,
  areTextsEquivalent,
  generateTextVariationsForXPath,
  getTextInfo,
  type I18nTextEntry,
  type TextLookupResult
} from './ElementTextDictionary';

// 导入用于内部使用
import {
  getTextInfo,
  areTextsEquivalent,
  generateTextVariationsForXPath
} from './ElementTextDictionary';

/**
 * i18n工具类
 */
export class I18nUtils {
  
  /**
   * 批量规范化文本列表
   */
  static normalizeTextList(texts: string[]): Array<{
    original: string;
    normalized: string;
    language?: string;
  }> {
    return texts.map(text => {
      const info = getTextInfo(text);
      return {
        original: text,
        normalized: info.normalized,
        language: info.language
      };
    });
  }

  /**
   * 检查两个文本是否语义等价
   */
  static areEquivalent(text1: string, text2: string): boolean {
    return areTextsEquivalent(text1, text2);
  }

  /**
   * 为XPath生成多语言匹配条件
   */
  static generateMultiLangXPath(text: string): string {
    return generateTextVariationsForXPath(text);
  }
}

/**
 * 默认导出
 */
export default I18nUtils;