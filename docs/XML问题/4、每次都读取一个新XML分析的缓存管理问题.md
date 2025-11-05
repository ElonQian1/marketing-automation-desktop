我每次 新建一个步骤，都要读取一个页面的XML分析， 来编写 adb dump 自动化设备脚本。

所以这个XML分析的分析缓存我应该如何管理？

非常好，这里给你一套**“三层缓存 + 引用计数 + 版本/指纹”**的可落地方案，专门解决“每次新建步骤都要读一份 XML 分析”的管理问题。重点：**同一 XML 只分析一次，跨步骤复用；缓存丢了可自愈；可管控体积与生命周期。**

---

# 先给答案（怎么管）

**缓存分三层**

1. **内存热缓存（LRU）**：超快访问，保存 *DOM 索引* 与 *子树指标(SubtreeMetrics)*。
2. **本地持久缓存（磁盘）**：跨进程/重启复用，保存原始 XML、可选的持久化 DOM/指标。
3. **步骤卡片里的 XML 快照（源 of truth）**：缓存都丢了，用它**自动重建**；再不行才真机 dump。

**键值规则**

* DOM 索引键：`snapshot_id = xxh3_64(xml)`（十六进制字符串）。
* 子树指标键：`(snapshot_id, abs_xpath, algo_fingerprint)`；再校验 `algo_version`，不一致即失效重算。

**生命周期**

* **创建步骤时**：计算 `snapshot_id`，把 XML 交给后端 `register_snapshot(xml)` → 写入内存与磁盘；步骤卡片保存 `abs_xpath + snapshot_id + xml_snapshot`。
* **执行/展示前**：调用 `ensure_subtree_metrics(step)`：内存 → 磁盘 → 快照重建 →（允许时）真机 dump。
* **GC/体积控制**：内存用 LRU（条数/字节双阈值），磁盘用 TTL + 引用计数（被步骤引用时不清理）。

**可观测性**

* **算法版本号**（`algo_version`）+ **指纹**（`algo_fingerprint`）写入每份指标；
* **来源标记**：`Cache|Snapshot|LiveDump` + `ByXPath|ByStructureMatch` 全链路落日志 & 回写步骤卡片 `lastMetrics`。

---

# 最小实现骨架（可直接放进你项目）

> 我按你的规范：**每段代码的第一行是“文件名+路径”**。以下是骨架+要点，长度克制，便于你粘贴扩展。

