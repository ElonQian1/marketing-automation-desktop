// src/modules/agent-runtime/ui/agent-runtime-control-panel.tsx
// module: agent-runtime | layer: ui | role: Agent 控制面板组件
// summary: 提供 Agent 启动/暂停/停止等控制和状态展示

import React, { useState } from 'react';
import {
  Card,
  Button,
  Progress,
  Tag,
  Space,
  Input,
  Select,
  Divider,
  List,
  Typography,
  Tooltip,
  Badge,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useAgentRuntime } from '../hooks/use-agent-runtime';
import {
  stateColors,
  stateLabels,
  stateIcons,
  type AgentRunState,
} from '../domain/agent-runtime-types';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface AgentRuntimeControlPanelProps {
  /** 默认设备 ID */
  defaultDeviceId?: string;
  /** 可用设备列表 */
  availableDevices?: { id: string; name: string }[];
}

export const AgentRuntimeControlPanel: React.FC<AgentRuntimeControlPanelProps> = ({
  defaultDeviceId = '',
  availableDevices = [],
}) => {
  const {
    state,
    snapshot,
    isRunning,
    events,
    loading,
    start,
    pause,
    resume,
    stop,
    approve,
    reject,
  } = useAgentRuntime();

  const [goal, setGoal] = useState('');
  const [deviceId, setDeviceId] = useState(defaultDeviceId);
  const [mode, setMode] = useState<'autonomous' | 'semi' | 'supervised'>('semi');

  const handleStart = async () => {
    if (!goal.trim()) {
      return;
    }
    if (!deviceId) {
      return;
    }
    await start({ goal: goal.trim(), deviceId, mode });
  };

  const renderStateTag = () => {
    const color = stateColors[state] as 'default' | 'processing' | 'warning' | 'error';
    const label = stateLabels[state];
    const icon = stateIcons[state];
    
    return (
      <Tag color={color} style={{ fontSize: 16, padding: '4px 12px' }}>
        {icon} {label}
      </Tag>
    );
  };

  const canStart = state === 'Idle' || state === 'Stopped';
  const canPause = state === 'Thinking' || state === 'Executing' || state === 'Observing';
  const canResume = state === 'Paused';
  const canStop = isRunning;
  const needsApproval = state === 'WaitingForApproval';

  return (
    <Card
      title={
        <Space>
          <RobotOutlined />
          <span>AI Agent 控制台</span>
          {renderStateTag()}
        </Space>
      }
      extra={
        <Badge
          status={isRunning ? 'processing' : 'default'}
          text={isRunning ? '运行中' : '空闲'}
        />
      }
      style={{ marginBottom: 16 }}
    >
      {/* 目标输入区 */}
      {canStart && (
        <div style={{ marginBottom: 16 }}>
          <Text strong>设定目标：</Text>
          <TextArea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="例如：打开微信，进入通讯录，添加手机号 13800138000 为好友"
            rows={3}
            style={{ marginTop: 8, marginBottom: 8 }}
          />
          <Space style={{ marginBottom: 8 }}>
            <Select
              value={deviceId}
              onChange={setDeviceId}
              placeholder="选择设备"
              style={{ width: 200 }}
              options={
                availableDevices.length > 0
                  ? availableDevices.map((d) => ({ label: d.name, value: d.id }))
                  : [{ label: defaultDeviceId || '默认设备', value: defaultDeviceId }]
              }
            />
            <Select
              value={mode}
              onChange={setMode}
              style={{ width: 120 }}
              options={[
                { label: '半自主', value: 'semi' },
                { label: '全自主', value: 'autonomous' },
                { label: '监督', value: 'supervised' },
              ]}
            />
          </Space>
        </div>
      )}

      {/* 控制按钮 */}
      <Space wrap style={{ marginBottom: 16 }}>
        {canStart && (
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleStart}
            loading={loading}
            disabled={!goal.trim() || !deviceId}
          >
            启动 Agent
          </Button>
        )}
        {canPause && (
          <Button icon={<PauseCircleOutlined />} onClick={pause}>
            暂停
          </Button>
        )}
        {canResume && (
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={resume}>
            恢复
          </Button>
        )}
        {canStop && (
          <Button danger icon={<StopOutlined />} onClick={stop}>
            停止
          </Button>
        )}
        {needsApproval && (
          <>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={approve}>
              批准
            </Button>
            <Button danger icon={<CloseCircleOutlined />} onClick={reject}>
              拒绝
            </Button>
          </>
        )}
      </Space>

      {/* 进度和状态 */}
      {snapshot && isRunning && (
        <>
          <Divider />
          <div style={{ marginBottom: 16 }}>
            <Text strong>当前目标：</Text>
            <Text>{snapshot.currentGoalDescription || '无'}</Text>
          </div>
          <Progress
            percent={snapshot.currentGoalProgress}
            status={state === 'Paused' ? 'exception' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <Space style={{ marginTop: 8 }}>
            <Text type="secondary">
              已完成: {snapshot.completedGoalsCount} | 失败: {snapshot.failedGoalsCount}
            </Text>
            {snapshot.consecutiveFailures > 0 && (
              <Tag color="error">连续失败: {snapshot.consecutiveFailures}</Tag>
            )}
          </Space>
        </>
      )}

      {/* 待审批操作 */}
      {needsApproval && snapshot?.pendingApprovalAction && (
        <>
          <Divider />
          <Card size="small" style={{ background: '#fffbe6', borderColor: '#ffe58f' }}>
            <Text strong>⚠️ 需要确认的操作：</Text>
            <div style={{ marginTop: 8 }}>
              <Text code>{snapshot.pendingApprovalAction}</Text>
            </div>
          </Card>
        </>
      )}

      {/* 事件日志 */}
      {events.length > 0 && (
        <>
          <Divider>事件日志</Divider>
          <div style={{ maxHeight: 200, overflow: 'auto' }}>
            <List
              size="small"
              dataSource={events.slice(-10).reverse()}
              renderItem={(event, index) => (
                <List.Item key={index} style={{ padding: '4px 0' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {event.type === 'aiThinking' && `🧠 ${event.thought}`}
                    {event.type === 'actionExecuted' &&
                      `${event.success ? '✅' : '❌'} ${event.action}: ${event.result}`}
                    {event.type === 'goalProgress' &&
                      `📊 进度 ${event.progress}% - ${event.description}`}
                    {event.type === 'stateChanged' && `🔄 状态: ${event.state}`}
                    {event.type === 'goalCompleted' && `🎉 目标完成！`}
                    {event.type === 'goalFailed' && `💔 目标失败: ${event.reason}`}
                    {event.type === 'error' && `❌ 错误: ${event.message}`}
                  </Text>
                </List.Item>
              )}
            />
          </div>
        </>
      )}
    </Card>
  );
};

export default AgentRuntimeControlPanel;
