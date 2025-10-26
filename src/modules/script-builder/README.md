# Script Builder Module (智能脚本构建器)

> **模块前缀**: `script-` / `Script`  
> **别名路径**: `@script`  
> **核心职责**: 可视化脚本构建系统，提供拖拽式自动化脚本编排能力

---

## 📁 目录结构

```
src/modules/script-builder/
├── components/           # UI 组件
│   ├── DraggableStepCard.tsx
│   ├── StepCardCanvas.tsx
│   └── StepToolbar.tsx
└── index.ts             # 模块门牌导出
```

---

## 🎯 核心功能

### 1. 可视化编排
- **拖拽式界面**: 直观的拖拽式脚本编辑器
- **实时预览**: 实时查看脚本执行效果
- **步骤管理**: 灵活的步骤增删改查

### 2. 智能步骤卡片
- **多类型支持**: 点击、输入、导航、循环等多种步骤
- **参数配置**: 可视化参数配置界面
- **验证提示**: 实时参数验证和错误提示

### 3. 脚本执行
- **单步执行**: 支持单步调试
- **批量执行**: 支持批量运行脚本
- **执行监控**: 实时监控执行状态

---

## 📦 对外导出

```typescript
// 导入组件
import { 
  DraggableStepCard,
  StepCardCanvas,
  StepToolbar
} from '@script';

// 导入类型
import type {
  ScriptStep,
  StepType,
  ExecutionContext
} from '@script';
```

---

## 🚀 使用示例

### 1. 创建脚本画布

```typescript
import { StepCardCanvas } from '@script';

function ScriptBuilder() {
  const [steps, setSteps] = useState<ScriptStep[]>([]);

  return (
    <StepCardCanvas
      steps={steps}
      onStepsChange={setSteps}
      onExecute={handleExecute}
    />
  );
}
```

### 2. 添加步骤卡片

```typescript
import { DraggableStepCard } from '@script';

const newStep: ScriptStep = {
  id: generateId(),
  type: 'tap',
  config: {
    selector: '//button[@text="提交"]',
    waitTime: 1000
  }
};
```

### 3. 执行脚本

```typescript
import { executeScript } from '@script';

async function runScript(steps: ScriptStep[]) {
  const result = await executeScript({
    steps,
    deviceId: selectedDevice,
    options: {
      stopOnError: true,
      timeout: 30000
    }
  });
  
  console.log('执行结果:', result);
}
```

---

## 🎨 组件说明

### DraggableStepCard
步骤卡片组件，支持拖拽排序。

**Props**:
```typescript
interface DraggableStepCardProps {
  step: ScriptStep;
  index: number;
  onEdit: (step: ScriptStep) => void;
  onDelete: (stepId: string) => void;
  onMove: (from: number, to: number) => void;
}
```

### StepCardCanvas
脚本画布组件，管理所有步骤卡片。

**Props**:
```typescript
interface StepCardCanvasProps {
  steps: ScriptStep[];
  onStepsChange: (steps: ScriptStep[]) => void;
  onExecute: (steps: ScriptStep[]) => Promise<void>;
  readOnly?: boolean;
}
```

### StepToolbar
工具栏组件，提供步骤添加和操作按钮。

**Props**:
```typescript
interface StepToolbarProps {
  onAddStep: (type: StepType) => void;
  onSave: () => void;
  onLoad: () => void;
  disabled?: boolean;
}
```

---

## 🔧 步骤类型

### 基础操作
- **tap**: 点击元素
- **input**: 输入文本
- **swipe**: 滑动操作
- **wait**: 等待时间

### 导航操作
- **navigate**: 页面导航
- **back**: 返回上一页
- **home**: 返回主页

### 循环控制
- **loop**: 循环执行
- **condition**: 条件判断
- **break**: 跳出循环

### 高级操作
- **screenshot**: 截图
- **extract**: 数据提取
- **assert**: 断言验证

---

## 🏗️ 架构设计

### 组件层次
```
ScriptBuilderPage
  ├── StepToolbar (工具栏)
  ├── StepCardCanvas (画布)
  │   ├── DraggableStepCard (步骤1)
  │   ├── DraggableStepCard (步骤2)
  │   └── DraggableStepCard (步骤N)
  └── ExecutionMonitor (执行监控)
```

### 数据流
```
用户操作 → Canvas → 更新State → 重新渲染
                      ↓
                执行引擎 → 后端执行 → 结果反馈
```

---

## 💡 最佳实践

### 1. 步骤命名
```typescript
// ✅ 推荐
const step = {
  id: 'step_login_submit',
  name: '点击登录按钮',
  type: 'tap'
};

// ❌ 不推荐
const step = {
  id: '1',
  name: '步骤1',
  type: 'tap'
};
```

### 2. 错误处理
```typescript
// 添加错误处理步骤
const errorHandler = {
  type: 'error-handler',
  config: {
    onError: 'continue', // 或 'stop', 'retry'
    maxRetries: 3,
    fallbackSteps: []
  }
};
```

### 3. 参数验证
```typescript
// 在执行前验证参数
function validateStep(step: ScriptStep): boolean {
  if (step.type === 'tap' && !step.config.selector) {
    throw new Error('点击步骤必须指定选择器');
  }
  return true;
}
```

---

## 🧪 测试

```bash
# 运行组件测试
npm test script-builder

# 测试脚本执行
npm test script-execution

# E2E 测试
npm run test:e2e -- script-builder
```

---

## 📊 性能优化

### 虚拟滚动
对于大量步骤，使用虚拟滚动优化渲染性能：

```typescript
import { VirtualList } from '@/components/virtual-list';

<VirtualList
  items={steps}
  itemHeight={100}
  renderItem={(step) => <DraggableStepCard step={step} />}
/>
```

### 防抖优化
对步骤配置变更进行防抖处理：

```typescript
const debouncedUpdate = useMemo(
  () => debounce(updateStep, 300),
  []
);
```

---

## 🔒 安全考虑

### 敏感信息
- 密码输入使用加密存储
- 不在日志中输出敏感参数
- 执行前进行权限校验

### 脚本验证
- 执行前验证脚本完整性
- 限制危险操作
- 记录执行审计日志

---

## 📚 相关文档

- [脚本语法规范](../../../docs/script-syntax.md)
- [步骤类型文档](../../../docs/step-types.md)
- [执行引擎说明](../../../docs/execution-engine.md)

---

## 🤝 贡献

### 添加新步骤类型
1. 在 `types/step-types.ts` 定义类型
2. 创建对应的配置组件
3. 实现执行逻辑
4. 添加单元测试
5. 更新文档

### 代码规范
- 组件使用 `Script` 前缀
- 遵循 React Hooks 规范
- 保持组件职责单一

---

**最后更新**: 2025-10-26  
**维护者**: @团队  
**版本**: 1.5.0
