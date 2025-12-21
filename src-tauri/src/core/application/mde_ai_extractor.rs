// src-tauri/src/core/application/mde_ai_extractor.rs
// module: core/application | layer: application | role: mde-ai-extractor
// summary: MDE AI 提取服务 - 当规则匹配失败时使用 AI 视觉分析提取数据

use anyhow::{Result, Context};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::time::Duration;
use tracing::{info, debug, warn};

use crate::core::domain::mde_extraction::{
    MdeDataType, MdeExtractedItem, MdeExtractionResult, MdeFieldValue,
    MdePageType, MdeAppInfo, MdeExtractionMethod,
};

// ============================================================================
// AI 配置
// ============================================================================

/// AI 提取器配置
#[derive(Debug, Clone)]
pub struct MdeAiConfig {
    /// API 端点 (OpenAI 兼容)
    pub api_url: String,
    /// API Key
    pub api_key: String,
    /// 模型名称
    pub model: String,
    /// 超时时间（秒）
    pub timeout_secs: u64,
    /// 最大 tokens
    pub max_tokens: u32,
}

impl Default for MdeAiConfig {
    fn default() -> Self {
        Self {
            api_url: "https://api.openai.com/v1/chat/completions".to_string(),
            api_key: String::new(),
            model: "gpt-4o-mini".to_string(),
            timeout_secs: 60,
            max_tokens: 4096,
        }
    }
}

impl MdeAiConfig {
    /// 从环境变量创建配置
    pub fn from_env() -> Result<Self> {
        let api_key = std::env::var("OPENAI_API_KEY")
            .or_else(|_| std::env::var("MDE_AI_API_KEY"))
            .context("需要设置 OPENAI_API_KEY 或 MDE_AI_API_KEY 环境变量")?;
        
        let api_url = std::env::var("OPENAI_API_URL")
            .or_else(|_| std::env::var("MDE_AI_API_URL"))
            .unwrap_or_else(|_| "https://api.openai.com/v1/chat/completions".to_string());
        
        let model = std::env::var("OPENAI_MODEL")
            .or_else(|_| std::env::var("MDE_AI_MODEL"))
            .unwrap_or_else(|_| "gpt-4o-mini".to_string());
        
        Ok(Self {
            api_url,
            api_key,
            model,
            ..Default::default()
        })
    }
}

// ============================================================================
// AI 提取请求/响应
// ============================================================================

/// AI 提取请求
#[derive(Debug, Clone)]
pub struct MdeAiExtractionRequest {
    /// 屏幕截图（PNG 字节）
    pub screenshot: Option<Vec<u8>>,
    /// XML 内容
    pub xml_content: Option<String>,
    /// 要提取的数据类型
    pub data_type: MdeDataType,
    /// APP 信息
    pub app_info: Option<MdeAppInfo>,
    /// 页面类型（如已知）
    pub page_type: Option<MdePageType>,
    /// 额外提示
    pub additional_prompt: Option<String>,
}

/// AI 提取结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MdeAiExtractionResponse {
    /// 提取的数据项
    pub items: Vec<MdeExtractedItem>,
    /// 整体置信度
    pub confidence: f32,
    /// AI 模型
    pub model: String,
    /// 消耗的 tokens
    pub tokens_used: u32,
    /// AI 原始响应（调试用）
    pub raw_response: Option<String>,
}

// ============================================================================
// AI 提取服务
// ============================================================================

/// MDE AI 提取服务
/// 
/// 使用视觉 AI 模型（如 GPT-4V）分析屏幕截图并提取结构化数据
pub struct MdeAiExtractorService {
    config: MdeAiConfig,
    http_client: Client,
}

impl MdeAiExtractorService {
    /// 创建 AI 提取服务
    pub fn new(config: MdeAiConfig) -> Result<Self> {
        let http_client = Client::builder()
            .timeout(Duration::from_secs(config.timeout_secs))
            .build()?;
        
        Ok(Self {
            config,
            http_client,
        })
    }

    /// 从环境变量创建
    pub fn from_env() -> Result<Self> {
        let config = MdeAiConfig::from_env()?;
        Self::new(config)
    }

    /// 检查服务是否可用
    pub fn is_available(&self) -> bool {
        !self.config.api_key.is_empty()
    }

    /// 使用 AI 提取数据
    pub async fn extract(&self, request: MdeAiExtractionRequest) -> Result<MdeAiExtractionResponse> {
        if !self.is_available() {
            anyhow::bail!("AI 服务未配置（缺少 API Key）");
        }

        let prompt = self.build_prompt(&request);
        let messages = self.build_messages(&request, &prompt)?;
        
        debug!("MDE AI 提取请求: data_type={:?}", request.data_type);
        
        let response = self.call_ai_api(messages).await?;
        let parsed = self.parse_response(response, &request.data_type)?;
        
        info!(
            "MDE AI 提取完成: {} 条数据, 置信度 {:.2}",
            parsed.items.len(),
            parsed.confidence
        );
        
        Ok(parsed)
    }

