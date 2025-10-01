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
    
    if (uiElement.text) {
      parts.push(`文本: "${uiElement.text}"`);
    }
    
    if (uiElement.content_desc) {
      parts.push(`描述: "${uiElement.content_desc}"`);
    }
    
    if (uiElement.resource_id) {
      parts.push(`ID: ${uiElement.resource_id}`);
    }
    
    return parts.join(' | ') || '无详细信息';
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
      style={{ 
        marginBottom: 8,
        borderLeft: `3px solid ${getConfidenceColor(confidence)}`,
        transition: 'all 0.2s ease'
      }}
      styles={{
        body: { padding: 12 }
      }}
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {/* 标题行 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Title level={5} style={{ margin: 0, fontSize: 13 }}>
              {elementType}
            </Title>
            <Text type="secondary" style={{ fontSize: 11 }}>
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
          backgroundColor: '#f8f9fa', 
          padding: 8, 
          borderRadius: 4,
          fontSize: 12
        }}>
          {buildElementDescription()}
        </div>

        {/* 推荐原因 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 11, color: '#666' }}>
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
          <div style={{ fontSize: 11, color: '#999' }}>
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