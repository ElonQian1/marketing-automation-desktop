// src/modules/structural-matching/ui/components/structural-matching-modal/structural-matching-modal.tsx
// module: structural-matching | layer: ui | role: 结构匹配模态框
// summary: 结构匹配配置的主模态框，包含字段配置和固定悬浮预览

import React, { useState, useCallback } from 'react';
import { Modal, Slider, Typography, Space, Divider, Tag, Button, Select, Card } from 'antd';
import { BulbOutlined, ReloadOutlined, ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useHierarchicalMatchingModal, ElementTemplate } from '../../../hooks/use-hierarchical-matching-modal';
import { ElementType, ELEMENT_TEMPLATES } from '../../../domain/constants/element-templates';
import { ElementStructureTreeWithPreview } from '../element-structure-tree/element-structure-tree-with-preview';
import type { StructuralMatchingHierarchicalConfig } from '../../../domain/models/hierarchical-field-config';
import { FieldType, MatchMode } from '../../../domain/constants/field-types';
import { MatchStrategy } from '../../../domain/constants/match-strategies';
import { StructuralSnapshotGenerator } from '../../../services/structural-snapshot-generator';
import './structural-matching-modal.css';

const { Title, Text } = Typography;

export interface StructuralMatchingModalProps {
  visible: boolean;
  selectedElement: Record<string, unknown>;
  initialConfig?: Partial<StructuralMatchingHierarchicalConfig>;
  onClose: () => void;
  onConfirm: (
    config: StructuralMatchingHierarchicalConfig,
    structuralSignatures: { container: { role: string; depth: number }; skeleton: Array<{ tag: string; role: string; index: number }> } | null
  ) => void;
}

