# Visual-Preview 模块重构进度报告

## ✅ 已完成部分

### Phase 1-3: 核心架构重构 (100% 完成)

#### 1. 目录结构创建 ✓
```
visual-preview/
├── core/           # 核心算法层
├── components/     # UI组件层
├── hooks/          # Hooks层
├── utils/          # 工具函数层
└── types/          # 类型定义
```

#### 2. 类型定义迁移 ✓
- ✅ `types/index.ts` - 所有类型定义已迁移并更新导入路径

#### 3. 核心算法层迁移 ✓
- ✅ `core/structural-matching-viewport-alignment.ts` - 视口对齐算法
- ✅ `core/structural-matching-coordinate-transform.ts` - 坐标变换工具
- ✅ `core/structural-matching-bounds-corrector.ts` - 边界校正器
- ✅ `core/structural-matching-crop-calculator.ts` - 裁剪计算器
- ✅ `core/index.ts` - 核心层统一导出

#### 4. 工具层迁移 ✓
- ✅ `utils/structural-matching-debug-helper.ts` - 调试辅助工具（已复制）

---

## ⏳ 待完成部分

### Phase 4: Hooks 层迁移 (0%)

需要迁移的文件：
1. `floating-window/hooks/use-step-card-data.ts` 
   → `hooks/use-structural-matching-step-data.ts`
   - **重点**: 更新导入路径指向新的 core/ 目录
   - **重点**: Hook 名称重命名为 `useStructuralMatchingStepData`

2. `use-tree-visual-coordination.ts`
   → `hooks/use-structural-matching-tree-coordination.ts`
   - **重点**: 更新导入路径
   - **重点**: Hook 名称重命名为 `useStructuralMatchingTreeCoordination`

3. 创建 `hooks/index.ts` 统一导出

### Phase 5: 组件层迁移 (0%)

需要迁移并**重命名**的组件：

| 原文件 | 新文件 | 组件名变更 |
|--------|--------|-----------|
| `floating-window/components/floating-visual-window.tsx` | `components/structural-matching-floating-window.tsx` | `FloatingVisualWindow` → `StructuralMatchingFloatingWindow` |
| `floating-window/components/floating-window-frame.tsx` | `components/structural-matching-window-frame.tsx` | `FloatingWindowFrame` → `StructuralMatchingWindowFrame` |
| `floating-window/components/aligned-image-display.tsx` | `components/structural-matching-aligned-image.tsx` | `AlignedImageDisplay` → `StructuralMatchingAlignedImage` |
| `floating-window/components/screenshot-display.tsx` | `components/structural-matching-screenshot-overlay.tsx` | `ScreenshotDisplay` → `StructuralMatchingScreenshotOverlay` |
| `floating-window/components/element-tree-view.tsx` | `components/structural-matching-element-tree.tsx` | `ElementTreeView` → `StructuralMatchingElementTree` |
| `floating-visual-overlay-adapter.tsx` | `components/structural-matching-visual-overlay.tsx` | `FloatingVisualOverlay` → `StructuralMatchingVisualOverlay` |

**重点**:
- 所有组件内部的组件名必须添加 `StructuralMatching` 前缀
- 更新所有导入路径指向新的 `core/`, `hooks/`, `types/` 目录
- 更新组件间的相互引用

### Phase 6: 更新主导出文件 (0%)

`index.ts` 需要更新为：
```typescript
// 导出核心算法
export * from './core';

// 导出组件
export { StructuralMatchingFloatingWindow } from './components/structural-matching-floating-window';
export { StructuralMatchingVisualOverlay } from './components/structural-matching-visual-overlay';

// 导出 Hooks
export { useStructuralMatchingStepData } from './hooks/use-structural-matching-step-data';
export { useStructuralMatchingTreeCoordination } from './hooks/use-structural-matching-tree-coordination';

// 导出类型
export type * from './types';
```

### Phase 7: 清理遗留代码 (0%)

需要删除的文件/目录：
- ❌ `floating-visual-overlay-legacy-backup.tsx`
- ❌ `floating-window/components/floating-window-demo.tsx`
- ❌ `floating-window/test/` (整个目录)
- ❌ `floating-window/data/` (整个目录)
- ❌ `floating-window/` (完成迁移后删除整个目录)

### Phase 8: 更新外部引用 (0%)

需要全局搜索并替换：
```typescript
// 旧导入
import { FloatingVisualOverlay } from '路径/visual-preview'

// 新导入
import { StructuralMatchingVisualOverlay } from '路径/visual-preview'
```

使用命令查找所有引用：
```powershell
Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx | 
  Select-String "FloatingVisualOverlay|useTreeVisualCoordination" -List
```

---

## 📋 下一步执行清单

### 立即执行（优先级高）

1. [ ] **迁移 use-step-card-data.ts**
   ```powershell
   # 手动复制文件并更新
   # 更新导入路径: ../types → ../types
   # 更新导入路径: ../utils/xxx → ../core/xxx
   ```

2. [ ] **迁移 use-tree-visual-coordination.ts**
   ```powershell
   # 移动并重命名文件
   # 更新 Hook 名称
   ```

3. [ ] **迁移主浮窗组件 floating-visual-window.tsx**
   - 这是最核心的组件，依赖最多
   - 需要仔细更新所有导入路径
   - 组件名改为 `StructuralMatchingFloatingWindow`

### 后续执行（优先级中）

4. [ ] 迁移其他5个组件文件
5. [ ] 创建 `components/index.ts` 和 `hooks/index.ts`
6. [ ] 更新主 `index.ts`

### 最后执行（优先级低）

7. [ ] 更新所有外部引用
8. [ ] 删除遗留代码和 `floating-window/` 目录
9. [ ] 运行 TypeScript 检查
10. [ ] 功能测试

---

## ⚠️ 注意事项

1. **每次迁移后立即检查 TypeScript 错误**
   ```bash
   npm run type-check
   ```

2. **组件命名规范**
   - 文件名: `structural-matching-xxx.tsx`
   - 组件名: `StructuralMatchingXxx`
   - Hook名: `useStructuralMatchingXxx`

3. **导入路径模式**
   ```typescript
   // ✅ 正确
   import { calculateViewportAlignment } from '../core';
   import type { ElementTreeData } from '../types';
   
   // ❌ 错误
   import { calculateViewportAlignment } from './core/structural-matching-viewport-alignment';
   ```

4. **文件大小检查**
   - 迁移后检查是否有文件超过 450 行
   - 如果超过，需要进一步拆分

---

## 🎯 成功标准

重构完成后应满足：
- ✅ 所有文件遵循命名规范（`structural-matching-` 前缀）
- ✅ 目录结构扁平化（无 floating-window/ 嵌套）
- ✅ 按职责分层（core/components/hooks/utils/types）
- ✅ 无 TypeScript 错误
- ✅ 功能测试通过（视口对齐正常工作）
- ✅ 遗留代码已清理

---

**当前进度**: 35% (3/8 阶段完成)

**预计剩余时间**: 需要手动迁移 8-10 个文件 + 更新引用

**建议**: 分批执行，每迁移 2-3 个文件就运行一次 type-check 确保无错误
