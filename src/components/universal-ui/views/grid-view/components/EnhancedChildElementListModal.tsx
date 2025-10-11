// src/components/universal-ui/views/grid-view/components/EnhancedChildElementListModal.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useState, useMemo, useCallback } from 'react';
import { Modal, Input, Select, Segmented, Space, Divider, Empty, Badge, Tooltip, Button } from 'antd';
import { SearchOutlined, FilterOutlined, SortAscendingOutlined, AppstoreOutlined, BarsOutlined, CloseOutlined } from '@ant-design/icons';
import type { UiNode } from '../types';
import type { ActionableChildElement } from '../services/childElementAnalyzer';
import { childElementAnalyzer } from '../services/childElementAnalyzer';
import { smartRecommendationEnhancer } from '../services/smartRecommendationEnhancer';
import { EnhancedChildElementCard } from './EnhancedChildElementCard';

const { Search } = Input;
const { Option } = Select;

export interface EnhancedChildElementListModalProps {
  visible: boolean;
  parentNode: UiNode | null;
  onClose: () => void;
  onSelect: (childNode: UiNode) => void;
  onShowDetails: (childNode: UiNode) => void;
  onCopyXPath: (childNode: UiNode) => void;
  title?: string;
}

// 排序选项
type SortOption = 'confidence' | 'type' | 'text' | 'position';
type ViewMode = 'card' | 'compact';

/**
 * 增强版子元素列表模态框
 * 提供类似主元素列表的完整功能和用户体验
 */
