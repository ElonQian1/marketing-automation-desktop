// src/components/text-matching/core/TextMatchingEngine.ts
// module: text-matching | layer: core | role: 文本匹配引擎
// summary: 实现绝对匹配和智能匹配的核心逻辑

import type { TextMatchingConfig, AntonymPair } from '../types';

export interface MatchResult {
  matched: boolean;
  confidence: number;
  method: 'exact' | 'partial' | 'semantic' | 'antonym_detected';
  reason: string;
  debugInfo?: any;
}

export class TextMatchingEngine {
  private config: TextMatchingConfig;
  private antonymPairs: AntonymPair[];

  constructor(config: TextMatchingConfig, antonymPairs: AntonymPair[] = []) {
    this.config = config;
    this.antonymPairs = antonymPairs.filter(pair => pair.enabled);
  }

  /**
   * 主要的文本匹配方法
   */
  match(targetText: string, candidateText: string): MatchResult {
    if (!this.config.enabled) {
      return {
        matched: false,
        confidence: 0,
        method: 'exact',
        reason: '文本匹配功能已禁用'
      };
    }

    // 绝对匹配模式
    if (this.config.mode === 'exact') {
      return this.exactMatch(targetText, candidateText);
    }

    // 部分匹配模式
    return this.partialMatch(targetText, candidateText);
  }

  /**
   * 绝对匹配：只有完全相同才匹配
   */
  private exactMatch(targetText: string, candidateText: string): MatchResult {
    const normalizedTarget = this.normalizeText(targetText);
    const normalizedCandidate = this.normalizeText(candidateText);
    
    const matched = normalizedTarget === normalizedCandidate;
    
    return {
      matched,
      confidence: matched ? 1.0 : 0.0,
      method: 'exact',
      reason: matched ? '文本完全匹配' : '文本不完全匹配',
      debugInfo: {
        normalizedTarget,
        normalizedCandidate
      }
    };
  }

  /**
   * 部分匹配：智能匹配，包括包含关系、反义词检测、语义分析
   */
  private partialMatch(targetText: string, candidateText: string): MatchResult {
    const normalizedTarget = this.normalizeText(targetText);
    const normalizedCandidate = this.normalizeText(candidateText);

    // 1. 首先检查反义词关系
    if (this.config.antonymCheckEnabled) {
      const antonymResult = this.checkAntonyms(normalizedTarget, normalizedCandidate);
      if (antonymResult.isAntonym) {
        return {
          matched: false,
          confidence: 0.1, // 很低的置信度，表示检测到反义关系
          method: 'antonym_detected',
          reason: `检测到反义词关系: ${antonymResult.reason}`,
          debugInfo: antonymResult
        };
      }
    }

    // 2. 包含关系检查
    const containsResult = this.checkContains(normalizedTarget, normalizedCandidate);
    if (containsResult.matched) {
      return containsResult;
    }

    // 3. 语义分析
    if (this.config.semanticAnalysisEnabled) {
      const semanticResult = this.semanticAnalysis(normalizedTarget, normalizedCandidate);
      if (semanticResult.confidence >= this.config.partialMatchThreshold) {
        return semanticResult;
      }
    }

    // 4. 无匹配
    return {
      matched: false,
      confidence: 0.0,
      method: 'partial',
      reason: '未找到匹配关系',
      debugInfo: {
        normalizedTarget,
        normalizedCandidate,
        threshold: this.config.partialMatchThreshold
      }
    };
  }

  /**
   * 检查包含关系
   */
  private checkContains(targetText: string, candidateText: string): MatchResult {
    if (candidateText.includes(targetText)) {
      return {
        matched: true,
        confidence: 0.9,
        method: 'partial',
        reason: `候选文本包含目标文本 "${targetText}"`
      };
    }

    if (targetText.includes(candidateText)) {
      return {
        matched: true,
        confidence: 0.8,
        method: 'partial',
        reason: `目标文本包含候选文本 "${candidateText}"`
      };
    }

    return {
      matched: false,
      confidence: 0,
      method: 'partial',
      reason: '无包含关系'
    };
  }

