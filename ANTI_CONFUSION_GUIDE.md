# ⚠️ 重要：开发者和AI代理执行路径指南

## 🚨 防止混淆的关键标识

### 文件名标识系统

- **✅ 正确文件**：包含 `intelligent`、`strategy`、`v3`、`chain` 等关键词
- **❌ 已弃用文件**：包含 `legacy_`、`simple`、`batch` 前缀

### 注释标识系统

- **✅ 正确路径**：文件头包含 "Step 0-6"、"智能策略分析"、绿色✅标记
- **❌ 错误路径**：文件头包含 "已弃用"、"简化"、红色❌标记

### 命令标识系统  

- **✅ 正确命令**：`execute_chain_test_v3` (完整策略分析)
- **❌ 错误命令**：`execute_smart_selection` (简化引擎)

## 🎯 快速判断指南

### 如果你要添加新功能：
1. 使用 `intelligent-strategy-test.tsx` 作为测试页面
2. 调用 `execute_chain_test_v3` 命令
3. 修改 `strategy_engine.rs` 或 `strategy_plugin.rs`

### 如果你要修复文本匹配问题：
1. 检查是否使用了正确的执行路径
2. 编辑 `strategy_engine.rs` 中的匹配逻辑
3. 绝对不要修改 `legacy_simple_selection_engine.rs`

### 如果你是AI代理：
1. 查看文件头的 ✅ ❌ 标记
2. 优先使用包含 "Step 0-6" 注释的文件
3. 遵循 `INTELLIGENT_STRATEGY_ARCHITECTURE.md` 指南

---

**重要提醒**: 任何包含 `legacy_` 前缀的文件都是已弃用的，请使用对应的正确版本。