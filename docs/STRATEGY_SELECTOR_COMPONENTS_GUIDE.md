# 策略选择器组件架构指南

## 📋 组件概览

本项目中存在**多个策略选择器组件**，它们服务于不同的目的和场景。为避免开发过程中的混淆，本文档详细说明各组件的职责、使用场景和正确的使用方式。

## 🎯 核心组件分类

### 1. **UI 匹配策略选择器**

#### `MatchingStrategySelector.tsx`
- **路径**: `src/components/universal-ui/views/grid-view/panels/node-detail/MatchingStrategySelector.tsx`
- **用途**: **页面分析器（Grid Inspector）** 中的元素匹配策略选择
- **位置**: 右侧节点详情面板 → 匹配策略预设行
- **支持策略**: `absolute`, `strict`, `relaxed`, `positionless`, `standard`, `xpath-first-index`, `xpath-all-elements`
- **使用场景**: 用户在页面分析器中选择不同的元素匹配策略
- **关键特性**: 
  - 支持最新的 XPath 策略
  - 直接影响元素匹配结果
  - 与 `useAdb().matchElementByCriteria()` 对接

**正确使用方式**:
```tsx
<MatchingStrategySelector 
  strategy={currentStrategy}
  onStrategyChange={handleStrategyChange}
  size="small"
/>
```

### 2. **导入策略选择器**

#### `ImportStrategySelector.tsx`
- **路径**: `src/modules/contact-import/ui/import-config/components/ImportStrategySelector.tsx`
- **用途**: **联系人导入配置** 中的导入策略选择
- **支持策略**: `sequential`, `random`, `batch`
- **使用场景**: 配置联系人导入的执行策略
- **业务含义**: 决定联系人导入的顺序和方式

### 3. **其他策略选择器**

#### `MatchStrategySelector.tsx`
- **路径**: `src/components/shared/MatchStrategySelector.tsx`
- **用途**: 通用的匹配策略选择组件
- **使用场景**: 可能用于其他匹配场景的策略选择

## 🚫 已删除的假设组件

### `❌ StrategySelector.tsx` (已删除)
- **原路径**: `src/components/DraggableStepCard/components/StrategySelector.tsx`
- **问题**: 这是在调试过程中错误创建的假设组件
- **状态**: **已完全删除**
- **原因**: 
  - 功能与 `MatchingStrategySelector.tsx` 重复
  - 创建于错误的目录位置
  - 不符合项目的组件架构设计

## 🎯 选择正确组件的指南

### 场景识别表

| 使用场景 | 正确组件 | 错误选择 |
|---------|---------|-----------|
| 页面分析器中的元素匹配 | `MatchingStrategySelector` | ❌ `StrategySelector` |
| 联系人导入策略配置 | `ImportStrategySelector` | ❌ `MatchingStrategySelector` |
| 步骤卡片中的策略显示 | `MatchingStrategyTag` | ❌ `StrategySelector` |
| 通用匹配场景 | `MatchStrategySelector` | ❌ 自创组件 |

### 新 XPath 策略位置

**✅ 正确位置**: `MatchingStrategySelector.tsx`
```tsx
const STRATEGY_LIST: MatchStrategy[] = [
  'absolute', 'strict', 'relaxed', 'positionless', 'standard',
  'xpath-first-index',    // ✅ 使用[1]索引
  'xpath-all-elements'    // ✅ 返回所有同类按钮
];
```

**❌ 错误位置**: 任何其他策略选择器组件

## 🛠️ 开发最佳实践

### 1. **组件命名约定**
- 策略选择器组件必须包含 `Strategy` 和用途描述
- 使用 PascalCase 命名
- 避免创建通用的 `StrategySelector` 组件

### 2. **目录结构规范**
```
src/
├── components/universal-ui/views/grid-view/
│   └── panels/node-detail/
│       └── MatchingStrategySelector.tsx     # ✅ UI匹配策略
├── modules/contact-import/ui/
│   └── import-config/components/
│       └── ImportStrategySelector.tsx       # ✅ 导入策略
├── components/shared/
│   └── MatchStrategySelector.tsx           # ✅ 通用匹配
└── components/DraggableStepCard/
    └── step-card/
        └── MatchingStrategyTag.tsx         # ✅ 只读标签
```

### 3. **开发检查清单**

在添加新的策略相关功能时，请检查：

```
□ 是否需要创建新的策略选择器？
□ 现有组件是否已满足需求？
□ 组件放置在正确的目录位置？
□ 组件名称是否明确表达用途？
□ 是否与现有组件功能重复？
□ 是否遵循项目的架构约定？
```

## 🚨 防混淆措施

### 1. **命名规范强制**
- 禁止创建名为 `StrategySelector` 的通用组件
- 必须在组件名中包含具体用途（如 `MatchingStrategySelector`）

### 2. **代码审查要求**
- 新增策略相关组件必须说明与现有组件的差异
- 必须在 PR 描述中解释组件的具体用途
- 必须更新本文档添加新组件说明

### 3. **架构约束**
- 步骤卡片中只应使用 `MatchingStrategyTag` 进行只读显示
- 策略编辑功能应在专门的配置界面中进行
- 不同业务域的策略选择器不应混用

## 📚 参考资料

- [DDD 架构指导文档](../.github/copilot-instructions.md)
- [ADB 架构统一报告](../ADB_ARCHITECTURE_UNIFICATION_REPORT.md)
- [组件架构设计原则](./LIGHTWEIGHT_COMPONENTS_GUIDE.md)

## 🔄 版本历史

- **v1.0** (2025-01-20): 初始版本，记录现有组件状态
- **v1.1** (2025-01-20): 添加 XPath 策略说明，删除假设 StrategySelector 组件

---

**重要提醒**: 如果您发现自己在寻找"策略选择器"相关组件，请先参考本文档确定正确的组件，而不是创建新的组件。