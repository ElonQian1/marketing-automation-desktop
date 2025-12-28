// src-tauri/src/services/execution/actions/ai_agent.rs
// module: services/execution/actions | layer: services | role: ai-agent-handlers
// summary: AI Agent 专用操作类型处理器 - 处理 launch_app, find_elements, tap_relative, extract_comments 等

use anyhow::Result;
use std::sync::{Arc, RwLock};
use std::collections::HashMap;
use once_cell::sync::Lazy;
use tracing::{debug, info, warn};
use serde::{Deserialize, Serialize};

use crate::services::adb::get_device_session;
use crate::services::execution::model::SmartScriptStep;
use crate::services::smart_script_executor::SmartScriptExecutor;
use crate::engine::xml_indexer::XmlIndexer;

/// AI Agent 执行上下文 - 存储找到的元素供后续步骤使用
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FoundElementInfo {
    pub text: String,
    pub bounds: (i32, i32, i32, i32),  // left, top, right, bottom
    pub center: (i32, i32),             // center_x, center_y
    pub value: Option<i64>,             // 解析后的数值（如点赞数）
    pub resource_id: Option<String>,
    pub class_name: Option<String>,
}

/// 全局 AI Agent 上下文（存储最近一次 find_elements 的结果）
static AI_AGENT_CONTEXT: Lazy<RwLock<AiAgentContext>> = 
    Lazy::new(|| RwLock::new(AiAgentContext::default()));

#[derive(Debug, Default)]
pub struct AiAgentContext {
    /// 最近一次 find_elements 找到的元素列表
    pub found_elements: Vec<FoundElementInfo>,
    /// 当前选中的元素索引
    pub selected_element_index: Option<usize>,
    /// 屏幕尺寸缓存
    pub screen_size: Option<(i32, i32)>,
}

/// 处理启动应用操作
pub async fn handle_launch_app(
    executor: &SmartScriptExecutor,
    step: &SmartScriptStep,
    logs: &mut Vec<String>,
) -> Result<String> {
    let params = step.parameters.get("params")
        .unwrap_or(&step.parameters);
    
    let package_name = params.get("package_name")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    
    if package_name.is_empty() {
        let err = "❌ launch_app: 缺少 package_name 参数";
        logs.push(err.to_string());
        return Err(anyhow::anyhow!(err));
    }
    
    logs.push(format!("🚀 启动应用: {}", package_name));
    
    // 获取 ADB 会话
    let session = get_device_session(executor.device_id()).await?;
    
    // 使用 monkey 命令启动应用（更可靠）
    let cmd = format!("monkey -p {} -c android.intent.category.LAUNCHER 1", package_name);
    let result = session.execute_command(&cmd).await;
    
    match result {
        Ok(output) => {
            info!("✅ 应用 {} 启动成功: {}", package_name, output.trim());
            logs.push(format!("✅ 应用 {} 启动成功", package_name));
            
            // 等待应用启动
            tokio::time::sleep(tokio::time::Duration::from_millis(2000)).await;
            
            Ok(format!("应用 {} 已启动", package_name))
        }
        Err(e) => {
            warn!("⚠️ 启动应用失败: {}", e);
            logs.push(format!("❌ 启动失败: {}", e));
            Err(anyhow::anyhow!("启动应用失败: {}", e))
        }
    }
}

