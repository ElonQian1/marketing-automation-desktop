// src/modules/structural-matching/ui/components/structural-matching-modal/structural-matching-modal.tsx
// module: structural-matching | layer: ui | role: 结构匹配模态框
// summary: 结构匹配配置的主模态框，包含字段配置和实时预览

import React from 'react';
import { Modal, Tabs, Slider, Typography, Space, Divider, Tag } from 'antd';
import { useStructuralMatchingModal } from '../../../hooks/use-structural-matching-modal';
import { useStructuralPreview } from '../../../hooks/use-structural-preview';
import { StructuralFieldConfigList } from '../field-config-list/field-config-list';
import { StructuralScoringPreview } from '../scoring-preview/scoring-preview';
import './structural-matching-modal.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

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
    updateField,
    toggleField,
    updateThreshold,
    isConfigValid,
    reset,
  } = useStructuralMatchingModal({
    selectedElement,
    initialConfig,
  });

  const { totalResult, displayInfo } = useStructuralPreview({
    config,
    selectedElement,
  });

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
      width={900}
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

        {/* 标签页 */}
        <Tabs defaultActiveKey="fields">
          <TabPane tab="字段配置" key="fields">
            <StructuralFieldConfigList
              fields={config.fields}
              onUpdateField={updateField}
              onToggleField={toggleField}
            />
          </TabPane>

          <TabPane tab="评分预览" key="preview">
            <StructuralScoringPreview
              config={config}
              totalResult={totalResult}
            />
          </TabPane>
        </Tabs>

        {/* 底部操作 */}
        <div className="structural-modal-footer">
          <Text
            type="link"
            onClick={reset}
            style={{ cursor: 'pointer' }}
          >
            重置为默认配置
          </Text>
        </div>
      </div>
    </Modal>
  );
};
