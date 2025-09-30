/**
 * 子元素列表弹窗组件
 * 在可视化视图中点击元素时显示，展示该元素的所有子元素
 */

import React, { useState, useMemo } from 'react';
import { Modal, Input, Space, Button, Empty, Badge, Divider, Typography, Select } from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  ThunderboltOutlined,
  CloseOutlined,
  SortAscendingOutlined
} from '@ant-design/icons';
import { UiNode } from '../types';
import { nodeLabel } from '../utils';
import { ChildElementCard } from './ChildElementCard';
import { childElementAnalyzer, type ActionableChildElement } from '../services/childElementAnalyzer';

const { Text, Title } = Typography;
const { Option } = Select;

/**
 * 排序方式
 */
type SortType = 'default' | 'clickable' | 'text' | 'position' | 'smart';

/**
 * 过滤类型
 */
type FilterType = 'all' | 'clickable' | 'text' | 'input' | 'button';

/**
 * 子元素列表弹窗属性
 */
export interface ChildElementListModalProps {
  /** 是否显示弹窗 */
  visible: boolean;
  /** 父元素节点 */
  parentNode: UiNode | null;
  /** 关闭回调 */
  onClose: () => void;
  /** 选择子元素回调 */
  onSelectChild: (child: UiNode) => void;
  /** 显示子元素详情回调 */
  onShowChildDetails?: (child: UiNode) => void;
  /** 复制子元素XPath回调 */
  onCopyChildXPath?: (child: UiNode) => void;
}

/**
 * 子元素列表弹窗组件
 */
