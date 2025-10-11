// src/theme/TokenBridge.tsx
// module: shared | layer: ui | role: 主题系统
// summary: 应用主题配置和切换逻辑

import React from 'react';
import { theme as antdTheme } from 'antd';

/**
 * TokenBridge
 * 将 AntD v5 的主题 token 同步为全局 CSS 变量，
 * 让自定义样式（modern.css 等）跟随“原生 AntD 暗黑/亮色”变化。
 */
export const TokenBridge: React.FC = () => {
  const { token } = antdTheme.useToken();

  React.useEffect(() => {
    const root = document.documentElement;
    const set = (name: string, value?: string | number) => {
      if (value == null) return;
      root.style.setProperty(name, String(value));
    };

    // 布局/容器
    set('--color-bg-layout', token.colorBgLayout);
    set('--color-bg-container', token.colorBgContainer);
    set('--color-bg-elevated', token.colorBgElevated ?? token.colorBgContainer);

    // 文本
    set('--color-text', token.colorText);
    set('--color-text-secondary', token.colorTextSecondary);
    set('--color-text-tertiary', token.colorTextTertiary ?? token.colorTextSecondary);

    // 边框/分割线
    set('--color-border', token.colorBorder);
    set('--color-split', token.colorSplit);

    // 语义色
    set('--color-primary', token.colorPrimary);
    set('--color-success', token.colorSuccess);
    set('--color-warning', token.colorWarning);
    set('--color-error', token.colorError);
    set('--color-info', token.colorInfo ?? token.colorPrimary);

    // 玻璃卡片（推导，适配暗黑/亮色）
    const glassBg = token.colorBgElevated ? `color-mix(in srgb, ${token.colorBgElevated} 92%, transparent)` : undefined;
    const glassBorder = token.colorBorder ? `color-mix(in srgb, ${token.colorBorder} 40%, transparent)` : undefined;
    set('--card-glass-bg', glassBg ?? 'rgba(255,255,255,0.04)');
    set('--card-glass-border', glassBorder ?? 'rgba(255,255,255,0.08)');
  }, [token]);

  return null;
};

export default TokenBridge;
