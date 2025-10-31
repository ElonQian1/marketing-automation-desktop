// src/modules/structural-matching/ui/components/element-structure-tree/element-structure-tree-with-preview.tsx
// module: structural-matching | layer: ui | role: 带可视化预览的元素结构树
// summary: 元素结构树的增强版本，集成了右侧可视化预览面板

import React, { useState, useEffect, useMemo } from "react";
import { Row, Col, Typography, Space } from "antd";
import { InfoCircleOutlined, EyeOutlined } from "@ant-design/icons";
import { ElementStructureTree } from "./element-structure-tree";
import { 
  StructuralElementVisualPreview, 
  useTreeVisualCoordination,
  type StructuralElement 
} from "../visual-preview";
import { FieldType } from "../../../domain/constants/field-types";
import { FieldConfig } from "../../../domain/models/hierarchical-field-config";
import XmlCacheManager from "../../../../../services/xml-cache-manager";

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
 * 将树节点数据转换为可视化元素数据
 */
function convertTreeDataToVisualElements(elementData: Record<string, unknown>): StructuralElement[] {
  const elements: StructuralElement[] = [];
  
  function processElement(element: any, depth: number = 0): void {
    if (!element) return;
    
    // 添加当前元素
    elements.push({
      id: element.id || `element_${elements.length}`,
      text: element.text || '',
      content_desc: element.content_desc || '',
      class_name: element.class_name || '',
      bounds: element.bounds || '',
      clickable: element.clickable || false,
      resource_id: element.resource_id || ''
    });
    
    // 递归处理子元素
    if (element.children && Array.isArray(element.children)) {
      element.children.forEach((child: any) => {
        processElement(child, depth + 1);
      });
    }
  }
  
  processElement(elementData);
  return elements;
}

/**
 * 带可视化预览的元素结构树组件
 */
export const ElementStructureTreeWithPreview: React.FC<ElementStructureTreeWithPreviewProps> = ({
  selectedElement,
  getFieldConfig,
  onToggleField,
  onUpdateField
}) => {
  const [xmlContent, setXmlContent] = useState<string>('');
  const [treeElements, setTreeElements] = useState<StructuralElement[]>([]);
  const [hoveredNodeKey, setHoveredNodeKey] = useState<string | null>(null);

  // 使用树节点与可视化联动Hook
  const {
    highlightedElementId,
    handleTreeNodeHover,
    handleVisualPreviewHover,
    setHighlight,
    clearHighlight
  } = useTreeVisualCoordination({
    hoverDelay: 150,
    enableCoordination: true
  });

  // 从XML缓存获取完整数据
  useEffect(() => {
    const loadXmlData = async () => {
      try {
        const contextWrapper = selectedElement as Record<string, unknown>;
        const actualElement = (contextWrapper?.selectedElement as Record<string, unknown>) || selectedElement;
        
        // 获取XML缓存ID
        const xmlCacheId = actualElement?.xmlCacheId as string;
        if (!xmlCacheId) {
          console.warn('⚠️ [ElementStructureTreeWithPreview] 无XML缓存ID');
          return;
        }

        // 从缓存获取XML内容
        const xmlCacheManager = XmlCacheManager.getInstance();
        const cacheEntry = await xmlCacheManager.getCachedXml(xmlCacheId);
        if (!cacheEntry) {
          console.warn('⚠️ [ElementStructureTreeWithPreview] 未找到缓存的XML内容');
          return;
        }

        setXmlContent(cacheEntry.xmlContent);
        console.log('✅ [ElementStructureTreeWithPreview] 加载XML内容成功，长度:', cacheEntry.xmlContent.length);

      } catch (error) {
        console.error('❌ [ElementStructureTreeWithPreview] 加载XML数据失败:', error);
      }
    };

    loadXmlData();
  }, [selectedElement]);

  // 当元素数据变化时，转换为可视化元素
  useEffect(() => {
    // 这里需要获取完整的元素数据，包括父元素和子元素
    // 暂时使用传入的selectedElement作为示例
    const elements = convertTreeDataToVisualElements(selectedElement);
    setTreeElements(elements);
    
    console.log('🔍 [ElementStructureTreeWithPreview] 转换可视化元素:', {
      totalElements: elements.length,
      elements: elements.slice(0, 3) // 只显示前3个用于调试
    });
  }, [selectedElement]);

  // 创建增强的Tree组件，支持hover事件
  const EnhancedElementStructureTree = useMemo(() => {
    // 这里我们需要修改原始的ElementStructureTree组件来支持hover事件
    // 为了不破坏原有组件，我们暂时直接传递原有的props
    return (
      <div
        onMouseEnter={(e) => {
          // 从事件目标获取树节点的key
          const target = e.target as HTMLElement;
          const treeNode = target.closest('[data-key]');
          if (treeNode) {
            const nodeKey = treeNode.getAttribute('data-key');
            console.log('🐭 [Tree] Mouse enter node:', nodeKey);
            setHoveredNodeKey(nodeKey);
            handleTreeNodeHover(nodeKey);
          }
        }}
        onMouseLeave={() => {
          console.log('🐭 [Tree] Mouse leave');
          setHoveredNodeKey(null);
          handleTreeNodeHover(null);
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
  }, [selectedElement, getFieldConfig, onToggleField, onUpdateField, handleTreeNodeHover]);

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
            左侧：层级配置 | 右侧：可视化预览
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
                  悬停节点查看可视化预览，配置字段匹配规则
                </Text>
                {hoveredNodeKey && (
                  <Text style={{ 
                    fontSize: 12, 
                    color: '#1890ff',
                    display: 'block',
                    marginTop: 4
                  }}>
                    🎯 当前悬停: {hoveredNodeKey}
                  </Text>
                )}
              </div>
              
              {EnhancedElementStructureTree}
            </div>
          </Col>

          {/* 右侧：可视化预览 */}
          <Col span={12}>
            <div style={{ height: '100%', paddingLeft: 12 }}>
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 16, color: '#333' }}>
                  👁️ 可视化预览
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  实时显示元素结构的位置关系
                </Text>
                {highlightedElementId && (
                  <Text style={{ 
                    fontSize: 12, 
                    color: '#ff4d4f',
                    display: 'block',
                    marginTop: 4,
                    fontWeight: 'bold'
                  }}>
                    🔍 高亮元素: {highlightedElementId}
                  </Text>
                )}
              </div>

              <StructuralElementVisualPreview
                elements={treeElements}
                highlightedElementId={highlightedElementId}
                xmlContent={xmlContent}
                maxHeight={550}
                loading={!xmlContent && treeElements.length === 0}
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
            📊 数据统计: {treeElements.length} 个元素
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            📄 XML缓存: {xmlContent ? `${(xmlContent.length / 1024).toFixed(1)}KB` : '未加载'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            🎯 联动状态: {highlightedElementId ? '已激活' : '等待悬停'}
          </Text>
        </Space>
      </div>
    </div>
  );
};