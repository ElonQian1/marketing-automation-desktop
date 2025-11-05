// src/modules/structural-matching/services/structural-matching-config-service.ts
// module: structural-matching | layer: services | role: 结构匹配默认配置服务
// summary: 提供结构匹配默认配置功能，独立于UI组件，可被其他功能调用

import { FieldType } from "../domain/constants/field-types";
import { MatchStrategy } from "../domain/constants/match-strategies";
import { 
  SkeletonMatchMode, 
  FieldMatchStrategy, 
  getDefaultFieldStrategy
} from "../domain/skeleton-match-strategy";

/**
 * 结构匹配配置参数
 */
export interface StructuralMatchingConfigOptions {
  /** 骨架匹配模式 */
  mode?: SkeletonMatchMode;
  /** 是否忽略易变字段 */
  ignoreVolatileFields?: boolean;
  /** 是否启用智能配置 */
  enableSmartConfig?: boolean;
}

/**
 * 字段配置结果
 */
export interface FieldConfigResult {
  /** 是否启用该字段 */
  enabled: boolean;
  /** 匹配策略 */
  strategy: MatchStrategy;
  /** 是否有意义（参与骨架匹配） */
  isMeaningful: boolean;
  /** 配置原因说明 */
  reason: string;
}

/**
 * 元素配置结果
 */
export interface ElementConfigResult {
  /** 元素路径 */
  elementPath: string;
  /** 字段配置映射 */
  fieldConfigs: Record<string, FieldConfigResult>;
  /** 有意义字段数量 */
  meaningfulFieldCount: number;
  /** 总启用字段数量 */
  enabledFieldCount: number;
}

/**
 * 判断字段是否有意义（骨架匹配核心逻辑）
 */
export const isFieldMeaningful = (fieldType: FieldType, value: string): boolean => {
  // 🎯 骨架匹配逻辑：聚焦于所点选子树的字段特征，不考虑全局常态
  
  // 空值过滤：空值对骨架没有贡献
  if (!value || value === "(空)" || value === "") return false;
  
  switch (fieldType) {
    // 文本类字段：非空即参与骨架匹配（内容是骨架的一部分）
    case FieldType.TEXT:
    case FieldType.RESOURCE_ID:
    case FieldType.CONTENT_DESC:
      return true;
    
    // 结构字段：总是参与骨架匹配
    case FieldType.CLASS_NAME:
    case FieldType.BOUNDS:
      return true;
    
    // 布尔字段：只有非默认状态才是有意义的骨架特征
    case FieldType.ENABLED:
      return value === "false"; // 大部分元素enabled=true，禁用状态才有意义
    
    case FieldType.CLICKABLE:
    case FieldType.FOCUSABLE:
    case FieldType.SCROLLABLE:
    case FieldType.LONG_CLICKABLE:
    case FieldType.CHECKABLE:
    case FieldType.SELECTED:
    case FieldType.CHECKED:
    case FieldType.PASSWORD:
      return value === "true"; // 大部分元素这些属性=false，true状态才有意义
    
    case FieldType.FOCUSED:
      return value === "true"; // focused=false是默认状态，true才有意义
    
    // 其他字段：暂不参与骨架匹配
    default:
      return false;
  }
};

/**
 * 将FieldMatchStrategy映射到MatchStrategy
 */
const mapFieldStrategyToMatchStrategy = (
  fieldStrategy: FieldMatchStrategy, 
  fieldType: FieldType
): MatchStrategy => {
  switch (fieldStrategy) {
    case FieldMatchStrategy.EQUALS:
      return MatchStrategy.EXACT_MATCH;
    case FieldMatchStrategy.EXISTS:
      if ([FieldType.TEXT, FieldType.CONTENT_DESC].includes(fieldType)) {
        return MatchStrategy.BOTH_NON_EMPTY;
      } else {
        return MatchStrategy.CONSISTENT_EMPTINESS;
      }
    case FieldMatchStrategy.CONTAINS:
      // TODO: 需要扩展MatchStrategy支持包含匹配
      return MatchStrategy.BOTH_NON_EMPTY;
    case FieldMatchStrategy.PATTERN:
      // TODO: 需要扩展MatchStrategy支持模式匹配
      return MatchStrategy.BOTH_NON_EMPTY;
    case FieldMatchStrategy.IGNORE:
      return MatchStrategy.CONSISTENT_EMPTINESS;
    default:
      return MatchStrategy.CONSISTENT_EMPTINESS;
  }
};

/**
 * 为单个字段生成智能配置
 */
