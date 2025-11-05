// src/modules/structural-matching/hooks/use-hierarchical-matching-modal-fixed.ts
// module: structural-matching | layer: hooks | role: 层级化匹配模态框钩子（修复版）
// summary: 管理结构化匹配的配置状态和生成逻辑，集成新的增强架构

import { useState, useCallback, useMemo } from 'react';

/**
 * 🎯 元素模板类型
 */
export type ElementTemplate = 
  | 'button-with-icon' 
  | 'text-only-button' 
  | 'card-item' 
  | 'list-item' 
  | 'input-field'
  | 'image-text-combo'
  | 'navigation-item'
  | 'content-block';

/**
 * 🏗️ 层级化字段配置接口
 */
export interface HierarchicalFieldConfig {
  enabled: boolean;
  threshold: number;
}

/**
 * 🎛️ 结构化匹配层级化配置
 */
export interface StructuralMatchingHierarchicalConfig {
  [key: string]: HierarchicalFieldConfig;
}

/**
 * 📋 Hook 返回值接口
 */
export interface UseHierarchicalMatchingModalReturn {
  /** 当前配置对象 */
  config: StructuralMatchingHierarchicalConfig;
  
  /** 更新字段阈值 */
  updateThreshold: (field: string, threshold: number) => void;
  
  /** 切换字段启用状态 */
  toggleField: (field: string) => void;
  
  /** 更新字段配置 */
  updateField: (field: string, config: Partial<HierarchicalFieldConfig>) => void;
  
  /** 获取字段配置 */
  getFieldConfig: (field: string) => HierarchicalFieldConfig;
  
  /** 重置配置 */
  reset: () => void;
  
  /** 应用预设模板 */
  applyTemplate: (template: ElementTemplate) => void;
  
  /** 自动检测并应用模板 */
  detectAndApplyTemplate: (selectedElement?: Record<string, unknown>) => ElementTemplate | null;
  
  /** 配置是否有效 */
  isConfigValid: boolean;
  
  /** 当前应用的模板类型 */
  appliedTemplate?: ElementTemplate;
  
  /** 🏗️ 生成后端所需的 structural_signatures */
  generateStructuralSignatures: () => {
    container: { role: string; depth: number };
    skeleton: Array<{ tag: string; role: string; index: number }>;
  } | null;
}

/**
 * 创建默认的层级化配置
 */
const createDefaultConfig = (): StructuralMatchingHierarchicalConfig => {
  return {
    // 核心标识字段 - 默认启用
    resource_id: { enabled: true, threshold: 0.8 },
    content_desc: { enabled: true, threshold: 0.7 },
    text: { enabled: true, threshold: 0.7 },
    class_name: { enabled: true, threshold: 0.6 },
    
    // 位置字段 - 默认禁用
    bounds: { enabled: false, threshold: 0.5 },
    
    // 行为字段 - 根据重要性设置
    clickable: { enabled: true, threshold: 0.6 },
    enabled: { enabled: true, threshold: 0.5 },
    focusable: { enabled: false, threshold: 0.4 },
    focused: { enabled: false, threshold: 0.3 },
    scrollable: { enabled: false, threshold: 0.4 },
    long_clickable: { enabled: false, threshold: 0.3 },
    
    // 状态字段 - 通常不太重要
    checkable: { enabled: false, threshold: 0.3 },
    checked: { enabled: false, threshold: 0.2 },
    selected: { enabled: false, threshold: 0.2 },
    password: { enabled: false, threshold: 0.2 },
  };
};

/**
 * 🎯 元素模板配置
 */
const ELEMENT_TEMPLATES: Record<ElementTemplate, Partial<StructuralMatchingHierarchicalConfig>> = {
  'button-with-icon': {
    resource_id: { enabled: true, threshold: 0.9 },
    content_desc: { enabled: true, threshold: 0.8 },
    clickable: { enabled: true, threshold: 0.7 },
    class_name: { enabled: true, threshold: 0.6 },
  },
  'text-only-button': {
    text: { enabled: true, threshold: 0.8 },
    clickable: { enabled: true, threshold: 0.7 },
    resource_id: { enabled: false, threshold: 0.5 },
  },
  'card-item': {
    resource_id: { enabled: true, threshold: 0.8 },
    bounds: { enabled: true, threshold: 0.6 },
    class_name: { enabled: true, threshold: 0.7 },
  },
  'list-item': {
    class_name: { enabled: true, threshold: 0.8 },
    text: { enabled: true, threshold: 0.6 },
    bounds: { enabled: false, threshold: 0.4 },
  },
  'input-field': {
    resource_id: { enabled: true, threshold: 0.9 },
    focused: { enabled: true, threshold: 0.8 },
    enabled: { enabled: true, threshold: 0.7 },
  },
  'image-text-combo': {
    content_desc: { enabled: true, threshold: 0.8 },
    text: { enabled: true, threshold: 0.7 },
    bounds: { enabled: true, threshold: 0.6 },
  },
  'navigation-item': {
    resource_id: { enabled: true, threshold: 0.8 },
    clickable: { enabled: true, threshold: 0.7 },
    text: { enabled: false, threshold: 0.5 },
  },
  'content-block': {
    class_name: { enabled: true, threshold: 0.7 },
    bounds: { enabled: true, threshold: 0.6 },
    scrollable: { enabled: false, threshold: 0.4 },
  }
};

