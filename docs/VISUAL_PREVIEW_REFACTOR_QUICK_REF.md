# Visual-Preview 重构快速参考卡

## 📊 当前状态

✅ **已完成 (35%)**:
- 目录结构创建
- 类型定义迁移 (`types/index.ts`)
- 核心算法层 (4个文件 + index.ts)
- 工具层 (debug-helper)

⏳ **待完成**:
- Hooks层 (2个文件)
- 组件层 (6个文件)
- 主导出更新
- 清理遗留代码

---

## 🔥 下一步执行（复制粘贴命令）

### Step 1: 检查当前文件结构
```powershell
tree /F "D:\rust\active-projects\小红书\employeeGUI\src\modules\structural-matching\ui\components\visual-preview" /A
```

### Step 2: 查找需要更新的外部引用
```powershell
cd "D:\rust\active-projects\小红书\employeeGUI"
Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx | Select-String "FloatingVisualOverlay|useTreeVisualCoordination" -List | Select-Object -ExpandProperty Path
```

### Step 3: 手动迁移 Hooks (优先)
1. 复制 `floating-window/hooks/use-step-card-data.ts` → `hooks/use-structural-matching-step-data.ts`
2. 更新导入路径:
   - `../types` → `../types` ✓
   - `../utils/viewport-alignment` → `../core/structural-matching-viewport-alignment`
   - `../utils/element-bounds-corrector` → `../core/structural-matching-bounds-corrector`
   - `../utils/crop-debug-helper` → `../utils/structural-matching-debug-helper`

### Step 4: TypeScript 检查
```bash
npm run type-check
```

---

## 📝 命名速查表

| 层级 | 文件名模式 | 组件/函数名模式 |
|------|-----------|----------------|
| core/ | `structural-matching-xxx.ts` | `calculateXxx`, `xxxFunction` |
| components/ | `structural-matching-xxx.tsx` | `StructuralMatchingXxx` |
| hooks/ | `use-structural-matching-xxx.ts` | `useStructuralMatchingXxx` |
| utils/ | `structural-matching-xxx.ts` | `xxxHelper`, `xxxUtil` |

---

## 🎯 核心文件迁移路径图

```
floating-window/hooks/use-step-card-data.ts
  → hooks/use-structural-matching-step-data.ts
  → 导入: ../core/*, ../types/*

floating-window/components/floating-visual-window.tsx  
  → components/structural-matching-floating-window.tsx
  → 组件名: StructuralMatchingFloatingWindow
  → 导入: ../core/*, ../hooks/*, ../types/*

floating-visual-overlay-adapter.tsx
  → components/structural-matching-visual-overlay.tsx
  → 组件名: StructuralMatchingVisualOverlay
  → 导入: ./structural-matching-floating-window
```

---

## ⚡ 批量文本替换模式

在 VS Code 中全局搜索替换（重构完成后）:

```
查找: from ['"].*floating-window/utils/viewport-alignment['"]
替换: from '../core/structural-matching-viewport-alignment'

查找: from ['"].*floating-window/types['"]
替换: from '../types'

查找: FloatingVisualWindow(?!Props)
替换: StructuralMatchingFloatingWindow

查找: useStepCardData
替换: useStructuralMatchingStepData
```

---

## 📁 文件大小警报

迁移时检查这些文件是否超标：
- `use-step-card-data.ts` - ~323行 ⚠️  (接近300行阈值)
- `floating-visual-window.tsx` - ~389行 ⚠️  (接近450行阈值)

如果超标，需要进一步拆分。

---

## ✅ 快速验证清单

重构某个文件后立即检查：
- [ ] 文件名符合 `structural-matching-*` 模式
- [ ] 组件名/Hook名添加了 `StructuralMatching` 前缀
- [ ] 所有导入路径已更新（指向 core/, hooks/, types/）
- [ ] 文件头注释已更新
- [ ] `npm run type-check` 无错误
- [ ] 文件行数 < 450 行（组件）或 < 300 行（Hook）

---

**详细进度报告**: `docs/VISUAL_PREVIEW_REFACTOR_PROGRESS.md`
