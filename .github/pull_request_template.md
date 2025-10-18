# Pull Request

## 📝 变更概述

**变更类型**
- [ ] 🐛 Bug 修复
- [ ] ✨ 新功能
- [ ] 🔧 重构
- [ ] 📝 文档更新
- [ ] 🧪 测试改进
- [ ] 🎨 样式/UI 改进
- [ ] ⚡ 性能优化
- [ ] 🔄 事件系统修复

**目标模块（module）**
- [ ] `adb` - Android 设备管理
- [ ] `contact-import` - 联系人导入
- [ ] `prospecting` - 精准获客
- [ ] `script-builder` - 智能脚本构建
- [ ] `shared` - 共享组件

**受影响分层（layer）**
- [ ] `application` - 业务用例
- [ ] `domain` - 核心业务逻辑
- [ ] `services` - 外部服务
- [ ] `api` - API 调用
- [ ] `stores` - 状态管理
- [ ] `ui` - 界面组件
- [ ] `hooks` - React Hooks
- [ ] `pages` - 页面组件

**变更摘要（不超过 120 字）**
简洁描述主要变更内容...

## 🎯 相关Issue

Fixes #(issue编号)
Related to #(issue编号)

## 🔄 事件系统影响 (如果适用)

**是否影响事件路由？**
- [ ] 是 - 修改了事件监听器
- [ ] 是 - 更改了 jobId 绑定逻辑
- [ ] 是 - 修改了状态更新流程
- [ ] 否 - 不涉及事件系统

**如果影响事件系统，请说明:**
- 修改的事件类型: `[例如 ANALYSIS_PROGRESS, ANALYSIS_DONE]`
- 涉及的组件: `[例如 UnifiedSmartStepCard]`
- 状态流变更: `[例如 draft → analyzing → ready]`

## ✅ DDD 架构检查清单（必填）

- [ ] 新增/修改的每个文件，前三行"文件头注释"已填写且路径匹配
- [ ] 跨模块 import 均来自对方的 `src/modules/<m>/index.ts`（禁止直捣内部目录）
- [ ] 通过 `npm run lint && npm run type-check`
- [ ] 未在 `domain/` 中引入 UI/IO（api/services/hooks/pages/ui）
- [ ] 若涉及多个模块，已拆分为多个小 PR（或按提交块说明）
- [ ] 添加了模块前缀命名（易重名文件）
- [ ] 使用了正确的路径别名

## 🧪 测试清单

**运行的测试:**
- [ ] `npm run type-check` - TypeScript 类型检查
- [ ] `npm run lint` - ESLint 代码质量检查
- [ ] `npx playwright test` - E2E 测试
- [ ] `cargo test` - Rust 测试
- [ ] 事件路由专项测试 (如果适用)

**测试输出记录:**
```bash
# npm run type-check 输出：


# npm run lint 输出：


# npx playwright test 输出 (如果适用)：


# cargo test 输出 (如果适用)：


```

## 📋 变更详情

### 新增文件
- `路径/文件名.ts` - 简要说明

### 修改文件  
- `路径/文件名.ts` - 修改了什么

### 删除文件
- `路径/文件名.ts` - 删除原因

## 🔍 代码审查要点

**请审查者特别关注:**
- [ ] 事件路由逻辑正确性
- [ ] 状态管理一致性
- [ ] DDD 架构规范遵循
- [ ] 模块边界清晰
- [ ] 错误处理完整性
- [ ] 测试覆盖度

## ⚠️ 破坏性变更

**是否包含破坏性变更？**
- [ ] 否 - 向后兼容
- [ ] 是 - 包含破坏性变更

## 📸 截图/演示 (如果适用)