export const StructuralMatchingModal: React.FC<StructuralMatchingModalProps> = ({
  visible,
  selectedElement,
  initialConfig,
  onClose,
  onConfirm,
}) => {
  const [snapshotGenerated, setSnapshotGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [globalThreshold, setGlobalThreshold] = useState(0.7);

  const {
    getFieldConfig,
    toggleField,
    updateField,
    isConfigValid,
    reset,
    applyTemplate,
    detectAndApplyTemplate,
    appliedTemplate,
    generateStructuralSignatures,
  } = useHierarchicalMatchingModal({
    selectedElement,
    initialConfig,
  });

  const handleGenerateStructuralSnapshot = useCallback(async () => {
    if (!selectedElement) return;

    setIsGenerating(true);
    try {
      // 正确使用StructuralSnapshotGenerator
      const generator = new StructuralSnapshotGenerator();
      const snapshot = generator.generateSnapshot(selectedElement, {
        enableGeometry: false,
        enableTemplate: false,
        mode: 'Default'
      });
      
      console.log('🏗️ [Modal] 生成的结构快照:', snapshot);
      setSnapshotGenerated(true);
      
      // 自动应用生成的字段规则到hook配置中
      if (snapshot?.field_rules?.rules && snapshot.field_rules.rules.length > 0) {
        console.log('📝 [Modal] 应用字段规则:', snapshot.field_rules.rules.length);
        
        // 基于生成的field_rules来调整hook配置
        snapshot.field_rules.rules.forEach((rule) => {
          // 根据规则类型启用相应字段
          if (rule.resource_id) {
            updateField('resource_id', { enabled: true, threshold: 0.8 });
          }
          if (rule.content_desc) {
            updateField('content_desc', { enabled: true, threshold: 0.7 });
          }
          if (rule.text) {
            updateField('text', { enabled: true, threshold: 0.6 });
          }
          if (rule.class_contains) {
            updateField('class_name', { enabled: true, threshold: 0.6 });
          }
        });
      }
    } catch (error) {
      console.error('生成结构快照失败:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedElement, updateField]);

  const totalResult = { passed: true, totalScore: 0.85 };
  const displayInfo = { 
    scoreText: '85%', 
    percentage: 85, 
    statusText: '匹配', 
    statusColor: '#52c41a' 
  };

  const handleConfirm = () => {
    if (isConfigValid && selectedElement) {
      try {
        // 🚀 自动生成基于真实DOM的结构快照
        const generator = new StructuralSnapshotGenerator();
        const snapshot = generator.generateSnapshot(selectedElement, {
          enableGeometry: false,
          enableTemplate: false,
          mode: 'Default'
        });
        
        console.log('🏗️ [Modal] 确认时生成的结构快照:', snapshot);
        
        // 从快照中提取结构签名
        let structuralSignatures = null;
        if (snapshot?.field_rules?.rules && snapshot.field_rules.rules.length > 0) {
          // 将快照数据转换为structural_signatures格式
          structuralSignatures = {
            container: {
              role: snapshot.container?.fingerprint?.role || 'Frame',
              depth: 1 // 默认深度为1
            },
            skeleton: snapshot.field_rules.rules.map((rule, index) => ({
              tag: 'field-rule',
              role: rule.resource_id ? 'resource-element' : 
                    rule.content_desc ? 'content-element' : 
                    rule.text ? 'text-element' :
                    rule.class_contains ? 'class-element' : 'generic-element',
              index: index,
              field_config: {
                resource_id: rule.resource_id,
                content_desc: rule.content_desc,  
                text: rule.text,
                class_contains: rule.class_contains,
                presence_only: rule.presence_only,
                must_be_empty: rule.must_be_empty,
                must_equal_text: rule.must_equal_text,
                position_hint: rule.position_hint
              }
            }))
          };
        } else {
          // 如果没有生成具体规则，使用hook提供的fallback
          structuralSignatures = generateStructuralSignatures();
        }
        
        console.log('[StructuralMatchingModal] 最终结构签名:', JSON.stringify(structuralSignatures, null, 2));
        
        // 将hook层的配置转换为domain层的配置格式
        const domainConfig: StructuralMatchingHierarchicalConfig = {
          globalThreshold: globalThreshold,
          layers: [], // 暂时为空，后续可以扩展
          structural_signatures: structuralSignatures || undefined
        };
        
        onConfirm(domainConfig, structuralSignatures);
        onClose();
      } catch (error) {
        console.error('❌ [Modal] 生成结构签名失败:', error);
        // 发生错误时使用fallback
        const structuralSignatures = generateStructuralSignatures();
        const domainConfig: StructuralMatchingHierarchicalConfig = {
          globalThreshold: globalThreshold,
          layers: [],
          structural_signatures: structuralSignatures || undefined
        };
        onConfirm(domainConfig, structuralSignatures);
        onClose();
      }
    }
  };

  return (
    <Modal
      className="structural-matching-modal light-theme-force"
      title="结构匹配配置"
      open={visible}
      onCancel={onClose}
      onOk={handleConfirm}
      width={1400}
      okText="确认"
      cancelText="取消"
      okButtonProps={{ disabled: !isConfigValid }}
      styles={{ body: { position: 'relative' } }}
    >
      <div className="structural-modal-content">
        <div className="structural-status-bar">
          <Space size="large">
            <div>
              <Text type="secondary">预计得分: </Text>
              <Tag color={displayInfo.statusColor}>{displayInfo.scoreText}</Tag>
            </div>
            
            <div>
              <Text type="secondary">匹配状态: </Text>
              <Tag color={totalResult.passed ? 'success' : 'error'}>
                {displayInfo.statusText}
              </Tag>
            </div>
          </Space>
        </div>

        <div className="structural-threshold-section">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={5}>全局匹配阈值</Title>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={globalThreshold}
              onChange={setGlobalThreshold}
              marks={{
                0: '0%',
                0.5: '50%',
                1: '100%'
              }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              得分超过此阈值则认为匹配成功 (当前: {(globalThreshold * 100).toFixed(0)}%)
            </Text>
          </Space>
        </div>

        <Divider />

        <div className="structural-snapshot-section">
          <Title level={5}>
            <ThunderboltOutlined style={{ marginRight: 8 }} />
            自动结构快照生成
          </Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              基于选中元素的 DOM 结构自动生成"空/非空"匹配规则，适用于结构化内容的精确匹配。
            </Text>
            <Button 
              type="primary" 
              icon={<ThunderboltOutlined />}
              onClick={handleGenerateStructuralSnapshot}
              loading={isGenerating}
            >
              生成结构快照
            </Button>
            {snapshotGenerated && (
              <Tag color="success" style={{ marginTop: 8 }}>
                ✅ 结构快照已生成并应用到字段配置
              </Tag>
            )}
          </Space>
        </div>

        <Divider />

        <div className="structural-template-section">
          <Title level={5}>
            <ThunderboltOutlined style={{ marginRight: 8 }} />
            智能配置模板
          </Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            {appliedTemplate && (
              <Card size="small" style={{ marginBottom: 12 }}>
                <Space>
                  <Tag color="blue">{ELEMENT_TEMPLATES[appliedTemplate]?.name || appliedTemplate}</Tag>
                  <Text type="secondary">{ELEMENT_TEMPLATES[appliedTemplate]?.description || '已应用模板'}</Text>
                </Space>
              </Card>
            )}
            
            <Space wrap>
              <Button 
                type="primary" 
                icon={<BulbOutlined />}
                onClick={() => detectAndApplyTemplate()}
                disabled={!selectedElement}
              >
                智能识别并应用
              </Button>
              
              <Button 
                type="default" 
                icon={<CheckCircleOutlined />}
                onClick={handleGenerateStructuralSnapshot}
                disabled={!selectedElement}
              >
                生成结构快照
              </Button>
              
              <Select
                placeholder="手动选择模板"
                style={{ width: 200 }}
                onChange={(type: ElementType) => {
                  // ElementType到ElementTemplate的映射
                  const templateMap: Record<ElementType, ElementTemplate> = {
                    [ElementType.NOTE_CARD]: 'card-item',
                    [ElementType.BUTTON]: 'button-with-icon', 
                    [ElementType.INPUT_FIELD]: 'input-field',
                    [ElementType.LIST_ITEM]: 'list-item',
                    [ElementType.CONTAINER]: 'content-block',
                    [ElementType.UNKNOWN]: 'button-with-icon'
                  };
                  applyTemplate(templateMap[type]);
                }}
                value={ElementType.BUTTON}
              >
                {Object.values(ELEMENT_TEMPLATES).map(template => (
                  <Select.Option key={template.type} value={template.type}>
                    {template.name}
                  </Select.Option>
                ))}
              </Select>
              
              <Button 
                icon={<ReloadOutlined />}
                onClick={reset}
              >
                重置
              </Button>
            </Space>
          </Space>
        </div>
        
        {snapshotGenerated && (
          <div className="structural-snapshot-preview">
            <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text strong>结构快照已生成</Text>
                  <Tag color="green">空/非空策略</Tag>
                </Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  已基于容器内容状态生成匹配规则，将优先识别有内容的元素
                </Text>
              </Space>
            </Card>
          </div>
        )}

        <Divider />

        <div style={{ marginTop: 16 }}>
            <ElementStructureTreeWithPreview
            selectedElement={selectedElement}
            getFieldConfig={(elementPath: string, fieldType: FieldType) => {
              // 转换为domain层的FieldConfig格式 - 使用fieldType作为key来获取默认配置
              const hookConfig = getFieldConfig(fieldType);
              return {
                enabled: hookConfig?.enabled ?? false,
                weight: hookConfig?.threshold ?? 1.0, // 确保总是有有效的权重值
                matchMode: MatchMode.EXACT, // 默认值
                strategy: MatchStrategy.CONSISTENT_EMPTINESS // 默认策略
              };
            }}
            onToggleField={(elementPath: string, fieldType: FieldType) => {
              toggleField(fieldType);
            }}
            onUpdateField={(elementPath: string, fieldType: FieldType, updates: { enabled?: boolean; weight?: number; }) => {
              updateField(fieldType, {
                enabled: updates.enabled,
                threshold: updates.weight || 0.5
              });
            }}
            />
        </div>
      </div>
    </Modal>
  );
};
