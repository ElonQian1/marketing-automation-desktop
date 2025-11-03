太好了！按你“放在 domain 层、不做独立子 crate”的方案，下面给出**可直接落仓的模块化骨架代码**（最小可跑、便于逐步替换实现）。
我把每段代码的**第一行写了“文件路径”**，符合你“保留文件名与路径”的习惯。

---

```rust
// src-tauri/src/domain/structure_runtime_match/mod.rs
pub mod types;
pub mod config;
pub mod orchestrator;

pub mod ports {
    pub mod xml_view;
    pub mod cache;
}

pub mod container_gate {
    pub mod detector;
}

pub mod layout_gate {
    pub mod classifier;
}

pub mod signature {
    pub mod features;
    pub mod learner;
    pub mod matcher;
}

pub mod skeleton {
    pub mod dsl;
    pub mod checker;
}

pub mod field_refine {
    pub mod scorer;
}

pub mod scoring {
    pub mod weights;
    pub mod combiner;
    pub mod gates;
}

// 对外唯一入口
pub use orchestrator::sm_run_once;
```

```rust
// src-tauri/src/domain/structure_runtime_match/types.rs
use serde::{Deserialize, Serialize};

pub type SmNodeId = u32;

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct SmBounds {
    pub left: i32,
    pub top: i32,
    pub right: i32,
    pub bottom: i32,
}
impl SmBounds {
    pub fn width(&self) -> i32 { self.right - self.left }
    pub fn height(&self) -> i32 { self.bottom - self.top }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum SmLayoutType {
    WaterfallMulti,
    MasonrySingle,
    UniformGrid,
    List,
    Carousel,
    Unknown,
}

#[derive(Default, Clone, Debug, Serialize, Deserialize)]
pub struct SmScores {
    pub geom: f32,
    pub tpl: f32,
    pub skeleton: f32,
    pub field: f32,
    pub total: f32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SmItemHit {
    pub node: SmNodeId,
    pub bounds: SmBounds,
    pub scores: SmScores,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SmContainerHit {
    pub node: SmNodeId,
    pub bounds: SmBounds,
    pub layout: SmLayoutType,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SmResult {
    pub container: Option<SmContainerHit>,
    pub items: Vec<SmItemHit>,
}
```

```rust
// src-tauri/src/domain/structure_runtime_match/config.rs
use super::types::SmLayoutType;

#[derive(Clone, Debug)]
pub enum SmMode {
    Speed,
    Default,
    Robust,
}

#[derive(Clone, Debug, Default)]
pub struct SkeletonRules {
    pub require_image_above_text: bool,
    pub allow_depth_flex: i32, // 层级弹性 ±N
}

#[derive(Clone, Debug, Default)]
pub struct FieldRule {
    pub class_contains: Option<String>,
    pub must_equal_text: Option<String>,
    pub presence_only: bool, // 仅要求“存在/非空”
}

#[derive(Clone, Debug, Default)]
pub struct FieldRules {
    pub rules: Vec<FieldRule>,
}

#[derive(Clone, Debug)]
pub struct ContainerHint {
    pub xpath: Option<String>,
    pub fingerprint: Option<String>,
}

#[derive(Clone, Debug)]
pub struct SmConfig {
    pub mode: SmMode,
    pub allowed_layouts: Option<Vec<SmLayoutType>>, // None=Auto
    pub skip_geometry: bool,                        // 早停1：已知版式
    pub skip_template_when_single: bool,            // 早停2：单目标时跳过模板
    pub strict_skeleton_only: bool,                 // 早停3：只跑骨架（极速）
    pub min_confidence: f32,                        // 默认 0.70
    pub container_hint: Option<ContainerHint>,
    pub skeleton_rules: SkeletonRules,
    pub field_rules: FieldRules,
}
impl Default for SmConfig {
    fn default() -> Self {
        Self {
            mode: SmMode::Default,
            allowed_layouts: None,
            skip_geometry: false,
            skip_template_when_single: false,
            strict_skeleton_only: false,
            min_confidence: 0.70,
            container_hint: None,
            skeleton_rules: SkeletonRules { require_image_above_text: true, allow_depth_flex: 1 },
            field_rules: FieldRules::default(),
        }
    }
}
```

