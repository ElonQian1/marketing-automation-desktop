// src/components/universal-ui/views/grid-view/components/MainLayout.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * GridElementView 主布局组件
 * 左侧树形视图，右侧面板区域
 */

import React from 'react';
import { UiNode, AdvancedFilter, SearchOptions } from '../types';
import { TreeView } from './TreeView';
import { PanelsContainer } from './PanelsContainer';
import styles from '../GridElementView.module.css';

interface MainLayoutProps {
  root: UiNode | null;
  selected: UiNode | null;
  onSelect: (node: UiNode | null) => void;
  expandAll: boolean;
  collapseVersion: number;
  expandDepth: number;
  showMatchedOnly: boolean;
  matchedSet: Set<UiNode>;
  selectedAncestors: UiNode[];
  leftWidth: number;
  startDrag: (e: React.MouseEvent) => void;
  handleHoverNode: (node: UiNode | null) => void;
  
  // 搜索相关
  filter: string;
  advFilter: AdvancedFilter;
  searchOptions: SearchOptions;
  matches: UiNode[];
  matchIndex: number;
  setMatchIndex: (index: number) => void;
  goToMatch: (direction: number) => void;
  
  // XPath 相关
  xPathInput: string;
  setXPathInput: (xpath: string) => void;
  xpathTestNodes: UiNode[];
  locateXPath: () => void;
  
  // XML 相关
  xmlText: string;
  setXmlText: (text: string) => void;
  onParse: () => void;
  
  // 匹配策略
  currentStrategy: string;
  currentFields: string[];
  updateStrategy: (strategy: string) => void;
  updateFields: (fields: string[]) => void;
  
  // 面板状态
  panelActivateTab: string;
  panelActivateKey: number;
  panelHighlightNode: UiNode | null;
  
  // 回调
  onApplyCriteria?: any;
  initialMatching?: any;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  root,
  selected,
  onSelect,
  expandAll,
  collapseVersion,
  expandDepth,
  showMatchedOnly,
  matchedSet,
  selectedAncestors,
  leftWidth,
  startDrag,
  handleHoverNode,
  filter,
  advFilter,
  searchOptions,
  matches,
  matchIndex,
  setMatchIndex,
  goToMatch,
  xPathInput,
  setXPathInput,
  xpathTestNodes,
  locateXPath,
  xmlText,
  setXmlText,
  onParse,
  currentStrategy,
  currentFields,
  updateStrategy,
  updateFields,
  panelActivateTab,
  panelActivateKey,
  panelHighlightNode,
  onApplyCriteria,
  initialMatching,
}) => {
  return (
    <div className={`${styles.content} flex-1 flex overflow-hidden`}>
      {/* 左侧树形视图 */}
      <div style={{ width: `${leftWidth}%` }} className="flex flex-col">
        <TreeView
          root={root}
          selected={selected}
          onSelect={onSelect}
          expandAll={expandAll}
          collapseVersion={collapseVersion}
          expandDepth={expandDepth}
          showMatchedOnly={showMatchedOnly}
          matchedSet={matchedSet}
          selectedAncestors={selectedAncestors}
          onHoverNode={handleHoverNode}
        />
      </div>

      {/* 分割线 */}
      <div
        className={styles.divider}
        onMouseDown={startDrag}
        style={{ cursor: "col-resize" }}
      />

      {/* 右侧面板容器 */}
      <div style={{ width: `${100 - leftWidth}%` }} className="flex flex-col">
        <PanelsContainer
          selected={selected}
          onSelect={onSelect}
          root={root}
          matches={matches}
          matchIndex={matchIndex}
          setMatchIndex={setMatchIndex}
          filter={filter}
          advFilter={advFilter}
          searchOptions={searchOptions}
          xPathInput={xPathInput}
          setXPathInput={setXPathInput}
          xpathTestNodes={xpathTestNodes}
          locateXPath={locateXPath}
          xmlText={xmlText}
          setXmlText={setXmlText}
          onParse={onParse}
          currentStrategy={currentStrategy}
          currentFields={currentFields}
          updateStrategy={updateStrategy}
          updateFields={updateFields}
          panelActivateTab={panelActivateTab}
          panelActivateKey={panelActivateKey}
          panelHighlightNode={panelHighlightNode}
          matchedSet={matchedSet}
          onApplyCriteria={onApplyCriteria}
          initialMatching={initialMatching}
          onHoverNode={handleHoverNode}
        />
      </div>
    </div>
  );
};