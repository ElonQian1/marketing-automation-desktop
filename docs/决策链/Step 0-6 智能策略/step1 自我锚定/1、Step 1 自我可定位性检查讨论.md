你说得对，而且你的思路非常合理：**先静态分析做“自我锚定(Self-Anchor)”字段的组合评分 → 产出候选锚定策略 → 真机执行前再做一次“唯一性实测校验+受控降级/组合加固”**。下面给你一套可直接落地的、模块化拆分方案（前端离线分析 + Rust 后端真机校验），包含字段清单、评分/组合规则、目录与文件拆分、阈值建议与最小可用代码骨架。

---

# 我建议的整体设计

## Self-Anchor 关注的字段（按信息量/稳定性优先级）

* **resource-id**（常见重复于列表/导航，但命名规范时稳定性最高）
* **content-desc**（可访问性标签，常见“更多/按钮/头像”等泛化词易重复）
* **text**（强语义但受 i18n、动态文案影响）
* **class**（区分类别但区分度有限）
* **package**（用于跨 App 池隔离，判定范围）
* **state flags**：clickable、enabled、selected、checked、long-clickable…
* **结构/位置**：index（同层序号）、childCount、父容器特征（**container 限域**）、**可点父 clickable-parent**（很重要）
* **bounds/size**（不建议单独作为主锚，偏兜底、低权重）

> 与你既有权重偏好一致（你此前设定：id/desc≈0.85、text≈0.70、class≈0.30；container +0.30；可点父 +0.20；局部索引 −0.15；全局索引 −0.60）。我延续并结构化到评分公式里。

---

## 双阶段流程（与你的“前端离线 / 后端真机”架构契合）

1. **前端离线静态分析（基于缓存 XML）**

   * 为整页构建**倒排索引**（字段→值→元素列表），得到每个字段值的**重复度 count**（全局+容器范围）。
   * 对所选元素抽取**字段证据 FieldEvidence**并**打分**（见公式）。
   * 若**单字段**的“唯一性预估 + 稳定性综合分”≥阈值（建议 `≥0.78`），直接产出**单字段锚定策略**（优先 resource-id / content-desc / text）。
   * 否则按**贪心组合**：从得分高到低逐个加入字段（优先加**container 限域**、**clickable-parent**），每加一项重估“预期匹配数 expected_count”。一旦预估 `== 1` 或分数达标即停。
   * 输出 **AnchorCandidates[]**（多条候选，带预估计数与理由），写入 StepCard 的 StrategyPlan（与你现有协议一致）。

2. **后端真机执行校验（Rust）**

   * 重新 **dump 真机 XML**，对候选的 XPath/选择器做**实际计数**。
   * **闸门（gating）**：要求 `count==1` 且 `min_confidence≥0.70` 或 `top-gap≥0.15`。否则按候选顺序**受控降级/组合加固**，必要时退到**局部索引**（−0.15）再到**全局索引**（−0.60）或**坐标兜底**。
   * 命中后执行 tap 等动作；失败完整记录“计数与降级路径”到日志/StepCard 回写。

---

## 评分与唯一性估计（简洁可调）

**字段分（attribute_score） = 基础权重 × 唯一性(U) × 稳定性(S) × 可用性(V) + 限域/父级奖励/索引惩罚**

* 基础权重（默认）

  * id=0.85，desc=0.85，text=0.70，class=0.30，package=0.15
* 唯一性 U（对 count 做平滑）：

  * `U = 1 / (1 + ln(count_scope))`，scope 优先“container”，无容器时用全局
* 稳定性 S：启发式

  * id（含包名/无明显“*obfuscated”/hash样式）0.9；含“item*/list_/cell_”降到 0.6
  * desc 常见泛词降到 0.5，否则 0.8
  * text 若含变量模板/数字占比高降到 0.5，否则 0.7
  * class 0.6、package 0.9