```rust
// src-tauri/src/domain/structure_runtime_match/ports/xml_view.rs
use super::super::types::{SmBounds, SmNodeId};

/// 适配你的 XmlIndexer；算法内核只依赖这个 trait
pub trait SmXmlView {
    fn xml_hash(&self) -> &str;
    fn container_candidates(&self) -> Vec<SmNodeId>;
    fn bounds(&self, n: SmNodeId) -> SmBounds;
    fn parent(&self, n: SmNodeId) -> Option<SmNodeId>;
    fn children(&self, n: SmNodeId) -> Vec<SmNodeId>;
    fn class(&self, n: SmNodeId) -> &str;
    fn text(&self, n: SmNodeId) -> &str;
    fn attr(&self, n: SmNodeId, k: &str) -> Option<&str>;
    fn pre(&self, n: SmNodeId) -> u32;
    fn post(&self, n: SmNodeId) -> u32;
}
```

```rust
// src-tauri/src/domain/structure_runtime_match/ports/cache.rs
use std::collections::HashMap;

pub trait SmCache {
    fn get(&mut self, k: &str) -> Option<Vec<u8>>;
    fn set(&mut self, k: &str, v: Vec<u8>);
}

#[derive(Default)]
pub struct NoopCache;
impl SmCache for NoopCache {
    fn get(&mut self, _k: &str) -> Option<Vec<u8>> { None }
    fn set(&mut self, _k: &str, _v: Vec<u8>) {}
}

#[derive(Default)]
pub struct MemCache {
    inner: HashMap<String, Vec<u8>>,
}
impl SmCache for MemCache {
    fn get(&mut self, k: &str) -> Option<Vec<u8>> { self.inner.get(k).cloned() }
    fn set(&mut self, k: &str, v: Vec<u8>) { self.inner.insert(k.to_string(), v); }
}
```

```rust
// src-tauri/src/domain/structure_runtime_match/container_gate/detector.rs
use super::super::ports::xml_view::SmXmlView;
use super::super::types::{SmBounds, SmContainerHit, SmLayoutType, SmNodeId};

/// 选面积最大的候选容器（简化版，够用；后续可按滚动属性/指纹增强）
pub fn pick_container<V: SmXmlView>(view: &V) -> Option<SmContainerHit> {
    let mut best: Option<(SmNodeId, SmBounds, i64)> = None;
    for n in view.container_candidates() {
        let b = view.bounds(n);
        let area = (b.width() as i64) * (b.height() as i64);
        if best.map_or(true, |(_, _, a)| area > a) {
            best = Some((n, b, area));
        }
    }
    best.map(|(node, bounds, _)| SmContainerHit { node, bounds, layout: SmLayoutType::Unknown })
}
```

