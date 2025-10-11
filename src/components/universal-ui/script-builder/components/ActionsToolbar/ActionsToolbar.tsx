// src/components/universal-ui/script-builder/components/ActionsToolbar/ActionsToolbar.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Button } from 'antd';
import { EyeOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import { ScreenActionDropdownButton } from '../../../../step-card';
import { SystemKeyDropdownButton } from '../../../../step-card/system-actions/SystemKeyDropdownButton';
import { GhostOverlayToggle } from '../../../dnd/components/GhostOverlayToggle';

export interface ActionsToolbarProps {
  onOpenPageAnalyzer?: () => void;
  onCreateLoop?: () => void;
  onCreateContactImport?: () => void;
  onCreateScreenInteraction?: (template: any | any[]) => void;
  onCreateSystemAction?: (template: any) => void;
}

export const ActionsToolbar: React.FC<ActionsToolbarProps> = ({
  onOpenPageAnalyzer,
  onCreateLoop,
  onCreateContactImport,
  onCreateScreenInteraction,
  onCreateSystemAction,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
      }}
    >
      {onOpenPageAnalyzer && (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={onOpenPageAnalyzer}
        >
          页面分析
        </Button>
      )}

      {onCreateLoop && (
        <Button
          type="default"
          icon={<ReloadOutlined />}
          onClick={onCreateLoop}
        >
          🔄 创建循环
        </Button>
      )}

      {onCreateContactImport && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onCreateContactImport}
        >
          📱 通讯录导入
        </Button>
      )}

      {onCreateScreenInteraction && (
        <div>
          <ScreenActionDropdownButton onSelectTemplate={(tpl) => onCreateScreenInteraction(tpl)} />
        </div>
      )}

      {onCreateSystemAction && (
        <div>
          <SystemKeyDropdownButton onSelectTemplate={(tpl) => onCreateSystemAction(tpl)} />
        </div>
      )}

      {/* 拖拽 UI：幽灵模式 开关 */}
      <div style={{ marginLeft: 'auto' }}>
        <GhostOverlayToggle />
      </div>
    </div>
  );
};

export default ActionsToolbar;
