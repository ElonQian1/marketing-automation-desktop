import React from 'react';
import { Card, Button, Tag, Space, Typography, Tooltip } from 'antd';
import { SelectOutlined, InfoCircleOutlined, UserOutlined } from '@ant-design/icons';
import { DiscoveredElement } from './types';

const { Text, Title } = Typography;

interface SelfElementCardProps {
  element: DiscoveredElement;
  onSelect: (element: DiscoveredElement) => void;
  onShowDetails?: (element: DiscoveredElement) => void;
}

/**
 * 自己元素展示卡片 - 用于显示当前选中的元素信息
 * 让用户可以重新确认选择当前元素，或查看其详细信息
 */
export const SelfElementCard: React.FC<SelfElementCardProps> = ({
  element,
  onSelect,
  onShowDetails,
}) => {
  // 提取元素基本信息
  const { element: uiElement, confidence, reason } = element;
  const elementType = uiElement.class_name || uiElement.resource_id || '未知元素';
  const hasText = Boolean(uiElement.text && uiElement.text.trim());
  const isClickable = uiElement.is_clickable;
  
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
    
    if (uiElement.class_name) {
      parts.push(`类型: ${uiElement.class_name}`);
    }
    
    return parts.join(' | ') || '无详细信息';
  };

  return (
    <Card
      size="small"
      style={{ 
        marginBottom: 8,
        borderLeft: `4px solid #1890ff`, // 蓝色边框表示这是当前选中的元素
        background: '#f0f7ff',
        transition: 'all 0.2s ease'
      }}
      styles={{
        body: { padding: 16 }
      }}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {/* 标题行 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <UserOutlined style={{ color: '#1890ff', fontSize: 16 }} />
              <Title level={5} style={{ margin: 0, fontSize: 14, color: '#1890ff' }}>
                当前选中元素
              </Title>
            </div>
            <Title level={4} style={{ margin: 0, fontSize: 16 }}>
              {elementType}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              置信度: {(confidence * 100).toFixed(0)}% | {reason}
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
            <Tag color="processing" style={{ fontSize: 10 }}>
              当前选中
            </Tag>
          </Space>
        </div>

        {/* 元素描述 */}
        <div style={{ 
          backgroundColor: '#fff', 
          padding: 12, 
          borderRadius: 6,
          border: '1px solid #d9d9d9',
          fontSize: 13
        }}>
          {buildElementDescription()}
        </div>

        {/* 位置信息 */}
        {uiElement.bounds && (
          <div style={{ fontSize: 11, color: '#999' }}>
            <strong>位置:</strong> [{uiElement.bounds.left}, {uiElement.bounds.top}, {uiElement.bounds.right}, {uiElement.bounds.bottom}]
          </div>
        )}

        {/* XPath 信息 */}
        {uiElement.xpath && (
          <div style={{ fontSize: 11, color: '#999' }}>
            <strong>XPath:</strong> 
            <Text 
              code 
              style={{ 
                fontSize: 10, 
                marginLeft: 4,
                maxWidth: '100%',
                wordBreak: 'break-all'
              }}
            >
              {uiElement.xpath}
            </Text>
          </div>
        )}

        {/* 提示信息 */}
        <div style={{ 
          backgroundColor: '#e6f7ff', 
          padding: 8, 
          borderRadius: 4,
          fontSize: 12,
          color: '#0958d9'
        }}>
          💡 这是您当前选中的元素。如果此元素符合您的需求，可以直接确认使用。
        </div>

        {/* 操作按钮 */}
        <Space style={{ marginTop: 8 }}>
          <Button
            type="primary"
            size="small"
            icon={<SelectOutlined />}
            onClick={() => onSelect(element)}
            style={{ fontSize: 11 }}
          >
            确认使用此元素
          </Button>
          <Tooltip title="查看详细信息">
            <Button
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={() => onShowDetails?.(element)}
              style={{ fontSize: 11 }}
            >
              查看详情
            </Button>
          </Tooltip>
        </Space>
      </Space>
    </Card>
  );
};

export default SelfElementCard;