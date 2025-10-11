// src/pages/app-launch-test/components/LaunchHistorySection.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Card, Timeline, Tag, Typography, Space } from 'antd';
import type { LaunchHistoryProps } from '../types/AppLaunchTestTypes';

/**
 * 启动历史记录组件 - 显示启动历史记录的时间线
 */
export const LaunchHistorySection: React.FC<LaunchHistoryProps> = ({
  launchHistory,
  apps,
  getStateColor,
  getStateText,
}) => {
  if (launchHistory.length === 0) {
    return null;
  }

  return (
    <Card title="启动历史">
      <Timeline>
        {launchHistory.map((result, index) => (
          <Timeline.Item 
            key={index}
            color={result.success ? 'green' : 'red'}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space align="center" wrap>
                <Typography.Text strong>
                  {apps.find(app => app.package_name === result.package_name)?.app_name || result.package_name}
                </Typography.Text>
                <Typography.Text type="secondary">{result.launch_time_ms}ms</Typography.Text>
                {result.app_state && (
                  <Tag>{getStateText(result.app_state.state)}</Tag>
                )}
                <Typography.Text type="secondary">{new Date().toLocaleTimeString()}</Typography.Text>
              </Space>
              <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
                {result.message}
              </Typography.Paragraph>
            </Space>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  );
};