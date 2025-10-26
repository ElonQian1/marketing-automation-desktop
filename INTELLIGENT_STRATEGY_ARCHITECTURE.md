# Step 0-6 智能策略分析系统架构说明

## 🚨 重要：防止执行路径混淆

### ✅ 正确的执行路径（Step 0-6 完整智能策略分析）

```
前端UI调用
    ↓
execute_chain_test_v3 (Tauri命令)
    ↓  
src-tauri/src/exec/v3/chain_engine.rs (V3智能自动链)
    ↓
src-tauri/src/engine/strategy_engine.rs (Step 0-6 策略分析核心)
    ↓
src-tauri/src/engine/strategy_plugin.rs (策略执行器)
    ↓
实际UI操作执行
```

### ❌ 错误的执行路径（简化引擎，绕过策略分析）

```
前端UI调用
    ↓
execute_smart_selection (已弃用命令)
    ↓  
src-tauri/src/services/legacy_simple_selection_engine.rs (简化引擎)
    ↓
直接匹配执行（绕过Step 0-6分析）
```

## 📋 Step 0-6 策略映射表

| Step | 策略名称 | 前端TypeScript | 后端Rust实现 | 执行器 |
|------|---------|---------------|--------------|-------|
| Step 0 | 规范化输入 | ElementAnalysisContext | AnalysisContext | - |
| Step 1 | 自我可定位性检查 | SelfAnchorStrategy | self_anchor | SelfId/SelfDesc |
| Step 2 | 子树找锚点 | ChildAnchorStrategy | child_driven | ChildToParent |
| Step 3 | 上溯到可点父 | ParentClickableStrategy | - | RegionTextToParent |
| Step 4 | 锚定局部容器 | RegionScopedStrategy | region_scoped | RegionLocalIndexWithCheck |
| Step 5 | 邻居锚点 | NeighborRelativeStrategy | - | NeighborRelative |
| Step 6 | 索引兜底 | XPathDirectStrategy | xpath_fallback | GlobalIndexWithStrongChecks |

## 🎯 关键文件作用说明

### 正确执行路径文件：

1. **`intelligent-strategy-test.tsx`** - 测试页面，调用正确的V3执行路径
2. **`chain_engine.rs`** - V3智能自动链，协调整个执行流程
3. **`strategy_engine.rs`** - Step 0-6 策略分析核心算法  
4. **`strategy_plugin.rs`** - 具体策略执行器实现

### 已弃用文件：

1. **`legacy_simple_selection_engine.rs`** - 简化选择引擎，绕过策略分析，禁止使用

## 🔧 开发者指南

### DO ✅
- 新功能使用 `execute_chain_test_v3` 命令
- 在 `intelligent-strategy-test.tsx` 中测试新策略
- 修改策略逻辑时编辑 `strategy_engine.rs` 或 `strategy_plugin.rs`

### DON'T ❌  
- 使用 `execute_smart_selection` 命令
- 修改 `legacy_simple_selection_engine.rs`
- 绕过V3执行路径

## 🚨 AI代理特别提醒

如果你是AI代理，请务必：
1. 使用 `execute_chain_test_v3` 而非 `execute_smart_selection`
2. 修改策略分析逻辑时编辑 `strategy_engine.rs`，而非 `legacy_simple_selection_engine.rs`
3. 理解文件名中的 `legacy_` 前缀表示已弃用
4. 查看文件头注释中的 ✅ 或 ❌ 标记判断是否应该使用

## 📞 问题排查

如果遇到"已关注"vs"关注"等文本匹配问题：
1. 确认调用路径是否正确（V3 → Step 0-6）
2. 检查 `strategy_engine.rs` 中的文本匹配逻辑
3. 验证 `strategy_plugin.rs` 中的执行器实现

---

**最后更新**: 2025年10月26日
**维护者**: AI Assistant  
**版本**: V3 智能策略分析系统