* 可用性 V：元素可见可点、无遮挡、在视窗内：0.8～1.0
* **加/减分项**

  * container 限域：+0.30
  * clickable-parent：+0.20
  * 使用局部索引：[n]：−0.15
  * 使用全局索引：−0.60
  * 使用 bounds/坐标：−0.30（仅兜底）

**接受单字段的阈值**：`attribute_score ≥ 0.78`（可配），或 `expected_count == 1`。
**组合停止条件**：`expected_count == 1` 或 **组合分** `≥ 0.82`。

---

# 代码结构与文件拆分（前端 TS / 后端 Rust）

> 你要求“子文件夹/子文件，避免大文件”，我按职责簇拆分。所有代码块第一行包含“文件名路径”注释，符合你的约定。

## A. 前端（离线分析，生成 StrategyPlan）

```ts
// src/modules/analysis/self-anchor/index.ts
export * from './page_index';
export * from './fields';
export * from './scoring';
export * from './composer';
export * from './types';
```

```ts
// src/modules/analysis/self-anchor/types.ts
export interface FieldEvidence { name: string; value?: string; countGlobal: number; countInContainer: number; stability: number; usable: number; baseWeight: number; }
export interface AnchorCandidate { selector: string; expectedCount: number; score: number; reasons: string[]; usedFields: string[]; }
export interface ComposeOptions { useContainerFirst: boolean; maxFields: number; }
```

```ts
// src/modules/analysis/self-anchor/page_index.ts
export interface PageIndex { byField: Record<string, Map<string, string[]>>; /* value -> elementIds */ }
export function buildPageIndex(xmlDoc: Document): PageIndex { /* 解析并倒排 */ return { byField: {} }; }
export function estimateCount(idx: PageIndex, field: string, value: string, containerId?: string): number { /* 容器优先 */ return 1; }
```

```ts
// src/modules/analysis/self-anchor/fields.ts
export function extractFieldEvidences(el: Element, idx: PageIndex): FieldEvidence[] {
  // 采集 id/desc/text/class/package/state/index/childCount/父容器 等
  return [];
}
```

```ts
// src/modules/analysis/self-anchor/scoring.ts
export function uniqueness(count: number): number { return 1 / (1 + Math.log(Math.max(1, count))); }
export function scoreField(ev: FieldEvidence, useContainer: boolean, usedIndex: 'none'|'local'|'global'): number {
  const U = uniqueness(Math.max(1, ev.countInContainer || ev.countGlobal));
  let score = ev.baseWeight * U * ev.stability * ev.usable;
  if (useContainer) score += 0.30;
  if (usedIndex === 'local') score -= 0.15;
  if (usedIndex === 'global') score -= 0.60;
  return Math.max(0, Math.min(1, score));
}
```

```ts
// src/modules/analysis/self-anchor/composer.ts
import { AnchorCandidate, FieldEvidence, ComposeOptions } from './types';
export function composeAnchors(evs: FieldEvidence[], opts: ComposeOptions): AnchorCandidate[] {
  // 1) 先挑单字段 >=0.78 或 expectedCount==1
  // 2) 否则贪心组合（优先 container/clickable-parent，再加 id/desc/text/class）
  // 3) 产生多条候选，排序返回
  return [];
}
```

> 产出的 `AnchorCandidate[]` 写入你的 StepCard/StrategyPlan，保留 `expectedCount/score/reasons/usedFields`，供后端执行时参考。

---

## B. 后端（Rust 真机唯一性实测与受控降级）

```rust
// src-tauri/src/engine/self_anchor/mod.rs
pub mod fields;
pub mod uniqueness;
pub mod scoring;
pub mod compositor;
pub use uniqueness::{validate_xpath_uniqueness, UniquenessReport};
pub use compositor::{build_xpath_from_combo, ComboInput};
```

