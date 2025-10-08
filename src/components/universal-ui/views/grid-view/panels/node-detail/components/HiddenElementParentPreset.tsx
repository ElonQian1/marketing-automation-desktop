/**
 * 隐藏元素父查找策略预设组件
 * 当用户选择隐藏元素时，提供"查找可点击父元素"的快速操作
 */
import React, { useState } from 'react';
import { Button, Space, Input, Tooltip, message, Modal, Table, Tag } from 'antd';
import { SearchOutlined, AimOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { UiNode } from '../../../types';
import { HiddenElementParentFinder, type HiddenElementDetectionResult } from '../utils/HiddenElementParentFinder';
import type { MatchCriteria } from '../types';

interface HiddenElementParentPresetProps {
  /** 当前选中的隐藏元素 */
  selectedElement: UiNode;
  /** 所有UI元素列表 */
  allElements: UiNode[];
  /** 当策略生成时的回调 */
  onStrategyGenerated?: (criteria: MatchCriteria) => void;
  /** 当切换到父元素时的回调 */
  onSwitchToParent?: (parentElement: UiNode) => void;
}

export const HiddenElementParentPreset: React.FC<HiddenElementParentPresetProps> = ({
  selectedElement,
  allElements,
  onStrategyGenerated,
  onSwitchToParent
}) => {
  const [targetText, setTargetText] = useState(selectedElement.attrs?.text || "");
  const [searchResult, setSearchResult] = useState<HiddenElementDetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 检查是否为隐藏元素
  const isHidden = HiddenElementParentFinder.isHiddenElement(selectedElement);

  // 如果不是隐藏元素，不显示此组件
  if (!isHidden) {
    return null;
  }

  /**
   * 执行父容器查找
   */
  const handleFindParent = async () => {
    if (!targetText.trim()) {
      message.warning('请输入目标文本');
      return;
    }

    setIsLoading(true);
    try {
      const result = HiddenElementParentFinder.findClickableParent(
        selectedElement,
        allElements,
        targetText
      );
      
      setSearchResult(result);
      
      if (result.bestMatch && result.confidence && result.confidence >= 0.7) {
        message.success(`找到高置信度父容器: ${(result.confidence * 100).toFixed(1)}%`);
      } else if (result.parentCandidates && result.parentCandidates.length > 0) {
        message.info(`找到 ${result.parentCandidates.length} 个父容器候选者`);
      } else {
        message.warning('未找到合适的父容器');
      }
    } catch (error) {
      console.error('父容器查找失败:', error);
      message.error('父容器查找失败');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 生成匹配策略
   */
  const handleGenerateStrategy = () => {
    if (!searchResult?.bestMatch) {
      message.warning('请先查找父容器');
      return;
    }

    const criteria = HiddenElementParentFinder.createMatchCriteria(targetText);
    onStrategyGenerated?.(criteria);
    message.success('已生成隐藏元素父查找策略');
  };

  /**
   * 切换到父元素
   */
  const handleSwitchToParent = () => {
    if (!searchResult?.bestMatch) {
      message.warning('请先查找父容器');
      return;
    }

    onSwitchToParent?.(searchResult.bestMatch);
    message.success('已切换到父元素');
  };

  /**
   * 渲染候选者表格
   */
  const renderCandidatesTable = () => {
    if (!searchResult?.parentCandidates || searchResult.parentCandidates.length === 0) {
      return <div style={{ textAlign: 'center', color: '#999' }}>暂无候选者</div>;
    }

    const columns = [
      {
        title: '类型',
        dataIndex: 'tag',
        key: 'tag',
        width: 80,
      },
      {
        title: '文本',
        key: 'text',
        render: (record: UiNode) => record.attrs?.text || '-',
        width: 120,
      },
      {
        title: '资源ID',
        key: 'resourceId',
        render: (record: UiNode) => record.attrs?.['resource-id'] || '-',
        width: 150,
      },
      {
        title: '类名',
        key: 'className',
        render: (record: UiNode) => record.attrs?.class || '-',
        width: 120,
      },
      {
        title: '可点击',
        key: 'clickable',
        render: (record: UiNode) => (
          <Tag color={record.attrs?.clickable === 'true' ? 'green' : 'orange'}>
            {record.attrs?.clickable === 'true' ? '是' : '否'}
          </Tag>
        ),
        width: 80,
      },
      {
        title: '置信度',
        key: 'confidence',
        render: (record: UiNode) => {
          const confidence = HiddenElementParentFinder['calculateConfidence'](record, selectedElement, targetText);
          const percent = (confidence * 100).toFixed(1);
          return (
            <Tag color={confidence >= 0.7 ? 'green' : confidence >= 0.5 ? 'orange' : 'red'}>
              {percent}%
            </Tag>
          );
        },
        width: 80,
      }
    ];

    return (
      <Table
        columns={columns}
        dataSource={searchResult.parentCandidates}
        size="small"
        pagination={false}
        scroll={{ y: 300 }}
        rowKey={(record, index) => `candidate-${index}`}
      />
    );
  };

  return (
    <div className="light-theme-force" style={{ 
      background: 'var(--bg-light-elevated)',
      padding: '12px',
      borderRadius: '6px',
      border: '1px solid var(--border-muted)',
      margin: '8px 0'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <AimOutlined style={{ color: 'var(--color-warning)', marginRight: '6px' }} />
        <span style={{ fontWeight: 500, color: 'var(--text-inverse)' }}>
          隐藏元素父容器查找
        </span>
        <Tooltip title="此元素bounds为[0,0][0,0]，不可直接点击，需要查找其可点击的父容器">
          <InfoCircleOutlined style={{ marginLeft: '6px', color: 'var(--text-muted)' }} />
        </Tooltip>
      </div>

      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Input
            placeholder="输入目标文本（如：联系人）"
            value={targetText}
            onChange={(e) => setTargetText(e.target.value)}
            style={{ marginBottom: '8px' }}
          />
        </div>

        <Space size="small">
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleFindParent}
            loading={isLoading}
            size="small"
          >
            查找父容器
          </Button>

          {searchResult?.bestMatch && (
            <>
              <Button
                type="default"
                onClick={handleSwitchToParent}
                size="small"
              >
                切换到父元素
              </Button>

              <Button
                type="default"
                onClick={handleGenerateStrategy}
                size="small"
              >
                生成策略
              </Button>

              <Button
                type="link"
                onClick={() => setShowDetailModal(true)}
                size="small"
              >
                查看详情 ({searchResult.parentCandidates?.length || 0})
              </Button>
            </>
          )}
        </Space>

        {searchResult && (
          <div style={{ 
            padding: '8px', 
            background: 'var(--bg-light-secondary)',
            borderRadius: '4px',
            fontSize: '12px',
            color: 'var(--text-inverse)'
          }}>
            <div><strong>状态:</strong> {searchResult.reason}</div>
            {searchResult.bestMatch && (
              <>
                <div><strong>最佳匹配:</strong> {searchResult.bestMatch.attrs?.text || searchResult.bestMatch.tag}</div>
                <div><strong>置信度:</strong> {((searchResult.confidence || 0) * 100).toFixed(1)}%</div>
              </>
            )}
          </div>
        )}
      </Space>

      {/* 详情弹窗 */}
      <Modal
        title="父容器候选者详情"
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        footer={null}
        width={800}
      >
        {renderCandidatesTable()}
      </Modal>
    </div>
  );
};