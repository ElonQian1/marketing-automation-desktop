# ⚠️ V3智能策略系统 - 关键配置说明

## 🚨 重要：避免坐标兜底问题

此项目已升级到V3智能策略系统，解决"已关注"按钮误识别为"关注"的问题。

### ✅ 关键配置检查

**文件**: `src/infrastructure/gateways/StepExecutionGateway.ts`
```typescript
// 🎯 【关键配置】V3智能策略开关 
const USE_V3_INTELLIGENT_STRATEGY = true; // ✅ 必须为true！
```

### 🚫 绝对禁止

- ❌ 将 `USE_V3_INTELLIGENT_STRATEGY` 改为 `false`
- ❌ 直接调用 `run_step_v2` 
- ❌ 绕过 `StepExecutionGateway`

### ✅ 正确执行路径

```
操作 → StepExecutionGateway → executeV3 → execute_chain_test_v3 → V3智能策略
```

### 🔍 问题排查

如果看到这些日志说明有问题：
```
Hit-Test命中容器节点
坐标兜底失败
```

应该看到这些日志说明正常：
```
🚀 使用V3智能策略系统
执行路径: executeStep → executeV3 → execute_chain_test_v3
```

### 📖 详细文档

查看: `docs/V3_INTELLIGENT_STRATEGY_ARCHITECTURE.md`

---
**提醒**: 任何修改V3配置的操作都可能导致坐标兜底问题重现！