```rust
// src-tauri/src/engine/self_anchor/uniqueness.rs
use anyhow::Result;
pub struct UniquenessReport { pub xpath: String, pub matched: usize }
pub fn validate_xpath_uniqueness(ui_xml: &str, xpath: &str) -> Result<UniquenessReport> {
    // 解析 XML，执行 XPath 计数（用你现有 XPath 引擎/quick-xml + sxd-xpath 等）
    Ok(UniquenessReport{ xpath: xpath.to_string(), matched: 1 })
}
```

```rust
// src-tauri/src/engine/self_anchor/scoring.rs
pub fn uniqueness(count: usize) -> f32 { 1.0 / (1.0 + (count as f32).ln()) }
pub struct Weights { pub id: f32, pub desc: f32, pub text: f32, pub class: f32, pub package: f32 }
pub const DEFAULT_WEIGHTS: Weights = Weights{ id:0.85, desc:0.85, text:0.70, class:0.30, package:0.15 };
pub fn apply_adjustments(score: f32, use_container: bool, index_penalty: Option<&str>) -> f32 {
    let mut s = score + if use_container {0.30} else {0.0};
    if let Some("local") = index_penalty { s -= 0.15; }
    if let Some("global") = index_penalty { s -= 0.60; }
    s.clamp(0.0, 1.0)
}
```

```rust
// src-tauri/src/engine/self_anchor/compositor.rs
pub struct ComboInput<'a> { pub resource_id: Option<&'a str>, pub content_desc: Option<&'a str>, pub text: Option<&'a str>, pub class_name: Option<&'a str>, pub container_xpath: Option<&'a str>, pub clickable_parent_xpath: Option<&'a str> }
pub fn build_xpath_from_combo(c: &ComboInput, use_container: bool, use_clickable_parent: bool, add_class: bool, add_text: bool, use_local_index: Option<usize>) -> String {
    // 生成形如：{container}//{clickable-parent}// *[@resource-id='..' and @text='..' and @class='..'][n]
    "//hierarchy".to_string()
}
```

```rust
// src-tauri/src/engine/gating.rs
// 你的现有闸门里，新增：对每个 AnchorCandidate 真实计数，命中 count==1 才放行；否则尝试下一个候选或加固组合；必要时退索引/坐标。
```

---

## C. 共享类型与配置（可选）

* `src/shared/strategy/self_anchor.schema.json`：AnchorCandidate / Report 的 JSON Schema（便于前后端契约与校验）
* `config/self_anchor.yaml`：权重/阈值/惩奖项集中配置（便于实验调参）

---

# 阈值与策略建议（拿来即用）

* **单字段可直接用**：`score ≥ 0.78` 或 `expectedCount == 1`
* **组合停止**：达到 `expectedCount == 1` 或 **组合分** `≥ 0.82`
* **后端闸门通过**：`real_count == 1` 且 `min_confidence ≥ 0.70` 或 `top-gap ≥ 0.15`
* **候选组合顺序**（贪心）：

  1. container 限域（若可用）
  2. clickable-parent（若可用）
  3. resource-id / content-desc / text（择高）
  4. class（必要时）
  5. 局部索引（−0.15）
  6. 全局索引（−0.60）
  7. bounds/坐标兜底（−0.30）

---

# 典型场景示例（效果一目了然）

* 所选元素位于 feed 列表卡片里：

  * `resource-id="btn_follow"` **重复 12 次**（U≈低）
  * `text="关注"` 重复 3 次；`class="android.widget.TextView"` 很常见
  * 组合策略：**container(卡片根) + clickable-parent(操作区) + resource-id + text** → 预估 count=1，分≈0.86
  * 后端实测 count==1 → 直接点击

* 所选元素在顶部 Tab：

  * `content-desc="更多"`、`resource-id="tab_item"` 都重复
  * 组合：**container(顶部导航) + class + index** → count=1，但因索引有惩罚，分≈0.76；
  * 若分<阈值，再加 package 或紧邻 label 文本限定，拉升到 ≥0.82

---

# 你提出的问题逐条回应

