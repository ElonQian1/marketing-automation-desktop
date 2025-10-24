// src/pages/contextual-selector-demo/ContextualSelectorDemo.tsx
// module: contextual-selector | layer: pages | role: 多元素选择器演示页面
// summary: 展示和测试多元素智能选择功能的演示界面

import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Alert, Typography, Divider, Row, Col, message, Spin } from 'antd';
import { PlayCircleOutlined, BugOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import ContextualSelectorConfig, { ContextualSelectorConfig as ConfigType } from '../../components/contextual-selector/ContextualSelectorConfig';
import { invoke } from '@tauri-apps/api/tauri';
import './ContextualSelectorDemo.css';

const { Title, Paragraph, Text, Pre } = Typography;

interface TestResult {
  success: boolean;
  message: string;
  selected_button: number;
  confidence: number;
  context_info: string;
  debug_logs: string[];
}

interface MockButton {
  id: number;
  text: string;
  bounds: string;
  context: string;
  user_name?: string;
}

// 模拟的XML按钮数据（基于您提供的实际XML）
const mockButtons: MockButton[] = [
  {
    id: 1,
    text: '关注',
    bounds: '[786,1733][965,1806]',
    context: '恺恺 | 1个共同联系人',
    user_name: '恺恺'
  },
  {
    id: 2,
    text: '关注',
    bounds: '[786,1922][965,1995]',
    context: 'vv | 1个共同联系人',
    user_name: 'vv'
  },
  {
    id: 3,
    text: '关注',
    bounds: '[786,2111][965,2184]',
    context: '爱读书的椭圆圆 | 1个共同联系人',
    user_name: '爱读书的椭圆圆'
  },
  {
    id: 4,
    text: '关注',
    bounds: '[786,2300][965,2358]',
    context: '建议16岁以下别上网 | 通讯录好友',
    user_name: '建议16岁以下别上网'
  }
];

const ContextualSelectorDemo: React.FC = () => {
  const [config, setConfig] = useState<ConfigType>({
    target_text: '关注',
    context_keywords: ['恺恺'],
    selection_mode: 'BestContextMatch',
    context_search_radius: 300,
    min_confidence_threshold: 0.6,
  });

  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('demo');

  // 预设配置示例
  const presetConfigs = [
    {
      name: '关注特定用户',
      config: {
        target_text: '关注',
        context_keywords: ['恺恺'],
        selection_mode: 'BestContextMatch' as const,
        context_search_radius: 300,
        min_confidence_threshold: 0.7,
      }
    },
    {
      name: '总是选第一个',
      config: {
        target_text: '关注',
        context_keywords: [],
        selection_mode: { PositionBased: 'First' } as const,
        context_search_radius: 200,
        min_confidence_threshold: 0.5,
      }
    },
    {
      name: '智能推荐',
      config: {
        target_text: '关注',
        context_keywords: [],
        selection_mode: 'SmartRecommended' as const,
        context_search_radius: 300,
        min_confidence_threshold: 0.6,
      }
    },
    {
      name: '指定第三个',
      config: {
        target_text: '关注',
        context_keywords: [],
        selection_mode: { IndexBased: 2 } as const,
        context_search_radius: 200,
        min_confidence_threshold: 0.5,
      }
    }
  ];

  const runTest = async (testConfig: ConfigType) => {
    setIsLoading(true);
    setTestResult(null);

    try {
      // 模拟测试结果（实际项目中这里会调用真实的Tauri命令）
      const result = simulateContextualSelection(testConfig);
      
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setTestResult(result);
      
      if (result.success) {
        message.success(`成功选择第${result.selected_button}个按钮`);
      } else {
        message.error('选择失败：' + result.message);
      }
    } catch (error) {
      message.error('测试过程中发生错误：' + error);
    } finally {
      setIsLoading(false);
    }
  };

  // 模拟上下文选择逻辑
  const simulateContextualSelection = (testConfig: ConfigType): TestResult => {
    const debugLogs: string[] = [];
    debugLogs.push(`🎯 启动上下文感知选择器策略`);
    debugLogs.push(`📋 目标文本: '${testConfig.target_text}', 选择模式: ${JSON.stringify(testConfig.selection_mode)}`);
    debugLogs.push(`🔍 找到 ${mockButtons.length} 个匹配的 '${testConfig.target_text}' 按钮`);

    let selectedIndex = 0;
    let confidence = 0.5;
    let contextInfo = '';

    // 根据选择模式决定选择逻辑
    if (testConfig.selection_mode === 'BestContextMatch') {
      // 查找最匹配的上下文
      let bestScore = 0;
      let bestIndex = 0;

      mockButtons.forEach((button, index) => {
        let score = 0;
        for (const keyword of testConfig.context_keywords) {
          if (button.context.toLowerCase().includes(keyword.toLowerCase()) || 
              button.user_name?.toLowerCase().includes(keyword.toLowerCase())) {
            score += 1;
          }
        }
        
        const normalizedScore = testConfig.context_keywords.length > 0 ? 
          score / testConfig.context_keywords.length : 0.1;

        debugLogs.push(`📍 按钮 #${index + 1}: bounds=${button.bounds}, context='${button.context}', score=${normalizedScore.toFixed(2)}`);

        if (normalizedScore > bestScore) {
          bestScore = normalizedScore;
          bestIndex = index;
        }
      });

      selectedIndex = bestIndex;
      confidence = bestScore;
      contextInfo = mockButtons[selectedIndex].context;

    } else if (typeof testConfig.selection_mode === 'object') {
      if ('IndexBased' in testConfig.selection_mode) {
        selectedIndex = Math.min(testConfig.selection_mode.IndexBased, mockButtons.length - 1);
        confidence = 0.95;
        contextInfo = mockButtons[selectedIndex].context;
        debugLogs.push(`🔢 使用指定索引: ${selectedIndex}`);

      } else if ('PositionBased' in testConfig.selection_mode) {
        const position = testConfig.selection_mode.PositionBased;
        switch (position) {
          case 'First':
            selectedIndex = 0;
            break;
          case 'Last':
            selectedIndex = mockButtons.length - 1;
            break;
          case 'Middle':
            selectedIndex = Math.floor(mockButtons.length / 2);
            break;
          case 'Random':
            selectedIndex = Math.floor(Math.random() * mockButtons.length);
            break;
        }
        confidence = 0.8;
        contextInfo = mockButtons[selectedIndex].context;
        debugLogs.push(`📍 使用位置策略: ${position} -> 索引${selectedIndex}`);
      }
    } else if (testConfig.selection_mode === 'SmartRecommended') {
      // 智能推荐：通常选择第一个，但考虑上下文
      selectedIndex = 0;
      confidence = 0.75;
      contextInfo = mockButtons[selectedIndex].context;
      debugLogs.push(`🤖 智能推荐选择第1个按钮`);
    }

    const success = confidence >= testConfig.min_confidence_threshold;
    
    if (success) {
      debugLogs.push(`✅ 选择最佳候选项: 位置#${selectedIndex + 1}, 置信度=${confidence.toFixed(2)}, 上下文='${contextInfo}'`);
    } else {
      debugLogs.push(`❌ 置信度${confidence.toFixed(2)}低于阈值${testConfig.min_confidence_threshold}`);
    }

    return {
      success,
      message: success ? `成功选择第${selectedIndex + 1}个按钮` : `置信度不足`,
      selected_button: selectedIndex + 1,
      confidence: confidence,
      context_info: contextInfo,
      debug_logs: debugLogs
    };
  };

  const renderMockButtons = () => (
    <Card title="模拟界面（小红书推荐页面）" size="small">
      <div className="mock-interface">
        <div className="mock-header">
          <Text strong>你可能感兴趣的人</Text>
        </div>
        {mockButtons.map((button, index) => (
          <div 
            key={button.id} 
            className={`mock-user-card ${testResult && testResult.selected_button === index + 1 ? 'selected' : ''}`}
          >
            <div className="user-avatar">👤</div>
            <div className="user-info">
              <div className="user-name">{button.user_name}</div>
              <div className="user-desc">{button.context.split(' | ')[1]}</div>
            </div>
            <Button 
              type={testResult && testResult.selected_button === index + 1 ? 'primary' : 'default'} 
              size="small"
              className="follow-btn"
            >
              {button.text}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );

  const renderTestResult = () => {
    if (!testResult) return null;

    return (
      <Card 
        title={
          <Space>
            {testResult.success ? (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            ) : (
              <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            )}
            测试结果
          </Space>
        }
        size="small"
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card size="small" title="选择结果">
              <Space direction="vertical">
                <Text>选中按钮：第 <Text strong>{testResult.selected_button}</Text> 个</Text>
                <Text>置信度：<Text strong>{(testResult.confidence * 100).toFixed(1)}%</Text></Text>
                <Text>上下文：<Text code>{testResult.context_info}</Text></Text>
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="执行日志">
              <Pre className="debug-logs">
                {testResult.debug_logs.join('\n')}
              </Pre>
            </Card>
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div className="contextual-selector-demo">
      <div className="demo-header">
        <Title level={2}>🎯 多元素智能选择器演示</Title>
        <Paragraph>
          解决"多个相同按钮如何选择"的问题。通过分析按钮周围的上下文信息，智能选择目标按钮。
        </Paragraph>
        
        <Alert
          message="演示说明"
          description="这个演示展示了如何在有多个相同"关注"按钮的界面中，通过不同的策略选择特定的按钮。您可以调整配置参数，观察选择结果的变化。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      </div>

      <Row gutter={[24, 24]}>
        <Col span={12}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <ContextualSelectorConfig
              value={config}
              onChange={setConfig}
              onPreview={(config) => runTest(config)}
            />

            <Card title="预设配置" size="small">
              <Space wrap>
                {presetConfigs.map((preset, index) => (
                  <Button
                    key={index}
                    onClick={() => setConfig(preset.config)}
                    size="small"
                  >
                    {preset.name}
                  </Button>
                ))}
              </Space>
            </Card>
          </Space>
        </Col>

        <Col span={12}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {renderMockButtons()}
            
            <Card>
              <Space>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => runTest(config)}
                  loading={isLoading}
                  size="large"
                >
                  运行测试
                </Button>
                <Button
                  icon={<BugOutlined />}
                  onClick={() => {
                    console.log('当前配置：', config);
                    message.info('配置已输出到控制台');
                  }}
                >
                  调试信息
                </Button>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>

      {isLoading && (
        <Card style={{ marginTop: 24 }}>
          <Spin size="large" />
          <Text style={{ marginLeft: 16 }}>正在分析界面元素...</Text>
        </Card>
      )}

      {renderTestResult()}

      <Divider />

      <Card title="使用场景" className="usage-scenarios">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card size="small" title="🎯 精确匹配">
              <Text>当您知道要关注的具体用户名时，使用"上下文匹配"模式，系统会自动找到对应的关注按钮。</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="🔢 批量操作">
              <Text>需要按顺序处理时，使用"指定索引"或"相对位置"模式，确保操作的可预测性。</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="🤖 智能适配">
              <Text>不确定具体策略时，使用"智能推荐"模式，系统会综合多种因素自动选择。</Text>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ContextualSelectorDemo;