// src/modules/structural-matching/ui/components/structural-matching-modal/structural-matching-modal.tsx
// module: structural-matching | layer: ui | role: 结构匹配模态框
// summary: 结构匹配配置的主模态框，包含字段配置和固定悬浮预览

import React from 'react';
import { Modal, Slider, Typography, Space, Divider, Tag, Button, Select, Card } from 'antd';
import { BulbOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useHierarchicalMatchingModal } from '../../../hooks/use-hierarchical-matching-modal';
import { ElementType, ELEMENT_TEMPLATES } from '../../../domain/constants/element-templates';
import { ElementStructureTreeWithPreview } from '../element-structure-tree/element-structure-tree-with-preview';
import type { StructuralMatchingHierarchicalConfig } from '../../../domain/models/hierarchical-field-config';
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
  const {
    config,
    getFieldConfig,
    toggleField,
    updateField,
    updateThreshold,
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

  const totalResult = { passed: true, totalScore: 0.85 };
  const displayInfo = { 
    scoreText: '85%', 
    percentage: 85, 
    statusText: '匹配', 
    statusColor: '#52c41a' 
  };

  const handleConfirm = () => {
    if (isConfigValid) {
      // 生成结构签名数据
      const structuralSignatures = generateStructuralSignatures();
      console.log('[StructuralMatchingModal] 生成的结构签名:', JSON.stringify(structuralSignatures, null, 2));
      
      onConfirm(config, structuralSignatures);
      onClose();
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
              value={config.globalThreshold}
              onChange={updateThreshold}
              marks={{
                0: '0%',
                0.5: '50%',
                1: '100%'
              }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              得分超过此阈值则认为匹配成功 (当前: {(config.globalThreshold * 100).toFixed(0)}%)
            </Text>
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
                  <Tag color="blue">{appliedTemplate.name}</Tag>
                  <Text type="secondary">{appliedTemplate.description}</Text>
                </Space>
              </Card>
            )}
            
            <Space>
              <Button 
                type="primary" 
                icon={<BulbOutlined />}
                onClick={() => detectAndApplyTemplate()}
                disabled={!selectedElement}
              >
                智能识别并应用
              </Button>
              
              <Select
                placeholder="手动选择模板"
                style={{ width: 200 }}
                onChange={(type: ElementType) => {
                  const template = ELEMENT_TEMPLATES[type];
                  applyTemplate(template);
                }}
                value={appliedTemplate?.type}
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

        <Divider />

        <div style={{ marginTop: 16 }}>
          <ElementStructureTreeWithPreview
            selectedElement={selectedElement}
            getFieldConfig={getFieldConfig}
            onToggleField={toggleField}
            onUpdateField={updateField}
          />
        </div>
      </div>
    </Modal>
  );
};
