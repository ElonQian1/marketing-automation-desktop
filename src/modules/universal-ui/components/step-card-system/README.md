// src/modules/universal-ui/components/step-card-system/README.md
// module: universal-ui | layer: documentation | role: system-guide
// summary: 步骤卡片系统使用指南，防止误用和歧义

# 步骤卡片系统 (StepCardSystem)

## 🎯 系统本质

**重要理念**：DraggableStepCard 和 UnifiedStepCard 本质上是**同一个步骤卡片系统的不同组成部件**

```
StepCardSystem (完整的步骤卡片系统)
├── InteractionLayer (交互部件) ← DraggableStepCard 的职责
├── IntelligentLayer (智能部件) ← UnifiedStepCard 的职责  
└── PresentationLayer (展示部件) ← 两者共同的UI
```

## ❌ 常见误解

```typescript
// ❌ 错误认知：认为它们是两个独立的组件
import { DraggableStepCard, UnifiedStepCard } from 'somewhere';

// 开发者会困惑：我该用哪个？
<DraggableStepCard />  // 只有交互，没有智能功能
<UnifiedStepCard />    // 只有智能，没有交互功能

// 或者更糟糕的理解：
<div>
  <DraggableStepCard />
  <UnifiedStepCard />  {/* 两个卡片？重复显示？ */}
</div>
```

## ✅ 正确理解

```typescript
// ✅ 正确认知：这是一个完整的系统
import { StepCardSystem } from '@/modules/universal-ui/components/step-card-system';

// 系统内部自动协调交互部件和智能部件
<StepCardSystem 
  stepData={data}
  // 交互部件配置
  interactionConfig={{ 
    enableDrag: true,
    enableEdit: true,
    enableTest: true 
  }}
  // 智能部件配置
  intelligentConfig={{ 
    enableAnalysis: true,
    enableAutoUpgrade: true 
  }}
/>
```

## 🏗️ 系统架构

### 统一命名规范

```typescript
// 旧命名（容易产生歧义）
DraggableStepCard    // ❌ 听起来像独立组件
UnifiedStepCard      // ❌ 听起来像另一个独立组件

// 新命名（系统化表达）
StepCardSystem                  // ✅ 系统入口
└── StepCardInteractionLayer   // ✅ 明确是系统的交互部件
└── StepCardIntelligentLayer   // ✅ 明确是系统的智能部件
```

### 防止歧义的设计

1. **单一入口**：只暴露 `StepCardSystem`
2. **内部标记**：Layer 组件带有内部标记，防止外部直接使用
3. **清晰文档**：明确说明系统的组成关系

## 🚫 防止误用

### 1. 导出控制

```typescript
// 只导出系统入口
export { StepCardSystem } from './StepCardSystem';

// 不导出内部部件，防止误用
// export { StepCardInteractionLayer };  // ❌ 不导出
// export { StepCardIntelligentLayer };   // ❌ 不导出
```

### 2. 类型约束

```typescript
// 内部部件需要特殊标记才能使用
interface InternalComponentProps {
  __internal: unique symbol; // 外部无法构造
}
```

### 3. 运行时检查

```typescript
export const StepCardInteractionLayer = (props) => {
  if (!props.__internal) {
    throw new Error(
      'StepCardInteractionLayer 是系统内部部件，请使用 StepCardSystem'
    );
  }
  // 正常逻辑
};
```

## 📋 使用指南

### 基础用法

```typescript
import { StepCardSystem } from '@/modules/universal-ui/components/step-card-system';

// 完整功能模式
<StepCardSystem
  stepData={stepData}
  interactionConfig={{ enableDrag: true, enableEdit: true }}
  intelligentConfig={{ enableAnalysis: true, enableAutoUpgrade: true }}
/>
```

### 部分功能模式