export const EnhancedChildElementListModal: React.FC<EnhancedChildElementListModalProps> = ({
  visible,
  parentNode,
  onClose,
  onSelect,
  onShowDetails,
  onCopyXPath,
  title
}) => {
  // 状态管理
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('confidence');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [selectedElements, setSelectedElements] = useState<Set<UiNode>>(new Set());

  // 分析子元素
  const childElements = useMemo(() => {
    if (!parentNode) return [];
    
    const analysis = childElementAnalyzer.analyzeChildren(parentNode);
    const enhanced = smartRecommendationEnhancer.enhanceRecommendations(
      analysis.children,
      { 
        parentNode: parentNode,
        siblingNodes: parentNode.children,
        ancestorTexts: [],
        screenRegion: 'center',
        appPackage: ''
      }
    );
    
    return enhanced;
  }, [parentNode, searchTerm]);

  // 获取可用的元素类型
  const availableTypes = useMemo(() => {
    const types = new Set(childElements.map(el => el.type));
    return Array.from(types).sort();
  }, [childElements]);

  // 过滤和排序子元素
  const filteredAndSortedElements = useMemo(() => {
    let filtered = childElements;

    // 搜索过滤
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(element => {
        const searchText = [
          element.actionText,
          element.node.attrs.text,
          element.node.attrs['content-desc'],
          element.node.attrs['resource-id'],
          element.node.attrs.class
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchText.includes(term);
      });
    }

    // 类型过滤
    if (typeFilter !== 'all') {
      filtered = filtered.filter(element => element.type === typeFilter);
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return b.confidence - a.confidence;
        case 'type':
          return a.type.localeCompare(b.type);
        case 'text':
          return (a.actionText || '').localeCompare(b.actionText || '');
        case 'position':
          const aBounds = a.node.attrs.bounds;
          const bBounds = b.node.attrs.bounds;
          if (aBounds && bBounds) {
            const aY = parseInt(aBounds.split(',')[1]) || 0;
            const bY = parseInt(bBounds.split(',')[1]) || 0;
            return aY - bY;
          }
          return 0;
        default:
          return 0;
      }
    });

    return filtered;
  }, [childElements, searchTerm, typeFilter, sortBy]);

  // 处理选择
  const handleSelect = useCallback((childNode: UiNode) => {
    onSelect(childNode);
    onClose();
  }, [onSelect, onClose]);

  // 处理多选
  const handleToggleSelection = useCallback((childNode: UiNode) => {
    const newSelected = new Set(selectedElements);
    if (newSelected.has(childNode)) {
      newSelected.delete(childNode);
    } else {
      newSelected.add(childNode);
    }
    setSelectedElements(newSelected);
  }, [selectedElements]);

  // 批量操作
  const handleBatchSelect = useCallback(() => {
    if (selectedElements.size > 0) {
      // 选择第一个作为主选择
      const firstElement = Array.from(selectedElements)[0];
      onSelect(firstElement);
      onClose();
    }
  }, [selectedElements, onSelect, onClose]);

  const parentInfo = parentNode ? {
    text: parentNode.attrs.text || parentNode.attrs['content-desc'] || '(无文本)',
    id: parentNode.attrs['resource-id'],
    type: parentNode.tag
  } : null;

  return (
    <Modal
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>{title || '子元素列表'}</span>
            {parentInfo && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <Badge count={filteredAndSortedElements.length} showZero>
                  <span>父元素: {parentInfo.text}</span>
                </Badge>
              </div>
            )}
          </div>
          <Button 
            type="text" 
            size="small" 
            icon={<CloseOutlined />} 
            onClick={onClose}
          />
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      style={{ top: 20 }}
      footer={
        selectedElements.size > 0 ? (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              已选择 {selectedElements.size} 个元素
            </span>
            <Space>
              <Button onClick={() => setSelectedElements(new Set())}>
                清除选择
              </Button>
              <Button type="primary" onClick={handleBatchSelect}>
                批量选择
              </Button>
            </Space>
          </div>
        ) : null
      }
      className="enhanced-child-element-modal"
    >
      {/* 搜索和过滤栏 */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-3 items-center">
          <Search
            placeholder="搜索子元素..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={setSearchTerm}
            style={{ flex: 1 }}
            allowClear
          />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 120 }}
            placeholder="类型"
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">全部类型</Option>
            {availableTypes.map(type => (
              <Option key={type} value={type}>
                {type} ({childElements.filter(el => el.type === type).length})
              </Option>
            ))}
          </Select>
        </div>

        {/* 视图控制 */}
        <div className="flex justify-between items-center">
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 140 }}
            suffixIcon={<SortAscendingOutlined />}
          >
            <Option value="confidence">按置信度</Option>
            <Option value="type">按类型</Option>
            <Option value="text">按文本</Option>
            <Option value="position">按位置</Option>
          </Select>

          <Segmented
            value={viewMode}
            onChange={(value) => setViewMode(value as ViewMode)}
            options={[
              { label: '卡片', value: 'card', icon: <AppstoreOutlined /> },
              { label: '紧凑', value: 'compact', icon: <BarsOutlined /> }
            ]}
          />
        </div>
      </div>

      <Divider />

      {/* 子元素列表 */}
      <div className="max-h-96 overflow-y-auto">
        {filteredAndSortedElements.length === 0 ? (
          <Empty 
            description={
              searchTerm || typeFilter !== 'all' 
                ? "没有找到匹配的子元素" 
                : "此元素没有可操作的子元素"
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className={viewMode === 'card' ? 'grid grid-cols-1 gap-3' : 'space-y-2'}>
            {filteredAndSortedElements.map((element, index) => (
              <div 
                key={`${element.node.attrs['resource-id'] || index}`}
                className={selectedElements.has(element.node) ? 'ring-2 ring-blue-500 rounded-lg' : ''}
              >
                <EnhancedChildElementCard
                  element={element}
                  originalNode={element.node}
                  onSelect={handleSelect}
                  onShowDetails={onShowDetails}
                  onCopyXPath={onCopyXPath}
                  onHighlight={(node) => {
                    // 可以添加高亮功能
                    console.log('Highlight node:', node);
                  }}
                  onInspect={(node) => {
                    // 可以添加深度检查功能
                    handleToggleSelection(node);
                  }}
                  searchTerm={searchTerm}
                  isCompact={viewMode === 'compact'}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 统计信息 */}
      {filteredAndSortedElements.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              显示 {filteredAndSortedElements.length} / {childElements.length} 个子元素
            </span>
            <span>
              平均置信度: {Math.round(filteredAndSortedElements.reduce((sum, el) => sum + el.confidence, 0) / filteredAndSortedElements.length * 100)}%
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default EnhancedChildElementListModal;