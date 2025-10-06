# 过滤器系统迁移计划

## 🎯 迁移目标

将所有组件从旧的 `visualFilter.ts` + `clickableHeuristics.ts` 系统迁移到新的 `ElementFilter.ts` 系统。

## 🔍 当前使用旧系统的文件

### 需要更新的文件列表
1. `UniversalPageFinderModal.tsx` - 主要页面查找器
2. `ElementList.tsx` - 元素列表组件  
3. `VisualElementView.tsx` - 可视化元素视图
4. `useFilteredVisualElements.ts` - 过滤钩子

### 相关类型文件
- `types/index.ts` - 包含 `VisualFilterConfig` 和 `defaultVisualFilterConfig`

## 📋 分步迁移计划

### 阶段1: 创建过渡适配器
创建适配器让新旧系统并存，确保功能不中断。

### 阶段2: 逐个文件迁移
按依赖关系从叶子节点开始迁移。

### 阶段3: 清理旧系统
移除旧文件和未使用的导入。

## 🔧 实施步骤

### 步骤1: 创建适配器
```typescript
// src/services/FilterAdapter.ts
// 提供新旧系统的适配接口
```

### 步骤2: 更新类型系统
```typescript
// 扩展新ElementFilter支持旧VisualFilterConfig格式
```

### 步骤3: 逐个迁移组件
1. `useFilteredVisualElements.ts` - 底层钩子
2. `ElementList.tsx` - 列表组件
3. `VisualElementView.tsx` - 视图组件  
4. `UniversalPageFinderModal.tsx` - 主组件

### 步骤4: 清理和验证
- 移除旧过滤器文件
- 更新所有导入
- 运行完整测试

## ⚡ 立即执行的安全清理

先清理确定不会影响功能的废弃文件：
- 测试和调试脚本
- 临时修复文件
- 已确认废弃的组件