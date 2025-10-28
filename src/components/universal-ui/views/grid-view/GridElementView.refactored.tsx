// src/components/universal-ui/views/grid-view/GridElementView.refactored.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * GridElementView - 重构后的主组件
 * 已模块化为更小的组件和 hooks
 */

import React from "react";
import type { VisualUIElement } from "../../types";
import { UiNode } from "./types";
import type { NodeLocator } from "../../../../domain/inspector/entities/NodeLocator";
import { findByXPathRoot, findByPredicateXPath, parseBounds } from "./utils";
import styles from "./GridElementView.module.css";

// 导入模块化的组件和 hooks
import { useGridElementView, UseGridElementViewProps } from "./hooks/useGridElementView";
import { Toolbar } from "./components/Toolbar";
import { MainLayout } from "./components/MainLayout";

// 视图组件属性接口
type GridElementViewProps = UseGridElementViewProps

// 兼容遗留调用：在模块级声明可变引用，供组件内赋值
let setPanelHighlightNode: (node: UiNode | null) => void;
let setPanelActivateTab: (tab: "results" | "xpath") => void;
let setPanelActivateKey: (updater: (k: number) => number) => void;

export const GridElementView: React.FC<GridElementViewProps> = (props) => {
  const {
    // 状态
    selected,
    setSelected,
    expandAll,
    setExpandAll,
    collapseVersion,
    setCollapseVersion,
    expandDepth,
    setExpandDepth,
    showMatchedOnly,
    setShowMatchedOnly,
    autoSelectOnParse,
    setAutoSelectOnParse,
    searchHistory,
    setSearchHistory,
    favSearch,
    setFavSearch,
    xpathHistory,
    setXpathHistory,
    favXPath,
    setFavXPath,

    // Refs
    fileRef,
    searchRef,
    xpathRef,

    // XML 解析
    xmlText,
    setXmlText,
    root,
    parse,

    // 搜索与匹配
    filter,
    setFilter,
    advFilter,
    setAdvFilter,
    searchOptions,
    setSearchOptions,
    matches,
    matchIndex,
    setMatchIndex,
    matchedSet,
    selectedAncestors,
    locateFirstMatch,
    goToMatch,

    // XPath 导航
    xPathInput,
    setXPathInput,
    xpathTestNodes,
    locateXPath,

    // 匹配选择
    currentStrategy,
    currentFields,
    updateStrategy,
    updateFields,

    // 面板同步
    panelSync,

    // 布局
    leftWidth,
    startDrag,
  } = useGridElementView(props);

  // 兼容旧调用别名（历史代码中可能直接使用 setPanelXxx）
  setPanelHighlightNode = (node: UiNode | null) =>
    panelSync.setHighlightNode(node, { refresh: true });
  setPanelActivateTab = (tab: "results" | "xpath") =>
    panelSync.setPanelActivateTab(tab);
  setPanelActivateKey = (_: any) => panelSync.triggerPanelRefresh();

  const { panelActivateKey, panelHighlightNode, panelActivateTab } = panelSync;

  // 兼容旧 onParse 调用点（按钮） -> 调用 parse
  const onParse = (xmlToUse?: string) => parse(xmlToUse);

  // 真机匹配回调：根据返回的 xpath 或 bounds 在当前树中选中并高亮
  const handleMatchedFromDevice = (payload: {
    preview?: { xpath?: string; bounds?: string } | null;
  }) => {
    if (!root) return;
    const xp = payload.preview?.xpath?.trim();
    const bd = payload.preview?.bounds?.trim();
    let target: UiNode | null = null;
    if (xp) {
      target = findByXPathRoot(root, xp) || findByPredicateXPath(root, xp);
    }
    if (!target && bd) {
      const pb = parseBounds(bd);
      if (pb) {
        const stack: UiNode[] = [root];
        while (stack.length && !target) {
          const n = stack.pop()!;
          const nb = parseBounds(n.attrs["bounds"] || "");
          if (
            nb &&
            nb.x1 === pb.x1 &&
            nb.y1 === pb.y1 &&
            nb.x2 === pb.x2 &&
            nb.y2 === pb.y2
          ) {
            target = n;
            break;
          }
          for (let i = n.children.length - 1; i >= 0; i--)
            stack.push(n.children[i]);
        }
      }
    }
    if (target) {
      setSelected(target);
      panelSync.setHighlightNode(target, {
        refresh: true,
        switchToResults: true,
      });
    } else {
      alert(
        "匹配成功，但未能在当前XML树中定位对应节点（可能界面已变化或XPath不兼容）。"
      );
    }
  };

  return (
    <div className={`${styles.root} w-full h-full p-4 md:p-6`}>
      {/* 顶部工具栏 */}
      <Toolbar
        xmlText={xmlText}
        setXmlText={setXmlText}
        filter={filter}
        setFilter={setFilter}
        onParse={onParse}
        onExpandAll={() => setExpandAll(true)}
        onCollapseAll={() => {
          setExpandAll(false);
          setCollapseVersion(v => v + 1);
        }}
        locateFirstMatch={locateFirstMatch}
        fileRef={fileRef}
        searchRef={searchRef}
        searchHistory={searchHistory}
        setSearchHistory={setSearchHistory}
        favSearch={favSearch}
        setFavSearch={setFavSearch}
      />

      {/* 主布局 */}
      <MainLayout
        root={root}
        selected={selected}
        onSelect={setSelected}
        expandAll={expandAll}
        collapseVersion={collapseVersion}
        expandDepth={expandDepth}
        showMatchedOnly={showMatchedOnly}
        matchedSet={matchedSet}
        selectedAncestors={Array.from(selectedAncestors)}
        leftWidth={leftWidth}
        startDrag={startDrag}
        handleHoverNode={panelSync.handleHoverNode}
        filter={filter}
        advFilter={advFilter}
        searchOptions={searchOptions}
        matches={matches}
        matchIndex={matchIndex}
        setMatchIndex={setMatchIndex}
        goToMatch={goToMatch}
        xPathInput={xPathInput}
        setXPathInput={setXPathInput}
        xpathTestNodes={xpathTestNodes}
        locateXPath={locateXPath}
        xmlText={xmlText}
        setXmlText={setXmlText}
        onParse={parse}
        currentStrategy={currentStrategy}
        currentFields={currentFields}
        updateStrategy={updateStrategy}
        updateFields={updateFields}
        panelActivateTab={panelActivateTab}
        panelActivateKey={panelActivateKey}
        panelHighlightNode={panelHighlightNode}
        onApplyCriteria={props.onApplyCriteria}
        initialMatching={props.initialMatching}
      />

      <div className={styles.hint}>
        提示： 1) 搜索框会对 resource-id / text / content-desc / class
        做包含匹配； 2) 选中节点后可复制 XPath； 3) 屏幕预览按 bounds
        画出全部元素矩形，蓝色高亮为当前选中元素。
      </div>
    </div>
  );
};