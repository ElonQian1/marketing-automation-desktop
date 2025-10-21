没错！在 Tauri 里，把“模型供应商选择 + API Key + 模型列表 + 推理参数”做成**统一偏好设置（Preferences）**，密钥只放在 **Rust 后端（系统凭据库 / 加密存储）**，前端只拿**临时会话态**。下面给你一套**可直接落地**的前后端架构与最小代码骨架（保留你习惯：代码块第一行是“文件路径”）。

---

# 架构总览（Tauri）

* **前端（React/TS）**

  * `Settings / AI 设置面板`：选择 Provider（OpenAI / 腾讯混元）、填写各自 API Key、选择默认模型（chat/embedding）、温度/流式/重试策略。
  * `aiClient`：只调用 `invoke('ai_chat')` / `invoke('ai_embed')` 等命令，不触碰密钥。
  * `“步骤卡片”业务层`：继续用 `generateStepCard()`，由后端按当前 Provider 路由。

* **后端（Rust / Tauri）**

  * `provider trait`：`OpenAIProvider` 与 `HunyuanProvider` 实现**OpenAI 兼容模式**（`/v1/chat/completions`、`/v1/embeddings`），统一**函数调用（tools）**与**流式**。
  * `config & secure storage`：

    * 偏好项存 `tauri-plugin-store`（无密钥的通用设置）。
    * API Key 存 OS 凭据库（`keyring` crate）或加密存储（你也可选 `tauri-plugin-encrypted-storage`）。
  * `router`：根据当前设置把请求分发到对应 provider。
  * `commands`：`get_ai_settings/save_ai_settings/list_models/ai_chat/ai_embed`，其中 `list_models` 支持“刷新”。

* **流式**：后端把增量内容通过 `app.emit("ai://stream", chunk)` 推给前端；前端 `listen` 订阅。

---

## 目录建议

```
src/
  components/SettingsAI.tsx
  lib/aiClient.ts
  features/stepCard/useGenerateStepCard.ts
src-tauri/
  src/main.rs
  src/commands.rs
  src/ai/mod.rs
  src/ai/provider.rs
  src/ai/providers/openai.rs
  src/ai/providers/hunyuan.rs
  src/ai/router.rs
  src/ai/types.rs
  src/ai/rate_limit.rs
  src/config.rs
```

---

## 前端：设置面板 + 客户端调用

```tsx
// src/components/SettingsAI.tsx
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

type Provider = "openai" | "hunyuan";
type AISettings = {
  provider: Provider;
  defaultChatModel: string;
  defaultEmbedModel: string;
  temperature: number;
  stream: boolean;
  maxRetries: number;
  baseUrlOpenAI?: string;
  baseUrlHunyuan?: string;
};

export default function SettingsAI() {
  const [cfg, setCfg] = useState<AISettings>({
    provider: "openai",
    defaultChatModel: "",
    defaultEmbedModel: "",
    temperature: 0.2,
    stream: true,
    maxRetries: 3,
  });
  const [models, setModels] = useState<string[]>([]);
  const [openaiKey, setOpenaiKey] = useState("");
  const [hunyuanKey, setHunyuanKey] = useState("");

  useEffect(() => {
    invoke<AISettings>("get_ai_settings").then(setCfg);
  }, []);

  const refreshModels = async () => {
    const list = await invoke<string[]>("list_models");
    setModels(list);
  };

  const save = async () => {
    await invoke("save_ai_settings", {
      settings: cfg,
      // 密钥单独提交，后端写入系统凭据库
      openaiKey: openaiKey || null,
      hunyuanKey: hunyuanKey || null,
    });
    await refreshModels();
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <label>Provider</label>
        <select
          value={cfg.provider}
          onChange={(e) => setCfg({ ...cfg, provider: e.target.value as Provider })}
        >
          <option value="openai">OpenAI</option>
          <option value="hunyuan">腾讯混元</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label>OpenAI API Key</label>
          <input type="password" value={openaiKey} onChange={e=>setOpenaiKey(e.target.value)} placeholder="sk-..." />
        </div>
        <div>
          <label>混元 API Key</label>
          <input type="password" value={hunyuanKey} onChange={e=>setHunyuanKey(e.target.value)} placeholder="hy-..." />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label>默认 Chat 模型</label>
          <select value={cfg.defaultChatModel} onChange={e=>setCfg({...cfg, defaultChatModel: e.target.value})}>
            <option value="">（请选择或刷新）</option>
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label>默认 Embedding 模型</label>
          <select value={cfg.defaultEmbedModel} onChange={e=>setCfg({...cfg, defaultEmbedModel: e.target.value})}>
            <option value="">（请选择或刷新）</option>
            {models.filter(m=>m.toLowerCase().includes("embedding")).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label>温度</label>
          <input type="number" step="0.1" value={cfg.temperature} onChange={e=>setCfg({...cfg, temperature: Number(e.target.value)})}/>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label><input type="checkbox" checked={cfg.stream} onChange={e=>setCfg({...cfg, stream: e.target.checked})}/> 启用流式</label>
        <label>最大重试</label>
        <input type="number" value={cfg.maxRetries} onChange={e=>setCfg({...cfg, maxRetries: Number(e.target.value)})}/>
      </div>

      <div className="flex gap-2">
        <button onClick={refreshModels}>刷新模型列表</button>
        <button onClick={save}>保存设置</button>
      </div>
    </div>
  );
}
```