1. **id/desc 可能不唯一？**
   是的，经常**不唯一**（列表项、tab、模板控件）。用“**容器限域 + 父级可点 + 单字段**”或“两字段组合”才稳。

2. **是否应对所有字段做组合评分？**
   ✅ 对，但要**分层优先**：先权重高（id/desc/text），再结构性（container/clickable-parent），最后 class/state/index/bounds 作为加固与兜底，避免无止境组合。

3. **很多字段为空或重复，怎么设计？**

   * 在 **FieldEvidence** 阶段就记录 `present=false` 或 `count≫1`，它们的得分会自动很低。
   * 组合器只挑**可用且增益最大的**字段，限制 `maxFields`（建议 ≤3）。

4. **我的工作模式正确吗？**
   ✅ 正确，而且跟你的“前端离线/后端真机 + 受控回退”的总体基线完全一致（参照你项目的 V3 Chain 要求与闸门口径）。

---

# 最后给你的落地路线（一步步做）

1. **前端**落地 `page_index / fields / scoring / composer` 四小件，产出 `AnchorCandidate[]` 写入 StepCard。
2. **后端**在 `gating.rs` 接入 `validate_xpath_uniqueness`，执行前逐个校验并受控降级。
3. 新增 **日志与回写**：把 `expectedCount vs real_count`、降级路径、最终 XPath 回写到 StepCard（便于复盘）。
4. 把阈值、权重提到 `config/self_anchor.yaml`，做 A/B 试验和日志统计（比如“单字段命中率”“加容器后命中率”“引入索引的比例”）。
5. 做 3 组**单元测试**（列表/导航/弹窗），构造不同重复度的 XML 样本，确保组合器行为稳定可预期。

如果你愿意，我可以**按以上骨架把最小可运行版本的 TS/Rust 代码补齐**（保留你要求的“首行文件路径注释”与子模块拆分风格），直接对接你现有的 StepCard/StrategyPlan 契约。



最终可能得到几个完全相同的三个重复元素。可能就index值不一样。
我们就要考虑 哪个是用户选择的那个。也就是绝对匹配。

或者有时候用户就想找到最佳的这三个。三个都要逐一操作。

用户通常会选择 “第一个”"批量匹配（最佳评分）"“精准匹配”
如果是查找到有多个优质重复的元素，就需要进行 其他锚定匹配。

现在要先做好这个 “自我锚定”架构，为后面更复杂的匹配做好传递。
“自我锚定”失败应该是所有字段都为空，仅仅一个可以点击的中层元素。
核心信息在子/父元素那里。不在自身。

所以我要怎么设计这 一个 “自我锚定”的模块，能让下一步更好的使用？


你的目标很清晰：**Self-Anchor 自我锚定**既要能在“重复元素（仅 index 不同）”时做**绝对匹配**，也要支持“第一个 / 批量匹配（最佳评分） / 精准匹配”三种用户意图；并且在**自身字段稀薄**时，要把**父/子/邻接线索**打包交给下一阶段。下面给你一个可直接落地的、模块化的设计（含最小接口与文件拆分），确保“自我锚定”能把**足够的上下文**干净地传递给后续策略链。

---

# 设计目标（对应你的三种选择）

1. **精准匹配（absolute / 精准）**

   * 在重复元素中**定位用户点选的那个实例**。
   * 关键：用**实例指纹（InstanceFingerprint）**做 disambiguation：坐标/几何、祖先路径签名、邻接文本/结构、可点父、容器。

2. **第一个（first）**

   * 在排序后的“等价优质集合”里，按**稳定顺序**（容器→阅读顺序：top→left）取第一个。

3. **批量匹配（best-scored / all）**

   * 返回“等价优质集合”的**有序列表**（带间隔/节流参数），逐一操作。

---

# 核心思路

