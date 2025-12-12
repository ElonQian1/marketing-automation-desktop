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
  Tag,
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
  type AndroidAppStatus,
  type AndroidAppDiagnosis,
} from '../../application/store/uiDumpStore';
import { useAdb } from '../../application/hooks/useAdb';

const { Text } = Typography;
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
 * 5. 内置设备选择器（如果没有传入 deviceId）
 */
export const UiDumpModePanel: React.FC<UiDumpModePanelProps> = ({
  deviceId: propDeviceId,
  compact = false,
}) => {
  const store = useUiDumpStore();
  const currentMode = useCurrentDumpMode();
  const config = useDumpConfig();
  const availableModes = useAvailableModes();
  const isTestRunning = useTestRunning();
  const lastTestResult = useLastTestResult();
  const isLoading = useUiDumpLoading();
  
  // 获取设备列表
  const { devices, selectedDevice: globalSelectedDevice } = useAdb();
  
  // 使用传入的 deviceId，否则使用全局选中的设备，或者使用第一个在线设备
  const [localDeviceId, setLocalDeviceId] = useState<string | undefined>(propDeviceId);
  
  // 获取在线设备列表
  const onlineDevices = devices.filter(d => d.isOnline());
  
  // 计算实际使用的设备ID（确保类型为 string）
  const effectiveDeviceId: string | undefined = propDeviceId 
    || localDeviceId 
    || (typeof globalSelectedDevice === 'string' ? globalSelectedDevice : globalSelectedDevice?.id) 
    || undefined;
  
  // 自动选择第一个在线设备
  useEffect(() => {
    if (!effectiveDeviceId && onlineDevices.length > 0) {
      const firstOnline = onlineDevices[0];
      setLocalDeviceId(firstOnline.id);
    }
  }, [effectiveDeviceId, onlineDevices]);
  
  const [diagnostics, setDiagnostics] = useState<DiagnosticEntry[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [androidAppStatus, setAndroidAppStatus] = useState<AndroidAppStatus | null>(null);
  const [isCheckingApp, setIsCheckingApp] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<AndroidAppDiagnosis | null>(null);
  
  // 初始化
  useEffect(() => {
    store.initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!effectiveDeviceId) {
      message.warning('请先选择设备');
      return;
    }
    
    try {
      const result = await store.testMode(effectiveDeviceId, currentMode);
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
  
  // 检查 Android App 连接状态
  const handleCheckAndroidApp = async () => {
    if (!effectiveDeviceId) {
      message.warning('请先选择设备');
      return;
    }
    
    setIsCheckingApp(true);
    try {
      const status = await store.checkAndroidAppStatus(effectiveDeviceId);
      setAndroidAppStatus(status);
      if (status.connected) {
        message.success(status.message);
      } else {
        message.warning(`${status.message} - ${status.suggestion}`);
      }
    } catch (error) {
      message.error(`检查失败: ${error}`);
    } finally {
      setIsCheckingApp(false);
    }
  };
  
  // 完整诊断 Android App
  const handleDiagnoseAndroidApp = async () => {
    if (!effectiveDeviceId) {
      message.warning('请先选择设备');
      return;
    }
    
    setIsDiagnosing(true);
    setDiagnosisResult(null);
    try {
      const result = await store.diagnoseAndroidApp(effectiveDeviceId);
      setDiagnosisResult(result);
      if (result.success) {
        message.success('诊断完成：所有测试通过！');
      } else {
        message.warning('诊断完成：存在失败项');
      }
    } catch (error) {
      message.error(`诊断失败: ${error}`);
    } finally {
      setIsDiagnosing(false);
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
          disabled={!effectiveDeviceId}
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
            disabled={!effectiveDeviceId}
            onClick={handleTest}
          >
            测试当前模式
          </Button>
        </Space>
      }
    >
      {/* 设备选择器 */}
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          当前设备：
        </Text>
        {onlineDevices.length === 0 ? (
          <Alert
            type="warning"
            message="未检测到在线设备"
            description="请确保设备已连接并开启 USB 调试"
            showIcon
          />
        ) : (
          <Radio.Group
            value={effectiveDeviceId}
            onChange={(e) => setLocalDeviceId(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {onlineDevices.map(device => (
                <Radio key={device.id} value={device.id}>
                  <Space>
                    <Tag color="green">在线</Tag>
                    <span>{device.id}</span>
                    {device.model && <Text type="secondary">({device.model})</Text>}
                  </Space>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        )}
      </div>

      <Divider style={{ margin: '12px 0' }} />

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
                  {mode.mode === 'a11y' && androidAppStatus && (
                    <Tag color={androidAppStatus.connected ? 'green' : 'red'}>
                      {androidAppStatus.connected ? '已连接' : '未连接'}
                    </Tag>
                  )}
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
      
      {/* Android App 连接状态与诊断 */}
      {(currentMode === 'a11y' || currentMode === 'auto') && (
        <Card size="small" title="Android App 连接诊断" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {/* 操作按钮 */}
            <Space wrap>
              <Button
                icon={<ReloadOutlined spin={isCheckingApp} />}
                onClick={handleCheckAndroidApp}
                loading={isCheckingApp}
                disabled={!effectiveDeviceId || isDiagnosing}
              >
                快速检测
              </Button>
              <Button
                type="primary"
                icon={<ExperimentOutlined />}
                onClick={handleDiagnoseAndroidApp}
                loading={isDiagnosing}
                disabled={!effectiveDeviceId || isCheckingApp}
              >
                完整诊断
              </Button>
              {androidAppStatus && (
                <Tag 
                  color={androidAppStatus.connected ? 'success' : 'error'}
                  icon={androidAppStatus.connected ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                >
                  {androidAppStatus.message}
                </Tag>
              )}
            </Space>
            
            {/* 快速检测结果 */}
            {androidAppStatus && !androidAppStatus.connected && !diagnosisResult && (
              <Alert
                type="warning"
                message={androidAppStatus.suggestion}
                showIcon
              />
            )}
            
            {/* 完整诊断结果 */}
            {diagnosisResult && (
              <div style={{ marginTop: 8 }}>
                <Alert
                  type={diagnosisResult.success ? 'success' : 'warning'}
                  message={diagnosisResult.summary}
                  description={`总耗时: ${diagnosisResult.total_elapsed_ms}ms`}
                  showIcon
                  style={{ marginBottom: 12 }}
                />
                
                {/* 诊断步骤列表 */}
                <div 
                  className="light-theme-force"
                  style={{ 
                    background: 'var(--bg-light-base, #f8fafc)',
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <Text strong style={{ color: '#1e293b', display: 'block', marginBottom: 8 }}>
                    诊断步骤详情:
                  </Text>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {diagnosisResult.steps.map((step, index) => (
                      <div 
                        key={index}
                        style={{
                          padding: '8px 12px',
                          background: step.passed ? 'rgba(82, 196, 26, 0.1)' : 'rgba(255, 77, 79, 0.1)',
                          borderRadius: 4,
                          borderLeft: `3px solid ${step.passed ? '#52c41a' : '#ff4d4f'}`,
                        }}
                      >
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Space>
                            {step.passed ? (
                              <CheckCircleOutlined style={{ color: '#52c41a' }} />
                            ) : (
                              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                            )}
                            <Text strong style={{ color: '#1e293b' }}>{step.name}</Text>
                            <Tag color="cyan">{step.elapsed_ms}ms</Tag>
                          </Space>
                        </Space>
                        <div style={{ marginTop: 4, paddingLeft: 22 }}>
                          <Text style={{ color: '#374151', fontSize: 13 }}>{step.message}</Text>
                          {step.details && (
                            <div style={{ marginTop: 4 }}>
                              <Text 
                                type="secondary" 
                                style={{ 
                                  fontSize: 11, 
                                  fontFamily: 'monospace',
                                  wordBreak: 'break-all',
                                  color: '#6b7280',
                                }}
                              >
                                {step.details}
                              </Text>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </Space>
                </div>
              </div>
            )}
            
            <Text type="secondary" style={{ fontSize: 12 }}>
              A11y 模式需要安装并启动 Android Agent App，并授权无障碍权限
            </Text>
          </Space>
        </Card>
      )}
      
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