    /// 构建提取提示词
    fn build_prompt(&self, request: &MdeAiExtractionRequest) -> String {
        let data_type_desc = match &request.data_type {
            MdeDataType::Comments => "评论列表，包括用户名、评论内容、点赞数、时间",
            MdeDataType::Products => "商品列表，包括商品名称、价格、销量、店铺名",
            MdeDataType::Users => "用户列表，包括用户名、粉丝数、简介",
            MdeDataType::Posts => "帖子/笔记列表，包括标题、内容、点赞数、评论数",
            MdeDataType::Messages => "消息列表，包括发送者、内容、时间",
            MdeDataType::Custom(name) => name.as_str(),
        };

        let app_hint = request.app_info.as_ref()
            .map(|info| format!("当前 APP: {}", info.name))
            .unwrap_or_default();

        let page_hint = request.page_type.as_ref()
            .map(|pt| format!("页面类型: {:?}", pt))
            .unwrap_or_default();

        let additional = request.additional_prompt.clone().unwrap_or_default();

        format!(
            r#"你是一个专业的移动应用数据提取助手。请从提供的手机屏幕截图/UI结构中提取结构化数据。

## 任务
提取: {data_type_desc}
{app_hint}
{page_hint}
{additional}

## 输出格式
返回 JSON 数组，每个元素代表一条提取的数据。格式如下：
```json
{{
  "items": [
    {{
      "username": "用户名",
      "content": "内容",
      "like_count": "点赞数",
      "time": "时间",
      "avatar_url": "头像URL（如果有）"
    }}
  ],
  "confidence": 0.95,
  "page_type": "comment_list"
}}
```

## 规则
1. 只返回 JSON，不要其他文字
2. 如果某个字段无法提取，设为 null
3. 数字类型字段（如点赞数）请转换为字符串
4. confidence 是你对提取结果准确性的评估 (0.0-1.0)
5. 如果屏幕中没有相关数据，返回空数组: {{"items": [], "confidence": 0.0}}

开始分析："#
        )
    }

    /// 构建 API 消息
    fn build_messages(&self, request: &MdeAiExtractionRequest, prompt: &str) -> Result<Vec<Value>> {
        let mut content = vec![];
        
        // 添加文本提示
        content.push(json!({
            "type": "text",
            "text": prompt
        }));

        // 添加截图（如果有）
        if let Some(screenshot) = &request.screenshot {
            let base64_image = BASE64.encode(screenshot);
            content.push(json!({
                "type": "image_url",
                "image_url": {
                    "url": format!("data:image/png;base64,{}", base64_image),
                    "detail": "high"
                }
            }));
        }

        // 添加 XML 内容（如果有，作为补充信息）
        if let Some(xml) = &request.xml_content {
            // 截取前 5000 字符避免太长
            let xml_snippet = if xml.len() > 5000 {
                format!("{}...(已截断)", &xml[..5000])
            } else {
                xml.clone()
            };
            
            content.push(json!({
                "type": "text",
                "text": format!("\n\n## UI 结构 (XML)\n```xml\n{}\n```", xml_snippet)
            }));
        }

        Ok(vec![json!({
            "role": "user",
            "content": content
        })])
    }

    /// 调用 AI API
    async fn call_ai_api(&self, messages: Vec<Value>) -> Result<Value> {
        let request_body = json!({
            "model": self.config.model,
            "messages": messages,
            "max_tokens": self.config.max_tokens,
            "temperature": 0.1,  // 低温度提高一致性
        });

        let response = self.http_client
            .post(&self.config.api_url)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await
            .context("AI API 请求失败")?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("AI API 返回错误 {}: {}", status, error_text);
        }

        let response_json: Value = response.json().await
            .context("解析 AI API 响应失败")?;

