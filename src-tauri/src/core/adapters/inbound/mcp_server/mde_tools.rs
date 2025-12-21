// src-tauri/src/core/adapters/inbound/mcp_server/mde_tools.rs
// module: core/adapters/inbound/mcp_server | layer: adapters | role: mde-mcp-tools
// summary: MDE 数据提取 MCP 工具 - 提供给 AI Agent 的数据提取能力

use std::sync::Arc;
use std::collections::HashMap;
use serde_json::{json, Value};
use tracing::{info, warn, error};

use super::protocol::{McpTool, ToolResult};
use crate::core::application::{
    AppContext, MdeExtractorService, MdeSaveOptions,
    MdeAiExtractionRequest,
};
use crate::core::domain::mde_extraction::{
    MdePageType, MdeRuleRepository, MdeAppRule, MdePageRule, MdeFieldRule,
    MdeSelector, MdeSelectorCandidates, MdeDataType, MdeExtractionResult,
    MdeExtractedItem, MdeFieldValue, MdeExtractionMethod,
};

// ============================================================================
// MDE 工具注册
// ============================================================================

/// 注册 MDE 数据提取工具
pub fn register_mde_tools() -> Vec<McpTool> {
    vec![
        McpTool::new(
            "mde_detect_page",
            "检测当前手机屏幕的页面类型（评论列表、商品详情等）",
            json!({
                "type": "object",
                "properties": {
                    "device_id": {
                        "type": "string",
                        "description": "设备ID（可选，默认使用当前连接的设备）"
                    },
                    "xml": {
                        "type": "string",
                        "description": "XML dump 内容（可选，如果不提供则自动获取屏幕）"
                    },
                    "package_name": {
                        "type": "string",
                        "description": "APP 包名（可选，如果不提供则自动检测）"
                    }
                },
                "required": []
            }),
        ),
        McpTool::new(
            "mde_extract",
            "从手机屏幕提取结构化数据（评论、商品、用户等）",
            json!({
                "type": "object",
                "properties": {
                    "device_id": {
                        "type": "string",
                        "description": "设备ID（可选，默认使用当前连接的设备）"
                    },
                    "xml": {
                        "type": "string",
                        "description": "XML dump 内容（可选，如果不提供则自动获取屏幕）"
                    },
                    "package_name": {
                        "type": "string",
                        "description": "APP 包名（必填，如 com.ss.android.ugc.aweme）"
                    },
                    "page_type": {
                        "type": "string",
                        "enum": ["home", "video_detail", "comment_list", "product_detail", "product_list", "user_profile", "search_result", "message_list"],
                        "description": "页面类型（可选，如果不提供则自动检测）"
                    },
                    "scroll_and_collect": {
                        "type": "boolean",
                        "description": "是否滚动并收集更多数据（默认 false）"
                    },
                    "max_scroll_times": {
                        "type": "integer",
                        "description": "最大滚动次数（默认 5）"
                    }
                },
                "required": ["package_name"]
            }),
        ),
        McpTool::new(
            "mde_save",
            "将提取的数据保存到数据库",
            json!({
                "type": "object",
                "properties": {
                    "data": {
                        "type": "array",
                        "description": "要保存的数据数组（来自 mde_extract 的结果）",
                        "items": {
                            "type": "object"
                        }
                    },
                    "table_name": {
                        "type": "string",
                        "description": "目标表名（可选，默认根据数据类型自动选择）"
                    },
                    "dedupe_fields": {
                        "type": "array",
                        "items": { "type": "string" },
                        "description": "用于去重的字段列表（如 ['nickname', 'content']）"
                    }
                },
                "required": ["data"]
            }),
        ),
        McpTool::new(
            "mde_list_supported_apps",
            "列出所有支持数据提取的 APP",
            json!({
                "type": "object",
                "properties": {},
                "required": []
            }),
        ),
    ]
}

// ============================================================================
// MDE 工具执行
// ============================================================================

