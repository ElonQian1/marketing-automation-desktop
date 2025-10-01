import React from 'react';
import { Card, Button, Tag, Space, Typography, Tooltip } from 'antd';
import { SelectOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { DiscoveredElement, ChildElementCardProps } from './types';

const { Text, Title } = Typography;

/**
 * 子元素展示卡片 - 用于显示子元素信息和操作
 * 特别关注包含文本内容的子元素，帮助用户选择更精确的元素
 */
export const ChildElementCard: React.FC<ChildElementCardProps> = ({
  element,
  onSelect,
  onShowDetails,
}) => {
  // 提取元素基本信息
  const { element: uiElement, confidence, reason } = element;
  const elementType = uiElement.class_name || uiElement.resource_id || '未知元素';
  const hasText = Boolean(uiElement.text && uiElement.text.trim());
  const isClickable = uiElement.is_clickable;
  
  // 计算置信度颜色
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return '#52c41a'; // 绿色
    if (confidence >= 0.6) return '#faad14'; // 橙色
    return '#ff4d4f'; // 红色
  };

  // 构建元素描述
  const buildElementDescription = (): string => {
    const parts: string[] = [];
    
    // 显示文本内容
    if (uiElement.text && uiElement.text.trim()) {
      parts.push(`文本: "${uiElement.text.trim()}"`);
    }
    
    // 显示内容描述
    if (uiElement.content_desc && uiElement.content_desc.trim()) {
      parts.push(`描述: "${uiElement.content_desc.trim()}"`);
    }
    
    // 显示资源ID
    if (uiElement.resource_id && uiElement.resource_id.trim()) {
      parts.push(`ID: ${uiElement.resource_id}`);
    }
    
    // 显示类名
    if (uiElement.class_name && uiElement.class_name.trim()) {
      const className = uiElement.class_name.split('.').pop() || uiElement.class_name;
      parts.push(`类型: ${className}`);
    }
    
    // 如果没有找到任何有用信息，提供基本信息
    if (parts.length === 0) {
      const basicInfo: string[] = [];
      
      if (uiElement.element_type) {
        basicInfo.push(`元素: ${uiElement.element_type}`);
      }
      
      const interactions: string[] = [];
      if (uiElement.is_clickable) interactions.push('可点击');
      if (uiElement.is_scrollable) interactions.push('可滚动');
      
      if (interactions.length > 0) {
        basicInfo.push(interactions.join(', '));
      }
      
      return basicInfo.length > 0 ? basicInfo.join(' | ') : `${uiElement.element_type || 'UI'}元素（无标识信息）`;
    }
    
    return parts.join(' | ');
  };

  // 获取推荐原因显示文本
  const getReasonText = (reason: string): string => {
    const reasonMap: Record<string, string> = {
      'has_text': '包含文本内容',
      'clickable_with_text': '可点击且包含文本',
      'content_description': '有内容描述',
      'similar_bounds': '位置相近',
      'same_parent': '同级元素',
      'text_rich': '文本丰富',
    };
    
    return reasonMap[reason] || reason;
  };

  return (
    <Card
      size="small"
      hoverable
      className="light-theme-force" // 添加强制主题覆盖类
      style={{ 
        marginBottom: 8,
        borderLeft: `3px solid ${getConfidenceColor(confidence)}`,
        transition: 'all 0.2s ease',
        background: 'var(--bg-light-elevated, #ffffff)',
        color: 'var(--text-inverse, #1e293b)'
      }}
      styles={{
        body: { padding: 12 }
      }}
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {/* 标题行 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Title level={5} style={{ margin: 0, fontSize: 13, color: 'var(--text-inverse, #1e293b) !important' }}>
              {elementType}
            </Title>
            <Text type="secondary" style={{ fontSize: 11, color: 'var(--text-muted, #999) !important' }}>
              置信度: {(confidence * 100).toFixed(0)}%
            </Text>
          </div>
          
          {/* 元素特征标签 */}
          <Space size={4}>
            {hasText && (
              <Tag color="green" style={{ fontSize: 10 }}>
                含文本
              </Tag>
            )}
            {isClickable && (
              <Tag color="blue" style={{ fontSize: 10 }}>
                可点击
              </Tag>
            )}
          </Space>
        </div>

        {/* 元素描述 */}
        <div style={{ 
          backgroundColor: 'var(--bg-light-elevated, #f8f9fa)', 
          color: 'var(--text-inverse, #1e293b)',
          padding: 8, 
          borderRadius: 4,
          fontSize: 12
        }}>
          {buildElementDescription()}
        </div>

        {/* 推荐原因 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 11, color: 'var(--text-muted, #666)' }}>
            推荐原因:
          </Text>
          <Tag 
            color="processing" 
            style={{ fontSize: 10, margin: 0 }}
          >
            {getReasonText(reason)}
          </Tag>
        </div>

        {/* 位置信息 */}
        {uiElement.bounds && (
          <div style={{ fontSize: 11, color: 'var(--text-muted, #999)' }}>
            位置: [{uiElement.bounds.left}, {uiElement.bounds.top}, {uiElement.bounds.right}, {uiElement.bounds.bottom}]
          </div>
        )}

        {/* 操作按钮 */}
        <Space style={{ marginTop: 4 }}>
          <Button
            type="primary"
            size="small"
            icon={<SelectOutlined />}
            onClick={() => onSelect(element)}
            style={{ fontSize: 11 }}
          >
            选择此元素
          </Button>
          <Tooltip title="查看详细信息">
            <Button
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={() => onShowDetails(element)}
              style={{ fontSize: 11 }}
            >
              详情
            </Button>
          </Tooltip>
        </Space>
      </Space>
    </Card>
  );
};

export default ChildElementCard;