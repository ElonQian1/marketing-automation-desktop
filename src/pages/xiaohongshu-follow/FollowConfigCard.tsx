/**
 * 关注配置卡片组件
 * 使用纯原生 Ant Design 组件
 */

import React from 'react';
import { Card, InputNumber, Switch, Space, Typography, Row, Col } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import type { FollowConfig } from './types';

const { Title, Text } = Typography;

interface FollowConfigCardProps {
  config: FollowConfig;
  onConfigChange: (config: FollowConfig) => void;
}

export const FollowConfigCard: React.FC<FollowConfigCardProps> = ({
  config,
  onConfigChange,
}) => {
  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SettingOutlined style={{ fontSize: 18, color: '#1677ff' }} />
            <Title level={4} style={{ margin: 0 }}>
              关注配置
            </Title>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>最大页数:</Text>
          <InputNumber
            min={1}
            max={50}
            value={config.max_pages}
            onChange={(value) => onConfigChange({ ...config, max_pages: value || 1 })}
          />
        </div>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>高级设置:</Text>
          
          <Row justify="space-between" align="middle">
            <Col>
              <Text>关注间隔 (秒):</Text>
            </Col>
            <Col>
              <InputNumber
                min={1}
                max={10}
                value={config.follow_interval}
                onChange={(value) => onConfigChange({ ...config, follow_interval: value || 2 })}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>

          <Row justify="space-between" align="middle">
            <Col>
              <Text>跳过已关注:</Text>
            </Col>
            <Col>
              <Switch
                checked={config.skip_existing}
                onChange={(checked) => onConfigChange({ ...config, skip_existing: checked })}
              />
            </Col>
          </Row>

          <Row justify="space-between" align="middle">
            <Col>
              <Text>执行后返回首页:</Text>
            </Col>
            <Col>
              <Switch
                checked={config.return_to_home}
                onChange={(checked) => onConfigChange({ ...config, return_to_home: checked })}
              />
            </Col>
          </Row>
        </Space>

        {config.follow_interval < 2 && (
          <div
            style={{
              marginTop: 12,
              padding: 8,
              backgroundColor: '#fff2e8',
              borderRadius: 4,
            }}
          >
            <div style={{ fontSize: 12, color: '#fa541c' }}>
              建议间隔设置
            </div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              <div>• 间隔过短可能被系统检测</div>
              <div>• 建议设置 2-5 秒之间</div>
              <div>• 当前设置: {config.follow_interval} 秒</div>
            </div>
          </div>
        )}
      </Space>
    </Card>
  );
};