* **自我锚定产物 =「可执行选择器 + 解释 + 去歧义计划 + 关系线索」**
* 失败（自身字段几乎空）：产出**RELATIONAL_SEED**（父/子/邻接提示），让后续“关系锚定”模块接力。
* 前端离线**估计唯一性**与**组合评分**；后端真机再**实测计数** + **受控降级/加固**（与你现有 V3 闸门一致）。

---

# 模块与文件拆分（精简、可扩展）

## 前端（TS，离线分析与计划产出）

```ts
// src/modules/analysis/self-anchor/index.ts
export * from './types';
export * from './page_index';
export * from './feature_extract';
export * from './scoring';
export * from './compose_plan';
export * from './fingerprint';
```

```ts
// src/modules/analysis/self-anchor/types.ts
export type MatchMode = 'first' | 'batch' | 'precise';

export interface FieldEvidence {
  name: 'resource-id'|'content-desc'|'text'|'class'|'package'|'state'|'index'|'bounds';
  value?: string;
  countGlobal: number;
  countInContainer: number;
  stability: number;   // 启发式稳定性
  usable: number;      // 可见/可点/在视窗
  baseWeight: number;  // id/desc/text/class 的先验权重
}

export interface InstanceFingerprint {
  // 用于“精准匹配”的绝对实例签名（在重复组里唯一）
  tapBounds?: {left:number;top:number;right:number;bottom:number};
  boundsAspect?: number;             // 宽高比
  ancestryPathSig: string;           // 祖先节点(tag/class/index)签名hash
  clickableParentSig?: string;       // 可点父签名hash
  neighborTextTokens?: string[];     // 左/右/上/下近邻文本token
  subtreeSig?: string;               // 子树结构/文本hash（可选）
}

export interface AnchorCandidate {
  selector: string;                 // XPath/选择器（可含容器限定）
  expectedCount: number;            // 估计匹配数
  score: number;                    // 组合评分（0..1）
  reasons: string[];                // 可读解释
  usedFields: string[];             // 参与组合的字段
}

export interface SelfAnchorPlan {
  status: 'unique'|'duplicates'|'empty_self';
  containerXPath?: string;
  clickableParentXPath?: string;
  candidates: AnchorCandidate[];    // 按 score 排序
  duplicateOrder?: 'reading'|'geometry'|'score'; // 重复组的遍历序
  fingerprint?: InstanceFingerprint; // 仅当用户选中的实例需要“精准” disambiguation
  relationSeed?: {                   // 自身字段空时，用于下一步关系锚定
    parentHints?: string[];          // 父/祖先可用字段或 xpath 片段
    childHints?: string[];           // 子/后代可用字段或文本
    neighborHints?: string[];        // 同层邻接文本/结构提示
  };
}
```

```ts
// src/modules/analysis/self-anchor/page_index.ts
export interface PageIndex { byField: Record<string, Map<string, string[]>>; }
export function buildPageIndex(xmlDoc: Document): PageIndex { /* value->elementIds */ return { byField:{} }; }
export function estimateCount(idx: PageIndex, field: string, value: string, containerId?: string): number { return 1; }
```

```ts
// src/modules/analysis/self-anchor/feature_extract.ts
export function extractFieldEvidences(el: Element, idx: PageIndex): FieldEvidence[] { /* 采集 id/desc/text/class/... */ return []; }
export function extractFingerprint(el: Element, idx: PageIndex): InstanceFingerprint { /* 祖先/邻接/几何签名 */ return { ancestryPathSig:'' }; }
```

```ts
// src/modules/analysis/self-anchor/scoring.ts
export function uniqueness(count: number): number { return 1/(1+Math.log(Math.max(1,count))); }
export function scoreField(ev: FieldEvidence, useContainer: boolean, indexPenalty:'none'|'local'|'global'): number { /* 权重×U×稳定×可用 + 奖惩 */ return 0.8; }
```

