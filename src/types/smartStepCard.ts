// src/types/smartStepCard.ts
// module: types | layer: domain | role: 智能步骤卡片扩展协议
// summary: 在现有StepCard基础上扩展智能选择功能，保持向后兼容

import type { StepCardModel, StepActionCommon, StepActionParams } from './stepActions';
import type { SmartSelectionProtocol } from './smartSelection';

/**
 * 智能步骤卡片模型 - 扩展现有StepCardModel
 */
export interface SmartStepCardModel extends StepCardModel {
  // 向后兼容：保留所有原有字段
  
  // 智能选择扩展字段
  smartSelection?: SmartSelectionProtocol;    // 智能选择协议（可选）
  
  // 静态分析缓存
  analysisCache?: {
    xml_snapshot?: string;                    // XML快照
    absolute_xpath?: string;                  // 绝对XPath（兜底用）
    analysis_timestamp?: number;              // 分析时间戳
    screen_size?: { width: number; height: number }; // 屏幕尺寸
  };
  
  // 智能执行配置
  smartExecution?: {
    enable_smart_selection: boolean;          // 是否启用智能选择
    prefer_smart_over_legacy: boolean;        // 智能选择优先于传统方式
    enable_batch_mode: boolean;               // 是否启用批量模式
    execution_strategy?: 'conservative' | 'balanced' | 'aggressive'; // 执行策略
  };
  
  // 扩展元数据
  metadata?: {
    created_by_smart_analysis?: boolean;      // 是否由智能分析创建
    element_type_hint?: string;               // 元素类型提示（按钮、输入框等）
    ui_pattern?: string;                      // UI模式（列表项、卡片、导航等）
    confidence_level?: 'high' | 'medium' | 'low'; // 整体置信度等级
  };
}

/**
 * 智能选择状态扩展
 */
export type SmartStepStatus = 
  | 'idle' 
  | 'analyzing'           // 智能分析中
  | 'configuring'         // 配置智能选择
  | 'matching' 
  | 'batch-preparing'     // 准备批量操作
  | 'batch-executing'     // 批量执行中
  | 'ready' 
  | 'executing' 
  | 'verifying' 
  | 'success' 
  | 'partial-success'     // 部分成功（批量操作）
  | 'failed';

/**
 * 智能匹配结果扩展
 */
export interface SmartMatchResult {
  // 兼容原有字段
  score: number;
  confidence: number;
  summary: string;
  elementRect?: { x: number; y: number; width: number; height: number };
  
  // 智能选择扩展
  strategy_used?: string;                     // 使用的策略
  candidates_found?: number;                  // 找到的候选数量
  selection_mode?: string;                    // 选择模式
  fingerprint_match_score?: number;          // 指纹匹配评分
  context_analysis?: string[];               // 上下文分析日志
  
  // 批量结果（仅all模式）
  batch_result?: {
    total_targets: number;
    successful: number;
    failed: number;
    execution_time_ms: number;
  };
}

/**
 * 智能步骤卡片创建选项
 */
export interface SmartStepCardCreationOptions {
  // 基础信息
  name: string;
  selectorId: string;
  action: StepActionParams;
  
  // 智能分析输入
  xmlSnapshot?: string;                       // XML快照
  absoluteXPath?: string;                     // 绝对XPath
  clickedElement?: {                          // 被点击的元素信息
    bounds: { left: number; top: number; right: number; bottom: number };
    text?: string;
    className?: string;
    resourceId?: string;
    contentDesc?: string;
  };
  
  // 智能配置
  enableSmartSelection?: boolean;             // 是否启用智能选择
  defaultSelectionMode?: 'match-original' | 'first' | 'last' | 'random' | 'all';
  generateFingerprint?: boolean;              // 是否生成元素指纹
  
  // 执行配置
  common?: Partial<StepActionCommon>;         // 通用执行参数
}

/**
 * 智能步骤卡片工厂函数选项
 */
export interface SmartStepCardFactoryOptions {
  enableBackwardCompatibility: boolean;      // 启用向后兼容
  defaultSmartFeatures: boolean;             // 默认启用智能功能
  generateFingerprints: boolean;             // 生成元素指纹
  batchModeByDefault: boolean;               // 默认批量模式
}

/**
 * 步骤卡片迁移结果
 */
export interface StepCardMigrationResult {
  success: boolean;
  migratedCard?: SmartStepCardModel;
  warnings?: string[];
  errors?: string[];
  compatibilityIssues?: string[];
}

/**
 * 从传统StepCard迁移到SmartStepCard
 */
