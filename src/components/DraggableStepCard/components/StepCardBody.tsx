// src/components/DraggableStepCard/components/StepCardBody.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { DescriptionEditor } from './DescriptionEditor';
import type { StepTypeStyle } from '../styles/stepTypeStyles';
import AccentBars from './body/AccentBars';
import StrategyArea from './body/StrategyArea';
import ContactActions from './body/ContactActions';
import { noDragProps } from '../../universal-ui/dnd/noDrag';

type MinimalStep = {
  id: string;
  name: string;
  step_type: string;
  description?: string;
  parameters?: any;
};

interface StepCardBodyProps {
  step: MinimalStep;
  typeStyle: StepTypeStyle;
  // 描述编辑
  descDraft: string;
  editingDesc: boolean;
  onBeginEditDesc: (e: React.MouseEvent) => void;
  onChangeDescDraft: (v: string) => void;
  onSaveDesc: () => void;
  onCancelDesc: () => void;
  // 更新参数
  onUpdateStepParameters?: (id: string, nextParams: any) => void;
  // 批量匹配
  onBatchMatch?: (stepId: string) => void;
  ENABLE_BATCH_MATCH?: boolean;
  // 设备列表（联系人导入用提示）
  devices: any[];
}

export const StepCardBody: React.FC<StepCardBodyProps> = ({
  step,
  typeStyle,
  descDraft,
  editingDesc,
  onBeginEditDesc,
  onChangeDescDraft,
  onSaveDesc,
  onCancelDesc,
  onUpdateStepParameters,
  onBatchMatch,
  ENABLE_BATCH_MATCH,
  devices,
}) => {
  return (
    <>
      <AccentBars stepType={step.step_type} typeStyle={typeStyle} />

      <div className="text-sm mb-2">
        <div className="flex items-center justify-between">
          <DescriptionEditor
            value={descDraft || step.description || ''}
            editing={editingDesc}
            onBeginEdit={onBeginEditDesc}
            onChange={onChangeDescDraft}
            onSave={onSaveDesc}
            onCancel={onCancelDesc}
          />

          <div className="flex items-center gap-2 shrink-0" {...noDragProps}>
            {/* 🔄 原 InlineLoopControl 已删除，现使用后端循环系统 */}

            <StrategyArea
              step={step}
              onUpdateStepParameters={onUpdateStepParameters}
              onBatchMatch={onBatchMatch}
              ENABLE_BATCH_MATCH={ENABLE_BATCH_MATCH}
            />
          </div>
        </div>

        <div {...noDragProps}>
          <ContactActions step={step} devices={devices} />
        </div>
      </div>
    </>
  );
};

export default StepCardBody;
