// src/components/universal-ui/views/grid-view/components/ChildElementCard.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 子元素卡片组件
 * 类似于元素列表的卡片样式，展示子元素的详细信息
 */

import React from 'react';
import { Card, Button, Tag, Typography, Space, Tooltip } from 'antd';
import { 
  CheckCircleOutlined, 
  InfoCircleOutlined, 
  CopyOutlined,
  AimOutlined
} from '@ant-design/icons';
import { UiNode } from '../types';
import { nodeLabel } from '../utils';
import { MatchBadges } from '../MatchBadges';

const { Text } = Typography;

/**
 * 子元素卡片属性
 */
export interface ChildElementCardProps {
  /** 子元素节点 */
  node: UiNode;
  /** 是否为推荐元素 */
  isRecommended?: boolean;
  /** 是否为当前选中的元素 */
  isSelected?: boolean;
  /** 搜索关键词（用于高亮） */
  searchKeyword?: string;
  /** 点击选择回调 */
  onSelect: (node: UiNode) => void;
  /** 显示详情回调 */
  onShowDetails?: (node: UiNode) => void;
  /** 复制XPath回调 */
  onCopyXPath?: (node: UiNode) => void;
}

/**
 * 高亮搜索关键词
 */
const highlightText = (text: string, keyword: string): React.ReactNode => {
  if (!keyword.trim()) return text;
  
  try {
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <span key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">{part}</span> : 
        part
    );
  } catch {
    return text;
  }
};

/**
 * 子元素卡片组件
 */
export const ChildElementCard: React.FC<ChildElementCardProps> = ({
  node,
  isRecommended = false,
  isSelected = false,
  searchKeyword = '',
  onSelect,
  onShowDetails,
  onCopyXPath
}) => {
  const label = nodeLabel(node);
  const attrs = node.attrs;
  
  // 元素类型和重要属性
  const elementType = attrs['class']?.split('.').pop() || node.tag;
  const resourceId = attrs['resource-id']?.split('/').pop() || '';
  const text = attrs['text'] || '';
  const contentDesc = attrs['content-desc'] || '';
  const isClickable = attrs['clickable'] === 'true';
  const isEnabled = attrs['enabled'] !== 'false';
  const bounds = attrs['bounds'] || '';
  
  // 卡片样式
  const cardClassName = [
    'transition-all duration-200 hover:shadow-md cursor-pointer',
    isSelected && 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/20',
    isRecommended && 'border-green-400 bg-green-50 dark:bg-green-900/20',
    !isSelected && !isRecommended && 'border-gray-200 hover:border-blue-300'
  ].filter(Boolean).join(' ');

  return (
    <Card
      size="small"
      className={cardClassName}
      bodyStyle={{ padding: '12px 16px' }}
      onClick={() => onSelect(node)}
      actions={[
        <Tooltip key="select" title="选择此元素">
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(node);
            }}
          >
            选择
          </Button>
        </Tooltip>,
        
        ...(onShowDetails ? [
          <Tooltip key="details" title="查看详情">
            <Button
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onShowDetails(node);
              }}
            />
          </Tooltip>
        ] : []),
        
        ...(onCopyXPath ? [
          <Tooltip key="copy" title="复制XPath">
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onCopyXPath(node);
              }}
            />
          </Tooltip>
        ] : [])
      ]}
    >
      <div className="space-y-3">
        {/* 标题行 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <AimOutlined className="text-blue-500 flex-shrink-0" />
            <Text strong className="truncate">
              {highlightText(label, searchKeyword)}
            </Text>
            {isRecommended && (
              <Tag color="green">推荐</Tag>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {isClickable && <Tag color="blue">可点击</Tag>}
            {!isEnabled && <Tag color="red">禁用</Tag>}
          </div>
        </div>

        {/* 元素类型和ID */}
        <div className="flex items-center space-x-2 text-sm">
          <Tag color="geekblue">{elementType}</Tag>
          {resourceId && (
            <Text type="secondary" className="text-xs">
              ID: {highlightText(resourceId, searchKeyword)}
            </Text>
          )}
        </div>

        {/* 文本内容 */}
        {text && (
          <div className="text-sm">
            <Text type="secondary">文本: </Text>
            <Text className="break-words">
              {highlightText(text.length > 50 ? `${text.substring(0, 50)}...` : text, searchKeyword)}
            </Text>
          </div>
        )}

        {/* 内容描述 */}
        {contentDesc && (
          <div className="text-sm">
            <Text type="secondary">描述: </Text>
            <Text className="break-words">
              {highlightText(contentDesc.length > 50 ? `${contentDesc.substring(0, 50)}...` : contentDesc, searchKeyword)}
            </Text>
          </div>
        )}

        {/* 位置信息 */}
        {bounds && (
          <div className="text-xs text-gray-500">
            <Text type="secondary">位置: </Text>
            <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">
              {bounds}
            </code>
          </div>
        )}

        {/* 匹配标识 */}
        <div className="flex items-center justify-between">
          <MatchBadges node={node} keyword={searchKeyword} />
          
          {node.children.length > 0 && (
            <Text type="secondary" className="text-xs">
              {node.children.length} 个子元素
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
};