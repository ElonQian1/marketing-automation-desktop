// src/modules/structural-matching/domain/skeleton-match-strategy.ts
// module: structural-matching | layer: domain | role: 骨架匹配策略定义
// summary: 定义结构匹配的两档模式和字段策略枚举

/**
 * 骨架匹配模式
 */
export enum SkeletonMatchMode {
  /** Family模式：同构家族 - 找同类骨架（非空↔非空、布尔等值、层级一致） */
  FAMILY = 'FAMILY',
  /** Clone模式：精确克隆 - 值完全一模一样（所有字段严格等值） */
  CLONE = 'CLONE',
}

/**
 * 字段匹配策略
 */
export enum FieldMatchStrategy {
  /** 严格等值 - 字段值必须完全相同 */
  EQUALS = 'EQUALS',
  /** 存在性 - 有值↔有值，空值↔空值 */
  EXISTS = 'EXISTS',
  /** 包含匹配 - 目标值包含在候选值中 */
  CONTAINS = 'CONTAINS',
  /** 正则模式 - 支持数字、时间戳等模式匹配 */
  PATTERN = 'PATTERN',
  /** 忽略字段 - 不参与匹配 */
  IGNORE = 'IGNORE',
}

/**
 * Bounds匹配策略
 */
export enum BoundsMatchStrategy {
  /** 像素等值 - 同一dump内允许±px容差 */
  PIXEL_EQUALS = 'PIXEL_EQUALS',
  /** 相对几何 - 跨设备使用容器相对比例 */
  RELATIVE_GEOMETRY = 'RELATIVE_GEOMETRY',
  /** 区域分桶 - 3x3网格区域匹配 */
  REGION_BUCKET = 'REGION_BUCKET',
  /** 忽略位置 - 不考虑bounds */
  IGNORE_BOUNDS = 'IGNORE_BOUNDS',
}

/**
 * 字段策略配置
 */
export interface FieldStrategyConfig {
  /** 字段匹配策略 */
  strategy: FieldMatchStrategy;
  /** 是否启用该字段 */
  enabled: boolean;
  /** 是否是易变字段（数字、时间戳等） */
  isVolatile: boolean;
  /** 策略说明 */
  description: string;
}

/**
 * 骨架匹配配置
 */
export interface SkeletonMatchConfig {
  /** 匹配模式 */
  mode: SkeletonMatchMode;
  /** 是否忽略易变字段 */
  ignoreVolatileFields: boolean;
  /** Bounds匹配策略 */
  boundsStrategy: BoundsMatchStrategy;
  /** 字段策略映射 */
  fieldStrategies: Record<string, FieldStrategyConfig>;
}

/**
 * 获取默认字段策略
 */
