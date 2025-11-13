// src/components/strategy-selector/menus/selection-mode-menu-builder.tsx
// module: strategy-selector | layer: ui | role: 选择模式菜单构建器
// summary: 构建选择模式菜单（首个、末个、批量等）

import type { MenuProps } from 'antd';
import type { SelectionMode } from '../../../types/smartSelection';

export interface SelectionModeMenuConfig {
  currentMode: SelectionMode;
  onModeChange: (mode: SelectionMode) => void;
}

export function buildSelectionModeMenu(config: SelectionModeMenuConfig): MenuProps {
  const { currentMode, onModeChange } = config;

  const items: MenuProps['items'] = [
    {
      key: 'first',
      label: '首个匹配',
      icon: <span>🎯</span>,
      onClick: () => onModeChange('first'),
    },
    {
      key: 'last',
      label: '末个匹配',
      icon: <span>🎯</span>,
      onClick: () => onModeChange('last'),
    },
    {
      key: 'all',
      label: '批量执行',
      icon: <span>📋</span>,
      onClick: () => onModeChange('all'),
    },
    {
      key: 'random',
      label: '随机选择',
      icon: <span>🎲</span>,
      onClick: () => onModeChange('random'),
    },
    {
      key: 'match-original',
      label: '精准匹配',
      icon: <span>🎯</span>,
      onClick: () => onModeChange('match-original'),
    },
  ];

  return { items };
}

export function getSelectionModeLabel(mode: SelectionMode): string {
  const labels: Record<SelectionMode, string> = {
    first: '🎯 首个',
    last: '🎯 末个',
    all: '📋 批量',
    random: '🎲 随机',
    'match-original': '🎯 精准',
  };
  return labels[mode] || '🎯 首个';
}
