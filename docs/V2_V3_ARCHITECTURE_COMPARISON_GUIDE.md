# 执行路径架构对比指南

## 🎯 快速选择指南

### ✅ 新功能开发（推荐）
- **前端命令**: `execute_chain_test_v3`
- **后端路径**: V3智能自动链 → Step 0-6策略分析
- **适用场景**: 所有新功能开发，特别是需要精准元素识别的场景

### ❌ 已弃用路径（禁止使用）
- **前端命令**: `start_intelligent_analysis`, `execute_smart_selection`
- **后端路径**: V2简化分析 → 简单文本匹配
- **问题**: 无法处理"已关注"vs"关注"等复杂识别场景

---

## 📋 核心文件映射表

### V3 智能策略分析系统（✅ 推荐使用）

| 组件 | 文件路径 | 职责 | 状态 |
|------|----------|------|------|
| **后端V3执行引擎** | `src-tauri/src/exec/v3/chain_engine.rs` | V3智能自动链，统一入口 | ✅ 完整 |
| **Step 0-6策略分析** | `src-tauri/src/engine/strategy_engine.rs` | 核心策略分析逻辑 | ✅ 完整 |
| **策略执行器** | `src-tauri/src/engine/strategy_plugin.rs` | 具体策略实现 | ✅ 完整 |
| **前端策略引擎** | `EnhancedStrategyDecisionEngine.ts` | 前端Step 0-6实现 | ✅ 完整 |
| **统一分析Hook** | `hooks/useUnifiedSmartAnalysis.ts` | V3执行路径Hook | ✅ 已升级 |
| **真实分析Hook** | `hooks/use-intelligent-analysis-real.ts` | V3命令调用 | ✅ 已升级 |
| **步骤卡片服务** | `services/step-pack-service.ts` | V3步骤卡片生成 | ✅ 已升级 |
| **测试界面** | `pages/intelligent-strategy-test.tsx` | V3系统测试 | ✅ 完整 |

### V2 简化系统（❌ 已弃用）

| 组件 | 文件路径 | 状态 | 替代方案 |
|------|----------|------|----------|
| **简化选择引擎** | `legacy_simple_selection_engine.rs` | ❌ 已弃用 | 使用 V3 chain_engine.rs |
| **V2批量测试** | ~~`batch-test.tsx`~~ | ❌ 已重命名 | `intelligent-strategy-test.tsx` |

---

## 🔄 命令对照表

### Tauri 后端命令

| V3 智能策略（✅ 使用） | V2 简化系统（❌ 禁用） | 功能差异 |
|---------------------|---------------------|---------|
| `execute_chain_test_v3` | `start_intelligent_analysis` | V3包含完整Step 0-6分析 |
| `execute_chain_test_v3` | `execute_smart_selection` | V3具备智能回退机制 |

### 前端调用方式

```typescript
// ✅ 正确的V3调用方式
const result = await invoke('execute_chain_test_v3', {
  analysisRequest: {
    // V3智能策略分析请求参数
    element_context: elementContext,
    execution_mode: 'intelligent_auto_chain'
  }
});

// ❌ 错误的V2调用方式（已弃用）
const result = await invoke('start_intelligent_analysis', {
  // V2简化分析参数
});
```

---

## 📊 Step 0-6 策略详解

### 完整策略分析流程

| Step | 策略名称 | 执行逻辑 | 解决的问题 |
|------|----------|----------|------------|
| **Step 0** | ElementAnalysisContext | 规范化输入上下文 | 统一数据格式 |
| **Step 1** | SelfAnchorStrategy | 自我可定位性检查 | 精确元素识别 |
| **Step 2** | ChildDrivenStrategy | 子元素驱动策略 | 处理复合组件 |
| **Step 3** | ParentClickableStrategy | 上溯到可点父元素 | 解决嵌套点击 |
| **Step 4** | RegionScopedStrategy | 区域限制搜索 | 避免误匹配 |
| **Step 5** | NeighborRelativeStrategy | 邻居相对定位 | 上下文感知 |
| **Step 6** | XPathDirectStrategy | 索引兜底策略 | 最终保障 |

### 核心优势

1. **精准识别**: 解决"已关注"vs"关注"按钮混淆问题
2. **智能回退**: 多层策略确保执行成功率
3. **上下文感知**: 考虑元素周边环境
4. **置信度评分**: 量化选择质量

---

## 🚨 常见误区防护

### 开发者常犯错误

1. **❌ 使用旧命令**
   ```typescript
   // 错误：调用已弃用的V2命令
   await invoke('start_intelligent_analysis', params);
   ```
   
2. **❌ 直接调用简化引擎**
   ```typescript
   // 错误：绕过策略分析
   await invoke('execute_smart_selection', params);
   ```

3. **❌ 混用V2和V3接口**
   ```typescript
   // 错误：在V3项目中使用V2Hook
   const { analyze } = useSimpleSelection(); // 已弃用
   ```

### AI代理常犯错误

1. **文件路径错误**: 创建新的简化选择相关文件
2. **接口混用**: 在V3系统中添加V2兼容代码
3. **文档缺失**: 不添加反混淆说明导致后续混乱

---

## 🎯 迁移检查清单

### 从V2升级到V3

- [ ] 前端调用命令：`start_intelligent_analysis` → `execute_chain_test_v3`
- [ ] 后端执行路径：`legacy_simple_selection_engine.rs` → `chain_engine.rs`
- [ ] 测试页面：`batch-test.tsx` → `intelligent-strategy-test.tsx`
- [ ] Hook接口：检查所有分析Hook使用V3路径
- [ ] 文档更新：添加三行文件头和反混淆说明

### 新功能开发

- [ ] 使用 `execute_chain_test_v3` 命令
- [ ] 基于 `EnhancedStrategyDecisionEngine.ts` 构建前端逻辑
- [ ] 集成 Step 0-6 策略分析
- [ ] 添加置信度评分显示
- [ ] 包含智能回退机制

---

## 📚 相关文档

- [三条执行链智能选择联动核心落地方案.md](../三条执行链智能选择联动核心落地方案.md)
- [智能选择步骤卡片集成完成报告.md](../智能选择步骤卡片集成完成报告.md)
- [置信度显示系统实现报告.md](../置信度显示系统实现报告.md)

---

*最后更新：2025-10-26 - V3智能策略分析系统反混淆文档完成*