```rust
// src-tauri/src/domain/structure_runtime_match/layout_gate/classifier.rs
use super::super::ports::xml_view::SmXmlView;
use super::super::types::{SmBounds, SmLayoutType, SmNodeId};

pub fn classify<V: SmXmlView>(view: &V, container: SmNodeId) -> SmLayoutType {
    // 极简规则：看 container 直接子元素的列数与高度差（可逐步替换）
    let mut items: Vec<SmBounds> = view
        .children(container)
        .into_iter()
        .map(|n| view.bounds(n))
        .filter(|b| b.width() > 20 && b.height() > 20)
        .collect();

    if items.len() < 3 {
        return SmLayoutType::Unknown;
    }

    // 粗略判断：按 left 聚类（±12px）
    items.sort_by_key(|b| b.left);
    let mut cols: Vec<Vec<SmBounds>> = vec![];
    for b in items {
        if let Some(last) = cols.last_mut() {
            let mean_left = last.iter().map(|x| x.left).sum::<i32>() as f32 / last.len() as f32;
            if (b.left as f32 - mean_left).abs() <= 12.0 {
                last.push(b);
            } else {
                cols.push(vec![b]);
            }
        } else {
            cols.push(vec![b]);
        }
    }

    if cols.len() >= 2 {
        // 多列：看同列高度差是否显著
        let mut var_sum = 0.0f32;
        for col in &cols {
            if col.len() < 2 { continue; }
            let hs: Vec<f32> = col.iter().map(|b| b.height() as f32).collect();
            let m = hs.iter().sum::<f32>() / hs.len() as f32;
            let v = hs.iter().map(|h| (h - m) * (h - m)).sum::<f32>() / hs.len() as f32;
            var_sum += v;
        }
        if var_sum > 10_000.0 { SmLayoutType::WaterfallMulti } else { SmLayoutType::UniformGrid }
    } else {
        // 单列：看高度差
        let col = &cols[0];
        let (min_h, max_h) = col
            .iter()
            .map(|b| b.height())
            .fold((i32::MAX, i32::MIN), |(mn, mx), h| (mn.min(h), mx.max(h)));
        if max_h > min_h + 60 { SmLayoutType::MasonrySingle } else { SmLayoutType::List }
    }
}

pub fn geom_score_for(layout: SmLayoutType) -> f32 {
    match layout {
        SmLayoutType::WaterfallMulti => 0.9,
        SmLayoutType::MasonrySingle => 0.85,
        SmLayoutType::UniformGrid => 0.8,
        SmLayoutType::List => 0.75,
        _ => 0.5,
    }
}
```

```rust
// src-tauri/src/domain/structure_runtime_match/signature/features.rs
use super::super::ports::xml_view::SmXmlView;
use super::super::types::{SmBounds, SmNodeId};

/// 最小特征：相对宽桶 + 是否含图/文（后续可替换更强版本）
pub struct Feat {
    pub width_bucket: u8,
    pub has_image_hint: bool,
    pub has_text_hint: bool,
}

pub fn extract<V: SmXmlView>(view: &V, container: SmNodeId, item: SmNodeId) -> Feat {
    let cb = view.bounds(container);
    let ib = view.bounds(item);
    let w_ratio = ib.width().max(1) as f32 / cb.width().max(1) as f32; // 0..1
    let width_bucket = ((w_ratio * 20.0).round() as i32).clamp(0, 20) as u8;

    let cls = view.class(item).to_ascii_lowercase();
    let has_image_hint = cls.contains("image");
    let has_text_hint = cls.contains("text") || !view.text(item).is_empty();

    Feat { width_bucket, has_image_hint, has_text_hint }
}
```

```rust
// src-tauri/src/domain/structure_runtime_match/signature/learner.rs
use std::collections::HashMap;
use super::features::{extract, Feat};
use super::super::ports::xml_view::SmXmlView;
use super::super::types::{SmLayoutType, SmNodeId};

#[derive(Clone, Debug)]
pub struct Template {
    pub width_bucket: u8,
    pub image_flag: bool,
    pub text_flag: bool,
    pub support: usize,
}

pub fn learn_or_load<V: SmXmlView>(
    view: &V,
    container: SmNodeId,
    _layout: SmLayoutType,
) -> Vec<Template> {
    // 简化策略：取 container 的前 24 个子节点做“众数模板”
    let mut counter: HashMap<(u8, bool, bool), usize> = HashMap::new();
    for it in view.children(container).into_iter().take(24) {
        let f = extract(view, container, it);
        *counter.entry((f.width_bucket, f.has_image_hint, f.has_text_hint)).or_insert(0) += 1;
    }
    let mut v: Vec<Template> = counter
        .into_iter()
        .map(|((w, i, t), c)| Template { width_bucket: w, image_flag: i, text_flag: t, support: c })
        .collect();
    v.sort_by_key(|t| std::cmp::Reverse(t.support));
    v.truncate(3);
    v
}
```