  /**
   * 反义词检测
   */
  private checkAntonyms(targetText: string, candidateText: string) {
    for (const pair of this.antonymPairs) {
      const positiveInTarget = targetText.includes(pair.positive.toLowerCase());
      const negativeInTarget = targetText.includes(pair.negative.toLowerCase());
      const positiveInCandidate = candidateText.includes(pair.positive.toLowerCase());
      const negativeInCandidate = candidateText.includes(pair.negative.toLowerCase());

      // 检测反义关系
      if (
        (positiveInTarget && negativeInCandidate) ||
        (negativeInTarget && positiveInCandidate)
      ) {
        return {
          isAntonym: true,
          pair,
          reason: `${pair.positive} ⟷ ${pair.negative}`,
          confidence: pair.confidence || 0.8
        };
      }
    }

    return { isAntonym: false, pair: null, reason: '', confidence: 0 };
  }

  /**
   * 简单的语义分析（可以扩展为更复杂的算法）
   */
  private semanticAnalysis(targetText: string, candidateText: string): MatchResult {
    // 简单的同义词检测
    const synonymGroups = [
      ['点击', '触摸', '按下', '选择', '激活'],
      ['关注', '订阅', '追踪', '跟随'],
      ['取消', '撤销', '退出', '停止'],
      ['确认', '同意', '接受', '是'],
      ['拒绝', '否定', '不', '取消']
    ];

    for (const group of synonymGroups) {
      const targetInGroup = group.some(word => targetText.includes(word));
      const candidateInGroup = group.some(word => candidateText.includes(word));
      
      if (targetInGroup && candidateInGroup) {
        return {
          matched: true,
          confidence: 0.7,
          method: 'semantic',
          reason: `语义相关: 同义词组匹配`,
          debugInfo: { synonymGroup: group }
        };
      }
    }

    // 字符相似度检测
    const similarity = this.calculateSimilarity(targetText, candidateText);
    if (similarity >= 0.6) {
      return {
        matched: true,
        confidence: similarity,
        method: 'semantic',
        reason: `字符相似度: ${(similarity * 100).toFixed(0)}%`,
        debugInfo: { similarity }
      };
    }

    return {
      matched: false,
      confidence: similarity,
      method: 'semantic',
      reason: `语义相似度不足: ${(similarity * 100).toFixed(0)}%`,
      debugInfo: { similarity }
    };
  }

  /**
   * 计算字符串相似度（Levenshtein距离）
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
  }

  /**
   * 文本标准化
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // 多个空格合并为一个
      .replace(/[^\w\s\u4e00-\u9fff]/g, ''); // 移除特殊字符，保留中文
  }

  /**
   * 更新配置
   */
  updateConfig(config: TextMatchingConfig) {
    this.config = config;
  }

  /**
   * 更新反义词对
   */
  updateAntonymPairs(pairs: AntonymPair[]) {
    this.antonymPairs = pairs.filter(pair => pair.enabled);
  }

  /**
   * 获取当前配置
   */
  getConfig(): TextMatchingConfig {
    return { ...this.config };
  }

  /**
   * 批量匹配
   */
  batchMatch(targetText: string, candidates: string[]): MatchResult[] {
    return candidates.map(candidate => this.match(targetText, candidate));
  }

  /**
   * 找到最佳匹配
   */
  findBestMatch(targetText: string, candidates: string[]): { result: MatchResult; index: number; candidate: string } | null {
    const results = this.batchMatch(targetText, candidates);
    let bestIndex = -1;
    let bestResult: MatchResult | null = null;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.matched && (bestResult === null || result.confidence > bestResult.confidence)) {
        bestResult = result;
        bestIndex = i;
      }
    }

    if (bestResult && bestIndex >= 0) {
      return {
        result: bestResult,
        index: bestIndex,
        candidate: candidates[bestIndex]
      };
    }

    return null;
  }
}