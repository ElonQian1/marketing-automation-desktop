// src/modules/structural-matching/domain/constants/element-templates.ts
// module: structural-matching | layer: domain | role: 元素配置模板
// summary: 为不同类型的元素提供预设的配置模板

import { FieldType } from './field-types';
import { MatchStrategy } from './match-strategies';
import { HierarchicalFieldConfig, FieldConfig } from '../models/hierarchical-field-config';

/**
 * 元素类型枚举
 */
export enum ElementType {
  /** 笔记卡片 */
  NOTE_CARD = 'note_card',
  
  /** 普通按钮 */
  BUTTON = 'button',
  
  /** 输入框 */
  INPUT_FIELD = 'input_field',
  
  /** 列表项 */
  LIST_ITEM = 'list_item',
  
  /** 通用容器 */
  CONTAINER = 'container',
  
  /** 未知类型 */
  UNKNOWN = 'unknown',
}

/**
 * 元素类型的配置模板
 */
export interface ElementTemplate {
  /** 元素类型 */
  type: ElementType;
  
  /** 模板名称 */
  name: string;
  
  /** 模板描述 */
  description: string;
  
  /** 默认全局阈值 */
  defaultThreshold: number;
  
  /** 层级配置模板 */
  layerConfigs: Array<{
    /** 层级路径模式 */
    pathPattern: string;
    
    /** 层级描述 */
    description: string;
    
    /** 字段配置 */
    fieldConfigs: Record<FieldType, Partial<FieldConfig> & { strategy: MatchStrategy }>;
  }>;
}

/**
 * 笔记卡片模板配置
 */
export const NOTE_CARD_TEMPLATE: ElementTemplate = {
  type: ElementType.NOTE_CARD,
  name: '笔记卡片',
  description: '小红书笔记卡片，包含图片、标题、作者信息',
  defaultThreshold: 0.75,
  
  layerConfigs: [
    {
      pathPattern: 'root-0', // 外层容器
      description: '外层容器 - 笔记卡片外框',
      fieldConfigs: {
        [FieldType.RESOURCE_ID]: {
          enabled: true,
          weight: 1.5,
          strategy: MatchStrategy.EXACT_MATCH,
        },
        [FieldType.CONTENT_DESC]: {
          enabled: true,
          weight: 1.2,
          strategy: MatchStrategy.BOTH_NON_EMPTY, // 笔记标题，只要都非空就行
        },
        [FieldType.CLASS_NAME]: {
          enabled: true,
          weight: 0.8,
          strategy: MatchStrategy.EXACT_MATCH,
        },
        [FieldType.TEXT]: {
          enabled: false, // 不检查外层文本
          weight: 0,
          strategy: MatchStrategy.DISABLED,
        },
        [FieldType.BOUNDS]: {
          enabled: false, // 不检查位置
          weight: 0,
          strategy: MatchStrategy.DISABLED,
        },
        [FieldType.CHILDREN_STRUCTURE]: {
          enabled: true,
          weight: 1.3,
          strategy: MatchStrategy.STRUCTURE_MATCH, // 子元素结构要一致
        },
      },
    },
    {
      pathPattern: 'root-0-0', // 第1层 - 可点击层
      description: '第1层 - 真正可点击的层',
      fieldConfigs: {
        [FieldType.RESOURCE_ID]: {
          enabled: true,
          weight: 1.0,
          strategy: MatchStrategy.EXACT_MATCH,
        },
        [FieldType.CLASS_NAME]: {
          enabled: true,
          weight: 0.8,
          strategy: MatchStrategy.EXACT_MATCH,
        },
        [FieldType.CONTENT_DESC]: {
          enabled: false,
          weight: 0,
          strategy: MatchStrategy.DISABLED,
        },
        [FieldType.TEXT]: {
          enabled: false,
          weight: 0,
          strategy: MatchStrategy.DISABLED,
        },
        [FieldType.BOUNDS]: {
          enabled: false,
          weight: 0,
          strategy: MatchStrategy.DISABLED,
        },
        [FieldType.CHILDREN_STRUCTURE]: {
          enabled: true,
          weight: 1.2,
          strategy: MatchStrategy.STRUCTURE_MATCH,
        },
      },
    },
    {
      pathPattern: 'root-0-0-0', // 第2层 - 内容容器
      description: '第2层 - 内容容器',
      fieldConfigs: {
        [FieldType.RESOURCE_ID]: {
          enabled: true,
          weight: 1.0,
          strategy: MatchStrategy.BOTH_NON_EMPTY,
        },
        [FieldType.CLASS_NAME]: {
          enabled: true,
          weight: 0.8,
          strategy: MatchStrategy.EXACT_MATCH,
        },
        [FieldType.CONTENT_DESC]: {
          enabled: false,
          weight: 0,
          strategy: MatchStrategy.DISABLED,
        },
        [FieldType.TEXT]: {
          enabled: false,
          weight: 0,
          strategy: MatchStrategy.DISABLED,
        },
        [FieldType.BOUNDS]: {
          enabled: false,
          weight: 0,
          strategy: MatchStrategy.DISABLED,
        },
        [FieldType.CHILDREN_STRUCTURE]: {
          enabled: true,
          weight: 1.1,
          strategy: MatchStrategy.STRUCTURE_MATCH,
        },
      },
    },
    {
      pathPattern: 'root-0-0-0-*', // 底部作者栏及其子元素
      description: '底部作者栏 - 包含头像、作者名、点赞等',
      fieldConfigs: {
        [FieldType.RESOURCE_ID]: {
          enabled: true,
          weight: 1.0,
          strategy: MatchStrategy.BOTH_NON_EMPTY,
        },
        [FieldType.TEXT]: {
          enabled: true,
          weight: 0.9,
          strategy: MatchStrategy.CONSISTENT_EMPTINESS, // 保持空/非空一致
        },
        [FieldType.CONTENT_DESC]: {
          enabled: true,
          weight: 0.7,
          strategy: MatchStrategy.CONSISTENT_EMPTINESS,
        },
        [FieldType.CLASS_NAME]: {
          enabled: true,
          weight: 0.6,
          strategy: MatchStrategy.EXACT_MATCH,
        },
        [FieldType.BOUNDS]: {
          enabled: false,
          weight: 0,
          strategy: MatchStrategy.DISABLED,
        },
        [FieldType.CHILDREN_STRUCTURE]: {
          enabled: false,
          weight: 0,
          strategy: MatchStrategy.DISABLED,
        },
      },
    },
  ],
};

