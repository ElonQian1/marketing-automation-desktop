// src/modules/universal-ui/examples/UniversalUIIntegrationExample.tsx
// module: universal-ui | layer: examples | role: integration-demo
// summary: 展示如何在现有 Universal UI 页面中集成策略系统

import React, { useEffect, useState } from 'react';
import { Card, Button, Space, Alert, Divider, Tag } from 'antd';
import { 
  BulbOutlined, 
  EditOutlined, 
  SwapOutlined, 
  CheckOutlined,
  RobotOutlined,
  ToolOutlined
} from '@ant-design/icons';

// 导入策略系统核心功能（不包含JSX组件以避免循环依赖）
import {
  ElementDescriptor,
  ManualStrategy,
  SmartStrategy,
  setSmartStrategyUseCase,
  GenerateSmartStrategyUseCase,
  LegacyManualAdapter
} from '../index-core';

// 模拟智能策略提供者
class ExampleSmartProvider {
  async generateStrategy(element: ElementDescriptor): Promise<SmartStrategy> {
    // 模拟智能策略生成延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      kind: 'smart',
      provider: 'legacy-smart',
      version: '1.0.0',
      selector: {
        variant: 'self-anchor',
        css: this.generateCSS(element),
        xpath: element.xpath || this.generateXPath(element),
        rationale: this.generateRationale(element),
        score: 0.9,
        params: {
          variant: 'self-anchor',
          anchorText: element.text,
          attrKeys: Object.keys(element.attributes || {}),
          similarity: 0.9
        }
      },
      confidence: 0.9,
      generatedAt: Date.now()
    };
  }

  private generateCSS(element: ElementDescriptor): string {
    const attrs = element.attributes || {};
    if (attrs['data-testid']) {
      return `${element.tagName}[data-testid="${attrs['data-testid']}"]`;
    }
    if (attrs.class) {
      return `${element.tagName}.${attrs.class.split(' ')[0]}`;
    }
    return element.tagName || 'div';
  }

  private generateXPath(element: ElementDescriptor): string {
    const attrs = element.attributes || {};
    if (attrs['data-testid']) {
      return `//${element.tagName}[@data-testid="${attrs['data-testid']}"]`;
    }
    if (element.text) {
      return `//${element.tagName}[contains(text(), "${element.text}")]`;
    }
    return `//${element.tagName}`;
  }

  private generateRationale(element: ElementDescriptor): string {
    const attrs = element.attributes || {};
    if (attrs['data-testid']) {
      return `基于 data-testid 属性的稳定匹配`;
    }
    if (element.text) {
      return `基于文本内容 "${element.text}" 的语义匹配`;
    }
    return `基于 ${element.tagName} 标签的结构匹配`;
  }
}

/**
 * Universal UI 策略系统集成示例组件
 * 展示如何在实际应用中使用策略切换功能
 */
