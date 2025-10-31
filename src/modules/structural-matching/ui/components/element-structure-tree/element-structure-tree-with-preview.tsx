// src/modules/structural-matching/ui/components/element-structure-tree/element-structure-tree-with-preview.tsx
// module: structural-matching | layer: ui | role: 结构树与悬浮预览视图组合组件
// summary: 带悬浮可视化预览的元素结构树组件

import React, { useState, useCallback, useMemo } from 'react';
import { Typography, Space } from 'antd';
import { InfoCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { ElementStructureTree } from './element-structure-tree';
import { FloatingVisualOverlay } from '../visual-preview/floating-visual-overlay';
import { FieldType } from '../../../domain/constants/field-types';
import { FieldConfig } from '../../../domain/models/hierarchical-field-config';

const { Text, Title } = Typography;

export interface ElementStructureTreeWithPreviewProps {
  /** 选中的元素 */
  selectedElement: Record<string, unknown>;

  /** 获取字段配置 */
  getFieldConfig: (elementPath: string, fieldType: FieldType) => FieldConfig;

  /** 切换字段启用状态 */
  onToggleField: (elementPath: string, fieldType: FieldType) => void;

  /** 更新字段配置 */
  onUpdateField?: (
    elementPath: string,
    fieldType: FieldType,
    updates: Partial<FieldConfig>
  ) => void;
}

/**
 * 带悬浮可视化预览的元素结构树组件
 */
export const ElementStructureTreeWithPreview: React.FC<ElementStructureTreeWithPreviewProps> = ({
  selectedElement,
  getFieldConfig,
  onToggleField,
  onUpdateField
}) => {
  const [hoverInfo, setHoverInfo] = useState<{
    element: Record<string, unknown> | null;
    mousePosition: { x: number; y: number } | undefined;
    isVisible: boolean;
    nodeKey: string | null;
  }>({
    element: selectedElement, // 默认显示选中元素
    mousePosition: { x: 800, y: 200 }, // 默认位置
    isVisible: true, // 默认显示
    nodeKey: 'root-0' // 默认根节点
  });

  // 从节点key推导元素ID
  const deriveElementIdFromNodeKey = useCallback((nodeKey: string | null): string | null => {
    if (!nodeKey) return null;
    
    const keyParts = nodeKey.split('-');
    
    if (keyParts.length === 2 && keyParts[0] === 'root') {
      const actualElement = (selectedElement?.selectedElement as Record<string, unknown>) || selectedElement;
      return actualElement?.id as string || null;
    }
    
    if (keyParts.length > 2) {
      const actualElement = (selectedElement?.selectedElement as Record<string, unknown>) || selectedElement;
      const baseId = actualElement?.id as string;
      
      if (keyParts[0] === 'parent') {
        if (keyParts.length === 3 && keyParts[2] === '0') {
          return baseId;
        } else if (keyParts.length > 3) {
          const childIndices = keyParts.slice(3);
          return `${baseId}_child_${childIndices.join('_')}`;
        }
      } else {
        const childIndices = keyParts.slice(2);
        return `${baseId}_child_${childIndices.join('_')}`;
      }
    }
    
    return null;
  }, [selectedElement]);

  // 处理树节点悬停
  const handleTreeNodeHover = useCallback((nodeKey: string | null, event?: React.MouseEvent) => {
    if (nodeKey && event) {
      console.log('🎯 [ElementStructureTreeWithPreview] Tree hover:', { nodeKey });
      setHoverInfo({
        element: selectedElement,
        mousePosition: { x: event.clientX, y: event.clientY },
        isVisible: true, // 保持显示
        nodeKey
      });
    } else {
      // 不隐藏悬浮层，只更新节点信息
      setHoverInfo(prev => ({
        ...prev,
        nodeKey: null // 清除悬停节点，但保持显示
      }));
    }
  }, [selectedElement]);

  // 获取当前高亮的元素ID
  const highlightedElementId = useMemo(() => {
    return deriveElementIdFromNodeKey(hoverInfo.nodeKey);
  }, [hoverInfo.nodeKey, deriveElementIdFromNodeKey]);

  // 创建增强的Tree组件，支持hover事件
  const EnhancedElementStructureTree = useMemo(() => {
    return (
      <div
        onMouseOver={(e) => {
          const target = e.target as HTMLElement;
          const treeNode = target.closest('[data-key]') || target.closest('.ant-tree-node-content-wrapper');
          
          if (treeNode && treeNode instanceof HTMLElement) {
            const nodeKey = treeNode.getAttribute('data-key') || 
                           treeNode.closest('.ant-tree-treenode')?.getAttribute('data-key');
            
            if (nodeKey && nodeKey !== hoverInfo.nodeKey) {
              handleTreeNodeHover(nodeKey, e);
            }
          }
        }}
        onMouseLeave={(e) => {
          const relatedTarget = e.relatedTarget as HTMLElement | null;
          const treeContainer = (e.currentTarget as HTMLElement);
          
          // 安全检查：确保relatedTarget存在且是Node类型才调用contains
          if (!relatedTarget || !(relatedTarget instanceof Node) || !treeContainer.contains(relatedTarget)) {
            handleTreeNodeHover(null);
          }
        }}
      >
        <ElementStructureTree
          selectedElement={selectedElement}
          getFieldConfig={getFieldConfig}
          onToggleField={onToggleField}
          onUpdateField={onUpdateField}
        />
      </div>
    );
  }, [selectedElement, getFieldConfig, onToggleField, onUpdateField, hoverInfo.nodeKey, handleTreeNodeHover]);

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div className="light-theme-force" style={{ 
        width: '100%', 
        height: '100%',
        backgroundColor: 'var(--bg-light-base, #ffffff)',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 标题栏 */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fafafa',
          flexShrink: 0
        }}>
          <Space>
            <InfoCircleOutlined style={{ color: "#1890ff" }} />
            <Title level={4} style={{ margin: 0, color: '#333' }}>
              🌳 元素结构分析
            </Title>
            <EyeOutlined style={{ color: "#52c41a" }} />
            <Text type="secondary" style={{ fontSize: 14 }}>
              实时结构预览 - 悬浮可视化已激活
            </Text>
          </Space>
          {hoverInfo.nodeKey && (
            <div style={{ marginTop: 8 }}>
              <Text style={{ 
                fontSize: 12, 
                color: '#1890ff',
                padding: '2px 8px',
                backgroundColor: '#e6f7ff',
                borderRadius: 4,
                border: '1px solid #91d5ff'
              }}>
                🎯 悬停: {hoverInfo.nodeKey}
              </Text>
              {highlightedElementId && (
                <Text style={{ 
                  fontSize: 12, 
                  color: '#ff4d4f',
                  marginLeft: 8,
                  padding: '2px 8px',
                  backgroundColor: '#fff2f0',
                  borderRadius: 4,
                  border: '1px solid #ffccc7'
                }}>
                  🔍 高亮: {highlightedElementId}
                </Text>
              )}
            </div>
          )}
        </div>

        {/* 主内容区域 - 结构树全屏显示 */}
        <div style={{ flex: 1, padding: '16px 20px', overflow: 'auto' }}>
          <div style={{ marginBottom: 12 }}>
            <Text strong style={{ fontSize: 16, color: '#333' }}>
              🏗️ 结构配置
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 13 }}>
              配置字段匹配规则，右上角实时显示结构预览
            </Text>
          </div>
          
          {EnhancedElementStructureTree}
        </div>

        {/* 底部状态栏 */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#fafafa',
          borderRadius: '0 0 8px 8px',
          flexShrink: 0
        }}>
          <Space split>
            <Text type="secondary" style={{ fontSize: 12 }}>
              📊 当前节点: {hoverInfo.nodeKey || '无'}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              🎯 高亮元素: {highlightedElementId || '无'}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              🎈 悬浮预览: 已激活
            </Text>
          </Space>
        </div>
      </div>
      
      {/* 悬浮可视化覆盖层 - 始终显示 */}
      <FloatingVisualOverlay
        visible={true} // 始终显示
        selectedElement={hoverInfo.element || selectedElement}
        highlightedElementId={highlightedElementId}
        mousePosition={hoverInfo.mousePosition}
        delay={0} // 无延迟
      />
    </div>
  );
};