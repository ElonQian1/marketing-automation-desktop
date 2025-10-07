# 已清理的冗余文件

为了保持代码架构的整洁和避免重复实现，以下文件已被标记为废弃或已移除：

## 废弃的组件文件

### ArchitectureDiagram_Legacy.tsx (原 ArchitectureDiagram.tsx)
- **状态**: 已重命名为 Legacy 版本
- **原因**: 959行的巨石文件，包含重复的业务逻辑
- **替代方案**: 使用重构后的 `ArchitectureDiagram.tsx`

### ArchitectureDiagram_v2.tsx
- **状态**: 计划移除
- **原因**: 342行的中间实现版本，功能已合并到主实现
- **替代方案**: 重构后的主组件已采用其hooks架构模式

## 重构后的架构

### 新的主组件
- `ArchitectureDiagram.tsx` - 使用 hooks + 服务层的纯UI组件

### 服务层
- `hierarchyBuilder.ts` - 层级构建业务逻辑
- `xmlStructureParser.ts` - XML结构解析
- `elementAnalyzer.ts` - 元素分析服务

### Hooks层
- `useArchitectureTree.ts` - 架构树状态管理
- `useElementVisualization.ts` - 元素可视化逻辑

### 类型统一
- `/src/types/hierarchy.ts` - 统一的类型定义文件

## 清理计划

1. ✅ 已重命名原始组件为 Legacy
2. ✅ 已将重构组件设为主实现
3. 🔄 计划移除 ArchitectureDiagram_v2.tsx
4. 🔄 清理无用的 import 引用
5. 🔄 更新相关的测试文件

## 向后兼容性

为保持向后兼容，Legacy 文件暂时保留，但：
- 不应在新代码中使用
- 将在下一个主版本中完全移除
- 所有新功能仅在重构后的组件中实现