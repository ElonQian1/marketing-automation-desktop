// src/modules/universal-ui/examples/NodeDetailIntegrationGuide.md
# Universal UI 策略系统集成指南

## 概述

本指南展示如何在现有的 `NodeDetailPanel` 组件中集成智能策略系统，实现：
- 点选元素 → 生成步骤卡片 → 策略切换 → 返回启用智能策略

## 集成步骤

### 1. 安装依赖

```typescript
// 在 NodeDetailPanel.tsx 中导入
import {
  useStepStrategy,
  useCurrentStrategy,
  useStrategyActions,
  setSmartStrategyUseCase,
  GenerateSmartStrategyUseCase,
  ElementDescriptor
} from '@universal';
```

### 2. 初始化智能策略用例

```typescript
// 在组件初始化时设置
useEffect(() => {
  // 创建智能策略用例，连接现有的 intelligent-strategy-system
  const smartUseCase = new GenerateSmartStrategyUseCase([
    // 这里连接现有的智能策略提供者
    legacySmartProvider,
    heuristicProvider
  ]);
  
  setSmartStrategyUseCase(smartUseCase);
}, []);
```

### 3. 处理元素选择

```typescript
// 当用户点击选择元素时
const handleElementClick = async (nodeData: any) => {
  // 转换为 ElementDescriptor 格式
  const element: ElementDescriptor = {
    nodeId: nodeData.nodeId,
    tagName: nodeData.tagName,
    text: nodeData.text,
    attributes: nodeData.attributes,
    xpath: nodeData.xpath,
    bounds: nodeData.bounds,
    clickable: nodeData.clickable
  };
  
  // 设置元素并自动生成智能策略
  const { setElement } = useStrategyActions();
  await setElement(element);
};
```

### 4. 渲染策略切换 UI

```typescript
const StrategySection: React.FC = () => {
  const { mode, current, isGenerating, error } = useCurrentStrategy();
  const { toSmart, toManual, refreshSmart } = useStrategyActions();
  
  return (
    <div className="strategy-section">
      {/* 策略模式切换 */}
      <div className="strategy-mode-switcher">
        <Button
          type={mode === 'smart' ? 'primary' : 'default'}
          icon={<BulbOutlined />}
          onClick={toSmart}
          loading={isGenerating}
        >
          智能策略
        </Button>
        <Button
          type={mode === 'manual' ? 'primary' : 'default'}
          icon={<EditOutlined />}
          onClick={() => toManual()}
        >
          手动策略
        </Button>
      </div>
      
      {/* 策略详情显示 */}
      {current && (
        <StrategyCard strategy={current} />
      )}
      
      {/* 错误提示 */}
      {error && (
        <Alert message={error} type="error" />
      )}
    </div>
  );
};
```

### 5. 步骤卡片集成

```typescript
// 在步骤卡片中使用策略
const StepCardWithStrategy: React.FC<{ stepData: any }> = ({ stepData }) => {
  const { current } = useCurrentStrategy();
  
  return (
    <Card className="step-card">
      <div className="step-content">
        <h4>{stepData.action}</h4>
        <p>{stepData.description}</p>
        
        {/* 策略信息显示 */}
        {current && (
          <div className="strategy-info">
            <Tag color={current.kind === 'smart' ? 'blue' : 'green'}>
              {current.kind === 'smart' ? '智能策略' : '手动策略'}
            </Tag>
            
            {current.kind === 'smart' && (
              <span>置信度: {(current.confidence * 100).toFixed(1)}%</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
```

## 完整集成示例

```typescript
// 在 NodeDetailPanel.tsx 中的完整集成
import React, { useEffect } from 'react';
import { Card, Button, Alert, Tag, Space } from 'antd';
import { BulbOutlined, EditOutlined, ToolOutlined } from '@ant-design/icons';
import {
  useCurrentStrategy,
  useStrategyActions,
  setSmartStrategyUseCase,
  GenerateSmartStrategyUseCase,
  ElementDescriptor
} from '@universal';

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({ nodeData }) => {
  const { mode, current, isGenerating, error } = useCurrentStrategy();
  const { setElement, toSmart, toManual, refreshSmart } = useStrategyActions();
  
  // 初始化智能策略系统
  useEffect(() => {
    const smartUseCase = new GenerateSmartStrategyUseCase([
      // 连接现有的智能策略提供者
    ]);
    setSmartStrategyUseCase(smartUseCase);
  }, []);
  
  // 处理元素选择
  const handleElementSelect = async () => {
    if (!nodeData) return;
    
    const element: ElementDescriptor = {
      nodeId: nodeData.nodeId,
      tagName: nodeData.tag,
      text: nodeData.text,
      attributes: nodeData.attributes,
      xpath: nodeData.xpath,
      clickable: nodeData.clickable
    };
    
    await setElement(element);
  };
  
  return (
    <div className="node-detail-panel">
      {/* 现有的节点详情内容 */}
      <Card title="元素详情">
        {/* 原有内容 */}
      </Card>
      
      {/* 新增的策略系统 */}
      <Card title="匹配策略" style={{ marginTop: 16 }}>
        <Space>
          <Button onClick={handleElementSelect}>
            生成策略
          </Button>
          
          {current && (
            <>
              <Button
                type={mode === 'smart' ? 'primary' : 'default'}
                icon={<BulbOutlined />}
                onClick={toSmart}
                loading={isGenerating}
              >
                智能
              </Button>
              <Button
                type={mode === 'manual' ? 'primary' : 'default'}
                icon={<ToolOutlined />}
                onClick={() => toManual()}
              >
                手动
              </Button>
            </>
          )}
        </Space>
        
        {current && (
          <div style={{ marginTop: 12 }}>
            <Tag color={current.kind === 'smart' ? 'blue' : 'green'}>
              {current.kind === 'smart' ? '智能策略' : '手动策略'}
            </Tag>
            
            {current.kind === 'smart' ? (
              <div>
                <p>变体: {current.selector.variant}</p>
                <p>置信度: {(current.confidence * 100).toFixed(1)}%</p>
                <p>CSS: <code>{current.selector.css}</code></p>
              </div>
            ) : (
              <div>
                <p>名称: {current.name}</p>
                <p>XPath: <code>{current.selector.xpath}</code></p>
              </div>
            )}
          </div>
        )}
        
        {error && (
          <Alert message={error} type="error" style={{ marginTop: 12 }} />
        )}
      </Card>
    </div>
  );
};
```

## 关键要点

1. **渐进式集成**：可以逐步在现有组件中添加策略功能，不影响现有功能
2. **类型安全**：所有接口都有完整的 TypeScript 类型定义
3. **状态管理**：使用 Zustand store 统一管理策略状态
4. **错误处理**：完整的错误边界和用户提示
5. **性能优化**：智能策略缓存和快照机制

## 架构兼容性

- ✅ 兼容现有的 DDD 架构模式
- ✅ 遵循模块化边界和依赖方向
- ✅ 支持现有的 intelligent-strategy-system
- ✅ 可以与现有的步骤卡片系统无缝集成