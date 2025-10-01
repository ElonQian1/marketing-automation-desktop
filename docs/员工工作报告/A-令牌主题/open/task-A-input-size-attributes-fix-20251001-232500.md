任务 ID: A-20251001-232500
状态: open
创建时间（台北）: 2025-10-01 23:25:00 (UTC+08:00)
主题: 修复Design Tokens UI组件size属性不匹配错误

---

## 背景

发现BrandShowcasePage.backup.tsx中的Input组件使用了旧的size属性值，导致TypeScript编译错误：

错误详情：
- size="small" 应为 size="sm"
- size="medium" 应为 size="md"  
- size="large" 应为 size="lg"

这是Design Tokens重构后API变更导致的，需要统一为新的size标准。

## 变更范围

- src/pages/brand-showcase/BrandShowcasePage.backup.tsx（修复Input组件size属性）

## 更新记录

- [2025-10-01 23:25:00] 识别backup文件中的size属性不匹配
- [2025-10-01 23:25:00] 分析新的size标准：sm/md/lg
- [2025-10-01 23:28:00] 修复完成：small→sm, medium→md, large→lg
- [2025-10-01 23:28:00] 验证成功：项目总错误从31减至27个

## 验证清单

- [ ] 修复small→sm, medium→md, large→lg
- [ ] TypeScript编译通过
- [ ] 确保组件显示正确

## 风险与回滚

风险：极低 - 仅属性名修改，backup文件
回滚：直接恢复原属性值

## 下一步

处理其他TypeScript错误，优先UI组件相关