export const generateSmartFieldConfig = (
  fieldType: FieldType, 
  value: string, 
  options: StructuralMatchingConfigOptions = {}
): FieldConfigResult => {
  const {
    mode = SkeletonMatchMode.FAMILY,
    ignoreVolatileFields = false,
    enableSmartConfig = true
  } = options;

  // 判断字段是否有意义
  const isMeaningful = isFieldMeaningful(fieldType, value);
  
  if (!enableSmartConfig) {
    // 不启用智能配置时，返回基本配置
    return {
      enabled: false,
      strategy: MatchStrategy.CONSISTENT_EMPTINESS,
      isMeaningful,
      reason: "智能配置已禁用，使用基本配置"
    };
  }

  // 获取字段类型对应的策略配置
  const fieldTypeStr = Object.keys(FieldType).find(
    key => FieldType[key as keyof typeof FieldType] === fieldType
  ) || 'OTHER';
  
  const strategyConfig = getDefaultFieldStrategy(fieldTypeStr, mode, ignoreVolatileFields);
  
  // 🎯 核心策略：有意义的字段自动启用
  const enabled = isMeaningful && strategyConfig.enabled;
  
  // 🔧 根据骨架匹配模式和字段策略确定匹配策略
  let strategy = MatchStrategy.CONSISTENT_EMPTINESS;
  let reason = "字段无意义，不参与匹配";
  
  if (isMeaningful) {
    strategy = mapFieldStrategyToMatchStrategy(strategyConfig.strategy, fieldType);
    
    if (enabled) {
      reason = `有意义字段自动启用 (${mode}模式: ${strategyConfig.description})`;
    } else {
      reason = `有意义但默认禁用: ${strategyConfig.description}`;
    }
    
    if (ignoreVolatileFields && strategyConfig.isVolatile) {
      reason += " [易变字段已忽略]";
    }
  }
  
  return {
    enabled,
    strategy,
    isMeaningful,
    reason
  };
};

/**
 * 为整个元素生成智能配置
 */
export const generateElementSmartConfig = (
  element: Record<string, unknown>,
  elementPath: string,
  options: StructuralMatchingConfigOptions = {}
): ElementConfigResult => {
  const fieldConfigs: Record<string, FieldConfigResult> = {};
  let meaningfulFieldCount = 0;
  let enabledFieldCount = 0;

  // 遍历所有字段类型
  const allFieldTypes = Object.values(FieldType);
  
  allFieldTypes.forEach(fieldType => {
    // 获取字段值
    let value = "";
    switch (fieldType) {
      case FieldType.TEXT:
        value = String(element.text || "");
        break;
      case FieldType.CLASS_NAME:
        value = String(element.class_name || element.className || "");
        break;
      case FieldType.RESOURCE_ID:
        value = String(element.resource_id || element.resourceId || "");
        break;
      case FieldType.CONTENT_DESC:
        value = String(element.content_desc || element.contentDesc || "");
        break;
      case FieldType.CLICKABLE:
        value = String(element.clickable || false);
        break;
      case FieldType.ENABLED:
        value = String(element.enabled || false);
        break;
      case FieldType.FOCUSABLE:
        value = String(element.focusable || false);
        break;
      case FieldType.FOCUSED:
        value = String(element.focused || false);
        break;
      case FieldType.SCROLLABLE:
        value = String(element.scrollable || false);
        break;
      case FieldType.LONG_CLICKABLE:
        value = String(element.long_clickable || element.longClickable || false);
        break;
      case FieldType.CHECKABLE:
        value = String(element.checkable || false);
        break;
      case FieldType.CHECKED:
        value = String(element.checked || false);
        break;
      case FieldType.SELECTED:
        value = String(element.selected || false);
        break;
      case FieldType.PASSWORD:
        value = String(element.password || false);
        break;
      case FieldType.BOUNDS:
        value = String(element.bounds || "");
        break;
      default:
        value = "";
    }

    // 生成字段配置
    const fieldConfig = generateSmartFieldConfig(fieldType, value, options);
    fieldConfigs[fieldType] = fieldConfig;

    // 统计计数
    if (fieldConfig.isMeaningful) {
      meaningfulFieldCount++;
    }
    if (fieldConfig.enabled) {
      enabledFieldCount++;
    }
  });

  return {
    elementPath,
    fieldConfigs,
    meaningfulFieldCount,
    enabledFieldCount
  };
};

/**
 * 为元素树生成智能配置
 */
export const generateTreeSmartConfig = (
  elements: Record<string, unknown>[],
  options: StructuralMatchingConfigOptions = {}
): ElementConfigResult[] => {
  return elements.map((element, index) => {
    const elementPath = `element-${index}`;
    return generateElementSmartConfig(element, elementPath, options);
  });
};

/**
 * 获取结构匹配默认配置摘要
 */
export const getStructuralMatchingConfigSummary = (
  options: StructuralMatchingConfigOptions = {}
) => {
  const {
    mode = SkeletonMatchMode.FAMILY,
    ignoreVolatileFields = false,
    enableSmartConfig = true
  } = options;

  return {
    mode,
    ignoreVolatileFields,
    enableSmartConfig,
    methodology: {
      coreFields: ['CLASS_NAME', 'BOUNDS'], // 核心结构字段
      textFields: ['TEXT', 'CONTENT_DESC', 'RESOURCE_ID'], // 文本字段
      booleanFields: ['CLICKABLE', 'ENABLED', 'SELECTED', 'CHECKABLE', 'CHECKED'], // 关键布尔字段
      meaningfulnessRule: '非空值 + 非默认状态 = 有意义',
      autoEnableRule: '有意义字段自动启用',
      strategyRule: mode === SkeletonMatchMode.FAMILY 
        ? 'Family模式：文本字段存在性匹配，布尔字段精确匹配'
        : 'Clone模式：所有字段精确匹配',
      volatileHandling: ignoreVolatileFields ? '忽略易变字段（数字、时间戳）' : '包含易变字段'
    }
  };
};