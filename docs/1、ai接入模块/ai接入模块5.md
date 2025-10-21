太好了！下面是**贴合你的仓库 `marketing-automation-desktop`** 的“一次性可编译落地版”文件集（前端 React + Tauri Rust）。
特点：支持**OpenAI / 腾讯混元（OpenAI 兼容）**切换、模型列表、密钥安全（OS Keyring）、流式事件、函数调用、默认模型与温度配置、路径别名 `@/*`。

> 说明：
>
> 1. 我尽量不侵入你现有结构，新增文件集中在 `src/components`, `src/lib`, `src/features/stepCard` 与 `src-tauri/src/ai/*`。
> 2. 每个代码块**第一行是文件路径**（符合你“保留第一行路径”的约定）。
> 3. 如果你的项目已有 `main.rs / vite.config.ts / tsconfig.json / package.json / Cargo.toml`，请把相应片段合并（我标注了“ADD/UPDATE”）。

---

### 0) 前端依赖与路径别名

```json
// package.json  ← UPDATE: 仅展示新增/关键依赖，保持你原有的不变
{
  "dependencies": {
    "openai": "^4.57.0",
    "@tauri-apps/api": "^1.5.6",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

```json
// tsconfig.json  ← UPDATE: 添加路径别名（若已有请合并）
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

```ts
// vite.config.ts  ← UPDATE: 添加 alias（若已有请合并）
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") }
  }
});
```

---

