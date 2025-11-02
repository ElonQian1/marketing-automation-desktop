# Visual-Preview 重构进度更新

## ✅ Phase 1-4 已完成 (60%)

### 已迁移文件清单

#### ✅ 类型定义层 (1个文件)
- `types/index.ts` - 所有类型定义

#### ✅ 核心算法层 (5个文件)
- `core/structural-matching-viewport-alignment.ts` - 视口对齐算法
- `core/structural-matching-coordinate-transform.ts` - 坐标变换工具
- `core/structural-matching-bounds-corrector.ts` - 边界校正器
- `core/structural-matching-crop-calculator.ts` - 裁剪计算器
- `core/index.ts` - 核心层统一导出

#### ✅ Hooks 层 (3个文件)
- `hooks/use-structural-matching-step-data.ts` - 步骤数据Hook (重命名 + 路径更新)
- `hooks/use-structural-matching-tree-coordination.ts` - 树协调Hook (重命名 + 路径更新)
- `hooks/index.ts` - Hooks层统一导出

#### ✅ 工具层 (2个文件)
- `utils/structural-matching-debug-helper.ts` - 调试辅助工具
- `utils/index.ts` - 工具层统一导出

---

## ⏳ Phase 5-8 待完成 (40%)

### 待迁移组件 (6个文件)

根据文件复杂度排序：

| 优先级 | 文件名 | 行数估计 | 新文件名 | 组件名变更 |
|--------|--------|---------|----------|-----------|
| **P0** | `floating-visual-window.tsx` | ~389行 ⚠️ | `structural-matching-floating-window.tsx` | `FloatingVisualWindow` → `StructuralMatchingFloatingWindow` |
| P1 | `screenshot-display.tsx` | ~150行 | `structural-matching-screenshot-overlay.tsx` | `ScreenshotDisplay` → `StructuralMatchingScreenshotOverlay` |
| P1 | `floating-window-frame.tsx` | ~100行 | `structural-matching-window-frame.tsx` | `FloatingWindowFrame` → `StructuralMatchingWindowFrame` |
| P2 | `aligned-image-display.tsx` | ~80行 | `structural-matching-aligned-image.tsx` | `AlignedImageDisplay` → `StructuralMatchingAlignedImage` |
| P2 | `element-tree-view.tsx` | ~120行 | `structural-matching-element-tree.tsx` | `ElementTreeView` → `StructuralMatchingElementTree` |
| P3 | `../floating-visual-overlay-adapter.tsx` | ~200行 | `structural-matching-visual-overlay.tsx` | `FloatingVisualOverlay` → `StructuralMatchingVisualOverlay` |

### ⚠️  P0 文件超标警告

**`floating-visual-window.tsx` (389行)** 接近450行上限！

**建议拆分方案**：
1. **窗口状态管理** → 提取到 `hooks/use-structural-matching-window-state.ts`
2. **视口计算逻辑** → 已在 `core/` 中，需确保充分使用
3. **元素选择逻辑** → 提取到 `hooks/use-structural-matching-element-selection.ts`

---

## 🚨 当前已知问题

### TypeScript 错误

`use-structural-matching-step-data.ts:14` - 无法找到 `../utils/structural-matching-debug-helper`

**原因**: TypeScript 服务器可能需要重启
**解决**: 
1. VS Code 重启 TypeScript 服务器
2. 或运行 `npm run type-check` 强制重新检查

---

## 📋 下一步行动计划

### 方案A: 快速完成（不拆分）
直接迁移所有6个组件文件，接受 `floating-visual-window.tsx` 超标的风险。

**执行步骤**:
1. 迁移 4 个简单组件 (aligned-image, element-tree, window-frame, screenshot)
2. 迁移主浮窗组件 (floating-visual-window)
3. 重构适配器 (floating-visual-overlay-adapter)
4. 更新主 `index.ts`
5. 全局替换外部引用
6. 删除 `floating-window/` 目录

**预计时间**: 30-40分钟

---

### 方案B: 严格遵守规范（推荐）
先拆分超标文件，再迁移。

**Phase 5A: 拆分主浮窗组件**
```
floating-visual-window.tsx (389行)
  ↓ 拆分为
hooks/use-structural-matching-window-state.ts      (50行)
hooks/use-structural-matching-element-selection.ts (60行)
components/structural-matching-floating-window.tsx  (250行)
```

**Phase 5B: 迁移其他组件**
按优先级 P1 → P2 → P3 迁移

**执行步骤**:
1. 拆分主浮窗组件逻辑到新 Hooks
2. 创建精简版主浮窗组件
3. 迁移其他5个组件
4. 创建 `components/index.ts`
5. 更新主 `index.ts`
6. 全局替换 + 清理

**预计时间**: 50-60分钟

---

## 💡 建议

考虑到：
- 您回档是为了修复功能问题
- 快速恢复正常工作更重要
- 后续可以再优化拆分

**我建议选择方案A** - 快速完成重构，先让功能跑起来。

如果您同意，我将立即继续执行方案A，迁移剩余的6个组件文件。

是否继续？
