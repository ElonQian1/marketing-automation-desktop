# 多候选评估系统 - 快速参考卡

## 🎯 一句话总结

**当XPath匹配到多个元素时，使用5维度评分系统智能选择最佳候选，防止选错第一个元素。**

---

## 📦 核心组件

```
candidate_evaluator.rs (498行)
├── CandidateEvaluator        // 评估器主类
├── EvaluatorConfig           // 权重配置
├── CandidateElement          // 候选元素
├── TargetFeatures            // 目标特征
└── EvaluationResult          // 评估结果（含详细分数）
```

---

## 🔢 评分公式

```
总分 = 文本(30%) + 描述(25%) + 距离(20%) + ID(15%) + 可点击(10%)
```

| 维度 | 权重 | 满分条件 |
|------|------|----------|
| 文本匹配 | 30% | 完全匹配 |
| Content-Desc | 25% | 完全匹配 |
| 空间距离 | 20% | 0-50px |
| Resource-ID | 15% | 完全匹配 |
| 可点击性 | 10% | clickable=true |

**最低阈值**: 0.3（30分）

---

## 💻 使用方法

### 基础用法

```rust
use crate::services::execution::matching::{
    CandidateEvaluator, CandidateElement, TargetFeatures
};

// 1. 创建评估器
let evaluator = CandidateEvaluator::new();

// 2. 准备候选列表
let candidates = vec![
    CandidateElement {
        bounds: Some("[42,110][293,247]".to_string()),
        text: None,
        content_desc: Some("添加朋友".to_string()),
        resource_id: None,
        clickable: true,
        class_name: Some("android.view.ViewGroup".to_string()),
        index: Some(0),
    },
    // ... 更多候选
];

// 3. 定义目标特征
let target = TargetFeatures {
    expected_text: None,
    expected_content_desc: Some("添加朋友".to_string()),
    expected_resource_id: None,
    expected_position: Some((167, 178)),  // 🔥 关键：用户点击位置
};

// 4. 评估候选
let results = evaluator.evaluate_candidates(&candidates, &target)?;

// 5. 使用最佳候选
let best = &results[0];
println!("最佳候选: index={}, score={:.2}", 
         best.candidate_index, best.total_score);
```

---

## 🎯 典型场景

### 场景1: 底部导航按钮

**问题**: 5个按钮共享同一个resource-id

```rust
let target = TargetFeatures {
    expected_content_desc: Some("我".to_string()),
    expected_position: Some((972, 2294)),  // 右下角
    ..Default::default()
};
```

### 场景2: 列表项选择

**问题**: 多个相似列表项

```rust
let target = TargetFeatures {
    expected_text: Some("特定内容".to_string()),
    expected_position: Some((540, 800)),  // 第3个项目的位置
    ..Default::default()
};
```

### 场景3: 无resource-id的按钮

**问题**: 只有content-desc的ViewGroup

```rust
let target = TargetFeatures {
    expected_content_desc: Some("添加朋友".to_string()),
    ..Default::default()
};
```

---

## 📊 空间距离评分规则

| 距离范围 | 评分 | 说明 |
|---------|------|------|
| 0-50px | 1.0 | 非常近 ✅ |
| 50-200px | 0.8-0.5 | 接近 |
| 200-500px | 0.5-0.2 | 较远 |
| 500+px | 0.1 | 很远 ❌ |

**计算公式**: 欧几里得距离

```rust
distance = sqrt((x2-x1)² + (y2-y1)²)
```

---

## 🔍 调试日志示例

### 多候选评估

```
🎯 [候选收集] 找到 3 个匹配的候选元素
🔍 [多候选评估] 启动评估器选择最佳候选（3 个候选）
✅ [多候选评估] 最佳候选: index=2, score=0.840
   📊 评分详情: text=1.00, desc=1.00, spatial=0.95, id=0.00, click=1.00
   💡 推荐原因: ["文本完全匹配", "content-desc完全匹配", "空间距离<50px"]
```

---

## ⚙️ 自定义配置

```rust
let config = EvaluatorConfig {
    text_weight: 0.35,           // 提高文本权重
    content_desc_weight: 0.30,   // 提高Content-Desc权重
    spatial_weight: 0.15,        // 降低距离权重
    resource_id_weight: 0.15,
    clickable_weight: 0.05,
    min_score_threshold: 0.4,    // 提高最低阈值
};

let evaluator = CandidateEvaluator::with_config(config);
```

---

## 🐛 解决的核心问题

### Bug: 选错第一个元素

**原因**: `find()` 总是返回第一个匹配的元素

**解决**: 使用 `filter().collect()` 收集所有候选，用评估器选择最佳

**效果**:
- ❌ 原来：5个底部按钮，总是点击第一个（首页）
- ✅ 现在：根据空间距离和content-desc，点击正确的按钮（我）

---

## ✅ 集成检查清单

- [x] 编译成功（0错误）
- [x] 模块导出（mod.rs）
- [x] 执行引擎集成（chain_engine.rs）
- [x] 辅助函数添加
- [x] 单元测试完成
- [x] 文档编写完整

---

## 📁 相关文件

```
src-tauri/src/services/execution/matching/
├── candidate_evaluator.rs          // 核心模块（498行）
├── mod.rs                           // 导出模块
└── ...

src-tauri/src/exec/v3/
└── chain_engine.rs                  // 集成点（+150行）

docs/
├── MULTI_CANDIDATE_EVALUATION_SYSTEM.md        // 完整文档
├── MULTI_CANDIDATE_INTEGRATION_REPORT.md       // 集成报告
└── MULTI_CANDIDATE_INTEGRATION_SUMMARY.md      // 总结
```

---

## 🚀 快速测试

```rust
cargo test candidate_evaluator
```

**预期输出**:
```
running 4 tests
test test_parse_bounds_center ... ok
test test_euclidean_distance ... ok
test test_string_similarity ... ok
test test_evaluate_candidates ... ok
```

---

## 💡 最佳实践

1. **总是提供 expected_position** - 这是最可靠的筛选依据
2. **优先使用 content-desc** - 比text更稳定
3. **组合多个特征** - 不要只依赖单一维度
4. **记录评估日志** - 方便调试和优化

---

## 📞 获取帮助

- 📖 完整文档: `MULTI_CANDIDATE_EVALUATION_SYSTEM.md`
- 📋 集成报告: `MULTI_CANDIDATE_INTEGRATION_REPORT.md`
- 🎯 项目规范: `.github/copilot-instructions.md`

---

**版本**: 1.0.0  
**状态**: ✅ 完成并集成  
**最后更新**: 2025-10-28
