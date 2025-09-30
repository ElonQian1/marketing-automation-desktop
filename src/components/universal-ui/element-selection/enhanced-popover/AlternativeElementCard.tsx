/**
 * 替代元素卡片组件
 * 显示单个替代元素的信息和选择按钮
 */

import React from 'react';
import { Card, Button, Tag, Space, Typography } from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  SwapOutlined,
  CheckOutlined 
} from '@ant-design/icons';
import type { AlternativeElement } from '../hierarchy/types';

const { Text } = Typography;

interface AlternativeElementCardProps {
  /** 替代元素信息 */
  alternative: AlternativeElement;
  /** 选择回调 */
  onSelect: (alternative: AlternativeElement) => void;
  /** 是否紧凑模式 */
  compact?: boolean;
}

export const AlternativeElementCard: React.FC<AlternativeElementCardProps> = ({
  alternative,
  onSelect,
  compact = false
}) => {
  const { node, relationship, distance, qualityScore, reason } = alternative;
  const element = node.element;

  // 获取关系图标
  const getRelationshipIcon = () => {
    switch (relationship) {
      case 'parent':
      case 'ancestor':
        return <ArrowUpOutlined style={{ color: '#1890ff' }} />;
      case 'child':
      case 'descendant':
        return <ArrowDownOutlined style={{ color: '#52c41a' }} />;
      case 'sibling':
        return <SwapOutlined style={{ color: '#faad14' }} />;
      default:
        return null;
    }
  };

  // 获取关系描述
  const getRelationshipText = () => {
    switch (relationship) {
      case 'parent':
        return '父元素';
      case 'ancestor':
        return `祖先元素 (${distance}层)`;
      case 'child':
        return '子元素';
      case 'descendant':
        return `后代元素 (${distance}层)`;
      case 'sibling':
        return '兄弟元素';
      default:
        return '相关元素';
    }
  };

  // 获取质量等级
  const getQualityLevel = () => {
    if (qualityScore >= 80) return { color: 'success', text: '优秀' };
    if (qualityScore >= 60) return { color: 'processing', text: '良好' };
    if (qualityScore >= 40) return { color: 'warning', text: '一般' };
    return { color: 'error', text: '较差' };
  };

  const qualityLevel = getQualityLevel();

  return (
    <Card
      size="default"
      className={`alternative-element-card ${compact ? 'compact' : ''}`}
      style={{
        marginBottom: compact ? 6 : 8,
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: '1px solid #f0f0f0'
      }}
      bodyStyle={{ 
        padding: compact ? '8px 12px' : '12px 16px' 
      }}
      hoverable
      onClick={() => onSelect(alternative)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* 左侧信息 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 关系和类型 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            {getRelationshipIcon()}
            <Text strong style={{ fontSize: compact ? 12 : 13 }}>
              {getRelationshipText()}
            </Text>
            <Tag color={qualityLevel.color}>
              {qualityLevel.text}
            </Tag>
          </div>

          {/* 元素内容 */}
          <div style={{ marginBottom: compact ? 4 : 6 }}>
            {element.text && (
              <div style={{ marginBottom: 2 }}>
                <Text 
                  style={{ 
                    fontSize: compact ? 11 : 12, 
                    color: '#262626',
                    fontWeight: 500
                  }}
                >
                  文本: {`"${element.text.substring(0, 20)}${element.text.length > 20 ? '...' : ''}"`}
                </Text>
              </div>
            )}
            
            {element.resource_id && (
              <div style={{ marginBottom: 2 }}>
                <Text style={{ fontSize: compact ? 10 : 11, color: '#666' }}>
                  ID: {element.resource_id.substring(0, 30)}
                </Text>
              </div>
            )}
            
            {element.content_desc && (
              <div style={{ marginBottom: 2 }}>
                <Text style={{ fontSize: compact ? 10 : 11, color: '#666' }}>
                  描述: {element.content_desc.substring(0, 30)}
                </Text>
              </div>
            )}
          </div>

          {/* 推荐原因 */}
          <Text 
            style={{ 
              fontSize: compact ? 10 : 11, 
              color: '#8c8c8c',
              fontStyle: 'italic'
            }}
          >
            {reason}
          </Text>
        </div>

        {/* 右侧选择按钮 */}
        <div style={{ marginLeft: 12, flexShrink: 0 }}>
          <Button
            type="primary"
            size="middle"
            icon={<CheckOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(alternative);
            }}
            style={{
              fontSize: compact ? 11 : 12,
              height: compact ? 24 : 28
            }}
          >
            选择
          </Button>
        </div>
      </div>

      {/* 额外信息（非紧凑模式） */}
      {!compact && (
        <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid #f5f5f5' }}>
          <Space size={8}>
            {element.is_clickable && (
              <Tag color="blue">可点击</Tag>
            )}
            {element.is_scrollable && (
              <Tag color="green">可滚动</Tag>
            )}
            <Text style={{ fontSize: 10, color: '#999' }}>
              质量分: {Math.round(qualityScore)}
            </Text>
          </Space>
        </div>
      )}
    </Card>
  );
};