// src-tauri/src/services/commands/static_test.rs
// module: services | layer: application | role: 静态策略测试命令
// summary: 基于固定定位器（id/xpath/bounds）执行测试

use serde::{Deserialize, Serialize};
use tracing::{error, info};

use crate::services::adb::get_device_session;

/// 静态定位器类型
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LocatorType {
    ResourceId,
    Xpath,
    Bounds,
    Text,
}

/// 静态定位器
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StaticLocator {
    pub by: LocatorType,
    pub value: String,
}

/// 静态策略测试规格
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StaticStrategyTestSpec {
    /// 动作类型：tap/input/swipe/wait
    pub action: String,
    /// 静态定位器
    pub locator: StaticLocator,
    /// 额外参数（如 input 的文本、swipe 的方向等）
    #[serde(default)]
    pub params: serde_json::Value,
    /// 是否为 dryrun 模式（仅验证定位器，不执行动作）
    #[serde(default)]
    pub dryrun: bool,
}

/// 静态策略测试结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StaticStrategyTestResult {
    pub success: bool,
    /// 置信度（0..1）：元素可见性、唯一性等
    pub confidence: f64,
    pub executed: bool,
    pub message: String,
    pub duration_ms: u64,
    pub element_info: Option<ElementInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementInfo {
    pub bounds: String,
    pub text: String,
    pub resource_id: String,
    pub class: String,
    pub clickable: bool,
}

/// 执行静态策略测试
#[tauri::command]
pub async fn execute_static_strategy_test(
    device_id: String,
    spec: StaticStrategyTestSpec,
) -> Result<StaticStrategyTestResult, String> {
    info!(
        "🎯 收到静态策略测试请求: 设备={}, 动作={}, 定位器={:?}",
        device_id, spec.action, spec.locator
    );

    let start_time = std::time::Instant::now();

    // 1. 验证定位器：查找元素并评估置信度
    let (element_info, confidence) = match locate_element(&device_id, &spec.locator).await {
        Ok(info) => info,
        Err(e) => {
            error!("❌ 定位器验证失败: {}", e);
            return Ok(StaticStrategyTestResult {
                success: false,
                confidence: 0.0,
                executed: false,
                message: format!("定位器验证失败: {}", e),
                duration_ms: start_time.elapsed().as_millis() as u64,
                element_info: None,
            });
        }
    };

    info!("📍 元素定位成功: {:?}, 置信度: {:.2}", element_info, confidence);

    // 2. 如果是 dryrun 模式，直接返回
    if spec.dryrun {
        info!("🔍 Dryrun 模式：仅验证定位器，不执行动作");
        return Ok(StaticStrategyTestResult {
            success: true,
            confidence,
            executed: false,
            message: format!("Dryrun 模式：元素定位成功，置信度 {:.2}", confidence),
            duration_ms: start_time.elapsed().as_millis() as u64,
            element_info: Some(element_info),
        });
    }

    // 3. 执行动作
    let execution_result = match execute_action(&device_id, &spec.action, &element_info, &spec.params).await {
        Ok(msg) => {
            info!("✅ 动作执行成功: {}", msg);
            (true, msg)
        }
        Err(e) => {
            error!("❌ 动作执行失败: {}", e);
            (false, format!("动作执行失败: {}", e))
        }
    };

    let duration = start_time.elapsed().as_millis() as u64;

    Ok(StaticStrategyTestResult {
        success: execution_result.0,
        confidence,
        executed: true,
        message: execution_result.1,
        duration_ms: duration,
        element_info: Some(element_info),
    })
}

/// 定位元素并评估置信度
async fn locate_element(
    device_id: &str,
    locator: &StaticLocator,
) -> Result<(ElementInfo, f64), String> {
    let session = get_device_session(device_id)
        .await
        .map_err(|e| format!("获取设备会话失败: {}", e))?;

    // 获取 UI 层次结构
    let ui_dump = session
        .execute_command("uiautomator dump /sdcard/window_dump.xml && cat /sdcard/window_dump.xml")
        .await
        .map_err(|e| format!("获取 UI dump 失败: {}", e))?;

    // 根据定位器类型查找元素
    let element_info = match &locator.by {
        LocatorType::ResourceId => find_by_resource_id(&ui_dump, &locator.value)?,
        LocatorType::Xpath => find_by_xpath(&ui_dump, &locator.value)?,
        LocatorType::Bounds => find_by_bounds(&ui_dump, &locator.value)?,
        LocatorType::Text => find_by_text(&ui_dump, &locator.value)?,
    };

    // 评估置信度：基于元素可见性、可点击性、唯一性
    let confidence = calculate_confidence(&element_info, &ui_dump, locator);

    Ok((element_info, confidence))
}

/// 根据 resource-id 查找元素
fn find_by_resource_id(ui_dump: &str, resource_id: &str) -> Result<ElementInfo, String> {
    // 简化实现：解析 XML 查找匹配的 resource-id
    if let Some(start) = ui_dump.find(&format!("resource-id=\"{}\"", resource_id)) {
        let node = extract_node_at_position(ui_dump, start);
        return parse_element_info(&node);
    }
    Err(format!("未找到 resource-id='{}' 的元素", resource_id))
}

