import React from 'react';
import { UiNode } from "../types";
import { ScreenPreview } from "../ScreenPreview";
import styles from "../GridElementView.module.css";
import { ScreenPreviewSetElementButton, type CompleteStepCriteria } from './node-detail';

interface ScreenPreviewPanelProps {
  root: UiNode | null;
  selected: UiNode | null;
  onSelect: (n: UiNode) => void;
  onElementClick?: (n: UiNode) => void;
  matchedSet: Set<UiNode>;
  highlightNode?: UiNode | null;
  highlightKey?: number;
  enableFlashHighlight?: boolean;
  previewAutoCenter?: boolean;
  onSelectForStep?: (criteria: CompleteStepCriteria) => void;
  // 🆕 从上层传入的截图 URL
  screenshotUrl?: string;
}

export const ScreenPreviewPanel: React.FC<ScreenPreviewPanelProps> = ({ 
  root, 
  selected, 
  onSelect, 
  onElementClick,
  matchedSet, 
  highlightNode, 
  highlightKey, 
  enableFlashHighlight, 
  previewAutoCenter, 
  onSelectForStep,
  screenshotUrl
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className="flex items-center justify-between">
          <span>屏幕预览</span>
          {onSelectForStep && selected && (
            <ScreenPreviewSetElementButton
              node={selected}
              onApply={(criteria) => onSelectForStep(criteria)}
            />
          )}
        </div>
      </div>
      <div className={styles.cardBody}>
        <ScreenPreview 
          root={root} 
          selected={selected} 
          onSelect={onSelect}
          onElementClick={onElementClick}
          matchedSet={matchedSet} 
          highlightNode={highlightNode} 
          highlightKey={highlightKey} 
          enableFlashHighlight={enableFlashHighlight} 
          previewAutoCenter={previewAutoCenter}
          screenshotUrl={screenshotUrl}
        />
      </div>
    </div>
  );
};

export default ScreenPreviewPanel;