```rust
// src-tauri/src/domain/structure_runtime_match/signature/matcher.rs
use super::features::extract;
use super::learner::Template;
use super::super::ports::xml_view::SmXmlView;
use super::super::types::SmItemHit;

pub fn score_tpl<V: SmXmlView>(view: &V, container: u32, tpls: &[Template], items: &mut [SmItemHit]) {
    for it in items {
        let f = extract(view, container, it.node);
        let mut s = 0.0f32;
        for t in tpls {
            if t.width_bucket == f.width_bucket && t.image_flag == f.has_image_hint && t.text_flag == f.has_text_hint {
                s = 1.0; // 命中模板=1（后续可做相似度）
                break;
            }
        }
        it.scores.tpl = s;
    }
}
```

```rust
// src-tauri/src/domain/structure_runtime_match/skeleton/dsl.rs
#[derive(Clone, Debug)]
pub struct SkeletonRulesDsl {
    pub require_image_above_text: bool,
    pub allow_depth_flex: i32,
}
```

```rust
// src-tauri/src/domain/structure_runtime_match/skeleton/checker.rs
use super::dsl::SkeletonRulesDsl;
use super::super::ports::xml_view::SmXmlView;
use super::super::types::SmItemHit;

/// 极简实现：同时具有“图/文”线索则高分（可逐步替换为真实骨架规则）
pub fn score_skeleton<V: SmXmlView>(view: &V, rules: &SkeletonRulesDsl, items: &mut [SmItemHit]) {
    for it in items {
        let cls = view.class(it.node).to_ascii_lowercase();
        let has_img = cls.contains("image");
        let has_txt = cls.contains("text") || !view.text(it.node).is_empty();

        it.scores.skeleton = if rules.require_image_above_text {
            if has_img && has_txt { 0.9 } else { 0.3 }
        } else {
            if has_img || has_txt { 0.6 } else { 0.0 }
        };
    }
}
```

```rust
// src-tauri/src/domain/structure_runtime_match/field_refine/scorer.rs
use super::super::ports::xml_view::SmXmlView;
use super::super::types::SmItemHit;
use super::super::config::FieldRules;

/// 字段/文本细则：presence_only / class_contains / must_equal_text
pub fn score_fields<V: SmXmlView>(view: &V, fr: &FieldRules, items: &mut [SmItemHit]) {
    for it in items {
        let mut score = 0.0f32;
        let mut cnt = 0.0f32;

        for r in &fr.rules {
            cnt += 1.0;
            let mut ok = true;
            if let Some(cls) = &r.class_contains {
                ok &= view.class(it.node).contains(cls);
            }
            if let Some(t) = &r.must_equal_text {
                ok &= view.text(it.node) == t;
            }
            if r.presence_only {
                ok &= !view.text(it.node).is_empty();
            }
            score += if ok { 1.0 } else { 0.0 };
        }

        it.scores.field = if cnt > 0.0 { score / cnt } else { 0.5 };
    }
}
```

```rust
// src-tauri/src/domain/structure_runtime_match/scoring/weights.rs
use super::super::types::SmItemHit;
use super::super::config::SmMode;

#[derive(Clone, Copy)]
pub struct Weights {
    pub geom: f32,
    pub tpl: f32,
    pub skeleton: f32,
    pub field: f32,
}

pub fn weights_for(mode: &SmMode) -> Weights {
    match mode {
        SmMode::Speed => Weights { geom: 0.15, tpl: 0.0, skeleton: 0.55, field: 0.30 },
        SmMode::Default => Weights { geom: 0.20, tpl: 0.30, skeleton: 0.30, field: 0.20 },
        SmMode::Robust => Weights { geom: 0.25, tpl: 0.35, skeleton: 0.20, field: 0.20 },
    }
}
```

```rust
// src-tauri/src/domain/structure_runtime_match/scoring/combiner.rs
use super::super::types::SmItemHit;
use super::weights::Weights;

pub fn combine(items: &mut [SmItemHit], w: &Weights) {
    for it in items {
        it.scores.total =
            w.geom * it.scores.geom +
            w.tpl * it.scores.tpl +
            w.skeleton * it.scores.skeleton +
            w.field * it.scores.field;
    }
}
```

