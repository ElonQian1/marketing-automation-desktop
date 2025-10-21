// src-tauri/src/ai/providers/hunyuan.rs
use super::super::provider::{AIProvider, ChatChunk};
use crate::ai::types::*;
use anyhow::Result;
use reqwest::Client;
use serde_json::{json, Value};
use std::time::Duration;
use futures_util::StreamExt;

pub struct HunyuanProvider {
    pub api_key: String,
    pub base_url: String,
    pub timeout: u64,
}

impl HunyuanProvider {
    pub fn new(api_key: String, base_url: String) -> Self {
        Self {
            api_key,
            base_url,
            timeout: 60,
        }
    }

    fn client(&self) -> Client {
        Client::builder()
            .timeout(Duration::from_secs(self.timeout))
            .build()
            .unwrap()
    }
}

#[async_trait::async_trait]
impl AIProvider for HunyuanProvider {
    async fn chat(
        &self,
        req: ChatRequest,
        on_stream: Option<Box<dyn Fn(ChatChunk) + Send>>,
    ) -> Result<Value> {
        // 混元使用 OpenAI 兼容接口
        let url = format!("{}/chat/completions", self.base_url.trim_end_matches('/'));
        let body = json!({
            "model": req.model,
            "messages": req.messages,
            "temperature": req.temperature.unwrap_or(0.2),
            "tools": req.tools.as_ref().map(|ts| ts.iter().map(|t| json!({
                "type": "function",
                "function": {
                    "name": t.name,
                    "description": t.description,
                    "parameters": t.parameters
                }
            })).collect::<Vec<_>>()),
            "tool_choice": req.tool_choice,
            "stream": req.stream.unwrap_or(false),
        });
        let res = self
            .client()
            .post(&url)
            .bearer_auth(&self.api_key)
            .json(&body)
            .send()
            .await?;

        if req.stream.unwrap_or(false) {
            let mut s = res.bytes_stream();
            while let Some(b) = s.next().await {
                if let Some(cb) = &on_stream {
                    cb(ChatChunk {
                        delta: String::from_utf8_lossy(&b?).into(),
                    });
                }
            }
            Ok(Value::Null)
        } else {
            Ok(res.json().await?)
        }
    }

    async fn embeddings(&self, model: &str, input: Vec<String>) -> Result<Vec<Vec<f32>>> {
        let url = format!("{}/embeddings", self.base_url.trim_end_matches('/'));
        let body = json!({ "model": model, "input": input });
        let v: Value = self
            .client()
            .post(&url)
            .bearer_auth(&self.api_key)
            .json(&body)
            .send()
            .await?
            .json()
            .await?;
        let arr = v["data"].as_array().unwrap();
        Ok(arr
            .iter()
            .map(|x| {
                x["embedding"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|n| n.as_f64().unwrap() as f32)
                    .collect()
            })
            .collect())
    }
}