```ts
// src/lib/aiClient.ts
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";

export type ToolSpec = { name: string; description?: string; parameters: any };

export async function aiChat(payload: {
  messages: { role: "system"|"user"|"assistant"; content: string }[];
  tools?: ToolSpec[];
  toolChoice?: "auto"|"none"|{ type:"function", function:{ name:string } };
  stream?: boolean;
}) {
  if (payload.stream) {
    const unlisten = await listen<string>("ai://stream", (e) => {
      // 在这里把 e.payload 增量显示到 UI
      console.debug("stream:", e.payload);
    });
    const res = await invoke("ai_chat", payload);
    unlisten();
    return res;
  } else {
    return invoke("ai_chat", payload);
  }
}

export async function aiEmbed(input: string[]){ 
  return invoke<number[][]>("ai_embed", { input });
}
```

---

## 后端：Provider 抽象 + 路由 + 命令

```rust
// src-tauri/src/ai/types.rs
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Serialize, Deserialize, Clone)]
pub struct ChatMessage { pub role: String, pub content: String }

#[derive(Serialize, Deserialize, Clone)]
pub struct ToolSpec { pub name: String, pub description: Option<String>, pub parameters: Value }

#[derive(Serialize, Deserialize, Clone)]
pub struct ChatRequest {
  pub model: String,
  pub messages: Vec<ChatMessage>,
  pub tools: Option<Vec<ToolSpec>>,
  pub tool_choice: Option<Value>, // "auto" | { type:"function", function:{ name } }
  pub temperature: Option<f32>,
  pub stream: Option<bool>,
}
```

```rust
// src-tauri/src/ai/provider.rs
use async_trait::async_trait;
use crate::ai::types::*;
use anyhow::Result;
use serde_json::Value;

#[derive(Debug)]
pub struct ChatChunk { pub delta: String } // 也可扩充为枚举

#[async_trait]
pub trait AIProvider: Send + Sync {
  async fn chat(&self, req: ChatRequest, on_stream: Option<Box<dyn Fn(ChatChunk) + Send>>) -> Result<Value>;
  async fn embeddings(&self, model: &str, input: Vec<String>) -> Result<Vec<Vec<f32>>>;
}
```

