// src/modules/structural-matching/ui/components/element-structure-tree/element-structure-tree.tsx
// module: structural-matching | layer: ui | role: 元素结构树展示
// summary: 可视化展示元素的层级结构，支持展开/收起和字段配置

import React, { useState } from 'react';
import { Tree, Switch, Space, Typography, Tag, Tooltip, Badge } from 'antd';
import { 
  DownOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { StructuralFieldConfig } from '../../../domain/models/structural-field-config';
import { FieldType } from '../../../domain/constants/field-types';
import './element-structure-tree.css';

const { Text } = Typography;

export interface ElementStructureTreeProps {
  /** 选中的元素 */
  selectedElement: Record<string, unknown>;
  
  /** 字段配置 */
  fieldConfigs: StructuralFieldConfig[];
  
  /** 切换字段启用状态 */
  onToggleField: (fieldType: FieldType) => void;
}

export const ElementStructureTree: React.FC<ElementStructureTreeProps> = ({
  selectedElement,
  fieldConfigs,
  onToggleField,
}) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  // 构建树形数据
  const buildTreeData = (): { treeData: DataNode[]; allKeys: string[] } => {
    // 🔍 提取真正的元素数据
    const contextWrapper = selectedElement as Record<string, unknown>;
    const actualElement = (contextWrapper?.selectedElement as Record<string, unknown>) || selectedElement;
    
    if (!actualElement || actualElement === null || Object.keys(actualElement).length === 0) {
      console.warn('🌳 [ElementStructureTree] 没有找到元素数据');
      return { treeData: [], allKeys: [] };
    }

    // 🔍 调试：打印选中元素的结构
    console.log('🌳 [ElementStructureTree] actualElement:', actualElement);
    console.log('🌳 [ElementStructureTree] children:', actualElement.children);

    const allKeys: string[] = [];

    const getFieldConfig = (fieldType: FieldType) => 
      fieldConfigs.find(f => f.fieldType === fieldType);

    const buildNodeTitle = (element: Record<string, unknown>, depth: number) => {
      const isRoot = depth === 0;
      const className = String(element.class_name || element.className || 'Unknown');
      const clickable = element.clickable === true;
      const bounds = String(element.bounds || '');
      const text = String(element.text || '');
      const contentDesc = String(element.content_desc || element.contentDesc || '');
      const resourceId = String(element.resource_id || element.resourceId || '');

      return (
        <div className="tree-node-content">
          {/* 节点头部 */}
          <div className="node-header">
            <Space size="small">
              {/* 深度标识 */}
              <Badge 
                count={depth === 0 ? '外层' : depth === 1 ? '第1层' : depth === 2 ? '第2层' : `第${depth}层`}
                style={{ 
                  backgroundColor: depth === 0 ? '#f5222d' : depth === 1 ? '#52c41a' : '#1890ff',
                  fontSize: 10,
                }}
              />
              
              {/* 类名 */}
              <Text strong style={{ fontSize: 13 }}>
                {className.split('.').pop()}
              </Text>
              
              {/* 可点击标识 */}
              {clickable ? (
                <Tag color="success" style={{ margin: 0 }}>
                  <CheckCircleOutlined /> 可点击
                </Tag>
              ) : (
                <Tag color="default" style={{ margin: 0 }}>
                  <CloseCircleOutlined /> 不可点击
                </Tag>
              )}
              
              {/* 根节点标识 */}
              {isRoot && (
                <Tag color="orange" style={{ margin: 0 }}>
                  👆 你点击的
                </Tag>
              )}
            </Space>
          </div>

          {/* 节点属性 */}
          <div className="node-properties">
            {/* Resource-ID */}
            {buildFieldRow(
              'resource_id',
              'Resource-ID',
              resourceId || '(空)',
              getFieldConfig(FieldType.RESOURCE_ID)
            )}

            {/* Content-Desc */}
            {buildFieldRow(
              'content_desc',
              'Content-Desc',
              contentDesc || '(空)',
              getFieldConfig(FieldType.CONTENT_DESC)
            )}

            {/* Text */}
            {buildFieldRow(
              'text',
              'Text',
              text || '(空)',
              getFieldConfig(FieldType.TEXT)
            )}

            {/* Bounds */}
            {buildFieldRow(
              'bounds',
              'Bounds',
              bounds,
              getFieldConfig(FieldType.BOUNDS),
              true // disabled
            )}

            {/* Class Name */}
            {buildFieldRow(
              'class_name',
              'Class Name',
              className,
              getFieldConfig(FieldType.CLASS_NAME)
            )}
          </div>
        </div>
      );
    };

    const buildFieldRow = (
      key: string,
      label: string,
      value: string,
      config?: StructuralFieldConfig,
      disabled = false
    ) => {
      const isEmpty = !value || value === '(空)';
      const isEnabled = config?.enabled && !disabled;
      
      return (
        <div key={key} className="field-row">
          <Space size="small" style={{ width: '100%' }}>
            {/* 启用开关 */}
            {config && (
              <Switch
                size="small"
                checked={config.enabled}
                disabled={disabled}
                onChange={() => onToggleField(config.fieldType)}
              />
            )}
            
            {/* 字段名 */}
            <Text 
              type={isEnabled ? undefined : 'secondary'} 
              style={{ minWidth: 100, fontSize: 12 }}
            >
              {label}:
            </Text>
            
            {/* 字段值 */}
            <Tooltip title={value.length > 40 ? value : undefined}>
              <Text 
                code
                type={isEmpty ? 'secondary' : undefined}
                style={{ 
                  fontSize: 11, 
                  maxWidth: 300,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {value.length > 40 ? `${value.substring(0, 40)}...` : value}
              </Text>
            </Tooltip>
            
            {/* 配置状态 */}
            {config && isEnabled && (
              <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>
                权重: {config.weight.toFixed(1)}x
              </Tag>
            )}
            
            {disabled && (
              <Tag color="default" style={{ margin: 0, fontSize: 10 }}>
                不参与
              </Tag>
            )}
          </Space>
        </div>
      );
    };

    const buildTreeNode = (element: Record<string, unknown>, depth: number, parentKey: string, index: number): DataNode => {
      const nodeKey = `${parentKey}-${index}`;
      allKeys.push(nodeKey); // 收集所有节点的key
      
      const children = (element.children as Record<string, unknown>[]) || [];

      return {
        key: nodeKey,
        title: buildNodeTitle(element, depth),
        children: children.length > 0 
          ? children.map((child: Record<string, unknown>, idx: number) => buildTreeNode(child, depth + 1, nodeKey, idx))
          : undefined,
        selectable: false,
      };
    };

    return { 
      treeData: [buildTreeNode(actualElement, 0, 'root', 0)],
      allKeys,
    };
  };

  const { treeData, allKeys } = buildTreeData();

  // 默认展开所有节点
  React.useEffect(() => {
    if (allKeys.length > 0 && expandedKeys.length === 0) {
      setExpandedKeys(allKeys);
    }
  }, [allKeys, expandedKeys.length]);

  return (
    <div className="element-structure-tree light-theme-force">
      <div className="tree-header">
        <Space>
          <InfoCircleOutlined style={{ color: '#1890ff' }} />
          <Text strong>🌳 元素结构树 (新版组件)</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            展开查看层级结构，启用/禁用字段来配置匹配规则
          </Text>
        </Space>
      </div>
      
      <Tree
        className="structural-tree"
        showLine
        showIcon={false}
        switcherIcon={<DownOutlined />}
        expandedKeys={expandedKeys}
        onExpand={(keys) => setExpandedKeys(keys as string[])}
        treeData={treeData}
      />

      {/* 子元素结构匹配 */}
      {(() => {
        const childrenConfig = fieldConfigs.find(f => f.fieldType === FieldType.CHILDREN_STRUCTURE);
        if (!childrenConfig) return null;

        return (
          <div className="children-structure-config">
            <div className="field-row">
              <Space size="small" style={{ width: '100%' }}>
                <Switch
                  size="small"
                  checked={childrenConfig.enabled}
                  onChange={() => onToggleField(FieldType.CHILDREN_STRUCTURE)}
                />
                <Text strong={childrenConfig.enabled}>
                  子元素结构匹配
                </Text>
                <Tooltip title="检查候选元素是否包含相同的子元素结构（类名序列）">
                  <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
                </Tooltip>
                {childrenConfig.enabled && (
                  <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>
                    权重: {childrenConfig.weight.toFixed(1)}x
                  </Tag>
                )}
              </Space>
            </div>
            {childrenConfig.enabled && (
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 30, display: 'block' }}>
                将匹配: 图片容器 + 作者栏 (头像 + 作者名 + 点赞按钮 + 点赞数)
              </Text>
            )}
          </div>
        );
      })()}
    </div>
  );
};