        Ok(response_json)
    }

    /// 解析 AI 响应
    fn parse_response(&self, response: Value, data_type: &MdeDataType) -> Result<MdeAiExtractionResponse> {
        // 提取 content
        let content = response
            .get("choices")
            .and_then(|c| c.get(0))
            .and_then(|c| c.get("message"))
            .and_then(|m| m.get("content"))
            .and_then(|c| c.as_str())
            .context("无法从 AI 响应中提取 content")?;

        // 提取 tokens 使用量
        let tokens_used = response
            .get("usage")
            .and_then(|u| u.get("total_tokens"))
            .and_then(|t| t.as_u64())
            .unwrap_or(0) as u32;

        // 尝试解析 JSON
        let parsed: Value = self.extract_json_from_text(content)
            .context("AI 返回的内容不是有效 JSON")?;

        // 提取 items
        let items_array = parsed.get("items")
            .and_then(|i| i.as_array())
            .cloned()
            .unwrap_or_default();

        let confidence = parsed.get("confidence")
            .and_then(|c| c.as_f64())
            .unwrap_or(0.5) as f32;

        // 转换为 MdeExtractedItem
        let items: Vec<MdeExtractedItem> = items_array
            .into_iter()
            .enumerate()
            .map(|(idx, item)| self.value_to_extracted_item(item, data_type, idx))
            .collect();

        Ok(MdeAiExtractionResponse {
            items,
            confidence,
            model: self.config.model.clone(),
            tokens_used,
            raw_response: Some(content.to_string()),
        })
    }

    /// 从文本中提取 JSON（处理 markdown 代码块等）
    fn extract_json_from_text(&self, text: &str) -> Result<Value> {
        // 尝试直接解析
        if let Ok(v) = serde_json::from_str::<Value>(text) {
            return Ok(v);
        }

        // 尝试提取 ```json ... ``` 代码块
        if let Some(start) = text.find("```json") {
            let after_start = &text[start + 7..];
            if let Some(end) = after_start.find("```") {
                let json_str = &after_start[..end].trim();
                if let Ok(v) = serde_json::from_str::<Value>(json_str) {
                    return Ok(v);
                }
            }
        }

        // 尝试提取 ``` ... ``` 代码块
        if let Some(start) = text.find("```") {
            let after_start = &text[start + 3..];
            // 跳过语言标识符行
            let json_start = after_start.find('\n').map(|i| i + 1).unwrap_or(0);
            let after_lang = &after_start[json_start..];
            if let Some(end) = after_lang.find("```") {
                let json_str = &after_lang[..end].trim();
                if let Ok(v) = serde_json::from_str::<Value>(json_str) {
                    return Ok(v);
                }
            }
        }

        // 尝试找到 { 和 } 之间的内容
        if let (Some(start), Some(end)) = (text.find('{'), text.rfind('}')) {
            if start < end {
                let json_str = &text[start..=end];
                if let Ok(v) = serde_json::from_str::<Value>(json_str) {
                    return Ok(v);
                }
            }
        }

        anyhow::bail!("无法从文本中提取 JSON: {}", &text[..text.len().min(200)])
    }

    /// 将 JSON Value 转换为 MdeExtractedItem
    fn value_to_extracted_item(&self, value: Value, data_type: &MdeDataType, index: usize) -> MdeExtractedItem {
        let mut fields = HashMap::new();
        
        if let Value::Object(obj) = value {
            for (key, val) in obj {
                let field_value = match val {
                    Value::String(s) => MdeFieldValue::Text(s),
                    Value::Number(n) => {
                        if let Some(i) = n.as_i64() {
                            MdeFieldValue::Number(i)
                        } else if let Some(f) = n.as_f64() {
                            MdeFieldValue::Float(f)
                        } else {
                            MdeFieldValue::Text(n.to_string())
                        }
                    }
                    Value::Bool(b) => MdeFieldValue::Bool(b),
                    Value::Null => continue,
                    other => MdeFieldValue::Text(other.to_string()),
                };
                fields.insert(key, field_value);
            }
        }

        MdeExtractedItem {
            data_type: data_type.clone(),
            fields,
            bounds: None,
            confidence: 0.8, // AI 提取默认置信度
            source_path: None,
        }
    }
}

/// 将 AI 提取结果转换为标准提取结果
impl MdeAiExtractionResponse {
    pub fn into_extraction_result(self, app_info: Option<MdeAppInfo>) -> MdeExtractionResult {
        let mut result = MdeExtractionResult::success(self.items, MdeExtractionMethod::Ai);
        if let Some(info) = app_info {
            result = result.with_app_info(info);
        }
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_json_from_text() {
        let service = MdeAiExtractorService::new(MdeAiConfig::default()).unwrap();
        
        // 直接 JSON
        let text1 = r#"{"items": [], "confidence": 0.9}"#;
        assert!(service.extract_json_from_text(text1).is_ok());
        
        // Markdown 代码块
        let text2 = r#"这是分析结果：
```json
{"items": [{"name": "test"}], "confidence": 0.8}
```"#;
        let result = service.extract_json_from_text(text2).unwrap();
        assert_eq!(result["confidence"], 0.8);
        
        // 带其他文字
        let text3 = r#"好的，我来分析这个屏幕。{"items": [], "confidence": 0.5} 分析完成。"#;
        assert!(service.extract_json_from_text(text3).is_ok());
    }
}