/// 执行 MDE 工具
pub async fn execute_mde_tool(
    tool_name: &str,
    params: Value,
    ctx: &Arc<AppContext>,
) -> Option<ToolResult> {
    match tool_name {
        "mde_detect_page" => Some(handle_mde_detect_page(params, ctx).await),
        "mde_extract" => Some(handle_mde_extract(params, ctx).await),
        "mde_save" => Some(handle_mde_save(params, ctx).await),
        "mde_list_supported_apps" => Some(handle_mde_list_supported_apps(ctx).await),
        _ => None, // 不是 MDE 工具
    }
}

// ============================================================================
// 工具处理函数
// ============================================================================

async fn handle_mde_detect_page(params: Value, ctx: &Arc<AppContext>) -> ToolResult {
    // 获取参数
    let device_id = params.get("device_id").and_then(|v| v.as_str());
    let xml = params.get("xml").and_then(|v| v.as_str());
    let package_name = params.get("package_name").and_then(|v| v.as_str());

    // 如果没有提供 XML，需要从设备获取
    let xml_content = match xml {
        Some(x) => x.to_string(),
        None => {
            // 调用 get_screen 获取 XML
            match get_screen_xml(device_id, ctx).await {
                Ok(x) => x,
                Err(e) => return ToolResult::error(format!("获取屏幕失败: {}", e)),
            }
        }
    };

    // 如果没有提供包名，尝试从 XML 中提取
    let pkg = match package_name {
        Some(p) => p.to_string(),
        None => {
            extract_package_from_xml(&xml_content).unwrap_or_else(|| "unknown".to_string())
        }
    };

    // 创建提取器服务（使用内置规则）
    let extractor = create_extractor_with_builtin_rules();

    // 检测页面
    match extractor.detect_page(&xml_content, &pkg) {
        Ok(result) => ToolResult::success_json(&result),
        Err(e) => ToolResult::error(format!("页面检测失败: {}", e)),
    }
}

async fn handle_mde_extract(params: Value, ctx: &Arc<AppContext>) -> ToolResult {
    // 获取参数
    let device_id = params.get("device_id").and_then(|v| v.as_str());
    let xml = params.get("xml").and_then(|v| v.as_str());
    let package_name = match params.get("package_name").and_then(|v| v.as_str()) {
        Some(p) => p,
        None => return ToolResult::error("缺少参数: package_name"),
    };
    let page_type_str = params.get("page_type").and_then(|v| v.as_str());
    let scroll_and_collect = params.get("scroll_and_collect").and_then(|v| v.as_bool()).unwrap_or(false);
    let max_scroll = params.get("max_scroll_times").and_then(|v| v.as_u64()).unwrap_or(5) as usize;
    let use_ai = params.get("use_ai_fallback").and_then(|v| v.as_bool()).unwrap_or(true);

    // 解析页面类型
    let page_type = page_type_str.map(|s| parse_page_type(s));

    // 创建提取器服务
    let extractor = create_extractor_with_builtin_rules();

    // 获取设备 ID（用于滚动和截图）
    let resolved_device_id = match resolve_device_id(device_id, ctx).await {
        Ok(id) => id,
        Err(e) => return ToolResult::error(format!("无法获取设备: {}", e)),
    };

    // 如果启用滚动收集，执行滚动收集逻辑
    if scroll_and_collect && xml.is_none() {
        return handle_scroll_and_collect(
            &resolved_device_id,
            package_name,
            page_type.as_ref(),
            max_scroll,
            use_ai,
            &extractor,
            ctx,
        ).await;
    }

    // 单次提取逻辑
    let xml_content = match xml {
        Some(x) => x.to_string(),
        None => {
            match get_screen_xml(Some(&resolved_device_id), ctx).await {
                Ok(x) => x,
                Err(e) => return ToolResult::error(format!("获取屏幕失败: {}", e)),
            }
        }
    };

    // 尝试提取
    extract_with_fallback(
        &xml_content,
        package_name,
        page_type.as_ref(),
        use_ai,
        Some(&resolved_device_id),
        &extractor,
        ctx,
    ).await
}

