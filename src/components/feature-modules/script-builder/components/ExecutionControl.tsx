// src/components/feature-modules/script-builder/components/ExecutionControl.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 脚本执行控制组件
 * 提供脚本执行、暂停、停止、监控等功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Progress,
  Alert,
  Dropdown,
  Select,
  Tooltip,
  Tag,
  Statistic,
  Row,
  Col,
  List,
  Typography,
  Modal,
  Divider,
  MenuProps,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  SettingOutlined,
  BugOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DownOutlined,
  ClearOutlined,
  EyeOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { 
  Script,
  ScriptStep,
  ExecutionResult,
  ExecutionLog,
} from '../types';

const { Text, Paragraph } = Typography;
const { Option } = Select;

/**
 * ExecutionControl 组件属性
 */
interface ExecutionControlProps {
  /** 脚本数据 */
  script: Script | null;
  /** 是否正在执行 */
  isExecuting: boolean;
  /** 是否暂停 */
  isPaused: boolean;
  /** 当前执行步骤索引 */
  currentStepIndex: number;
  /** 执行进度 */
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  /** 执行结果 */
  result: ExecutionResult | null;
  /** 执行日志 */
  logs: ExecutionLog[];
  /** 错误信息 */
  error: string | null;
  /** 可选设备列表 */
  availableDevices?: Array<{ id: string; name: string; status: string }>;
  /** 当前选中设备 */
  selectedDevice?: string;
  /** 开始执行 */
  onStartExecution: (options?: {
    deviceId?: string;
    startFromStep?: number;
    endAtStep?: number;
    skipDisabled?: boolean;
  }) => void;
  /** 暂停执行 */
  onPauseExecution: () => void;
  /** 恢复执行 */
  onResumeExecution: () => void;
  /** 停止执行 */
  onStopExecution: () => void;
  /** 选择设备 */
  onDeviceSelect?: (deviceId: string) => void;
  /** 清除日志 */
  onClearLogs?: () => void;
  /** 导出日志 */
  onExportLogs?: () => void;
  /** 查看步骤详情 */
  onViewStepDetails?: (stepId: string) => void;
}

/**
 * 日志级别颜色映射
 */
const LOG_LEVEL_COLORS: Record<string, string> = {
  debug: '#d9d9d9',
  info: '#1890ff',
  warn: '#faad14',
  error: '#ff4d4f',
};

/**
 * 执行控制组件
 */