```ts
// src/modules/analysis/self-anchor/compose_plan.ts
import { SelfAnchorPlan, AnchorCandidate, FieldEvidence } from './types';
export function composeSelfAnchorPlan(
  el: Element, idx: any, userTapBounds?: {l:number;t:number;r:number;b:number}
): SelfAnchorPlan {
  // 1) 单字段阈值判定（≥0.78 或 expectedCount==1）
  // 2) 贪心组合（容器/可点父优先 → id/desc/text → class → 索引）
  // 3) 估计重复：status = 'unique' | 'duplicates'
  // 4) duplicates 时：设置 duplicateOrder 与 fingerprint
  // 5) 空字段时：status='empty_self'，填 relationSeed
  return { status:'duplicates', candidates:[] };
}
```

```ts
// src/modules/analysis/self-anchor/fingerprint.ts
export function orderDuplicates(
  elements: Array<{bounds:{l:number;t:number;r:number;b:number}, score:number}>,
  mode: 'reading'|'geometry'|'score',
  tapBounds?: {l:number;t:number;r:number;b:number}
): number[] { /* 返回索引顺序 */ return []; }
```

> 前端输出 `SelfAnchorPlan` 写入 StepCard/StrategyPlan：
>
> * `match_mode`: `'first'|'batch'|'precise'`（来自用户选择）
> * `batch.intervalMs`、`batch.limit`（可选）
> * `disambiguation`: `fingerprint` + `duplicateOrder`

### StepCard 建议新增字段（与现有契约对齐）

```json
{
  "strategy": { "selected": "self_anchor" },
  "self_anchor": {
    "match_mode": "precise",
    "plan": { /* SelfAnchorPlan */ },
    "batch": { "intervalMs": 250, "limit": null }
  },
  "xml_snapshot": "...",
  "absolute_xpath": "...",               // 仍保留书签
  "allow_backend_fallback": true,
  "time_budget": 1500
}
```

---

## 后端（Rust，真机计数 + 去歧义 + 执行动作）

```rust
// src-tauri/src/engine/anchor/self/mod.rs
pub mod types;
pub mod uniqueness;
pub mod disambiguation;
pub mod apply;
```

```rust
// src-tauri/src/engine/anchor/self/types.rs
#[derive(Clone, Debug)]
pub enum MatchMode { First, Batch, Precise }

#[derive(Clone, Debug)]
pub struct Fingerprint { /* 与前端对应，做相似度/几何IoU/祖先签名比对 */ }

#[derive(Clone, Debug)]
pub struct AnchorCandidate { pub xpath: String, pub score: f32 }

#[derive(Clone, Debug)]
pub struct SelfAnchorPlan {
  pub status: String,                          // "unique"|"duplicates"|"empty_self"
  pub container_xpath: Option<String>,
  pub clickable_parent_xpath: Option<String>,
  pub candidates: Vec<AnchorCandidate>,
  pub duplicate_order: Option<String>,         // "reading"|"geometry"|"score"
  pub fingerprint: Option<Fingerprint>,
}

#[derive(Clone, Debug)]
pub struct AnchorTicket {                       // 供执行器使用
  pub match_mode: MatchMode,
  pub plan: SelfAnchorPlan,
  pub batch_interval_ms: Option<u64>,
  pub batch_limit: Option<usize>,
}
```

```rust
// src-tauri/src/engine/anchor/self/uniqueness.rs
use anyhow::Result;
pub fn count_by_xpath(ui_xml: &str, xpath: &str) -> Result<usize> { /* 真实计数 */ Ok(1) }
```

```rust
// src-tauri/src/engine/anchor/self/disambiguation.rs
use super::types::*;
pub fn pick_precise_instance(
  ui_xml: &str, xpath: &str, fp: &Fingerprint
) -> anyhow::Result<Option<usize>> {
  // 在匹配集合中，按几何IoU、祖先签名、邻接文本匹配度排序，返回 best index
  Ok(Some(0))
}

pub fn order_duplicates(
  ui_xml: &str, xpath: &str, order: &str
) -> anyhow::Result<Vec<usize>> {
  // reading: top→left；geometry: 距离点击点；score: 需要候选携带单体分
  Ok(vec![])
}
```

