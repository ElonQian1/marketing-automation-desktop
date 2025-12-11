// src/components/device/ui-dump-mode-panel.tsx
// module: device | layer: ui | role: ui-dump-mode-selector
// summary: UI Dump 模式选择面板 - 模式切换、测试按钮、可折叠诊断日志

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Collapse,
  Radio,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  message,
  InputNumber,
  Divider,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  useUiDumpStore,
  useCurrentDumpMode,
  useDumpConfig,
  useAvailableModes,
  useTestRunning,
  useLastTestResult,
  useUiDumpLoading,
  type DumpMode,
  type DiagnosticEntry,
} from '../../application/store/uiDumpStore';

const { Text, Title } = Typography;
const { Panel } = Collapse;

interface UiDumpModePanelProps {
  /** 当前选中的设备 ID */
  deviceId?: string;
  /** 是否紧凑模式 */
  compact?: boolean;
}

/**
 * UI Dump 模式选择面板
 * 
 * 功能：
 * 1. 模式切换（Auto/ExecOut/DumpPull/A11y）
 * 2. 测试当前模式按钮
 * 3. 可折叠诊断日志面板
 * 4. 超时配置
 */
export const UiDumpModePanel: React.FC<UiDumpModePanelProps> = ({
  deviceId,
  compact = false,
}) => {
  const store = useUiDumpStore();
  const currentMode = useCurrentDumpMode();
  const config = useDumpConfig();
  const availableModes = useAvailableModes();
  const isTestRunning = useTestRunning();
  const lastTestResult = useLastTestResult();
  const isLoading = useUiDumpLoading();
  
  const [diagnostics, setDiagnostics] = useState<DiagnosticEntry[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  
  // 初始化
  useEffect(() => {
    store.initialize();
  }, []);
  
  // 处理模式切换
  const handleModeChange = async (mode: DumpMode) => {
    try {
      await store.setMode(mode);
      message.success(`模式已切换为: ${getModeDisplayName(mode)}`);
    } catch (error) {
      message.error(`切换模式失败: ${error}`);
    }
  };
  
  // 处理测试
  const handleTest = async () => {
    if (!deviceId) {
      message.warning('请先选择设备');
      return;
    }
    
    try {
      const result = await store.testMode(deviceId, currentMode);
      if (result.success) {
        message.success(`测试成功! 耗时: ${result.elapsed_ms}ms, 大小: ${result.xml_length}字符`);
      } else {
        message.error(`测试失败: ${result.error}`);
      }
      // 刷新诊断日志
      await refreshDiagnostics();
    } catch (error) {
      message.error(`测试失败: ${error}`);
    }
  };
  
  // 刷新诊断日志
  const refreshDiagnostics = async () => {
    await store.fetchDiagnostics();
    setDiagnostics(store.diagnostics);
  };
  
  // 清空诊断日志
  const handleClearDiagnostics = async () => {
    await store.clearDiagnostics();
    setDiagnostics([]);
    message.success('诊断日志已清空');
  };
  
  // 获取模式显示名称
  const getModeDisplayName = (mode: DumpMode): string => {
    const modeInfo = availableModes.find(m => m.mode === mode);
    return modeInfo?.name || mode;
  };
  
  // 获取模式图标
  const getModeIcon = (mode: DumpMode) => {
    switch (mode) {
      case 'auto':
        return <SettingOutlined />;
      case 'exec_out':
        return <ThunderboltOutlined />;
      case 'dump_pull':
        return <ClockCircleOutlined />;
      case 'a11y':
        return <ExperimentOutlined />;
      default:
        return <InfoCircleOutlined />;
    }
  };
  
  // 渲染诊断条目
  const renderDiagnosticEntry = (entry: DiagnosticEntry, index: number) => {
    const levelColors: Record<string, string> = {
      info: 'blue',
      warn: 'orange',
      error: 'red',
      debug: 'gray',
    };
    
    const levelIcons: Record<string, React.ReactNode> = {
      info: <InfoCircleOutlined />,
      warn: <ExperimentOutlined />,
      error: <CloseCircleOutlined />,
      debug: <SettingOutlined />,
    };
    
    return (
      <div
        key={index}
        className="light-theme-force"
        style={{
          padding: '8px 12px',
          marginBottom: '4px',
          background: 'var(--bg-light-base, #f8fafc)',
          borderRadius: '4px',
          borderLeft: `3px solid ${levelColors[entry.level] === 'blue' ? '#1890ff' : 
                                   levelColors[entry.level] === 'orange' ? '#fa8c16' :
                                   levelColors[entry.level] === 'red' ? '#ff4d4f' : '#8c8c8c'}`,
        }}
      >
        <Space size="small" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space size="small">
            <Tag color={levelColors[entry.level]} icon={levelIcons[entry.level]}>
              {entry.level.toUpperCase()}
            </Tag>
            <Text style={{ color: '#1e293b' }}>{entry.message}</Text>
          </Space>
          <Space size="small">
            {entry.mode && (
              <Tag color="purple">{entry.mode}</Tag>
            )}
            {entry.elapsed_ms !== undefined && (
              <Tag color="cyan">{entry.elapsed_ms}ms</Tag>
            )}
          </Space>
        </Space>
      </div>
    );
  };

  if (compact) {
    // 紧凑模式：只显示模式选择和测试按钮
    return (
      <Card size="small" title="UI Dump 模式" extra={
        <Button
          type="primary"
          size="small"
          icon={<ExperimentOutlined />}
          loading={isTestRunning}
          disabled={!deviceId}
          onClick={handleTest}
        >
          测试
        </Button>
      }>
        <Radio.Group
          value={currentMode}
          onChange={(e) => handleModeChange(e.target.value)}
          disabled={isLoading}
          size="small"
        >
          {availableModes.filter(m => m.implemented).map(mode => (
            <Radio.Button key={mode.mode} value={mode.mode}>
              {getModeIcon(mode.mode)} {mode.name.split(' ')[0]}
            </Radio.Button>
          ))}
        </Radio.Group>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <ThunderboltOutlined />
          <span>UI Dump 模式</span>
          {config && (
            <Tag color="blue">{config.device_compat_count} 设备缓存</Tag>
          )}
        </Space>
      }
      extra={
        <Space>
          <Button
            size="small"
            icon={<SettingOutlined />}
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? '隐藏设置' : '显示设置'}
          </Button>
          <Button
            type="primary"
            icon={<ExperimentOutlined />}
            loading={isTestRunning}
            disabled={!deviceId}
            onClick={handleTest}
          >
            测试当前模式
          </Button>
        </Space>
      }
    >
      {/* 模式选择 */}
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          选择 UI Dump 执行模式：
        </Text>
        <Radio.Group
          value={currentMode}
          onChange={(e) => handleModeChange(e.target.value)}
          disabled={isLoading}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {availableModes.map(mode => (
              <Radio
                key={mode.mode}
                value={mode.mode}
                disabled={!mode.implemented}
                style={{ width: '100%' }}
              >
                <Space>
                  {getModeIcon(mode.mode)}
                  <span>{mode.name}</span>
                  {!mode.implemented && <Tag color="orange">预留</Tag>}
                </Space>
                <br />
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 24 }}>
                  {mode.description}
                </Text>
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </div>
      
      {/* 最后测试结果 */}
      {lastTestResult && (
        <Alert
          type={lastTestResult.success ? 'success' : 'error'}
          icon={lastTestResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          message={
            lastTestResult.success
              ? `测试成功 (${lastTestResult.mode_used})`
              : `测试失败 (${lastTestResult.mode_used})`
          }
          description={
            lastTestResult.success
              ? `耗时: ${lastTestResult.elapsed_ms}ms, 大小: ${lastTestResult.xml_length} 字符`
              : lastTestResult.error
          }
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      {/* 超时设置 */}
      {showSettings && config && (
        <Card size="small" title="超时设置" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>ExecOut 超时:</Text>
              <InputNumber
                value={config.exec_out_timeout_ms}
                onChange={(value) => value && store.setExecOutTimeout(value)}
                min={1000}
                max={30000}
                step={500}
                addonAfter="ms"
                style={{ width: 150 }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>DumpPull 超时:</Text>
              <InputNumber
                value={config.dump_pull_timeout_ms}
                onChange={(value) => value && store.setDumpPullTimeout(value)}
                min={5000}
                max={60000}
                step={1000}
                addonAfter="ms"
                style={{ width: 150 }}
              />
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <Space>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => store.clearDeviceCompat()}
              >
                清除设备缓存
              </Button>
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => store.resetConfig()}
              >
                重置配置
              </Button>
            </Space>
          </Space>
        </Card>
      )}
      
      {/* 诊断日志面板 */}
      <Collapse ghost>
        <Panel
          header={
            <Space>
              <span>诊断日志</span>
              <Tag color="blue">{diagnostics.length} 条</Tag>
            </Space>
          }
          key="diagnostics"
          extra={
            <Space onClick={(e) => e.stopPropagation()}>
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={refreshDiagnostics}
              >
                刷新
              </Button>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={handleClearDiagnostics}
                disabled={diagnostics.length === 0}
              >
                清空
              </Button>
            </Space>
          }
        >
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {diagnostics.length === 0 ? (
              <Text type="secondary">暂无诊断日志</Text>
            ) : (
              diagnostics.slice().reverse().map((entry, index) => 
                renderDiagnosticEntry(entry, index)
              )
            )}
          </div>
        </Panel>
      </Collapse>
    </Card>
  );
};

export default UiDumpModePanel;