## 1) 前端 UI 与调用

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
    defaultChatModel: "gpt-4o-mini",
    defaultEmbedModel: "text-embedding-3-large",
    temperature: 0.2,
    stream: true,
    maxRetries: 3,
  });
  const [models, setModels] = useState<string[]>([]);
  const [openaiKey, setOpenaiKey] = useState("");
  const [hunyuanKey, setHunyuanKey] = useState("");

  useEffect(() => {
    invoke<AISettings>("get_ai_settings").then(setCfg).catch(console.error);
  }, []);

  const refreshModels = async () => {
    const list = await invoke<string[]>("list_models");
    setModels(list);
  };

  const save = async () => {
    await invoke("save_ai_settings", {
      settings: cfg,
      openaiKey: openaiKey || null,
      hunyuanKey: hunyuanKey || null,
    });
    await refreshModels();
    setOpenaiKey("");
    setHunyuanKey("");
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">AI 设置</h2>

      <div>
        <label>供应商</label>
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
      // 这里可将增量内容显示到 UI
      console.debug("[ai stream]", e.payload);
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

  const call = res?.choices?.[0]?.message?.tool_calls?.[0];
  if (call?.function?.name === "return_step_card") {
    return JSON.parse(call.function.arguments);
  }
  return null;
}
```

---

## 2) Rust / Tauri 后端

### 2.1 Cargo 依赖

```toml
# src-tauri/Cargo.toml  ← UPDATE: 添加依赖
[dependencies]
tauri = { version = "1", features = ["dialog-all", "fs-all", "path-all", "shell-open"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
anyhow = "1"
reqwest = { version = "0.11", features = ["json", "stream", "rustls-tls"] }
async-trait = "0.1"
parking_lot = "0.12"
keyring = "2"
futures-util = "0.3"
```

### 2.2 配置结构与读取/写回

```rust
// src-tauri/src/config.rs
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AISettings {
  pub provider: String,                       // "openai" | "hunyuan"
  pub default_chat_model: String,
  pub default_embed_model: String,
  pub temperature: f32,
  pub stream: bool,
  pub max_retries: u32,
  pub base_url_openai: Option<String>,
  pub base_url_hunyuan: Option<String>,
  #[serde(skip)]
  pub openai_api_key: String,
  #[serde(skip)]
  pub hunyuan_api_key: String,
}

impl Default for AISettings {
  fn default() -> Self {
    Self {
      provider:"openai".into(),
      default_chat_model:"gpt-4o-mini".into(),
      default_embed_model:"text-embedding-3-large".into(),
      temperature:0.2, stream:true, max_retries:3,
      base_url_openai:None, base_url_hunyuan:None,
      openai_api_key:String::new(), hunyuan_api_key:String::new(),
    }
  }
}

pub fn config_path() -> anyhow::Result<std::path::PathBuf> {
  let dir = tauri::api::path::app_config_dir(&tauri::Config::default())
    .ok_or_else(|| anyhow::anyhow!("Cannot resolve config dir"))?;
  std::fs::create_dir_all(&dir)?;
  Ok(dir.join("ai_settings.json"))
}

pub fn load_settings() -> AISettings {
  let p = match config_path() {
    Ok(p) => p, Err(_) => return AISettings::default(),
  };
  if let Ok(bytes) = std::fs::read(p) {
    if let Ok(s) = serde_json::from_slice::<AISettings>(&bytes) {
      return s;
    }
  }
  AISettings::default()
}

pub fn save_settings(s: &AISettings) -> anyhow::Result<()> {
  let p = config_path()?;
  let mut s2 = s.clone();
  // 不落盘密钥
  s2.openai_api_key.clear();
  s2.hunyuan_api_key.clear();
  std::fs::write(p, serde_json::to_vec_pretty(&s2)?)?;
  Ok(())
}
```

### 2.3 Provider 抽象与实现

```rust
// src-tauri/src/ai/types.rs
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChatMessage { pub role: String, pub content: String }

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ToolSpec { pub name: String, pub description: Option<String>, pub parameters: Value }

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChatRequest {
  pub model: String,
  pub messages: Vec<ChatMessage>,
  pub tools: Option<Vec<ToolSpec>>,
  pub tool_choice: Option<Value>,
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
pub struct ChatChunk { pub delta: String }

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
use futures_util::StreamExt;

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
      while let Some(item) = lines.next().await {
        let chunk = String::from_utf8_lossy(&item?).to_string();
        if let Some(cb) = &on_stream { cb(ChatChunk{ delta: chunk.clone() }); }
      }
      Ok(Value::Null)
    } else {
      let res = self.client().post(&url).headers(headers).json(&body).send().await?;
      Ok(res.json::<Value>().await?)
    }
  }

  async fn embeddings(&self, model: &str, input: Vec<String>) -> Result<Vec<Vec<f32>>> {
    let url = format!("{}/embeddings", self.base_url.trim_end_matches('/'));
    let body = json!({ "model": model, "input": input });
    let res = self.client().post(&url).bearer_auth(&self.api_key).json(&body).send().await?;
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
use futures_util::StreamExt;

pub struct HunyuanProvider { pub api_key: String, pub base_url: String, pub timeout: u64 }

impl HunyuanProvider {
  pub fn new(api_key: String, base_url: String) -> Self { Self { api_key, base_url, timeout: 60 } }
  fn client(&self) -> Client { Client::builder().timeout(Duration::from_secs(self.timeout)).build().unwrap() }
}

#[async_trait::async_trait]
impl AIProvider for HunyuanProvider {
  async fn chat(&self, req: ChatRequest, on_stream: Option<Box<dyn Fn(ChatChunk) + Send>>) -> Result<Value> {
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
    let res = self.client().post(&url).bearer_auth(&self.api_key).json(&body).send().await?;

    if req.stream.unwrap_or(false) {
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
    let body = json!({ "model": model, "input": input }); // 混元：通常固定维度
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
use serde_json::Value;

pub enum ProviderEnum { OpenAI(Arc<OpenAIProvider>), Hunyuan(Arc<HunyuanProvider>) }

pub struct AIRouter { pub p: ProviderEnum, pub settings: AISettings }

impl AIRouter {
  pub fn new(settings: AISettings) -> Self {
    let p = match settings.provider.as_str() {
      "hunyuan" => ProviderEnum::Hunyuan(Arc::new(HunyuanProvider::new(
        settings.hunyuan_api_key.clone(),
        settings.base_url_hunyuan.clone().unwrap_or("https://api.hunyuan.cloud.tencent.com/v1".into())
      ))),
      _ => ProviderEnum::OpenAI(Arc::new(OpenAIProvider::new(
        settings.openai_api_key.clone(),
        settings.base_url_openai.clone().unwrap_or("https://api.openai.com/v1".into())
      )))
    };
    Self { p, settings }
  }

  pub async fn chat<F: Fn(super::provider::ChatChunk) + Send + 'static>(&self, req: ChatRequest, on_stream: Option<F>) -> Result<Value> {
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
// src-tauri/src/ai/mod.rs
pub mod types;
pub mod provider;
pub mod providers {
  pub mod openai;
  pub mod hunyuan;
}
pub mod router;
```

### 2.4 Tauri Commands（前后端接口）

```rust
// src-tauri/src/commands.rs
use tauri::{State, AppHandle};
use anyhow::Result;
use serde_json::Value;
use crate::{config::AISettings, ai::{router::AIRouter, types::*}, config};

pub struct AppState { pub settings: parking_lot::RwLock<AISettings> }

#[tauri::command]
pub async fn get_ai_settings(state: State<'_, AppState>) -> Result<AISettings, String> {
  Ok(state.settings.read().clone())
}

#[tauri::command]
pub async fn save_ai_settings(state: State<'_, AppState>, settings: AISettings, openai_key: Option<String>, hunyuan_key: Option<String>) -> Result<(), String> {
  if let Some(k) = openai_key { keyring::Entry::new("marketing-automation-desktop", "OPENAI").map_err(err)? .set_password(&k).map_err(err)?; }
  if let Some(k) = hunyuan_key { keyring::Entry::new("marketing-automation-desktop", "HUNYUAN").map_err(err)? .set_password(&k).map_err(err)?; }
  config::save_settings(&settings).map_err(err)?;
  *state.settings.write() = settings;
  Ok(())
}

#[tauri::command]
pub async fn list_models(state: State<'_, AppState>) -> Result<Vec<String>, String> {
  let s = state.settings.read();
  Ok(match s.provider.as_str() {
    "hunyuan" => vec!["hunyuan-turbos-latest".into(), "hunyuan-embedding".into()],
    _ => vec!["gpt-4o-mini".into(), "text-embedding-3-large".into(), "text-embedding-3-small".into()],
  })
}

#[tauri::command]
pub async fn ai_chat(app: AppHandle, state: State<'_, AppState>, messages: Vec<ChatMessage>, tools: Option<Vec<ToolSpec>>, tool_choice: Option<Value>, stream: Option<bool>) -> Result<Value, String> {
  // 合并运行态密钥
  let mut s = state.settings.read().clone();
  s.openai_api_key = keyring::Entry::new("marketing-automation-desktop","OPENAI").map_err(err)?.get_password().unwrap_or_default();
  s.hunyuan_api_key = keyring::Entry::new("marketing-automation-desktop","HUNYUAN").map_err(err)?.get_password().unwrap_or_default();

  let router = AIRouter::new(s.clone());
  let req = ChatRequest {
    model: s.default_chat_model.clone(),
    messages, tools, tool_choice,
    temperature: Some(s.temperature),
    stream,
  };

  if stream.unwrap_or(false) {
    let app2 = app.clone();
    let out = router.chat(req, Some(move |chunk| { let _ = app2.emit_all("ai://stream", &chunk.delta); })).await.map_err(err)?;
    Ok(out)
  } else {
    router.chat(req, None).await.map_err(err)
  }
}

#[tauri::command]
pub async fn ai_embed(state: State<'_, AppState>, input: Vec<String>) -> Result<Vec<Vec<f32>>, String> {
  let mut s = state.settings.read().clone();
  s.openai_api_key = keyring::Entry::new("marketing-automation-desktop","OPENAI").map_err(err)?.get_password().unwrap_or_default();
  s.hunyuan_api_key = keyring::Entry::new("marketing-automation-desktop","HUNYUAN").map_err(err)?.get_password().unwrap_or_default();
  let router = AIRouter::new(s.clone());
  router.embed(&s.default_embed_model, input).await.map_err(err)
}

fn err<E: std::fmt::Display>(e: E) -> String { format!("{}", e) }
```

### 2.5 Tauri 入口

```rust
// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod ai; mod config; mod commands;

use commands::*;
use config::AISettings;

fn main() {
  tauri::Builder::default()
    .manage(commands::AppState { settings: parking_lot::RwLock::new(config::load_settings()) })
    .invoke_handler(tauri::generate_handler![
      get_ai_settings, save_ai_settings, list_models, ai_chat, ai_embed
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

---

## 3) 使用说明（一次跑通）

1. **安装依赖**

   * 前端：`pnpm i`（或 `npm i` / `yarn`）
   * Rust：确保已装 Rust stable、以及系统凭据库可用（Windows CredMan、macOS Keychain、Linux Secret Service）

2. **运行开发**

   * `pnpm tauri dev`（或等价命令）
   * 打开“设置”页挂上 `SettingsAI`（例如在你的设置路由中引入 `SettingsAI` 组件）

3. **在设置面板**

   * 选择 Provider：OpenAI 或 腾讯混元
   * 填 API Key（只保存在 OS Keyring）
   * 点击“刷新模型列表”，选择默认 Chat / Embedding 模型
   * 保存

4. **在你的“步骤卡片”流程中**

   * 调用 `generateStepCard(xml)`（我已给出 hook 示例）
   * 若要流式：`aiChat({ ..., stream: true })` 并监听 `ai://stream` 事件

---

## 4) 重要实践建议

* **密钥安全**：仅存在 OS Keyring；`ai_settings.json` 永不落密钥。
* **Embedding 维度**：混元与 OpenAI 可能不同，索引库要按 provider/模型区分。
* **可扩展**：新增别的 OpenAI 兼容服务 ⇒ 新增 `providers/xxx.rs`，在 `router.rs` 接入即可。
* **UI/UX**：建议把“测试连接”“获取余额/用量”按钮做成异步校验，以便用户快速确认配置是否生效。

---

需要我**再补一个 Settings 页面路由接入示例**，或给你**一个最小演示页面**（把 `generateStepCard()` 跑起来）也可以。只要告诉我前端用的路由栈（React Router/Next/其他），我就把接入代码贴好。
