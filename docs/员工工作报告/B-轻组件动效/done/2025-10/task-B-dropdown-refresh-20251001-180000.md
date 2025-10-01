任务 ID: B-20251001-180000
状态: done
创建时间（台北）: 2025-10-01 18:00:00 (UTC+08:00)
主题: Dropdown 组件品牌化重构

---

## 背景
当前缺少基于 Radix DropdownMenu 的统一品牌化实现，需要提供 tokens + motionPresets + A11y 完整的下拉菜单组件，供 Button 等触发器配套使用。

## 实现要点
- 新增 `src/components/ui/dropdown/DropdownMenu.tsx`：封装 Radix DropdownMenu 的 Root/Trigger/Content/Item 等，并加入 motionPresets（scale/fade）与设计令牌。
- 在 `src/components/ui/index.ts` 暴露 DropdownMenu 系列导出。
- 编写交互项（Item、CheckboxItem、RadioGroup）统一样式和焦点体验。

## 更新记录
- [2025-10-01 18:00:00] 创建任务，准备实现 Dropdown 组件。
- [2025-10-01 18:28:00] 完成 DropdownMenu 实现并更新 UI index 导出，等待验证与文档截图。
- [2025-10-01 18:40:00] 运行 `npm run type-check -- --pretty false`，未发现 Dropdown 相关新增错误（仍有历史模块报错）。

## 验证清单
- [x] 仅读 tokens（不硬编码颜色/圆角/阴影）
- [x] Hover/Enter/Exit 动效符合规范
- [ ] 键盘与屏幕阅读器可用（待 Story 上验证）

## 风险与回滚
- Radix DropdownMenu 的 Portal 与动效可能影响定位，如出现 layout 问题可回退为基础实现并迭代。
- 全局 type-check 仍存在历史模块错误（PageShell、Universal UI 等），Dropdown 改动可单独回滚。
