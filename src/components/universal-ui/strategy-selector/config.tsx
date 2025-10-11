// src/components/universal-ui/strategy-selector/config.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 统一策略选择器配置
 * 集成新旧版本的所有策略和字段配置
 */

import React from 'react';
import { 
  ThunderboltOutlined, 
  SearchOutlined, 
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BulbOutlined,
  EyeInvisibleOutlined,
  AimOutlined,
  NodeIndexOutlined,
  BranchesOutlined,
  BorderOutlined,
  ShareAltOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import type { StrategyOption, FieldConfig, MatchStrategy } from './types';

/**
 * 统一的策略配置列表
 * 按类别组织：XPath策略 → 传统策略 → 特殊策略 → 智能策略
 */
export const UNIFIED_STRATEGY_OPTIONS: StrategyOption[] = [
  // 🎯 XPath 策略组（最新，性能和功能都很强大）
  {
    value: 'xpath-direct',
    label: 'XPath直接',
    description: '最快匹配速度，直接通过路径定位元素',
    icon: <ThunderboltOutlined />,
    color: 'gold',
    category: 'xpath'
  },
  {
    value: 'xpath-first-index',
    label: 'XPath[1]索引',
    description: 'XPath 使用[1]索引：匹配第一个符合条件的元素，适用于多个相同元素的场景',
    icon: <ThunderboltOutlined />,
    color: 'orange',
    category: 'xpath'
  },
  {
    value: 'xpath-all-elements',
    label: 'XPath全部元素',
    description: 'XPath 返回所有元素：获取所有符合条件的同类元素，适用于批量操作',
    icon: <SearchOutlined />,
    color: 'blue',
    category: 'xpath'
  },
  
  // 📋 传统策略组（经典稳定的匹配策略）
  {
    value: 'standard',
    label: '标准匹配',
    description: '跨设备稳定，仅使用语义字段，忽略位置差异',
    icon: <CheckCircleOutlined />,
    color: 'green',
    category: 'traditional'
  },
  {
    value: 'strict',
    label: '严格匹配',
    description: '精确匹配所有选中字段',
    icon: <ThunderboltOutlined />,
    color: 'blue',
    category: 'traditional'
  },
  {
    value: 'relaxed',
    label: '宽松匹配',
    description: '部分字段匹配即可',
    icon: <SearchOutlined />,
    color: 'orange',
    category: 'traditional'
  },
  {
    value: 'positionless',
    label: '无位置匹配',
    description: '忽略所有位置相关字段',
    icon: <BulbOutlined />,
    color: 'purple',
    category: 'traditional'
  },
  {
    value: 'absolute',
    label: '绝对匹配',
    description: '包含位置信息的精确匹配',
    icon: <ExclamationCircleOutlined />,
    color: 'red',
    category: 'traditional'
  },
  
  // 🔧 特殊策略组（处理特殊情况的策略）
  {
    value: 'hidden-element-parent',
    label: '隐藏元素',
    description: '隐藏元素父查找：自动遍历父容器找到可点击元素，适用于bounds=[0,0][0,0]的隐藏元素',
    icon: <EyeInvisibleOutlined />,
    color: 'geekblue',
    category: 'special'
  },
  {
    value: 'custom',
    label: '自定义',
    description: '手动配置字段和条件',
    icon: <SettingOutlined />,
    color: 'default',
    category: 'special'
  },
  
  // 🧠 智能策略系统
  {
    value: 'self-anchor',
    label: '自我锚点',
    description: '基于元素自身特征的匹配',
    icon: <AimOutlined />,
    color: 'cyan',
    category: 'intelligent'
  },
  {
    value: 'child-anchor',
    label: '子节点锚点',
    description: '通过子节点特征定位',
    icon: <NodeIndexOutlined />,
    color: 'blue',
    category: 'intelligent'
  },
  {
    value: 'parent-clickable',
    label: '父节点可点击',
    description: '查找最近的可点击父节点',
    icon: <BranchesOutlined />,
    color: 'green',
    category: 'intelligent'
  },
  {
    value: 'region-scoped',
    label: '区域限定',
    description: '在特定区域内查找',
    icon: <BorderOutlined />,
    color: 'orange',
    category: 'intelligent'
  },
  {
    value: 'neighbor-relative',
    label: '邻居相对',
    description: '基于邻近元素的相对位置',
    icon: <ShareAltOutlined />,
    color: 'purple',
    category: 'intelligent'
  },
  {
    value: 'index-fallback',
    label: '索引兜底',
    description: '当其他策略失败时的索引匹配',
    icon: <SafetyCertificateOutlined />,
    color: 'red',
    category: 'intelligent'
  }
];

/**
 * 可用字段配置
 */
export const AVAILABLE_FIELDS: FieldConfig[] = [
  { 
    name: 'resource-id', 
    label: 'Resource ID', 
    description: '控件的资源标识符',
    isCore: true
  },
  { 
    name: 'text', 
    label: '文本内容', 
    description: '控件显示的文本',
    isCore: true
  },
  { 
    name: 'content-desc', 
    label: '内容描述', 
    description: '无障碍内容描述',
    isCore: true
  },
  { 
    name: 'class', 
    label: '控件类型', 
    description: 'Android控件类名',
    isCore: true
  },
  { 
    name: 'package', 
    label: '包名', 
    description: '应用包名',
    isCore: false
  },
  { 
    name: 'bounds', 
    label: '位置边界', 
    description: '控件在屏幕上的位置',
    isCore: false
  },
  { 
    name: 'index', 
    label: '索引位置', 
    description: '在同级中的索引',
    isCore: false
  },
  { 
    name: 'enabled', 
    label: '启用状态', 
    description: '控件是否可用',
    isCore: false
  },
  { 
    name: 'focused', 
    label: '焦点状态', 
    description: '控件是否获得焦点',
    isCore: false
  },
  { 
    name: 'selected', 
    label: '选中状态', 
    description: '控件是否被选中',
    isCore: false
  },
  { 
    name: 'clickable', 
    label: '可点击', 
    description: '控件是否可以点击',
    isCore: false
  },
  { 
    name: 'checkable', 
    label: '可勾选', 
    description: '控件是否可以勾选',
    isCore: false
  }
];

/**
 * 策略推荐字段映射
 */
export const STRATEGY_RECOMMENDED_FIELDS: Record<MatchStrategy, string[]> = {
  // XPath 策略
  'xpath-direct': ['resource-id', 'text', 'class'],
  'xpath-first-index': ['resource-id', 'text', 'class'],
  'xpath-all-elements': ['resource-id', 'class'],
  
  // 传统策略
  'standard': ['resource-id', 'text', 'content-desc', 'class'],
  'strict': ['resource-id', 'text', 'content-desc', 'class', 'package'],
  'relaxed': ['resource-id', 'text'],
  'positionless': ['resource-id', 'text', 'content-desc'],
  'absolute': ['resource-id', 'text', 'content-desc', 'class', 'bounds', 'index'],
  
  // 特殊策略
  'hidden-element-parent': ['resource-id', 'text', 'class'],
  'custom': [],
  
  // 智能策略
  'self-anchor': ['resource-id', 'text', 'content-desc'],
  'child-anchor': ['resource-id', 'class'],
  'parent-clickable': ['resource-id', 'text'],
  'region-scoped': ['resource-id', 'text', 'bounds'],
  'neighbor-relative': ['resource-id', 'text'],
  'index-fallback': ['resource-id', 'class', 'index']
};

/**
 * 工具函数
 */

export const getStrategyOption = (strategy: MatchStrategy): StrategyOption | undefined => {
  return UNIFIED_STRATEGY_OPTIONS.find(option => option.value === strategy);
};

export const getStrategyOptionsByCategory = (category: string): StrategyOption[] => {
  return UNIFIED_STRATEGY_OPTIONS.filter(option => option.category === category);
};

export const getFieldConfig = (fieldName: string): FieldConfig | undefined => {
  return AVAILABLE_FIELDS.find(field => field.name === fieldName);
};

export const getRecommendedFields = (strategy: MatchStrategy): string[] => {
  return STRATEGY_RECOMMENDED_FIELDS[strategy] || [];
};