```rust
// src-tauri/src/ai/providers/openai.rs
use super::super::provider::{AIProvider, ChatChunk};
use crate::ai::types::*;
use anyhow::{anyhow, Result};
use reqwest::{Client, header::HeaderMap};
use serde_json::{json, Value};
use std::time::Duration;

pub struct OpenAIProvider { pub api_key: String, pub base_url: String, pub timeout: u64 }

impl OpenAIProvider {
  pub fn new(api_key: String, base_url: String) -> Self {
    Self { api_key, base_url, timeout: 60 }
  }
  fn client(&self) -> Client {
    Client::builder().timeout(Duration::from_secs(self.timeout)).build().unwrap()
  }
}

#[async_trait::async_trait]
impl AIProvider for OpenAIProvider {
  async fn chat(&self, req: ChatRequest, on_stream: Option<Box<dyn Fn(ChatChunk) + Send>>) -> Result<Value> {
    let url = format!("{}/chat/completions", self.base_url.trim_end_matches('/'));
    let body = json!({
      "model": req.model,
      "messages": req.messages,
      "temperature": req.temperature.unwrap_or(0.2),
      "tools": req.tools.as_ref().map(|ts| ts.iter().map(|t| json!({"type":"function","function": {
        "name": t.name, "description": t.description, "parameters": t.parameters
      }})).collect::<Vec<_>>()),
      "tool_choice": req.tool_choice,
      "stream": req.stream.unwrap_or(false),
    });

    let mut headers = HeaderMap::new();
    headers.insert("Authorization", format!("Bearer {}", self.api_key).parse()?);
    headers.insert("Content-Type", "application/json".parse()?);

    if req.stream.unwrap_or(false) {
      let res = self.client().post(&url).headers(headers).json(&body).send().await?;
      let mut lines = res.bytes_stream();
      use futures_util::StreamExt;
      while let Some(item) = lines.next().await {
        let chunk = String::from_utf8_lossy(&item?).to_string();
        if let Some(cb) = &on_stream { cb(ChatChunk{ delta: chunk.clone() }); }
      }
      // 流式最终也返回一个“汇总/结束标记”，这里简单返回 null
      Ok(Value::Null)
    } else {
      let res = self.client().post(&url).headers(headers).json(&body).send().await?;
      Ok(res.json::<Value>().await?)
    }
  }

  async fn embeddings(&self, model: &str, input: Vec<String>) -> Result<Vec<Vec<f32>>> {
    let url = format!("{}/embeddings", self.base_url.trim_end_matches('/'));
    let body = json!({ "model": model, "input": input });
    let res = self.client().post(&url)
      .bearer_auth(&self.api_key).json(&body).send().await?;
    let v: Value = res.json().await?;
    let arr = v["data"].as_array().ok_or_else(||anyhow!("bad embeddings"))?;
    Ok(arr.iter().map(|x| {
      x["embedding"].as_array().unwrap().iter().map(|n| n.as_f64().unwrap() as f32).collect()
    }).collect())
  }
}
```