export function migrateToSmartStepCard(
  legacyCard: StepCardModel,
  options?: {
    enableSmartFeatures?: boolean;
    preserveAllData?: boolean;
    generateFingerprint?: boolean;
  }
): StepCardMigrationResult {
  try {
    const smartCard: SmartStepCardModel = {
      // 保留所有原有字段
      ...legacyCard,
      
      // 添加智能功能（默认禁用，保证兼容性）
      smartExecution: {
        enable_smart_selection: options?.enableSmartFeatures ?? false,
        prefer_smart_over_legacy: false,
        enable_batch_mode: false,
        execution_strategy: 'conservative',
      },
      
      metadata: {
        created_by_smart_analysis: false,
        confidence_level: 'medium',
      },
    };
    
    return {
      success: true,
      migratedCard: smartCard,
      warnings: [],
      errors: [],
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Migration failed: ${error}`],
    };
  }
}

/**
 * 创建智能步骤卡片
 */
export function createSmartStepCard(options: SmartStepCardCreationOptions): SmartStepCardModel {
  const baseCard: StepCardModel = {
    id: `smart_step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: options.name,
    selectorId: options.selectorId,
    currentAction: options.action,
    common: {
      useSelector: true,
      allowAbsolute: true,
      confidenceThreshold: 0.8,
      retries: 1,
      retryBackoffMs: 250,
      verifyAfter: false,
      postDelayMs: 0,
      ...options.common,
    },
    status: 'idle',
    version: '2.0-smart',
  };
  
  const smartCard: SmartStepCardModel = {
    ...baseCard,
    
    // 智能选择配置
    smartSelection: options.enableSmartSelection ? {
      anchor: {
        fingerprint: {
          // 基础指纹信息，后续由分析器填充
          text_content: options.clickedElement?.text,
          resource_id: options.clickedElement?.resourceId,
          clickable: true,
        },
      },
      selection: {
        mode: options.defaultSelectionMode || 'match-original',
        order: 'visual-yx',
      },
      fallback: {
        absolute_xpath: options.absoluteXPath,
        allow_fallback: true,
      },
    } : undefined,
    
    // 分析缓存
    analysisCache: {
      xml_snapshot: options.xmlSnapshot,
      absolute_xpath: options.absoluteXPath,
      analysis_timestamp: Date.now(),
    },
    
    // 智能执行配置
    smartExecution: {
      enable_smart_selection: options.enableSmartSelection ?? false,
      prefer_smart_over_legacy: false,
      enable_batch_mode: false,
      execution_strategy: 'balanced',
    },
    
    // 元数据
    metadata: {
      created_by_smart_analysis: true,
      element_type_hint: inferElementType(options.action),
      confidence_level: 'medium',
    },
  };
  
  return smartCard;
}

/**
 * 推断元素类型
 */
function inferElementType(action: StepActionParams): string {
  switch (action.type) {
    case 'tap':
    case 'doubleTap':
    case 'longPress':
      return 'button';
    case 'type':
      return 'input';
    case 'swipe':
      return 'scrollable';
    case 'wait':
      return 'delay';
    case 'back':
      return 'navigation';
    default:
      return 'unknown';
  }
}

/**
 * 验证智能步骤卡片
 */
export function validateSmartStepCard(card: SmartStepCardModel): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 基础验证
  if (!card.id || !card.name || !card.selectorId) {
    errors.push('缺少必要的基础字段');
  }
  
  // 智能选择验证
  if (card.smartSelection) {
    if (card.smartSelection.selection.mode === 'all' && !card.smartSelection.selection.batch_config) {
      errors.push('批量模式需要配置batch_config');
    }
    
    if (card.smartSelection.selection.mode === 'random' && !card.smartSelection.selection.random_seed) {
      // 自动生成随机种子
      card.smartSelection.selection.random_seed = Math.floor(Math.random() * 1000000);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 检查步骤卡片兼容性
 */
export function checkStepCardCompatibility(card: SmartStepCardModel): {
  isLegacyCompatible: boolean;
  requiresSmartFeatures: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let requiresSmartFeatures = false;
  
  // 检查是否使用了智能功能
  if (card.smartSelection) {
    requiresSmartFeatures = true;
    if (card.smartSelection.selection.mode === 'all') {
      warnings.push('批量模式在传统系统中不支持');
    }
  }
  
  if (card.smartExecution?.enable_smart_selection) {
    requiresSmartFeatures = true;
  }
  
  // 检查传统字段完整性
  const isLegacyCompatible = !!(
    card.id &&
    card.name &&
    card.selectorId &&
    card.currentAction &&
    card.common
  );
  
  return {
    isLegacyCompatible,
    requiresSmartFeatures,
    warnings,
  };
}

/**
 * 获取步骤卡片的显示标签
 */
export function getStepCardDisplayLabel(card: SmartStepCardModel): {
  primaryLabel: string;
  secondaryLabel?: string;
  badges: Array<{ text: string; color: string; tooltip?: string }>;
} {
  const badges: Array<{ text: string; color: string; tooltip?: string }> = [];
  
  // 智能功能徽章
  if (card.smartSelection) {
    badges.push({
      text: '智能',
      color: 'blue',
      tooltip: '启用智能选择功能',
    });
    
    if (card.smartSelection.selection.mode === 'all') {
      badges.push({
        text: '批量',
        color: 'orange',
        tooltip: '批量操作模式',
      });
    }
  }
  
  // 置信度徽章
  if (card.metadata?.confidence_level) {
    const confidenceColors = {
      high: 'green',
      medium: 'yellow',
      low: 'red',
    };
    badges.push({
      text: `置信度${card.metadata.confidence_level}`,
      color: confidenceColors[card.metadata.confidence_level],
    });
  }
  
  // 策略徽章
  if (card.smartExecution?.execution_strategy) {
    badges.push({
      text: card.smartExecution.execution_strategy,
      color: 'purple',
      tooltip: '执行策略',
    });
  }
  
  return {
    primaryLabel: card.name,
    secondaryLabel: card.currentAction.type,
    badges,
  };
}