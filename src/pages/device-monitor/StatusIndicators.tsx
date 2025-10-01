import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { MobileOutlined, WifiOutlined, UsbOutlined, DesktopOutlined } from '@ant-design/icons';
import type { StatusIndicatorsProps } from './types';

export const StatusIndicators: React.FC<StatusIndicatorsProps> = ({ total, online, usb, emulator }) => {
  return (
    <Row gutter={12}>
      <Col xs={12} md={6}><Card><Statistic title="总设备" value={total} prefix={<MobileOutlined />} /></Card></Col>
      <Col xs={12} md={6}><Card><Statistic title="在线" value={online} prefix={<WifiOutlined />} /></Card></Col>
      <Col xs={12} md={6}><Card><Statistic title="USB" value={usb} prefix={<UsbOutlined />} /></Card></Col>
      <Col xs={12} md={6}><Card><Statistic title="模拟器" value={emulator} prefix={<DesktopOutlined />} /></Card></Col>
    </Row>
  );
};
