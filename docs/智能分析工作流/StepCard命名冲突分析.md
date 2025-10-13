# StepCard 命名冲突问题分析

## 🚨 **发现的问题**

项目中存在两个同名的 `StepCard.tsx` 组件，功能完全不同，导致：

1. **命名冲突** - 相同的组件名和导出名
2. **功能混淆** - 开发者不知道使用哪个组件  
3. **导入错误** - 容易导入错误的组件
4. **维护困难** - 影响代码可读性和可维护性

## 📍 **两个同名组件对比**

### 1. 策略配置卡片
```typescript
// 路径: src/modules/universal-ui/ui/StepCard.tsx
// 用途: 元素选择策略的配置和展示
export const StepCard: React.FC<StepCardProps> = ({
  title = "匹配策略",
  showModeSwitch = true,  // 手动/智能策略切换
  editable = true,
  // ...
}) => {
  const { state, details, utils } = useStepStrategy();
  // 策略相关逻辑
}
```

**核心功能：**
- ✅ 手动/智能策略切换
- ✅ 策略信息展示 (xpath, css选择器等)
- ✅ 策略编辑和配置
- ✅ 智能策略推荐和置信度显示

### 2. 脚本步骤卡片
```typescript
// 路径: src/components/feature-modules/script-builder/components/StepCard.tsx  
// 用途: 脚本构建器中的步骤操作和管理
export const ScriptStepCard: React.FC<StepCardProps> = ({
  step: ScriptStep,
  index: number,
  isSelected?: boolean,
  isExecuting?: boolean,
  draggable?: boolean,
  onEdit?: (step: ScriptStep) => void,
  onDelete?: (stepId: string) => void,
  // ...
}) => {
  // 脚本步骤相关逻辑
}
```

**核心功能：**
- ✅ 脚本步骤的增删改
- ✅ 拖拽排序支持
- ✅ 步骤执行状态显示
- ✅ 步骤验证和错误提示
- ✅ 步骤类型图标和标签

## 🎯 **建议的解决方案**

### 方案1: 语义化重命名 ⭐ **推荐**

```typescript
// 策略配置 → 明确命名
src/modules/universal-ui/ui/StrategyCard.tsx
export const StrategyCard = () => {
  // 元素选择策略配置
}

// 脚本步骤 → 明确命名
src/components/feature-modules/script-builder/components/ScriptStepCard.tsx
export const ScriptStepCard = () => {
  // 脚本步骤管理
}
```

### 方案2: 保持现状但添加命名空间

```typescript
// 通过导入时重命名区分
import { StepCard as StrategyStepCard } from '@/modules/universal-ui/ui/StepCard';
import { StepCard as ScriptStepCard } from '@/components/feature-modules/script-builder/components/StepCard';
```

### 方案3: 模块化导出

```typescript
// 策略模块
export { StepCard } from '@universal/strategy';

// 脚本构建器模块  
export { StepCard } from '@script-builder/components';
```

## 🔧 **临时解决措施**

已在代码注释中标记：

```typescript
// src/modules/universal-ui/ui/StepCard.tsx
/**
 * 策略配置卡片组件
 * TODO: 考虑重命名为 StrategyCard 以避免与脚本步骤卡片混淆
 */

// src/components/feature-modules/script-builder/components/StepCard.tsx  
/**
 * 脚本步骤卡片组件
 * TODO: 重命名为 ScriptStepCard 以避免与 universal-ui 的 StrategyCard 混淆
 */
export const ScriptStepCard: React.FC<StepCardProps> = ({ // 已重命名导出
```

## 📋 **重构清单**

### 高优先级 🔥
- [ ] 重命名 `universal-ui/StepCard` → `StrategyCard`
- [ ] 重命名 `script-builder/StepCard` → `ScriptStepCard`  
- [ ] 更新所有相关导入和引用
- [ ] 更新类型定义名称

### 中优先级 📌
- [ ] 统一组件命名规范文档
- [ ] 添加 ESLint 规则防止同名组件
- [ ] 更新组件文档和示例

### 低优先级 📝
- [ ] 重构相关测试文件
- [ ] 更新 Storybook 故事
- [ ] 检查其他潜在的命名冲突

## 🎨 **命名规范建议**

为避免类似问题，建议制定组件命名规范：

1. **按功能域命名**：`StrategyCard`, `ScriptStepCard`, `ContactCard`
2. **按模块前缀**：`UniversalStepCard`, `ScriptBuilderStepCard`  
3. **按用途后缀**：`StepCardStrategy`, `StepCardScript`

## 🚀 **影响评估**

**破坏性变更**：
- 需要更新所有使用这两个组件的地方
- 可能影响其他依赖组件

**收益**：
- 消除命名歧义
- 提高代码可读性
- 减少开发错误
- 便于后续维护

## 📖 **相关文件**

需要检查和更新的文件：
- 所有导入这两个组件的文件
- 相关的类型定义文件
- 测试文件
- 文档和注释

---

**结论**：这是一个需要立即解决的架构问题，建议优先进行语义化重命名以提高代码质量。