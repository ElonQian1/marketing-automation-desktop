# Grid Layout Hooks 模块

这个模块包含了联系人导入工作台的网格布局相关 React Hooks，专注于解决复杂的拖拽交互和布局管理问题。

## 📁 文件结构

```
hooks/
├── index.ts                      # 导出聚合文件
├── useDragConflictResolver.ts    # 🔥 拖拽冲突解决器 (新增)
├── useDragConflictResolver.test.ts # 类型验证测试
├── useGridDragGuards.ts          # 网格拖拽保护器
├── useGridLayout.ts              # 主网格布局 Hook (位于上级目录)
├── DRAG_CONFLICT_SOLUTION.md     # 拖拽冲突解决方案文档
└── 其他拖拽相关 Hooks...
```

## 🎯 核心功能

### 1. 拖拽冲突解决器 (`useDragConflictResolver`)

**用途**: 解决表格列宽拖拽与页面其他拖拽事件的冲突问题

**特点**:
- ✅ 无侵入式设计，无需修改现有代码
- ✅ 智能检测拖拽冲突场景
- ✅ 自动优先保护表格列宽拖拽
- ✅ 支持运行时监控和调试

**使用示例**:
```typescript
import { useDragConflictResolver } from './hooks/useDragConflictResolver';

const WorkbenchComponent = () => {
  // 基础使用
  const conflictResolver = useDragConflictResolver();
  
  // 高级配置
  const advancedResolver = useDragConflictResolver({
    autoFix: true,
    debug: process.env.NODE_ENV === 'development',
    priority: 'table-resize',
    detectInterval: 1000
  });

  return (
    <div>
      {/* 你的组件内容 */}
    </div>
  );
};
```

### 2. 网格拖拽保护器 (`useGridDragGuards`)

**用途**: 提供细粒度的拖拽事件保护机制

**特点**:
- 事件捕获阶段拦截
- 针对特定 DOM 元素的保护
- 动态内容监控

### 3. 其他拖拽相关 Hooks

- `useDraggable.ts` - 基础拖拽功能
- `useDraggableOptimized.ts` - 性能优化版拖拽
- `useSmartDrag.ts` - 智能拖拽策略
- `useHandleDrag.ts` - 拖拽手柄处理
- `useHandleOnlyDrag.ts` - 仅手柄拖拽

## 🔧 架构设计

### 模块化原则
- **单一职责**: 每个 Hook 专注解决特定的拖拽问题
- **可组合性**: Hook 之间可以组合使用
- **无侵入性**: 不需要修改现有组件结构

### 代码质量控制
- **文件大小**: 每个文件不超过 500 行
- **类型安全**: 完整的 TypeScript 类型定义
- **性能优化**: 使用 useCallback、useMemo 等优化手段

### 依赖管理
- **最小依赖**: 仅依赖 React 核心 API
- **向下兼容**: 兼容现有的 @dnd-kit 和其他拖拽库
- **渐进增强**: 功能可选启用，不影响现有逻辑

## 📚 使用指南

### 1. 导入方式

```typescript
// 推荐：从 hooks index 统一导入
import { useDragConflictResolver, useGridLayout } from './hooks';

// 或者直接导入特定 Hook
import { useDragConflictResolver } from './hooks/useDragConflictResolver';
```

### 2. 配置选项

所有 Hook 都支持可选配置，提供合理的默认值：

```typescript
// 最简使用
const resolver = useDragConflictResolver();

// 自定义配置
const resolver = useDragConflictResolver({
  autoFix: true,        // 是否自动修复冲突
  debug: false,         // 是否启用调试日志
  priority: 'table-resize', // 拖拽优先级策略
  detectInterval: 1000  // 冲突检测间隔(ms)
});
```

### 3. 监控和调试

```typescript
const { detectedConflicts, isMonitoring } = useDragConflictResolver({
  debug: true
});

// 查看检测到的冲突类型
console.log('冲突类型:', detectedConflicts);
// 输出: ['table-resize-vs-dnd', 'file-drop-vs-table-resize']

// 监控状态
console.log('监控状态:', isMonitoring);
```

## 🚀 最佳实践

### 1. 在主工作台组件中使用

```typescript
// ContactImportWorkbench.tsx
export const ContactImportWorkbench: React.FC = () => {
  // 在组件顶部启用冲突解决器
  const conflictResolver = useDragConflictResolver({
    autoFix: true,
    priority: 'table-resize'
  });

  // ... 其他组件逻辑
};
```

### 2. 性能优化建议

- 在生产环境关闭 debug 模式
- 根据实际需要调整检测间隔
- 仅在有拖拽功能的组件中使用

### 3. 错误处理

所有 Hook 都内置了错误边界处理，确保即使发生异常也不会影响主要功能。

## 📝 维护说明

### 新增 Hook 规范

1. 文件命名使用 `use` 前缀
2. 提供完整的 TypeScript 类型定义
3. 包含使用示例和文档注释
4. 遵循单一职责原则
5. 文件大小控制在 500 行以内

### 版本兼容性

- 主版本变更时需要更新导出文件
- 向后兼容现有 API
- 废弃功能需要提供迁移指南

---

**维护者**: GitHub Copilot  
**最后更新**: 2024年12月  
**版本**: v1.0.0