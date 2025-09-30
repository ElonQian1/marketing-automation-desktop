import React, { useMemo } from 'react';
import { 
  Card, 
  Descriptions, 
  Tag, 
  Typography, 
  Space, 
  Button, 
  Tooltip, 
  Divider,
  Empty 
} from 'antd';
import { 
  CopyOutlined, 
  EyeOutlined, 
  EditOutlined, 
  SelectOutlined,
  AppstoreOutlined,
  EnvironmentOutlined 
} from '@ant-design/icons';
import type { UIElement, PropertyPanelConfig } from '../types';

const { Text, Title } = Typography;

/**
 * 属性面板组件Props
 */
export interface PropertyPanelProps {
  /** 当前选中的元素 */
  selectedElement: UIElement | null;
  /** 面板配置 */
  config?: PropertyPanelConfig;
  /** 是否显示复制按钮 */
  showCopyButtons?: boolean;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 复制属性回调 */
  onCopyProperty?: (property: string, value: string) => void;
}

/**
 * 默认属性面板配置
 */
const defaultConfig: PropertyPanelConfig = {
  visibleProperties: [
    'text', 'resourceId', 'contentDesc', 'className', 'type', 
    'package', 'bounds', 'clickable', 'editable', 'checkable', 'index'
  ],
  propertyGroups: [
    {
      name: 'basic',
      title: '基本信息',
      properties: ['text', 'resourceId', 'contentDesc', 'type'],
      defaultExpanded: true,
      icon: 'AppstoreOutlined',
    },
    {
      name: 'technical',
      title: '技术属性',
      properties: ['className', 'package', 'index'],
      defaultExpanded: false,
      icon: 'SettingOutlined',
    },
    {
      name: 'interaction',
      title: '交互状态',
      properties: ['clickable', 'editable', 'checkable'],
      defaultExpanded: true,
      icon: 'InteractionOutlined',
    },
    {
      name: 'position',
      title: '位置信息',
      properties: ['bounds'],
      defaultExpanded: false,
      icon: 'EnvironmentOutlined',
    },
  ],
  showTechnicalProps: true,
  showPositionInfo: true,
};

/**
 * 页面分析器 - 属性面板组件
 * 显示选中元素的详细属性信息，支持分组显示、复制操作
 * 文件大小: ~250行
 */
export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedElement,
  config = defaultConfig,
  showCopyButtons = true,
  compact = false,
  className,
  onCopyProperty,
}) => {
  // 格式化属性值
  const formatPropertyValue = (property: string, value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <Text type="secondary">-</Text>;
    }

    switch (property) {
      case 'bounds':
        if (typeof value === 'object' && value.left !== undefined) {
          return (
            <Space direction="vertical" size="small">
              <Text code style={{ fontSize: '12px' }}>
                [{value.left}, {value.top}, {value.right}, {value.bottom}]
              </Text>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                宽度: {value.width}px, 高度: {value.height}px
              </Text>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                中心: ({value.centerX}, {value.centerY})
              </Text>
            </Space>
          );
        }
        return <Text type="secondary">-</Text>;

      case 'clickable':
      case 'editable':
      case 'checkable':
        return (
          <Tag 
            color={value ? 'green' : 'default'} 
            icon={property === 'clickable' ? <SelectOutlined /> : 
                  property === 'editable' ? <EditOutlined /> : 
                  <EyeOutlined />}
          >
            {value ? '是' : '否'}
          </Tag>
        );

      case 'text':
      case 'contentDesc':
        return value ? (
          <Text style={{ wordBreak: 'break-all' }}>
            {String(value)}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        );

      case 'resourceId':
      case 'className':
      case 'package':
        return value ? (
          <Text code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
            {String(value)}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        );

      case 'type':
        return (
          <Tag color="blue" icon={<AppstoreOutlined />}>
            {String(value)}
          </Tag>
        );

      case 'index':
        return (
          <Tag color="orange">
            {String(value)}
          </Tag>
        );

      default:
        return <Text>{String(value)}</Text>;
    }
  };

  // 获取属性显示名称
  const getPropertyLabel = (property: string): string => {
    const labels: Record<string, string> = {
      text: '文本内容',
      resourceId: '资源ID',
      contentDesc: '内容描述',
      className: '类名',
      type: '元素类型',
      package: '包名',
      bounds: '位置边界',
      clickable: '可点击',
      editable: '可编辑',
      checkable: '可勾选',
      index: '索引',
    };
    return labels[property] || property;
  };

  // 复制属性值
  const handleCopyProperty = (property: string, value: any) => {
    let copyText = '';
    
    if (property === 'bounds' && typeof value === 'object') {
      copyText = `[${value.left}, ${value.top}, ${value.right}, ${value.bottom}]`;
    } else {
      copyText = String(value || '');
    }

    navigator.clipboard.writeText(copyText).then(() => {
      onCopyProperty?.(property, copyText);
    });
  };

  // 生成描述项
  const descriptionItems = useMemo(() => {
    if (!selectedElement) return [];

    const items: any[] = [];

    config.propertyGroups.forEach(group => {
      // 添加分组标题
      if (!compact) {
        items.push({
          key: `group-${group.name}`,
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {group.icon === 'AppstoreOutlined' && <AppstoreOutlined />}
              {group.icon === 'EnvironmentOutlined' && <EnvironmentOutlined />}
              <Text strong>{group.title}</Text>
            </div>
          ),
          children: null,
          span: 3,
        });
      }

      // 添加分组属性
      group.properties.forEach(property => {
        if (config.visibleProperties.includes(property)) {
          const value = (selectedElement as any)[property];
          
          items.push({
            key: property,
            label: getPropertyLabel(property),
            children: (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  {formatPropertyValue(property, value)}
                </div>
                {showCopyButtons && value && (
                  <Tooltip title="复制属性值">
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyProperty(property, value)}
                      style={{ padding: '0 4px' }}
                    />
                  </Tooltip>
                )}
              </div>
            ),
            span: compact ? 1 : 3,
          });
        }
      });

      // 添加分组分隔线
      if (!compact && items.length > 0) {
        items.push({
          key: `divider-${group.name}`,
          label: null,
          children: <Divider style={{ margin: '8px 0' }} />,
          span: 3,
        });
      }
    });

    return items;
  }, [selectedElement, config, compact, showCopyButtons]);

  if (!selectedElement) {
    return (
      <Card className={className} size="small">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="未选择元素"
          style={{ padding: '20px 0' }}
        >
          <Text type="secondary">请在元素树或画布中选择一个元素</Text>
        </Empty>
      </Card>
    );
  }

  return (
    <Card 
      className={className}
      size="small"
      title={
        <Space>
          <Text strong>元素属性</Text>
          <Tag color="blue">{selectedElement.type}</Tag>
        </Space>
      }
      extra={
        showCopyButtons && (
          <Tooltip title="复制元素ID">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyProperty('id', selectedElement.id)}
            />
          </Tooltip>
        )
      }
    >
      <Descriptions
        items={descriptionItems}
        column={compact ? 1 : 1}
        size="small"
        bordered={!compact}
        layout={compact ? 'horizontal' : 'vertical'}
        labelStyle={{ 
          fontWeight: 'normal',
          color: '#666',
          fontSize: compact ? '12px' : '13px'
        }}
        contentStyle={{ 
          fontSize: compact ? '12px' : '13px'
        }}
      />
    </Card>
  );
};