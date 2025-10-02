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
    // 优先显示文本内容
    if (uiElement.text && uiElement.text.trim()) {
      return `"${uiElement.text.trim()}"`;
    }
    
    // 然后是内容描述
    if (uiElement.content_desc && uiElement.content_desc.trim()) {
      return `"${uiElement.content_desc.trim()}"`;
    }
    
    // 接着是资源ID
    if (uiElement.resource_id && uiElement.resource_id.trim()) {
      return uiElement.resource_id;
    }
    
    // 最后是类名（简化显示）
    if (uiElement.class_name && uiElement.class_name.trim()) {
      const className = uiElement.class_name.split('.').pop() || uiElement.class_name;
      return className;
    }
    
    // 如果都没有，显示元素类型
    if (uiElement.element_type && uiElement.element_type.trim()) {
      return `${uiElement.element_type}元素`;
    }
    
    return '未知父元素';
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
      className="light-theme-force" // 添加强制主题覆盖类
      style={{ 
        marginBottom: compact ? 8 : 12,
        border: `2px solid ${getConfidenceColor(confidence)}`,
        borderRadius: 8,
        background: 'var(--bg-light-elevated, #ffffff)',
        color: 'var(--text-inverse, #1e293b)'
      }}
      bodyStyle={{ padding: compact ? 8 : 12 }}
      title={
        <Space size="small">
          <ArrowUpOutlined style={{ color: 'var(--brand, #1890ff)' }} />
          <ContainerOutlined />
          <Text strong style={{ fontSize: compact ? 12 : 14, color: 'var(--text-inverse, #1e293b) !important' }}>
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
          <Text strong style={{ fontSize: compact ? 12 : 13, color: 'var(--text-inverse, #1e293b) !important' }}>
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
            <InfoCircleOutlined style={{ color: 'var(--text-muted, #666)', fontSize: 12 }} />
            <Text type="secondary" style={{ fontSize: 11, color: 'var(--text-muted, #999) !important' }}>
              {reason}
            </Text>
          </Space>
        </div>

        {/* 元素详细字段信息 - 自适应展示 */}
        {!compact && (
          <details style={{ marginTop: 8, fontSize: 10, color: 'var(--text-muted)' }}>
            <summary style={{ cursor: 'pointer', userSelect: 'none' }}>
              📋 父元素详细字段信息
            </summary>
            <div style={{ 
              marginTop: 4, 
              padding: 8, 
              background: 'var(--bg-light-secondary, #f1f5f9)', 
              borderRadius: 4,
              fontSize: 10,
              lineHeight: 1.4
            }}>
              <div><strong>元素字段信息:</strong></div>
              {/* 自适应显示所有有值的字段 */}
              {Object.entries(uiElement)
                .filter(([key, value]) => {
                  // 排除一些不需要显示的字段
                  if (['children', 'bounds'].includes(key)) return false;
                  
                  // 只显示有意义的字段值
                  if (typeof value === 'string') {
                    return value.trim().length > 0;
                  }
                  if (typeof value === 'boolean') {
                    return true; // 布尔值总是显示
                  }
                  if (typeof value === 'number') {
                    return true; // 数字总是显示
                  }
                  return value != null; // 其他非空值
                })
                .map(([key, value]) => {
                  let displayValue = value;
                  let fieldLabel = key;
                  
                  // 字段名称本地化
                  const fieldNames: Record<string, string> = {
                    'text': '文本内容',
                    'content_desc': '内容描述',
                    'resource_id': '资源ID', 
                    'class_name': '类名',
                    'element_type': '元素类型',
                    'is_clickable': '可点击',
                    'is_scrollable': '可滚动',
                    'is_enabled': '已启用',
                    'is_focused': '已聚焦',
                    'checkable': '可勾选',
                    'checked': '已勾选',
                    'selected': '已选中',
                    'password': '密码框',
                    'xpath': 'XPath路径',
                    'parentId': '父元素ID'
                  };
                  
                  fieldLabel = fieldNames[key] || key;
                  
                  // 值格式化
                  if (typeof value === 'string') {
                    displayValue = `"${value}" (长度: ${value.length})`;
                  } else if (typeof value === 'boolean') {
                    displayValue = value ? '是' : '否';
                  } else {
                    displayValue = String(value);
                  }
                  
                  return (
                    <div key={key}>
                      • {fieldLabel}: {displayValue}
                    </div>
                  );
                })}
              
              {/* 位置信息单独处理 */}
              {uiElement.bounds && (
                <div>• 位置信息: [{uiElement.bounds.left}, {uiElement.bounds.top}, {uiElement.bounds.right}, {uiElement.bounds.bottom}]</div>
              )}
              
              {/* 子元素数量 */}
              {uiElement.children && uiElement.children.length > 0 && (
                <div>• 子元素数量: {uiElement.children.length} 个</div>
              )}
            </div>
          </details>
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