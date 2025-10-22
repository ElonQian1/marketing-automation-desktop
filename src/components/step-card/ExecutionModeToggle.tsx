// src/components/step-card/ExecutionModeToggle.tsx
// module: ui | layer: components | role: 执行模式切换器
// summary: 执行模式选择组件

import React from 'react';
import { Segmented } from 'antd';
import { SearchOutlined, PlayCircleOutlined } from '@ant-design/icons';
import type { TestExecutionMode } from '../../hooks/useSingleStepTest';

export interface ExecutionModeToggleProps {
  mode: TestExecutionMode;
  onChange: (mode: TestExecutionMode) => void;
  size?: 'small' | 'middle';
}

export const ExecutionModeToggle: React.FC<ExecutionModeToggleProps> = ({
  mode,
  onChange,
  size = 'small'
}) => {
  return (
    <Segmented
      value={mode}
      onChange={onChange}
      size={size}
      options={[
        {
          label: '执行步骤',
          value: 'execute-step',
          icon: <PlayCircleOutlined />
        },
        {
          label: '仅匹配',
          value: 'match-only',
          icon: <SearchOutlined />
        }
      ]}
    />
  );
};