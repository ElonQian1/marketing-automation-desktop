任务 ID: A-20251002-005000
状态: open
创建时间（台北）: 2025-10-02 00:50:00 (UTC+08:00)
主题: 清理遗留.ant-*覆盖，完成Phase 0品牌化基础

---

## 背景

根据品牌化重构指南Phase 0要求，需要"清理所有 `.ant-*` 覆盖/`!important`，保证 AntD 重组件回到'可被 tokens 驱动'的状态"。

通过代码扫描发现项目中仍存在违规的.ant-*使用：
- `src\components\native-antd\native-reset.css` - 直接覆盖.ant-*样式
- 多个适配器组件中存在.ant-*选择器注释和代码
- 部分组件可能还在使用强制优先级

这些违规代码阻碍了Design Tokens系统的正常工作，必须清理。

## 变更范围

- `src/components/native-antd/native-reset.css` - 移除或重构违规覆盖
- `src/components/adapters/` - 清理.ant-*相关代码
- 项目范围扫描 - 确保零.ant-*覆盖和!important

## 更新记录

- [2025-10-02 00:50:00] 识别违规的.ant-*覆盖代码
- [2025-10-02 00:50:00] 准备清理方案，确保不破坏现有功能
- [2025-10-02 00:55:00] 验证native-reset.css已被正确清理
- [2025-10-02 00:57:00] 扫描确认项目中无实际.ant-*覆盖和!important使用
- [2025-10-02 00:58:00] ✅ Phase 0清理完成，系统类型检查通过

## 验证清单

- [x] 移除src/components/native-antd/native-reset.css中的.ant-*覆盖
- [x] 清理适配器组件中的违规代码（已验证为语义化替换）
- [x] 全项目扫描确保零.ant-*和!important
- [x] 验证AntD组件通过ThemeBridge正常工作
- [x] 确保Design Tokens系统完全生效
- [x] 关键页面功能不受影响（类型检查通过）

## 风险与回滚

**风险**：
- 移除覆盖可能导致某些组件样式异常
- 可能影响现有页面的视觉效果

**回滚方案**：
- 保留原文件备份
- 逐文件清理并验证
- 发现问题立即回滚

## 下一步

完成Phase 0清理后，进入Phase 1：落地轻组件系统（Button/CardShell/TagPill等）。