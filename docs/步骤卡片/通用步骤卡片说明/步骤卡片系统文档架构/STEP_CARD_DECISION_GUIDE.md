# 步骤卡片组件选择决策指南

## 🎯 快速决策流程图

```
开始：我需要步骤卡片功能
│
├─ 问：我是在开发新功能吗？
│  ├─ 是 → 直接使用 StepCardSystem ✅
│  └─ 否 → 继续下一步
│
├─ 问：我是在维护现有代码吗？
│  ├─ 是 → 查看当前使用的组件
│  │  ├─ DraggableStepCard → 考虑迁移到 StepCardSystem
│  │  ├─ UnifiedStepCard → 考虑迁移到 StepCardSystem  
│  │  ├─ 其他旧组件 → 查看迁移指南
│  │  └─ StepCardSystem → 继续使用 ✅
│  └─ 否 → 继续下一步
│
└─ 问：我有特殊需求吗？
   ├─ 特殊需求场景检查：
   │  ├─ 需要原始XML检查器？ → EnhancedStepCard（临时）⚠️
   │  ├─ 需要特殊脚本功能？ → 评估是否可以集成到StepCardSystem
   │  └─ 其他特殊场景？ → 咨询架构团队
   └─ 无特殊需求 → 使用 StepCardSystem ✅
```

## 📊 组件功能对比表

| 功能需求 | StepCardSystem | DraggableStepCard | UnifiedStepCard | 其他组件 |
|---------|----------------|-------------------|-----------------|----------|
| **拖拽交互** | ✅ (配置启用) | ✅ | ⚠️ (部分支持) | ❌ |
| **智能分析** | ✅ (配置启用) | ❌ | ✅ | ❌ |
| **完整功能** | ✅ | ⚠️ (仅交互) | ⚠️ (仅智能) | ❌ |
| **业务特化** | ✅ (配置支持) | ❌ | ❌ | ⚠️ (部分) |
| **维护状态** | ✅ 积极维护 | ⚠️ 废弃警告 | ⚠️ 废弃警告 | ⚠️ 特殊用途 |
| **文档完整** | ✅ | ⚠️ | ⚠️ | ❌ |
| **类型安全** | ✅ | ⚠️ | ⚠️ | ❌ |
| **测试覆盖** | ✅ | ⚠️ | ⚠️ | ❌ |

## 🎯 推荐使用矩阵

### 按功能需求选择

```
需要拖拽 + 需要智能分析 = StepCardSystem (full模式)
需要拖拽 + 不需要智能   = StepCardSystem (interaction-only模式)  
不需要拖拽 + 需要智能   = StepCardSystem (intelligent-only模式)
不需要拖拽 + 不需要智能 = StepCardSystem (minimal模式)
```

### 按业务场景选择

```
精准获客模块 → StepCardSystem + businessType: 'prospecting'
脚本构建模块 → StepCardSystem + businessType: 'script-builder'
联系人导入 → StepCardSystem + businessType: 'contact-import'  
ADB调试功能 → StepCardSystem + businessType: 'adb'
通用场景   → StepCardSystem + businessType: undefined
```

### 按开发阶段选择

```
🆕 新功能开发
├─ 第一选择：StepCardSystem
├─ 配置方式：根据具体需求配置功能
└─ 参考文档：STEP_CARD_MIGRATION_GUIDE.md

🔧 现有功能维护  
├─ 评估是否迁移：查看迁移收益 vs 成本
├─ 渐进式迁移：先迁移新修改的部分
└─ 保持一致性：避免同一页面混用多种组件

🚨 紧急修复
├─ 短期方案：在现有组件基础上修复
├─ 长期规划：修复后考虑迁移到新系统
└─ 记录技术债：在技术债清单中标记待迁移项
```

## ⚡ 快速配置速查表

### 常用配置组合