```rust
// src-tauri/src/engine/anchor/self/apply.rs
use super::types::*;
use super::{uniqueness::count_by_xpath, disambiguation::*};
pub fn resolve_targets(
  ui_xml: &str, ticket: &AnchorTicket
) -> anyhow::Result<Vec<(String, usize)>> {
  // 遍历 candidates：
  // 1) 计数 == 1 → 返回 (xpath, index=1)
  // 2) duplicates → 根据 match_mode：
  //    - First：order_duplicates 取第一个
  //    - Batch：返回全体（按序）；外层按 interval 执行
  //    - Precise：pick_precise_instance + 返回唯一 index
  // 若全部失败且 status='empty_self' → 返回空交给关系锚定模块
  Ok(vec![])
}
```

> 接口 `resolve_targets` 的输出是**一组“可执行目标”**（xpath + 第 n 个），交由你的 V3 执行器点击；**失败**时，显式返回“空 + 原因”，由上层切换到“关系锚定模块”。

---

# 关键策略细节

### 1) 绝对匹配（精准模式）

* **几何优先**：与用户点选 `tapBounds` 做 IoU 最大者。
* **签名校验**：`ancestryPathSig` / `clickableParentSig` 一致性加权；若存在 `neighborTextTokens`，做局部文本相似度加分。
* **可见/可点**过滤：剔除 `!visible || !clickable`。

> 这样即使三者字段完全相同、仅 index 不同，也能稳定锁定“用户选中的那个”。

### 2) 批量模式的顺序

* 默认 `duplicateOrder = 'reading'`（稳定且可预期）。
* 可切换 `'geometry'`（离起点最近优先）或 `'score'`（需要为每个实例评单体分）。

### 3) 自身字段空（empty_self）

* `relationSeed` 填足**父/子/邻接**线索：

  * 父级：`clickable-parent` 的 class/id/局部文本
  * 子级：强语义 text/desc
  * 邻接：同层“左/右标签文本”
* 上层据此切到 “Relation-Anchor 模块”（比如 `container + neighborText → parentOf(text='…')`）。

---

# 门限与默认值（与现有闸门口径兼容）

* 单字段接受阈值：`≥ 0.78` 或 `expectedCount == 1`
* 组合停止：`expectedCount == 1` 或 组合分 `≥ 0.82`
* 真机闸门：`real_count == 1 && min_confidence ≥ 0.70` 或 `top-gap ≥ 0.15`
* 索引惩罚：局部 `−0.15`，全局 `−0.60`（仅兜底）

---

# 交付到“下一步”的契约要点（最重要）

1. **SelfAnchorPlan**：候选、容器/父级、重复顺序、实例指纹/关系种子——**让后续模块不用再回到原始点击上下文**也能继续。
2. **AnchorTicket（后端）**：包含 `match_mode` 与批量节流，确保执行器知道**怎么遍历**。
3. **失败明细**：记录 `expectedCount vs real_count`、降级路径、最终选择器；回写 StepCard，便于复盘与二次学习。

---

# 你现在可以怎么做（最小增量）

* 前端先实现：`feature_extract.ts`、`scoring.ts`、`compose_plan.ts`、`fingerprint.ts`（产出 `SelfAnchorPlan`）。
* 后端先实现：`uniqueness.rs::count_by_xpath`、`disambiguation.rs` 的 IoU + 签名挑选、`apply.rs::resolve_targets`。
* StepCard 新增 `self_anchor` 节，并透传 `match_mode` + `plan`。
* 日志对齐：“计数、顺序、指纹命中比例、最终 xpath+index”。

这样，“自我锚定”模块既能**独立演进**，又能为后续“关系锚定 / 区域锚定 / 邻接锚定 / 多实例遍历”提供充足上下文与稳定契约；三种用户模式一并覆盖，重复组绝对匹配与批量执行都踩稳。