export const getDefaultFieldStrategy = (
  fieldType: string,
  mode: SkeletonMatchMode,
  ignoreVolatile: boolean = false
): FieldStrategyConfig => {
  const baseStrategies: Record<string, Partial<FieldStrategyConfig>> = {
    // 结构核心字段 - 必须严格匹配
    'CLASS_NAME': {
      strategy: FieldMatchStrategy.EQUALS,
      enabled: true,
      isVolatile: false,
      description: '控件类型，骨架核心标识'
    },
    'PACKAGE': {
      strategy: FieldMatchStrategy.EQUALS,
      enabled: true,
      isVolatile: false,
      description: '包名，应用标识'
    },

    // 布尔状态字段 - 骨架语义必须一致
    'CLICKABLE': {
      strategy: FieldMatchStrategy.EQUALS,
      enabled: true,
      isVolatile: false,
      description: '可点击状态，交互语义'
    },
    'ENABLED': {
      strategy: FieldMatchStrategy.EQUALS,
      enabled: true,
      isVolatile: false,
      description: '启用状态，可用性语义'
    },
    'SELECTED': {
      strategy: FieldMatchStrategy.EQUALS,
      enabled: true,
      isVolatile: false,
      description: '选中状态，选择语义'
    },
    'CHECKABLE': {
      strategy: FieldMatchStrategy.EQUALS,
      enabled: true,
      isVolatile: false,
      description: '可勾选状态，选择交互'
    },
    'CHECKED': {
      strategy: FieldMatchStrategy.EQUALS,
      enabled: true,
      isVolatile: false,
      description: '勾选状态，当前选择'
    },

    // 文本字段 - 根据模式决定策略
    'TEXT': {
      strategy: mode === SkeletonMatchMode.CLONE 
        ? FieldMatchStrategy.EQUALS 
        : FieldMatchStrategy.EXISTS,
      enabled: true,
      isVolatile: true, // 可能包含数字、时间戳
      description: mode === SkeletonMatchMode.CLONE 
        ? '文本内容完全相同' 
        : '有文本↔有文本'
    },
    'CONTENT_DESC': {
      strategy: mode === SkeletonMatchMode.CLONE 
        ? FieldMatchStrategy.EQUALS 
        : FieldMatchStrategy.EXISTS,
      enabled: true,
      isVolatile: true, // 可能包含动态描述
      description: mode === SkeletonMatchMode.CLONE 
        ? '描述内容完全相同' 
        : '有描述↔有描述'
    },

    // 资源ID - 可能是混淆值
    'RESOURCE_ID': {
      strategy: mode === SkeletonMatchMode.CLONE 
        ? FieldMatchStrategy.EQUALS 
        : FieldMatchStrategy.EXISTS,
      enabled: true,
      isVolatile: false,
      description: mode === SkeletonMatchMode.CLONE 
        ? '资源ID完全相同（注意混淆值区分度）' 
        : '有资源ID↔有资源ID'
    },

    // 其他布尔字段
    'FOCUSABLE': {
      strategy: FieldMatchStrategy.EQUALS,
      enabled: false, // 默认不启用，除非有特殊值
      isVolatile: false,
      description: '可聚焦状态'
    },
    'FOCUSED': {
      strategy: FieldMatchStrategy.EQUALS,
      enabled: false,
      isVolatile: false,
      description: '当前聚焦状态'
    },
    'SCROLLABLE': {
      strategy: FieldMatchStrategy.EQUALS,
      enabled: false,
      isVolatile: false,
      description: '可滚动状态'
    },
    'LONG_CLICKABLE': {
      strategy: FieldMatchStrategy.EQUALS,
      enabled: false,
      isVolatile: false,
      description: '可长按状态'
    },
    'PASSWORD': {
      strategy: FieldMatchStrategy.EQUALS,
      enabled: false,
      isVolatile: false,
      description: '密码字段标识'
    },

    // 位置信息
    'BOUNDS': {
      strategy: FieldMatchStrategy.EQUALS, // 实际由boundsStrategy控制
      enabled: true,
      isVolatile: false,
      description: '位置边界信息'
    }
  };

  const baseConfig = baseStrategies[fieldType] || {
    strategy: FieldMatchStrategy.EXISTS,
    enabled: false,
    isVolatile: false,
    description: '其他字段'
  };

  // 易变字段处理
  if (ignoreVolatile && baseConfig.isVolatile) {
    return {
      ...baseConfig,
      strategy: FieldMatchStrategy.PATTERN, // 改为模式匹配或存在性
      description: `${baseConfig.description}（已忽略易变内容）`
    } as FieldStrategyConfig;
  }

  return baseConfig as FieldStrategyConfig;
};

/**
 * 获取默认骨架匹配配置
 */
export const getDefaultSkeletonConfig = (mode: SkeletonMatchMode): SkeletonMatchConfig => {
  const fieldTypes = [
    'CLASS_NAME', 'PACKAGE', 'TEXT', 'CONTENT_DESC', 'RESOURCE_ID',
    'CLICKABLE', 'ENABLED', 'FOCUSABLE', 'FOCUSED', 'SCROLLABLE',
    'LONG_CLICKABLE', 'CHECKABLE', 'CHECKED', 'SELECTED', 'PASSWORD', 'BOUNDS'
  ];

  const fieldStrategies: Record<string, FieldStrategyConfig> = {};
  fieldTypes.forEach(fieldType => {
    fieldStrategies[fieldType] = getDefaultFieldStrategy(fieldType, mode);
  });

  return {
    mode,
    ignoreVolatileFields: false,
    boundsStrategy: BoundsMatchStrategy.RELATIVE_GEOMETRY, // 默认跨设备友好
    fieldStrategies,
  };
};

/**
 * 骨架签名（用于快速筛选）
 */
export interface SkeletonSignature {
  /** 层级结构哈希 */
  hierarchyHash: string;
  /** 每层类名多重集 */
  classMultisets: string[];
  /** 角色计数 */
  roleCounts: Record<string, number>;
  /** 布尔状态位图 */
  booleanBitmap: number;
  /** 几何分桶 */
  geometryBucket: string;
}

/**
 * 构建骨架签名
 */
export const buildSkeletonSignature = (
  elementTree: any, 
  config: SkeletonMatchConfig
): SkeletonSignature => {
  // TODO: 实现具体的签名构建逻辑
  return {
    hierarchyHash: '',
    classMultisets: [],
    roleCounts: {},
    booleanBitmap: 0,
    geometryBucket: '',
  };
};