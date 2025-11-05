如果分析的XML缓存丢失，执行步骤所需要的参数丢失 ，怎么办？ 能不能自动重新分析？你好像刚刚的回答中，没有说到这一点是吗？

可以，而且应该**默认自动重建**。思路是：把“执行前参数获取”做成**可自愈**流程——先查缓存，没命中就用步骤卡片内的 XML 快照重建；快照无效/缺失，再（在允许时）做一次**真机 dump**重建；仍失败才报错。下面给你直接可落地的改造点与示例代码（注意我按你的约定在每个文件第一行保留“文件名+路径”）。

---

## 决策流（Auto-Rebuild on Cache Miss）

1. **尝试缓存命中**：用 `(snapshot_id, abs_xpath)` 取 `SubtreeMetrics`
2. **用步骤卡片里的 XML 快照重建**：

   * 从 `stepCard.xml_snapshot` 计算 `snapshot_id`
   * 建 DOM 索引 → 计算 `SubtreeMetrics` → 回填缓存
3. **允许真机回退（可选）**：

   * 若 `stepCard.allow_backend_fallback == true` 且设备在线 → `adb dump` 当前 XML
   * 先尝试用 `abs_xpath` 直接取节点；失败则用**结构匹配**（容器限域+骨架+可点父）找等价节点，再计算 `SubtreeMetrics`
4. **返回结果**：同时返回 `rebuild_source = cache | snapshot | live_dump | fail` 与提示信息，前端可 Toast“已自动重建参数（来自快照/真机）”。

---

## 后端（Rust/Tauri）

### 1) 统一入口：确保拿到 SubtreeMetrics（命中或重建）

```rust
// src-tauri/src/domain/analysis_cache/rebuild.rs
use crate::domain::analysis_cache::api::{get_or_compute_subtree, register_snapshot};
use crate::infra::adb::ui_dump::adb_dump_ui_xml;
use crate::domain::structure_runtime_match::orchestrator::compute_subtree_metrics_from_dom;
use anyhow::{Result, bail};

#[derive(Clone, serde::Serialize)]
pub enum RebuildSource { Cache, Snapshot, LiveDump }

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct StepCardDto {
    pub abs_xpath: String,
    pub xml_snapshot: Option<String>,     // 步骤卡片里保存的原始快照
    pub allow_backend_fallback: bool,     // 是否允许真机回退
    pub device_id: Option<String>,        // 设备ID（允许回退时需要）
    pub snapshot_id: Option<String>,      // 可选缓存字段（若前端已注册）
}

#[derive(Clone, serde::Serialize)]
pub struct EnsureMetricsResp {
    pub source: RebuildSource,
    pub snapshot_id: String,
    pub metrics: SubtreeMetricsDto,
    pub message: String,
}

/// 关键函数：确保有可用的 SubtreeMetrics（优先缓存→快照→真机）
pub fn ensure_subtree_metrics(step: &StepCardDto) -> Result<EnsureMetricsResp> {
    // 0) 若传入 snapshot_id，先尝试缓存命中
    if let Some(id) = &step.snapshot_id {
        if let Some(m) = crate::domain::analysis_cache::api::try_get_subtree(id, &step.abs_xpath) {
            return Ok(EnsureMetricsResp {
                source: RebuildSource::Cache,
                snapshot_id: id.clone(),
                metrics: m.into(),
                message: "cache hit".into()
            });
        }
    }

    // 1) 尝试用步骤卡片里的 XML 快照注册并重建
    if let Some(xml) = &step.xml_snapshot {
        let sid = register_snapshot(xml);
        let m = get_or_compute_subtree(&sid, &step.abs_xpath);
        return Ok(EnsureMetricsResp {
            source: RebuildSource::Snapshot,
            snapshot_id: sid,
            metrics: m.into(),
            message: "rebuilt from step snapshot".into()
        });
    }

    // 2) 允许真机回退：dump → 解析 → 直接 XPath 或结构匹配定位 → 计算
    if step.allow_backend_fallback {
        let dev = step.device_id.clone().ok_or_else(|| anyhow::anyhow!("device_id required"))?;
        let live_xml = adb_dump_ui_xml(&dev)?;                // 真机 dump
        let sid = register_snapshot(&live_xml);               // 注册成新的 snapshot_id
        // 优先尝试 XPath 命中；不行则结构匹配定位同类节点，得到“等价 XPath”
        let (resolved_xpath, located_via_structure) =
            crate::engine::locator::resolve_xpath_or_structure(&sid, &step.abs_xpath)?;
        let m = get_or_compute_subtree(&sid, &resolved_xpath);
        let msg = if located_via_structure { "rebuilt from live dump via structure match" } else { "rebuilt from live dump via xpath" };
        return Ok(EnsureMetricsResp {
            source: RebuildSource::LiveDump,
            snapshot_id: sid,
            metrics: m.into(),
            message: msg.into()
        });
    }

    bail!("cache miss and no snapshot provided; backend fallback is disabled");
}
```

