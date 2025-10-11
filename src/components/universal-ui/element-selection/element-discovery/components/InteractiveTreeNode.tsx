// src/components/universal-ui/element-selection/element-discovery/components/InteractiveTreeNode.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 交互式树节点组件（增强版）
 * 为架构层级树提供富交互功能，包括气泡菜单、元素切换、隐藏元素父查找等
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Dropdown, Space, Typography, Tag, Tooltip, Button, message } from 'antd';
import { 
  SwitcherOutlined,
  InfoCircleOutlined,
  HighlightOutlined,
  CopyOutlined,
  EyeOutlined,
  MoreOutlined,
  SearchOutlined,
  AimOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { UIElement } from '../../../../../api/universalUIAPI';
import type { HierarchyNode } from '../../../../../types/hierarchy';
import { UIElementAdapter } from '../../utils/UIElementAdapter';
import { HiddenElementParentFinder } from '../../../views/grid-view/panels/node-detail/utils/HiddenElementParentFinder';
import styles from './InteractiveTreeNode.module.css';

const { Text } = Typography;

export interface InteractiveTreeNodeProps {
  /** 层级节点数据 */
  node: HierarchyNode;
  /** UI元素数据 */
  element: UIElement;
  /** 节点显示的主要文本 */
  title: string;
  /** 节点关系标记 */
  relationship?: string;
  /** 节点层级 */
  level?: number;
  /** 是否为目标元素 */
  isTarget?: boolean;
  /** 是否被选中 */
  isSelected?: boolean;
  /** 所有UI元素列表（用于隐藏元素父查找） */
  allElements?: UIElement[];
  /** 切换到此元素的回调 */
  onSwitchToElement?: (element: UIElement) => void;
  /** 查看元素详情的回调 */
  onViewDetails?: (element: UIElement) => void;
  /** 高亮元素的回调 */
  onHighlightElement?: (element: UIElement) => void;
  /** 复制元素信息的回调 */
  onCopyElementInfo?: (element: UIElement) => void;
  /** 显示元素边界的回调 */
  onShowBounds?: (element: UIElement) => void;
  /** 查找隐藏元素父容器的回调 */
  onFindHiddenParent?: (parentElement: UIElement) => void;
  /** 自定义菜单项 */
  customMenuItems?: MenuProps['items'];
  /** 自定义样式类名 */
  className?: string;
}

export const InteractiveTreeNode: React.FC<InteractiveTreeNodeProps> = ({
  node,
  element,
  title,
  relationship,
  level,
  isTarget = false,
  isSelected = false,
  allElements = [],
  onSwitchToElement,
  onViewDetails,
  onHighlightElement,
  onCopyElementInfo,
  onShowBounds,
  onFindHiddenParent,
  customMenuItems = [],
  className
}) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // 检测是否为隐藏元素
  const isHiddenElement = useMemo(() => {
    return UIElementAdapter.isHiddenElement(element);
  }, [element]);

  // 隐藏元素父查找处理器
  const handleFindHiddenParent = useCallback(async () => {
    if (!isHiddenElement || !allElements.length) {
      message.warning('当前元素不是隐藏元素或缺少元素上下文');
      return;
    }

    try {
      // 转换为UiNode格式进行查找
      const hiddenUiNode = UIElementAdapter.toUiNode(element);
      const allUiNodes = UIElementAdapter.toUiNodeArray(allElements);
      const targetText = element.text || '';

      const result = HiddenElementParentFinder.findClickableParent(
        hiddenUiNode,
        allUiNodes,
        targetText
      );

      if (result.bestMatch) {
        // 转换回UIElement格式
        const parentUIElement = UIElementAdapter.toUIElement(result.bestMatch);
        onFindHiddenParent?.(parentUIElement);
        message.success(`找到父容器: 置信度 ${((result.confidence || 0) * 100).toFixed(1)}%`);
      } else {
        message.warning('未找到合适的可点击父容器');
      }
    } catch (error) {
      console.error('隐藏元素父查找失败:', error);
      message.error('父容器查找失败');
    }
  }, [isHiddenElement, element, allElements, onFindHiddenParent]);

  // 构建菜单项
  const menuItems: MenuProps['items'] = [
    {
      key: 'switch',
      icon: <SwitcherOutlined />,
      label: '切换到此元素',
      onClick: () => onSwitchToElement?.(element),
      disabled: isTarget
    },
    {
      key: 'details',
      icon: <InfoCircleOutlined />,
      label: '查看详情',
      onClick: () => onViewDetails?.(element)
    },
    {
      key: 'highlight',
      icon: <HighlightOutlined />,
      label: '高亮元素',
      onClick: () => onHighlightElement?.(element)
    },
    {
      key: 'bounds',
      icon: <EyeOutlined />,
      label: '显示边界',
      onClick: () => onShowBounds?.(element)
    },
    // 隐藏元素专用功能
    ...(isHiddenElement ? [
      {
        type: 'divider' as const
      },
      {
        key: 'findParent',
        icon: <SearchOutlined />,
        label: '查找可点击父容器',
        onClick: handleFindHiddenParent,
        style: { color: '#ff6b35' } // 突出显示
      }
    ] : []),
    {
      type: 'divider' as const
    },
    {
      key: 'copy',
      icon: <CopyOutlined />,
      label: '复制元素信息',
      onClick: () => onCopyElementInfo?.(element)
    },
    ...customMenuItems
  ];

  // 处理菜单点击
  const handleMenuClick = useCallback((info: any) => {
    setDropdownVisible(false);
    console.log('🎯 InteractiveTreeNode: 菜单点击:', info.key, 'for', element.id);
  }, [element.id]);

  // 处理下拉菜单可见性变化
  const handleDropdownVisibleChange = useCallback((visible: boolean) => {
    setDropdownVisible(visible);
  }, []);

  // 处理右键点击
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDropdownVisible(true);
  }, []);

  // 生成节点标签
  const renderNodeBadges = useCallback(() => {
    const badges: React.ReactNode[] = [];
    
    if (isTarget) {
      badges.push(
        <Tag key="target" color="red">目标</Tag>
      );
    }
    
    if (isHiddenElement) {
      badges.push(
        <Tag key="hidden" color="orange" icon={<AimOutlined />}>
          隐藏元素
        </Tag>
      );
    }
    
    if (relationship) {
      badges.push(
        <Tag key="relationship" color="blue">{relationship}</Tag>
      );
    }
    
    if (level !== undefined) {
      badges.push(
        <Tag key="level" color="gray">L{level}</Tag>
      );
    }
    
    if (element.text) {
      badges.push(
        <Tag key="hasText" color="green">📝</Tag>
      );
    }
    
    if (element.is_enabled === false) {
      badges.push(
        <Tag key="disabled" color="orange">禁用</Tag>
      );
    }
    
    return badges;
  }, [isTarget, isHiddenElement, relationship, level, element]);

  // 主节点内容
  const nodeContent = (
    <Space 
      className={`${styles.interactiveTreeNode} ${isSelected ? styles.selected : ''} ${className || ''}`}
      onContextMenu={handleContextMenu}
    >
      <Text className={`${styles.nodeTitle} ${isTarget ? styles.targetElement : ''} ${isHiddenElement ? styles.hiddenElement : ''}`}>
        {title}
      </Text>
      <Space size={4}>
        {renderNodeBadges()}
      </Space>
    </Space>
  );

  return (
    <Dropdown
      menu={{ 
        items: menuItems,
        onClick: handleMenuClick 
      }}
      trigger={['contextMenu']}
      open={dropdownVisible}
      onOpenChange={handleDropdownVisibleChange}
      placement="bottomLeft"
    >
      <div className={styles.interactiveTreeNodeContainer}>
        {nodeContent}
        <Tooltip title={isHiddenElement ? "隐藏元素 - 右键查找父容器" : "右键查看更多选项"}>
          <Button 
            type="text" 
            size="small" 
            icon={isHiddenElement ? <SearchOutlined /> : <MoreOutlined />}
            onClick={() => setDropdownVisible(!dropdownVisible)}
            className={`${styles.nodeMenuTrigger} ${isHiddenElement ? styles.hiddenElementTrigger : ''}`}
          />
        </Tooltip>
      </div>
    </Dropdown>
  );
};

export default InteractiveTreeNode;