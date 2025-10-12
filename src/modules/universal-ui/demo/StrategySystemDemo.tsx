// src/modules/universal-ui/demo/StrategySystemDemo.tsx
// module: universal-ui | layer: ui | role: demo
// summary: 策略系统演示页面，展示完整的点选→生成步骤卡片→策略切换流程

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Alert, 
  Row, 
  Col,
  Divider,
  Tag
} from 'antd';
import { 
  ThunderboltOutlined,
  EditOutlined,
  NodeIndexOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import {
  StepCard,
  setSmartStrategyUseCase,
  useStepStrategy,
  type ElementDescriptor
} from '../index';
import { GenerateSmartStrategyUseCase } from '../application/usecases/GenerateSmartStrategyUseCase';
import { LegacySmartProvider } from '../infrastructure/adapters/LegacySmartProvider';
import { HeuristicProvider } from '../infrastructure/adapters/HeuristicProvider';

const { Title, Paragraph, Text } = Typography;

/**
 * 模拟元素数据
 */
const MOCK_ELEMENTS: ElementDescriptor[] = [
  {
    nodeId: 'login_button',
    tagName: 'Button',
    text: '登录',
    xpath: '//android.widget.Button[@text="登录"]',
    cssPath: 'button[text="登录"]',
    resourceId: 'com.app:id/login_btn',
    clickable: true,
    bounds: '[100,200][300,250]',
    attributes: {
      'class': 'android.widget.Button',
      'text': '登录',
      'clickable': 'true'
    }
  },
  {
    nodeId: 'search_input',
    tagName: 'EditText',
    text: '',
    xpath: '//android.widget.EditText[@resource-id="search_input"]',
    cssPath: 'input[id="search_input"]',
    resourceId: 'com.app:id/search_input',
    contentDesc: '搜索输入框',
    clickable: true,
    bounds: '[50,100][350,140]',
    attributes: {
      'class': 'android.widget.EditText',
      'hint': '请输入搜索内容',
      'clickable': 'true'
    }
  },
  {
    nodeId: 'menu_item',
    tagName: 'TextView',
    text: '设置',
    xpath: '//android.widget.TextView[contains(@text,"设置")]',
    cssPath: 'div.menu-item:nth-child(3)',
    nthChild: 3,
    clickable: false,
    bounds: '[200,300][280,340]',
    attributes: {
      'class': 'android.widget.TextView',
      'text': '设置'
    }
  }
];

/**
 * 策略系统演示组件
 */
export const StrategySystemDemo: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ElementDescriptor | null>(null);
  const [demoStep, setDemoStep] = useState<'select' | 'generated' | 'switched'>('select');
  const { state, utils, actions } = useStepStrategy();

  // 初始化策略系统
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        console.log('🚀 初始化演示策略系统...');
        
        // 创建策略提供方
        const providers = [
          new LegacySmartProvider(),
          new HeuristicProvider()
        ];
        
        // 创建并注入用例
        const useCase = new GenerateSmartStrategyUseCase(providers);
        setSmartStrategyUseCase(useCase);
        
        setIsInitialized(true);
        console.log('✅ 演示系统初始化完成');
      } catch (error) {
        console.error('❌ 演示系统初始化失败:', error);
      }
    };

    initializeSystem();
  }, []);

  // 处理元素选择
  const handleElementSelect = async (element: ElementDescriptor) => {
    setSelectedElement(element);
    setDemoStep('generated');
    
    try {
      await actions.setElement(element);
      console.log('✅ 元素设置成功，策略已生成');
    } catch (error) {
      console.error('❌ 设置元素失败:', error);
    }
  };

  // 处理策略切换演示
  const handleStrategySwitch = async () => {
    if (state.mode === 'smart') {
      actions.switchToManual();
      setDemoStep('switched');
    } else {
      await actions.switchToSmart();
      setDemoStep('switched');
    }
  };

  // 重置演示
  const handleReset = () => {
    actions.clear();
    setSelectedElement(null);
    setDemoStep('select');
  };

  if (!isInitialized) {
    return (
      <Card loading title="初始化策略系统..." />
    );
  }

  return (
    <div className="light-theme-force" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>
        <ThunderboltOutlined /> Universal UI 智能策略系统演示
      </Title>
      
      <Paragraph>
        本演示展示了完整的 <Text strong>点选元素 → 生成步骤卡片 → 策略切换</Text> 流程。
        系统整合了现有的手动策略（如 XPath直接）和智能策略（6种变体）。
      </Paragraph>

      <Alert
        message="演示流程"
        description="1. 选择元素 → 2. 查看生成的策略 → 3. 尝试切换策略模式 → 4. 体验返回智能策略功能"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[24, 24]}>
        {/* 左侧：元素选择区域 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <NodeIndexOutlined />
                步骤1: 选择元素
                {demoStep !== 'select' && <Tag color="green">已完成</Tag>}
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">
                在实际应用中，这些元素来自可视化分析视图的点选操作
              </Text>
              
              {MOCK_ELEMENTS.map((element, index) => (
                <Card 
                  key={element.nodeId}
                  size="small"
                  hoverable
                  onClick={() => handleElementSelect(element)}
                  style={{ 
                    cursor: 'pointer',
                    border: selectedElement?.nodeId === element.nodeId ? '2px solid #1890ff' : undefined
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>{element.tagName}</Text>
                      {element.text && <Tag>{element.text}</Tag>}
                      {element.contentDesc && <Tag color="blue">{element.contentDesc}</Tag>}
                    </div>
                    <Text code style={{ fontSize: 11 }}>
                      {element.xpath}
                    </Text>
                  </Space>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>

        {/* 右侧：策略卡片区域 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <EditOutlined />
                步骤2-4: 策略展示与切换
                {demoStep === 'switched' && <Tag color="green">已完成</Tag>}
              </Space>
            }
          >
            {!selectedElement ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 0',
                color: 'var(--text-3, #94a3b8)'
              }}>
                <NodeIndexOutlined style={{ fontSize: 32, marginBottom: 16 }} />
                <div>请先在左侧选择一个元素</div>
              </div>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {/* 策略卡片 */}
                <StepCard
                  title="元素匹配策略"
                  showModeSwitch={true}
                  editable={true}
                  size="default"
                />
                
                <Divider />
                
                {/* 演示操作按钮 */}
                <Space wrap>
                  <Button
                    type="primary"
                    icon={state.mode === 'smart' ? <EditOutlined /> : <ThunderboltOutlined />}
                    onClick={handleStrategySwitch}
                    disabled={!utils.canSwitchMode}
                  >
                    {state.mode === 'smart' ? '切换到手动' : '返回智能策略'}
                  </Button>
                  
                  <Button onClick={handleReset}>
                    重置演示
                  </Button>
                  
                  {state.mode === 'smart' && (
                    <Button
                      icon={<CheckCircleOutlined />}
                      onClick={actions.adoptAsManual}
                    >
                      采用为手动
                    </Button>
                  )}
                </Space>
                
                {/* 状态展示 */}
                <Card size="small" title="当前状态">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>选中元素：</Text>
                      <Text code>{selectedElement.nodeId}</Text>
                    </div>
                    <div>
                      <Text strong>策略模式：</Text>
                      <Tag color={state.mode === 'smart' ? 'blue' : 'green'}>
                        {state.mode === 'smart' ? '智能策略' : '手动策略'}
                      </Tag>
                    </div>
                    {state.current && (
                      <div>
                        <Text strong>当前策略：</Text>
                        <Text code>
                          {state.current.kind === 'smart' 
                            ? state.current.selector.variant 
                            : (state.current as any).type}
                        </Text>
                      </div>
                    )}
                    <div>
                      <Text strong>演示步骤：</Text>
                      <Tag color={
                        demoStep === 'select' ? 'orange' :
                        demoStep === 'generated' ? 'blue' : 'green'
                      }>
                        {
                          demoStep === 'select' ? '等待选择元素' :
                          demoStep === 'generated' ? '策略已生成' : '已体验切换'
                        }
                      </Tag>
                    </div>
                  </Space>
                </Card>
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      {/* 底部说明 */}
      <Card style={{ marginTop: 24 }}>
        <Title level={4}>系统特性</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Text strong>手动策略</Text>
              <br />
              <Text type="secondary">XPath直接、自定义匹配等传统策略</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Text strong>智能策略</Text>
              <br />
              <Text type="secondary">6种变体：自我锚点、子锚点、父可点击等</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Text strong>无缝切换</Text>
              <br />
              <Text type="secondary">支持策略模式间的快照保存与切换</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Text strong>兜底机制</Text>
              <br />
              <Text type="secondary">确保在任何情况下都能生成可用策略</Text>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default StrategySystemDemo;