/// 根据 XPath 查找元素（简化实现）
fn find_by_xpath(ui_dump: &str, xpath: &str) -> Result<ElementInfo, String> {
    // TODO: 集成完整的 XPath 解析器
    // 当前简化为文本匹配
    Err("XPath 查找暂未完全实现".to_string())
}

/// 根据 bounds 查找元素
fn find_by_bounds(ui_dump: &str, bounds: &str) -> Result<ElementInfo, String> {
    if let Some(start) = ui_dump.find(&format!("bounds=\"{}\"", bounds)) {
        let node = extract_node_at_position(ui_dump, start);
        return parse_element_info(&node);
    }
    Err(format!("未找到 bounds='{}' 的元素", bounds))
}

/// 根据 text 查找元素
fn find_by_text(ui_dump: &str, text: &str) -> Result<ElementInfo, String> {
    if let Some(start) = ui_dump.find(&format!("text=\"{}\"", text)) {
        let node = extract_node_at_position(ui_dump, start);
        return parse_element_info(&node);
    }
    Err(format!("未找到 text='{}' 的元素", text))
}

/// 提取指定位置的 XML 节点
fn extract_node_at_position(xml: &str, pos: usize) -> String {
    let start = xml[..pos].rfind('<').unwrap_or(0);
    let end = xml[pos..].find('>').map(|i| pos + i + 1).unwrap_or(xml.len());
    xml[start..end].to_string()
}

/// 解析元素信息
fn parse_element_info(node: &str) -> Result<ElementInfo, String> {
    let bounds = extract_attribute(node, "bounds").unwrap_or_default();
    let text = extract_attribute(node, "text").unwrap_or_default();
    let resource_id = extract_attribute(node, "resource-id").unwrap_or_default();
    let class = extract_attribute(node, "class").unwrap_or_default();
    let clickable = extract_attribute(node, "clickable").unwrap_or("false".to_string()) == "true";

    Ok(ElementInfo {
        bounds,
        text,
        resource_id,
        class,
        clickable,
    })
}

/// 提取 XML 属性值
fn extract_attribute(node: &str, attr: &str) -> Option<String> {
    let pattern = format!("{}=\"", attr);
    let start = node.find(&pattern)? + pattern.len();
    let end = node[start..].find('"')? + start;
    Some(node[start..end].to_string())
}

/// 计算置信度
fn calculate_confidence(element: &ElementInfo, ui_dump: &str, locator: &StaticLocator) -> f64 {
    let mut confidence = 0.5_f64; // 基础分

    // 元素可点击 +0.2
    if element.clickable {
        confidence += 0.2;
    }

    // bounds 非空 +0.1
    if !element.bounds.is_empty() {
        confidence += 0.1;
    }

    // resource-id 唯一性检查 +0.2
    if matches!(locator.by, LocatorType::ResourceId) {
        let count = ui_dump.matches(&format!("resource-id=\"{}\"", locator.value)).count();
        if count == 1 {
            confidence += 0.2;
        }
    }

    confidence.min(1.0)
}

/// 执行动作
async fn execute_action(
    device_id: &str,
    action: &str,
    element: &ElementInfo,
    params: &serde_json::Value,
) -> Result<String, String> {
    let session = get_device_session(device_id)
        .await
        .map_err(|e| format!("获取设备会话失败: {}", e))?;

    match action {
        "tap" => {
            // 解析 bounds 获取中心点
            let (x, y) = parse_bounds_center(&element.bounds)?;
            let command = format!("input tap {} {}", x, y);
            session
                .execute_command(&command)
                .await
                .map_err(|e| format!("点击失败: {}", e))?;
            Ok(format!("点击成功: ({}, {})", x, y))
        }
        "input" => {
            let text = params
                .get("text")
                .and_then(|v| v.as_str())
                .ok_or("缺少 input 参数: text")?;
            let (x, y) = parse_bounds_center(&element.bounds)?;
            // 先点击聚焦，再输入
            session
                .execute_command(&format!("input tap {} {}", x, y))
                .await
                .map_err(|e| format!("聚焦失败: {}", e))?;
            tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
            session
                .execute_command(&format!("input text '{}'", text))
                .await
                .map_err(|e| format!("输入失败: {}", e))?;
            Ok(format!("输入成功: {}", text))
        }
        _ => Err(format!("不支持的动作类型: {}", action)),
    }
}

/// 解析 bounds 字符串获取中心点
fn parse_bounds_center(bounds: &str) -> Result<(i32, i32), String> {
    // bounds 格式: "[left,top][right,bottom]"
    let coords: Vec<i32> = bounds
        .trim_matches(|c| c == '[' || c == ']')
        .split("][")
        .flat_map(|part| part.split(','))
        .filter_map(|s| s.parse().ok())
        .collect();

    if coords.len() == 4 {
        let x = (coords[0] + coords[2]) / 2;
        let y = (coords[1] + coords[3]) / 2;
        Ok((x, y))
    } else {
        Err(format!("无法解析 bounds: {}", bounds))
    }
}

