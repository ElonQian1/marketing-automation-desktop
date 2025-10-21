// src-tauri/src/ai/commands.rs
use crate::ai::{config, router::AIRouter, types::*, provider::ChatChunk};
use crate::config::AISettings;
use anyhow::Result;
use serde_json::Value;
use tauri::{AppHandle, Emitter, State};

pub struct AppState {
    pub settings: parking_lot::RwLock<AISettings>,
}

#[tauri::command]
pub async fn get_ai_settings(state: State<'_, AppState>) -> Result<AISettings, String> {
    Ok(state.settings.read().clone())
}

#[tauri::command]
pub async fn save_ai_settings(
    state: State<'_, AppState>,
    settings: AISettings,
    openai_key: Option<String>,
    hunyuan_key: Option<String>,
) -> Result<(), String> {
    // 保存密钥到系统凭据库
    if let Some(k) = openai_key {
        keyring::Entry::new("marketing-automation-desktop", "OPENAI")
            .map_err(err)?
            .set_password(&k)
            .map_err(err)?;
    }
    if let Some(k) = hunyuan_key {
        keyring::Entry::new("marketing-automation-desktop", "HUNYUAN")
            .map_err(err)?
            .set_password(&k)
            .map_err(err)?;
    }

    // 保存配置到文件（不包含密钥）
    config::save_settings(&settings).map_err(err)?;

    // 更新内存态
    *state.settings.write() = settings;
    Ok(())
}

#[tauri::command]
pub async fn list_models(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let s = state.settings.read();
    Ok(match s.provider.as_str() {
        "hunyuan" => vec!["hunyuan-turbo-latest".into(), "hunyuan-embedding".into()],
        _ => vec![
            "gpt-4o".into(),
            "gpt-4o-mini".into(),
            "gpt-4-turbo".into(),
            "gpt-3.5-turbo".into(),
            "text-embedding-3-large".into(),
            "text-embedding-3-small".into(),
            "text-embedding-ada-002".into(),
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
    // 合并运行态密钥
    let mut s = state.settings.read().clone();
    s.openai_api_key = keyring::Entry::new("marketing-automation-desktop", "OPENAI")
        .map_err(err)?
        .get_password()
        .unwrap_or_default();
    s.hunyuan_api_key = keyring::Entry::new("marketing-automation-desktop", "HUNYUAN")
        .map_err(err)?
        .get_password()
        .unwrap_or_default();

    let router = AIRouter::new(s.clone());
    let req = ChatRequest {
        model: s.default_chat_model.clone(),
        messages,
        tools,
        tool_choice,
        temperature: Some(s.temperature),
        stream,
    };

    if stream.unwrap_or(false) {
        let app2 = app.clone();
        let out = router
            .chat(req, Some(move |chunk: ChatChunk| {
                let _ = app2.emit("ai://stream", &chunk.delta);
            }))
            .await
            .map_err(err)?;
        Ok(out)
    } else {
        router.chat::<fn(ChatChunk)>(req, None).await.map_err(err)
    }
}

#[tauri::command]
pub async fn ai_embed(
    state: State<'_, AppState>,
    input: Vec<String>,
) -> Result<Vec<Vec<f32>>, String> {
    let mut s = state.settings.read().clone();
    s.openai_api_key = keyring::Entry::new("marketing-automation-desktop", "OPENAI")
        .map_err(err)?
        .get_password()
        .unwrap_or_default();
    s.hunyuan_api_key = keyring::Entry::new("marketing-automation-desktop", "HUNYUAN")
        .map_err(err)?
        .get_password()
        .unwrap_or_default();
    let router = AIRouter::new(s.clone());
    router
        .embed(&s.default_embed_model, input)
        .await
        .map_err(err)
}

fn err<E: std::fmt::Display>(e: E) -> String {
    format!("{}", e)
}