export const ExecutionControl: React.FC<ExecutionControlProps> = ({
  script,
  isExecuting,
  isPaused,
  currentStepIndex,
  progress,
  result,
  logs,
  error,
  availableDevices = [],
  selectedDevice,
  onStartExecution,
  onPauseExecution,
  onResumeExecution,
  onStopExecution,
  onDeviceSelect,
  onClearLogs,
  onExportLogs,
  onViewStepDetails,
}) => {
  const [showLogs, setShowLogs] = useState(false);
  const [logLevel, setLogLevel] = useState<string>('info');
  const [executionOptions, setExecutionOptions] = useState({
    startFromStep: 0,
    endAtStep: undefined as number | undefined,
    skipDisabled: true,
  });

  // 过滤日志
  const filteredLogs = logs.filter(log => {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(logLevel);
    const logLevelIndex = levels.indexOf(log.level);
    return logLevelIndex >= currentLevelIndex;
  });

  // 获取当前执行的步骤
  const getCurrentStep = (): ScriptStep | null => {
    if (!script || currentStepIndex < 0 || currentStepIndex >= script.steps.length) {
      return null;
    }
    return script.steps[currentStepIndex];
  };

  const currentStep = getCurrentStep();

  // 执行选项菜单
  const executionMenuItems: MenuProps['items'] = [
    {
      key: 'from-start',
      label: '从头开始执行',
      onClick: () => onStartExecution({
        deviceId: selectedDevice,
        startFromStep: 0,
        skipDisabled: executionOptions.skipDisabled,
      }),
    },
    {
      key: 'from-current',
      label: `从第 ${currentStepIndex + 1} 步开始`,
      onClick: () => onStartExecution({
        deviceId: selectedDevice,
        startFromStep: currentStepIndex,
        skipDisabled: executionOptions.skipDisabled,
      }),
      disabled: currentStepIndex < 0,
    },
    {
      key: 'custom-range',
      label: '自定义范围执行',
      onClick: () => {
        Modal.confirm({
          title: '自定义执行范围',
          content: (
            <div>
              <p>起始步骤: {executionOptions.startFromStep + 1}</p>
              <p>结束步骤: {executionOptions.endAtStep ? executionOptions.endAtStep + 1 : '最后'}</p>
              <p>跳过禁用步骤: {executionOptions.skipDisabled ? '是' : '否'}</p>
            </div>
          ),
          onOk: () => onStartExecution({
            deviceId: selectedDevice,
            ...executionOptions,
          }),
        });
      },
    },
  ];

  // 格式化时间
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    } else if (minutes > 0) {
      return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
    } else {
      return `${seconds}s`;
    }
  };

  // 渲染执行状态
  const renderExecutionStatus = () => {
    if (!script) {
      return (
        <Alert
          message="未选择脚本"
          description="请先选择要执行的脚本"
          type="info"
          showIcon
        />
      );
    }

    if (error) {
      return (
        <Alert
          message="执行错误"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => onStartExecution()}>
              重新执行
            </Button>
          }
        />
      );
    }

    if (isExecuting) {
      return (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>正在执行: </Text>
            <Text>{script.name}</Text>
            {isPaused && <Tag color="orange" style={{ marginLeft: 8 }}>已暂停</Tag>}
          </div>
          
          <Progress
            percent={progress.percentage}
            status={isPaused ? 'exception' : 'active'}
            format={() => `${progress.completed}/${progress.total}`}
            style={{ marginBottom: 16 }}
          />

          {currentStep && (
            <div style={{ 
              background: '#f5f5f5', 
              padding: 12, 
              borderRadius: 6,
              marginBottom: 16 
            }}>
              <Text strong>当前步骤: </Text>
              <Text>{currentStep.name}</Text>
              <br />
              <Text type="secondary">类型: {currentStep.type}</Text>
            </div>
          )}
        </div>
      );
    }

    if (result) {
      return (
        <Alert
          message={`执行${result.status === 'success' ? '成功' : '失败'}`}
          description={
            <div>
              <p>执行时间: {formatDuration(result.statistics.totalDuration)}</p>
              <p>
                完成步骤: {result.statistics.completedSteps}/{result.statistics.totalSteps}
                {result.statistics.failedSteps > 0 && ` (失败: ${result.statistics.failedSteps})`}
                {result.statistics.skippedSteps > 0 && ` (跳过: ${result.statistics.skippedSteps})`}
              </p>
            </div>
          }
          type={result.status === 'success' ? 'success' : 'error'}
          showIcon
        />
      );
    }

    return (
      <Alert
        message="准备执行"
        description={`脚本包含 ${script.steps.length} 个步骤`}
        type="info"
        showIcon
      />
    );
  };

  // 渲染控制按钮
  const renderControlButtons = () => {
    if (!script) return null;

    return (
      <Space wrap>
        {!isExecuting ? (
          <Dropdown menu={{ items: executionMenuItems }} trigger={['click']}>
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              disabled={!selectedDevice || script.steps.length === 0}
            >
              执行脚本 <DownOutlined />
            </Button>
          </Dropdown>
        ) : (
          <Space>
            {!isPaused ? (
              <Button 
                icon={<PauseCircleOutlined />} 
                onClick={onPauseExecution}
              >
                暂停
              </Button>
            ) : (
              <Button 
                type="primary"
                icon={<PlayCircleOutlined />} 
                onClick={onResumeExecution}
              >
                继续
              </Button>
            )}
            
            <Button 
              danger
              icon={<StopOutlined />} 
              onClick={onStopExecution}
            >
              停止
            </Button>
          </Space>
        )}

        <Button 
          icon={<BugOutlined />}
          onClick={() => setShowLogs(!showLogs)}
        >
          {showLogs ? '隐藏' : '显示'}日志
        </Button>

        <Button 
          icon={<SettingOutlined />}
          disabled={isExecuting}
        >
          设置
        </Button>
      </Space>
    );
  };

  // 渲染设备选择
  const renderDeviceSelection = () => {
    if (availableDevices.length === 0) return null;

    return (
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ marginRight: 8 }}>执行设备:</Text>
        <Select
          value={selectedDevice}
          onChange={onDeviceSelect}
          style={{ width: 200 }}
          placeholder="选择设备"
          disabled={isExecuting}
        >
          {availableDevices.map(device => (
            <Option key={device.id} value={device.id}>
              <Space>
                <span>{device.name}</span>
                <Tag 
                  color={device.status === 'online' ? 'green' : 'red'}
                >
                  {device.status}
                </Tag>
              </Space>
            </Option>
          ))}
        </Select>
      </div>
    );
  };

  // 渲染执行统计
  const renderExecutionStats = () => {
    if (!result) return null;

    return (
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={6}>
          <Statistic
            title="总步骤"
            value={result.statistics.totalSteps}
            prefix={<InfoCircleOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="已完成"
            value={result.statistics.completedSteps}
            valueStyle={{ color: '#3f8600' }}
            prefix={<CheckCircleOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="失败"
            value={result.statistics.failedSteps}
            valueStyle={{ color: '#cf1322' }}
            prefix={<ExclamationCircleOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="执行时间"
            value={formatDuration(result.statistics.totalDuration)}
            prefix={<ClockCircleOutlined />}
          />
        </Col>
      </Row>
    );
  };

  // 渲染日志面板
  const renderLogPanel = () => {
    if (!showLogs) return null;

    return (
      <Card 
        title="执行日志" 
        size="small"
        style={{ marginTop: 16 }}
        extra={
          <Space>
            <Select
              value={logLevel}
              onChange={setLogLevel}
              size="small"
              style={{ width: 80 }}
            >
              <Option value="debug">全部</Option>
              <Option value="info">信息</Option>
              <Option value="warn">警告</Option>
              <Option value="error">错误</Option>
            </Select>
            
            {onExportLogs && (
              <Button 
                size="small" 
                icon={<DownloadOutlined />}
                onClick={onExportLogs}
              >
                导出
              </Button>
            )}
            
            {onClearLogs && (
              <Button 
                size="small" 
                icon={<ClearOutlined />}
                onClick={onClearLogs}
              >
                清空
              </Button>
            )}
          </Space>
        }
      >
        <div style={{ maxHeight: 300, overflow: 'auto' }}>
          {filteredLogs.length === 0 ? (
            <Text type="secondary">暂无日志</Text>
          ) : (
            <List
              size="small"
              dataSource={filteredLogs}
              renderItem={(log) => (
                <List.Item style={{ padding: '8px 0' }}>
                  <div style={{ width: '100%' }}>
                    <Space>
                      <Tag 
                        color={LOG_LEVEL_COLORS[log.level]} 
                        style={{ margin: 0, minWidth: 40, textAlign: 'center' }}
                      >
                        {log.level}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </Text>
                      {log.stepId && onViewStepDetails && (
                        <Button
                          type="link"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => onViewStepDetails(log.stepId!)}
                          style={{ padding: 0, height: 'auto' }}
                        >
                          步骤
                        </Button>
                      )}
                    </Space>
                    <div style={{ marginTop: 4 }}>
                      <Text>{log.message}</Text>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
        </div>
      </Card>
    );
  };

  return (
    <Card title="执行控制" size="small">
      {renderDeviceSelection()}
      {renderExecutionStatus()}
      
      <Divider />
      
      {renderControlButtons()}
      {renderExecutionStats()}
      {renderLogPanel()}
    </Card>
  );
};