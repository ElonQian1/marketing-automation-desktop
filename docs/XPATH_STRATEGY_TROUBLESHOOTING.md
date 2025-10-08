# XPath 策略故障排除指南

## 📋 快速诊断

当你在实现或使用 "使用[1]索引" 和 "返回所有同类按钮" 功能时遇到问题，按以下步骤排查：

## 🔍 问题1：步骤卡片显示错误的策略标签

### 现象
- 期望看到：`匹配: XPath[1]` 或 `匹配: XPath全部`
- 实际看到：`匹配: 标准` 或其他错误策略

### 排查步骤

#### 1. 检查步骤参数数据结构
```typescript
// 在浏览器开发者工具中检查步骤对象
console.log('步骤参数:', step.parameters);
console.log('匹配配置:', step.parameters?.matching);
console.log('策略值:', step.parameters?.matching?.strategy);
```

期望的数据结构：
```javascript
{
  parameters: {
    matching: {
      strategy: 'xpath-first-index',  // 或 'xpath-all-elements'
      fields: [...],
      values: {...}
    }
  }
}
```

#### 2. 检查策略标签配置
文件：`src/components/step-card/MatchingStrategyTag.tsx`

确认 `STRATEGY_META` 包含正确配置：
```typescript
const STRATEGY_META = {
  'xpath-first-index': { color: 'lime', label: 'XPath[1]', tip: '...' },
  'xpath-all-elements': { color: 'volcano', label: 'XPath全部', tip: '...' },
  // ...
};
```

#### 3. 检查策略值传递
文件：`src/components/DraggableStepCard/components/StrategyControls.tsx`

确认策略值正确传递给 `MatchingStrategyTag`：
```typescript
<MatchingStrategyTag strategy={step.parameters?.matching?.strategy} small />
```

## 🔍 问题2：策略选择器中没有 XPath 策略选项

### 现象
- 点击步骤卡片的"策略"按钮
- 在弹出的策略选择器中找不到 "XPath[1]索引" 或 "XPath全部元素"

### 排查步骤

#### 1. 检查策略列表配置
文件：`src/components/universal-ui/views/grid-view/panels/node-detail/MatchingStrategySelector.tsx`

确认 `STRATEGY_LIST` 包含 XPath 策略：
```typescript
const STRATEGY_LIST = [
  { key: 'xpath-first-index', label: 'XPath[1]索引', tip: '...' },
  { key: 'xpath-all-elements', label: 'XPath全部元素', tip: '...' },
  // ...
];
```

#### 2. 检查策略选择器渲染
在浏览器开发者工具中检查：
```html
<!-- 应该能找到这些按钮 -->
<button>XPath[1]索引</button>
<button>XPath全部元素</button>
```

#### 3. 检查类型定义
文件：`src/components/universal-ui/views/grid-view/panels/node-detail/types.ts`

确认 `MatchStrategy` 类型包含 XPath 策略：
```typescript
export type MatchStrategy = 
  | 'absolute' | 'strict' | 'relaxed' | 'positionless' | 'standard'
  | 'xpath-direct' | 'xpath-first-index' | 'xpath-all-elements'
  | 'custom';
```

## 🔍 问题3：策略选择不生效

### 现象
- 能看到 XPath 策略选项
- 点击策略按钮后策略没有切换

### 排查步骤

#### 1. 检查策略变更回调
在 `MatchingStrategySelector` 中添加调试日志：
```typescript
onClick={() => {
  console.log('策略变更:', s.key);
  onChange(s.key);
}}
```

#### 2. 检查策略配置器的变更处理
文件：`src/components/DraggableStepCard/components/StrategyControls.tsx`

确认 `onChange` 回调正确处理：
```typescript
onChange={(next) => {
  console.log('策略配置变更:', next);
  const nextParams = {
    ...(step.parameters || {}),
    matching: { ...prev, ...next }
  };
  onUpdate(nextParams);
}}
```

