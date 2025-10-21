// src-tauri/src/ai/providers/openai.rs
use super::super::provider::{AIProvider, ChatChunk};
use crate::ai::types::*;
use anyhow::{anyhow, Result};
use reqwest::{header::HeaderMap, Client};
use serde_json::{json, Value};
use std::time::Duration;
use futures_util::StreamExt;

pub struct OpenAIProvider {
    pub api_key: String,
    pub base_url: String,
    pub timeout: u64,
}

impl OpenAIProvider {
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
impl AIProvider for OpenAIProvider {
    async fn chat(
        &self,
        req: ChatRequest,
        on_stream: Option<Box<dyn Fn(ChatChunk) + Send>>,
    ) -> Result<Value> {
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

        let mut headers = HeaderMap::new();
        headers.insert("Authorization", format!("Bearer {}", self.api_key).parse()?);
        headers.insert("Content-Type", "application/json".parse()?);

        if req.stream.unwrap_or(false) {
            let res = self
                .client()
                .post(&url)
                .headers(headers)
                .json(&body)
                .send()
                .await?;
            let mut lines = res.bytes_stream();
            while let Some(item) = lines.next().await {
                let chunk = String::from_utf8_lossy(&item?).to_string();
                if let Some(cb) = &on_stream {
                    cb(ChatChunk {
                        delta: chunk.clone(),
                    });
                }
            }
            Ok(Value::Null)
        } else {
            let res = self
                .client()
                .post(&url)
                .headers(headers)
                .json(&body)
                .send()
                .await?;
            Ok(res.json::<Value>().await?)
        }
    }

    async fn embeddings(&self, model: &str, input: Vec<String>) -> Result<Vec<Vec<f32>>> {
        let url = format!("{}/embeddings", self.base_url.trim_end_matches('/'));
        let body = json!({ "model": model, "input": input });
        let res = self
            .client()
            .post(&url)
            .bearer_auth(&self.api_key)
            .json(&body)
            .send()
            .await?;
        let v: Value = res.json().await?;
        let arr = v["data"]
            .as_array()
            .ok_or_else(|| anyhow!("bad embeddings response"))?;
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
