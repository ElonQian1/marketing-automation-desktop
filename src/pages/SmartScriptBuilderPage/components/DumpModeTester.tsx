// src/pages/SmartScriptBuilderPage/components/DumpModeTester.tsx
// module: SmartScriptBuilderPage | layer: ui | role: dump-mode-tester
// summary: UI Dump 模式测试器 - 允许用户逐一测试各种 Dump 模式并查看性能对比

import React, { useState } from 'react';
import {
  Dropdown,
  Button,
  Space,
  Spin,
  Typography,
  Tooltip,
  Tag,
  Card,
  Divider,
  Progress,
  App,
} from 'antd';
import {
  ThunderboltOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  CloudDownloadOutlined,
  AndroidOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useUiDumpStore, type DumpMode, type DumpResult } from '../../../application/store/uiDumpStore';

interface DumpModeTesterProps {
  deviceId: string;
  compact?: boolean;
}

interface ModeTestResult {
  mode: DumpMode;
  result: DumpResult | null;
  error: string | null;
  tested: boolean;
}

const MODE_ICONS: Record<DumpMode, React.ReactNode> = {
  auto: <ThunderboltOutlined />,
  exec_out: <RocketOutlined />,
  dump_pull: <CloudDownloadOutlined />,
  a11y: <AndroidOutlined />,
};

const MODE_COLORS: Record<DumpMode, string> = {
  auto: 'blue',
  exec_out: 'green',
  dump_pull: 'orange',
  a11y: 'purple',
};

const MODE_NAMES: Record<DumpMode, string> = {
  auto: '自动模式',
  exec_out: 'ExecOut 快速',
  dump_pull: 'DumpPull 兼容',
  a11y: 'A11y App',
};

// 模式描述 - 用于 Tooltip
const _MODE_DESCRIPTIONS: Record<DumpMode, string> = {
  auto: '自动选择最优模式，失败时降级',
  exec_out: '直接输出到stdout，跳过文件IO，速度快30-40%',
  dump_pull: '传统dump+cat模式，兼容性最好',
  a11y: '通过Android App实时推送，需安装辅助App',
};
void _MODE_DESCRIPTIONS; // 预留供后续 Tooltip 使用

/**
 * UI Dump 模式测试器组件
 * 
 * 功能：
 * 1. 下拉菜单快速切换测试不同模式
 * 2. 显示各模式测试结果和耗时对比
 * 3. 推荐最优模式
 */