/// 处理智能查找元素操作 - 使用 XmlIndexer 精确解析 UI 树
pub async fn handle_find_elements(
    executor: &SmartScriptExecutor,
    step: &SmartScriptStep,
    logs: &mut Vec<String>,
) -> Result<String> {
    let params = step.parameters.get("params")
        .unwrap_or(&step.parameters);
    
    let pattern = params.get("pattern")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    
    let min_value = params.get("min_value")
        .and_then(|v| v.as_i64())
        .unwrap_or(0);
    
    // 是否匹配文本（默认 true）
    let match_text = params.get("match_text")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    
    // 是否匹配 content_desc
    let match_content_desc = params.get("match_content_desc")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    
    logs.push(format!("🔍 查找元素: pattern='{}', min_value={}", pattern, min_value));
    
    // 获取屏幕 XML
    let xml = executor.execute_ui_dump_with_retry(logs).await?;
    
    // 🎯 使用 XmlIndexer 解析 XML 为结构化数据
    let indexer = XmlIndexer::build_from_xml(&xml)
        .map_err(|e| anyhow::anyhow!("XML解析失败: {}", e))?;
    
    let re = regex::Regex::new(pattern)
        .map_err(|e| anyhow::anyhow!("无效的正则表达式: {}", e))?;
    
    let mut found_elements: Vec<FoundElementInfo> = Vec::new();
    
    // 遍历所有节点，匹配文本或 content_desc
    for node in &indexer.all_nodes {
        let mut matched_text: Option<String> = None;
        
        // 匹配文本
        if match_text && !node.element.text.is_empty() {
            if re.is_match(&node.element.text) {
                matched_text = Some(node.element.text.clone());
            }
        }
        
        // 匹配 content_desc
        if matched_text.is_none() && match_content_desc && !node.element.content_desc.is_empty() {
            if re.is_match(&node.element.content_desc) {
                matched_text = Some(node.element.content_desc.clone());
            }
        }
        
        if let Some(text) = matched_text {
            // 解析数值（支持 "1.2万" 等格式）
            let parsed_value = parse_chinese_number(&text);
            
            // 过滤 min_value
            if parsed_value >= min_value {
                let center_x = (node.bounds.0 + node.bounds.2) / 2;
                let center_y = (node.bounds.1 + node.bounds.3) / 2;
                
                found_elements.push(FoundElementInfo {
                    text,
                    bounds: node.bounds,
                    center: (center_x, center_y),
                    value: Some(parsed_value),
                    resource_id: node.element.resource_id.clone(),
                    class_name: node.element.class_name.clone(),
                });
            }
        }
    }
    
    // 🎯 存储到全局上下文供后续步骤使用
    {
        let mut ctx = AI_AGENT_CONTEXT.write().unwrap();
        ctx.found_elements = found_elements.clone();
        ctx.selected_element_index = if found_elements.is_empty() { None } else { Some(0) };
        debug!("📦 已存储 {} 个元素到上下文", found_elements.len());
    }
    
    if found_elements.is_empty() {
        logs.push("⚠️ 未找到符合条件的元素".to_string());
        return Ok("未找到符合条件的元素".to_string());
    }
    
    logs.push(format!("✅ 找到 {} 个符合条件的元素", found_elements.len()));
    
    // 返回带坐标的结果
    let result = serde_json::json!({
        "count": found_elements.len(),
        "elements": found_elements.iter().take(5).map(|e| {
            serde_json::json!({
                "text": e.text,
                "center": e.center,
                "value": e.value
            })
        }).collect::<Vec<_>>()
    });
    
    Ok(result.to_string())
}

/// 解析中文数字格式（如 "1.2万" -> 12000）
fn parse_chinese_number(text: &str) -> i64 {
    let cleaned = text.trim();
    
    // 尝试匹配 "数字万" 格式
    if cleaned.ends_with("万") {
        let num_part = cleaned.trim_end_matches("万");
        if let Ok(n) = num_part.parse::<f64>() {
            return (n * 10000.0) as i64;
        }
    }
    
    // 尝试直接解析为数字
    cleaned.replace(",", "").replace(".", "").parse::<i64>().unwrap_or(0)
}

