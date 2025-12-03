use crate::ai::{ai_config::{self, AISettings}, router::AIRouter, ai_types::*, provider::ChatChunk};
use anyhow::Result;
use serde_json::Value;
use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime, Manager, State, AppHandle, Emitter
};

pub struct AiState {
    pub settings: parking_lot::RwLock<AISettings>,
}

impl AiState {
    pub fn new() -> Self {
        // Load settings from file or default
        let settings = ai_config::load_settings();
        Self {
            settings: parking_lot::RwLock::new(settings),
        }
    }
}

#[tauri::command]
async fn get_settings(state: State<'_, AiState>) -> Result<AISettings, String> {
    Ok(state.settings.read().clone())
}

#[tauri::command]
async fn save_settings(
    state: State<'_, AiState>,
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
    ai_config::save_settings(&settings).map_err(err)?;

    // 更新内存态
    *state.settings.write() = settings;
    Ok(())
}

#[tauri::command]
async fn list_models(state: State<'_, AiState>) -> Result<Vec<String>, String> {
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
async fn chat<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, AiState>,
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
async fn embed(
    state: State<'_, AiState>,
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

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("ai")
        .setup(|app, _api| {
            app.manage(AiState::new());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_settings,
            save_settings,
            list_models,
            chat,
            embed
        ])
        .build()
}