```rust
// src-tauri/src/ai/providers/hunyuan.rs
use super::super::provider::{AIProvider, ChatChunk};
use crate::ai::types::*;
use anyhow::Result;
use reqwest::Client;
use serde_json::{json, Value};
use std::time::Duration;

pub struct HunyuanProvider { pub api_key: String, pub base_url: String, pub timeout: u64 }

impl HunyuanProvider {
  pub fn new(api_key: String, base_url: String) -> Self { Self { api_key, base_url, timeout: 60 } }
  fn client(&self) -> Client { Client::builder().timeout(Duration::from_secs(self.timeout)).build().unwrap() }
}

#[async_trait::async_trait]
impl AIProvider for HunyuanProvider {
  async fn chat(&self, req: ChatRequest, on_stream: Option<Box<dyn Fn(ChatChunk) + Send>>) -> Result<Value> {
    // 混元是 OpenAI 兼容接口：同 /v1/chat/completions
    let url = format!("{}/chat/completions", self.base_url.trim_end_matches('/'));
    let body = json!({
      "model": req.model, // 例：hunyuan-turbos-latest
      "messages": req.messages,
      "temperature": req.temperature.unwrap_or(0.2),
      "tools": req.tools.as_ref().map(|ts| ts.iter().map(|t| json!({"type":"function","function": {
        "name": t.name, "description": t.description, "parameters": t.parameters
      }})).collect::<Vec<_>>()),
      "tool_choice": req.tool_choice,
      "stream": req.stream.unwrap_or(false),
    });
    let res = self.client().post(&url)
      .bearer_auth(&self.api_key).json(&body).send().await?;

    if req.stream.unwrap_or(false) {
      use futures_util::StreamExt;
      let mut s = res.bytes_stream();
      while let Some(b) = s.next().await {
        if let Some(cb) = &on_stream { cb(ChatChunk{ delta: String::from_utf8_lossy(&b?).into() }); }
      }
      Ok(Value::Null)
    } else {
      Ok(res.json().await?)
    }
  }

  async fn embeddings(&self, model: &str, input: Vec<String>) -> Result<Vec<Vec<f32>>> {
    let url = format!("{}/embeddings", self.base_url.trim_end_matches('/'));
    let body = json!({ "model": model, "input": input }); // 混元：通常固定模型名 + 维度固定
    let v: Value = self.client().post(&url).bearer_auth(&self.api_key).json(&body).send().await?.json().await?;
    let arr = v["data"].as_array().unwrap();
    Ok(arr.iter().map(|x| x["embedding"].as_array().unwrap().iter().map(|n| n.as_f64().unwrap() as f32).collect()).collect())
  }
}
```

```rust
// src-tauri/src/ai/router.rs
use std::sync::Arc;
use anyhow::Result;
use crate::ai::{provider::AIProvider, types::*, providers::{openai::OpenAIProvider, hunyuan::HunyuanProvider}};
use crate::config::AISettings;

pub enum ProviderEnum { OpenAI(Arc<OpenAIProvider>), Hunyuan(Arc<HunyuanProvider>) }

pub struct AIRouter { pub p: ProviderEnum, pub settings: AISettings }

impl AIRouter {
  pub fn new(settings: AISettings) -> Self {
    let p = match settings.provider.as_str() {
      "hunyuan" => ProviderEnum::Hunyuan(Arc::new(HunyuanProvider::new(
        settings.hunyuan_api_key.clone(), settings.base_url_hunyuan.clone().unwrap_or("https://api.hunyuan.cloud.tencent.com/v1".into())
      ))),
      _ => ProviderEnum::OpenAI(Arc::new(OpenAIProvider::new(
        settings.openai_api_key.clone(), settings.base_url_openai.clone().unwrap_or("https://api.openai.com/v1".into())
      )))
    };
    Self { p, settings }
  }

  pub async fn chat<F: Fn(super::provider::ChatChunk) + Send + 'static>(&self, req: ChatRequest, on_stream: Option<F>) -> Result<serde_json::Value> {
    match &self.p {
      ProviderEnum::OpenAI(p) => p.chat(req, on_stream.map(|f| Box::new(f) as _)).await,
      ProviderEnum::Hunyuan(p) => p.chat(req, on_stream.map(|f| Box::new(f) as _)).await,
    }
  }

  pub async fn embed(&self, model: &str, input: Vec<String>) -> Result<Vec<Vec<f32>>> {
    match &self.p {
      ProviderEnum::OpenAI(p) => p.embeddings(model, input).await,
      ProviderEnum::Hunyuan(p) => p.embeddings(model, input).await,
    }
  }
}
```

```rust
// src-tauri/src/config.rs
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct AISettings {
  pub provider: String,                       // "openai" | "hunyuan"
  pub default_chat_model: String,
  pub default_embed_model: String,
  pub temperature: f32,
  pub stream: bool,
  pub max_retries: u32,
  pub base_url_openai: Option<String>,
  pub base_url_hunyuan: Option<String>,
  // 注意：真正的 api_key 不放这里（这里只在运行时合并）
  #[serde(skip)]
  pub openai_api_key: String,
  #[serde(skip)]
  pub hunyuan_api_key: String,
}
```