const DumpModeTester: React.FC<DumpModeTesterProps> = ({
  deviceId,
  compact = false,
}) => {
  const { message: messageApi } = App.useApp();
  const { 
    testMode, 
    currentMode,
    setMode,
  } = useUiDumpStore();

  const [testResults, setTestResults] = useState<Record<DumpMode, ModeTestResult>>({
    auto: { mode: 'auto', result: null, error: null, tested: false },
    exec_out: { mode: 'exec_out', result: null, error: null, tested: false },
    dump_pull: { mode: 'dump_pull', result: null, error: null, tested: false },
    a11y: { mode: 'a11y', result: null, error: null, tested: false },
  });
  
  const [currentTesting, setCurrentTesting] = useState<DumpMode | null>(null);
  const [showResults, setShowResults] = useState(false);

  // 测试单个模式
  const handleTestMode = async (mode: DumpMode) => {
    if (!deviceId) {
      messageApi.warning('请先选择设备');
      return;
    }

    setCurrentTesting(mode);
    
    try {
      console.log(`🧪 [DumpModeTester] 开始测试模式: ${mode}`);
      const result = await testMode(deviceId, mode);
      
      setTestResults(prev => ({
        ...prev,
        [mode]: {
          mode,
          result,
          error: result.success ? null : result.error || '未知错误',
          tested: true,
        },
      }));
      
      if (result.success) {
        messageApi.success(`${MODE_NAMES[mode]} 测试成功！耗时 ${result.elapsed_ms}ms`);
      } else {
        messageApi.error(`${MODE_NAMES[mode]} 测试失败: ${result.error}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setTestResults(prev => ({
        ...prev,
        [mode]: {
          mode,
          result: null,
          error: errorMsg,
          tested: true,
        },
      }));
      messageApi.error(`测试 ${MODE_NAMES[mode]} 失败: ${errorMsg}`);
    } finally {
      setCurrentTesting(null);
      setShowResults(true);
    }
  };

  // 测试所有模式
  const handleTestAll = async () => {
    if (!deviceId) {
      messageApi.warning('请先选择设备');
      return;
    }

    const modes: DumpMode[] = ['exec_out', 'dump_pull', 'a11y'];
    messageApi.info('开始测试所有模式...');
    
    for (const mode of modes) {
      await handleTestMode(mode);
      // 等待一小段时间，避免设备压力过大
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    messageApi.success('所有模式测试完成！');
  };

  // 应用选中的模式
  const handleApplyMode = async (mode: DumpMode) => {
    try {
      await setMode(mode);
      messageApi.success(`已切换到 ${MODE_NAMES[mode]}`);
    } catch {
      messageApi.error('切换模式失败');
    }
  };

  // 找到最快的成功模式
  const getFastestMode = (): DumpMode | null => {
    let fastest: { mode: DumpMode; time: number } | null = null;
    
    for (const [mode, result] of Object.entries(testResults)) {
      if (result.tested && result.result?.success) {
        const time = result.result.elapsed_ms;
        if (!fastest || time < fastest.time) {
          fastest = { mode: mode as DumpMode, time };
        }
      }
    }
    
    return fastest?.mode ?? null;
  };

  // 下拉菜单项
  const menuItems: MenuProps['items'] = [
    {
      key: 'test-header',
      label: <Typography.Text type="secondary">🧪 测试单个模式</Typography.Text>,
      disabled: true,
    },
    { type: 'divider' },
    ...(['exec_out', 'dump_pull', 'a11y'] as DumpMode[]).map(mode => ({
      key: `test-${mode}`,
      label: (
        <Space>
          {MODE_ICONS[mode]}
          <span>{MODE_NAMES[mode]}</span>
          {testResults[mode].tested && (
            testResults[mode].result?.success ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                {testResults[mode].result!.elapsed_ms}ms
              </Tag>
            ) : (
              <Tag color="error" icon={<CloseCircleOutlined />}>失败</Tag>
            )
          )}
          {currentTesting === mode && <Spin size="small" />}
        </Space>
      ),
      onClick: () => handleTestMode(mode),
      disabled: currentTesting !== null,
    })),
    { type: 'divider' },
    {
      key: 'test-all',
      label: (
        <Space>
          <ExperimentOutlined />
          <span>测试所有模式</span>
        </Space>
      ),
      onClick: handleTestAll,
      disabled: currentTesting !== null,
    },
    { type: 'divider' },
    {
      key: 'apply-header',
      label: <Typography.Text type="secondary">⚡ 应用模式</Typography.Text>,
      disabled: true,
    },
    ...(['auto', 'exec_out', 'dump_pull', 'a11y'] as DumpMode[]).map(mode => ({
      key: `apply-${mode}`,
      label: (
        <Space>
          {MODE_ICONS[mode]}
          <span>{MODE_NAMES[mode]}</span>
          {currentMode === mode && <Tag color="blue">当前</Tag>}
          {mode === getFastestMode() && mode !== 'auto' && (
            <Tag color="gold">最快</Tag>
          )}
        </Space>
      ),
      onClick: () => handleApplyMode(mode),
    })),
  ];

  // 紧凑模式：只显示下拉按钮
  if (compact) {
    return (
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <Tooltip title="测试 Dump 模式性能">
          <Button 
            icon={<ExperimentOutlined />}
            loading={currentTesting !== null}
          >
            Dump模式
          </Button>
        </Tooltip>
      </Dropdown>
    );
  }

  // 完整模式：显示下拉 + 结果卡片
  return (
    <div style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button 
            icon={<ExperimentOutlined />}
            loading={currentTesting !== null}
          >
            Dump模式测试 {currentTesting && `(${MODE_NAMES[currentTesting]})`}
          </Button>
        </Dropdown>
        
        <Space size="small">
          <Tag color={MODE_COLORS[currentMode]}>
            当前: {MODE_NAMES[currentMode]}
          </Tag>
          {getFastestMode() && getFastestMode() !== currentMode && (
            <Button 
              type="link" 
              size="small"
              onClick={() => handleApplyMode(getFastestMode()!)}
            >
              切换到最快模式
            </Button>
          )}
        </Space>
      </Space>

      {/* 测试结果展示 */}
      {showResults && (
        <Card 
          size="small" 
          style={{ marginTop: 8 }}
          title={
            <Space>
              <ClockCircleOutlined />
              <span>模式性能对比</span>
            </Space>
          }
          extra={
            <Button type="link" size="small" onClick={() => setShowResults(false)}>
              收起
            </Button>
          }
        >
          {(['exec_out', 'dump_pull', 'a11y'] as DumpMode[]).map(mode => {
            const result = testResults[mode];
            const maxTime = Math.max(
              ...Object.values(testResults)
                .filter(r => r.result?.success)
                .map(r => r.result!.elapsed_ms),
              1
            );
            
            return (
              <div key={mode} style={{ marginBottom: 8 }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    {MODE_ICONS[mode]}
                    <Typography.Text>{MODE_NAMES[mode]}</Typography.Text>
                  </Space>
                  {result.tested ? (
                    result.result?.success ? (
                      <Tag color="success">{result.result.elapsed_ms}ms</Tag>
                    ) : (
                      <Tag color="error">失败</Tag>
                    )
                  ) : (
                    <Tag>未测试</Tag>
                  )}
                </Space>
                {result.tested && result.result?.success && (
                  <Progress 
                    percent={Math.round((result.result.elapsed_ms / maxTime) * 100)}
                    size="small"
                    strokeColor={MODE_COLORS[mode]}
                    format={() => `${result.result!.elapsed_ms}ms`}
                  />
                )}
                {result.tested && !result.result?.success && (
                  <Typography.Text type="danger" style={{ fontSize: 12 }}>
                    {result.error}
                  </Typography.Text>
                )}
              </div>
            );
          })}
          
          {getFastestMode() && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <Space>
                <Typography.Text strong>推荐模式:</Typography.Text>
                <Tag color="gold" icon={<RocketOutlined />}>
                  {MODE_NAMES[getFastestMode()!]}
                </Tag>
                {getFastestMode() !== currentMode && (
                  <Button 
                    type="primary" 
                    size="small"
                    onClick={() => handleApplyMode(getFastestMode()!)}
                  >
                    立即应用
                  </Button>
                )}
              </Space>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default DumpModeTester;
