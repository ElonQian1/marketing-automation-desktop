// src/pages/execution-monitor/components/InfoAlert.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Alert } from 'antd';

export const InfoAlert: React.FC = () => (
  <Alert
    message="执行监控功能"
    description="选择下方的示例脚本开始体验执行监控功能。监控系统将实时跟踪脚本执行状态、步骤进度、日志记录和性能数据。"
    type="info"
    showIcon
  />
);

export default InfoAlert;
