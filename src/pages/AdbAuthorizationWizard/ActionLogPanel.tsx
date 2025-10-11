// src/pages/AdbAuthorizationWizard/ActionLogPanel.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React from 'react';
import { Card, Button } from 'antd';
import type { ActionLogPanelProps } from './types';

export const ActionLogPanel: React.FC<ActionLogPanelProps> = ({ logs, onClear }) => {
  return (
    <Card size="small" title="操作日志" extra={onClear && <Button onClick={onClear}>清空</Button>}>
      <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{logs.length ? logs.join('\n') : '暂无日志'}</pre>
    </Card>
  );
};