/// 处理相对位置点击操作 - 支持相对于找到的元素点击
pub async fn handle_tap_relative(
    executor: &SmartScriptExecutor,
    step: &SmartScriptStep,
    logs: &mut Vec<String>,
) -> Result<String> {
    let params = step.parameters.get("params")
        .unwrap_or(&step.parameters);
    
    let relative_to = params.get("relative_to")
        .and_then(|v| v.as_str())
        .unwrap_or("found_element");
    
    let offset_x = params.get("offset_x")
        .and_then(|v| v.as_i64())
        .unwrap_or(0) as i32;
    
    let offset_y = params.get("offset_y")
        .and_then(|v| v.as_i64())
        .unwrap_or(0) as i32;
    
    // 🎯 新增：支持选择第几个元素（默认第一个，索引从 0 开始）
    let element_index = params.get("element_index")
        .and_then(|v| v.as_i64())
        .unwrap_or(0) as usize;
    
    logs.push(format!("👆 相对点击: relative_to='{}', offset=({}, {}), element_index={}", 
        relative_to, offset_x, offset_y, element_index));
    
    // 🎯 先从上下文读取元素（避免跨 await 持有锁）
    let element_from_context: Option<(i32, i32)> = {
        let ctx = AI_AGENT_CONTEXT.read().unwrap();
        match relative_to {
            "found_element" | "element" => {
                if let Some(element) = ctx.found_elements.get(element_index) {
                    logs.push(format!("📍 使用找到的元素: '{}' @ ({}, {})", 
                        element.text, element.center.0, element.center.1));
                    Some(element.center)
                } else if !ctx.found_elements.is_empty() {
                    let first = &ctx.found_elements[0];
                    logs.push(format!("⚠️ 元素索引 {} 越界，使用第一个: '{}' @ ({}, {})", 
                        element_index, first.text, first.center.0, first.center.1));
                    Some(first.center)
                } else {
                    None
                }
            }
            "first_element" => {
                ctx.found_elements.first().map(|e| e.center)
            }
            "last_element" => {
                ctx.found_elements.last().map(|e| e.center)
            }
            _ => None,
        }
    }; // 锁在此释放
    
    let (base_x, base_y) = match relative_to {
        "found_element" | "element" | "first_element" | "last_element" => {
            if let Some(center) = element_from_context {
                center
            } else {
                logs.push("⚠️ 上下文中无元素，回退到屏幕中心".to_string());
                get_screen_center(executor).await?
            }
        }
        "screen_center" | "center" => {
            logs.push("📍 使用屏幕中心".to_string());
            get_screen_center(executor).await?
        }
        _ => {
            logs.push(format!("⚠️ 未知 relative_to 类型: {}, 使用屏幕中心", relative_to));
            get_screen_center(executor).await?
        }
    };
    
    let tap_x = base_x + offset_x;
    let tap_y = base_y + offset_y;
    
    // 执行点击
    executor.execute_click_with_retry(tap_x, tap_y, logs).await?;
    
    logs.push(format!("✅ 点击坐标: ({}, {})", tap_x, tap_y));
    
    Ok(format!("点击成功: ({}, {})", tap_x, tap_y))
}

/// 获取屏幕中心坐标
async fn get_screen_center(executor: &SmartScriptExecutor) -> Result<(i32, i32)> {
    // 尝试从缓存获取
    {
        let ctx = AI_AGENT_CONTEXT.read().unwrap();
        if let Some((w, h)) = ctx.screen_size {
            return Ok((w / 2, h / 2));
        }
    }
    
    // 获取真实屏幕尺寸
    let session = get_device_session(executor.device_id()).await?;
    let size_output = session.execute_command("wm size").await
        .unwrap_or_else(|_| "Physical size: 1080x1920".to_string());
    
    // 解析 "Physical size: 1080x1920" 格式
    let (width, height) = if let Some(caps) = regex::Regex::new(r"(\d+)x(\d+)")
        .ok()
        .and_then(|re| re.captures(&size_output)) 
    {
        let w = caps.get(1).map(|m| m.as_str().parse::<i32>().unwrap_or(1080)).unwrap_or(1080);
        let h = caps.get(2).map(|m| m.as_str().parse::<i32>().unwrap_or(1920)).unwrap_or(1920);
        (w, h)
    } else {
        (1080, 1920) // 默认值
    };
    
    // 缓存
    {
        let mut ctx = AI_AGENT_CONTEXT.write().unwrap();
        ctx.screen_size = Some((width, height));
    }
    
    Ok((width / 2, height / 2))
}

/// 处理提取评论操作 - 使用智能结构识别
pub async fn handle_extract_comments(
    executor: &SmartScriptExecutor,
    step: &SmartScriptStep,
    logs: &mut Vec<String>,
) -> Result<String> {
    let params = step.parameters.get("params")
        .unwrap_or(&step.parameters);
    
    let max_count = params.get("max_count")
        .and_then(|v| v.as_i64())
        .unwrap_or(5) as usize;
    
    // 最小评论长度过滤
    let min_length = params.get("min_length")
        .and_then(|v| v.as_i64())
        .unwrap_or(2) as usize;
    
    logs.push(format!("📝 提取评论: max_count={}, min_length={}", max_count, min_length));
    
    // 获取屏幕 XML
    let xml = executor.execute_ui_dump_with_retry(logs).await?;
    
    // 🎯 使用 XmlIndexer 解析 XML
    let indexer = XmlIndexer::build_from_xml(&xml)
        .map_err(|e| anyhow::anyhow!("XML解析失败: {}", e))?;
    
    // 🎯 智能识别评论容器
    // 评论通常在 RecyclerView 或 ListView 中，且包含多个相似结构的子项
    let potential_containers = find_comment_containers(&indexer);
    
    logs.push(format!("🔍 识别到 {} 个潜在评论容器", potential_containers.len()));
    
    let mut comments: Vec<CommentInfo> = Vec::new();
    
    if !potential_containers.is_empty() {
        // 从评论容器中提取
        for container_idx in potential_containers {
            let container = &indexer.all_nodes[container_idx];
            
            // 收集容器内的评论项
            let items = extract_comments_from_container(&indexer, container_idx, min_length);
            
            for item in items {
                if comments.len() >= max_count {
                    break;
                }
                if !comments.iter().any(|c| c.text == item.text) {
                    comments.push(item);
                }
            }
        }
    } else {
        // 回退：直接提取所有看起来像评论的文本
        logs.push("⚠️ 未识别到评论容器，使用全局文本提取".to_string());
        comments = extract_all_text_content(&indexer, min_length, max_count);
    }
    
    if comments.is_empty() {
        logs.push("⚠️ 未能提取到评论".to_string());
        return Ok("未能提取到评论".to_string());
    }
    
    logs.push(format!("✅ 提取到 {} 条评论", comments.len()));
    
    // 格式化输出
    let result = serde_json::json!({
        "count": comments.len(),
        "comments": comments
    });
    
    Ok(result.to_string())
}

