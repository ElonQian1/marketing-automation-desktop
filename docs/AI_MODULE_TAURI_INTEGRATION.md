# AI 模块 Tauri 集成指南

## 📋 概述

基于文档 ai接入模块4.md 和 ai接入模块5.md 的要求，AI 模块提供了完整的 Tauri 后端集成方案，实现：

1. **安全的 API Key 存储**：使用 OS 凭据库（Windows CredMan / macOS Keychain / Linux Secret Service）
2. **统一的设置界面**：Provider 切换、模型选择、参数配置
3. **Rust 后端实现**：Provider 抽象、路由、流式响应
4. **前后端分离**：前端不触碰密钥，只调用 Tauri命令

## 🏗️ 架构设计

### 前端层（React/TypeScript）

```
src/
├── components/settings/
│   └── ai-settings.tsx          # AI 设置界面组件
├── modules/ai/
│   ├── services/
│   │   └── ai-tauri-client.ts   # Tauri 客户端实现
│   └── hooks/
│       └── use-ai.ts             # React Hook（已支持 Tauri）
```

### 后端层（Rust/Tauri）

```
src-tauri/src/
├── ai/
│   ├── mod.rs                    # 模块声明
│   ├── types.rs                  # 类型定义
│   ├── provider.rs               # Provider trait
│   ├── providers/
│   │   ├── openai.rs             # OpenAI 实现
│   │   └── hunyuan.rs            # 混元实现
│   └── router.rs                 # 路由分发
├── config.rs                     # 配置管理
├── commands.rs                   # Tauri 命令
└── main.rs                       # 入口文件
```

## 🔧 实现步骤

### 第 1 步：前端实现（已完成）

#### 1.1 AI 设置组件

文件：`src/components/settings/ai-settings.tsx`

✅ 已创建，功能包括：
- Provider 选择（OpenAI / 混元）
- API Key 输入（安全提示）
- 模型列表刷新和选择
- 参数配置（温度、重试、流式）
- 高级配置（Base URL）

#### 1.2 Tauri 客户端

文件：`src/modules/ai/services/ai-tauri-client.ts`

✅ 已创建，实现 `IAIClient` 接口：
- `chat()` - 非流式聊天
- `chatStream()` - 流式聊天
- `embed()` - 向量嵌入

### 第 2 步：Rust 后端实现（待实施）

#### 2.1 添加 Cargo 依赖

在 `src-tauri/Cargo.toml` 中添加：

```toml
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

#### 2.2 创建 AI 模块结构

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

#### 2.3 实现 Provider Trait

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
    async fn chat(
        &self,
        req: ChatRequest,
        on_stream: Option<Box<dyn Fn(ChatChunk) + Send>>
    ) -> Result<Value>;
    
    async fn embeddings(
        &self,
        model: &str,
        input: Vec<String>
    ) -> Result<Vec<Vec<f32>>>;
}
```

#### 2.4 实现 OpenAI Provider

```rust
// src-tauri/src/ai/providers/openai.rs
use super::super::provider::{AIProvider, ChatChunk};
use crate::ai::types::*;
use anyhow::{anyhow, Result};
use reqwest::{Client, header::HeaderMap};
use serde_json::{json, Value};
use std::time::Duration;

pub struct OpenAIProvider {
    pub api_key: String,
    pub base_url: String,
    pub timeout: u64,
}

impl OpenAIProvider {
    pub fn new(api_key: String, base_url: String) -> Self {
        Self { api_key, base_url, timeout: 60 }
    }
}

#[async_trait::async_trait]
impl AIProvider for OpenAIProvider {
    async fn chat(
        &self,
        req: ChatRequest,
        on_stream: Option<Box<dyn Fn(ChatChunk) + Send>>
    ) -> Result<Value> {
        let url = format!("{}/chat/completions", self.base_url.trim_end_matches('/'));
        
        // 构建请求体
        let body = json!({
            "model": req.model,
            "messages": req.messages,
            "temperature": req.temperature.unwrap_or(0.2),
            "tools": req.tools,
            "tool_choice": req.tool_choice,
            "stream": req.stream.unwrap_or(false),
        });

        // 发送请求...
        // （详细实现见文档 ai接入模块5.md）
        
        todo!("实现 OpenAI API 调用")
    }

    async fn embeddings(
        &self,
        model: &str,
        input: Vec<String>
    ) -> Result<Vec<Vec<f32>>> {
        // 实现嵌入向量生成...
        todo!("实现 Embeddings API 调用")
    }
}
```

#### 2.5 实现 Tauri 命令

