// src/modules/structural-matching/hooks/use-hierarchical-matching-modal.ts
// module: structural-matching | layer: hooks | role: 层级化结构匹配模态框Hook
// summary: 管理层级化字段配置的状态和操作

import { useState, useCallback, useMemo } from 'react';
import { 
  HierarchicalFieldConfig, 
  StructuralMatchingHierarchicalConfig,
  FieldConfig,
  updateFieldConfig,
  findFieldConfig,
  createLayerConfig,
  getDefaultFieldConfig
} from '../domain/models/hierarchical-field-config';
import { FieldType } from '../domain/constants/field-types';
import { ElementTemplate, detectElementType, getElementTemplate } from '../domain/constants/element-templates';

export interface UseHierarchicalMatchingModalParams {
  /** 选中的元素 */
  selectedElement?: Record<string, unknown>;
  
  /** 初始配置 */
  initialConfig?: Partial<StructuralMatchingHierarchicalConfig>;
}

export interface UseHierarchicalMatchingModalReturn {
  /** 当前配置 */
  config: StructuralMatchingHierarchicalConfig;
  
  /** 更新全局阈值 */
  updateThreshold: (threshold: number) => void;
  
  /** 切换字段启用状态 */
  toggleField: (elementPath: string, fieldType: FieldType) => void;
  
  /** 更新字段配置 */
  updateField: (elementPath: string, fieldType: FieldType, updates: Partial<FieldConfig>) => void;
  
  /** 获取字段配置 */
  getFieldConfig: (elementPath: string, fieldType: FieldType) => FieldConfig;
  
  /** 重置配置 */
  reset: () => void;
  
  /** 应用配置模板 */
  applyTemplate: (template: ElementTemplate) => void;
  
  /** 检测元素类型并应用对应模板 */
  detectAndApplyTemplate: (element?: Record<string, unknown>) => void;
  
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
  // 为常见层级创建默认配置
  const defaultLayers: HierarchicalFieldConfig[] = [
    // 根层级 - 通常关注结构性字段
    createLayerConfig('root-0', [FieldType.RESOURCE_ID, FieldType.CONTENT_DESC, FieldType.CLASS_NAME]),
    // 第一层 - 通常关注点击性和结构
    createLayerConfig('root-0-0', [FieldType.RESOURCE_ID, FieldType.CLASS_NAME]),
    // 第二层 - 通常关注内容
    createLayerConfig('root-0-0-0', [FieldType.TEXT, FieldType.CONTENT_DESC, FieldType.RESOURCE_ID]),
  ];

  return {
    globalThreshold: 0.7,
    layers: defaultLayers,
  };
};

/**
 * 从配置模板创建层级化配置
 */
const createConfigFromTemplate = (template: ElementTemplate): StructuralMatchingHierarchicalConfig => {
  const layers: HierarchicalFieldConfig[] = template.layerConfigs.map(layerConfig => {
    const layer = createLayerConfig(layerConfig.pathPattern, Object.keys(layerConfig.fieldConfigs) as FieldType[]);
    
    // 应用模板中的字段配置
    Object.entries(layerConfig.fieldConfigs).forEach(([fieldType, config]) => {
      if (layer.fields[fieldType as FieldType]) {
        layer.fields[fieldType as FieldType] = {
          ...layer.fields[fieldType as FieldType],
          ...config,
        };
      }
    });
    
    return layer;
  });

  return {
    globalThreshold: template.defaultThreshold,
    layers,
  };
};