```rust
// src-tauri/src/domain/structure_runtime_match/scoring/gates.rs
use super::super::types::SmItemHit;

pub fn retain_passed(mut items: Vec<SmItemHit>, min_conf: f32) -> Vec<SmItemHit> {
    items.retain(|it| it.scores.total >= min_conf);
    items
}

pub fn sort_desc(items: &mut Vec<SmItemHit>) {
    items.sort_by(|a, b| b.scores.total.partial_cmp(&a.scores.total).unwrap());
}
```

```rust
// src-tauri/src/domain/structure_runtime_match/orchestrator.rs
use super::config::{SkeletonRules, SmConfig};
use super::container_gate::detector::pick_container;
use super::field_refine::scorer::score_fields;
use super::layout_gate::classifier::{classify, geom_score_for};
use super::ports::cache::SmCache;
use super::ports::xml_view::SmXmlView;
use super::scoring::combiner::combine;
use super::scoring::gates::{retain_passed, sort_desc};
use super::scoring::weights::weights_for;
use super::signature::learner::learn_or_load;
use super::signature::matcher::score_tpl;
use super::skeleton::dsl::SkeletonRulesDsl;
use super::skeleton::checker::score_skeleton;
use super::types::{SmItemHit, SmLayoutType, SmResult};

pub fn sm_run_once<V: SmXmlView, C: SmCache>(
    view: &V,
    _cache: &mut C,
    cfg: &SmConfig,
    want_all: bool,
) -> SmResult {
    // 1) 容器限域
    let container = match pick_container(view) {
        Some(c) => c,
        None => return SmResult { container: None, items: vec![] },
    };

    // 早停3：只跑骨架
    if cfg.strict_skeleton_only {
        let mut items = propose_item_roots(view, container.node);
        score_skeleton(
            view,
            &SkeletonRulesDsl {
                require_image_above_text: cfg.skeleton_rules.require_image_above_text,
                allow_depth_flex: cfg.skeleton_rules.allow_depth_flex,
            },
            &mut items,
        );
        score_fields(view, &cfg.field_rules, &mut items);
        let w = weights_for(&cfg.mode);
        combine(&mut items, &w);
        let mut passed = retain_passed(items, cfg.min_confidence);
        sort_desc(&mut passed);
        if !want_all { passed.truncate(1); }
        return SmResult { container: Some(container), items: passed };
    }

    // 2) 几何（可跳过）
    let layout = if cfg.skip_geometry { SmLayoutType::Unknown } else { classify(view, container.node) };

    // 3) 模板签名（仅“取一个”可跳过）
    let templates = if want_all || !cfg.skip_template_when_single {
        learn_or_load(view, container.node, layout)
    } else {
        vec![]
    };

    let mut items = propose_item_roots(view, container.node);

    if !templates.is_empty() {
        score_tpl(view, container.node, &templates, &mut items);
        items.retain(|it| it.scores.tpl >= 0.1);
    }

    // 4) 骨架 + 字段 + 几何分
    score_skeleton(
        view,
        &SkeletonRulesDsl {
            require_image_above_text: cfg.skeleton_rules.require_image_above_text,
            allow_depth_flex: cfg.skeleton_rules.allow_depth_flex,
        },
        &mut items,
    );
    score_fields(view, &cfg.field_rules, &mut items);
    for it in items.iter_mut() {
        it.scores.geom = geom_score_for(layout);
    }

    // 5) 合成 + 闸门 + 选择
    let w = weights_for(&cfg.mode);
    combine(&mut items, &w);
    let mut passed = retain_passed(items, cfg.min_confidence);
    sort_desc(&mut passed);
    if !want_all { passed.truncate(1); }

    SmResult { container: Some(container), items: passed }
}

/// 候选卡片根（简化版：直接取 container 的 children）
fn propose_item_roots<V: SmXmlView>(view: &V, container: u32) -> Vec<SmItemHit> {
    view.children(container)
        .into_iter()
        .map(|n| SmItemHit { node: n, bounds: view.bounds(n), scores: Default::default() })
        .collect()
}
```