```typescript
// 只需要交互功能（传统编辑器模式）
<StepCardSystem
  stepData={stepData}
  systemMode="interaction-only"
  interactionConfig={{ enableDrag: true, enableEdit: true }}
/>

// 只需要智能功能（纯展示模式）
<StepCardSystem
  stepData={stepData}
  systemMode="intelligent-only"
  intelligentConfig={{ enableAnalysis: true, showAnalysisDetails: true }}
/>

// 完整功能（默认模式）
<StepCardSystem
  stepData={stepData}
  systemMode="full"  // 或省略，这是默认值
/>
```

### 回调处理

```typescript
<StepCardSystem
  stepData={stepData}
  callbacks={{
    // 交互部件回调
    onEdit: (stepId) => console.log('编辑步骤', stepId),
    onDelete: (stepId) => console.log('删除步骤', stepId),
    onTest: (stepId) => console.log('测试步骤', stepId),
    
    // 智能部件回调  
    onStartAnalysis: (stepId) => console.log('开始分析', stepId),
    onUpgradeStrategy: (stepId) => console.log('升级策略', stepId),
    onSwitchStrategy: (stepId, strategy) => console.log('切换策略', stepId, strategy),
  }}
/>
```

## 🔧 迁移指南

### 从 DraggableStepCard 迁移

```typescript
// 旧代码
import { DraggableStepCard } from './old-path';
<DraggableStepCard 
  step={stepData}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onTest={handleTest}
/>

// 新代码
import { StepCardSystem } from '@/modules/universal-ui/components/step-card-system';
<StepCardSystem
  stepData={adaptedStepData}
  systemMode="interaction-only"  // 只启用交互功能
  interactionConfig={{ enableDrag: true, enableEdit: true, enableTest: true }}
  callbacks={{ onEdit: handleEdit, onDelete: handleDelete, onTest: handleTest }}
/>
```

### 从 UnifiedStepCard 迁移

```typescript
// 旧代码
import { UnifiedStepCard } from './old-path';
<UnifiedStepCard
  stepCard={stepData}
  onUpgradeStrategy={handleUpgrade}
  onRetryAnalysis={handleRetry}
/>

// 新代码
import { StepCardSystem } from '@/modules/universal-ui/components/step-card-system';
<StepCardSystem
  stepData={stepData}
  systemMode="intelligent-only"  // 只启用智能功能
  intelligentConfig={{ enableAnalysis: true, enableAutoUpgrade: true }}
  callbacks={{ onUpgradeStrategy: handleUpgrade, onRetryAnalysis: handleRetry }}
/>
```

### 完整功能迁移

```typescript
// 如果之前需要同时使用两个组件
// 旧代码（存在问题的用法）
<div>
  <DraggableStepCard {...interactionProps} />
  <UnifiedStepCard {...intelligentProps} />
</div>

// 新代码（正确的系统用法）
<StepCardSystem
  stepData={mergedStepData}
  systemMode="full"
  interactionConfig={{ ...interactionConfig }}
  intelligentConfig={{ ...intelligentConfig }}
  callbacks={{ ...allCallbacks }}
/>
```

## ✨ 系统优势

1. **概念清晰**：一个系统，多个协同工作的部件
2. **防止误用**：技术手段确保正确使用
3. **功能完整**：交互 + 智能的完整体验
4. **配置灵活**：可以按需启用不同的功能部件
5. **维护简单**：统一的入口，统一的维护

## 🎉 总结

通过这种**系统化架构**，我们彻底解决了歧义问题：

- ✅ **命名清晰**：System + Layer 明确表达系统关系
- ✅ **概念统一**：一个系统，多个部件，协同工作
- ✅ **使用简单**：开发者只需要关心 StepCardSystem
- ✅ **防止误用**：技术手段确保不会被错误理解
- ✅ **文档清楚**：详细说明系统的本质和使用方式

任何看到这个架构的开发者都会清楚理解：这是一个完整的步骤卡片系统，交互部件和智能部件协同工作，而不是两个独立的组件。