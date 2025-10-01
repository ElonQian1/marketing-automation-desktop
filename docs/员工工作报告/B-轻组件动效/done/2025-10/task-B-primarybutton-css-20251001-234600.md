任务 ID: B-20251001-234600
状态: ✅ **已完成**
创建时间（台北）: 2025-10-01 23:46:00 (UTC+08:00)
完成时间（台北）: 2025-10-01 23:48:00 (UTC+08:00)
主题: PrimaryButton 组件 CSS 硬编码修复

---

## 背景

通过全面代码扫描发现，PrimaryButton 组件中仍存在多个硬编码的 CSS rgba 阴影值：
```css
box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
```

这违反了 design tokens 统一性原则，需要替换为适当的设计令牌，确保主题切换时的一致性。

## 实现要点

- `src/components/ui/buttons/PrimaryButton.tsx`: 替换硬编码 CSS rgba 阴影值为 design tokens
- 确保在 dark/light 主题下都能正常显示
- 保持现有的视觉效果和交互体验

## 更新记录

- [2025-10-01 23:46:00] 创建任务，识别硬编码问题
- [2025-10-01 23:48:00] 完成修复：所有硬编码CSS阴影值替换为design tokens
- [2025-10-01 23:50:00] 额外修复：硬编码渐变色 `linear-gradient(135deg, #3b82f6, #2563eb)` → `linear-gradient(135deg, var(--brand), var(--brand-700))`

## 验证清单

- [x] 仅读 tokens（不硬编码颜色/阴影）
- [x] Dark/Light 主题正常
- [x] 视觉效果保持一致

## 修复详情

**修复前**: 4个硬编码CSS值
- `box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);` → `box-shadow: var(--shadow-brand-sm);`
- `box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);` → `box-shadow: var(--shadow-brand-md);`
- `box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);` → `box-shadow: var(--shadow-brand-lg);`
- `linear-gradient(135deg, #3b82f6, #2563eb)` → `linear-gradient(135deg, var(--brand), var(--brand-700))`

**影响范围**: PrimaryButton 组件的默认、hover、elevated 状态阴影效果
**兼容性**: 完全向后兼容，支持主题切换

## 风险与回滚

- ✅ 零风险：仅修改样式值，不改变组件结构
- 验证完成：PrimaryButton 组件现已完全令牌化