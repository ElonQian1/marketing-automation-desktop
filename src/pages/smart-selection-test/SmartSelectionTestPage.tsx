// src/pages/smart-selection-test/SmartSelectionTestPage.tsx  
// module: pages | layer: ui | role: 智能选择系统测试页面
// summary: 完整的智能选择系统测试界面，用于Phase 2真实设备验证

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Space, 
  Button, 
  Select, 
  Input, 
  Switch, 
  Divider, 
  Alert,
  Tag,
  Timeline,
  Progress,
  Descriptions,
  Modal,
  message,
  Tabs,
} from 'antd';
import { 
  PlayCircleOutlined, 
  TargetOutlined, 
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  BulbOutlined,
  AndroidOutlined,
} from '@ant-design/icons';
import type { SmartSelectionProtocol, SmartSelectionResult } from '../../types/smartSelection';
import { SmartSelectionService } from '../../services/smartSelectionService';
import type { ConnectivityTestResult, CandidatePreviewResult } from '../../services/smartSelectionService';

const { TextArea } = Input;
const { TabPane } = Tabs;

/**
 * 智能选择系统测试页面
 */
export const SmartSelectionTestPage: React.FC = () => {
  // 设备和连接状态
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [connectivityResult, setConnectivityResult] = useState<ConnectivityTestResult | null>(null);
  
  // 测试协议和结果
  const [protocol, setProtocol] = useState<SmartSelectionProtocol>(
    SmartSelectionService.createProtocol({ text: '关注', mode: 'first' })
  );
  const [executionResult, setExecutionResult] = useState<SmartSelectionResult | null>(null);
  const [candidatePreview, setCandidatePreview] = useState<CandidatePreviewResult | null>(null);
  
  // 加载状态
  const [isConnectivityTesting, setIsConnectivityTesting] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // UI状态
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('basic');

  // 添加测试日志
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  // 测试连通性
  const handleConnectivityTest = useCallback(async () => {
    if (!selectedDevice) {
      message.error('请先选择设备');
      return;
    }

    setIsConnectivityTesting(true);
    addLog('开始连通性测试...');
    
    try {
      const result = await SmartSelectionService.testConnectivity(selectedDevice);
      setConnectivityResult(result);
      
      if (result.overall_success) {
        message.success('连通性测试通过');
        addLog('✅ 连通性测试通过');
      } else {
        message.warning('连通性测试部分失败');
        addLog('⚠️ 连通性测试部分失败');
      }
    } catch (error) {
      message.error(`连通性测试失败: ${error}`);
      addLog(`❌ 连通性测试失败: ${error}`);
    } finally {
      setIsConnectivityTesting(false);
    }
  }, [selectedDevice, addLog]);

  // 预览候选元素
  const handlePreview = useCallback(async () => {
    if (!selectedDevice) {
      message.error('请先选择设备');
      return;
    }

    setIsPreviewLoading(true);
    addLog('开始预览候选元素...');
    
    try {
      const result = await SmartSelectionService.previewCandidates(selectedDevice, protocol);
      setCandidatePreview(result);
      
      if (result.total_found > 0) {
        message.success(`找到 ${result.total_found} 个候选元素`);
        addLog(`✅ 找到 ${result.total_found} 个候选元素`);
      } else {
        message.warning('未找到匹配的元素');
        addLog('⚠️ 未找到匹配的元素');
      }
    } catch (error) {
      message.error(`预览失败: ${error}`);
      addLog(`❌ 预览失败: ${error}`);
      setCandidatePreview(null);
    } finally {
      setIsPreviewLoading(false);
    }
  }, [selectedDevice, protocol, addLog]);

  // 执行智能选择
  const handleExecute = useCallback(async () => {
    if (!selectedDevice) {
      message.error('请先选择设备');
      return;
    }

    // 确认执行对话框
    Modal.confirm({
      title: '确认执行智能选择？',
      content: `将在设备 ${selectedDevice} 上执行智能选择操作，这可能会影响设备上的应用状态。`,
      onOk: async () => {
        setIsExecuting(true);
        addLog('开始执行智能选择...');
        
        try {
          const result = await SmartSelectionService.executeSmartSelection(selectedDevice, protocol);
          setExecutionResult(result);
          
          if (result.success) {
            message.success('智能选择执行成功');
            addLog(`✅ 智能选择执行成功: ${result.message}`);
          } else {
            message.error('智能选择执行失败');
            addLog(`❌ 智能选择执行失败: ${result.message}`);
          }
        } catch (error) {
          message.error(`执行失败: ${error}`);
          addLog(`❌ 执行失败: ${error}`);
          setExecutionResult(null);
        } finally {
          setIsExecuting(false);
        }
      },
    });
  }, [selectedDevice, protocol, addLog]);

  // 快速配置预设
  const applyPreset = useCallback((preset: string) => {
    let newProtocol: SmartSelectionProtocol;
    
    switch (preset) {
      case 'xiaohongshu-follow':
        newProtocol = SmartSelectionService.createBatchFollowProtocol({
          followText: '关注',
          interval: 2000,
          maxCount: 10,
        });
        addLog('应用小红书批量关注预设');
        break;
      case 'precise-user':
        newProtocol = SmartSelectionService.createPreciseMatchProtocol({
          targetText: '关注',
          minConfidence: 0.9,
        });
        addLog('应用精确用户匹配预设');
        break;
      case 'safe-random':
        newProtocol = SmartSelectionService.createProtocol({
          text: '关注',
          mode: 'random',
        });
        addLog('应用安全随机选择预设');
        break;
      default:
        return;
    }
    
    setProtocol(newProtocol);
  }, [addLog]);

  // 模拟设备连接（实际应该从ADB服务获取）
  useEffect(() => {
    // 模拟设备列表 - 在实际集成时应该从ADB服务获取
    const mockDevices = ['emulator-5554', '192.168.1.100:5555', 'LDPlayer'];
    setConnectedDevices(mockDevices);
    if (mockDevices.length > 0) {
      setSelectedDevice(mockDevices[0]);
    }
  }, []);

  return (
    <div className="light-theme-force smart-selection-test-page" style={{ padding: '24px' }}>
      <Card 
        title={
          <Space>
            <BulbOutlined style={{ color: '#1890ff' }} />
            <span>智能选择系统测试</span>
            <Tag color="blue">Phase 2</Tag>
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<SyncOutlined />}
            onClick={() => window.location.reload()}
          >
            刷新页面
          </Button>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* 基础测试 */}
          <TabPane tab="基础测试" key="basic">
            <Space direction="vertical" style={{ width: '100%' }}>
              {/* 设备连接区域 */}
              <Card size="small" title={<Space><AndroidOutlined />设备连接</Space>}>
                <Row gutter={16} align="middle">
                  <Col span={8}>
                    <Select
                      placeholder="选择测试设备"
                      value={selectedDevice}
                      onChange={setSelectedDevice}
                      style={{ width: '100%' }}
                    >
                      {connectedDevices.map(device => (
                        <Select.Option key={device} value={device}>
                          {device}
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={8}>
                    <Button
                      icon={<CheckCircleOutlined />}
                      onClick={handleConnectivityTest}
                      loading={isConnectivityTesting}
                      disabled={!selectedDevice}
                    >
                      测试连通性
                    </Button>
                  </Col>
                  <Col span={8}>
                    {connectivityResult && (
                      <Tag color={connectivityResult.overall_success ? 'green' : 'red'}>
                        {connectivityResult.overall_success ? '✅ 连接正常' : '❌ 连接异常'}
                      </Tag>
                    )}
                  </Col>
                </Row>
              </Card>

              {/* 快速配置区域 */}
              <Card size="small" title="快速配置预设">
                <Space wrap>
                  <Button onClick={() => applyPreset('xiaohongshu-follow')}>
                    小红书批量关注
                  </Button>
                  <Button onClick={() => applyPreset('precise-user')}>
                    精确用户匹配
                  </Button>
                  <Button onClick={() => applyPreset('safe-random')}>
                    安全随机选择
                  </Button>
                </Space>
              </Card>

              {/* 协议配置区域 */}
              <Card size="small" title="协议配置">
                <Row gutter={16}>
                  <Col span={12}>
                    <div>
                      <span>目标文本: </span>
                      <Input
                        value={protocol.anchor.fingerprint.text_content || ''}
                        onChange={(e) => setProtocol({
                          ...protocol,
                          anchor: {
                            ...protocol.anchor,
                            fingerprint: {
                              ...protocol.anchor.fingerprint,
                              text_content: e.target.value,
                            },
                          },
                        })}
                        placeholder="例如: 关注"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div>
                      <span>选择模式: </span>
                      <Select
                        value={protocol.selection.mode}
                        onChange={(mode) => setProtocol({
                          ...protocol,
                          selection: { ...protocol.selection, mode },
                        })}
                        style={{ width: '100%' }}
                      >
                        <Select.Option value="first">选择第一个</Select.Option>
                        <Select.Option value="last">选择最后一个</Select.Option>
                        <Select.Option value="random">随机选择</Select.Option>
                        <Select.Option value="match-original">精确匹配</Select.Option>
                        <Select.Option value="all">批量操作</Select.Option>
                      </Select>
                    </div>
                  </Col>
                </Row>
                
                <Divider />
                
                <Switch
                  checked={showAdvancedConfig}
                  onChange={setShowAdvancedConfig}
                  checkedChildren="高级配置"
                  unCheckedChildren="基础配置"
                />
                
                {showAdvancedConfig && (
                  <div style={{ marginTop: 16 }}>
                    <Row gutter={16}>
                      <Col span={24}>
                        <TextArea
                          rows={6}
                          value={JSON.stringify(protocol, null, 2)}
                          onChange={(e) => {
                            try {
                              const newProtocol = JSON.parse(e.target.value);
                              setProtocol(newProtocol);
                            } catch (error) {
                              // JSON格式错误，忽略
                            }
                          }}
                          placeholder="智能选择协议JSON配置"
                        />
                      </Col>
                    </Row>
                  </div>
                )}
              </Card>

              {/* 操作按钮区域 */}
              <Card size="small">
                <Space>
                  <Button
                    icon={<TargetOutlined />}
                    onClick={handlePreview}
                    loading={isPreviewLoading}
                    disabled={!selectedDevice}
                  >
                    预览候选元素
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={handleExecute}
                    loading={isExecuting}
                    disabled={!selectedDevice || !candidatePreview}
                  >
                    执行智能选择
                  </Button>
                </Space>
              </Card>
            </Space>
          </TabPane>

          {/* 测试结果 */}
          <TabPane tab="测试结果" key="results">
            <Row gutter={16}>
              <Col span={12}>
                {/* 候选元素预览 */}
                {candidatePreview && (
                  <Card title="候选元素预览" size="small">
                    <Descriptions size="small" column={1}>
                      <Descriptions.Item label="总计找到">
                        {candidatePreview.total_found}
                      </Descriptions.Item>
                      <Descriptions.Item label="将要选择">
                        {candidatePreview.selection_preview.would_select_count}
                      </Descriptions.Item>
                      <Descriptions.Item label="预计用时">
                        {candidatePreview.selection_preview.estimated_execution_time_ms}ms
                      </Descriptions.Item>
                    </Descriptions>
                    
                    <Divider />
                    
                    <div>
                      <h4>候选元素列表:</h4>
                      {candidatePreview.candidates.slice(0, 5).map((candidate, index) => (
                        <div key={index} style={{ marginBottom: 8 }}>
                          <Tag color={candidate.would_be_selected ? 'green' : 'default'}>
                            #{candidate.index}
                          </Tag>
                          <span>{candidate.text || candidate.resource_id || '(无文本)'}</span>
                          <span style={{ marginLeft: 8, color: '#666' }}>
                            置信度: {(candidate.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                      {candidatePreview.candidates.length > 5 && (
                        <div>... 还有 {candidatePreview.candidates.length - 5} 个元素</div>
                      )}
                    </div>
                  </Card>
                )}
              </Col>
              
              <Col span={12}>
                {/* 执行结果 */}
                {executionResult && (
                  <Card title="执行结果" size="small">
                    <Alert
                      type={executionResult.success ? 'success' : 'error'}
                      message={executionResult.message}
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    
                    <Descriptions size="small" column={1}>
                      <Descriptions.Item label="执行状态">
                        {executionResult.success ? '✅ 成功' : '❌ 失败'}
                      </Descriptions.Item>
                      <Descriptions.Item label="匹配元素">
                        {executionResult.matched_elements.total_found}
                      </Descriptions.Item>
                      <Descriptions.Item label="选择数量">
                        {executionResult.matched_elements.selected_count}
                      </Descriptions.Item>
                      {executionResult.execution_info && (
                        <>
                          <Descriptions.Item label="执行时间">
                            {executionResult.execution_info.execution_time_ms}ms
                          </Descriptions.Item>
                          <Descriptions.Item label="使用策略">
                            {executionResult.execution_info.used_strategy}
                          </Descriptions.Item>
                        </>
                      )}
                    </Descriptions>
                  </Card>
                )}
                
                {/* 连通性测试结果 */}
                {connectivityResult && (
                  <Card title="连通性测试" size="small" style={{ marginTop: 16 }}>
                    <Timeline>
                      {connectivityResult.checks.map((check, index) => (
                        <Timeline.Item
                          key={index}
                          color={check.success ? 'green' : 'red'}
                          dot={check.success ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                        >
                          <div>
                            <strong>{check.name}</strong>
                            <div style={{ color: '#666' }}>{check.message}</div>
                            <Tag size="small">{check.time_ms}ms</Tag>
                          </div>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  </Card>
                )}
              </Col>
            </Row>
          </TabPane>

          {/* 测试日志 */}
          <TabPane tab="测试日志" key="logs">
            <Card>
              <div style={{ height: 400, overflow: 'auto' }}>
                <Timeline>
                  {testLogs.map((log, index) => (
                    <Timeline.Item key={index}>
                      <code style={{ fontSize: '12px' }}>{log}</code>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
              <Divider />
              <Button onClick={() => setTestLogs([])}>清空日志</Button>
            </Card>
          </TabPane>
        </Tabs>
      </Card>
      
      <style jsx>{`
        .smart-selection-test-page .ant-card {
          margin-bottom: 16px;
        }
        
        .smart-selection-test-page code {
          background-color: #f6f8fa;
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default SmartSelectionTestPage;