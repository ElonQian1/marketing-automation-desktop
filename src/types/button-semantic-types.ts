// src/types/button-semantic-types.ts
// module: types | layer: domain | role: 按钮语义识别类型定义（防混淆专用）
// summary: 定义按钮类型语义识别相关的类型，避免"已关注"vs"关注"混淆

/**
 * 🚨 按钮语义类型枚举 - 核心区分"已关注"和"关注" 
 * 
 * ⚠️ 重要：此枚举专门用于解决按钮类型混淆问题
 * 禁止修改枚举值，任何更改都可能导致按钮识别错误
 */
export enum ButtonSemanticType {
  /**
   * 🟢 已关注状态按钮
   * - 显示文本："已关注"、"关注中"、"Following"、"Followed" 
   * - 用户行为：点击后通常变为"关注"或取消关注
   * - 颜色通常：灰色、绿色等非主色调
   */
  ALREADY_FOLLOWING = 'already-following',

  /**
   * 🔵 待关注状态按钮  
   * - 显示文本："关注"、"+关注"、"Follow"、"关注TA"
   * - 用户行为：点击后通常变为"已关注" 
   * - 颜色通常：蓝色、红色等主色调
   */
  FOLLOW = 'follow',

  /**
   * ⚪ 其他类型按钮
   * - 不是关注相关的按钮 
   * - 例如："添加好友"、"私信"、"分享"等
   */
  OTHER = 'other',

  /**
   * ❌ 未识别类型
   * - 无法确定按钮类型时的默认值
   * - 需要人工检查或系统优化
   */
  UNKNOWN = 'unknown'
}

/**
 * 按钮文本到语义类型的映射规则
 * 🎯 用于智能分析时的按钮类型判断
 */
export const BUTTON_TEXT_SEMANTIC_MAPPING: Record<string, ButtonSemanticType> = {
  // 已关注状态相关文本
  '已关注': ButtonSemanticType.ALREADY_FOLLOWING,
  '关注中': ButtonSemanticType.ALREADY_FOLLOWING, 
  'Following': ButtonSemanticType.ALREADY_FOLLOWING,
  'Followed': ButtonSemanticType.ALREADY_FOLLOWING,
  '已互关': ButtonSemanticType.ALREADY_FOLLOWING,
  '互相关注': ButtonSemanticType.ALREADY_FOLLOWING,

  // 待关注状态相关文本  
  '关注': ButtonSemanticType.FOLLOW,
  '+关注': ButtonSemanticType.FOLLOW,
  'Follow': ButtonSemanticType.FOLLOW,
  '关注TA': ButtonSemanticType.FOLLOW,
  '立即关注': ButtonSemanticType.FOLLOW,

  // 其他类型按钮
  '添加好友': ButtonSemanticType.OTHER,
  '私信': ButtonSemanticType.OTHER,
  '分享': ButtonSemanticType.OTHER,
  '举报': ButtonSemanticType.OTHER,
  '拉黑': ButtonSemanticType.OTHER,
};

/**
 * 🚨 互斥排除规则配置
 * 防止按钮类型交叉污染的核心规则
 */
export interface ButtonExclusionRules {
  /** 当识别为"已关注"类型时需要排除的文本 */
  alreadyFollowingExclusions: string[];
  /** 当识别为"关注"类型时需要排除的文本 */ 
  followExclusions: string[];
}

/**
 * 🎯 默认排除规则配置
 * ⚠️ 修改前请确保理解每个规则的作用
 */
export const DEFAULT_BUTTON_EXCLUSION_RULES: ButtonExclusionRules = {
  alreadyFollowingExclusions: [
    '关注',      // 排除普通"关注"按钮
    '+关注',     // 排除"添加关注"按钮  
    'Follow',    // 排除英文"Follow"按钮
    '添加关注',   // 排除"添加关注"按钮
    '立即关注',   // 排除"立即关注"按钮
    '关注TA',    // 排除"关注TA"按钮
  ],
  followExclusions: [
    '已关注',    // 排除"已关注"按钮
    '关注中',    // 排除"关注中"状态按钮
    'Following', // 排除英文"Following"状态按钮
    '取消关注',   // 排除"取消关注"按钮  
    '已互关',    // 排除"已互关"状态按钮
    'Followed',  // 排除英文"Followed"状态按钮
  ],
};

/**
 * 按钮语义识别结果
 * 🧪 用于测试和调试的结果结构
 */
