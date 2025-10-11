// src/pages/adb-layout-comparison/components/DesignPrincipleAlert.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Alert } from 'antd';

export interface DesignPrincipleAlertProps {
  layout: 'old' | 'new';
}

export const DesignPrincipleAlert: React.FC<DesignPrincipleAlertProps> = ({ layout }) => {
  const desc = layout === 'new'
    ? "新版Dashboard布局遵循'Everything at a Glance'原则，将关键信息集中展示，减少用户的认知负担。参考Jenkins、Grafana等专业工具的设计模式，提供层次化的信息架构。"
    : "原版Tab布局虽然结构清晰，但存在信息孤岛问题，用户需要频繁切换标签页才能获得完整的系统状态，不符合诊断工具的使用习惯。";
  return (
    <Alert type="info" showIcon message="设计原理" description={desc} />
  );
};

export default DesignPrincipleAlert;
