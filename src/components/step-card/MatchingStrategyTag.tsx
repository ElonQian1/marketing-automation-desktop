// src/components/step-card/MatchingStrategyTag.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Tag, Tooltip } from 'antd';

/**
 * 🎯 【XPath策略扩展指南】- 如何添加新的匹配策略
 * 
 * 如果你想添加新的匹配策略（如"使用[1]索引"、"返回所有同类按钮"），需要：
 * 
 * 1. ✅ 在这里的 MatchingStrategy 类型中添加新策略名称
 * 2. ✅ 在下方 STRATEGY_META 中添加显示配置（颜色、标签、提示）
 * 3. ✅ 在 MatchingStrategySelector.tsx 中的 STRATEGY_LIST 添加策略选项
 * 4. ✅ 在后端 Rust 代码中实现对应的策略处理器
 * 5. ✅ 确保前端 useAdb().matchElementByCriteria() 能正确传递策略参数
 * 
 * 当前已支持的策略：
 * 
 * 静态策略：
 * - 'standard': 标准匹配 - 跨设备稳定的语义字段匹配
 * - 'strict': 严格匹配 - 多字段组合匹配，稳定性高
 * - 'relaxed': 宽松匹配 - 少数字段或模糊匹配，兼容性好
 * 
 * XPath 策略：
 * - 'xpath-direct': XPath直接索引 - 最快匹配，直接通过路径定位
 * - 'xpath-first-index': 使用[1]索引 - 匹配第一个符合条件的元素
 * - 'xpath-all-elements': 返回所有同类按钮 - 获取所有符合条件的同类元素
 * 
 * 智能策略：
 * - 'self-anchor': 自我锚点 - 基于元素自身特征的智能匹配
 * - 'child-anchor': 子锚点 - 基于子元素特征的上级匹配
 * - 'parent-clickable': 父可点击 - 查找可点击的父容器元素
 * - 'region-scoped': 区域限定 - 特定区域范围内的智能匹配
 * - 'neighbor-relative': 邻居相对 - 基于相邻元素相对位置的匹配
 * - 'index-fallback': 索引兜底 - 基于位置索引的兜底策略
 */
export type MatchingStrategy = 
  // 静态策略
  | 'absolute' | 'strict' | 'relaxed' | 'positionless' | 'standard' 
  // XPath 策略
  | 'xpath-direct' | 'xpath-first-index' | 'xpath-all-elements' 
  // 智能策略
  | 'self-anchor' | 'child-anchor' | 'parent-clickable' | 'region-scoped' | 'neighbor-relative' | 'index-fallback'
  // 其他策略
  | 'custom' | 'hidden-element-parent' | string;

export interface MatchingStrategyTagProps {
  strategy?: MatchingStrategy | null;
  small?: boolean;
}

/**
 * 🎨 【策略显示配置】- 如何配置策略的UI显示效果
 * 
 * 每个策略需要配置：
 * - color: Ant Design Tag 颜色（如 'red', 'blue', 'gold', 'lime', 'volcano'）
 * - label: 步骤卡片中显示的简短标签
 * - tip: 鼠标悬停时显示的详细说明
 * 
 * 🔧 调试提示：
 * - 如果步骤卡片显示的策略不正确，检查步骤参数中的 matching.strategy 值
 * - 如果看到 "匹配标准" 而不是期望的策略，可能是策略值没有正确传递
 * - 新增策略时，确保这里的 key 与 MatchingStrategy 类型定义一致
 */
const STRATEGY_META: Record<string, { color: string; label: string; tip: string }> = {
  // 🏷️ 静态策略配置
  absolute: { color: 'red', label: '绝对', tip: '绝对定位：依赖精确 XPath/坐标，最稳定但跨设备脆弱' },
  strict: { color: 'blue', label: '严格', tip: '严格匹配：class/resourceId/text 等多字段组合，稳定性高' },
  relaxed: { color: 'green', label: '宽松', tip: '宽松匹配：少数字段或模糊匹配，兼容性更好' },
  positionless: { color: 'purple', label: '无位置', tip: '无位置匹配：忽略 bounds，仅用语义字段匹配' },
  standard: { color: 'cyan', label: '标准', tip: '标准匹配：跨设备稳定，忽略位置/分辨率差异，仅用语义字段' },
  
  // 🎯 XPath 策略配置 - 新增的策略显示效果
  'xpath-direct': { color: 'gold', label: 'XPath直接', tip: 'XPath 直接索引：最快的匹配速度，直接通过路径定位，设备相关性强' },
  'xpath-first-index': { color: 'lime', label: 'XPath[1]', tip: 'XPath 使用[1]索引：匹配第一个符合条件的元素，适用于多个相同元素的场景' },
  'xpath-all-elements': { color: 'volcano', label: 'XPath全部', tip: 'XPath 返回所有元素：获取所有符合条件的同类元素，适用于批量操作' },
  custom: { color: 'gray', label: '自定义', tip: '自定义匹配：由用户勾选的字段集合，可能与任何预设不同' },
  'hidden-element-parent': { color: 'orange', label: '隐藏元素', tip: '隐藏元素父查找：自动遍历父容器找到可点击元素，适用于bounds=[0,0][0,0]的隐藏元素' },
  
  // ⚡ 智能策略配置 - 新增智能策略显示效果
  'self-anchor': { color: 'blue', label: '自我锚点', tip: '智能策略：基于元素自身的文本或属性特征进行匹配，适应性强' },
  'child-anchor': { color: 'green', label: '子锚点', tip: '智能策略：基于子元素的特征进行上级匹配，适用于复合组件' },
  'parent-clickable': { color: 'orange', label: '父可点击', tip: '智能策略：查找可点击的父容器元素，解决嵌套点击问题' },
  'region-scoped': { color: 'purple', label: '区域限定', tip: '智能策略：在特定区域范围内进行匹配，提高准确性' },
  'neighbor-relative': { color: 'cyan', label: '邻居相对', tip: '智能策略：基于相邻元素的相对位置进行匹配，适用于列表项' },
  'index-fallback': { color: 'red', label: '索引兜底', tip: '智能策略：基于元素位置索引的兜底匹配策略，最后备选方案' },
};

export const MatchingStrategyTag: React.FC<MatchingStrategyTagProps> = ({ strategy, small }) => {
  if (!strategy) return null;
  const key = String(strategy).toLowerCase();
  const meta = STRATEGY_META[key] || { color: 'default', label: key, tip: `匹配策略：${key}` };
  const tag = (
    <Tag color={meta.color} style={{ marginLeft: 8, height: small ? 20 : undefined, lineHeight: small ? '20px' : undefined }}>
      匹配: {meta.label}
    </Tag>
  );
  return <Tooltip title={meta.tip}>{tag}</Tooltip>;
};

export default MatchingStrategyTag;