```rust
// src-tauri/src/commands/structure_match.rs
use tauri::State;

use crate::domain::structure_runtime_match::{
    config::SmConfig,
    ports::{cache::MemCache, xml_view::SmXmlView},
    sm_run_once,
    types::SmResult,
};

// App 全局缓存（示例）
#[derive(Default)]
pub struct AppCache {
    pub mem: parking_lot::Mutex<MemCache>,
}

// 你的 XmlIndexer 需要写一个适配器实现 SmXmlView
struct MyXmlViewAdapter<'a> {
    // indexer: &'a MyXmlIndexer, // ← TODO: 替换成你现有的索引器
    _phantom: std::marker::PhantomData<&'a ()>,
}
impl<'a> MyXmlViewAdapter<'a> {
    pub fn new(/* indexer: &'a MyXmlIndexer */) -> Self {
        Self { _phantom: std::marker::PhantomData }
    }
}
// 这里先给出空实现的“骨架方法签名”，方便你对接
impl<'a> SmXmlView for MyXmlViewAdapter<'a> {
    fn xml_hash(&self) -> &str { "TODO-xml-hash" }
    fn container_candidates(&self) -> Vec<u32> { vec![] }
    fn bounds(&self, _n: u32) -> crate::domain::structure_runtime_match::types::SmBounds {
        crate::domain::structure_runtime_match::types::SmBounds { left: 0, top: 0, right: 1, bottom: 1 }
    }
    fn parent(&self, _n: u32) -> Option<u32> { None }
    fn children(&self, _n: u32) -> Vec<u32> { vec![] }
    fn class(&self, _n: u32) -> &str { "" }
    fn text(&self, _n: u32) -> &str { "" }
    fn attr(&self, _n: u32, _k: &str) -> Option<&str> { None }
    fn pre(&self, _n: u32) -> u32 { 0 }
    fn post(&self, _n: u32) -> u32 { 0 }
}

#[tauri::command]
pub async fn sm_match_once(step_cfg: SmConfig, xml: String, want_all: bool, state: State<'_, AppCache>)
    -> Result<SmResult, String>
{
    // TODO: 用 xml 构建你已有的 XmlIndexer，然后适配
    let view = MyXmlViewAdapter::new();
    let mut cache = state.mem.lock();
    let res = sm_run_once(&view, &mut *cache, &step_cfg, want_all);
    Ok(res)
}
```

---

## 怎么用（集成提示）

* 在后端 `main.rs` 注册命令：

  ```rust
  // src-tauri/src/main.rs
  mod commands;
  use commands::structure_match::{sm_match_once, AppCache};

  tauri::Builder::default()
      .manage(AppCache::default())
      .invoke_handler(tauri::generate_handler![sm_match_once])
      .run(tauri::generate_context!())?;
  ```
* 前端 `invoke('sm_match_once', { stepCfg, xml, wantAll: true })`，拿到 `SmResult` 后高亮 `items[i].bounds` 即可。
* 你只需要把 `MyXmlViewAdapter` 接到你现有的 `XmlIndexer`，以及把 `container_candidates()` 返回真实候选容器（可滚、大面积、StepCard hint 命中者）。

---

## 接下来你可以逐步替换/增强的点

1. **layout_gate/classifier**：替换为你更完整的几何判版式（列聚类/宽度一致性/高度CV/行对齐度）。
2. **signature/**：把“位图/哈希/Hamming 距离 + 采样每列前8–12个”填充进去。
3. **skeleton/**：接入你真实的骨架 DSL（图上文下/层级弹性±1/子结构存在性）。
4. **field_refine/scorer**：扩展“子元素文本必须=某值”的查找路径与相似匹配（需要在 SmXmlView 提供更细 API）。
5. **orchestrator**：接上权重/阈值 UI 配置、找全 vs 单选策略（first/last/random/precise），以及日志/overlay。

这套骨架保持**模块化 + 可早停 + 可扩展**，与你现有 domain 架构无冲突；AI 代理也能一眼定位、按模块迭代。需要我再帮你把 `MyXmlViewAdapter` 对接到你项目里的具体 `XmlIndexer` 吗？
