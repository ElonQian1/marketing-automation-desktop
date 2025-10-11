// src/components/universal-ui/views/tree-view/UIElementTree.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * UIElementTree 主组件 - 临时文件
 * 高性能的UI元素树形展示组件，支持虚拟化渲染和高级过滤
 */

import React, { useMemo } from 'react';
import { Layout, Spin } from 'antd';
import { ElementWithHierarchy } from './types';
import { TreeToolbar } from './components/TreeToolbar';
import { TreeNode } from './components/TreeNode';
import { TreeStatsPanel } from './components/TreeStatsPanel';
import { useTreeState } from './hooks/useTreeState';
import { useVirtualRender } from './hooks/useVirtualRender';
import { getChildElements } from './utils/treeBuilder';

const { Content, Sider } = Layout;

export interface UIElementTreeProps {
  elements: ElementWithHierarchy[];
  onElementSelect: (elements: ElementWithHierarchy[]) => void;
  loading?: boolean;
  height?: number;
  showStats?: boolean;
  showOnlyClickable?: boolean;
  maxDisplayElements?: number;
  className?: string;
  onElementHighlight?: (element: ElementWithHierarchy) => void;
  onElementCopy?: (elementId: string) => void;
}

const UIElementTree: React.FC<UIElementTreeProps> = ({
  elements,
  onElementSelect,
  loading = false,
  height = 600,
  showStats = true,
  className = '',
  onElementHighlight,
  onElementCopy,
}) => {
  // 使用树状态管理
  const treeState = useTreeState({
    elements,
    onElementSelect,
  });

  // 虚拟化渲染配置
  const virtualRenderOptions = useMemo(() => ({
    containerHeight: height - 120, // 减去工具栏高度
    itemHeight: 50, // 每个节点的预估高度
    overscan: 5,
  }), [height]);

  // 使用虚拟化渲染
  const virtualRender = useVirtualRender(
    treeState.filteredElements,
    virtualRenderOptions
  );

  // 渲染单个树节点
  const renderTreeNode = (element: ElementWithHierarchy, index: number) => {
    const hasChildren = getChildElements(element.id, treeState.filteredElements).length > 0;
    
    return (
      <TreeNode
        key={element.id}
        element={element}
        isSelected={treeState.isSelected(element.id)}
        isExpanded={treeState.isExpanded(element.id)}
        hasChildren={hasChildren}
        onSelect={treeState.handleElementSelect}
        onToggle={treeState.toggleNode}
        onHighlight={onElementHighlight}
        onCopyId={onElementCopy}
        style={{
          position: 'absolute',
          top: index * virtualRenderOptions.itemHeight,
          left: 0,
          right: 0,
          height: virtualRenderOptions.itemHeight,
        }}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="加载元素树..." />
      </div>
    );
  }

  return (
    <Layout className={`ui-element-tree ${className}`} style={{ height }}>
      <Content className="flex flex-col">
        {/* 工具栏 */}
        <TreeToolbar
          searchTerm={treeState.searchTerm}
          filterOptions={treeState.filterOptions}
          selectedCount={treeState.selectedElements.length}
          totalCount={treeState.treeStats.totalElements}
          filteredCount={treeState.filteredElements.length}
          onSearchChange={treeState.setSearchTerm}
          onFilterChange={treeState.setFilterOptions}
          onQuickFilter={treeState.applyQuickFilter}
          onResetFilters={treeState.resetAllFilters}
          onSelectAll={treeState.selectAll}
          onClearSelection={treeState.clearSelection}
          onExpandAll={treeState.expandAll}
          onCollapseAll={treeState.collapseAll}
        />

        {/* 树形视图容器 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 主要树形视图区域 */}
          <div className="flex-1 relative overflow-hidden border-r">
            {treeState.filteredElements.length === 0 ? (
              <div className="flex justify-center items-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-lg mb-2">无匹配元素</div>
                  <div className="text-sm">
                    {treeState.treeStats.totalElements > 0 
                      ? '请调整过滤条件或搜索关键词' 
                      : '暂无UI元素数据'
                    }
                  </div>
                </div>
              </div>
            ) : (
              <div
                ref={virtualRender.scrollElementRef}
                className="h-full overflow-auto"
                onScroll={virtualRender.handleScroll}
              >
                <div
                  className="relative"
                  style={{ height: virtualRender.totalHeight }}
                >
                  <div
                    className="absolute w-full"
                    style={{ transform: `translateY(${virtualRender.offsetY}px)` }}
                  >
                    {virtualRender.visibleElements.map((element, index) =>
                      renderTreeNode(element, virtualRender.visibleRange.start + index)
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 性能指示器 */}
            {virtualRender.renderStats.totalElements > 100 && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                渲染: {virtualRender.renderStats.visibleElements}/{virtualRender.renderStats.totalElements}
                ({Math.round(virtualRender.renderStats.renderRatio)}%)
              </div>
            )}
          </div>

          {/* 统计面板 */}
          {showStats && (
            <Sider width={300} theme="light" className="overflow-auto">
              <TreeStatsPanel
                treeStats={treeState.treeStats}
                filterStats={treeState.filterStats}
                selectedCount={treeState.selectedElements.length}
                className="m-2"
              />
            </Sider>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default UIElementTree;