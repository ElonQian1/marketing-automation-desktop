// @ts-nocheck
/**
 * 父元素卡片组件
 * 显示父级容器元素的信息和操作
 */

import React from 'react';
import { Card, Button, Tag, Space, Typography, Tooltip } from 'antd';
import { 
  ArrowUpOutlined, 
  EyeOutlined, 
  CheckOutlined,
  InfoCircleOutlined,
  ContainerOutlined
} from '@ant-design/icons';
import type { ElementCardProps } from './types';

const { Text } = Typography;

export const ParentElementCard: React.FC<ElementCardProps> = ({
  element,
  onSelect,
  onPreview,
  compact = false
}) => {
  const { element: uiElement, confidence, reason, hasText, isClickable } = element;

  // 获取元素显示名称
  const getDisplayName = () => {
    return uiElement.text?.trim() || 
           uiElement.resource_id || 
           uiElement.class_name || 
           '未知父元素';
  };

  // 获取置信度颜色
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return '#52c41a'; // 绿色
    if (conf >= 0.6) return '#faad14'; // 橙色
    return '#ff4d4f'; // 红色
  };

  // 获取元素类型标签
  const getElementTypeTag = () => {
    const className = uiElement.class_name || '';
    if (className.includes('LinearLayout')) return '线性布局';
    if (className.includes('RelativeLayout')) return '相对布局';
    if (className.includes('FrameLayout')) return '框架布局';
    if (className.includes('RecyclerView')) return '列表容器';
    if (className.includes('ScrollView')) return '滚动容器';
    return '容器';
  };

  return (
    <Card
      size="small"
      style={{ 
        marginBottom: compact ? 8 : 12,
        border: `2px solid ${getConfidenceColor(confidence)}`,
        borderRadius: 8
      }}
      bodyStyle={{ padding: compact ? 8 : 12 }}
      title={
        <Space size="small">
          <ArrowUpOutlined style={{ color: '#1890ff' }} />
          <ContainerOutlined />
          <Text strong style={{ fontSize: compact ? 12 : 14 }}>
            父级元素
          </Text>
          <Tag color="blue" style={{ fontSize: 10 }}>
            {getElementTypeTag()}
          </Tag>
        </Space>
      }
      extra={
        <Tooltip title={`匹配置信度: ${(confidence * 100).toFixed(0)}%`}>
          <Tag 
            color={confidence >= 0.7 ? 'green' : confidence >= 0.5 ? 'orange' : 'red'}
            style={{ fontSize: 10 }}
          >
            {(confidence * 100).toFixed(0)}%
          </Tag>
        </Tooltip>
      }
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* 元素名称 */}
        <div>
          <Text strong style={{ fontSize: compact ? 12 : 13 }}>
            {getDisplayName()}
          </Text>
          {hasText && (
            <Tag color="green" style={{ marginLeft: 8, fontSize: 10 }}>
              含文本
            </Tag>
          )}
          {isClickable && (
            <Tag color="blue" style={{ marginLeft: 4, fontSize: 10 }}>
              可点击
            </Tag>
          )}
        </div>

        {/* 发现原因 */}
        <div>
          <Space size="small">
            <InfoCircleOutlined style={{ color: '#666', fontSize: 12 }} />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {reason}
            </Text>
          </Space>
        </div>

        {/* 元素详细信息 */}
        {!compact && (
          <div style={{ fontSize: 10, color: '#999' }}>
            {uiElement.resource_id && (
              <div>ID: {uiElement.resource_id}</div>
            )}
            <div>类型: {uiElement.class_name}</div>
            {uiElement.bounds && (
              <div>
                位置: [{uiElement.bounds.left}, {uiElement.bounds.top}] 
                大小: {uiElement.bounds.right - uiElement.bounds.left} × {uiElement.bounds.bottom - uiElement.bounds.top}
              </div>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <Space size="small" style={{ marginTop: 8 }}>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => onSelect(element)}
          >
            选择此父元素
          </Button>
          
          {onPreview && (
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onPreview(element)}
            >
              预览
            </Button>
          )}
        </Space>
      </Space>
    </Card>
  );
};