/// 滚动并收集数据
async fn handle_scroll_and_collect(
    device_id: &str,
    package_name: &str,
    page_type: Option<&MdePageType>,
    max_scroll: usize,
    use_ai: bool,
    extractor: &MdeExtractorService,
    ctx: &Arc<AppContext>,
) -> ToolResult {
    info!("📜 开始滚动收集: 最大滚动 {} 次", max_scroll);
    
    let mut all_items: Vec<MdeExtractedItem> = vec![];
    let mut seen_keys: std::collections::HashSet<String> = std::collections::HashSet::new();
    let mut no_new_data_count = 0;
    const MAX_NO_NEW_DATA: usize = 2; // 连续2次没有新数据则停止
    
    for scroll_idx in 0..=max_scroll {
        // 获取当前屏幕
        let xml_content = match get_screen_xml(Some(device_id), ctx).await {
            Ok(x) => x,
            Err(e) => {
                warn!("滚动 {} 获取屏幕失败: {}", scroll_idx, e);
                break;
            }
        };
        
        // 提取数据
        let items = match extractor.extract(&xml_content, package_name, page_type) {
            Ok(result) => result.items,
            Err(e) => {
                warn!("滚动 {} 提取失败: {}", scroll_idx, e);
                vec![]
            }
        };
        
        // 去重合并
        let mut new_count = 0;
        for item in items {
            // 使用字段组合作为唯一键
            let key = generate_item_key(&item);
            if !seen_keys.contains(&key) {
                seen_keys.insert(key);
                all_items.push(item);
                new_count += 1;
            }
        }
        
        info!(
            "📜 滚动 {}/{}: 新增 {} 条, 总计 {} 条",
            scroll_idx, max_scroll, new_count, all_items.len()
        );
        
        // 检查是否有新数据
        if new_count == 0 {
            no_new_data_count += 1;
            if no_new_data_count >= MAX_NO_NEW_DATA {
                info!("📜 连续 {} 次无新数据，停止滚动", MAX_NO_NEW_DATA);
                break;
            }
        } else {
            no_new_data_count = 0;
        }
        
        // 如果还没到最大次数，执行滚动
        if scroll_idx < max_scroll {
            if let Err(e) = ctx.device_service.swipe_up(device_id).await {
                warn!("滚动失败: {}", e);
                break;
            }
            // 等待页面稳定
            tokio::time::sleep(tokio::time::Duration::from_millis(800)).await;
        }
    }
    
    // 构建结果
    let result = MdeExtractionResult::success(all_items.clone(), MdeExtractionMethod::Rule)
        .with_page_type(page_type.cloned().unwrap_or(MdePageType::Unknown));
    
    info!("📜 滚动收集完成: 共 {} 条数据", all_items.len());
    ToolResult::success_json(&result)
}

/// 生成数据项的唯一键（用于去重）
fn generate_item_key(item: &MdeExtractedItem) -> String {
    // 优先使用关键字段组合
    let mut parts = vec![];
    
    if let Some(v) = item.fields.get("nickname").or(item.fields.get("username")) {
        parts.push(v.as_string());
    }
    if let Some(v) = item.fields.get("content").or(item.fields.get("comment")) {
        parts.push(v.as_string());
    }
    if let Some(v) = item.fields.get("time") {
        parts.push(v.as_string());
    }
    
    if parts.is_empty() {
        // 如果没有关键字段，使用所有字段
        let mut all_values: Vec<String> = item.fields.values()
            .map(|v| v.as_string())
            .collect();
        all_values.sort();
        parts = all_values;
    }
    
    parts.join("|")
}

