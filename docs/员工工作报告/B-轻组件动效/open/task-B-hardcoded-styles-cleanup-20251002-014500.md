任务 ID: B-20251002-014500
状态: open
创建时间（台北）: 2025-10-02 01:45:00 (UTC+08:00)
主题: 轻组件硬编码样式清理 - Design Tokens 完全迁移

---

## 背景

通过硬编码检测脚本发现当前轻组件库中仍存在81个ERROR级硬编码问题，主要涉及：
- **TagPill组件**: 16个硬编码颜色值（#ffffff, #000000等）
- **Card组件**: 8个硬编码阴影和边框值
- **IconButton组件**: 12个硬编码颜色值
- **其他组件**: 45个各类硬编码样式问题

这些硬编码问题阻碍了主题切换功能，与员工B轻组件令牌化标准不符。

## 实现要点

### 1. TagPill组件修复
- `src/components/ui/tag-pill/TagPill.tsx`: 将所有硬编码颜色替换为design tokens
- 重点修复: `#ffffff` → `var(--text-contrast)`, `#000000` → `var(--text-primary)`

### 2. Card组件修复  
- `src/components/ui/card/Card.tsx`: 阴影和边框token化
- `src/components/ui/card/CardShell.tsx`: 统一使用`var(--shadow-*)`和`var(--border-*)`

### 3. IconButton组件修复
- `src/components/ui/buttons/IconButton.tsx`: 颜色system完全token化
- 确保所有tone变体使用正确的brand/neutral/success等tokens

### 4. 全局验证
- 运行检测脚本确保ERROR数量降至0
- 验证Dark/Light模式切换正常
- 确保所有组件视觉一致性

## 变更范围

- `src/components/ui/tag-pill/TagPill.tsx`（硬编码颜色修复）
- `src/components/ui/card/Card.tsx`（阴影边框token化）
- `src/components/ui/card/CardShell.tsx`（样式token化）
- `src/components/ui/buttons/IconButton.tsx`（颜色系统修复）
- 其他检出的硬编码文件

## 更新记录

- [2025-10-02 01:45:00] 创建任务，识别81个ERROR级硬编码问题
- [2025-10-02 01:45:00] 分析主要问题集中在TagPill、Card、IconButton组件

## 验证清单

- [ ] TagPill组件硬编码颜色修复（16个问题）
- [ ] Card/CardShell组件阴影边框token化（8个问题）
- [ ] IconButton组件颜色系统修复（12个问题）
- [ ] 其他组件硬编码问题修复（45个问题）
- [ ] 硬编码检测脚本验证：ERROR数量=0
- [ ] Dark/Light模式切换测试
- [ ] TypeScript编译通过
- [ ] 组件视觉回归测试

## 风险与回滚

风险：中等 - 大量样式修改可能影响视觉效果
回滚：Git提交节点保存，可快速回滚
测试：逐组件修复，分步验证

## 下一步

完成硬编码修复后，更新轻组件质量报告，确保100%符合Design Tokens标准