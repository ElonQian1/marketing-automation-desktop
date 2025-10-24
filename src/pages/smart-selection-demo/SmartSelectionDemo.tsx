// src/pages/smart-selection-demo/SmartSelectionDemo.tsx
// module: pages | layer: ui | role: 智能选择演示页面
// summary: 展示智能选择功能的完整演示界面

import React, { useState, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Alert,
  Divider,
  Timeline,
  Tag,
  Statistic,
  Progress,
  message,
  Modal,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  BugOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { SmartSelectionConfig } from '../../components/smart-selection/SmartSelectionConfig';
import type { 
  SmartSelectionProtocol,
  SmartSelectionResult,
  BatchExecutionResult,
} from '../../types/smartSelection';

interface MockFollowButton {
  id: string;
  username: string;
  bounds: { left: number; top: number; right: number; bottom: number };
  followed: boolean;
}

// 模拟的关注按钮数据
const MOCK_FOLLOW_BUTTONS: MockFollowButton[] = [
  {
    id: 'user_1',
    username: '恺恺',
    bounds: { left: 786, top: 1733, right: 965, bottom: 1806 },
    followed: false,
  },
  {
    id: 'user_2', 
    username: 'vv',
    bounds: { left: 786, top: 1922, right: 965, bottom: 1995 },
    followed: false,
  },
  {
    id: 'user_3',
    username: '爱读书的椭圆圆',
    bounds: { left: 786, top: 2111, right: 965, bottom: 2184 },
    followed: false,
  },
  {
    id: 'user_4',
    username: '建议16岁以下别上网',
    bounds: { left: 786, top: 2300, right: 965, bottom: 2358 },
    followed: false,
  },
];

export const SmartSelectionDemo: React.FC = () => {
  const [config, setConfig] = useState<Partial<SmartSelectionProtocol>>({
    selection: {
      mode: 'match-original',
      order: 'visual-yx',
    },
  });
  
  const [mockButtons, setMockButtons] = useState<MockFollowButton[]>(MOCK_FOLLOW_BUTTONS);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<SmartSelectionResult | null>(null);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>('恺恺');

  // 模拟智能选择执行
  const simulateSmartSelection = useCallback(async (testConfig: SmartSelectionProtocol) => {
    setIsExecuting(true);
    setExecutionLogs([]);
    setExecutionResult(null);

    const logs: string[] = [];
    
    try {
      logs.push('🎯 开始智能选择执行...');
      logs.push(`📋 配置: 模式=${testConfig.selection.mode}, 目标="${selectedTarget}"`);
      
      // 模拟查找候选元素
      await new Promise(resolve => setTimeout(resolve, 800));
      logs.push(`🔍 找到 ${mockButtons.length} 个候选关注按钮`);
      setExecutionLogs([...logs]);

      // 根据选择模式执行不同逻辑
      let selectedButtons: MockFollowButton[] = [];
      
      switch (testConfig.selection.mode) {
        case 'match-original':
          const targetButton = mockButtons.find(btn => btn.username === selectedTarget);
          if (targetButton) {
            selectedButtons = [targetButton];
            logs.push(`🎯 精确匹配: 找到目标用户"${selectedTarget}"`);
          } else {
            logs.push(`❌ 未找到目标用户"${selectedTarget}"`);
          }
          break;
          
        case 'first':
          selectedButtons = [mockButtons[0]];
          logs.push(`1️⃣ 选择第一个: "${mockButtons[0].username}"`);
          break;
          
        case 'last':
          selectedButtons = [mockButtons[mockButtons.length - 1]];
          logs.push(`🔚 选择最后一个: "${mockButtons[mockButtons.length - 1].username}"`);
          break;
          
        case 'random':
          const randomIndex = Math.floor(Math.random() * mockButtons.length);
          selectedButtons = [mockButtons[randomIndex]];
          logs.push(`🎲 随机选择: "${mockButtons[randomIndex].username}" (索引: ${randomIndex})`);
          break;
          
        case 'all':
          selectedButtons = [...mockButtons];
          logs.push(`🔄 批量模式: 选择所有 ${mockButtons.length} 个按钮`);
          break;
      }

      setExecutionLogs([...logs]);
      await new Promise(resolve => setTimeout(resolve, 600));

      // 模拟执行点击
      if (selectedButtons.length > 0) {
        const batchInterval = testConfig.selection.batch_config?.interval_ms || 2000;
        
        for (let i = 0; i < selectedButtons.length; i++) {
          const button = selectedButtons[i];
          const clickLogs = [...logs];
          
          if (testConfig.selection.mode === 'all') {
            clickLogs.push(`👆 执行点击 ${i + 1}/${selectedButtons.length}: "${button.username}"`);
          } else {
            clickLogs.push(`👆 执行点击: "${button.username}"`);
          }
          
          setExecutionLogs([...clickLogs]);
          
          // 模拟点击延迟
          await new Promise(resolve => setTimeout(resolve, 400));
          
          // 更新按钮状态
          setMockButtons(prev => prev.map(btn => 
            btn.id === button.id ? { ...btn, followed: true } : btn
          ));
          
          clickLogs.push(`✅ "${button.username}" 已关注`);
          setExecutionLogs([...clickLogs]);
          
          // 批量模式的间隔等待
          if (testConfig.selection.mode === 'all' && i < selectedButtons.length - 1) {
            clickLogs.push(`⏱️ 等待 ${batchInterval}ms...`);
            setExecutionLogs([...clickLogs]);
            await new Promise(resolve => setTimeout(resolve, Math.min(batchInterval, 1000))); // 演示时缩短间隔
          }
        }

        logs.push(`🎉 执行完成! 成功关注 ${selectedButtons.length} 个用户`);
        
        // 构建结果对象
        const result: SmartSelectionResult = {
          success: true,
          message: `成功执行 ${selectedButtons.length} 次点击`,
          matched_elements: {
            total_found: mockButtons.length,
            filtered_count: mockButtons.length,
            selected_count: selectedButtons.length,
            confidence_scores: selectedButtons.map(() => 0.95),
          },
          execution_info: {
            used_strategy: 'RegionTextToParent',
            fallback_used: false,
            execution_time_ms: selectedButtons.length * (batchInterval || 1000),
            click_coordinates: selectedButtons.map(btn => ({
              x: (btn.bounds.left + btn.bounds.right) / 2,
              y: (btn.bounds.top + btn.bounds.bottom) / 2,
            })),
          },
          debug_info: {
            candidate_analysis: logs,
            strategy_attempts: [`使用${testConfig.selection.mode}策略`],
            error_details: undefined,
          },
        };
        
        setExecutionResult(result);
        message.success('智能选择执行成功!');
        
      } else {
        logs.push(`❌ 未找到可执行的目标`);
        
        const result: SmartSelectionResult = {
          success: false,
          message: '未找到匹配的元素',
          matched_elements: {
            total_found: mockButtons.length,
            filtered_count: 0,
            selected_count: 0,
            confidence_scores: [],
          },
          execution_info: undefined,
          debug_info: {
            candidate_analysis: logs,
            strategy_attempts: [`尝试${testConfig.selection.mode}策略`],
            error_details: '无匹配元素',
          },
        };
        
        setExecutionResult(result);
        message.error('未找到匹配的元素');
      }

      setExecutionLogs([...logs]);
      
    } catch (error) {
      logs.push(`💥 执行失败: ${error}`);
      setExecutionLogs([...logs]);
      message.error('执行失败');
    } finally {
      setIsExecuting(false);
    }
  }, [mockButtons, selectedTarget]);

  const handleReset = () => {
    setMockButtons(MOCK_FOLLOW_BUTTONS);
    setExecutionResult(null);
    setExecutionLogs([]);
    message.info('演示环境已重置');
  };

  const handleTargetChange = (username: string) => {
    setSelectedTarget(username);
  };

  return (
    <div className="smart-selection-demo" style={{ padding: '24px' }}>
      <Card title="🎯 智能选择系统演示" size="default">
        <Alert
          message="多元素智能选择演示"
          description="这个演示展示了如何处理多个相同的关注按钮选择问题。您可以配置不同的选择策略并观察执行效果。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Row gutter={[24, 24]}>
          {/* 左侧：配置面板 */}
          <Col xs={24} lg={12}>
            <SmartSelectionConfig
              value={config}
              onChange={setConfig}
              onTest={simulateSmartSelection}
              showPreview={true}
            />
            
            {config.selection?.mode === 'match-original' && (
              <Card title="🎯 目标用户选择" size="small" style={{ marginTop: 16 }}>
                <Space wrap>
                  {mockButtons.map(button => (
                    <Tag.CheckableTag
                      key={button.id}
                      checked={selectedTarget === button.username}
                      onChange={() => handleTargetChange(button.username)}
                    >
                      {button.username}
                    </Tag.CheckableTag>
                  ))}
                </Space>
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  选择要精确匹配的目标用户
                </div>
              </Card>
            )}
          </Col>

          {/* 右侧：模拟界面和结果 */}
          <Col xs={24} lg={12}>
            {/* 模拟小红书界面 */}
            <Card title="📱 模拟小红书界面" size="small" style={{ marginBottom: 16 }}>
              <div 
                style={{ 
                  position: 'relative',
                  height: '400px',
                  backgroundColor: '#f0f0f0',
                  border: '2px solid #d9d9d9',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                {/* 模拟手机屏幕 */}
                <div style={{ padding: '16px', height: '100%' }}>
                  <div style={{ textAlign: 'center', marginBottom: '16px', color: '#666' }}>
                    小红书推荐页面
                  </div>
                  
                  {mockButtons.map((button, index) => (
                    <div
                      key={button.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        marginBottom: '8px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: executionResult?.execution_info?.click_coordinates?.some(coord => 
                          Math.abs(coord.x - (button.bounds.left + button.bounds.right) / 2) < 10
                        ) ? '2px solid #52c41a' : '1px solid #e8e8e8',
                        boxShadow: button.username === selectedTarget && config.selection?.mode === 'match-original' 
                          ? '0 0 8px rgba(24, 144, 255, 0.4)' : 'none',
                      }}
                    >
                      <Space>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          backgroundColor: '#1890ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '12px',
                        }}>
                          {button.username.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{button.username}</div>
                          <div style={{ fontSize: '12px', color: '#999' }}>推荐关注</div>
                        </div>
                      </Space>
                      
                      <Button
                        type={button.followed ? 'default' : 'primary'}
                        size="small"
                        icon={button.followed ? <CheckCircleOutlined /> : undefined}
                        style={{
                          minWidth: '64px',
                          backgroundColor: button.followed ? '#f0f0f0' : undefined,
                          color: button.followed ? '#666' : undefined,
                          border: button.followed ? '1px solid #d9d9d9' : undefined,
                        }}
                      >
                        {button.followed ? '已关注' : '关注'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* 执行控制 */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  loading={isExecuting}
                  onClick={() => simulateSmartSelection(config as SmartSelectionProtocol)}
                  disabled={!config.selection}
                >
                  {isExecuting ? '执行中...' : '开始演示'}
                </Button>
                
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  disabled={isExecuting}
                >
                  重置演示
                </Button>
                
                <Button
                  icon={<BugOutlined />}
                  onClick={() => {
                    Modal.info({
                      title: '调试信息',
                      width: 800,
                      content: (
                        <div>
                          <h4>当前配置:</h4>
                          <pre style={{ backgroundColor: '#f6f8fa', padding: '12px', borderRadius: '4px' }}>
                            {JSON.stringify(config, null, 2)}
                          </pre>
                          
                          <h4>模拟数据:</h4>
                          <pre style={{ backgroundColor: '#f6f8fa', padding: '12px', borderRadius: '4px' }}>
                            {JSON.stringify(mockButtons, null, 2)}
                          </pre>
                        </div>
                      ),
                    });
                  }}
                >
                  调试信息
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* 执行结果面板 */}
        <Row gutter={[24, 24]}>
          {/* 实时日志 */}
          <Col xs={24} lg={12}>
            <Card title="📋 执行日志" size="small">
              <div style={{ height: '300px', overflow: 'auto' }}>
                {executionLogs.length > 0 ? (
                  <Timeline
                    items={executionLogs.map((log, index) => ({
                      children: <span style={{ fontSize: '13px' }}>{log}</span>,
                      color: log.includes('✅') ? 'green' : 
                             log.includes('❌') || log.includes('💥') ? 'red' :
                             log.includes('🎯') ? 'blue' : 'gray',
                    }))}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                    点击"开始演示"查看执行日志
                  </div>
                )}
              </div>
            </Card>
          </Col>

          {/* 结果统计 */}
          <Col xs={24} lg={12}>
            <Card title="📊 执行结果" size="small">
              {executionResult ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="执行状态"
                        value={executionResult.success ? '成功' : '失败'}
                        valueStyle={{ color: executionResult.success ? '#3f8600' : '#cf1322' }}
                        prefix={executionResult.success ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="选择数量"
                        value={executionResult.matched_elements.selected_count}
                        suffix={`/ ${executionResult.matched_elements.total_found}`}
                      />
                    </Col>
                  </Row>
                  
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="平均置信度"
                        value={executionResult.matched_elements.confidence_scores.length > 0 
                          ? (executionResult.matched_elements.confidence_scores.reduce((a, b) => a + b, 0) / 
                             executionResult.matched_elements.confidence_scores.length * 100).toFixed(1)
                          : 0}
                        suffix="%"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="执行时间"
                        value={executionResult.execution_info?.execution_time_ms || 0}
                        suffix="ms"
                      />
                    </Col>
                  </Row>

                  {executionResult.matched_elements.confidence_scores.length > 0 && (
                    <div>
                      <div style={{ marginBottom: 8 }}>置信度分布:</div>
                      <Progress
                        percent={executionResult.matched_elements.confidence_scores.reduce((a, b) => a + b, 0) / 
                                executionResult.matched_elements.confidence_scores.length * 100}
                        status={executionResult.success ? 'success' : 'exception'}
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': '#87d068',
                        }}
                      />
                    </div>
                  )}
                </Space>
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                  执行演示后查看结果统计
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};