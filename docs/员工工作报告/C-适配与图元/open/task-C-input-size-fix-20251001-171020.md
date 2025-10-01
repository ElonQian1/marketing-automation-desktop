任务 ID: C-20251001-171020
状态: open
创建时间（台北）: 2025-10-01 17:10:20 (UTC+08:00)
主题: BrandShowcasePage.backup 输入框尺寸适配修正

---

## 问题描述
- `src/pages/brand-showcase/BrandShowcasePage.backup.tsx` 中使用了旧的输入框尺寸值 `"small"/"medium"/"large"`
- 当前 `Input` 组件仅支持 `"sm"/"md"/"lg"` 标准尺寸
- 需统一适配为标准尺寸规范，确保演示页面正常运行

## 验证入口
- `src/pages/brand-showcase/BrandShowcasePage.backup.tsx`
- 输入框组件规范 `src/components/ui/forms/Input.tsx`

## 校验清单
- [x] 所有 `size="small"` 改为 `size="sm"`
- [x] 所有 `size="medium"` 改为 `size="md"`  
- [x] 所有 `size="large"` 改为 `size="lg"`
- [ ] type-check 通过，无输入框尺寸相关错误
- [x] 更新相关文档/任务记录

## 记录与结论
- [2025-10-01 17:10:20] type-check 发现 BrandShowcasePage.backup 中输入框尺寸不匹配，需要统一适配。
- [2025-10-01 17:14:39] 检查发现 BrandShowcasePage.backup.tsx 中输入框尺寸已经是正确的 sm/md/lg 格式，问题可能已在早期修复，无需额外更改。

## 风险与回滚
- 修改尺寸值时需保持演示效果一致；若出现显示异常，可暂时禁用相关页面或恢复旧值。