> 说明：
>
> * `try_get_subtree` 是一个你现有 `SUBTREE_CACHE` 的只读快捷函数（很简单，不再贴）。
> * `resolve_xpath_or_structure`：先用原 XPath 命中，失败才走你已有的“容器限域 + 骨架签名 + 可点父”的结构匹配定位，返回“等价 XPath”。

### 2) 暴露 Tauri 命令给前端

```rust
// src-tauri/src/commands/analysis.rs
#[tauri::command]
pub fn ensure_subtree_metrics_cmd(step: StepCardDto) -> Result<EnsureMetricsResp, String> {
    crate::domain::analysis_cache::rebuild::ensure_subtree_metrics(&step)
        .map_err(|e| e.to_string())
}
```

---

## 前端（React）

### 执行前“一键自愈”：

```ts
// src/api/analysis.ts
export async function ensureSubtreeMetrics(step: StepCardDto): Promise<EnsureMetricsResp> {
  return invoke("ensure_subtree_metrics_cmd", { step });
}
```

```ts
// 执行按钮的 onClick 里
const resp = await ensureSubtreeMetrics({
  abs_xpath: step.absXPath,
  xml_snapshot: step.xmlSnapshot,             // 步骤卡片里自带
  allow_backend_fallback: step.allowBackendFallback,
  device_id: currentDeviceId,
  snapshot_id: step.snapshotId ?? undefined,  // 有就传
});

toast.success(
  resp.source === 'Cache' ? '使用缓存参数' :
  resp.source === 'Snapshot' ? '已用快照自动重建参数' :
  '已用真机dump自动重建参数'
);

// 把 resp.snapshot_id 回写到卡片，便于后续命中缓存
updateStepCard({ snapshotId: resp.snapshot_id });

// 后续把 resp.metrics 交给“智能自动链 / 结构匹配”执行器即可
```

---

## 两个健壮性细节（强烈建议）

* **算法版本号**：在 `SubtreeMetrics` 里加入 `metrics_version`。当算法升级时，命中旧缓存也要**强制重建**，避免参数与评分逻辑不一致。
* **来源标记**：在执行日志里记录 `rebuild_source` 和 `snapshot_id`，方便回溯“为什么这次是 live dump”。

---

## 结果

* 缓存丢失时，系统**自动从步骤卡片的 XML 快照重建**；
* 快照缺失/损坏时，在允许前提下**自动真机 dump 重建**（含结构匹配纠偏）；
* 前端只需调用一个 `ensureSubtreeMetrics` 即可，统一拿到执行所需参数与来源信息。

需要的话，我可以把你现有 `compute_subtree_metrics`/`structure_runtime_match` 的函数签名对齐到上面的调用，并补上 `resolve_xpath_or_structure` 的骨架实现。
