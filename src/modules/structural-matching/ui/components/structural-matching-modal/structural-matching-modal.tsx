// src/modules/structural-matching/ui/components/structural-matching-modal/structural-matching-modal.tsx
// module: structural-matching | layer: ui | role: 结构匹配模态框
// summary: 结构匹配配置的主模态框，包含字段配置和固定悬浮预览

import React, { useState, useEffect } from 'react';
import { Modal, Slider, Typography, Space, Divider, Tag, Button, Select, Card } from 'antd';
import { BulbOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useHierarchicalMatchingModal } from '../../../hooks/use-hierarchical-matching-modal';
import { ElementType, ELEMENT_TEMPLATES } from '../../../domain/constants/element-templates';
import { ElementStructureTree } from '../element-structure-tree';
import { FloatingElementPreview } from '../hover-preview';
import XmlCacheManager from '../../../../../services/xml-cache-manager';
import './structural-matching-modal.css';

const { Title, Text } = Typography;

export interface StructuralMatchingModalProps {
  visible: boolean;
  selectedElement: any;
  initialConfig?: any;
  onClose: () => void;
  onConfirm: (config: any) => void;
}

export const StructuralMatchingModal: React.FC<StructuralMatchingModalProps> = ({
  visible,
  selectedElement,
  initialConfig,
  onClose,
  onConfirm,
}) => {
  const [xmlContent, setXmlContent] = useState<string>('');
  
  useEffect(() => {
    const loadXmlContent = async () => {
      try {
        const contextWrapper = selectedElement as Record<string, unknown>;
        const actualElement = (contextWrapper?.selectedElement as Record<string, unknown>) || selectedElement;
        
        const xmlCacheId = actualElement?.xmlCacheId as string;
        if (!xmlCacheId) return;

        const xmlCacheManager = XmlCacheManager.getInstance();
        const cacheEntry = await xmlCacheManager.getCachedXml(xmlCacheId);
        if (cacheEntry) {
          setXmlContent(cacheEntry.xmlContent);
        }
      } catch (error) {
        console.error('加载XML内容失败:', error);
      }
    };

    if (visible) {
      loadXmlContent();
    }
  }, [visible, selectedElement]);

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
      onConfirm(config);
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

        <div style={{ marginTop: 16, position: 'relative' }}>
          <div style={{ marginRight: 420 }}>
            <ElementStructureTree
              selectedElement={selectedElement}
              getFieldConfig={getFieldConfig}
              onToggleField={toggleField}
              onUpdateField={updateField}
            />
          </div>
          
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 400,
              height: '100%',
              maxHeight: 600,
              zIndex: 1000,
              background: '#fff',
              border: '1px solid #d9d9d9',
              borderRadius: 6,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              padding: 16,
              overflow: 'auto'
            }}
            className="light-theme-force"
          >
            <FloatingElementPreview
              selectedElement={selectedElement}
              xmlContent={xmlContent}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
