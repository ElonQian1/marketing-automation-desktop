// src/modules/structural-matching/domain/constants/field-strategy-presets.ts
// module: structural-matching | layer: domain | role: 字段策略预设
// summary: 为不同字段类型推荐最佳的匹配策略，每个字段都可以独立选择匹配方法

import { FieldType } from './field-types';
import { MatchStrategy, MATCH_STRATEGY_DISPLAY_NAMES, MATCH_STRATEGY_DESCRIPTIONS } from './match-strategies';

/**
 * 字段策略推荐配置
 */
export interface FieldStrategyRecommendation {
  /** 推荐的主要策略 */
  primary: MatchStrategy;
  
  /** 适用的其他策略选项 */
  alternatives: MatchStrategy[];
  
  /** 推荐理由 */
  reason: string;
  
  /** 使用场景描述 */
  useCase: string;
}

/**
 * 每种字段类型的策略推荐
 * 每个字段都可以从这些策略中选择最适合的匹配方法
 */
export const FIELD_STRATEGY_PRESETS: Record<FieldType, FieldStrategyRecommendation> = {
  
  [FieldType.RESOURCE_ID]: {
    primary: MatchStrategy.EXACT_MATCH,
    alternatives: [MatchStrategy.BOTH_NON_EMPTY, MatchStrategy.DISABLED],
    reason: 'Resource-ID通常是唯一标识符，应该精确匹配',
    useCase: '当Resource-ID存在时用于精确定位，不存在时可禁用或采用都非空策略'
  },
  
  [FieldType.CONTENT_DESC]: {
    primary: MatchStrategy.BOTH_NON_EMPTY,
    alternatives: [MatchStrategy.VALUE_SIMILARITY, MatchStrategy.EXACT_MATCH, MatchStrategy.CONSISTENT_EMPTINESS],
    reason: '内容描述经常变化，只要都有描述就说明是同类元素',
    useCase: '笔记标题、按钮描述等文本内容，重点是都有值而非具体值'
  },
  
  [FieldType.TEXT]: {
    primary: MatchStrategy.CONSISTENT_EMPTINESS,
    alternatives: [MatchStrategy.BOTH_NON_EMPTY, MatchStrategy.VALUE_SIMILARITY, MatchStrategy.EXACT_MATCH],
    reason: 'Text字段要保持原有的空/非空状态，维持UI一致性',
    useCase: '界面文本标签，原来空的元素匹配空的，原来有文本的匹配有文本的'
  },
  
  [FieldType.CLASS_NAME]: {
    primary: MatchStrategy.EXACT_MATCH,
    alternatives: [MatchStrategy.VALUE_SIMILARITY, MatchStrategy.DISABLED],
    reason: '类名决定了控件类型，应该保持一致',
    useCase: 'Android控件类型识别，确保匹配相同类型的控件'
  },
  
  [FieldType.CHILDREN_STRUCTURE]: {
    primary: MatchStrategy.STRUCTURE_MATCH,
    alternatives: [MatchStrategy.VALUE_SIMILARITY, MatchStrategy.CONSISTENT_EMPTINESS],
    reason: '子元素结构反映了UI布局，需要结构化比较',
    useCase: '列表项结构、卡片布局等，比较子元素的组成和层次'
  },
  
  [FieldType.BOUNDS]: {
    primary: MatchStrategy.DISABLED,
    alternatives: [MatchStrategy.VALUE_SIMILARITY, MatchStrategy.STRUCTURE_MATCH],
    reason: '位置信息变化频繁，通常不作为主要匹配依据',
    useCase: '屏幕适配后位置会变化，建议禁用或仅作为辅助匹配'
  }
};

/**
 * 获取字段类型的推荐策略
 */
export const getRecommendedStrategy = (fieldType: FieldType): MatchStrategy => {
  return FIELD_STRATEGY_PRESETS[fieldType].primary;
};

/**
 * 获取字段类型的所有可用策略
 */
export const getAvailableStrategies = (fieldType: FieldType): MatchStrategy[] => {
  const preset = FIELD_STRATEGY_PRESETS[fieldType];
  return [preset.primary, ...preset.alternatives];
};

/**
 * 业务场景策略组合预设
 */
export interface ScenarioPreset {
  name: string;
  description: string;
  strategies: Partial<Record<FieldType, MatchStrategy>>;
  useCase: string;
}

/**
 * 常见业务场景的策略组合预设
 */