/**
 * 通用按钮模板配置
 */
export const BUTTON_TEMPLATE: ElementTemplate = {
  type: ElementType.BUTTON,
  name: '通用按钮',
  description: '可点击的按钮元素',
  defaultThreshold: 0.8,
  
  layerConfigs: [
    {
      pathPattern: 'root-0',
      description: '按钮主体',
      fieldConfigs: {
        [FieldType.RESOURCE_ID]: {
          enabled: true,
          weight: 1.8,
          strategy: MatchStrategy.EXACT_MATCH,
        },
        [FieldType.TEXT]: {
          enabled: true,
          weight: 1.2,
          strategy: MatchStrategy.BOTH_NON_EMPTY,
        },
        [FieldType.CONTENT_DESC]: {
          enabled: true,
          weight: 1.0,
          strategy: MatchStrategy.BOTH_NON_EMPTY,
        },
        [FieldType.CLASS_NAME]: {
          enabled: true,
          weight: 0.8,
          strategy: MatchStrategy.EXACT_MATCH,
        },
        [FieldType.BOUNDS]: {
          enabled: false,
          weight: 0,
          strategy: MatchStrategy.DISABLED,
        },
        [FieldType.CHILDREN_STRUCTURE]: {
          enabled: false,
          weight: 0,
          strategy: MatchStrategy.DISABLED,
        },
      },
    },
  ],
};

/**
 * 所有模板的映射
 */
export const ELEMENT_TEMPLATES: Record<ElementType, ElementTemplate> = {
  [ElementType.NOTE_CARD]: NOTE_CARD_TEMPLATE,
  [ElementType.BUTTON]: BUTTON_TEMPLATE,
  [ElementType.INPUT_FIELD]: BUTTON_TEMPLATE, // 暂时复用按钮模板
  [ElementType.LIST_ITEM]: BUTTON_TEMPLATE,   // 暂时复用按钮模板
  [ElementType.CONTAINER]: BUTTON_TEMPLATE,   // 暂时复用按钮模板
  [ElementType.UNKNOWN]: BUTTON_TEMPLATE,     // 暂时复用按钮模板
};

/**
 * 根据元素特征识别元素类型
 */
export const detectElementType = (element: Record<string, unknown>): ElementType => {
  const contentDesc = String(element.content_desc || element.contentDesc || '').toLowerCase();
  const resourceId = String(element.resource_id || element.resourceId || '');
  const className = String(element.class_name || element.className || '');
  
  // 检查是否为笔记卡片
  if (
    contentDesc.includes('笔记') || 
    contentDesc.includes('来自') ||
    contentDesc.includes('赞') ||
    resourceId.includes('note') ||
    resourceId.includes('card')
  ) {
    return ElementType.NOTE_CARD;
  }
  
  // 检查是否为按钮
  if (
    className.includes('Button') ||
    element.clickable === true
  ) {
    return ElementType.BUTTON;
  }
  
  return ElementType.UNKNOWN;
};

/**
 * 根据元素类型获取配置模板
 */
export const getElementTemplate = (type: ElementType): ElementTemplate => {
  return ELEMENT_TEMPLATES[type] || ELEMENT_TEMPLATES[ElementType.UNKNOWN];
};