export const ChildElementListModal: React.FC<ChildElementListModalProps> = ({
  visible,
  parentNode,
  onClose,
  onSelectChild,
  onShowChildDetails,
  onCopyChildXPath
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortType, setSortType] = useState<SortType>('smart');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // 智能分析结果
  const smartAnalysis = useMemo(() => {
    if (!parentNode || parentNode.children.length === 0) return null;
    
    try {
      return childElementAnalyzer.analyzeChildren(parentNode);
    } catch (error) {
      console.warn('子元素智能分析失败:', error);
      return null;
    }
  }, [parentNode]);

  // 获取所有子元素（包括深层子元素）
  const allChildren = useMemo(() => {
    if (!parentNode) return [];
    
    const children: UiNode[] = [];
    const traverse = (node: UiNode, depth: number = 0) => {
      if (depth > 3) return; // 限制深度避免过多元素
      
      for (const child of node.children) {
        children.push(child);
        traverse(child, depth + 1);
      }
    };
    
    traverse(parentNode);
    return children;
  }, [parentNode]);

  // 过滤和搜索
  const filteredChildren = useMemo(() => {
    let children = allChildren;

    // 按类型过滤
    if (filterType !== 'all') {
      children = children.filter(child => {
        const className = child.attrs['class'] || '';
        const isClickable = child.attrs['clickable'] === 'true';
        
        switch (filterType) {
          case 'clickable':
            return isClickable;
          case 'text':
            return className.includes('TextView') || child.attrs['text'];
          case 'input':
            return className.includes('EditText') || className.includes('Input');
          case 'button':
            return className.includes('Button') || (isClickable && child.attrs['text']);
          default:
            return true;
        }
      });
    }

    // 按关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      children = children.filter(child => {
        const text = child.attrs['text'] || '';
        const contentDesc = child.attrs['content-desc'] || '';
        const resourceId = child.attrs['resource-id'] || '';
        const className = child.attrs['class'] || '';
        
        return (
          text.toLowerCase().includes(keyword) ||
          contentDesc.toLowerCase().includes(keyword) ||
          resourceId.toLowerCase().includes(keyword) ||
          className.toLowerCase().includes(keyword) ||
          nodeLabel(child).toLowerCase().includes(keyword)
        );
      });
    }

    return children;
  }, [allChildren, filterType, searchKeyword]);

  // 排序
  const sortedChildren = useMemo(() => {
    const children = [...filteredChildren];
    
    switch (sortType) {
      case 'clickable':
        return children.sort((a, b) => {
          const aClickable = a.attrs['clickable'] === 'true' ? 1 : 0;
          const bClickable = b.attrs['clickable'] === 'true' ? 1 : 0;
          return bClickable - aClickable;
        });
        
      case 'text':
        return children.sort((a, b) => {
          const aText = a.attrs['text'] || '';
          const bText = b.attrs['text'] || '';
          return aText.localeCompare(bText);
        });
        
      case 'position':
        return children.sort((a, b) => {
          const getBounds = (node: UiNode) => {
            const bounds = node.attrs['bounds'] || '[0,0][0,0]';
            const match = bounds.match(/\[(\d+),(\d+)\]/);
            return match ? [parseInt(match[1]), parseInt(match[2])] : [0, 0];
          };
          
          const [aX, aY] = getBounds(a);
          const [bX, bY] = getBounds(b);
          
          return aY !== bY ? aY - bY : aX - bX;
        });
        
      case 'smart':
        // 使用智能分析结果排序
        if (smartAnalysis) {
          const smartOrder = smartAnalysis.children.map(item => item.node);
          return children.sort((a, b) => {
            const aIndex = smartOrder.indexOf(a);
            const bIndex = smartOrder.indexOf(b);
            
            if (aIndex !== -1 && bIndex !== -1) {
              return aIndex - bIndex;
            } else if (aIndex !== -1) {
              return -1;
            } else if (bIndex !== -1) {
              return 1;
            } else {
              return 0;
            }
          });
        }
        return children;
        
      default:
        return children;
    }
  }, [filteredChildren, sortType, smartAnalysis]);

  // 获取推荐元素
  const recommendedElements = useMemo(() => {
    if (!smartAnalysis) return new Set();
    return new Set(smartAnalysis.children.slice(0, 3).map(item => item.node));
  }, [smartAnalysis]);

  const handleSelectChild = (child: UiNode) => {
    setSelectedChildId(child.attrs['resource-id'] || child.attrs['bounds'] || '');
    onSelectChild(child);
    onClose();
  };

  const parentLabel = parentNode ? nodeLabel(parentNode) : '';
  const parentType = parentNode?.attrs['class']?.split('.').pop() || parentNode?.tag || '';

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <ThunderboltOutlined className="text-blue-500" />
          <div>
            <Title level={4} className="mb-0">子元素列表</Title>
            <Text type="secondary" className="text-sm">
              父元素: {parentLabel} ({parentType})
            </Text>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      height={700}
      styles={{ body: { height: 600, overflow: 'hidden' } }}
      footer={
        <div className="flex justify-between items-center">
          <Space>
            <Text type="secondary">
              显示 {sortedChildren.length} / {allChildren.length} 个子元素
            </Text>
            {smartAnalysis?.recommendation && (
              <Badge color="green" text={`推荐: ${nodeLabel(smartAnalysis.recommendation.node)}`} />
            )}
          </Space>
          
          <Button onClick={onClose} icon={<CloseOutlined />}>
            关闭
          </Button>
        </div>
      }
    >
      <div className="flex flex-col h-full space-y-4">
        {/* 搜索和过滤工具栏 */}
        <div className="flex flex-col space-y-3">
          <Input
            placeholder="搜索子元素（文本、ID、类名等）"
            prefix={<SearchOutlined />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            allowClear
          />
          
          <div className="flex items-center space-x-4">
            <Space>
              <Text type="secondary">过滤:</Text>
              <Select
                value={filterType}
                onChange={setFilterType}
                style={{ width: 120 }}
                size="small"
              >
                <Option value="all">全部</Option>
                <Option value="clickable">可点击</Option>
                <Option value="text">文本元素</Option>
                <Option value="input">输入框</Option>
                <Option value="button">按钮</Option>
              </Select>
            </Space>
            
            <Space>
              <Text type="secondary">排序:</Text>
              <Select
                value={sortType}
                onChange={setSortType}
                style={{ width: 120 }}
                size="small"
              >
                <Option value="smart">智能推荐</Option>
                <Option value="clickable">可点击优先</Option>
                <Option value="text">按文本</Option>
                <Option value="position">按位置</Option>
                <Option value="default">默认</Option>
              </Select>
            </Space>
            
            <Space>
              <Badge count={filteredChildren.filter(child => child.attrs['clickable'] === 'true').length} size="small">
                <FilterOutlined /> 可点击
              </Badge>
              <Badge count={filteredChildren.filter(child => child.attrs['text']).length} size="small">
                <SortAscendingOutlined /> 有文本
              </Badge>
            </Space>
          </div>
        </div>

        <Divider className="my-2" />

        {/* 子元素列表 */}
        <div className="flex-1 overflow-y-auto">
          {sortedChildren.length === 0 ? (
            <Empty 
              description={
                parentNode?.children.length === 0 
                  ? "此元素没有子元素" 
                  : "没有找到匹配的子元素"
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div className="grid gap-3">
              {sortedChildren.map((child, index) => (
                <ChildElementCard
                  key={child.attrs['resource-id'] || child.attrs['bounds'] || index}
                  node={child}
                  isRecommended={recommendedElements.has(child)}
                  isSelected={selectedChildId === (child.attrs['resource-id'] || child.attrs['bounds'] || '')}
                  searchKeyword={searchKeyword}
                  onSelect={handleSelectChild}
                  onShowDetails={onShowChildDetails}
                  onCopyXPath={onCopyChildXPath}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};