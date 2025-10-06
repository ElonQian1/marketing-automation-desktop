import React from 'react';
import { ElementSelectionPopover } from '../../element-selection';
import { isDevDebugEnabled } from '../../../../utils/debug';

export interface SelectionPopoverContainerProps {
  selectionManager: any;
}

export const SelectionPopoverContainer: React.FC<SelectionPopoverContainerProps> = ({ selectionManager }) => {
  const isVisible = !!selectionManager.pendingSelection;
  return (
    <ElementSelectionPopover
      visible={isVisible}
      selection={selectionManager.pendingSelection}
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
