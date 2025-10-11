// src/components/universal-ui/views/grid-view/panels/ResultsAndXPathPanel.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useEffect, useState } from 'react';
import styles from "../GridElementView.module.css";
import { UiNode, AdvancedFilter, SearchOptions } from "../types";
import type { MatchCriteria } from "./node-detail/types";
import { MatchResultsPanel } from "../MatchResultsPanel";
import { XPathTestResultsPanel } from "../XPathTestResultsPanel";
import { XPathBuilder } from "../XPathBuilder";
import { ScreenPreviewSetElementButton, type CompleteStepCriteria } from './node-detail';

type TabKey = 'results' | 'xpath';

interface ResultsAndXPathPanelProps {
  // Results
  matches: UiNode[];
  matchIndex: number;
  keyword: string;
  advFilter: AdvancedFilter;
  searchOptions: SearchOptions;
  onJump: (idx: number, node: UiNode) => void;
  onInsertXPath: (xp: string) => void;
  onHoverNode?: (n: UiNode | null) => void;
  // 修改参数模式回写
  onSelectForStep?: (criteria: MatchCriteria) => void;

  // XPath tools
  selected: UiNode | null;
  onApplyXPath: (xp: string) => void;
  onInsertOnly: (xp: string) => void;
  xpathTestNodes: UiNode[];
  onJumpToNode: (n: UiNode) => void;

  // 外部联动控制
  activateTab?: 'results' | 'xpath';
  activateKey?: number; // 每次变化触发一次切换
  highlightNode?: UiNode | null; // 在 XPath 测试结果中高亮此节点
  // 跟随节点详情的当前匹配策略
  currentStrategy?: 'absolute' | 'strict' | 'relaxed' | 'positionless' | 'standard' | 'custom';
  // 跟随节点详情的字段勾选集合（优先级高于预设字段）
  currentFields?: string[];
}

export const ResultsAndXPathPanel: React.FC<ResultsAndXPathPanelProps> = ({
  matches,
  matchIndex,
  keyword,
  advFilter,
  searchOptions,
  onJump,
  onInsertXPath,
  selected,
  onApplyXPath,
  onInsertOnly,
  xpathTestNodes,
  onJumpToNode,
  activateTab,
  activateKey,
  highlightNode,
  onHoverNode,
  onSelectForStep,
  currentStrategy,
  currentFields,
}) => {
  const [active, setActive] = useState<TabKey>('results');
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // 外部激活联动：当 activateKey 变化时，切换到指定 tab
  useEffect(() => {
    if (activateTab) setActive(activateTab);
  }, [activateKey]);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="flex items-center gap-2">
          <button className={styles.btn} onClick={() => setCollapsed(c => !c)}>{collapsed ? '展开' : '收起'}</button>
          <div className="flex items-center gap-2">
            <button className={styles.btn} onClick={() => setActive('results')} style={{ background: active==='results' ? 'var(--g-surface-hover)' : undefined }}>匹配结果</button>
            <button className={styles.btn} onClick={() => setActive('xpath')} style={{ background: active==='xpath' ? 'var(--g-surface-hover)' : undefined }}>XPath 工具</button>
            {/* 在标签按钮后增加“设置为步骤元素”：无选中节点时渲染禁用态 */}
            {onSelectForStep && (
              <ScreenPreviewSetElementButton
                node={selected}
                onApply={(criteria) => onSelectForStep(criteria as any)}
              />
            )}
          </div>
        </div>
        <div className="hidden md:block text-[12px] text-neutral-500" title="XPath 是一种在 XML/HTML 文档中定位节点的路径表达式。例如 //*[@resource-id='xxx'] 或 //android.widget.Button[text()='确定']。">
          XPath：用于在 XML 中精确定位元素，例如 //*[@resource-id='xxx']
        </div>
      </div>
      {!collapsed && (
        <div className={styles.cardBody}>
          {active === 'results' ? (
            <MatchResultsPanel
              matches={matches}
              matchIndex={matchIndex}
              keyword={keyword}
              advFilter={advFilter}
              onJump={onJump}
              onInsertXPath={onInsertXPath}
              searchOptions={searchOptions}
              highlightNode={highlightNode}
              onHoverNode={onHoverNode}
              onSelectForStep={onSelectForStep}
              currentStrategy={currentStrategy}
              currentFields={currentFields}
            />
          ) : (
            <div className="space-y-4">
              <XPathTestResultsPanel nodes={xpathTestNodes} onJump={onJumpToNode} highlightNode={highlightNode || null} onHoverNode={onHoverNode} />
              <XPathBuilder
                node={selected}
                onApply={onApplyXPath}
                onInsert={onInsertOnly}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultsAndXPathPanel;