```rust
// src-tauri/src/commands.rs
use tauri::{State, AppHandle};
use crate::ai::router::AIRouter;
use crate::config::AISettings;

pub struct AppState {
    pub settings: parking_lot::RwLock<AISettings>,
}

#[tauri::command]
pub async fn get_ai_settings(
    state: State<'_, AppState>
) -> Result<AISettings, String> {
    Ok(state.settings.read().clone())
}

#[tauri::command]
pub async fn save_ai_settings(
    state: State<'_, AppState>,
    settings: AISettings,
    openai_key: Option<String>,
    hunyuan_key: Option<String>,
) -> Result<(), String> {
    // 1. 保存密钥到 OS Keyring
    if let Some(k) = openai_key {
        keyring::Entry::new("marketing-automation-desktop", "OPENAI")
            .map_err(|e| e.to_string())?
            .set_password(&k)
            .map_err(|e| e.to_string())?;
    }
    
    if let Some(k) = hunyuan_key {
        keyring::Entry::new("marketing-automation-desktop", "HUNYUAN")
            .map_err(|e| e.to_string())?
            .set_password(&k)
            .map_err(|e| e.to_string())?;
    }

    // 2. 保存非密钥配置到文件
    // 3. 更新内存状态
    *state.settings.write() = settings;
    
    Ok(())
}

#[tauri::command]
pub async fn list_models(
    state: State<'_, AppState>
) -> Result<Vec<String>, String> {
    let s = state.settings.read();
    Ok(match s.provider.as_str() {
        "hunyuan" => vec![
            "hunyuan-turbo-latest".into(),
            "hunyuan-embedding".into()
        ],
        _ => vec![
            "gpt-4o-mini".into(),
            "gpt-4o".into(),
            "text-embedding-3-large".into(),
            "text-embedding-3-small".into()
        ],
    })
}

#[tauri::command]
pub async fn ai_chat(
    app: AppHandle,
    state: State<'_, AppState>,
    messages: Vec<ChatMessage>,
    tools: Option<Vec<ToolSpec>>,
    tool_choice: Option<Value>,
    stream: Option<bool>,
) -> Result<Value, String> {
    // 从 Keyring 读取密钥
    let mut s = state.settings.read().clone();
    s.openai_api_key = keyring::Entry::new("marketing-automation-desktop", "OPENAI")
        .map_err(|e| e.to_string())?
        .get_password()
        .unwrap_or_default();
    
    // 创建路由并执行请求
    let router = AIRouter::new(s.clone());
    let req = ChatRequest {
        model: s.default_chat_model,
        messages,
        tools,
        tool_choice,
        temperature: Some(s.temperature),
        stream,
    };

    // 流式处理
    if stream.unwrap_or(false) {
        let app2 = app.clone();
        router.chat(req, Some(move |chunk| {
            let _ = app2.emit_all("ai://stream", &chunk.delta);
        })).await.map_err(|e| e.to_string())
    } else {
        router.chat(req, None).await.map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub async fn ai_embed(
    state: State<'_, AppState>,
    input: Vec<String>,
) -> Result<Vec<Vec<f32>>, String> {
    // 实现嵌入向量生成...
    todo!("实现 ai_embed 命令")
}
```

#### 2.6 主入口配置

```rust
// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ai;
mod config;
mod commands;

use commands::*;
use config::AISettings;

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            settings: parking_lot::RwLock::new(AISettings::default()),
        })
        .invoke_handler(tauri::generate_handler![
            get_ai_settings,
            save_ai_settings,
            list_models,
            ai_chat,
            ai_embed,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## 🔒 安全特性

### API Key 存储

- ✅ **Windows**：使用 Credential Manager (CredMan)
- ✅ **macOS**：使用 Keychain
- ✅ **Linux**：使用 Secret Service

### 密钥处理流程

1. 用户在前端输入 API Key
2. 前端通过 `save_ai_settings` 命令发送到后端
3. 后端使用 `keyring` crate 存储到 OS 凭据库
4. 配置文件（`ai_settings.json`）**不存储密钥**
5. 每次 AI 请求时从凭据库读取密钥

## 📱 使用方式

### 1. 在设置页面中使用

```tsx
import { AISettingsComponent } from '@/components/settings/ai-settings';

export function SettingsPage() {
  return (
    <div>
      <h1>系统设置</h1>
      <AISettingsComponent />
    </div>
  );
}
```

### 2. 在业务代码中使用

```tsx
import { useAI } from '@ai';

function MyComponent() {
  const { generateStepCard, isLoading } = useAI();

  const handleGenerate = async () => {
    // AI 模块会自动使用 Tauri 后端（如果在 Tauri 环境中）
    const result = await generateStepCard({
      xmlSnippet: '<node>...</node>',
      targetDescription: '目标元素',
    });
    console.log(result);
  };

  return <button onClick={handleGenerate}>生成</button>;
}
```

## 🎯 优势

### 1. 安全性
- API Key 存储在 OS 凭据库，永不落盘明文
- 前端不触碰密钥
- 符合安全最佳实践

### 2. 可扩展性
- Provider 模式易于添加新的 AI 服务
- 统一的接口抽象
- DDD 分层架构

### 3. 用户体验
- 统一的设置界面
- 流式响应实时反馈
- 自动重试和错误处理

## ⚠️ 注意事项

### 依赖安装

前端需要安装 Tauri API（如果尚未安装）：

```bash
npm install @tauri-apps/api
```

后端需要在 `Cargo.toml` 中添加依赖（见上文）。

### 环境检测

AI 模块会自动检测是否在 Tauri 环境中运行：
- **Tauri 环境**：使用 TauriAIClient（通过 invoke 调用后端）
- **Web 环境**：使用 OpenAIProvider（直接调用 API）

### 模型列表

- `list_models` 命令返回静态模型列表
- 可以扩展为动态调用 `/v1/models` 端点
- 混元和 OpenAI 的模型列表不同

### 流式响应

流式响应通过 Tauri 的事件系统实现：
- 后端发送：`app.emit_all("ai://stream", &chunk)`
- 前端监听：`listen("ai://stream", callback)`

## 📚 相关文档

- [AI 模块 README](../src/modules/ai/README.md)
- [AI 模块安装指南](./AI_MODULE_SETUP.md)
- [Tauri 文档](https://tauri.app/v1/guides/)
- [Keyring Crate](https://docs.rs/keyring/)

## 🔗 完整代码参考

详细的 Rust 实现代码请参考：
- ai接入模块4.md
- ai接入模块5.md

这两份文档提供了完整的、可编译的 Rust 代码示例。

## 📝 总结

Tauri 集成方案提供了：

✅ 安全的 API Key 存储（OS 凭据库）  
✅ 统一的设置界面  
✅ Provider 抽象和路由  
✅ 流式响应支持  
✅ 前后端分离架构  
✅ 完整的错误处理  

**当前状态**：
- ✅ 前端组件已实现
- ⏳ Rust 后端待实施（完整代码见参考文档）
