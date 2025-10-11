// src/components/app-shell/HeaderBar.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';

export interface HeaderBarProps {
  title: React.ReactNode;
  actions?: React.ReactNode;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ title, actions }) => {
  return (
    <>
      <div className="modern-header-title">{title}</div>
      <div className="modern-header-actions">{actions}</div>
    </>
  );
};

export default HeaderBar;
