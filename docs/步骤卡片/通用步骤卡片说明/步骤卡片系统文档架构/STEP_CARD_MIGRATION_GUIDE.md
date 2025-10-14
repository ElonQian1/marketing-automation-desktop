# 步骤卡片组件迁移指南

## 🎯 迁移目标

从多个分散的步骤卡片组件统一到 `StepCardSystem`，消除架构歧义，提升开发体验。

## 📋 迁移映射表

| 旧组件 | 新使用方式 | 配置项 | 说明 |
|--------|------------|--------|------|
| `DraggableStepCard` | `StepCardSystem` | `{ enableDrag: true }` | 拖拽交互功能 |
| `UnifiedStepCard` | `StepCardSystem` | `{ enableIntelligent: true }` | 智能分析功能 |
| `IntelligentStepCard` | `StepCardSystem` | `{ enableIntelligent: true }` | 同 UnifiedStepCard |
| `ProspectingStepCard` | `StepCardSystem` | `{ businessType: 'prospecting' }` | 精准获客业务 |
| `ScriptStepCard` | `StepCardSystem` | `{ businessType: 'script-builder' }` | 脚本构建业务 |

## 🔄 具体迁移示例

### 1. DraggableStepCard → StepCardSystem

```tsx
// ❌ 旧代码
import { DraggableStepCard } from '@/components/DraggableStepCard';

<DraggableStepCard
  step={stepData}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onTest={handleTest}
  isDragging={isDragging}
  dragHandleProps={dragProps}
/>
```

```tsx
// ✅ 新代码  
import { StepCardSystem } from '@/modules/universal-ui';

<StepCardSystem
  stepData={stepData}
  config={{ 
    enableDrag: true,
    enableIntelligent: false  // 如果不需要智能功能
  }}
  callbacks={{
    onEdit: handleEdit,
    onDelete: handleDelete,
    onTest: handleTest
  }}
  dragState={{ isDragging, dragHandleProps }}
/>
```

### 2. UnifiedStepCard → StepCardSystem

```tsx
// ❌ 旧代码
import { UnifiedStepCard } from '@/modules/universal-ui/components/unified-step-card';

<UnifiedStepCard
  stepCard={intelligentStep}
  onUpgradeStrategy={handleUpgrade}
  onRetryAnalysis={handleRetry}
  onSwitchStrategy={handleSwitch}
  draggable={false}
/>
```

```tsx
// ✅ 新代码
import { StepCardSystem } from '@/modules/universal-ui';

<StepCardSystem
  stepData={intelligentStep}  // 自动适配数据格式
  config={{ 
    enableDrag: false,
    enableIntelligent: true
  }}
  callbacks={{
    onUpgradeStrategy: handleUpgrade,
    onRetryAnalysis: handleRetry,
    onSwitchStrategy: handleSwitch
  }}
/>
```

### 3. 完整功能组合 → StepCardSystem

```tsx
// ❌ 旧代码（需要两个组件配合）
import { DraggableStepCard } from '@/components/DraggableStepCard';
import { UnifiedStepCard } from '@/modules/universal-ui/components/unified-step-card';

// 根据条件选择不同组件...
{needsIntelligent ? (
  <UnifiedStepCard stepCard={data} draggable={true} />
) : (
  <DraggableStepCard step={data} />
)}
```

```tsx
// ✅ 新代码（一个组件搞定）
import { StepCardSystem } from '@/modules/universal-ui';

<StepCardSystem
  stepData={data}
  config={{ 
    enableDrag: true,           // 启用拖拽功能
    enableIntelligent: true,    // 启用智能功能
    systemMode: 'full'          // 完整功能模式
  }}
  callbacks={{
    onEdit: handleEdit,
    onUpgradeStrategy: handleUpgrade,
    onTest: handleTest
  }}
/>
```

### 4. 业务特化组件 → StepCardSystem

```tsx
// ❌ 旧代码
import { ProspectingStepCard } from '@/modules/precise-acquisition/components/prospecting-step-card';

<ProspectingStepCard
  stepCard={stepData}
  prospectingStage="contact"
  successRate={85}
  onViewProspectingData={handleViewData}
  onExportContacts={handleExport}
/>
```

```tsx
// ✅ 新代码
import { StepCardSystem } from '@/modules/universal-ui';

<StepCardSystem
  stepData={stepData}
  config={{ 
    businessType: 'prospecting',
    businessConfig: {
      stage: 'contact',
      successRate: 85
    }
  }}
  callbacks={{
    onViewProspectingData: handleViewData,
    onExportContacts: handleExport
  }}
/>
```

## 🔧 配置详解

### `config` 属性完整配置

```tsx
interface StepCardSystemConfig {
  // 核心功能开关
  enableDrag?: boolean;          // 启用拖拽交互功能
  enableIntelligent?: boolean;   // 启用智能分析功能
  enableEdit?: boolean;          // 启用编辑功能
  
  // 系统模式
  systemMode?: 'full' | 'interaction-only' | 'intelligent-only' | 'minimal';
  
  // 业务特化
  businessType?: 'prospecting' | 'script-builder' | 'contact-import' | 'adb';
  businessConfig?: Record<string, any>;  // 业务特定配置
  
  // 外观和行为
  theme?: 'default' | 'compact' | 'modern';
  size?: 'small' | 'default' | 'large';
  showDebugInfo?: boolean;
  
  // 实验性功能
  enableExperimentalFeatures?: boolean;
}
```

