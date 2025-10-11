// src/pages/device-monitor/DeviceEventLog.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React from 'react';
import { Card, Tag, Typography, Space } from 'antd';
import type { EventLogProps } from './types';

const { Text } = Typography;

function fmtEvent(event: any): string {
  const et = event?.event_type;
  if (!et) return '无';
  if ('DeviceConnected' in et) return `设备连接: ${et.DeviceConnected}`;
  if ('DeviceDisconnected' in et) return `设备断开: ${et.DeviceDisconnected}`;
  if ('DevicesChanged' in et) return '设备状态变化';
  if ('InitialList' in et) return '初始设备列表';
  return '未知事件';
}

export const DeviceEventLog: React.FC<EventLogProps> = ({ lastEvent }) => {
  return (
    <Card size="small" title="最近事件">
      {lastEvent ? (
        <Space direction="vertical">
          <div>
            <Text strong>事件类型:</Text><br />
            <Text>{fmtEvent(lastEvent)}</Text>
          </div>
          <div>
            <Text strong>时间戳:</Text><br />
            <Text>{new Date(lastEvent.timestamp * 1000).toLocaleString()}</Text>
          </div>
          <div>
            <Text strong>设备数量:</Text><br />
            <Text>{lastEvent.devices.length}</Text>
          </div>
          <div>
            {lastEvent.devices.map((d, idx) => (
              <Tag key={idx}>{d.id}: {d.status}</Tag>
            ))}
          </div>
        </Space>
      ) : (
        <Text type="secondary">暂无事件</Text>
      )}
    </Card>
  );
};
