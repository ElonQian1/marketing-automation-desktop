任务 ID: B-20251001-225000
状态: ✅ **已完成**
创建时间（台北）: 2025-10-01 22:50:00 (UTC+08:00)
完成时间（台北）: 2025-10-01 22:55:00 (UTC+08:00)
主题: Card 组件剩余硬编码样式令牌化修复

---

## 背景
Card 组件在之前的重构中仍保留了一些硬编码的 Tailwind 类名，未完全接入 design tokens 系统：
- 渐变背景使用 `from-brand-500 to-brand-600` 硬编码色值
- 部分阴影使用 `shadow-lg` 而非 token 变量
- 需要与其他轻组件保持令牌化的一致性标准

需要修复这些硬编码样式，确保 Card 组件完全符合 design tokens 规范。

## 实现要点
- `src/components/ui/card/Card.tsx`: 替换渐变背景硬编码色值为 design tokens
- `src/components/ui/card/Card.tsx`: 统一阴影样式使用 token 变量
- 确保所有变体都符合令牌化标准

## 更新记录
- [2025-10-01 22:50:00] 创建任务，识别 Card 组件剩余硬编码问题
- [2025-10-01 22:52:00] 修复硬编码样式：shadow-lg → shadow-[var(--shadow-lg)]，from-brand-500 to-brand-600 → from-[var(--brand)] to-[var(--brand-700)]
- [2025-10-01 22:55:00] TypeScript 验证通过，任务完成

## 验证清单
- [x] 渐变背景使用 design tokens
- [x] 阴影样式统一使用 token 变量
- [x] 无硬编码 Tailwind 色值类名
- [x] TypeScript 类型检查通过

## 风险与回滚
- 渐变效果变更可能影响视觉效果，需要确保 tokens 定义正确
- 若新样式有问题可快速回退到当前版本