/// 评论信息结构
#[derive(Debug, Clone, Serialize, Deserialize)]
struct CommentInfo {
    text: String,
    author: Option<String>,
    likes: Option<i64>,
    bounds: Option<(i32, i32, i32, i32)>,
}

/// 查找评论容器（RecyclerView/ListView 等）
fn find_comment_containers(indexer: &XmlIndexer) -> Vec<usize> {
    let mut containers = Vec::new();
    
    // 寻找可滚动的列表容器
    let scroll_classes = [
        "RecyclerView",
        "ListView",
        "ScrollView",
        "androidx.recyclerview.widget.RecyclerView",
        "android.widget.ListView",
    ];
    
    for (idx, node) in indexer.all_nodes.iter().enumerate() {
        if let Some(class) = &node.element.class_name {
            // 检查是否是列表类型容器
            let is_list = scroll_classes.iter().any(|c| class.contains(c));
            
            // 检查子节点数量（评论列表通常有多个子项）
            let child_count = node.children_indices.len();
            
            if is_list && child_count >= 2 {
                // 检查容器大小是否合理（应占据屏幕主要区域）
                let width = node.bounds.2 - node.bounds.0;
                let height = node.bounds.3 - node.bounds.1;
                
                if width > 500 && height > 300 {
                    containers.push(idx);
                    debug!("📦 识别到评论容器: class={}, 子项数={}", class, child_count);
                }
            }
        }
    }
    
    containers
}

/// 从容器中提取评论
fn extract_comments_from_container(
    indexer: &XmlIndexer, 
    container_idx: usize,
    min_length: usize
) -> Vec<CommentInfo> {
    let mut comments = Vec::new();
    let container = &indexer.all_nodes[container_idx];
    
    // 遍历容器的直接子项（每个子项通常是一条评论）
    for &child_idx in &container.children_indices {
        let child = &indexer.all_nodes[child_idx];
        
        // 收集该子项内的所有文本
        let texts = collect_descendant_texts(indexer, child_idx, min_length);
        
        if !texts.is_empty() {
            // 第一个长文本作为评论内容，短文本可能是作者名
            let (main_text, author) = categorize_texts(&texts);
            
            if let Some(text) = main_text {
                comments.push(CommentInfo {
                    text,
                    author,
                    likes: extract_likes_count(&texts),
                    bounds: Some(child.bounds),
                });
            }
        }
    }
    
    comments
}

/// 递归收集所有后代节点的文本
fn collect_descendant_texts(indexer: &XmlIndexer, node_idx: usize, min_length: usize) -> Vec<String> {
    let mut texts = Vec::new();
    let node = &indexer.all_nodes[node_idx];
    
    // 收集当前节点文本
    if !node.element.text.is_empty() && node.element.text.chars().count() >= min_length {
        texts.push(node.element.text.clone());
    }
    if !node.element.content_desc.is_empty() && node.element.content_desc.chars().count() >= min_length {
        texts.push(node.element.content_desc.clone());
    }
    
    // 递归子节点
    for &child_idx in &node.children_indices {
        texts.extend(collect_descendant_texts(indexer, child_idx, min_length));
    }
    
    texts
}