```rust
// src-tauri/src/commands.rs
use tauri::{State, AppHandle};
use anyhow::Result;
use serde_json::json;
use crate::{config::AISettings, ai::{router::AIRouter, types::*}};

pub struct AppState { pub settings: parking_lot::RwLock<AISettings> }

#[tauri::command]
pub async fn get_ai_settings(state: State<'_, AppState>) -> Result<AISettings, String> {
  Ok(state.settings.read().clone())
}

#[tauri::command]
pub async fn save_ai_settings(app: AppHandle, state: State<'_, AppState>, settings: AISettings, openai_key: Option<String>, hunyuan_key: Option<String>) -> Result<(), String> {
  // 1) 非密钥项持久化（plugin-store），此处略
  // 2) 密钥写 OS 凭据库（keyring）：service = "marketing-automation-desktop"
  if let Some(k) = openai_key { keyring::Entry::new("marketing-automation-desktop", "OPENAI").map_err(err)? .set_password(&k).map_err(err)?; }
  if let Some(k) = hunyuan_key { keyring::Entry::new("marketing-automation-desktop", "HUNYUAN").map_err(err)? .set_password(&k).map_err(err)?; }

  // 3) 更新内存态
  let mut s = state.settings.write();
  *s = settings;
  Ok(())
}

#[tauri::command]
pub async fn list_models(state: State<'_, AppState>) -> Result<Vec<String>, String> {
  // 直接返回一组兼容模型清单；也可调用 /v1/models 动态获取
  let s = state.settings.read();
  Ok(match s.provider.as_str() {
    "hunyuan" => vec!["hunyuan-turbos-latest".into(), "hunyuan-embedding".into()],
    _ => vec!["gpt-4o-mini".into(), "text-embedding-3-large".into(), "text-embedding-3-small".into()],
  })
}

#[tauri::command]
pub async fn ai_chat(app: AppHandle, state: State<'_, AppState>, messages: Vec<ChatMessage>, tools: Option<Vec<crate::ai::types::ToolSpec>>, tool_choice: Option<serde_json::Value>, stream: Option<bool>) -> Result<serde_json::Value, String> {
  let s = state.settings.read().clone();
  // 读取密钥
  let openai_key = keyring::Entry::new("marketing-automation-desktop","OPENAI").map_err(err)?.get_password().unwrap_or_default();
  let hunyuan_key = keyring::Entry::new("marketing-automation-desktop","HUNYUAN").map_err(err)?.get_password().unwrap_or_default();

  let mut s2 = s.clone();
  s2.openai_api_key = openai_key;
  s2.hunyuan_api_key = hunyuan_key;

  let router = crate::ai::router::AIRouter::new(s2);
  let req = ChatRequest {
    model: state.settings.read().default_chat_model.clone(),
    messages, tools, tool_choice,
    temperature: Some(state.settings.read().temperature),
    stream,
  };

  if stream.unwrap_or(false) {
    let app2 = app.clone();
    let out = router.chat(req, Some(move |chunk| {
      let _ = app2.emit_all("ai://stream", &chunk.delta);
    })).await.map_err(err)?;
    Ok(out)
  } else {
    router.chat(req, None).await.map_err(err)
  }
}

#[tauri::command]
pub async fn ai_embed(state: State<'_, AppState>, input: Vec<String>) -> Result<Vec<Vec<f32>>, String> {
  let s = state.settings.read().clone();
  let openai_key = keyring::Entry::new("marketing-automation-desktop","OPENAI").map_err(err)?.get_password().unwrap_or_default();
  let hunyuan_key = keyring::Entry::new("marketing-automation-desktop","HUNYUAN").map_err(err)?.get_password().unwrap_or_default();
  let mut s2 = s.clone(); s2.openai_api_key = openai_key; s2.hunyuan_api_key = hunyuan_key;
  let router = crate::ai::router::AIRouter::new(s2);
  router.embed(&state.settings.read().default_embed_model, input).await.map_err(err)
}

fn err<E: std::fmt::Display>(e: E) -> String { format!("{}", e) }
```

