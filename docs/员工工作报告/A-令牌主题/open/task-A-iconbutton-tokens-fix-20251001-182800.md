# 任务 A: IconButton 设计令牌合规性修复

**任务ID**: A-20251001-182800  
**状态**: open  
**创建时间（台北）**: 2025-10-01 18:28:00 (UTC+08:00)  
**主题**: 修复 IconButton 组件的 Design Tokens 集成问题

---

## 背景

IconButton 组件存在多个设计令牌相关的编译错误：
- 类型不匹配问题：size 和 variant 枚举值不一致
- 缺少正确的 Ant Design 类型导入
- CVA 变体系统与实际使用不匹配
- 主组件导出缺失

## 变更范围

- `src/components/ui/buttons/IconButton.tsx`（类型系统修复）
- 确保符合 Design Tokens 架构规范
- 统一尺寸和变体枚举值
- 修复导出问题

## 更新记录

- [2025-10-01 18:28:00] 任务创建，发现 IconButton 设计令牌不合规问题

## 验证清单

- [ ] 消除所有 TypeScript 编译错误
- [ ] 尺寸枚举统一（sm/md/lg）
- [ ] 变体枚举统一（solid/soft/outline/ghost）
- [ ] 正确导出所有组件变体
- [ ] 符合 Design Tokens 架构规范

## 风险与回滚

风险：IconButton 是基础组件，修改可能影响其他使用方
回滚：通过 git 恢复到修改前状态

## 下一步

修复完成后，验证整个 UI 组件库的编译状态