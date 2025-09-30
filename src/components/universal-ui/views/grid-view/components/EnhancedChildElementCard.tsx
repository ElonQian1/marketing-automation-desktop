import React from 'react';
import { Button, Dropdown, Space, Tag, Tooltip, Badge } from 'antd';
import { EyeOutlined, CopyOutlined, MoreOutlined, SelectOutlined, SearchOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { UiNode } from '../types';
import type { ActionableChildElement } from '../services/childElementAnalyzer';

export interface EnhancedChildElementCardProps {
  element: ActionableChildElement;
  originalNode: UiNode;
  onSelect: (node: UiNode) => void;
  onShowDetails: (node: UiNode) => void;
  onCopyXPath: (node: UiNode) => void;
  onHighlight?: (node: UiNode) => void;
  onInspect?: (node: UiNode) => void;
  searchTerm?: string;
  isCompact?: boolean;
}

/**
 * 增强版子元素卡片组件
 * 提供类似主元素列表的风格和更多操作选项
 */
export const EnhancedChildElementCard: React.FC<EnhancedChildElementCardProps> = ({
  element,
  originalNode,
  onSelect,
  onShowDetails,
  onCopyXPath,
  onHighlight,
  onInspect,
  searchTerm,
  isCompact = false
}) => {
  // 高亮搜索关键词
  const highlightText = (text: string, term?: string) => {
    if (!term || !text) return text;
    
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // 获取置信度颜色
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'default';
  };

  // 获取元素类型颜色
  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'button': 'blue',
      'input': 'green',
      'link': 'purple',
      'text': 'orange',
      'image': 'cyan',
      'clickable': 'magenta',
      'scrollable': 'geekblue',
      'other': 'default'
    };
    return colorMap[type] || 'default';
  };

  // 下拉菜单选项
  const menuItems: MenuProps['items'] = [
    {
      key: 'select',
      label: '选择此元素',
      icon: <SelectOutlined />,
      onClick: () => onSelect(originalNode)
    },
    {
      key: 'details',
      label: '查看详情',
      icon: <InfoCircleOutlined />,
      onClick: () => onShowDetails(originalNode)
    },
    {
      key: 'copy',
      label: '复制XPath',
      icon: <CopyOutlined />,
      onClick: () => onCopyXPath(originalNode)
    },
    ...(onHighlight ? [{
      key: 'highlight',
      label: '高亮显示',
      icon: <EyeOutlined />,
      onClick: () => onHighlight(originalNode)
    }] : []),
    ...(onInspect ? [{
      key: 'inspect',
      label: '深度检查',
      icon: <SearchOutlined />,
      onClick: () => onInspect(originalNode)
    }] : [])
  ];

  const primaryText = element.actionText || originalNode.attrs.text || originalNode.attrs['content-desc'] || '(无文本)';
  const elementId = originalNode.attrs['resource-id'];
  const className = originalNode.attrs.class;

  if (isCompact) {
    // 紧凑模式
    return (
      <div className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Tag color={getTypeColor(element.type)}>
              {element.type}
            </Tag>
            <span className="text-sm truncate">
              {highlightText(primaryText, searchTerm)}
            </span>
            <Badge count={Math.round(element.confidence * 100)} size="small" />
          </div>
        </div>
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button type="text" size="small" icon={<MoreOutlined />} />
        </Dropdown>
      </div>
    );
  }

  // 标准卡片模式
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-900">
      {/* 标题栏 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Tag color={getTypeColor(element.type)}>
            {element.type.toUpperCase()}
          </Tag>
          <Tag color={getConfidenceColor(element.confidence)}>
            {Math.round(element.confidence * 100)}%
          </Tag>
        </div>
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button type="text" size="small" icon={<MoreOutlined />} />
        </Dropdown>
      </div>

      {/* 主要内容 */}
      <div className="space-y-2">
        {/* 显示文本 */}
        {primaryText && (
          <div className="text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">文本: </span>
            <span className="text-gray-900 dark:text-gray-100">
              {highlightText(primaryText, searchTerm)}
            </span>
          </div>
        )}

        {/* 资源ID */}
        {elementId && (
          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
            <span className="font-medium">ID: </span>
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
              {highlightText(elementId, searchTerm)}
            </code>
          </div>
        )}

        {/* 类名 */}
        {className && (
          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
            <span className="font-medium">类: </span>
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
              {highlightText(className, searchTerm)}
            </code>
          </div>
        )}

        {/* 操作建议 */}
        {element.actionText && (
          <div className="text-xs text-blue-600 dark:text-blue-400">
            <span className="font-medium">建议: </span>
            {element.actionText}
          </div>
        )}
      </div>

      {/* 快速操作按钮 */}
      <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <Tooltip title="选择此元素">
          <Button 
            type="primary" 
            size="small" 
            icon={<SelectOutlined />}
            onClick={() => onSelect(originalNode)}
          >
            选择
          </Button>
        </Tooltip>
        <Tooltip title="查看详情">
          <Button 
            size="small" 
            icon={<InfoCircleOutlined />}
            onClick={() => onShowDetails(originalNode)}
          >
            详情
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default EnhancedChildElementCard;