/**
 * 执行控制和进度展示组件
 * 使用纯原生 Ant Design 组件
 */

import React from 'react';
import { Card, Button, Progress, Space, Typography, Alert, List, Tag } from 'antd';
import { PlayCircleOutlined, StopOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { FollowProgress, FollowConfig, DeviceConfig } from './types';

const { Title, Text } = Typography;

interface ExecutionControlProps {
  progress: FollowProgress;
  config: FollowConfig;
  deviceConfig: DeviceConfig;
  onStart: () => void;
  onStop: () => void;
  disabled: boolean;
}

export const ExecutionControl: React.FC<ExecutionControlProps> = ({
  progress,
  config,
  deviceConfig,
  onStart,
  onStop,
  disabled,
}) => {
  const progressPercent = progress.totalPages > 0 
    ? Math.round((progress.currentPage / progress.totalPages) * 100) 
    : 0;

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThunderboltOutlined style={{ fontSize: 18, color: '#1677ff' }} />
          <Title level={4} style={{ margin: 0 }}>
            执行控制
          </Title>
        </div>

        <Space style={{ width: '100%' }}>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={onStart}
            disabled={disabled || progress.isRunning || !deviceConfig.selectedDevice}
            size="large"
          >
            开始关注
          </Button>
          
          <Button
            danger
            icon={<StopOutlined />}
            onClick={onStop}
            disabled={!progress.isRunning}
            size="large"
          >
            停止执行
          </Button>
        </Space>

        {progress.isRunning && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>执行进度:</Text>
              <Progress 
                percent={progressPercent}
                status={progress.isRunning ? 'active' : 'success'}
                format={() => `${progress.currentPage}/${progress.totalPages}`}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag color="green">已关注: {progress.followedCount}</Tag>
              <Tag color="orange">已跳过: {progress.skippedCount}</Tag>
              <Tag color="red">失败: {progress.errorCount}</Tag>
            </div>
          </Space>
        )}

        {progress.logs.length > 0 && (
          <div>
            <Text strong>执行日志:</Text>
            <List
              size="small"
              dataSource={progress.logs.slice(-5)}
              renderItem={(log, index) => (
                <List.Item>
                  <Text style={{ fontSize: 12 }}>
                    [{new Date().toLocaleTimeString()}] {log}
                  </Text>
                </List.Item>
              )}
              style={{
                maxHeight: 150,
                overflow: 'auto',
                backgroundColor: '#fafafa',
                padding: 8,
                borderRadius: 4,
                marginTop: 8,
              }}
            />
          </div>
        )}

        {!deviceConfig.selectedDevice && (
          <Alert
            message="请先选择目标设备"
            type="warning"
            showIcon
          />
        )}
      </Space>
    </Card>
  );
};