/// 带 AI fallback 的提取
async fn extract_with_fallback(
    xml_content: &str,
    package_name: &str,
    page_type: Option<&MdePageType>,
    use_ai: bool,
    device_id: Option<&str>,
    extractor: &MdeExtractorService,
    ctx: &Arc<AppContext>,
) -> ToolResult {
    // 尝试使用规则提取
    let result = extractor.extract(xml_content, package_name, page_type);
    
    match result {
        Ok(ref extraction_result) if !extraction_result.items.is_empty() => {
            // 规则提取成功
            info!("📊 MDE 规则提取完成: {} 条数据", extraction_result.items.len());
            ToolResult::success_json(extraction_result)
        }
        _ => {
            // 规则提取失败或没有数据，尝试 AI fallback
            if use_ai {
                if let Some(ai_extractor) = &ctx.mde_ai_extractor {
                    warn!("📊 MDE 规则提取失败/无数据，尝试 AI fallback");
                    
                    // 推断数据类型
                    let data_type = page_type
                        .map(|pt| match pt {
                            MdePageType::CommentList => MdeDataType::Comments,
                            MdePageType::ProductDetail | MdePageType::ProductList => MdeDataType::Products,
                            MdePageType::UserProfile => MdeDataType::Users,
                            _ => MdeDataType::Comments,
                        })
                        .unwrap_or(MdeDataType::Comments);
                    
                    // 尝试获取截图
                    let screenshot = if let Some(did) = device_id {
                        match ctx.device_service.take_screenshot(did).await {
                            Ok(bytes) => {
                                info!("📸 截图获取成功: {} bytes", bytes.len());
                                Some(bytes)
                            }
                            Err(e) => {
                                warn!("截图获取失败: {}", e);
                                None
                            }
                        }
                    } else {
                        None
                    };
                    
                    let ai_request = MdeAiExtractionRequest {
                        screenshot,
                        xml_content: Some(xml_content.to_string()),
                        data_type,
                        app_info: None,
                        page_type: page_type.cloned(),
                        additional_prompt: None,
                    };
                    
                    match ai_extractor.extract(ai_request).await {
                        Ok(ai_result) => {
                            info!("🤖 MDE AI 提取完成: {} 条数据", ai_result.items.len());
                            let extraction_result = ai_result.into_extraction_result(None);
                            return ToolResult::success_json(&extraction_result);
                        }
                        Err(e) => {
                            warn!("AI fallback 也失败: {}", e);
                        }
                    }
                } else {
                    warn!("AI 服务未配置，无法进行 fallback");
                }
            }
            
            // 都失败了
            match result {
                Ok(r) => ToolResult::success_json(&r), // 返回空结果
                Err(e) => ToolResult::error(format!("数据提取失败: {}", e)),
            }
        }
    }
}

/// 解析设备 ID
async fn resolve_device_id(device_id: Option<&str>, ctx: &Arc<AppContext>) -> Result<String, String> {
    match device_id {
        Some(id) => Ok(id.to_string()),
        None => {
            // 获取第一个连接的设备
            let devices = ctx.device_service.list_devices().await
                .map_err(|e| format!("获取设备列表失败: {}", e))?;
            
            devices.into_iter()
                .find(|d| d.status == crate::core::domain::device::DeviceStatus::Connected)
                .map(|d| d.id)
                .ok_or_else(|| "没有已连接的设备".to_string())
        }
    }
}

async fn handle_mde_save(params: Value, ctx: &Arc<AppContext>) -> ToolResult {
    // 获取数据
    let data = match params.get("data").and_then(|v| v.as_array()) {
        Some(d) => d,
        None => return ToolResult::error("缺少参数: data"),
    };

    if data.is_empty() {
        return ToolResult::success_json(&json!({
            "success": true,
            "saved_count": 0,
            "skipped_count": 0,
            "message": "没有数据需要保存"
        }));
    }

    let table_name = params.get("table_name").and_then(|v| v.as_str()).map(String::from);
    let app_package = params.get("app_package").and_then(|v| v.as_str()).map(String::from);
    let page_type = params.get("page_type").and_then(|v| v.as_str()).map(String::from);
    let dedupe_fields: Vec<String> = params
        .get("dedupe_fields")
        .and_then(|v| v.as_array())
        .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
        .unwrap_or_default();
    let upsert = params.get("upsert").and_then(|v| v.as_bool()).unwrap_or(false);

    // 将 JSON 数据转换为 MdeExtractedItem
    let items: Vec<MdeExtractedItem> = data
        .iter()
        .enumerate()
        .map(|(idx, v)| json_to_extracted_item(v, idx))
        .collect();

    // 推断数据类型
    let data_type = infer_data_type(&items);

    // 构建存储选项
    let options = MdeSaveOptions {
        table_name,
        dedupe_fields,
        upsert,
        app_package,
        page_type,
    };

    // 调用存储服务
    match ctx.mde_storage.save(&items, data_type, options) {
        Ok(result) => {
            info!("📦 MDE 存储完成: {} 保存, {} 跳过", result.saved_count, result.skipped_count);
            ToolResult::success_json(&result)
        }
        Err(e) => {
            error!("MDE 存储失败: {}", e);
            ToolResult::error(format!("数据保存失败: {}", e))
        }
    }
}

