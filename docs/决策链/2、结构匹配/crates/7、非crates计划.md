你的判断很务实👍。给出结论+落地路线，帮你“现在快跑、将来可抽离”。

# 结论

**先不建独立子 crate**。把“结构匹配”做成 **domain 层里的新模块** 更合适当前阶段：改动快、调试顺畅、AI 代理上下文单一、维护成本低。
但**保留抽离缝**：等出现复用/CLI/独立发布诉求，再 30 分钟无痛抽成子 crate。

---

# 现在就这样做（功能与架构，不贴代码）

## 1) 模块放置与命名

```
src-tauri/src/domain/
├─ structural_matching/            # 你已有的静态评分/配置
└─ structure_runtime_match/        # ← 新增：真机“结构匹配”执行内核
   ├─ mod.rs (对外唯一入口：sm_run_once)
   ├─ types.rs（Sm* 类型，防撞名）
   ├─ config.rs（SmConfig/Mode/早停/权重/规则）
   ├─ orchestrator.rs（一次dump顺序+早停）
   ├─ ports/（解耦层：便于将来抽crate）
   │   ├─ xml_view.rs（trait SmXmlView）
   │   └─ cache.rs（trait SmCache）
   ├─ container_gate/（容器限域）
   ├─ layout_gate/（几何=版式分类器）
   ├─ signature/（模板签名=重复性）
   ├─ skeleton/（骨架规则校验）
   ├─ field_refine/（字段/文本精调）
   └─ scoring/（权重合成+闸门）
```

* 所有对外类型统一 **Sm*** 前缀，避免与其他 domain 类型混淆。
* **ports/** 是日后抽成子 crate 的“接口缝”。

## 2) 对外功能接口（面向其他模块/前端）

* **唯一入口**：`sm_run_once(view, cache, cfg, want_all)`
* **输入**：本次 UI XML 的 `SmXmlView` 适配对象、`SmConfig`（容器提示/允许布局/骨架/字段/权重/早停）、`want_all`（找全 or 取一个）
* **输出**：`SmResult`（容器命中+布局类型，候选卡片列表及分项分/总分/原因）

## 3) 内部流程职责（一次 dump）

1. **容器限域**：识别“卡片大容器”，找不到→相似容器→全局（可降级）。
2. **几何/版式**：判断 WaterfallMulti / MasonrySingle / UniformGrid / List / Carousel / Unknown，得到 `S_geom`；已指定版式可**跳过**。
3. **模板签名**：对容器内卡片**采样**学习 Top-K 指纹，匹配得 `S_tpl`；仅“取一个”时可**跳过**。
4. **骨架**：规则校验（图上文下、子结构/顺序/弹性±1），得 `S_struct`。
5. **字段/文本**：空/非空一致、相等/相似匹配、**“子文本必须=某值”**（可硬约束），得 `S_field`。
6. **合成+闸门+选择**：权重合成（Speed/Default/Robust 三档）、闸门（唯一性/Top-gap/Min-conf），输出找全或单一目标。

## 4) 可配置与早停（性能/鲁棒平衡）

* 允许布局（多选 or Auto）
* 早停三开关：**跳过几何**（已知版式）/ **单目标跳过模板** / **只跑骨架**（极速）
* 权重三档（Speed/Default/Robust）+ 可覆盖
* 阈值：`min_confidence`（默认 0.70）、`top_gap`（默认 0.15）

## 5) 性能与可观测性

* **采样**：模板只看每列前 8–12 个
* **缓存**：以 `xml_hash + container_id` 缓存几何统计/模板
* **诊断**：输出分项分、列数/高度方差、模板支持度、骨架/字段命中/失配原因，便于前端 Overlay 可视化

## 6) 与现有系统对接

* V3 执行链/StepExecution 在需要“找全/选一”时**调用 sm_run_once**
* StepCard 扩展字段 → 映射到 `SmConfig`（容器提示、允许布局、骨架/字段规则、模式与阈值）
* 保持“执行闸门”一致（唯一性==1 或 top-gap≥0.15）

## 7) 何时再评估抽成子 crate（明确触发条件）

* 该内核被 **另一个二进制/服务** 复用（如 CLI/离线批处理）
* 需要 **独立发布/版本化**（crates.io 或内部制品库）
* 算法趋于稳定，**跨仓库共享** 成本显著
* 个人/CI 基准显示 **编译回归**（拆包可显著缩短增量构建）

当触发任一条件：把 `structure_runtime_match/` 整目录平移到 `/crates/structure-match/`，`ports` 接口不变，**改 path 依赖即可**。

## 8) 治理与AI协作

* `.github/CODEOWNERS`：`/src-tauri/src/domain/structure_runtime_match/ @you`
* `AGENTS.md` 增加一节：“算法只改此目录；前端/命令层不得混改”
* `.vscode/tasks.json` 加两个任务：**Test structure_runtime_match** / **Bench structure_runtime_match**
* 结果对象（分项分/原因）保持稳定字段，便于前端和日志一致解读

---

# 行动清单（今天能做）

* [ ] 在 **domain** 下创建 `structure_runtime_match/` 目录树（如上）
* [ ] 定义 **SmConfig / SmResult**（不写实现，先敲定字段）
* [ ] `orchestrator` 写好 **空流程骨架**（占位调用，返回空结果）
* [ ] StepCard → `SmConfig` 的 **映射层**（DTO 转换）
* [ ] VS Code 任务 + CODEOWNERS + AGENTS 指南更新

这样你可以**立即开工并联调**；未来若出现复用需求，再把这个模块“平移”为子 crate，几乎零成本迁移。