```rust
// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod ai; mod config; mod commands;
use commands::*;
use config::AISettings;

fn default_settings() -> AISettings {
  AISettings{
    provider:"openai".into(),
    default_chat_model:"gpt-4o-mini".into(),
    default_embed_model:"text-embedding-3-large".into(),
    temperature:0.2,
    stream:true,
    max_retries:3,
    base_url_openai:None,
    base_url_hunyuan:None,
    openai_api_key:String::new(),
    hunyuan_api_key:String::new(),
  }
}

fn main() {
  tauri::Builder::default()
    .manage(commands::AppState { settings: parking_lot::RwLock::new(default_settings()) })
    .invoke_handler(tauri::generate_handler![
      get_ai_settings, save_ai_settings, list_models, ai_chat, ai_embed
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

---

## 如何接入你“步骤卡片”功能

1. 在业务 hook 里调用 `aiChat()` 并使用**函数调用（tools）**返回结构化“步骤卡片”：

```ts
// src/features/stepCard/useGenerateStepCard.ts
import { aiChat } from "@/lib/aiClient";

export async function generateStepCard(xml: string) {
  const tool = {
    name: "return_step_card",
    description: "返回结构化步骤卡片",
    parameters: {
      type: "object",
      required: ["strategyType","locator","confidence"],
      properties: {
        strategyType: { type: "string", enum: ["self_anchor","child_anchor","local_index","global_index","ocr_match","image_template"] },
        locator: { type: "object", required:["kind","value"], properties: { kind:{type:"string"}, value:{type:"string"} } },
        confidence: { type: "number", minimum:0, maximum:1 },
        notes: { type: "string" }
      }
    }
  };

  const res:any = await aiChat({
    messages: [
      { role:"system", content:"你是ADB智能页面分析器。只通过调用 return_step_card 返回结构化结果。" },
      { role:"user", content:`基于XML片段给出最稳妥步骤卡片：\n${xml}` }
    ],
    tools:[tool],
    toolChoice:"auto",
    stream:false,
  });

  // 提取 tool_calls（后端原样返回 OpenAI/Hunyuan 的兼容结构）
  const call = res?.choices?.[0]?.message?.tool_calls?.[0];
  if (call?.function?.name === "return_step_card") {
    return JSON.parse(call.function.arguments);
  }
  return null;
}
```

2. “切换 OpenAI/混元/模型”直接去**设置面板**更改；生成逻辑无需改代码。

---

## 关键实现要点（实践建议）

* **API Key 安全**：只在后端保存（OS 凭据库），前端不落盘；前端“显示******”仅做占位，不回显明文。
* **重试与限流**：Rust 里可用 `governor` 或简单指数退避（200ms→400→800…），避免 429。
* **Embedding 维度**：混元 embedding 维度可能与 OpenAI 不同，**索引库要分 provider/模型**，避免混淆。
* **模型列表**：`list_models` 先给静态候选 + “刷新”按钮；需要时再调用各自 `/v1/models` 做动态发现（允许失败回退）。
* **流式消息**：建议把“进度/片段/工具调用”分事件通道（如 `ai://stream`, `ai://tool`），前端体验更丝滑。
* **可替换**：后续再接“其它 OpenAI 兼容”只要新增一个 `XxxProvider`，不动 UI 与业务层。

---

### 一次性落地步骤（MVP）

1. 把上面 `src/components/SettingsAI.tsx` 接到你的“设置/偏好”菜单。
2. 加入后端 `provider/commands/router` 这几份文件。
3. 在“步骤卡片”调用点改用 `useGenerateStepCard()`。
4. 验证：OpenAI 与混元分别填入 Key → 切换 provider → 刷新/选模型 → 生成步骤卡片。

如果你愿意，我可以按你仓库 `marketing-automation-desktop` 的目录直接给出**可编译的完整文件集**（包含 import 别名、依赖与插件清单）。