export const UniversalUIIntegrationExample: React.FC = () => {
  // 状态管理
  const [selectedElement, setSelectedElement] = useState<ElementDescriptor | null>(null);
  const [currentStrategy, setCurrentStrategy] = useState<SmartStrategy | ManualStrategy | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<'smart' | 'manual'>('smart');
  const [error, setError] = useState<string | null>(null);

  // 智能策略用例
  const [smartUseCase] = useState(() => {
    const provider = new ExampleSmartProvider();
    return new GenerateSmartStrategyUseCase([{
      name: 'example-provider',
      priority: 1,
      generate: async (input) => provider.generateStrategy(input.element),
      isAvailable: async () => true
    }]);
  });

  // 初始化智能策略用例
  useEffect(() => {
    setSmartStrategyUseCase(smartUseCase);
  }, [smartUseCase]);

  // 模拟的页面元素数据
  const mockElements: ElementDescriptor[] = [
    {
      nodeId: 'contact-btn-1',
      tagName: 'button',
      text: '联系',
      attributes: {
        class: 'btn btn-primary contact-btn',
        'data-testid': 'contact-button',
        'data-user-id': '12345'
      },
      xpath: '//button[@data-testid="contact-button"]',
      bounds: '120,300,200,332',
      clickable: true
    },
    {
      nodeId: 'follow-btn-1', 
      tagName: 'button',
      text: '关注',
      attributes: {
        class: 'btn btn-success follow-btn',
        'data-action': 'follow'
      },
      xpath: '//button[@data-action="follow"]',
      bounds: '230,300,300,332',
      clickable: true
    },
    {
      nodeId: 'share-link-1',
      tagName: 'a',
      text: '分享',
      attributes: {
        class: 'share-link',
        href: '#share'
      },
      xpath: '//a[@href="#share"]',
      bounds: '320,300,370,332',
      clickable: true
    }
  ];

  // 处理元素选择
  const handleElementSelect = async (element: ElementDescriptor) => {
    setSelectedElement(element);
    setError(null);
    
    if (mode === 'smart') {
      await generateSmartStrategy(element);
    } else {
      generateManualStrategy(element);
    }
  };

  // 生成智能策略
  const generateSmartStrategy = async (element: ElementDescriptor) => {
    setIsGenerating(true);
    try {
      const strategy = await smartUseCase.run({ element });
      setCurrentStrategy(strategy);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成智能策略失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 生成手动策略
  const generateManualStrategy = (element: ElementDescriptor) => {
    const strategy = LegacyManualAdapter.createXPathDirectStrategy(
      element.xpath!,
      `手动策略 - ${element.text}`
    );
    setCurrentStrategy(strategy);
  };

  // 切换策略模式
  const switchMode = async (newMode: 'smart' | 'manual') => {
    setMode(newMode);
    setError(null);
    
    if (selectedElement) {
      if (newMode === 'smart') {
        await generateSmartStrategy(selectedElement);
      } else {
        generateManualStrategy(selectedElement);
      }
    }
  };

  // 渲染策略详情
  const renderStrategyDetails = () => {
    if (!currentStrategy) return null;

    const isSmartStrategy = currentStrategy.kind === 'smart';
    
    return (
      <Card 
        title={
          <Space>
            {isSmartStrategy ? <RobotOutlined /> : <ToolOutlined />}
            {isSmartStrategy ? '智能策略' : '手动策略'}
            <Tag color={isSmartStrategy ? 'blue' : 'green'}>
              {isSmartStrategy ? 'AI生成' : '用户控制'}
            </Tag>
          </Space>
        }
        size="small"
        style={{ marginTop: 16 }}
      >
        {isSmartStrategy ? (
          <div>
            <p><strong>变体:</strong> {currentStrategy.selector.variant}</p>
            <p><strong>置信度:</strong> {(currentStrategy.confidence! * 100).toFixed(1)}%</p>
            <p><strong>CSS选择器:</strong> <code>{currentStrategy.selector.css}</code></p>
            <p><strong>推理说明:</strong> {currentStrategy.selector.rationale}</p>
          </div>
        ) : (
          <div>
            <p><strong>策略名称:</strong> {currentStrategy.name}</p>
            <p><strong>策略类型:</strong> {currentStrategy.type}</p>
            <p><strong>XPath:</strong> <code>{currentStrategy.selector.xpath}</code></p>
            {currentStrategy.notes && (
              <p><strong>备注:</strong> {currentStrategy.notes}</p>
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Alert
        message="Universal UI 智能策略系统演示"
        description="这个示例展示了如何在实际的 Universal UI 页面中集成智能策略切换功能。点击下方的模拟元素来体验策略生成和切换。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 策略模式切换 */}
      <Card title="策略模式选择" style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type={mode === 'smart' ? 'primary' : 'default'}
            icon={<BulbOutlined />}
            onClick={() => switchMode('smart')}
            loading={isGenerating && mode === 'smart'}
          >
            智能策略模式
          </Button>
          <Button
            type={mode === 'manual' ? 'primary' : 'default'}
            icon={<EditOutlined />}
            onClick={() => switchMode('manual')}
          >
            手动策略模式
          </Button>
          {selectedElement && (
            <Button
              icon={<SwapOutlined />}
              onClick={() => switchMode(mode === 'smart' ? 'manual' : 'smart')}
              disabled={isGenerating}
            >
              切换模式
            </Button>
          )}
        </Space>
        
        {mode === 'smart' && (
          <Alert
            message="智能模式已启用"
            description="系统将自动分析元素特征并生成最优匹配策略"
            type="success"
            style={{ marginTop: 12 }}
          />
        )}
        
        {mode === 'manual' && (
          <Alert
            message="手动模式已启用"
            description="您可以完全控制元素选择策略的生成方式"
            type="warning"
            style={{ marginTop: 12 }}
          />
        )}
      </Card>

      {/* 模拟页面元素选择 */}
      <Card title="模拟页面元素（点击选择）">
        <div style={{ 
          border: '2px dashed #d9d9d9', 
          padding: '20px', 
          borderRadius: '8px',
          backgroundColor: '#fafafa'
        }}>
          <p style={{ marginBottom: 16, color: '#666' }}>
            模拟小红书用户详情页面的操作按钮：
          </p>
          
          <Space>
            {mockElements.map((element) => (
              <Button
                key={element.nodeId}
                type={selectedElement?.nodeId === element.nodeId ? 'primary' : 'default'}
                onClick={() => handleElementSelect(element)}
                icon={selectedElement?.nodeId === element.nodeId ? <CheckOutlined /> : undefined}
                disabled={isGenerating}
              >
                {element.text}
              </Button>
            ))}
          </Space>
        </div>

        {selectedElement && (
          <div style={{ marginTop: 16 }}>
            <Divider>选中元素信息</Divider>
            <div style={{ backgroundColor: '#f0f0f0', padding: '12px', borderRadius: '4px' }}>
              <p><strong>节点ID:</strong> {selectedElement.nodeId}</p>
              <p><strong>标签:</strong> {selectedElement.tagName}</p>
              <p><strong>文本:</strong> {selectedElement.text}</p>
              <p><strong>XPath:</strong> <code>{selectedElement.xpath}</code></p>
            </div>
          </div>
        )}
      </Card>

      {/* 错误提示 */}
      {error && (
        <Alert
          message="操作失败"
          description={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginTop: 16 }}
        />
      )}

      {/* 策略详情 */}
      {renderStrategyDetails()}

      {/* 使用说明 */}
      <Card title="集成说明" style={{ marginTop: 24 }}>
        <div style={{ color: '#666' }}>
          <h4>在实际应用中的集成步骤：</h4>
          <ol>
            <li>在 NodeDetailPanel 或类似组件中导入 <code>useStepStrategy</code> Hook</li>
            <li>调用 <code>setElement(selectedElement)</code> 设置选中的元素</li>
            <li>使用 <code>toSmart()</code> 或 <code>toManual()</code> 切换策略模式</li>
            <li>通过 <code>current</code> 状态获取当前生成的策略</li>
            <li>将策略应用到步骤卡片组件中显示</li>
          </ol>
          
          <h4 style={{ marginTop: 16 }}>核心优势：</h4>
          <ul>
            <li>🧠 <strong>智能策略：</strong>自动分析元素特征，生成高置信度匹配规则</li>
            <li>🛠 <strong>手动控制：</strong>用户可以完全自定义选择器和匹配逻辑</li>
            <li>🔄 <strong>无缝切换：</strong>支持在智能和手动模式间随时切换</li>
            <li>📸 <strong>状态快照：</strong>保存切换历史，避免重复计算</li>
            <li>🎯 <strong>生产就绪：</strong>完整的错误处理和类型安全</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default UniversalUIIntegrationExample;