### `callbacks` 属性完整回调

```tsx
interface StepCardSystemCallbacks {
  // 基础操作
  onEdit?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onTest?: () => void;
  onToggle?: () => void;
  
  // 智能分析相关
  onUpgradeStrategy?: () => void;
  onRetryAnalysis?: () => void;
  onCancelAnalysis?: () => void;
  onSwitchStrategy?: (strategyKey: string) => void;
  onViewDetails?: () => void;
  
  // 业务特定回调
  onViewProspectingData?: () => void;
  onExportContacts?: () => void;
  onAdjustStrategy?: () => void;
  
  // 拖拽相关
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
}
```

## 📊 数据格式适配

### 自动数据适配

`StepCardSystem` 内置了数据适配器，自动处理不同的数据格式：

```tsx
// 支持 DraggableStepCard 格式
const legacyStepData = {
  id: "step-1",
  name: "点击按钮",
  step_type: "click",
  parameters: { selector: ".btn" }
};

// 支持 UnifiedStepCard 格式  
const intelligentStepData = {
  stepId: "step-1",
  stepName: "点击按钮",
  stepType: "click",
  analysisState: "completed",
  activeStrategy: { name: "文本匹配", confidence: 0.92 }
};

// 两种格式都可以直接使用
<StepCardSystem stepData={legacyStepData} />
<StepCardSystem stepData={intelligentStepData} />
```

### 手动数据转换

如果需要手动控制数据转换：

```tsx
import { adaptLegacyStepToIntelligent } from '@/modules/universal-ui/adapters/step-card-adapter';

const legacyStep = { /* 旧格式数据 */ };
const intelligentStep = adaptLegacyStepToIntelligent(legacyStep);

<StepCardSystem stepData={intelligentStep} />
```

## 🚨 常见迁移问题

### 问题1：找不到某些特定功能

**原因**：旧组件的特殊功能可能需要通过配置启用

**解决方案**：
```tsx
// 如果某个功能消失了，检查是否需要启用相应配置
<StepCardSystem
  config={{
    enableExperimentalFeatures: true,  // 启用实验性功能
    showDebugInfo: true,               // 显示调试信息
  }}
/>
```

### 问题2：样式或布局不一致

**原因**：新系统使用统一的样式系统

**解决方案**：
```tsx
// 通过主题和大小配置调整外观
<StepCardSystem
  config={{
    theme: 'compact',    // 紧凑主题
    size: 'small',       // 小尺寸
  }}
  className="custom-step-card"  // 自定义样式类
/>
```

### 问题3：回调函数签名不匹配

**原因**：新系统统一了回调函数接口

**解决方案**：
```tsx
// 旧回调
const handleOldEdit = (step) => { /* ... */ };

// 新回调（通过上下文获取数据）
const handleNewEdit = () => { 
  // 如果需要step数据，通过props或context获取
  const currentStep = getCurrentStepFromContext();
  /* ... */ 
};

<StepCardSystem
  callbacks={{ onEdit: handleNewEdit }}
/>
```

## 🎯 迁移检查清单

### 代码层面

- [ ] 替换所有 `DraggableStepCard` 导入为 `StepCardSystem`
- [ ] 替换所有 `UnifiedStepCard` 导入为 `StepCardSystem`  
- [ ] 更新组件属性为新的 `config` 和 `callbacks` 格式
- [ ] 验证数据格式兼容性，必要时使用适配器
- [ ] 测试所有交互功能（拖拽、编辑、智能分析等）

### 功能层面

- [ ] 确认拖拽功能正常工作
- [ ] 确认智能分析功能正常工作
- [ ] 确认编辑、删除、测试等基础功能
- [ ] 确认业务特化功能（如获客数据、脚本操作）
- [ ] 确认样式和主题正确应用

### 性能层面

- [ ] 检查是否有不必要的重渲染
- [ ] 确认内存泄漏问题已解决
- [ ] 验证大列表性能表现

## 🚀 迁移后的收益

### 开发体验提升

1. **统一的API**：不再需要记忆多个组件的不同接口
2. **配置驱动**：通过配置启用需要的功能，简单直观
3. **类型安全**：完整的TypeScript类型支持
4. **更好的文档**：统一的使用指南和示例

### 维护成本降低

1. **单一维护点**：只需要维护一个组件系统
2. **一致的行为**：所有场景下的行为保持一致
3. **简化测试**：减少需要测试的组件数量
4. **版本升级简单**：统一的升级路径

### 架构清晰度

1. **消除歧义**：开发者明确知道使用哪个组件
2. **职责明确**：系统内部职责分工清晰
3. **扩展性好**：新功能可以统一添加到系统中

## 📞 迁移支持

如果在迁移过程中遇到问题，可以：

1. **查看示例**：参考 `src/modules/universal-ui/pages/unified-step-card-demo.tsx`
2. **查看文档**：阅读 `StepCardSystem` 的详细文档
3. **检查类型**：利用 TypeScript 的类型提示
4. **逐步迁移**：先迁移一个组件，验证无误后再迁移其他

---

**迁移完成后，请删除旧组件的直接导入，统一使用 `StepCardSystem`！** 🎉