```rust
// src-tauri/src/services/cache_manager.rs
use anyhow::Result;
use chrono::{Utc, Duration};
use dashmap::DashMap;
use lru::LruCache;
use once_cell::sync::Lazy;
use parking_lot::Mutex;
use serde::{Serialize, Deserialize};
use std::{num::NonZeroUsize, path::PathBuf, fs};

use crate::domain::analysis_cache::api::{build_dom_index, compute_subtree_metrics};
use crate::domain::structure_runtime_match::algo::{METRICS_ALGO_VERSION, compute_algo_fingerprint, AlgoConfig};

// —— 基本类型 —— //
pub type SnapshotId = String; // xxh3_64(xml)
#[derive(Clone, Serialize, Deserialize)]
pub struct DomIndex { /* 你的DOM索引结构 */ }

#[derive(Clone, Serialize, Deserialize)]
pub struct SubtreeMetrics {
    pub algo_version: String,
    pub algo_fingerprint: u64,
    pub built_at_unix: i64,
    /* 你的骨架/字段等 */
}

// —— 运行时配置 —— //
pub struct CacheBudget {
    pub max_dom_mem_items: usize,
    pub max_metrics_mem_items: usize,
    pub disk_ttl_hours: i64,
}
pub static BUDGET: Lazy<CacheBudget> = Lazy::new(|| CacheBudget {
    max_dom_mem_items: 8,          // 同时保留8个页面的DOM
    max_metrics_mem_items: 512,    // 同时保留512个子树指标
    disk_ttl_hours: 72,            // 磁盘缓存保留72小时（无引用时）
});

// —— 内存层：LRU —— //
static DOM_LRU: Lazy<Mutex<LruCache<SnapshotId, DomIndex>>> =
    Lazy::new(|| Mutex::new(LruCache::new(NonZeroUsize::new(BUDGET.max_dom_mem_items).unwrap())));

static METRICS_LRU: Lazy<Mutex<LruCache<(SnapshotId, String, u64), SubtreeMetrics>>> =
    Lazy::new(|| Mutex::new(LruCache::new(NonZeroUsize::new(BUDGET.max_metrics_mem_items).unwrap())));

// —— 引用计数（步骤↔快照） —— //
pub static SNAPSHOT_REFS: Lazy<DashMap<SnapshotId, usize>> = Lazy::new(|| DashMap::new());

// —— 磁盘路径 —— //
fn cache_dir() -> PathBuf {
    // 你也可以使用 tauri::api::path::app_cache_dir
    let p = dirs::cache_dir().unwrap_or(std::env::temp_dir()).join("mad-cache");
    fs::create_dir_all(&p).ok();
    p
}
fn snap_xml_path(id: &SnapshotId) -> PathBuf { cache_dir().join(format!("{id}.xml.zst")) }
fn dom_bin_path(id: &SnapshotId) -> PathBuf { cache_dir().join(format!("{id}.dom.cbor.zst")) }
fn metrics_bin_path(key: &(SnapshotId, String, u64)) -> PathBuf {
    let (sid, xp, fp) = key;
    let h = xxhash_rust::xxh3::xxh3_64(xp.as_bytes());
    cache_dir().join(format!("{sid}.{h:016x}.{fp:016x}.met.cbor.zst"))
}

// —— 注册快照（内存+磁盘） —— //
pub fn register_snapshot(xml: &str) -> SnapshotId {
    let id = format!("{:016x}", xxhash_rust::xxh3::xxh3_64(xml.as_bytes()));
    if !snap_xml_path(&id).exists() {
        let data = zstd::encode_all(xml.as_bytes(), 3).unwrap();
        fs::write(snap_xml_path(&id), data).ok();
    }
    id
}

// —— DOM 索引：取或建 —— //
pub fn get_dom(id: &SnapshotId) -> Result<DomIndex> {
    if let Some(v) = DOM_LRU.lock().get(id).cloned() { return Ok(v); }
    // 尝试磁盘快照 → 内存建索引
    let xml = fs::read(snap_xml_path(id))?;
    let xml = zstd::decode_all(&xml[..])?;
    let xml = String::from_utf8(xml).unwrap();
    let dom = build_dom_index(&xml)?;
    DOM_LRU.lock().put(id.clone(), dom.clone());
    Ok(dom)
}

// —— 子树指标：取或建（含版本/指纹校验） —— //
pub fn get_or_compute_metrics(id: &SnapshotId, abs_xpath: &str, cfg: &AlgoConfig) -> Result<SubtreeMetrics> {
    let fp = compute_algo_fingerprint(cfg);
    let key = (id.clone(), abs_xpath.to_string(), fp);
    if let Some(m) = METRICS_LRU.lock().get(&key).cloned() {
        if m.algo_version == METRICS_ALGO_VERSION { return Ok(m); }
    }
    // 尝试磁盘
    if let Ok(bin) = fs::read(metrics_bin_path(&key)) {
        let m: SubtreeMetrics = zstd::decode_all(&bin[..]).ok()
            .and_then(|b| ciborium::de::from_reader(&b[..]).ok()).unwrap_or_else(|| SubtreeMetrics{
                algo_version: "".into(), algo_fingerprint: 0, built_at_unix: 0
            });
        if m.algo_version == METRICS_ALGO_VERSION && m.algo_fingerprint == fp {
            METRICS_LRU.lock().put(key.clone(), m.clone());
            return Ok(m);
        }
    }
    // 真正计算
    let dom = get_dom(id)?;
    let mut m = compute_subtree_metrics(&dom, abs_xpath, cfg)?;
    m.algo_version = METRICS_ALGO_VERSION.to_string();
    m.algo_fingerprint = fp;
    m.built_at_unix = Utc::now().timestamp();
    // 入内存
    METRICS_LRU.lock().put(key.clone(), m.clone());
    // 落盘
    let mut buf = Vec::new();
    ciborium::ser::into_writer(&m, &mut buf).ok();
    let comp = zstd::encode_all(&buf[..], 3).unwrap();
    fs::write(metrics_bin_path(&key), comp).ok();
    Ok(m)
}

// —— 引用与GC —— //
pub fn pin_snapshot(id: &SnapshotId) { SNAPSHOT_REFS.alter(id.clone(), |_,v| Some(v.unwrap_or(0)+1)); }
pub fn unpin_snapshot(id: &SnapshotId) { SNAPSHOT_REFS.alter(id.clone(), |_,v| v.and_then(|n| if n>1 {Some(n-1)} else {None} )); }

pub fn gc_disk() {
    let ttl = Duration::hours(BUDGET.disk_ttl_hours);
    if let Ok(entries) = fs::read_dir(cache_dir()) {
        for e in entries.flatten() {
            let p = e.path();
            if let Ok(meta) = e.metadata() {
                let age_ok = meta.modified().ok()
                    .and_then(|t| t.elapsed().ok())
                    .map(|e| e > ttl.to_std().unwrap())
                    .unwrap_or(false);
                let name = p.file_name().unwrap().to_string_lossy().to_string();
                // 粗略判断文件是否属于某个 snapshot
                if age_ok {
                    // 文件名开头的16位hash当作 snapshot_id 前缀
                    let id = name.get(0..16).unwrap_or("").to_string();
                    if id.is_empty() || SNAPSHOT_REFS.get(&id).is_none() {
                        let _ = fs::remove_file(p);
                    }
                }
            }
        }
    }
}
```

