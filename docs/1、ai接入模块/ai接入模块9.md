太好了！我直接把**可编译的“骨架代码”**给你，按你仓库 `marketing-automation-desktop` 的目录来放。你把这些文件拷进去（已按你约定：**代码第一行是文件路径**），AI 代理就能基于它们继续填充业务细节。

---

### 后端（Tauri / Rust）

```rust
// src-tauri/src/services/lead_hunt.rs
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{fs, path::PathBuf};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RawComment {
    pub id: String,
    pub platform: String,              // "douyin" | "xhs"
    pub videoUrl: Option<String>,
    pub author: String,
    pub content: String,
    pub ts: Option<i64>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ReplayPlan {
    pub id: String,
    pub platform: String,
    pub videoUrl: String,
    pub author: String,
    pub comment: String,
    pub suggested_reply: Option<String>,
}

fn data_dir() -> anyhow::Result<PathBuf> {
    let dir = tauri::api::path::app_data_dir(&tauri::Config::default())
        .ok_or_else(|| anyhow::anyhow!("no data dir"))?;
    let p = dir.join("lead_hunt");
    fs::create_dir_all(&p)?;
    Ok(p)
}

pub fn save_comments(items: Vec<RawComment>) -> anyhow::Result<()> {
    let p = data_dir()?.join("comments.json");
    let mut all: Vec<RawComment> = if p.exists() {
        serde_json::from_slice(&fs::read(&p)?)?
    } else {
        vec![]
    };
    all.extend(items);
    fs::write(p, serde_json::to_vec_pretty(&all)?)?;
    Ok(())
}

pub fn list_comments() -> anyhow::Result<Vec<RawComment>> {
    let p = data_dir()?.join("comments.json");
    if p.exists() {
        let v: Vec<RawComment> = serde_json::from_slice(&fs::read(&p)?)?;
        Ok(v)
    } else {
        Ok(vec![])
    }
}

pub fn write_replay_plan(plan: ReplayPlan) -> anyhow::Result<()> {
    let outbox = data_dir()?.join("../../debug/outbox");
    fs::create_dir_all(&outbox)?;
    let file = outbox.join("replay_plans.json");
    let mut arr: Vec<Value> = if file.exists() {
        serde_json::from_slice(&fs::read(&file)?)?
    } else {
        vec![]
    };
    arr.push(serde_json::to_value(&plan)?);
    fs::write(file, serde_json::to_vec_pretty(&arr)?)?;
    Ok(())
}
```

```rust
// src-tauri/src/device/provider.rs
use async_trait::async_trait;

#[async_trait]
pub trait DumpProvider: Send + Sync {
    async fn open_app(&self, platform: &str) -> anyhow::Result<()>;
    async fn open_video(&self, url: &str) -> anyhow::Result<()>;
    async fn dump_xml(&self) -> anyhow::Result<String>;
    async fn reply(&self, author: &str, text: &str) -> anyhow::Result<()>;
}
```

```rust
// src-tauri/src/device/mock.rs
use crate::device::provider::DumpProvider;

pub struct MockDumpProvider;

#[async_trait::async_trait]
impl DumpProvider for MockDumpProvider {
    async fn open_app(&self, _platform: &str) -> anyhow::Result<()> { Ok(()) }
    async fn open_video(&self, _url: &str) -> anyhow::Result<()> { Ok(()) }
    async fn dump_xml(&self) -> anyhow::Result<String> {
        Ok(r#"
<hierarchy rotation="0">
  <node index="0" text="" resource-id="com.ss.android.ugc.aweme:id/comment_list" class="android.widget.ListView">
    <node index="0" text="多少钱一套？支持到广州吗" resource-id="comment_text" class="android.widget.TextView"/>
    <node index="1" text="地址在哪？线下能看样吗" resource-id="comment_text" class="android.widget.TextView"/>
  </node>
</hierarchy>
"#.to_string())
    }
    async fn reply(&self, _author: &str, _text: &str) -> anyhow::Result<()> { Ok(()) }
}
```

```rust
// src-tauri/src/device/orchestrator.rs
use crate::services::lead_hunt::ReplayPlan;
use crate::device::provider::DumpProvider;

pub struct ReplayOrchestrator<P: DumpProvider> { pub p: P }

impl<P: DumpProvider> ReplayOrchestrator<P> {
    pub fn new(p: P) -> Self { Self { p } }

    pub async fn run(&self, plan: &ReplayPlan) -> anyhow::Result<()> {
        self.p.open_app(&plan.platform).await?;
        self.p.open_video(&plan.videoUrl).await?;
        let _xml = self.p.dump_xml().await?;
        // TODO: 在 _xml 中定位目标评论（作者/文本），此处先省略
        self.p.reply(&plan.author, plan.suggested_reply.as_deref().unwrap_or("")).await?;
        Ok(())
    }
}
```

