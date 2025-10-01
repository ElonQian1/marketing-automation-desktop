/**
 * GridElementView 面板容器组件
 * 包装右侧所有面板
 */

import React from 'react';
import { UiNode, AdvancedFilter, SearchOptions } from '../types';
import { loadPrefs } from '../prefs';

// 导入现有的面板组件
import { XmlSourcePanel } from '../panels/XmlSourcePanel';
import { BreadcrumbPanel } from '../panels/BreadcrumbPanel';
import { NodeDetailPanel } from '../panels/NodeDetailPanel';
import { ScreenPreviewPanel } from '../panels/ScreenPreviewPanel';
import { ResultsAndXPathPanel } from '../panels/ResultsAndXPathPanel';
import { XPathHelpPanel } from '../panels/XPathHelpPanel';
import { FieldDocPanel } from '../panels/FieldDocPanel';
import { XPathTemplatesPanel } from '../panels/XPathTemplatesPanel';
import { LocatorAdvisorPanel } from '../panels/LocatorAdvisorPanel';
import { PreferencesPanel } from '../panels/PreferencesPanel';

interface PanelsContainerProps {
  selected: UiNode | null;
  onSelect: (node: UiNode | null) => void;
  root: UiNode | null;
  matches: UiNode[];
  matchIndex: number;
  setMatchIndex: (index: number) => void;
  filter: string;
  advFilter: AdvancedFilter;
  searchOptions: SearchOptions;
  xPathInput: string;
  setXPathInput: (xpath: string) => void;
  xpathTestNodes: UiNode[];
  locateXPath: () => void;
  currentStrategy: string;
  currentFields: string[];
  updateStrategy: (strategy: string) => void;
  updateFields: (fields: string[]) => void;
  panelActivateTab: string;
  panelActivateKey: number;
  panelHighlightNode: UiNode | null;
  matchedSet: Set<UiNode>;
  onApplyCriteria?: any;
  initialMatching?: any;
  onHoverNode: (node: UiNode | null) => void;
}

export const PanelsContainer: React.FC<PanelsContainerProps> = ({
  selected,
  onSelect,
  root,
  matches,
  matchIndex,
  setMatchIndex,
  filter,
  advFilter,
  searchOptions,
  xPathInput,
  setXPathInput,
  xpathTestNodes,
  locateXPath,
  currentStrategy,
  currentFields,
  updateStrategy,
  updateFields,
  panelActivateTab,
  panelActivateKey,
  panelHighlightNode,
  matchedSet,
  onApplyCriteria,
  initialMatching,
  onHoverNode,
}) => {
  return (
    <div className="h-full flex flex-col">
      <XmlSourcePanel />
      <BreadcrumbPanel selected={selected} onSelect={onSelect} />
      <NodeDetailPanel
        node={selected}
        onApplyToStep={onApplyCriteria as any}
        onStrategyChanged={updateStrategy}
        onFieldsChanged={updateFields}
        initialMatching={initialMatching as any}
      />
      <LocatorAdvisorPanel
        node={selected}
        onApply={(xp) => {
          setXPathInput(xp);
          setTimeout(() => locateXPath(), 0);
        }}
        onInsert={(xp) => setXPathInput(xp)}
      />
      <ScreenPreviewPanel
        root={root}
        selected={selected}
        onSelect={onSelect}
        matchedSet={matchedSet}
        highlightNode={panelHighlightNode}
        highlightKey={panelActivateKey}
        enableFlashHighlight={loadPrefs().enableFlashHighlight !== false}
        previewAutoCenter={loadPrefs().previewAutoCenter !== false}
        onSelectForStep={onApplyCriteria as any}
      />
      <ResultsAndXPathPanel
        matches={matches}
        matchIndex={matchIndex}
        keyword={filter}
        advFilter={advFilter}
        searchOptions={searchOptions}
        onJump={(idx, node) => {
          setMatchIndex(idx);
          onSelect(node);
        }}
        onInsertXPath={setXPathInput}
        onHoverNode={onHoverNode}
        selected={selected}
        onApplyXPath={(xp) => {
          setXPathInput(xp);
          setTimeout(() => locateXPath(), 0);
        }}
        onInsertOnly={setXPathInput}
        xpathTestNodes={xpathTestNodes}
        onJumpToNode={onSelect}
        activateTab={panelActivateTab}
        activateKey={panelActivateKey}
        highlightNode={panelHighlightNode}
        onSelectForStep={onApplyCriteria as any}
        currentStrategy={currentStrategy as any}
        currentFields={currentFields}
      />
      <XPathTemplatesPanel
        node={selected}
        onApply={(xp) => {
          setXPathInput(xp);
          setTimeout(() => locateXPath(), 0);
        }}
        onInsert={setXPathInput}
      />
      <FieldDocPanel />
      <XPathHelpPanel />
    </div>
  );
};