```rust
// src-tauri/src/commands/analysis.rs
use anyhow::Result;
use serde::{Serialize, Deserialize};
use crate::services::cache_manager::*;

#[derive(Clone, Serialize, Deserialize)]
pub struct StepCardDto {
    pub step_id: String,
    pub abs_xpath: String,
    pub xml_snapshot: Option<String>,
    pub snapshot_id: Option<String>,
    pub allow_backend_fallback: bool,
    pub device_id: Option<String>,
    pub algo: AlgoConfig,
}

#[tauri::command]
pub fn register_snapshot_cmd(xml: String) -> String { register_snapshot(&xml) }

#[tauri::command]
pub fn link_step_snapshot(step_id: String, snapshot_id: String) {
    pin_snapshot(&snapshot_id);
    // 建议把 step_id→snapshot_id 写一份小的 manifest 文件，便于恢复引用
}

#[tauri::command]
pub fn ensure_subtree_metrics_cmd(step: StepCardDto) -> Result<SubtreeMetrics, String> {
    // 1) 先用现有 snapshot_id
    if let Some(id) = &step.snapshot_id {
        if let Ok(m) = get_or_compute_metrics(id, &step.abs_xpath, &step.algo) {
            return Ok(m).map_err(|e| e.to_string());
        }
    }
    // 2) 用卡片快照重新注册
    if let Some(xml) = &step.xml_snapshot {
        let sid = register_snapshot(xml);
        pin_snapshot(&sid);
        return get_or_compute_metrics(&sid, &step.abs_xpath, &step.algo).map_err(|e| e.to_string());
    }
    // 3) 可选：真机 dump 回退（略：dump→register_snapshot→get_or_compute_metrics）
    Err("cache miss and no snapshot to rebuild".into())
}

#[tauri::command]
pub fn gc_disk_cmd() { gc_disk() }
```

```ts
// src/api/analysis.ts
import { invoke } from "@tauri-apps/api";
export async function registerSnapshot(xml: string): Promise<string> {
  return invoke("register_snapshot_cmd", { xml });
}
export async function linkStepSnapshot(stepId: string, snapshotId: string) {
  return invoke("link_step_snapshot", { stepId, snapshotId });
}
export async function ensureSubtreeMetrics(step: any) {
  return invoke("ensure_subtree_metrics_cmd", { step });
}
export async function gcDisk() {
  return invoke("gc_disk_cmd");
}
```

---

## 管理策略清单（可直接用）

* **去重**：`snapshot_id = hash(xml)` 天然去重；多步骤共享同一快照。
* **引用计数**：创建/加载步骤时 `pin_snapshot`；删除步骤或脚本时 `unpin_snapshot`。
* **内存限额**：`DOM_LRU`、`METRICS_LRU` 用条目限额（也可换字节限额）；超限自动淘汰。
* **磁盘限额/TTL**：定时 `gc_disk()`：超过 TTL 且**无引用**的文件删掉。
* **跨重启恢复引用**：把 `step_id -> snapshot_id` 写一份小 **manifest.json**（project 级或脚本旁），启动时加载→对每个 `snapshot_id` 执行 `pin_snapshot`。
* **版本与指纹**：`algo_version` 变了→强制失效；`algo_fingerprint` 变了→自然走新 Key。
* **自愈**：`ensure_subtree_metrics` 统一封装 **内存→磁盘→快照→（可选）真机** 的回退流程。
* **多设备隔离**（可选）：在快照元信息里记录 `device_model/resolution/density/app_package`；不同设备/包名的快照分目录存放，避免误复用。

---

## UI/可视化建议（可选）

* 在“页面分析”的右上角加一个**缓存面板**：

  * 热缓存命中率、当前 DOM/子树条目数量
  * 磁盘占用、上次 GC 时间、一键清理按钮
  * 选中步骤时显示：`snapshot_id`、来源（Cache/Snapshot/LiveDump）与算法版本/指纹

---

**总结**
这套管理方案能保证：**同XML一步建索引，多处复用**；**跨步骤/跨重启可复用**；**缓存丢失自动重建**；并且可控的**内存/磁盘**占用与**可追溯**的算法来源。你把上面的骨架粘进去，按你已有的 `build_dom_index/compute_subtree_metrics/adb_dump` 函数对齐一下，就能跑起来。需要我把 `manifest.json` 和“磁盘压缩（zstd）+ CBOR”读写也补成完整实现，也可以直接给你补丁版。
