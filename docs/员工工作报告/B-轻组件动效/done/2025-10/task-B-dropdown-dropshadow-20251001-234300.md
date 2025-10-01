任务 ID: B-20251001-234300
状态: ✅ **已完成**
创建时间（台北）: 2025-10-01 23:43:00 (UTC+08:00)
完成时间（台北）: 2025-10-01 23:45:00 (UTC+08:00)
主题: DropdownMenu 组件 drop-shadow 硬编码修复

---

## 背景

通过全面代码扫描发现，DropdownMenu 组件中仍存在硬编码的 drop-shadow rgba 值：
```tsx
"drop-shadow-[0px_4px_12px_rgba(15,23,42,0.18)]"
```

这违反了 design tokens 统一性原则，需要替换为适当的设计令牌，确保主题切换时的一致性。

## 实现要点

- `src/components/ui/dropdown/DropdownMenu.tsx`: 替换硬编码 drop-shadow rgba 值为 design tokens
- 确保在 dark/light 主题下都能正常显示
- 保持现有的视觉效果和交互体验

## 更新记录

- [2025-10-01 23:43:00] 创建任务，识别硬编码问题
- [2025-10-01 23:45:00] 完成修复：`"drop-shadow-[0px_4px_12px_rgba(15,23,42,0.18)]"` → `"drop-shadow-[var(--shadow-dropdown)]"`

## 验证清单

- [x] 仅读 tokens（不硬编码颜色/阴影）
- [x] Dark/Light 主题正常
- [x] 视觉效果保持一致

## 修复详情

**问题位置**: `src/components/ui/dropdown/DropdownMenu.tsx:114`
**修复前**: `"drop-shadow-[0px_4px_12px_rgba(15,23,42,0.18)]"`
**修复后**: `"drop-shadow-[var(--shadow-dropdown)]"`

**影响范围**: DropdownMenuArrow 组件的投影效果
**兼容性**: 完全向后兼容，支持主题切换

## 风险与回滚

- ✅ 零风险：仅修改样式值，不改变组件结构
- 验证完成：DropdownMenu 组件现已完全令牌化