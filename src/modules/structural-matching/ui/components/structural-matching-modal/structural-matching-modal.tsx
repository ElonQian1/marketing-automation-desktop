// src/modules/structural-matching/ui/components/structural-matching-modal/structural-matching-modal.tsx
// module: structural-matching | layer: ui | role: 结构匹配模态框
// summary: 结构匹配配置的主模态框，包含字段配置和实时预览

import React from 'react';
import { Modal, Slider, Typography, Space, Divider, Tag, Button, Select, Card } from 'antd';
import { BulbOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useHierarchicalMatchingModal } from '../../../hooks/use-hierarchical-matching-modal';
import { ElementType, ELEMENT_TEMPLATES } from '../../../domain/constants/element-templates';
// import { useStructuralPreview } from '../../../hooks/use-structural-preview';
import { ElementStructureTree } from '../element-structure-tree';
// import { StructuralScoringPreview } from '../scoring-preview/scoring-preview';
import './structural-matching-modal.css';

const { Title, Text } = Typography;

export interface StructuralMatchingModalProps {
  /** 是否显示 */
  visible: boolean;
  
  /** 选中的元素 */
  selectedElement: any;
  
  /** 初始配置 (可选) */
  initialConfig?: any;
  
  /** 关闭回调 */
  onClose: () => void;
  
  /** 确认回调 */
  onConfirm: (config: any) => void;
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
  } = useHierarchicalMatchingModal({
    selectedElement,
    initialConfig,
  });

  // 临时注释掉评分预览，专注于字段配置
  // const { totalResult, displayInfo } = useStructuralPreview({
  //   config: config as any,
  //   selectedElement,
  // });

  // 模拟评分数据
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
      width={1200}
      okText="确认"
      cancelText="取消"
      okButtonProps={{ disabled: !isConfigValid }}
    >
      <div className="structural-modal-content">
        {/* 顶部状态栏 */}
        <div className="structural-status-bar">
          <Space size="large">
            <div>
              <Text type="secondary">预计得分: </Text>
              <Text strong style={{ color: displayInfo.statusColor }}>
                {displayInfo.scoreText}
              </Text>
            </div>
            <div>
              <Text type="secondary">匹配度: </Text>
              <Text strong style={{ color: displayInfo.statusColor }}>
                {displayInfo.percentage}%
              </Text>
            </div>
            <div>
              <Text type="secondary">状态: </Text>
              <Tag color={totalResult.passed ? 'success' : 'error'}>
                {displayInfo.statusText}
              </Tag>
            </div>
          </Space>
        </div>

        <Divider />

        {/* 智能模板选择 */}
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
            
            <Text type="secondary" style={{ fontSize: '12px' }}>
              智能识别会根据元素特征自动选择最合适的配置模板，也可手动选择
            </Text>
          </Space>
        </div>

        <Divider />

        {/* 阈值设置 */}
        <div className="structural-threshold-section">
          <Title level={5}>全局阈值</Title>
          <div className="threshold-slider-container">
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={config.globalThreshold}
              onChange={updateThreshold}
              marks={{
                0: '0%',
                0.5: '50%',
                1: '100%',
              }}
              tooltip={{
                formatter: (value) => `${((value || 0) * 100).toFixed(0)}%`,
              }}
            />
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              得分超过此阈值则认为匹配成功 (当前: {(config.globalThreshold * 100).toFixed(0)}%)
            </Text>
          </div>
        </div>

        <Divider />

        {/* 字段匹配策略配置 */}
        <div style={{ marginTop: 16 }}>
          <ElementStructureTree
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