/// 将 JSON Value 转换为 MdeExtractedItem
fn json_to_extracted_item(value: &Value, index: usize) -> MdeExtractedItem {
    let mut fields = HashMap::new();
    
    if let Value::Object(obj) = value {
        for (key, val) in obj {
            // 跳过内部字段
            if key == "data_type" || key == "confidence" || key == "id" {
                continue;
            }
            
            let field_value = match val {
                Value::String(s) => MdeFieldValue::Text(s.clone()),
                Value::Number(n) => {
                    if let Some(i) = n.as_i64() {
                        MdeFieldValue::Number(i)
                    } else if let Some(f) = n.as_f64() {
                        MdeFieldValue::Float(f)
                    } else {
                        MdeFieldValue::Text(n.to_string())
                    }
                }
                Value::Bool(b) => MdeFieldValue::Bool(*b),
                Value::Null => continue,
                other => MdeFieldValue::Text(other.to_string()),
            };
            fields.insert(key.clone(), field_value);
        }
    }
    
    let confidence = value.get("confidence")
        .and_then(|v| v.as_f64())
        .map(|f| f as f32);

    MdeExtractedItem {
        data_type: MdeDataType::Comments, // 默认，会被 infer_data_type 覆盖
        fields,
        bounds: None,
        confidence: confidence.unwrap_or(0.8),
        source_path: None,
    }
}

/// 从数据中推断数据类型
fn infer_data_type(items: &[MdeExtractedItem]) -> MdeDataType {
    if items.is_empty() {
        return MdeDataType::Comments;
    }
    
    // 检查第一条数据的字段来推断类型
    let first = &items[0];
    let fields: Vec<&str> = first.fields.keys().map(|s| s.as_str()).collect();
    
    if fields.iter().any(|f| *f == "content" || *f == "comment" || *f == "nickname") {
        MdeDataType::Comments
    } else if fields.iter().any(|f| *f == "price" || *f == "product_name" || *f == "shop") {
        MdeDataType::Products
    } else if fields.iter().any(|f| *f == "followers" || *f == "bio" || *f == "avatar") {
        MdeDataType::Users
    } else if fields.iter().any(|f| *f == "title" || *f == "post_content" || *f == "likes") {
        MdeDataType::Posts
    } else {
        MdeDataType::Comments // 默认
    }
}

async fn handle_mde_list_supported_apps(_ctx: &Arc<AppContext>) -> ToolResult {
    let extractor = create_extractor_with_builtin_rules();
    
    // 获取支持的 APP 列表
    // TODO: 从规则仓库获取实际列表
    ToolResult::success_json(&json!({
        "apps": [
            {
                "package": "com.ss.android.ugc.aweme",
                "name": "抖音",
                "supported_pages": ["comment_list", "video_detail", "user_profile"]
            },
            {
                "package": "com.xingin.xhs",
                "name": "小红书",
                "supported_pages": ["comment_list", "post_detail", "user_profile"]
            }
        ]
    }))
}

// ============================================================================
// 辅助函数
// ============================================================================

/// 从设备获取屏幕 XML
async fn get_screen_xml(device_id: Option<&str>, ctx: &Arc<AppContext>) -> Result<String, String> {
    // 调用 device_service 获取屏幕
    let device = match device_id {
        Some(id) => id.to_string(),
        None => {
            // 获取第一个连接的设备
            match ctx.device_service.list_devices().await {
                Ok(devices) => {
                    devices.first()
                        .map(|d| d.id.clone())
                        .ok_or_else(|| "没有连接的设备".to_string())?
                }
                Err(e) => return Err(format!("获取设备列表失败: {}", e)),
            }
        }
    };

    // 执行 adb shell uiautomator dump 获取屏幕内容
    ctx.device_service
        .get_screen_content(&device)
        .await
        .map_err(|e| format!("获取屏幕 XML 失败: {}", e))
}

