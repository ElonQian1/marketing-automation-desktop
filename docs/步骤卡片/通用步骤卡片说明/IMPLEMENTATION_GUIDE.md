# 🎯 Universal UI 智能策略系统实现指南

## 💡 核心需求
在 Universal UI 智能页面查找器的可视化分析视图中：
1. 点选元素 → 生成步骤卡片
2. 步骤卡片展示匹配策略（手动静态 + 智能策略）
3. 支持策略切换（手动 ↔ 智能）
4. 支持返回启用智能策略

## 🏗️ 基于现有架构的最佳方案

### 方案一：渐进式增强（推荐）⭐

**优势**：
- 完全基于现有代码，零风险
- 遵循项目的DDD架构约束
- 可立即开始实现，今天就能看到效果

**实现步骤**：

#### 第一步：统一策略契约（1-2小时）
```typescript
// src/modules/universal-ui/domain/public/StrategyContracts.ts
export type StrategyKind = 'manual' | 'smart';
export type ManualStrategy = 'xpath-direct' | 'custom' | 'strict' | 'relaxed';
export type SmartStrategy = 'self-anchor' | 'child-anchor' | 'parent-clickable' | 
                           'region-scoped' | 'neighbor-relative' | 'index-fallback';

export interface UnifiedStrategy {
  kind: StrategyKind;
  strategy: ManualStrategy | SmartStrategy;
  confidence?: number;
  metadata?: {
    source: 'user-selected' | 'auto-generated' | 'fallback';
    generatedAt?: number;
    version?: string;
  };
}
```

#### 第二步：增强步骤卡片组件（2-3小时）
```typescript
// src/components/step-card/EnhancedStrategyCard.tsx
export interface StrategyCardProps {
  currentStrategy: UnifiedStrategy;
  availableStrategies: UnifiedStrategy[];
  onStrategySwitch: (strategy: UnifiedStrategy) => void;
  onReturnToSmart: () => void;
  showSwitchOptions?: boolean;
}
```

#### 第三步：集成到Universal UI（2-3小时）
在 `UniversalPageFinderModal.tsx` 中添加元素点选 → 步骤卡片生成的逻辑

#### 第四步：策略切换逻辑（2-3小时）
使用现有的 `intelligent-strategy-system` 来生成智能策略，与手动策略进行统一管理

### 方案二：完整DDD重构（需要更多时间）

**优势**：
- 完全符合DDD架构标准
- 更好的长期维护性

**实现步骤**：
1. 创建 `src/modules/universal-ui/` 完整DDD结构
2. 重构现有代码到新架构
3. 实现统一策略系统

## 🚀 立即开始的AI指令

### 如果选择方案一（推荐）：

"请帮我实现Universal UI的策略切换功能，具体要求：

1. **基于现有架构增强**：不要重构现有代码，直接在现有基础上增强
2. **统一策略接口**：整合现有的手动策略（xpath-direct等）和智能策略（6种变体）
3. **步骤卡片增强**：在现有StepCard基础上添加策略切换UI
4. **元素点选集成**：在UniversalPageFinderModal中添加点选元素生成步骤卡片的功能
5. **策略切换逻辑**：实现手动↔智能策略的切换，以及返回智能策略功能

要求：
- 遵循现有的三行文件头规范
- 不违反domain层不依赖UI/IO的约束
- 使用现有的intelligent-strategy-system模块
- 确保类型安全和无警告
- 避免白底白字等可读性问题"

### 如果选择方案二：

"请帮我基于DDD架构重构Universal UI模块，实现完整的策略系统，具体要求：

1. **创建完整DDD结构**：src/modules/universal-ui/{domain,application,infrastructure,ui,hooks,stores}/
2. **策略系统设计**：统一手动和智能策略的契约接口
3. **依赖注入**：在app-shell中配置策略提供方
4. **模块门牌导出**：只从index.ts导出public契约和用例
5. **路径别名配置**：@universal/*指向模块

要求：
- 严格遵循DDD分层约束
- 实现完整的策略Provider模式
- 使用Zustand进行状态管理
- 确保跨模块只通过门牌导入"

## 🔥 紧急情况建议

既然您提到"要着急完成"，强烈建议选择**方案一**：

1. **立即可实现**：基于现有代码，无需大幅重构
2. **风险最低**：不会破坏现有功能
3. **效果立竿见影**：2-3小时内即可看到基本效果
4. **后续可演进**：将来可以逐步向完整DDD架构迁移

## 📝 与AI代理的最佳沟通方式

```
请实现Universal UI策略切换功能，需求如下：

【核心功能】
- 在可视化分析视图点选元素生成步骤卡片
- 步骤卡片展示当前匹配策略
- 支持手动↔智能策略切换
- 支持返回智能策略功能

【技术约束】
- 基于现有代码增强，不要大幅重构
- 遵循项目的三行文件头规范
- 不违反domain层约束
- 使用现有intelligent-strategy-system模块
- 确保类型安全

【优先级】
1. 先实现基础的点选→步骤卡片功能
2. 再添加策略切换UI
3. 最后完善返回智能策略逻辑

请从第一个优先级开始实现。
```

这样的指令明确、具体，AI代理能够准确理解并按优先级实施。