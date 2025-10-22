// src/components/stepCards/ActionBar.tsx
// module: components | layer: ui | role: 步骤动作执行栏
// summary: Split Button风格的主执行按钮和动作类型切换

import React, { useMemo } from 'react';
import { Button, Dropdown, Space, Tooltip } from 'antd';
import { DownOutlined, AimOutlined, PlayCircleOutlined, SearchOutlined } from '@ant-design/icons';
import type { ActionType, ExecutionMode } from '../../types/stepActions';
import { ACTION_LABELS } from '../../types/stepActions';

export interface ActionBarProps {
  action: ActionType;
  onChangeAction: (actionType: ActionType) => void;
  onRun: (mode: ExecutionMode) => void;
  loading?: boolean;
  disabled?: boolean;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  action,
  onChangeAction,
  onRun,
  loading = false,
  disabled = false,
}) => {
  // 构建动作切换菜单
  const menu = useMemo(() => ({
    items: [
      { key: 'tap', label: ACTION_LABELS.tap, icon: <AimOutlined /> },
      { key: 'doubleTap', label: ACTION_LABELS.doubleTap, icon: <AimOutlined /> },
      { key: 'longPress', label: ACTION_LABELS.longPress, icon: <AimOutlined /> },
      { type: 'divider' as const },
      { key: 'swipe', label: ACTION_LABELS.swipe },
      { key: 'type', label: ACTION_LABELS.type },
      { key: 'wait', label: ACTION_LABELS.wait },
      { key: 'back', label: ACTION_LABELS.back },
    ],
    onClick: ({ key }: { key: string }) => onChangeAction(key as ActionType),
  }), [onChangeAction]);

  // 根据当前动作类型生成执行按钮文字
  const getExecuteLabel = (actionType: ActionType) => {
    const baseLabels = {
      tap: '执行（点选）',
      doubleTap: '执行（双击）', 
      longPress: '执行（长按）',
      swipe: '执行（滑动）',
      type: '执行（输入）',
      wait: '执行（等待）',
      back: '执行（返回）',
    };
    return baseLabels[actionType];
  };

  const handleExecute = () => onRun('matchAndExecute');
  const handleMatchOnly = () => onRun('matchOnly');

  return (
    <div className="action-bar light-theme-force">
      <Space>
        {/* Split Button - 左侧执行，右侧切换动作 */}
        <Button.Group>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleExecute}
            loading={loading}
            disabled={disabled}
            size="large"
          >
            {getExecuteLabel(action)}
          </Button>
          <Dropdown menu={menu} trigger={['click']}>
            <Button
              type="primary"
              icon={<DownOutlined />}
              loading={loading}
              disabled={disabled}
              size="large"
            />
          </Dropdown>
        </Button.Group>

        {/* 仅匹配按钮 */}
        <Tooltip title="只做匹配与预览，不下发ADB动作">
          <Button
            icon={<SearchOutlined />}
            onClick={handleMatchOnly}
            loading={loading}
            disabled={disabled}
            size="large"
          >
            仅匹配
          </Button>
        </Tooltip>
      </Space>

    </div>
  );
};