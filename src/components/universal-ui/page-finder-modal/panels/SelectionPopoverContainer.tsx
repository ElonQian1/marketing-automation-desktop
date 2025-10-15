// src/components/universal-ui/page-finder-modal/panels/SelectionPopoverContainer.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { ElementSelectionPopover } from '../../element-selection';
import { isDevDebugEnabled } from '../../../../utils/debug';

export interface SelectionPopoverContainerProps {
  selectionManager: any;
  xmlContent?: string; // 🆕 新增XML内容支持
  enableIntelligentAnalysis?: boolean; // 🧠 智能分析功能开关
  stepId?: string; // 步骤ID，用于结果回填
}

export const SelectionPopoverContainer: React.FC<SelectionPopoverContainerProps> = ({ 
  selectionManager, 
  xmlContent, // 🆕 接收XML内容
  enableIntelligentAnalysis = true, // 🧠 默认启用智能分析
  stepId // 步骤ID
}) => {
  const isVisible = !!selectionManager.pendingSelection;
  return (
    <ElementSelectionPopover
      visible={isVisible}
      selection={selectionManager.pendingSelection}
      xmlContent={xmlContent} // 🆕 传递XML内容
      onConfirm={() => {
        if (isDevDebugEnabled('debug:visual')) console.debug('✅ [ElementSelectionPopover] onConfirm');
        selectionManager.confirmSelection();
      }}
      onCancel={() => {
        if (isDevDebugEnabled('debug:visual')) console.debug('❌ [ElementSelectionPopover] onCancel');
        selectionManager.cancelSelection();
      }}
      onHide={() => {
        if (isDevDebugEnabled('debug:visual')) console.debug('🫥 [ElementSelectionPopover] onHide');
        selectionManager.hideElement();
      }}
      allElements={selectionManager?.visibleElements || []}
      onElementSelect={(newElement: any) => {
        if (isDevDebugEnabled('debug:visual')) console.debug('🔄 [ElementSelectionPopover] 选择新元素:', newElement?.id);
        selectionManager.confirmElement?.(newElement);
      }}
      // 🧠 智能分析功能支持
      enableIntelligentAnalysis={enableIntelligentAnalysis}
      stepId={stepId}
      onStrategySelect={(strategy) => {
        if (isDevDebugEnabled('debug:visual')) console.debug('🧠 [SelectionPopoverContainer] 策略选择:', strategy);
        // 可以添加策略选择的处理逻辑
      }}
      // 恢复版本的完整属性支持
      autoCancelOnOutsideClick={true}
      autoPlacement={true}
      autoPlacementMode="area"
      snapToAnchor={true}
      clampRatio={0.9}
    />
  );
};

export default SelectionPopoverContainer;