export const useHierarchicalMatchingModal = ({
  selectedElement,
  initialConfig = {},
}: UseHierarchicalMatchingModalParams = {}): UseHierarchicalMatchingModalReturn => {
  
  const [config, setConfig] = useState<StructuralMatchingHierarchicalConfig>(() => ({
    ...createDefaultConfig(),
    ...initialConfig,
  }));
  
  const [appliedTemplate, setAppliedTemplate] = useState<ElementTemplate | undefined>();

  // 更新全局阈值
  const updateThreshold = useCallback((threshold: number) => {
    setConfig(prev => ({
      ...prev,
      globalThreshold: threshold,
    }));
  }, []);

  // 切换字段启用状态
  const toggleField = useCallback((elementPath: string, fieldType: FieldType) => {
    setConfig(prev => {
      const currentConfig = findFieldConfig(prev.layers, elementPath, fieldType);
      const newEnabled = !currentConfig?.enabled;

      const newLayers = updateFieldConfig(prev.layers, elementPath, fieldType, {
        enabled: newEnabled,
      });

      return {
        ...prev,
        layers: newLayers,
      };
    });
  }, []);

  // 更新字段配置
  const updateField = useCallback((
    elementPath: string, 
    fieldType: FieldType, 
    updates: Partial<FieldConfig>
  ) => {
    setConfig(prev => {
      const newLayers = updateFieldConfig(prev.layers, elementPath, fieldType, updates);
      
      return {
        ...prev,
        layers: newLayers,
      };
    });
  }, []);

  // 获取字段配置
  const getFieldConfig = useCallback((elementPath: string, fieldType: FieldType): FieldConfig => {
    const fieldConfig = findFieldConfig(config.layers, elementPath, fieldType);
    return fieldConfig || getDefaultFieldConfig(fieldType);
  }, [config.layers]);

  // 重置配置
  const reset = useCallback(() => {
    setConfig(createDefaultConfig());
    setAppliedTemplate(undefined);
  }, []);

  // 应用配置模板
  const applyTemplate = useCallback((template: ElementTemplate) => {
    const newConfig = createConfigFromTemplate(template);
    setConfig(newConfig);
    setAppliedTemplate(template);
  }, []);

  // 检测元素类型并应用对应模板
  const detectAndApplyTemplate = useCallback((element?: Record<string, unknown>) => {
    const targetElement = element || selectedElement;
    if (!targetElement) {
      console.warn('没有提供元素数据，无法检测元素类型');
      return;
    }

    const elementType = detectElementType(targetElement);
    const template = getElementTemplate(elementType);
    
    console.log(`检测到元素类型: ${elementType}, 应用模板: ${template.name}`);
    applyTemplate(template);
  }, [selectedElement, applyTemplate]);

  // 检查配置是否有效
  const isConfigValid = useMemo(() => {
    // 至少要有一个字段启用
    const hasEnabledField = config.layers.some(layer => 
      Object.values(layer.fields).some(field => field?.enabled)
    );
    
    // 阈值在有效范围内
    const validThreshold = config.globalThreshold >= 0 && config.globalThreshold <= 1;
    
    return hasEnabledField && validThreshold;
  }, [config]);

  // 🏗️ 生成后端所需的 structural_signatures
  const generateStructuralSignatures = useCallback(() => {
    if (!selectedElement) {
      console.warn('⚠️ [StructuralMatching] 无法生成骨架：selectedElement 为空');
      return null;
    }

    // 提取容器信息
    const className = (selectedElement.class_name || selectedElement.className) as string | undefined;
    const containerRole = className?.split('.').pop() || 'Frame';
    
    // 计算深度（从元素路径或ID推断）
    const elementId = selectedElement.id as string | undefined;
    const depth = elementId ? (elementId.match(/-/g) || []).length : 0;

    // 从配置的layers中提取启用的字段，构建skeleton
    const skeleton: Array<{ tag: string; role: string; index: number }> = [];
    
    // 遍历所有layers，找到启用的字段
    config.layers.forEach((layer, layerIndex) => {
      Object.entries(layer.fields).forEach(([fieldType, fieldConfig]) => {
        if (fieldConfig?.enabled && fieldType !== FieldType.BOUNDS) {
          // 从元素中提取对应字段的值作为role
          const fieldValue = selectedElement[fieldType] as string | undefined;
          
          skeleton.push({
            tag: className?.split('.').pop() || 'View',
            role: fieldValue || fieldType, // 使用字段值或字段类型作为role
            index: layerIndex
          });
        }
      });
    });

    // 如果没有启用的字段，至少添加一个基础节点
    if (skeleton.length === 0) {
      const text = (selectedElement.text || selectedElement.elementText) as string | undefined;
      skeleton.push({
        tag: containerRole,
        role: text || 'default',
        index: 0
      });
    }

    const signatures = {
      container: {
        role: containerRole,
        depth: depth
      },
      skeleton: skeleton
    };

    console.log('🏗️ [StructuralMatching] 生成 structural_signatures:', signatures);
    return signatures;
  }, [selectedElement, config.layers]);

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