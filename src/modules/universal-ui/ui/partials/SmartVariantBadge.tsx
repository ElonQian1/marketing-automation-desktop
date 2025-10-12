// src/modules/universal-ui/ui/partials/SmartVariantBadge.tsx
// module: universal-ui | layer: ui | role: component
// summary: 智能策略变体标签组件，展示6种智能策略变体的详细信息

import React from 'react';
import { Tag, Tooltip, Badge, Space } from 'antd';
import { 
  AimOutlined, 
  NodeIndexOutlined, 
  InteractionOutlined,
  BorderOutlined,
  ArrowsAltOutlined,
  NumberOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import type { 
  SmartMatchVariant, 
  SmartVariantParams,
  SmartStrategy 
} from '../../domain/public/selector/StrategyContracts';

/**
 * 智能变体标签属性接口
 */
export interface SmartVariantBadgeProps {
  /** 智能策略 */
  strategy: SmartStrategy;
  /** 是否显示详细参数 */
  showParams?: boolean;
  /** 标签大小 */
  size?: 'small' | 'default';
  /** 是否显示置信度 */
  showConfidence?: boolean;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 变体配置映射
 */
const VARIANT_CONFIG: Record<SmartMatchVariant, {
  label: string;
  color: string;
  icon: React.ReactNode;
  description: string;
}> = {
  'self-anchor': {
    label: '自我锚点',
    color: 'blue',
    icon: <AimOutlined />,
    description: '基于元素自身的文本或属性特征进行匹配'
  },
  'child-anchor': {
    label: '子锚点',
    color: 'green',
    icon: <NodeIndexOutlined />,
    description: '基于子元素的特征进行上级匹配'
  },
  'parent-clickable': {
    label: '父可点击',
    color: 'orange',
    icon: <InteractionOutlined />,
    description: '查找可点击的父容器元素'
  },
  'region-scoped': {
    label: '区域限定',
    color: 'purple',
    icon: <BorderOutlined />,
    description: '在特定区域范围内进行匹配'
  },
  'neighbor-relative': {
    label: '邻居相对',
    color: 'cyan',
    icon: <ArrowsAltOutlined />,
    description: '基于相邻元素的相对位置进行匹配'
  },
  'index-fallback': {
    label: '索引兜底',
    color: 'red',
    icon: <NumberOutlined />,
    description: '基于元素位置索引的兜底匹配策略'
  }
};

/**
 * 智能策略变体标签组件
 */
export const SmartVariantBadge: React.FC<SmartVariantBadgeProps> = ({
  strategy,
  showParams = false,
  size = 'default',
  showConfidence = true,
  className = ''
}) => {
  const variant = strategy.selector.variant;
  const config = VARIANT_CONFIG[variant];
  const confidence = strategy.confidence || strategy.selector.score || 0;

  if (!config) {
    return (
      <Tag color="default" className={className}>
        未知变体
      </Tag>
    );
  }

  // 构建参数显示文本
  const paramText = showParams ? getParamDisplayText(strategy.selector.params) : '';
  
  // 构建提示内容
  const tooltipContent = (
    <div className="light-theme-force">
      <div style={{ marginBottom: 8 }}>
        <strong>{config.label}</strong>
      </div>
      <div style={{ marginBottom: 8, color: 'var(--text-2, #64748b)' }}>
        {config.description}
      </div>
      {strategy.selector.rationale && (
        <div style={{ marginBottom: 8 }}>
          <strong>推理说明：</strong>
          <br />
          {strategy.selector.rationale}
        </div>
      )}
      {showConfidence && (
        <div style={{ marginBottom: 8 }}>
          <strong>置信度：</strong> {(confidence * 100).toFixed(1)}%
        </div>
      )}
      {paramText && (
        <div>
          <strong>参数：</strong> {paramText}
        </div>
      )}
      <div style={{ marginTop: 8, fontSize: '12px', color: 'var(--text-3, #94a3b8)' }}>
        提供方: {strategy.provider} v{strategy.version}
      </div>
    </div>
  );

  return (
    <div className={`light-theme-force ${className}`}>
      <Tooltip title={tooltipContent} placement="top">
        <Space size={4}>
          <Badge 
            count={showConfidence ? `${(confidence * 100).toFixed(0)}%` : 0}
            showZero={false}
            size={size}
            style={{ 
              backgroundColor: getConfidenceColor(confidence),
              fontSize: size === 'small' ? '10px' : '12px'
            }}
          >
            <Tag 
              color={config.color} 
              icon={config.icon}
              className={size === 'small' ? 'text-xs' : ''}
            >
              {config.label}
            </Tag>
          </Badge>
          
          {paramText && showParams && (
            <Tag 
              color="default" 
              icon={<InfoCircleOutlined />}
              className={`${size === 'small' ? 'text-xs' : ''} opacity-75`}
            >
              {paramText}
            </Tag>
          )}
        </Space>
      </Tooltip>
    </div>
  );
};

/**
 * 获取参数显示文本
 */
function getParamDisplayText(params?: SmartVariantParams): string {
  if (!params) return '';

  switch (params.variant) {
    case 'self-anchor':
      return params.anchorText ? `文本:"${params.anchorText}"` : 
             params.similarity ? `相似度:${(params.similarity * 100).toFixed(0)}%` : '';
    
    case 'child-anchor':
      return params.childText ? `子元素:"${params.childText}"` :
             params.distance ? `距离:${params.distance}` : '';
    
    case 'parent-clickable':
      return params.role ? `角色:${params.role}` : '';
    
    case 'region-scoped':
      return params.regionCss ? '区域CSS' : 
             params.regionXpath ? '区域XPath' : '';
    
    case 'neighbor-relative':
      const relation = params.relation ? `方向:${getRelationLabel(params.relation)}` : '';
      const distance = params.distance ? `距离:${params.distance}` : '';
      return [relation, distance].filter(Boolean).join(' ');
    
    case 'index-fallback':
      return params.of ? `${params.of}[${params.index}]` : `索引:${params.index}`;
    
    default:
      return '';
  }
}

/**
 * 获取方向标签
 */
function getRelationLabel(relation: 'left' | 'right' | 'above' | 'below'): string {
  const labels = {
    left: '左侧',
    right: '右侧', 
    above: '上方',
    below: '下方'
  };
  return labels[relation] || relation;
}

/**
 * 根据置信度获取颜色
 */
function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return '#52c41a'; // 绿色
  if (confidence >= 0.6) return '#faad14'; // 橙色
  if (confidence >= 0.4) return '#fa8c16'; // 橙红色
  return '#f5222d'; // 红色
}

/**
 * 简化版智能变体标签（仅显示变体类型）
 */
export const SimpleVariantBadge: React.FC<{
  variant: SmartMatchVariant;
  size?: 'small' | 'default';
}> = ({ variant, size = 'default' }) => {
  const config = VARIANT_CONFIG[variant];
  
  if (!config) {
    return <Tag color="default">未知</Tag>;
  }

  return (
    <Tooltip title={config.description}>
      <Tag 
        color={config.color} 
        icon={config.icon}
        className={size === 'small' ? 'text-xs' : ''}
      >
        {config.label}
      </Tag>
    </Tooltip>
  );
};

export default SmartVariantBadge;