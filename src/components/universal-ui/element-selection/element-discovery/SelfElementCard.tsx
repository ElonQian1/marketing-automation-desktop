import React from 'react';
import { Card, Button, Tag, Space, Typography, Tooltip } from 'antd';
import { SelectOutlined, InfoCircleOutlined, UserOutlined } from '@ant-design/icons';
import { DiscoveredElement, ElementCardProps } from './types';
import styles from './LightThemeCard.module.css';

const { Text, Title } = Typography;

interface SelfElementCardProps extends ElementCardProps {
  // 继承 ElementCardProps，可以添加 self 特有的属性
}

/**
 * 自己元素展示卡片 - 用于显示当前选中的元素信息
 * 让用户可以重新确认选择当前元素，或查看其详细信息
 */
export const SelfElementCard: React.FC<SelfElementCardProps> = ({
  element,
  onSelect,
  onShowDetails,
  onPreview,
  compact,
  style,
}) => {
  // 提取元素基本信息
  const { element: uiElement, confidence, reason } = element;
  
  // 🔍 调试: 打印完整的元素数据
  console.log('🔍 SelfElementCard 收到的元素数据:', {
    id: uiElement.id,
    element_type: uiElement.element_type,
    text: uiElement.text,
    content_desc: uiElement.content_desc,
    resource_id: uiElement.resource_id,
    class_name: uiElement.class_name,
    bounds: uiElement.bounds,
    is_clickable: uiElement.is_clickable,
    children: uiElement.children?.length || 0
  });
  
  const elementType = uiElement.class_name || uiElement.resource_id || '未知元素';
  const hasText = Boolean(uiElement.text && uiElement.text.trim());
  const isClickable = uiElement.is_clickable;
  
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
    
    // 显示元素类型
    if (uiElement.element_type && uiElement.element_type.trim()) {
      parts.push(`元素: ${uiElement.element_type}`);
    }
    
    // 显示交互特性
    const interactions: string[] = [];
    if (uiElement.is_clickable) interactions.push('可点击');
    if (uiElement.is_scrollable) interactions.push('可滚动');
    if (uiElement.checkable) interactions.push('可勾选');
    if (uiElement.checked) interactions.push('已勾选');
    if (uiElement.selected) interactions.push('已选中');
    if (uiElement.password) interactions.push('密码框');
    
    if (interactions.length > 0) {
      parts.push(`特性: ${interactions.join(', ')}`);
    }
    
    // 如果没有找到任何有用信息，提供基本信息
    if (parts.length === 0) {
      const basicInfo: string[] = [];
      
      // 还是显示基本的类型信息
      if (uiElement.element_type) {
        basicInfo.push(`元素类型: ${uiElement.element_type}`);
      }
      
      // 显示尺寸信息
      if (uiElement.bounds) {
        const width = uiElement.bounds.right - uiElement.bounds.left;
        const height = uiElement.bounds.bottom - uiElement.bounds.top;
        basicInfo.push(`尺寸: ${width}x${height}`);
      }
      
      // 显示是否激活
      if (uiElement.is_enabled !== undefined) {
        basicInfo.push(uiElement.is_enabled ? '已启用' : '已禁用');
      }
      
      return basicInfo.length > 0 ? basicInfo.join(' | ') : '通用UI元素（无特定标识信息）';
    }
    
    return parts.join(' | ');
  };

  return (
    <Card
      size="small"
      className={`${styles.lightThemeCard} light-theme-force`} // 使用CSS模块和全局类
      style={{ 
        marginBottom: 8,
        borderLeft: `4px solid var(--brand, #1890ff)`, // 使用品牌色边框
        transition: 'all 0.2s ease',
        ...style // 合并外部传入的样式
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
              <UserOutlined style={{ color: 'var(--brand, #1890ff)', fontSize: 16 }} />
              <Title level={5} style={{ margin: 0, fontSize: 14, color: 'var(--brand, #1890ff) !important' }}>
                当前选中元素
              </Title>
            </div>
            <Title level={4} style={{ margin: 0, fontSize: 16, color: 'var(--text-inverse, #1e293b) !important' }}>
              {elementType}
            </Title>
            <Text type="secondary" style={{ fontSize: 12, color: 'var(--text-muted, #999) !important' }}>
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
        <div className={styles.detailSection}>
          {buildElementDescription()}
        </div>

        {/* 位置信息 */}
        {uiElement.bounds && (
          <div className={styles.metaText}>
            <strong>位置:</strong> [{uiElement.bounds.left}, {uiElement.bounds.top}, {uiElement.bounds.right}, {uiElement.bounds.bottom}]
          </div>
        )}

        {/* XPath 信息 */}
        {uiElement.xpath && (
          <div className={styles.metaText}>
            <strong>XPath:</strong> 
            <Text 
              code 
              style={{ 
                fontSize: 10, 
                marginLeft: 4,
                maxWidth: '100%',
                wordBreak: 'break-all',
                color: 'var(--text-inverse, #1e293b) !important'
              }}
            >
              {uiElement.xpath}
            </Text>
          </div>
        )}

        {/* 子元素信息 */}
        {uiElement.children && uiElement.children.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ 
              fontSize: 12, 
              fontWeight: 500, 
              marginBottom: 6,
              color: 'var(--text-inverse, #1e293b)'
            }}>
              🔍 子元素 ({uiElement.children.length} 个)
            </div>
            <div style={{ 
              maxHeight: 200, 
              overflowY: 'auto',
              border: '1px solid var(--border-color, #e8e8e8)',
              borderRadius: 6,
              padding: 8,
              background: 'var(--bg-light, #fafafa)'
            }}>
              {uiElement.children.map((child, index) => {
                const hasSemanticInfo = Boolean(
                  (child.text && child.text.trim()) ||
                  (child.content_desc && child.content_desc.trim()) ||
                  (child.resource_id && child.resource_id.trim())
                );
                
                return (
                  <div 
                    key={child.id || index}
                    style={{ 
                      padding: 6,
                      marginBottom: 4,
                      borderRadius: 4,
                      background: hasSemanticInfo ? 'var(--success-light, #f6ffed)' : 'var(--bg-white, #ffffff)',
                      border: hasSemanticInfo ? '1px solid var(--success-border, #b7eb8f)' : '1px solid var(--border-light, #f0f0f0)',
                      cursor: hasSemanticInfo ? 'pointer' : 'default',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => hasSemanticInfo && onSelect({ 
                      element: child, 
                      relationship: 'child' as const,
                      confidence: 0.95, 
                      reason: '从父元素子元素中选择',
                      hasText: !!(child.text && child.text.trim()),
                      isClickable: child.is_clickable
                    })}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted, #666)' }}>
                          {child.element_type || '元素'}
                        </div>
                        {child.text && child.text.trim() && (
                          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary, #333)' }}>
                            📝 "{child.text.trim()}"
                          </div>
                        )}
                        {child.content_desc && child.content_desc.trim() && (
                          <div style={{ fontSize: 11, color: 'var(--success, #52c41a)' }}>
                            🎯 {child.content_desc.trim()}
                          </div>
                        )}
                        {child.resource_id && child.resource_id.trim() && (
                          <div style={{ fontSize: 10, color: 'var(--info, #1890ff)' }}>
                            🆔 {child.resource_id}
                          </div>
                        )}
                      </div>
                      {hasSemanticInfo && (
                        <div style={{ marginLeft: 8 }}>
                          <Tag color="success" style={{ fontSize: 9, margin: 0 }}>
                            可选择
                          </Tag>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 提示信息 */}
        <div className={styles.infoSection}>
          💡 这是您当前选中的元素。
          {uiElement.children && uiElement.children.length > 0 
            ? " 点击上方有语义信息的子元素可直接选择使用。" 
            : " 如果此元素符合您的需求，可以直接确认使用。"
          }
        </div>

        {/* 元素详细信息 - 自适应字段展示 */}
        <details style={{ marginTop: 8, fontSize: 10, color: 'var(--text-muted)' }} open>
          <summary style={{ cursor: 'pointer', userSelect: 'none' }}>
            � 元素详细字段信息
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
            
            <div style={{ marginTop: 8 }}><strong>生成描述:</strong></div>
            <div>"{buildElementDescription()}"</div>
          </div>
        </details>

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