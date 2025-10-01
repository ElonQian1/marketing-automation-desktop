/**
 * UIElementTree 树节点组件
 * 单个树节点的渲染和交互逻辑
 */

import React from 'react';
import { Checkbox, Tag, Tooltip, Button, Space } from 'antd';
import { 
  CaretRightOutlined, 
  CaretDownOutlined,
  EyeOutlined,
  CopyOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { ElementWithHierarchy } from '../types';
import { assessElementQuality, getQualityColor, getElementIcon, getElementCenter } from '../utils/elementUtils';

interface TreeNodeProps {
  element: ElementWithHierarchy;
  isSelected: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
  onSelect: (element: ElementWithHierarchy) => void;
  onToggle: (nodeId: string) => void;
  onHighlight?: (element: ElementWithHierarchy) => void;
  onCopyId?: (elementId: string) => void;
  style?: React.CSSProperties;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  element,
  isSelected,
  isExpanded,
  hasChildren,
  onSelect,
  onToggle,
  onHighlight,
  onCopyId,
  style,
}) => {
  const quality = assessElementQuality(element);
  const qualityColor = getQualityColor(quality);
  const icon = getElementIcon(element);
  const center = getElementCenter(element);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(element.id);
  };

  const handleSelect = () => {
    onSelect(element);
  };

  const handleHighlight = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHighlight?.(element);
  };

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyId?.(element.id);
  };

  // 获取元素的主要标识文本
  const getMainText = () => {
    if (element.text && element.text.trim()) {
      return element.text.trim();
    }
    if (element.resource_id) {
      return element.resource_id;
    }
    if (element.content_desc) {
      return element.content_desc;
    }
    return element.element_type || 'Unknown';
  };

  return (
    <div
      className={`tree-node flex items-center py-1 px-2 hover:bg-gray-50 cursor-pointer
        ${isSelected ? 'bg-blue-50 border-l-2 border-blue-400' : ''}
      `}
      style={style}
      onClick={handleSelect}
    >
      {/* 缩进空间 */}
      <div style={{ width: element.depth * 20 }} />

      {/* 展开/收起按钮 */}
      <div className="w-4 flex justify-center">
        {hasChildren && (
          <Button
            type="text"
            size="small"
            icon={isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
            onClick={handleToggle}
            className="p-0 w-4 h-4 flex items-center justify-center"
          />
        )}
      </div>

      {/* 选择框 */}
      <Checkbox
        checked={isSelected}
        onChange={handleSelect}
        onClick={(e) => e.stopPropagation()}
        className="ml-1"
      />

      {/* 元素图标 */}
      <span className="ml-2 text-sm">{icon}</span>

      {/* 主要信息 */}
      <div className="flex-1 ml-2 min-w-0">
        <div className="flex items-center gap-2">
          {/* 主要文本 */}
          <span className="font-medium text-gray-800 truncate">
            {getMainText()}
          </span>

          {/* 质量标识 */}
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: qualityColor }}
            title={`质量分数: ${quality}`}
          />

          {/* 元素类型标签 */}
          <Tag className="text-xs">
            {element.element_type}
          </Tag>
        </div>

        {/* 详细信息（第二行） */}
        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3">
          {/* 位置信息 */}
          <span>
            ({center.x}, {center.y})
          </span>

          {/* 尺寸信息 */}
          <span>
            {element.bounds.right - element.bounds.left} × {element.bounds.bottom - element.bounds.top}
          </span>

          {/* 交互属性 */}
          {element.is_clickable && (
            <Tag color="blue" className="text-xs">可点击</Tag>
          )}
          {element.is_scrollable && (
            <Tag color="green" className="text-xs">可滚动</Tag>
          )}
          {element.is_focused && (
            <Tag color="orange" className="text-xs">已聚焦</Tag>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <Space size={4} className="ml-2">
        {onHighlight && (
          <Tooltip title="高亮显示">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={handleHighlight}
              className="p-1 w-6 h-6"
            />
          </Tooltip>
        )}
        
        {onCopyId && (
          <Tooltip title="复制ID">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopyId}
              className="p-1 w-6 h-6"
            />
          </Tooltip>
        )}

        <Tooltip
          title={
            <div>
              <div><strong>ID:</strong> {element.id}</div>
              <div><strong>资源ID:</strong> {element.resource_id || '无'}</div>
              <div><strong>类名:</strong> {element.class_name || '无'}</div>
              <div><strong>内容描述:</strong> {element.content_desc || '无'}</div>
              <div><strong>质量分数:</strong> {quality}</div>
              <div><strong>深度:</strong> {element.depth}</div>
            </div>
          }
        >
          <Button
            type="text"
            size="small"
            icon={<InfoCircleOutlined />}
            className="p-1 w-6 h-6"
          />
        </Tooltip>
      </Space>
    </div>
  );
};