```rust
// src-tauri/src/commands_lead_hunt.rs
use tauri::AppHandle;
use serde_json::Value;

use crate::services::lead_hunt::{RawComment, ReplayPlan, save_comments, list_comments, write_replay_plan};
use crate::device::mock::MockDumpProvider;
use crate::device::orchestrator::ReplayOrchestrator;

#[tauri::command]
pub async fn lh_save_comments(items: Vec<RawComment>) -> Result<(), String> {
    save_comments(items).map_err(err)
}

#[tauri::command]
pub async fn lh_list_comments() -> Result<Vec<RawComment>, String> {
    list_comments().map_err(err)
}

#[tauri::command]
pub async fn lh_import_comments() -> Result<(), String> {
    let mock = include_str!("mock/social_comments.json");
    let items: Vec<RawComment> = serde_json::from_str(mock).map_err(err)?;
    save_comments(items).map_err(err)
}

#[tauri::command]
pub async fn lh_create_replay_plan(plan: ReplayPlan) -> Result<(), String> {
    write_replay_plan(plan).map_err(err)
}

#[tauri::command]
pub async fn lh_run_replay_plan(plan_id: String) -> Result<(), String> {
    // 简化：直接从 replay_plans.json 读取最后一条同 id 的 plan 执行
    use std::fs;
    use crate::services::lead_hunt::data_dir;
    let file = data_dir().map_err(err)?
        .join("../../debug/outbox")
        .join("replay_plans.json");
    if !file.exists() { return Err("no replay_plans.json".into()); }
    let arr: Vec<Value> = serde_json::from_slice(&fs::read(&file).map_err(err)?).map_err(err)?;
    let Some(v) = arr.into_iter().rev().find(|v| v["id"] == plan_id) else {
        return Err("plan not found".into());
    };
    let plan: ReplayPlan = serde_json::from_value(v).map_err(err)?;
    let orch = ReplayOrchestrator::new(MockDumpProvider);
    orch.run(&plan).await.map_err(err)
}

fn err<E: std::fmt::Display>(e: E) -> String { format!("{}", e) }
```

```json
// src-tauri/src/mock/social_comments.json
[
  {
    "id": "dy_1001",
    "platform": "douyin",
    "videoUrl": "https://v.douyin.com/xxxx",
    "author": "小王",
    "content": "多少钱一套？支持到广州吗"
  },
  {
    "id": "xhs_2001",
    "platform": "xhs",
    "videoUrl": "https://www.xiaohongshu.com/explore/xxxx",
    "author": "Lynn",
    "content": "地址在哪？线下能看样吗"
  },
  {
    "id": "dy_1002",
    "platform": "douyin",
    "videoUrl": "https://v.douyin.com/yyyy",
    "author": "老张",
    "content": "售后怎么联系？我这边装不上"
  }
]
```

> **main.rs 挂载命令（只贴需加的那几行）**

```rust
// src-tauri/src/main.rs 片段
mod services { pub mod lead_hunt; }
mod device { pub mod provider; pub mod mock; pub mod orchestrator; }
mod commands_lead_hunt;

use commands_lead_hunt::*;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      lh_save_comments, lh_list_comments, lh_import_comments, lh_create_replay_plan, lh_run_replay_plan,
      // 你的 ai_chat / ai_embed 等已有命令保持
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

---

### 前端（React / TS）

```ts
// src/ai/schemas/leadIntent.schema.ts
export const LeadIntentTool = {
  type: "function" as const,
  function: {
    name: "return_lead_analysis",
    description: "识别评论意图并返回结构化结果",
    parameters: {
      type: "object",
      required: ["intent", "confidence", "entities", "reply_suggestion"],
      properties: {
        intent: {
          type: "string",
          enum: ["询价", "询地址", "售后", "咨询", "无效"],
        },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        entities: {
          type: "object",
          properties: {
            product: { type: "string" },
            quantity: { type: "string" },
            location: { type: "string" },
            phone: { type: "string" },
            priceTarget: { type: "string" },
          },
        },
        reply_suggestion: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
      },
    },
  },
};
```

```ts
// src/features/leadHunt/analyzeLead.ts
import { aiChat } from "@/lib/aiClient";
import { LeadIntentTool } from "@/ai/schemas/leadIntent.schema";

export type RawComment = {
  id: string;
  platform: "douyin" | "xhs";
  videoUrl?: string;
  author: string;
  content: string;
  ts?: number;
};

export type LeadAnalysis = {
  id: string;
  platform: string;
  intent: string;
  confidence: number;
  entities: Record<string, string>;
  reply_suggestion: string;
  tags?: string[];
};

