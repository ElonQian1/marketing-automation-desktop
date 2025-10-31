// src/modules/structural-matching/ui/components/element-structure-tree/element-structure-tree.tsx
// module: structural-matching | layer: ui | role: 元素结构树展示
// summary: 可视化展示元素的层级结构，支持展开/收起和字段配置，从XML缓存动态解析子元素

import React, { useState, useEffect } from 'react';
import { Tree, Switch, Space, Typography, Tag, Tooltip, Badge, Spin } from 'antd';
import { 
  DownOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { StructuralFieldConfig } from '../../../domain/models/structural-field-config';
import { FieldType } from '../../../domain/constants/field-types';
import { invoke } from '@tauri-apps/api/core';
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
  const [fullElementData, setFullElementData] = useState<Record<string, unknown> | null>(null);

  // 从XML缓存解析完整元素结构
  useEffect(() => {
    const parseElementFromXML = async () => {
      try {
        const contextWrapper = selectedElement as Record<string, unknown>;
        const actualElement = (contextWrapper?.selectedElement as Record<string, unknown>) || selectedElement;
        
        console.log('🔍 [ElementStructureTree] 开始解析XML获取完整结构:', {
          actualElement,
          hasXmlCacheId: !!actualElement?.xmlCacheId
        });

        // 暂时跳过后端调用，直接使用传入的数据
        // TODO: 等后端实现 parse_element_with_children 命令后启用
        if (false && actualElement?.xmlCacheId && actualElement?.id) {
          const result = await invoke('parse_element_with_children', {
            xmlCacheId: actualElement.xmlCacheId,
            elementId: actualElement.id,
            maxDepth: 5
          });

          console.log('✅ [ElementStructureTree] XML解析成功:', result);
          setFullElementData(result as Record<string, unknown>);
          return;
        }

        // 当前方案：增强传入的元素数据
        const enhancedElement = {
          ...actualElement,
          children: actualElement.children || [] // 确保有children属性
        };
        
        console.log('🔄 [ElementStructureTree] 使用增强的单层结构:', enhancedElement);
        setFullElementData(enhancedElement);

      } catch (error) {
        console.error('❌ [ElementStructureTree] 处理失败:', error);
        
        // 解析失败时，先尝试构造一个基本的元素结构
        const contextWrapper = selectedElement as Record<string, unknown>;
        const actualElement = (contextWrapper?.selectedElement as Record<string, unknown>) || selectedElement;
        
        // 临时方案：如果原始元素没有children，先显示单层结构
        const enhancedElement = {
          ...actualElement,
          children: actualElement.children || [] // 确保有children属性
        };
        
        console.log('🔄 [ElementStructureTree] 使用增强的单层结构:', enhancedElement);
        setFullElementData(enhancedElement);
      }
    };

    parseElementFromXML();
  }, [selectedElement]);

  // 构建树形数据
  const buildTreeData = (): { treeData: DataNode[]; allKeys: string[] } => {
    if (!fullElementData) {
      return { treeData: [], allKeys: [] };
    }

    console.log('🌳 [ElementStructureTree] 使用完整数据构建树:', {
      elementId: fullElementData.id,
      hasChildren: !!fullElementData.children,
      childrenCount: Array.isArray(fullElementData.children) ? fullElementData.children.length : 0
    });

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
      treeData: [buildTreeNode(fullElementData, 0, 'root', 0)],
      allKeys,
    };
  };

  const { treeData, allKeys } = buildTreeData();

  // 默认展开所有节点
  useEffect(() => {
    if (allKeys.length > 0 && expandedKeys.length === 0) {
      setExpandedKeys(allKeys);
    }
  }, [allKeys, expandedKeys.length]);

  // 如果还在加载完整数据，显示加载状态
  if (!fullElementData) {
    return (
      <div className="element-structure-tree light-theme-force">
        <div className="tree-header">
          <Space>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
            <Text strong>元素结构</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              正在从XML缓存解析完整结构...
            </Text>
          </Space>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">解析元素层级结构中...</Text>
          </div>
        </div>
      </div>
    );
  }

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

      {/* 如果没有子元素，显示提示 */}
      {(!fullElementData.children || (Array.isArray(fullElementData.children) && fullElementData.children.length === 0)) && (
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          background: '#fff7e6', 
          border: '1px solid #ffd591', 
          borderRadius: 6,
          textAlign: 'center'
        }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            📄 此元素暂无子元素层级结构数据
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            显示的是元素的基础属性信息。要查看完整的子元素层级，需要从XML缓存中提取完整结构。
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 10, marginTop: 4, display: 'block' }}>
            💡 当前数据来源: {fullElementData.xmlCacheId ? `XML缓存 (${fullElementData.xmlCacheId})` : '步骤卡片数据'}
          </Text>
        </div>
      )}

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