/// 分类文本：区分主要内容和作者名
fn categorize_texts(texts: &[String]) -> (Option<String>, Option<String>) {
    if texts.is_empty() {
        return (None, None);
    }
    
    // 按长度排序，最长的作为主要内容
    let mut sorted: Vec<_> = texts.iter().collect();
    sorted.sort_by_key(|s| std::cmp::Reverse(s.chars().count()));
    
    let main_text = sorted.first().map(|s| (*s).clone());
    
    // 短文本可能是作者名（通常少于 15 个字符，且不是纯数字）
    let author = sorted.iter()
        .skip(1)
        .find(|s| {
            let len = s.chars().count();
            len >= 2 && len <= 15 && !s.chars().all(|c| c.is_numeric() || c == '.' || c == '万')
        })
        .map(|s| (*s).clone());
    
    (main_text, author)
}

/// 从文本列表中提取点赞数
fn extract_likes_count(texts: &[String]) -> Option<i64> {
    for text in texts {
        // 匹配 "123" 或 "1.2万" 格式
        if text.chars().all(|c| c.is_numeric()) {
            if let Ok(n) = text.parse::<i64>() {
                return Some(n);
            }
        }
        if text.ends_with("万") {
            let num_part = text.trim_end_matches("万");
            if let Ok(n) = num_part.parse::<f64>() {
                return Some((n * 10000.0) as i64);
            }
        }
    }
    None
}

/// 回退方案：提取所有看起来像内容的文本
fn extract_all_text_content(indexer: &XmlIndexer, min_length: usize, max_count: usize) -> Vec<CommentInfo> {
    let mut comments = Vec::new();
    
    for node in &indexer.all_nodes {
        if comments.len() >= max_count {
            break;
        }
        
        let text = &node.element.text;
        if text.chars().count() >= min_length {
            // 过滤掉明显不是评论的内容
            let is_valid = !is_system_text(text);
            
            if is_valid && !comments.iter().any(|c: &CommentInfo| c.text == *text) {
                comments.push(CommentInfo {
                    text: text.clone(),
                    author: None,
                    likes: None,
                    bounds: Some(node.bounds),
                });
            }
        }
    }
    
    comments
}

/// 判断是否是系统文本（应过滤）
fn is_system_text(text: &str) -> bool {
    let system_patterns = [
        "返回", "分享", "收藏", "评论", "点赞", "关注", "取消",
        "确定", "取消", "删除", "更多", "设置", "首页", "发现",
        "消息", "我的", "发布", "拍摄", "相册",
    ];
    
    system_patterns.iter().any(|p| text == *p)
}

/// 处理通用自定义命令
pub async fn handle_custom_command(
    executor: &SmartScriptExecutor,
    step: &SmartScriptStep,
    logs: &mut Vec<String>,
) -> Result<String> {
    let command_type = step.parameters.get("command_type")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown");
    
    let params = step.parameters.get("params")
        .unwrap_or(&step.parameters);
    
    logs.push(format!("🔧 自定义命令: type='{}', params={}", command_type, params));
    
    match command_type {
        "press_key" => {
            let key = params.get("key")
                .and_then(|v| v.as_str())
                .unwrap_or("back");
            
            let key_code = match key {
                "back" => 4,
                "home" => 3,
                "menu" => 82,
                "power" => 26,
                "volume_up" => 24,
                "volume_down" => 25,
                _ => 4, // 默认返回键
            };
            
            let session = get_device_session(executor.device_id()).await?;
            session.key_event(key_code).await?;
            
            logs.push(format!("✅ 按键 {} 执行成功", key));
            Ok(format!("按键 {} 已执行", key))
        }
        _ => {
            logs.push(format!("⚠️ 未知自定义命令类型: {}", command_type));
            Ok(format!("自定义命令 {} 已记录 (未实现具体执行)", command_type))
        }
    }
}

/// 处理系统按键事件
pub async fn handle_key_event(
    executor: &SmartScriptExecutor,
    step: &SmartScriptStep,
    logs: &mut Vec<String>,
) -> Result<String> {
    let key_code = step.parameters.get("key_code")
        .and_then(|v| v.as_i64())
        .unwrap_or(4) as i32; // 默认返回键
    
    logs.push(format!("⌨️ 系统按键: keycode={}", key_code));
    
    let session = get_device_session(executor.device_id()).await?;
    session.key_event(key_code).await?;
    
    logs.push(format!("✅ 按键 {} 执行成功", key_code));
    Ok(format!("按键 {} 已执行", key_code))
}