export async function analyzeOne(c: RawComment): Promise<LeadAnalysis> {
  const res: any = await aiChat({
    messages: [
      {
        role: "system",
        content: "你是社媒评论意图识别助手，仅通过函数返回 JSON。",
      },
      {
        role: "user",
        content: `平台:${c.platform}\n作者:${c.author}\n评论:${c.content}\n请判断意图并给出建议回复。`,
      },
    ],
    tools: [LeadIntentTool],
    toolChoice: "auto",
    stream: false,
  });
  const call = res?.choices?.[0]?.message?.tool_calls?.[0];
  if (call?.function?.name === "return_lead_analysis") {
    const out = JSON.parse(call.function.arguments);
    return {
      id: c.id,
      platform: c.platform,
      intent: out.intent,
      confidence: out.confidence,
      entities: out.entities || {},
      reply_suggestion: out.reply_suggestion || "",
      tags: out.tags || [],
    };
  }
  return {
    id: c.id,
    platform: c.platform,
    intent: "无效",
    confidence: 0,
    entities: {},
    reply_suggestion: "",
  };
}

export async function analyzeBatch(items: RawComment[], concurrency = 4) {
  const ret: LeadAnalysis[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      try {
        ret.push(await analyzeOne(items[idx]));
      } catch (e) {
        console.error(e);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return ret;
}
```

```tsx
// src/pages/LeadHunt.tsx
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import type { RawComment } from "@/features/leadHunt/analyzeLead";
import { analyzeBatch } from "@/features/leadHunt/analyzeLead";

type Row = RawComment & { analysis?: any };

export default function LeadHunt() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<string>("全部");
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const list = await invoke<RawComment[]>("lh_list_comments");
    setRows(list.map((r) => ({ ...r })));
  };

  useEffect(() => {
    refresh();
  }, []);

  const importMock = async () => {
    await invoke("lh_import_comments");
    await refresh();
  };

  const runAnalysis = async () => {
    setLoading(true);
    const result = await analyzeBatch(rows);
    const map = new Map(result.map((r) => [r.id, r]));
    setRows((prev) => prev.map((p) => ({ ...p, analysis: map.get(p.id) })));
    setLoading(false);
  };

  const createPlan = async (row: Row) => {
    await invoke("lh_create_replay_plan", {
      plan: {
        id: row.id,
        platform: row.platform,
        videoUrl: row.videoUrl || "",
        author: row.author,
        comment: row.content,
        suggested_reply: row.analysis?.reply_suggestion || null,
      },
    });
    alert("已写入回放计划到 debug/outbox/replay_plans.json");
  };

  const runPlan = async (row: Row) => {
    await invoke("lh_run_replay_plan", { planId: row.id });
    alert("已执行模拟（MockDumpProvider）");
  };

  const filtered = rows.filter((r) =>
    filter === "全部" ? true : r.analysis?.intent === filter
  );

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-lg font-semibold">精准获客</h2>
      <div className="flex gap-2 items-center">
        <button onClick={importMock}>导入评论（mock）</button>
        <button onClick={refresh}>刷新</button>
        <button onClick={runAnalysis} disabled={loading}>
          {loading ? "分析中..." : "AI 批量分析"}
        </button>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option>全部</option>
          <option>询价</option>
          <option>询地址</option>
          <option>售后</option>
          <option>咨询</option>
          <option>无效</option>
        </select>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr>
            <th>平台</th>
            <th>作者</th>
            <th>评论</th>
            <th>意图/置信</th>
            <th>建议回复</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id}>
              <td>{r.platform}</td>
              <td>{r.author}</td>
              <td>{r.content}</td>
              <td>
                {r.analysis
                  ? `${r.analysis.intent} (${Math.round(
                      r.analysis.confidence * 100
                    )}%)`
                  : "-"}
              </td>
              <td>{r.analysis?.reply_suggestion || "-"}</td>
              <td className="space-x-2">
                <button onClick={() => createPlan(r)}>生成计划</button>
                <button onClick={() => runPlan(r)}>执行模拟</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

> 如果你的前端还没有 `aiClient`，给一个最小版（可直接复用你已有的更完善版本）：

```ts
// src/lib/aiClient.ts
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";

export type ToolSpec = { name: string; description?: string; parameters: any };

export async function aiChat(payload: {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  tools?: ToolSpec[];
  toolChoice?:
    | "auto"
    | "none"
    | { type: "function"; function: { name: string } };
  stream?: boolean;
}) {
  if (payload.stream) {
    const un = await listen<string>("ai://stream", (e) =>
      console.debug("[ai stream]", e.payload)
    );
    const res = await invoke("ai_chat", payload);
    un();
    return res;
  }
  return invoke("ai_chat", payload);
}
```

---

## 交付给 AI 代理的下一步（一句话版本）

- **PR-1**：落这 5 个后端文件 + 1 个前端页面，挂命令，跑通“导入 → 列表 → 生成回放计划（文件）”。
- **PR-2**：加 `leadIntent.schema.ts`、`analyzeLead.ts`，页面接“AI 批量分析”。
- **PR-3**：加 Provider Trait/Mock/Orchestrator，页面接“执行模拟”。

需要我把**三个 PR 的提交信息 & 验收清单**再打包成 `docs/lead-hunt/TASKS.md` 给你吗？我可以马上贴出一个现成的任务清单文件，方便你发给代理。