```tsx
// 1. 基础拖拽卡片（替代 DraggableStepCard）
<StepCardSystem 
  config={{ enableDrag: true, enableIntelligent: false }}
/>

// 2. 智能分析卡片（替代 UnifiedStepCard）
<StepCardSystem 
  config={{ enableDrag: false, enableIntelligent: true }}
/>

// 3. 完整功能卡片（推荐用于新功能）
<StepCardSystem 
  config={{ enableDrag: true, enableIntelligent: true }}
/>

// 4. 精准获客专用（替代 ProspectingStepCard）
<StepCardSystem 
  config={{ 
    businessType: 'prospecting',
    enableDrag: true,
    enableIntelligent: true 
  }}
/>

// 5. 紧凑模式（适用于对话框、侧边栏）
<StepCardSystem 
  config={{ 
    theme: 'compact',
    size: 'small',
    systemMode: 'minimal'
  }}
/>
```

### 性能优化配置

```tsx
// 大列表场景
<StepCardSystem 
  config={{ 
    enableExperimentalFeatures: false,  // 关闭实验性功能
    systemMode: 'minimal',              // 最小功能模式
    showDebugInfo: false                // 关闭调试信息
  }}
/>

// 调试开发场景
<StepCardSystem 
  config={{ 
    showDebugInfo: true,                // 显示调试信息
    enableExperimentalFeatures: true   // 启用实验性功能
  }}
/>
```

## 🚨 避免的反模式

### ❌ 错误使用方式

```tsx
// 1. 直接导入内部组件
import { DraggableStepCard } from '@/components/DraggableStepCard';
import { UnifiedStepCard } from '@/modules/universal-ui/components/unified-step-card';

// 2. 在同一页面混用多种组件
<div>
  <DraggableStepCard />      // 旧组件
  <StepCardSystem />         // 新组件
  <UnifiedStepCard />        // 另一个旧组件
</div>

// 3. 忽视废弃警告
// @deprecated 的组件仍然继续使用而不考虑迁移

// 4. 过度配置
<StepCardSystem 
  config={{
    // 启用所有功能，即使不需要
    enableDrag: true,
    enableIntelligent: true,
    enableExperimentalFeatures: true,
    showDebugInfo: true
  }}
/>
```

### ✅ 正确使用方式

```tsx
// 1. 统一导入入口
import { StepCardSystem } from '@/modules/universal-ui';

// 2. 根据需求精确配置
<StepCardSystem 
  config={{
    enableDrag: needsDrag,           // 基于实际需求
    enableIntelligent: needsAI,      // 按需启用
    businessType: currentModule      // 业务特化
  }}
/>

// 3. 遵循迁移指南
// 参考 STEP_CARD_MIGRATION_GUIDE.md 进行逐步迁移

// 4. 一致的使用模式
// 在整个应用中保持使用 StepCardSystem
```

## 📋 检查清单

### 开发前检查

- [ ] 我是否需要步骤卡片功能？
- [ ] 我了解 StepCardSystem 的基本配置吗？
- [ ] 我查看过相关文档和示例吗？
- [ ] 我的功能需求明确吗（拖拽？智能？业务特化？）

### 开发中检查

- [ ] 我使用了正确的导入路径吗？
- [ ] 我的配置是否精确匹配需求？
- [ ] 我处理了所有必要的回调吗？
- [ ] 我的数据格式兼容吗？

### 开发后检查

- [ ] 所有功能都正常工作吗？
- [ ] 性能表现符合预期吗？
- [ ] 代码通过了类型检查吗？
- [ ] 我遵循了项目的命名和架构规范吗？

## 🎉 成功标准

当你正确使用 StepCardSystem 时，应该达到：

1. **功能完整**：所有需要的功能都能正常工作
2. **配置清晰**：配置项精确匹配业务需求，无冗余配置
3. **代码简洁**：相比旧方案，代码更简洁易懂
4. **类型安全**：完整的 TypeScript 类型支持，无类型错误
5. **性能良好**：无不必要的重渲染或性能问题
6. **维护友好**：其他开发者容易理解和修改

---

**记住：当有疑问时，选择 StepCardSystem。它是专门为解决组件选择困惑而设计的统一解决方案！** 🚀