/**
 * 🎛️ 层级化匹配模态框Hook
 * 
 * @param selectedElement 当前选中的元素数据
 * @returns Hook操作接口和状态
 */
export const useHierarchicalMatchingModal = (
  selectedElement?: Record<string, unknown>
): UseHierarchicalMatchingModalReturn => {
  
  // 📊 状态管理
  const [config, setConfig] = useState<StructuralMatchingHierarchicalConfig>(createDefaultConfig);
  const [appliedTemplate, setAppliedTemplate] = useState<ElementTemplate>();
  
  // 🔄 更新字段阈值
  const updateThreshold = useCallback((field: string, threshold: number) => {
    setConfig(prev => ({
      ...prev,
      [field]: { ...prev[field], threshold }
    }));
  }, []);
  
  // 🔄 切换字段启用状态
  const toggleField = useCallback((field: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: { ...prev[field], enabled: !prev[field]?.enabled }
    }));
  }, []);
  
  // 🔄 更新字段配置
  const updateField = useCallback((field: string, updates: Partial<HierarchicalFieldConfig>) => {
    setConfig(prev => ({
      ...prev,
      [field]: { ...prev[field], ...updates }
    }));
  }, []);
  
  // 📋 获取字段配置
  const getFieldConfig = useCallback((field: string): HierarchicalFieldConfig => {
    // 🎯 默认配置：除了bounds字段，其他字段默认启用
    const isBoundsField = field.toLowerCase().includes('bounds') || field.toLowerCase().includes('boundary');
    const defaultConfig = { 
      enabled: !isBoundsField, // bounds字段默认false，其他字段默认true
      threshold: 0.5 
    };
    return config[field] || defaultConfig;
  }, [config]);
  
  // 🔄 重置配置
  const reset = useCallback(() => {
    setConfig(createDefaultConfig());
    setAppliedTemplate(undefined);
  }, []);
  
  // 🎯 应用预设模板
  const applyTemplate = useCallback((template: ElementTemplate) => {
    const templateConfig = ELEMENT_TEMPLATES[template];
    setConfig(prev => ({ ...prev, ...templateConfig }));
    setAppliedTemplate(template);
  }, []);
  
  // 🤖 自动检测并应用模板
  const detectAndApplyTemplate = useCallback((element?: Record<string, unknown>): ElementTemplate | null => {
    const target = element || selectedElement;
    if (!target) return null;
    
    // 简单的启发式检测逻辑
    const className = target.class_name as string || target.className as string || '';
    const text = target.text as string || '';
    const clickable = target.clickable as boolean || target.is_clickable as boolean || false;
    
    let detectedTemplate: ElementTemplate | null = null;
    
    if (clickable && className.includes('Button')) {
      detectedTemplate = text ? 'text-only-button' : 'button-with-icon';
    } else if (className.includes('Card') || className.includes('Item')) {
      detectedTemplate = 'card-item';
    } else if (className.includes('Input') || className.includes('Edit')) {
      detectedTemplate = 'input-field';
    } else if (className.includes('Image') && text) {
      detectedTemplate = 'image-text-combo';
    } else if (clickable && (className.includes('Nav') || className.includes('Menu'))) {
      detectedTemplate = 'navigation-item';
    } else if (className.includes('Text') || className.includes('View')) {
      detectedTemplate = 'content-block';
    }
    
    if (detectedTemplate) {
      applyTemplate(detectedTemplate);
    }
    
    return detectedTemplate;
  }, [selectedElement, applyTemplate]);
  
  // 📊 配置有效性检查
  const isConfigValid = useMemo(() => {
    return Object.values(config).some(fieldConfig => fieldConfig.enabled);
  }, [config]);

  // 🏗️ 生成后端所需的 structural_signatures（增强版本）
  const generateStructuralSignatures = useCallback(() => {
    console.log('🚀 [Enhanced StructuralMatching] 开始生成增强结构化签名');
    
    if (!selectedElement) {
      console.warn('⚠️ [StructuralMatching] 无法生成骨架：selectedElement 为空');
      return null;
    }

    // 🎯 提取元素属性（增强版本）
    const resourceId = (selectedElement.resource_id || selectedElement.resourceId || '').toString().trim();
    const contentDesc = (selectedElement.content_desc || selectedElement.contentDesc || '').toString().trim();
    const text = (selectedElement.text || selectedElement.elementText || '').toString().trim();
    const className = (selectedElement.class_name || selectedElement.className) as string | undefined;
    const containerRole = className?.split('.').pop() || 'Frame';
    const clickable = selectedElement.is_clickable || selectedElement.clickable;
    const elementId = selectedElement.id as string | undefined;
    
    // 处理bounds
    let bounds = '[0,0][0,0]';
    if (typeof selectedElement.bounds === 'string') {
      bounds = selectedElement.bounds;
    } else if (typeof selectedElement.bounds === 'object' && selectedElement.bounds) {
      const b = selectedElement.bounds as Record<string, unknown>;
      if (typeof b.left === 'number' && typeof b.top === 'number' && 
          typeof b.right === 'number' && typeof b.bottom === 'number') {
        bounds = `[${b.left},${b.top}][${b.right},${b.bottom}]`;
      }
    }

    console.log('🔍 [Enhanced] 元素属性解析:', {
      resourceId: resourceId || '(无)',
      contentDesc: contentDesc || '(无)',
      text: text || '(无)', 
      className: className || '(无)',
      bounds,
      clickable: clickable || false
    });

    // 🦴 构建增强的骨架规则
    const skeleton: Array<{ tag: string; role: string; index: number }> = [];
    let ruleIndex = 0;

    // 优先级1: resource-id（最强标识符）
    if (resourceId && resourceId !== '' && !resourceId.includes('0_resource_name_obfuscated')) {
      skeleton.push({
        tag: 'identity',
        role: `resource-id:${resourceId}`,
        index: ruleIndex++
      });
    }

    // 优先级2: content-desc
    if (contentDesc && contentDesc !== '') {
      skeleton.push({
        tag: 'identity',
        role: `content-desc:${contentDesc.substring(0, 50)}`,
        index: ruleIndex++
      });
    }

    // 优先级3: 文本内容
    if (text && text !== '') {
      skeleton.push({
        tag: 'content',
        role: text.length <= 20 ? `text-exact:${text}` : `text-partial:${text.substring(0, 15)}`,
        index: ruleIndex++
      });
    }

    // 优先级4: 结构特征
    if (className) {
      skeleton.push({
        tag: 'structure',
        role: `class:${className.split('.').pop()}`,
        index: ruleIndex++
      });
    }

    // 优先级5: 行为特征
    if (clickable) {
      skeleton.push({
        tag: 'behavior',
        role: 'clickable',
        index: ruleIndex++
      });
    }

    // 优先级6: 位置约束
    if (bounds !== '[0,0][0,0]') {
      skeleton.push({
        tag: 'position',
        role: `bounds:${bounds}`,
        index: ruleIndex++
      });
    }

    // 确保至少有一个规则
    if (skeleton.length === 0) {
      skeleton.push({
        tag: 'fallback',
        role: 'generic-element',
        index: 0
      });
    }

    // 计算深度（简化）
    const depth = elementId ? (elementId.match(/-/g) || []).length : skeleton.length;

    const result = {
      container: { 
        role: containerRole, 
        depth: Math.max(1, Math.min(depth, 8)) 
      },
      skeleton
    };

    console.log('✅ [Enhanced] 增强结构化签名生成完成:', {
      skeletonRules: skeleton.length,
      containerRole,
      depth: result.container.depth,
      hasResourceId: resourceId !== '',
      hasContentDesc: contentDesc !== '',
      hasText: text !== ''
    });

    return result;
  }, [selectedElement]);

  return {
    config,
    updateThreshold,
    toggleField,
    updateField,
    getFieldConfig,
    reset,
    applyTemplate,
    detectAndApplyTemplate,
    isConfigValid,
    appliedTemplate,
    generateStructuralSignatures,
  };
};