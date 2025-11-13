// src/components/strategy-selector/menus/operation-type-menu-builder.tsx
// module: strategy-selector | layer: ui | role: 操作类型菜单构建器
// summary: 构建操作类型菜单（点击、输入、滑动等）

import type { MenuProps } from 'antd';
import type { ActionKind } from '../../../types/smartScript';

export interface OperationTypeMenuConfig {
  currentType: ActionKind;
  onTypeChange: (type: ActionKind) => void;
}

export function buildOperationTypeMenu(config: OperationTypeMenuConfig): MenuProps {
  const { currentType, onTypeChange } = config;

  const items: MenuProps['items'] = [
    {
      key: 'tap',
      label: '👆 点击',
      onClick: () => onTypeChange('tap'),
    },
    {
      key: 'long_press',
      label: '⏱️ 长按',
      onClick: () => onTypeChange('long_press'),
    },
    {
      key: 'input',
      label: '⌨️ 输入',
      onClick: () => onTypeChange('input'),
    },
    {
      key: 'swipe',
      label: '👉 滑动',
      onClick: () => onTypeChange('swipe'),
    },
  ];

  return { items };
}

export function getOperationTypeLabel(type: ActionKind): string {
  const labels: Partial<Record<ActionKind, string>> = {
    tap: '👆 点击',
    long_press: '⏱️ 长按',
    input: '⌨️ 输入',
    swipe: '👉 滑动',
  };
  return labels[type] || '👆 点击';
}
