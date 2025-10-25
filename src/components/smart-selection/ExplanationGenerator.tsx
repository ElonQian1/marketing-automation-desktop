// src/components/smart-selection/ExplanationGenerator.tsx
// module: smart-selection | layer: ui | role: 解释语生成器
// summary: 根据配置生成自然语言描述

import React from 'react';
import { Card, Typography, Space, Tag } from 'antd';
import { BulbOutlined } from '@ant-design/icons';
import type { ExcludeRule } from './ExcludeRuleEditor';

const { Paragraph, Text } = Typography;

/**
 * 智能选择配置
 */
export interface SmartSelectionConfig {
  mode?: 'manual' | 'auto' | 'first' | 'last' | 'all';
  containerXPath?: string;
  targetText?: string;
  autoExcludeEnabled?: boolean;
  excludeRules?: ExcludeRule[];
  dedupeTolerance?: number;
  enableLightValidation?: boolean;
}

/**
 * 解释语生成器属性
 */
export interface ExplanationGeneratorProps {
  config: SmartSelectionConfig;
  /** 是否紧凑模式 */
  compact?: boolean;
}

/**
 * 解释语生成器组件
 */
export const ExplanationGenerator: React.FC<ExplanationGeneratorProps> = ({
  config,
  compact = false,
}) => {
  // 生成容器描述
  const getContainerDesc = () => {
    if (!config.containerXPath) return '整个页面';
    
    // 简化 XPath 显示
    const simplified = config.containerXPath
      .replace(/\/\//, '')
      .replace(/\[@[^\]]+\]/g, '')
      .split('/').pop() || config.containerXPath;
    
    return `"${simplified}"容器`;
  };

  // 生成目标描述
  const getTargetDesc = () => {
    if (!config.targetText) return '所有匹配元素';
    return `包含"${config.targetText}"的元素`;
  };

  // 生成模式描述
  const getModeDesc = () => {
    const modeMap = {
      'first': '选择第一个',
      'last': '选择最后一个',
      'all': '批量操作全部',
      'manual': '手动选择一个',
      'auto': '智能自动选择',
    };
    return modeMap[config.mode || 'first'] || '选择元素';
  };

  // 生成排除描述
  const getExcludeDesc = () => {
    const parts: string[] = [];
    
    if (config.autoExcludeEnabled !== false) {
      parts.push('自动排除"已关注/Following/互关"等常见状态');
    }
    
    if (config.excludeRules && config.excludeRules.length > 0) {
      const enabledRules = config.excludeRules.filter(r => r.enabled !== false);
      if (enabledRules.length > 0) {
        const ruleDescs = enabledRules.map(rule => {
          const attrMap = {
            'text': '文本',
            'content-desc': '描述',
            'resource-id': '资源ID',
            'class': '类名',
          };
          const opMap = {
            'equals': '等于',
            'contains': '包含',
            'regex': '匹配正则',
          };
          return `${attrMap[rule.attr]}${opMap[rule.op]}"${rule.value}"`;
        });
        parts.push(`手动排除${ruleDescs.join('、')}`);
      }
    }
    
    return parts.length > 0 ? parts.join('；') : null;
  };

  // 生成去重描述
  const getDedupeDesc = () => {
    if (config.dedupeTolerance !== undefined && config.dedupeTolerance !== 10) {
      return `去重容差 ${config.dedupeTolerance}px`;
    }
    if (config.dedupeTolerance === 10) {
      return '标准去重（10px容差）';
    }
    return null;
  };

  // 生成完整解释语
  const generateExplanation = () => {
    const parts: string[] = [];
    
    // 1. 容器范围
    parts.push(`在${getContainerDesc()}内`);
    
    // 2. 查找目标
    parts.push(`${getModeDesc()}${getTargetDesc()}`);
    
    // 3. 排除规则
    const excludeDesc = getExcludeDesc();
    if (excludeDesc) {
      parts.push(excludeDesc);
    }
    
    // 4. 去重
    const dedupeDesc = getDedupeDesc();
    if (dedupeDesc) {
      parts.push(dedupeDesc);
    }
    
    // 5. 验证
    if (config.enableLightValidation === false) {
      parts.push('跳过状态验证');
    } else {
      parts.push('验证状态变化');
    }
    
    return parts.join('，') + '。';
  };

  // 生成简化版解释
  const generateSimpleExplanation = () => {
    const excludeCount = (config.excludeRules?.filter(r => r.enabled !== false).length || 0)
      + (config.autoExcludeEnabled !== false ? 1 : 0);
    
    return (
      <Space size={8} wrap>
        <Tag icon={<BulbOutlined />} color="blue">
          {getModeDesc()}
        </Tag>
        {excludeCount > 0 && (
          <Tag color="orange">
            {excludeCount} 个排除规则
          </Tag>
        )}
        {config.dedupeTolerance !== undefined && (
          <Tag color="cyan">
            去重 {config.dedupeTolerance}px
          </Tag>
        )}
        {config.enableLightValidation !== false && (
          <Tag color="green">
            轻校验
          </Tag>
        )}
      </Space>
    );
  };

  if (compact) {
    return (
      <div style={{
        padding: '8px 12px',
        background: '#f0f7ff',
        borderRadius: 4,
        border: '1px solid #bae7ff',
      }}>
        {generateSimpleExplanation()}
      </div>
    );
  }

  return (
    <Card
      size="small"
      title={
        <Space>
          <BulbOutlined style={{ color: '#1890ff' }} />
          <Text strong>执行流程解释</Text>
        </Space>
      }
      style={{ marginBottom: 12 }}
    >
      <Paragraph style={{ marginBottom: 16, fontSize: '13px', lineHeight: '1.8' }}>
        {generateExplanation()}
      </Paragraph>

      {/* 详细步骤 */}
      <div style={{ background: '#fafafa', padding: 12, borderRadius: 4 }}>
        <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600 }}>
          详细步骤：
        </Text>
        <ol style={{ margin: '8px 0 0 0', padding: '0 0 0 20px', fontSize: '12px' }}>
          <li>
            <strong>范围限定</strong>：在 {getContainerDesc()} 内查找
          </li>
          <li>
            <strong>元素筛选</strong>：找到 {getTargetDesc()}
          </li>
          {config.autoExcludeEnabled !== false && (
            <li>
              <strong>🤖 自动排除</strong>：跳过已关注/互关等状态
            </li>
          )}
          {config.excludeRules && config.excludeRules.filter(r => r.enabled !== false).length > 0 && (
            <li>
              <strong>🚫 手动排除</strong>：应用 {config.excludeRules.filter(r => r.enabled !== false).length} 条自定义规则
            </li>
          )}
          {config.dedupeTolerance !== undefined && (
            <li>
              <strong>🔄 去重</strong>：基于位置（容差 {config.dedupeTolerance}px）去除重复
            </li>
          )}
          <li>
            <strong>📌 选择</strong>：{getModeDesc()}
          </li>
          <li>
            <strong>✅ 验证</strong>：
            {config.enableLightValidation !== false 
              ? '点击后验证状态变化（如"关注"→"已关注"）' 
              : '跳过验证，直接成功'
            }
          </li>
        </ol>
      </div>

      {/* 风险提示 */}
      {config.excludeRules && config.excludeRules.some(r => r.op === 'regex' && r.enabled !== false) && (
        <div style={{
          marginTop: 12,
          padding: '8px 12px',
          background: '#fff7e6',
          border: '1px solid #ffd591',
          borderRadius: 4,
          fontSize: '12px',
        }}>
          ⚠️ <strong>性能提示</strong>：检测到正则表达式规则，可能影响执行速度。建议优先使用"等于"或"包含"匹配。
        </div>
      )}
    </Card>
  );
};
