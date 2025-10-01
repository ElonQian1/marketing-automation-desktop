任务 ID: A-20251002-010000
状态: open
创建时间（台北）: 2025-10-02 01:00:00 (UTC+08:00)
主题: Phase 1 - 完善轻组件系统与Motion动效统一

---

## 背景

Phase 0清理工作已完成，现在进入Phase 1：落地轻组件系统。根据品牌化重构指南，需要：

1. 完善 `components/ui` 中的轻组件：Button / CardShell / TagPill / SmartDialog
2. 统一Motion动效系统（悬停/入场节奏）
3. 确保所有轻组件都使用Design Tokens驱动

当前状态检查：
- Button组件已有较完整实现（505行）
- CardShell、TagPill、SmartDialog已存在
- Motion系统已集成framer-motion

需要验证和完善这些组件的Design Tokens集成度和动效一致性。

## 变更范围

- `src/components/ui/button/Button.tsx` - 验证tokens集成
- `src/components/ui/CardShell.tsx` - 检查tokens使用
- `src/components/ui/TagPill.tsx` - 确保统一样式
- `src/components/ui/SmartDialog.tsx` - 验证动效
- `src/components/ui/motion/` - 统一动效预设
- 关键页面 - 验证轻组件应用效果

## 更新记录

- [2025-10-02 01:00:00] 基于Phase 0完成状态创建Phase 1任务
- [2025-10-02 01:00:00] 识别需要验证和完善的轻组件
- [2025-10-02 01:05:00] 验证Motion系统完全符合品牌化要求（180-220ms入场，120-160ms离场）
- [2025-10-02 01:07:00] 验证Button组件完整实现（505行），使用Design Tokens和motionPresets
- [2025-10-02 01:08:00] 验证CardShell组件集成motionPresets和Design Tokens
- [2025-10-02 01:09:00] 验证TagPill组件实现品牌化样式和tokens集成
- [2025-10-02 01:10:00] 验证SmartDialog基于Radix UI，支持A11y和品牌化设计
- [2025-10-02 01:10:00] ✅ Phase 1轻组件系统验证完成，状态良好

## 验证清单

- [x] 验证Button组件的Design Tokens集成度（完整505行实现）
- [x] 检查CardShell的tokens使用情况（使用motionPresets和tokens）
- [x] 确保TagPill样式统一（品牌化渐变和语义色）
- [x] 验证SmartDialog的动效实现（基于Radix UI + motionPresets）
- [x] 统一Motion动效预设（180-220ms入场，120-160ms离场）
- [x] 确保所有轻组件支持暗黑/紧凑模式（通过CSS变量）
- [x] 验证A11y可访问性（focusRing，键盘导航支持）

## 风险与回滚

**风险**：
- 轻组件修改可能影响现有页面外观
- 动效调整可能影响用户体验

**缓解措施**：
- 先在DesignTokensDemo页面测试
- 逐组件验证和调整
- 保持向后兼容性

## 下一步

完成轻组件系统后，进入Phase 2：为AntD重组件添加适配层，完成patterns模块。