/// 从 XML 中提取包名
fn extract_package_from_xml(xml: &str) -> Option<String> {
    // 简单的正则匹配 package="xxx"
    let re = regex::Regex::new(r#"package="([^"]+)""#).ok()?;
    re.captures(xml)
        .and_then(|caps| caps.get(1))
        .map(|m| m.as_str().to_string())
}

/// 解析页面类型字符串
fn parse_page_type(s: &str) -> MdePageType {
    match s {
        "home" => MdePageType::Home,
        "video_detail" => MdePageType::VideoDetail,
        "comment_list" => MdePageType::CommentList,
        "product_detail" => MdePageType::ProductDetail,
        "product_list" => MdePageType::ProductList,
        "user_profile" => MdePageType::UserProfile,
        "search_result" => MdePageType::SearchResult,
        "message_list" => MdePageType::MessageList,
        _ => MdePageType::Unknown,
    }
}

/// 创建带有内置规则的提取器
fn create_extractor_with_builtin_rules() -> MdeExtractorService {
    let mut repo = MdeRuleRepository::new();
    
    // 注册抖音规则
    repo.register(create_douyin_rules());
    
    // 注册小红书规则
    repo.register(create_xiaohongshu_rules());
    
    MdeExtractorService::new(std::sync::Arc::new(repo))
}

/// 创建抖音规则
fn create_douyin_rules() -> MdeAppRule {
    let mut app_rule = MdeAppRule::new("com.ss.android.ugc.aweme", "抖音");
    
    // 评论列表页面规则
    let comment_page = MdePageRule {
        page_type: MdePageType::CommentList,
        page_detectors: vec![
            MdeSelector::ResourceIdContains("comment".to_string()),
        ],
        data_type: MdeDataType::Comments,
        item_container: MdeSelector::ResourceIdContains("comment_list".to_string()),
        item_selector: MdeSelector::ResourceIdContains("comment_item".to_string()),
        field_rules: vec![
            MdeFieldRule::simple_text("nickname", MdeSelector::ResourceIdContains("nickname".to_string())).required(),
            MdeFieldRule::simple_text("content", MdeSelector::ResourceIdContains("comment_content".to_string())).required(),
            MdeFieldRule::simple_text("like_count", MdeSelector::ResourceIdContains("like_count".to_string())),
            MdeFieldRule::simple_text("time", MdeSelector::ResourceIdContains("time".to_string())),
        ],
        pagination: None,
        priority: 10,
    };
    
    app_rule = app_rule.with_page_rule(comment_page);
    app_rule
}

/// 创建小红书规则
fn create_xiaohongshu_rules() -> MdeAppRule {
    let mut app_rule = MdeAppRule::new("com.xingin.xhs", "小红书");
    
    // 评论列表页面规则
    let comment_page = MdePageRule {
        page_type: MdePageType::CommentList,
        page_detectors: vec![
            MdeSelector::ResourceIdContains("comment".to_string()),
        ],
        data_type: MdeDataType::Comments,
        item_container: MdeSelector::ResourceIdContains("comment_list".to_string()),
        item_selector: MdeSelector::ResourceIdContains("comment_item".to_string()),
        field_rules: vec![
            MdeFieldRule::simple_text("nickname", MdeSelector::ResourceIdContains("nickname".to_string())).required(),
            MdeFieldRule::simple_text("content", MdeSelector::ResourceIdContains("content".to_string())).required(),
            MdeFieldRule::simple_text("like_count", MdeSelector::ResourceIdContains("like".to_string())),
        ],
        pagination: None,
        priority: 10,
    };
    
    app_rule = app_rule.with_page_rule(comment_page);
    app_rule
}
