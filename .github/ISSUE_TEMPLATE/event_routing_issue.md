---
name: Event Routing Issue / 事件路由问题
about: 专门用于报告事件系统和状态同步问题
title: '[EVENT] '
labels: ['event-system', 'bug', 'needs-investigation']
assignees: ''
---

## 🔄 事件路由问题报告

**问题类型**
- [ ] 前端按钮状态不更新
- [ ] 后端事件未触发
- [ ] jobId 路由错误
- [ ] 状态同步失败
- [ ] 事件监听器未注册
- [ ] 其他事件系统问题

## 📝 问题详情

**简要描述**
清晰描述事件路由相关的问题。

**涉及的组件**
- [ ] UnifiedSmartStepCard
- [ ] UnifiedCompactStrategyMenu  
- [ ] useIntelligentAnalysisWorkflow
- [ ] useSmartStrategyAnalysis
- [ ] UnifiedAnalysisEventService
- [ ] StepCardStore
- [ ] 其他: ___________

## 🔍 事件流程信息

**预期事件流程:**
1. 触发分析 → `ANALYSIS_PROGRESS` → 状态更新为 'analyzing'
2. 分析进行中 → 多次 `ANALYSIS_PROGRESS` → 进度更新
3. 分析完成 → `ANALYSIS_DONE` → 状态更新为 'ready'

**实际事件流程:**
1. 
2. 
3. 

## 🎯 关键数据

**JobId 信息:**
- JobId: `[例如: job_1234567890]`
- JobId 是否正确绑定到 StepCard: [ ] 是 [ ] 否 [ ] 不确定

**事件详情:**
```json
{
  "eventType": "ANALYSIS_PROGRESS/ANALYSIS_DONE",
  "payload": {
    "jobId": "job_xxx",
    "progress": 50,
    "status": "analyzing"
  }
}
```

**组件状态快照:**
```javascript
// StepCard 状态
{
  id: "card_xxx",
  jobId: "job_xxx", 
  status: "analyzing", // draft/analyzing/ready
  progress: 50
}
```

## 🧪 调试信息

**浏览器控制台日志:**
```
[UnifiedAnalysisEventService] 注册事件监听器...
[StepCardStore] 更新卡片状态: card_xxx -> analyzing
[EVENT] ANALYSIS_PROGRESS: job_xxx, progress: 50%
```

**E2E 测试结果:**
```bash
npx playwright test event-routing-fix
# 粘贴测试输出
```

**相关的 Tauri 事件日志:**
```
粘贴 Rust 后端的事件发送日志
```

## 🔧 重现步骤

**详细重现步骤:**
1. 打开智能分析页面
2. 选择特定的分析策略
3. 点击"开始分析"按钮
4. 观察按钮状态变化
5. 查看后端分析状态
6. 注意何时出现状态不同步

## 🏗️ 架构上下文

**涉及的架构层:**
- [ ] UI Layer (组件状态)
- [ ] Application Layer (用例逻辑)  
- [ ] Service Layer (事件服务)
- [ ] Store Layer (状态管理)

**模块间交互:**
- [ ] prospecting ↔ script-builder
- [ ] 跨模块事件传递
- [ ] 单模块内部事件

## 💡 可能的原因

请勾选您认为可能的原因：

- [ ] jobId 绑定丢失
- [ ] 事件监听器未正确注册
- [ ] 状态更新函数未调用
- [ ] React 组件重渲染问题
- [ ] Tauri 事件发送失败
- [ ] 异步竞态条件
- [ ] 事件监听器重复注册
- [ ] 组件卸载时未清理监听器

## 🛠️ 尝试过的解决方案

请列出您已经尝试过的解决方法：

- [ ] 清除浏览器缓存
- [ ] 重启开发服务器
- [ ] 检查 jobId 值
- [ ] 手动触发状态更新
- [ ] 添加额外的日志
- [ ] 其他: ___________

## 📋 相关代码片段

**相关的代码位置:**
```typescript
// 粘贴相关的代码片段
// 例如：事件监听器注册、状态更新逻辑等
```

## ✅ 检查清单

- [ ] 已确认 jobId 正确生成和传递
- [ ] 已检查事件监听器注册状态  
- [ ] 已验证状态更新函数被调用
- [ ] 已检查浏览器控制台错误
- [ ] 已运行相关的 E2E 测试
- [ ] 已添加必要的调试日志

## 🎯 期望的帮助

请说明您希望获得什么样的帮助：

- [ ] 代码审查
- [ ] 架构建议
- [ ] 调试协助
- [ ] 测试策略
- [ ] 其他: ___________