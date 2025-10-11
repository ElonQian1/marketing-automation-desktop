// src/components/universal-ui/views/grid-view/components/ChildElementSelectorModal.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 子元素选择弹窗组件
 * 当用户点击元素时，展示该元素的所有可操作子元素供选择
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Card, Button, Badge, Empty, Tooltip, Input, Divider } from 'antd';
import { 
  AimOutlined, 
  SearchOutlined, 
  ThunderboltOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { UiNode } from '../types';
import { 
  childElementAnalyzer, 
  type ChildElementAnalysis, 
  type ActionableChildElement,
  type ActionableElementType 
} from '../services/childElementAnalyzer';

/**
 * 元素类型图标映射
 */
const TYPE_ICONS: Record<ActionableElementType, React.ReactNode> = {
  'button': <Button size="small" type="primary" icon={<AimOutlined />} />,
  'text_button': <Button size="small" type="default" icon={<AimOutlined />} />,
  'input': <Input size="small" placeholder="输入" disabled />,
  'checkbox': <input type="checkbox" disabled />,
  'switch': <div className="w-6 h-3 bg-gray-300 rounded-full relative"><div className="w-3 h-3 bg-white rounded-full absolute"></div></div>,
  'clickable_text': <span className="text-blue-500 underline">文本</span>,
  'image_button': <div className="w-6 h-6 bg-gray-200 rounded border"></div>,
  'list_item': <div className="flex space-x-1"><div className="w-2 h-2 bg-gray-400 rounded"></div><div className="w-8 h-2 bg-gray-300 rounded"></div></div>,
  'tab': <div className="px-2 py-1 border-b-2 border-blue-400 text-xs">Tab</div>,
  'link': <span className="text-blue-600 underline">链接</span>,
  'other_clickable': <AimOutlined className="text-gray-500" />
};

/**
 * 元素类型显示名称
 */
const TYPE_NAMES: Record<ActionableElementType, string> = {
  'button': '按钮',
  'text_button': '文本按钮', 
  'input': '输入框',
  'checkbox': '复选框',
  'switch': '开关',
  'clickable_text': '可点击文本',
  'image_button': '图片按钮',
  'list_item': '列表项',
  'tab': '标签页',
  'link': '链接',
  'other_clickable': '可点击元素'
};

/**
 * 子元素卡片组件属性
 */
interface ChildElementCardProps {
  element: ActionableChildElement;
  onSelect: (element: ActionableChildElement) => void;
  isRecommended?: boolean;
  searchKeyword?: string;
}

/**
 * 子元素卡片组件
 */
const ChildElementCard: React.FC<ChildElementCardProps> = ({ 
  element, 
  onSelect, 
  isRecommended = false,
  searchKeyword = ''
}) => {
  const { node, type, confidence, actionText, priority } = element;
  
  // 高亮搜索关键词
  const highlightText = (text: string, keyword: string): React.ReactNode => {
    if (!keyword.trim()) return text;
    
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <span key={index} className="bg-yellow-200 dark:bg-yellow-800">{part}</span> : 
        part
    );
  };
  
  const text = node.attrs['text'] || '';
  const resourceId = node.attrs['resource-id'] || '';
  const className = node.attrs['class'] || '';
  const contentDesc = node.attrs['content-desc'] || '';
  const bounds = node.attrs['bounds'] || '';
  
  return (
    <Card 
      size="small" 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isRecommended ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : ''
      }`}
      onClick={() => onSelect(element)}
      actions={[
        <Tooltip key="select" title="选择此元素">
          <Button 
            type="primary" 
            size="small" 
            icon={<CheckCircleOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(element);
            }}
          >
            选择
          </Button>
        </Tooltip>
      ]}
    >
      <div className="space-y-2">
        {/* 头部信息 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {TYPE_ICONS[type]}
            <span className="font-medium">{TYPE_NAMES[type]}</span>
            {isRecommended && (
              <Badge color="green" text="推荐" />
            )}
          </div>
          <div className="text-xs text-gray-500">
            置信度: {(confidence * 100).toFixed(0)}%
          </div>
        </div>
        
        {/* 动作描述 */}
        <div className="text-sm font-medium text-blue-600">
          {highlightText(actionText, searchKeyword)}
        </div>
        
        {/* 元素详情 */}
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          {text && (
            <div>
              <span className="font-medium">文本:</span> {highlightText(text, searchKeyword)}
            </div>
          )}
          {contentDesc && (
            <div>
              <span className="font-medium">描述:</span> {highlightText(contentDesc, searchKeyword)}
            </div>
          )}
          {resourceId && (
            <div>
              <span className="font-medium">ID:</span> {resourceId.split('/').pop()}
            </div>
          )}
          <div>
            <span className="font-medium">类名:</span> {className.split('.').pop()}
          </div>
          <div>
            <span className="font-medium">位置:</span> {bounds}
          </div>
          <div>
            <span className="font-medium">优先级:</span> {priority}
          </div>
        </div>
      </div>
    </Card>
  );
};

/**
 * 子元素选择弹窗属性
 */
export interface ChildElementSelectorModalProps {
  visible: boolean;
  parentNode: UiNode | null;
  onClose: () => void;
  onSelect: (element: ActionableChildElement) => void;
  onDirectSelect?: () => void; // 直接选择父元素
}

/**
 * 子元素选择弹窗组件
 */
export const ChildElementSelectorModal: React.FC<ChildElementSelectorModalProps> = ({
  visible,
  parentNode,
  onClose,
  onSelect,
  onDirectSelect
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [analysis, setAnalysis] = useState<ChildElementAnalysis | null>(null);
  
  // 分析子元素
  useEffect(() => {
    if (visible && parentNode) {
      const result = childElementAnalyzer.analyzeChildren(parentNode);
      setAnalysis(result);
    } else {
      setAnalysis(null);
      setSearchKeyword('');
    }
  }, [visible, parentNode]);
  
  // 过滤子元素
  const filteredChildren = useMemo(() => {
    if (!analysis) return [];
    
    if (!searchKeyword.trim()) {
      return analysis.children;
    }
    
    const keyword = searchKeyword.toLowerCase();
    return analysis.children.filter(child => {
      const text = child.node.attrs['text'] || '';
      const contentDesc = child.node.attrs['content-desc'] || '';
      const resourceId = child.node.attrs['resource-id'] || '';
      const actionText = child.actionText;
      
      return (
        text.toLowerCase().includes(keyword) ||
        contentDesc.toLowerCase().includes(keyword) ||
        resourceId.toLowerCase().includes(keyword) ||
        actionText.toLowerCase().includes(keyword) ||
        TYPE_NAMES[child.type].toLowerCase().includes(keyword)
      );
    });
  }, [analysis, searchKeyword]);
  
  const handleElementSelect = (element: ActionableChildElement) => {
    onSelect(element);
    onClose();
  };
  
  const handleDirectSelect = () => {
    onDirectSelect?.();
    onClose();
  };
  
  const parentText = parentNode?.attrs['text'] || '';
  const parentClass = parentNode?.attrs['class']?.split('.').pop() || '';
  const parentResourceId = parentNode?.attrs['resource-id']?.split('/').pop() || '';
  
  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <ThunderboltOutlined className="text-blue-500" />
          <span>选择可操作的子元素</span>
          {analysis && (
            <Badge 
              count={analysis.totalCount} 
              style={{ backgroundColor: '#52c41a' }}
            />
          )}
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
      className="child-element-selector-modal"
    >
      <div className="space-y-4">
        {/* 父元素信息 */}
        <Card size="small" className="bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">当前选中的父元素</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {parentText && <span>文本: {parentText} | </span>}
                {parentResourceId && <span>ID: {parentResourceId} | </span>}
                <span>类名: {parentClass}</span>
              </div>
            </div>
            <Button 
              type="default" 
              onClick={handleDirectSelect}
              icon={<AimOutlined />}
            >
              直接选择此元素
            </Button>
          </div>
        </Card>
        
        {/* 搜索栏 */}
        <Input
          placeholder="搜索子元素（文本、ID、类型等）"
          prefix={<SearchOutlined />}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          allowClear
        />
        
        {/* 统计信息 */}
        {analysis && (
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              找到 {filteredChildren.length} 个可操作子元素
              {searchKeyword && ` (从 ${analysis.totalCount} 个中筛选)`}
            </span>
            {analysis.recommendation && (
              <div className="flex items-center space-x-1">
                <InfoCircleOutlined />
                <span>智能推荐: {analysis.recommendation.actionText}</span>
              </div>
            )}
          </div>
        )}
        
        <Divider className="my-3" />
        
        {/* 子元素列表 */}
        <div className="max-h-96 overflow-y-auto">
          {filteredChildren.length === 0 ? (
            <Empty 
              description={
                analysis?.totalCount === 0 
                  ? "此元素没有可操作的子元素" 
                  : "没有找到匹配的子元素"
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div className="grid gap-3">
              {filteredChildren.map((element, index) => (
                <ChildElementCard
                  key={element.key}
                  element={element}
                  onSelect={handleElementSelect}
                  isRecommended={analysis?.recommendation?.key === element.key}
                  searchKeyword={searchKeyword}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};