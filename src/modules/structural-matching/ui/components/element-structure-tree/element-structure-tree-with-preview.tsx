// src/modules/structural-matching/ui/components/element-structure-tree/element-structure-tree-with-preview.tsx
// module: structural-matching | layer: ui | role: 带可视化预览的元素结构树
// summary: 元素结构树的增强版本，集成了右侧局部可视化预览面板，支持悬停联动

import React, { useState, useMemo, useCallback } from "react";
import { Row, Col, Typography, Space } from "antd";
import { InfoCircleOutlined, EyeOutlined } from "@ant-design/icons";
import { ElementStructureTree } from "./element-structure-tree";
import { 
  StructuralLocalPreview, 
  useTreeVisualCoordination
} from "../visual-preview";
import { FieldType } from "../../../domain/constants/field-types";
import { FieldConfig } from "../../../domain/models/hierarchical-field-config";

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
 * 带可视化预览的元素结构树组件
 * 支持左侧树结构与右侧可视化预览的悬停联动
 */
export const ElementStructureTreeWithPreview: React.FC<ElementStructureTreeWithPreviewProps> = ({
  selectedElement,
  getFieldConfig,
  onToggleField,
  onUpdateField
}) => {
  const [hoveredNodeKey, setHoveredNodeKey] = useState<string | null>(null);

  // 使用树节点与可视化联动Hook
  const {
    highlightedElementId,
    handleTreeNodeHover
  } = useTreeVisualCoordination({
    hoverDelay: 150,
    enableCoordination: true
  });

  // 从树节点key推导出元素ID
  const deriveElementIdFromNodeKey = useCallback((nodeKey: string | null): string | null => {
    if (!nodeKey) return null;
    
    // 解析节点key，转换为对应的元素ID
    // 例：root-0-1-2 -> element_xx_child_1_1_2 或具体的元素ID
    const keyParts = nodeKey.split('-');
    
    if (keyParts.length === 2 && keyParts[0] === 'root') {
      // 根节点：root-0
      const actualElement = (selectedElement?.selectedElement as Record<string, unknown>) || selectedElement;
      return actualElement?.id as string || null;
    }
    
    if (keyParts.length > 2) {
      // 子节点：root-0-childIndex 或 parent-0-0-childIndex
      const actualElement = (selectedElement?.selectedElement as Record<string, unknown>) || selectedElement;
      const baseId = actualElement?.id as string;
      
      if (keyParts[0] === 'parent') {
        // 父节点结构：parent-0-0-... 
        if (keyParts.length === 3 && keyParts[2] === '0') {
          // parent-0-0 指向当前选中元素
          return baseId;
        } else if (keyParts.length > 3) {
          // parent-0-0-childIndex 指向子元素
          const childIndices = keyParts.slice(3);
          return `${baseId}_child_${childIndices.join('_')}`;
        }
      } else {
        // 直接从根开始：root-0-childIndex
        const childIndices = keyParts.slice(2);
        return `${baseId}_child_${childIndices.join('_')}`;
      }
    }
    
    return null;
  }, [selectedElement]);

  // 处理树节点悬停
  const handleTreeHover = useCallback((nodeKey: string | null) => {
    console.log('🐭 [ElementStructureTreeWithPreview] Tree hover:', { nodeKey });
    setHoveredNodeKey(nodeKey);
    
    // 将节点key转换为元素ID
    const elementId = deriveElementIdFromNodeKey(nodeKey);
    console.log('🎯 [ElementStructureTreeWithPreview] Derived element ID:', { nodeKey, elementId });
    
    handleTreeNodeHover(elementId);
  }, [deriveElementIdFromNodeKey, handleTreeNodeHover]);

  // 创建增强的Tree组件，支持hover事件
  const EnhancedElementStructureTree = useMemo(() => {
    return (
      <div
        onMouseOver={(e) => {
          // 查找最近的树节点
          const target = e.target as HTMLElement;
          const treeNode = target.closest('[data-key]') || target.closest('.ant-tree-node-content-wrapper');
          
          if (treeNode && treeNode instanceof HTMLElement) {
            const nodeKey = treeNode.getAttribute('data-key') || 
                           treeNode.closest('.ant-tree-treenode')?.getAttribute('data-key');
            
            if (nodeKey && nodeKey !== hoveredNodeKey) {
              console.log('🐭 [Tree] Mouse over node:', nodeKey);
              handleTreeHover(nodeKey);
            }
          }
        }}
        onMouseLeave={(e) => {
          // 检查是否真的离开了树区域
          const relatedTarget = e.relatedTarget as HTMLElement;
          const treeContainer = (e.currentTarget as HTMLElement);
          
          if (!relatedTarget || !treeContainer.contains(relatedTarget)) {
            console.log('🐭 [Tree] Mouse leave tree area');
            setHoveredNodeKey(null);
            handleTreeHover(null);
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
  }, [selectedElement, getFieldConfig, onToggleField, onUpdateField, hoveredNodeKey, handleTreeHover]);

  return (
    <div className="light-theme-force" style={{ 
      width: '100%', 
      backgroundColor: 'var(--bg-light-base, #ffffff)',
      border: '1px solid #e0e0e0',
      borderRadius: 8
    }}>
      {/* 标题栏 */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#fafafa'
      }}>
        <Space>
          <InfoCircleOutlined style={{ color: "#1890ff" }} />
          <Title level={4} style={{ margin: 0, color: '#333' }}>
            🌳 元素结构分析
          </Title>
          <EyeOutlined style={{ color: "#52c41a" }} />
          <Text type="secondary" style={{ fontSize: 14 }}>
            左侧：层级配置 | 右侧：局部可视化预览
          </Text>
        </Space>
      </div>

      {/* 主内容区域 */}
      <div style={{ padding: '16px 20px' }}>
        <Row gutter={24} style={{ minHeight: 600 }}>
          {/* 左侧：元素结构树 */}
          <Col span={12}>
            <div style={{
              height: '100%',
              paddingRight: 12,
              borderRight: '1px solid #f0f0f0'
            }}>
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 16, color: '#333' }}>
                  🏗️ 结构配置
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  悬停节点查看局部可视化预览，配置字段匹配规则
                </Text>
                {hoveredNodeKey && (
                  <Text style={{ 
                    fontSize: 12, 
                    color: '#1890ff',
                    display: 'block',
                    marginTop: 4
                  }}>
                    🎯 当前悬停节点: {hoveredNodeKey}
                  </Text>
                )}
                {highlightedElementId && (
                  <Text style={{ 
                    fontSize: 12, 
                    color: '#ff4d4f',
                    display: 'block',
                    marginTop: 2,
                    fontWeight: 'bold'
                  }}>
                    🔍 高亮元素: {highlightedElementId}
                  </Text>
                )}
              </div>
              
              {EnhancedElementStructureTree}
            </div>
          </Col>

          {/* 右侧：局部可视化预览 */}
          <Col span={12}>
            <div style={{ height: '100%', paddingLeft: 12 }}>
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 16, color: '#333' }}>
                  👁️ 局部可视化预览
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  实时显示选中元素周围的局部结构与位置关系
                </Text>
              </div>

              <StructuralLocalPreview
                selectedElement={selectedElement}
                highlightedElementId={highlightedElementId}
                maxHeight={550}
                loading={false}
              />
            </div>
          </Col>
        </Row>
      </div>

      {/* 底部状态栏 */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid #e0e0e0',
        backgroundColor: '#fafafa',
        borderRadius: '0 0 8px 8px'
      }}>
        <Space split>
          <Text type="secondary" style={{ fontSize: 12 }}>
            📊 当前节点: {hoveredNodeKey || '无'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            🎯 高亮元素: {highlightedElementId || '无'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            🔗 联动状态: {highlightedElementId ? '已激活' : '等待悬停'}
          </Text>
        </Space>
      </div>
    </div>
  );
};