export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    name: '笔记内容识别',
    description: '适用于识别小红书笔记、文章等内容元素',
    strategies: {
      [FieldType.RESOURCE_ID]: MatchStrategy.EXACT_MATCH,
      [FieldType.CONTENT_DESC]: MatchStrategy.BOTH_NON_EMPTY,  // 标题都非空即可
      [FieldType.TEXT]: MatchStrategy.BOTH_NON_EMPTY,         // 内容都非空即可  
      [FieldType.CLASS_NAME]: MatchStrategy.EXACT_MATCH,
      [FieldType.CHILDREN_STRUCTURE]: MatchStrategy.STRUCTURE_MATCH,
    },
    useCase: '当笔记标题和内容经常变化，但我们只需要确保是同类型的笔记元素'
  },
  
  {
    name: '界面控件匹配',
    description: '适用于按钮、输入框等界面控件的精确匹配',
    strategies: {
      [FieldType.RESOURCE_ID]: MatchStrategy.EXACT_MATCH,
      [FieldType.CONTENT_DESC]: MatchStrategy.EXACT_MATCH,
      [FieldType.TEXT]: MatchStrategy.CONSISTENT_EMPTINESS,    // 保持空/非空一致
      [FieldType.CLASS_NAME]: MatchStrategy.EXACT_MATCH,
      [FieldType.CHILDREN_STRUCTURE]: MatchStrategy.STRUCTURE_MATCH,
    },
    useCase: '当需要精确定位特定的按钮或控件，确保匹配正确的目标'
  },
  
  {
    name: '列表项模糊匹配',
    description: '适用于列表项、卡片等结构相似但内容不同的元素',
    strategies: {
      [FieldType.RESOURCE_ID]: MatchStrategy.DISABLED,        // 列表项通常没有固定ID
      [FieldType.CONTENT_DESC]: MatchStrategy.VALUE_SIMILARITY, // 允许内容相似
      [FieldType.TEXT]: MatchStrategy.VALUE_SIMILARITY,      // 允许文本相似
      [FieldType.CLASS_NAME]: MatchStrategy.EXACT_MATCH,
      [FieldType.CHILDREN_STRUCTURE]: MatchStrategy.STRUCTURE_MATCH,
    },
    useCase: '当需要匹配结构相似的列表项，但具体内容可能不同'
  },
  
  {
    name: '容错性匹配',
    description: '适用于界面经常变化的场景，提供更高的容错性',
    strategies: {
      [FieldType.RESOURCE_ID]: MatchStrategy.BOTH_NON_EMPTY,
      [FieldType.CONTENT_DESC]: MatchStrategy.BOTH_NON_EMPTY,
      [FieldType.TEXT]: MatchStrategy.CONSISTENT_EMPTINESS,
      [FieldType.CLASS_NAME]: MatchStrategy.VALUE_SIMILARITY,
      [FieldType.CHILDREN_STRUCTURE]: MatchStrategy.VALUE_SIMILARITY,
    },
    useCase: '当App版本更新频繁，需要较强的适应性和容错能力'
  }
];

/**
 * 策略选择指南
 */
export const STRATEGY_SELECTION_GUIDE: Record<MatchStrategy, {
  bestFor: string[];
  avoid: string[];
  tips: string;
}> = {
  [MatchStrategy.EXACT_MATCH]: {
    bestFor: ['Resource-ID', '固定的类名', '不变的标识文本'],
    avoid: ['动态内容', '用户生成内容', '经常变化的文本'],
    tips: '适用于稳定不变的标识性字段，提供最高的匹配精度'
  },
  
  [MatchStrategy.BOTH_NON_EMPTY]: {
    bestFor: ['笔记标题', '用户昵称', '动态内容标识'],
    avoid: ['可能为空的字段', '需要精确匹配的控件'],
    tips: '最适合"都非空即可"的场景，关注存在性而非具体值'
  },
  
  [MatchStrategy.CONSISTENT_EMPTINESS]: {
    bestFor: ['Text字段', '可选的描述信息', 'UI状态保持'],
    avoid: ['必须有值的字段', '完全动态的内容'],
    tips: '保持原有的空/非空状态，维护UI的一致性表现'
  },
  
  [MatchStrategy.VALUE_SIMILARITY]: {
    bestFor: ['相似但不完全相同的内容', '有拼写变化的文本'],
    avoid: ['需要精确匹配的标识符', '布尔型属性'],
    tips: '允许内容有一定差异，适合处理文本变体和近似匹配'
  },
  
  [MatchStrategy.STRUCTURE_MATCH]: {
    bestFor: ['子元素结构', '布局层次', '组件组成'],
    avoid: ['简单的文本字段', '单一属性'],
    tips: '专门用于比较复杂的结构化数据，如子元素列表'
  },
  
  [MatchStrategy.DISABLED]: {
    bestFor: ['不重要的字段', '经常变化的位置信息'],
    avoid: ['关键的识别字段', '主要的匹配依据'],
    tips: '完全忽略该字段，适合去除干扰因素或不可靠的属性'
  }
};

/**
 * 根据使用场景获取推荐的策略配置
 */
export const getScenarioPreset = (scenarioName: string): ScenarioPreset | undefined => {
  return SCENARIO_PRESETS.find(preset => preset.name === scenarioName);
};

/**
 * 创建字段策略选择器的数据
 */
export const createFieldStrategyOptions = (fieldType: FieldType) => {
  const availableStrategies = getAvailableStrategies(fieldType);
  const recommended = getRecommendedStrategy(fieldType);
  
  return availableStrategies.map(strategy => ({
    value: strategy,
    label: MATCH_STRATEGY_DISPLAY_NAMES[strategy],
    description: MATCH_STRATEGY_DESCRIPTIONS[strategy],
    isRecommended: strategy === recommended,
    guide: STRATEGY_SELECTION_GUIDE[strategy]
  }));
};

export default {
  FIELD_STRATEGY_PRESETS,
  SCENARIO_PRESETS,
  STRATEGY_SELECTION_GUIDE,
  getRecommendedStrategy,
  getAvailableStrategies,
  getScenarioPreset,
  createFieldStrategyOptions
};