#### 3. 检查步骤更新函数
确认父组件的 `onUpdate` 函数正确更新步骤：
```typescript
const handleUpdateStep = (stepId: string, nextParams: any) => {
  console.log('更新步骤参数:', stepId, nextParams);
  // 实际的更新逻辑...
};
```

## 🔍 问题4：XPath 策略执行失败

### 现象
- 策略显示正确
- 单步测试或执行脚本时失败

### 排查步骤

#### 1. 检查后端策略处理器
确认 Rust 代码中注册了 XPath 策略处理器：
```rust
// 在 strategy_processor.rs 中
pub fn create_strategy_processor() -> StrategyProcessor {
    StrategyProcessor::new()
        .register("xpath-first-index", 95, Box::new(XPathFirstIndexStrategy))
        .register("xpath-all-elements", 90, Box::new(XPathAllElementsStrategy))
        // ...
}
```

#### 2. 检查策略实现
确认 XPath 策略类实现了正确的匹配逻辑：
```rust
impl MatchingStrategy for XPathFirstIndexStrategy {
    fn apply(&self, context: &MatchingContext) -> Result<StrategyResult, ProcessingError> {
        // 实现逻辑...
    }
}
```

#### 3. 检查 Tauri 命令调用
确认前端正确调用了匹配命令：
```typescript
const result = await useAdb().matchElementByCriteria(deviceId, {
  strategy: 'xpath-first-index',
  fields: [...],
  values: {...}
});
```

## 📚 相关文件清单

需要检查的关键文件：

### 前端文件
- `src/components/step-card/MatchingStrategyTag.tsx` - 策略标签显示
- `src/components/universal-ui/views/grid-view/panels/node-detail/MatchingStrategySelector.tsx` - 策略选择器
- `src/components/DraggableStepCard/components/StrategyControls.tsx` - 步骤卡片策略控制
- `src/components/universal-ui/views/grid-view/panels/node-detail/types.ts` - 策略类型定义

### 后端文件
- `src-tauri/src/services/execution/matching/strategies/` - 策略实现
- `src-tauri/src/services/execution/matching/strategies/strategy_processor.rs` - 策略处理器
- `src-tauri/src/commands/` - Tauri 命令定义

## 🛠️ 调试技巧

### 1. 使用浏览器开发者工具
```javascript
// 在 Console 中执行，检查当前步骤状态
const stepCards = document.querySelectorAll('[data-step-id]');
stepCards.forEach(card => {
  const stepId = card.getAttribute('data-step-id');
  console.log(`步骤 ${stepId}:`, window.__stepData?.[stepId]);
});
```

### 2. 添加临时日志
在关键位置添加 `console.log` 来追踪数据流：
```typescript
// 在 MatchingStrategyTag 中
console.log('渲染策略标签:', strategy);

// 在 StrategyControls 中
console.log('步骤匹配配置:', matching);

// 在 MatchingStrategySelector 中
console.log('当前选中策略:', value);
```

### 3. 检查网络请求
在开发者工具的 Network 面板中，查找 `match_element_by_criteria` 相关的请求，检查：
- 请求参数是否正确
- 响应状态是否成功
- 返回结果是否符合预期

## 🚀 验证修复

修复问题后，按以下步骤验证：

1. **策略显示验证**：在 Universal UI 页面查找器中选择元素，确认生成的步骤卡片显示正确的策略标签

2. **策略选择验证**：点击步骤卡片的"策略"按钮，确认能看到并选择 XPath 策略

3. **策略执行验证**：选择 XPath 策略后，点击"单步测试"，确认策略能正确执行

4. **端到端验证**：完整测试从元素选择到脚本执行的整个流程

## 🔗 相关文档

- [策略选择器组件架构指南](./STRATEGY_SELECTOR_COMPONENTS_GUIDE.md)
- [ADB 架构统一报告](../ADB_ARCHITECTURE_UNIFICATION_REPORT.md)
- [开发指导文档](../.github/copilot-instructions.md)