export interface ButtonSemanticRecognitionResult {
  /** 识别出的按钮类型 */
  buttonType: ButtonSemanticType;
  /** 置信度分数 (0-1) */
  confidence: number;
  /** 匹配到的文本 */
  matchedText: string;
  /** 应用的排除规则 */
  appliedExclusions: string[];
  /** 调试信息 */
  debugInfo: {
    /** 原始元素文本 */
    originalText: string;
    /** 识别过程日志 */
    recognitionSteps: string[];
    /** 是否使用了排除规则 */
    exclusionRuleApplied: boolean;
  };
}

/**
 * 🎯 按钮语义识别配置
 * 用于智能分析系统的配置参数
 */
export interface ButtonSemanticRecognitionConfig {
  /** 是否启用智能语义识别 */
  enableSemanticRecognition: boolean;
  /** 是否启用排除规则 */
  enableExclusionRules: boolean;
  /** 自定义排除规则（覆盖默认规则） */
  customExclusionRules?: Partial<ButtonExclusionRules>;
  /** 最小置信度阈值 */
  minimumConfidence: number;
  /** 是否记录详细调试信息 */
  enableDebugLogging: boolean;
}

/**
 * 🔍 默认按钮语义识别配置
 * ✅ 推荐在生产环境中使用的安全配置
 */
export const DEFAULT_BUTTON_SEMANTIC_CONFIG: ButtonSemanticRecognitionConfig = {
  enableSemanticRecognition: true,
  enableExclusionRules: true,
  minimumConfidence: 0.8,
  enableDebugLogging: true, // 生产环境可设为false
};

/**
 * 🚨 按钮类型混淆检测器
 * 用于检测和预防"已关注"vs"关注"类型混淆
 */
export class ButtonTypeConfusionDetector {
  /**
   * 检测文本是否可能导致按钮类型混淆
   * @param text 按钮文本
   * @returns 混淆风险评估
   */
  static detectConfusionRisk(text: string): {
    hasRisk: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    reason: string;
    suggestions: string[];
  } {
    const normalizedText = text.trim().toLowerCase();

    // 高风险：包含关注相关但不明确的文本
    const highRiskPatterns = ['关注', 'follow'];
    const isHighRisk = highRiskPatterns.some(pattern => 
      normalizedText.includes(pattern) && 
      !normalizedText.includes('已') && 
      !normalizedText.includes('ing')
    );

    if (isHighRisk) {
      return {
        hasRisk: true,
        riskLevel: 'high',
        reason: '文本包含"关注"但缺乏明确状态标识',
        suggestions: [
          '检查是否为"已关注"状态按钮',
          '确认排除规则是否正确应用',
          '验证V3智能分析是否启用'
        ]
      };
    }

    // 中等风险：包含相似文本
    const mediumRiskPatterns = ['关', '注', 'foll'];
    const isMediumRisk = mediumRiskPatterns.some(pattern => 
      normalizedText.includes(pattern)
    );

    if (isMediumRisk) {
      return {
        hasRisk: true,
        riskLevel: 'medium', 
        reason: '文本包含可能混淆的字符',
        suggestions: [
          '人工确认按钮实际状态',
          '检查上下文信息'
        ]
      };
    }

    return {
      hasRisk: false,
      riskLevel: 'low',
      reason: '文本清晰，混淆风险较低',
      suggestions: []
    };
  }

  /**
   * 验证排除规则是否正确应用
   * @param buttonType 识别的按钮类型
   * @param targetText 目标文本  
   * @param appliedExclusions 应用的排除规则
   * @returns 验证结果
   */
  static validateExclusionRules(
    buttonType: ButtonSemanticType,
    targetText: string,
    appliedExclusions: string[]
  ): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 检查"已关注"类型是否错误排除了"关注"
    if (buttonType === ButtonSemanticType.ALREADY_FOLLOWING) {
      if (targetText.includes('关注') && !appliedExclusions.includes('关注')) {
        issues.push('识别为"已关注"类型但未排除"关注"文本');
        recommendations.push('检查排除规则配置是否正确');
      }
    }

    // 检查"关注"类型是否错误排除了"已关注"
    if (buttonType === ButtonSemanticType.FOLLOW) {
      if (targetText.includes('已关注') && !appliedExclusions.includes('已关注')) {
        issues.push('识别为"关注"类型但未排除"已关注"文本');
        recommendations.push('检查排除规则配置是否正确');
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }
}