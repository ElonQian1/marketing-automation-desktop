# Universal UI 智能策略系统

## 🎯 概述

Universal UI 智能策略系统是一个基于 DDD 架构的模块化策略管理系统，用于在可视化分析视图中实现元素点选、策略生成和切换功能。

## 🏗️ 架构设计

```
src/modules/universal-ui/
├─ domain/
│  └─ public/
│     └─ selector/
│        └─ StrategyContracts.ts    # 统一策略契约
├─ application/
│  ├─ ports/
│  │  └─ StrategyProvider.ts        # 策略提供方端口
│  ├─ usecases/
│  │  └─ GenerateSmartStrategyUseCase.ts  # 智能策略生成用例
│  └─ compat/
│     └─ LegacyManualAdapter.ts     # 旧手动策略适配器
├─ infrastructure/
│  └─ adapters/
│     ├─ LegacySmartProvider.ts     # 旧智能策略提供方
│     └─ HeuristicProvider.ts       # 启发式策略提供方
├─ stores/
│  └─ inspectorStore.ts             # Zustand 状态管理
├─ hooks/
│  └─ useStepStrategy.ts            # 策略管理 Hook
├─ ui/
│  ├─ StepCard.tsx                  # 步骤卡片组件
│  └─ partials/
│     └─ SmartVariantBadge.tsx      # 智能变体标签
├─ integration/
│  └─ NodeDetailIntegration.tsx     # 节点详情集成示例
├─ demo/
│  └─ StrategySystemDemo.tsx        # 系统演示页面
└─ index.ts                         # 模块门牌导出
```

## 🚀 核心功能

### 1. 统一策略契约

支持两种策略类型：
- **手动策略**: `xpath-direct`, `custom`, `strict`, `relaxed`
- **智能策略**: 6种变体 (`self-anchor`, `child-anchor`, `parent-clickable`, `region-scoped`, `neighbor-relative`, `index-fallback`)

### 2. 策略生成流程

```typescript
LegacySmartProvider → HeuristicProvider → 兜底策略
     (优先级100)          (优先级1)        (保证返回)
```

### 3. 状态管理

使用 Zustand 管理策略状态，支持：
- 手动/智能模式切换
- 策略快照保存与恢复
- 错误处理和加载状态

## 📖 使用指南

### 基本使用

```typescript
import { 
  StepCard, 
  useStepStrategy, 
  setSmartStrategyUseCase 
} from '@universal';

// 1. 初始化策略系统
const providers = [
  new LegacySmartProvider(),
  new HeuristicProvider()
];
const useCase = new GenerateSmartStrategyUseCase(providers);
setSmartStrategyUseCase(useCase);

// 2. 使用策略Hook
function MyComponent() {
  const { state, actions, utils } = useStepStrategy();
  
  // 设置元素
  const handleElementSelect = async (element: ElementDescriptor) => {
    await actions.setElement(element);
  };
  
  // 渲染策略卡片
  return (
    <StepCard 
      title="匹配策略"
      showModeSwitch={true}
      editable={true}
    />
  );
}
```

### 元素描述符格式

```typescript
const element: ElementDescriptor = {
  nodeId: 'unique-id',
  tagName: 'Button',
  text: '登录',
  xpath: '//android.widget.Button[@text="登录"]',
  cssPath: 'button[text="登录"]',
  resourceId: 'com.app:id/login_btn',
  clickable: true,
  attributes: {
    'class': 'android.widget.Button',
    'text': '登录'
  }
};
```

### 策略切换

```typescript
const { actions } = useStepStrategy();

// 切换到手动模式
actions.switchToManual();

// 返回智能模式
await actions.switchToSmart();

// 刷新智能策略
await actions.refreshSmart();

// 采用智能策略为手动策略
actions.adoptAsManual();
```

## 🔧 集成指南

### 在现有项目中集成

1. **添加依赖注入**

```typescript
// 在应用启动时初始化
import { setSmartStrategyUseCase } from '@universal';

const initializeStrategySystem = () => {
  const providers = [
    new LegacySmartProvider(),
    new HeuristicProvider()
  ];
  const useCase = new GenerateSmartStrategyUseCase(providers);
  setSmartStrategyUseCase(useCase);
};
```

2. **在节点详情面板中使用**

```typescript
import { StepCard, useStepStrategy } from '@universal';

function NodeDetailPanel({ selectedNode }) {
  const { actions } = useStepStrategy();
  
  useEffect(() => {
    if (selectedNode) {
      const element = convertNodeToElementDescriptor(selectedNode);
      actions.setElement(element);
    }
  }, [selectedNode]);
  
  return (
    <div>
      {/* 原有节点详情 */}
      <NodeDetail node={selectedNode} />
      
      {/* 新增策略卡片 */}
      <StepCard title="匹配策略" />
    </div>
  );
}
```

### 自定义策略提供方

```typescript
class CustomStrategyProvider implements StrategyProvider {
  readonly name = 'custom-provider';
  readonly priority = 50;
  
  async isAvailable(): Promise<boolean> {
    return true; // 检查可用性
  }
  
  async generate(input: { element: ElementDescriptor }): Promise<SmartStrategy | null> {
    // 实现自定义策略生成逻辑
    return {
      kind: 'smart',
      provider: 'custom',
      version: '1.0.0',
      selector: {
        css: 'custom-selector',
        variant: 'self-anchor',
        // ...
      }
    };
  }
}
```

## 🎨 UI 组件

### StepCard 属性

```typescript
interface StepCardProps {
  title?: string;                    // 卡片标题
  showModeSwitch?: boolean;          // 是否显示模式切换
  editable?: boolean;                // 是否可编辑手动策略
  className?: string;                // 自定义样式
  size?: 'small' | 'default';       // 卡片大小
  extra?: React.ReactNode;           // 额外操作按钮
}
```

### SmartVariantBadge 属性

```typescript
interface SmartVariantBadgeProps {
  strategy: SmartStrategy;           // 智能策略
  showParams?: boolean;              // 显示详细参数
  size?: 'small' | 'default';       // 标签大小
  showConfidence?: boolean;          // 显示置信度
}
```

## 🧪 测试

运行测试：

```bash
npm run test src/modules/universal-ui/tests/
```

主要测试覆盖：
- 策略生成用例
- 启发式提供方
- 旧格式适配器
- 策略变体类型
- 错误处理

## 🔍 调试

启用调试模式：

```typescript
// 在开发环境中查看详细日志
console.log('策略状态:', useStepStrategy().state);
```

演示页面访问：
```
/demo/strategy-system
```

## 📋 验收清单

- [x] 点选元素后步骤卡片可见
- [x] 手动/智能可相互切换  
- [x] 手动模式可返回启用智能策略
- [x] 智能模式可刷新、可采用为手动
- [x] XPath直接策略正确显示/编辑
- [x] 6种变体能看到标签/关键参数
- [x] domain层未引用React/axios/Tauri
- [x] index.ts只导出public契约/用例/必要hooks
- [x] 系统正常运行无明显报错

## 🚨 注意事项

1. **架构约束**: domain 层严禁依赖 UI/IO
2. **样式处理**: 浅色容器必须添加 `.light-theme-force`
3. **错误处理**: 所有Provider都失败时确保有兜底策略
4. **性能考虑**: 避免频繁的策略重新生成
5. **向后兼容**: 保持与现有旧系统的互操作性

## 🔗 相关文档

- [DDD架构指南](../../../docs/architecture/)
- [策略变体说明](../../../docs/策略变体说明.md)
- [集成示例](./integration/)
- [演示页面](./demo/)