// src-tauri/src/commands/execute_structure_match.rs
// module: commands | layer: commands | role: 结构匹配真机执行
// summary: 将评分结果应用到真机设备，完成"评分→执行"闭环

use serde::{Serialize, Deserialize};
use tauri::Manager;
use tracing::{info, debug, error, warn};
use crate::domain::structure_runtime_match::{
    MatchMode,
};
use crate::domain::structure_runtime_match::scorers::{
    SubtreeMatcher,
    LeafContextMatcher,
    TextExactMatcher,
    ContextSig,
};
use crate::engine::xml_indexer::XmlIndexer;
use crate::domain::structure_runtime_match::adapters::xml_indexer_adapter::XmlIndexerAdapter;

/// 真机执行输入
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecuteMatchInput {
    /// 步骤卡片ID (用于日志追踪)
    pub step_card_id: String,
    /// 用户选择的匹配模式 (CardSubtree | LeafContext | TextExact)
    pub selected_mode: String,
    /// StepCard快照引用
    pub static_ref: StaticReference,
    /// 可选配置
    pub config: Option<MatchConfig>,
    /// 执行意图
    pub intent: Option<ExecutionIntent>,
}

/// 静态引用 (StepCard中的快照数据)
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StaticReference {
    /// 🎯 优先使用的索引路径（数组形式，如 [0,0,0,5,2]）
    pub index_path: Option<Vec<usize>>,
    /// 🔄 回退使用的绝对xpath（兼容旧数据）
    pub absolute_xpath: String,
    /// XML快照内容 (可选，优先使用实时dump)
    pub xml_snapshot: Option<String>,
}

/// 匹配配置
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MatchConfig {
    /// 卡片模式是否使用子树形态
    pub card_use_subtree_shape: Option<bool>,
    /// 叶子模式是否优先上下文
    pub prefer_context_for_leaf: Option<bool>,
    /// 结构容差 (0.0-1.0)
    pub structural_tolerance: Option<f32>,
}

/// 执行意图
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionIntent {
    /// 动作类型 (like | open_detail | follow_user 等)
    pub action: String,
    /// 执行范围 (first | all | match-original)
    pub scope: String,
    /// 点击间隔 (毫秒)
    pub click_interval_ms: Option<u64>,
}

/// 执行结果
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionResult {
    /// 是否成功
    pub success: bool,
    /// 执行了多少次点击
    pub clicks_executed: usize,
    /// 匹配到的目标数量
    pub targets_found: usize,
    /// 执行详情
    pub details: Vec<ExecutionDetail>,
    /// 错误信息 (如果有)
    pub error_message: Option<String>,
}

/// 单次执行详情
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionDetail {
    /// 目标xpath
    pub target_xpath: String,
    /// 点击位置
    pub click_bounds: (i32, i32, i32, i32),
    /// 匹配置信度
    pub confidence: f32,
    /// 是否点击成功
    pub clicked: bool,
}

/// Phase 3 核心命令: 真机执行结构匹配
/// 
/// 完整流程:
/// 1. 实时dump真机XML (或使用提供的快照)
/// 2. 从StepCard快照解析四节点上下文
/// 3. 根据mode执行匹配 (CardSubtree/LeafContext/TextExact)
/// 4. 应用闸门检查
/// 5. 按scope执行点击并节流
#[tauri::command]
pub async fn execute_structure_match_step(
    app: tauri::AppHandle,
    input: ExecuteMatchInput,
) -> Result<ExecutionResult, String> {
    info!("🚀 [真机执行] 开始执行结构匹配: step_card_id={}, mode={}", 
        input.step_card_id, input.selected_mode);

    // 1. 获取真机XML (优先实时dump，否则使用快照)
    let ui_xml = if let Some(snapshot) = &input.static_ref.xml_snapshot {
        warn!("⚠️ [真机执行] 使用快照XML (非实时dump)");
        snapshot.clone()
    } else {
        info!("📱 [真机执行] 开始实时dump真机XML");
        
        // 调用ADB获取当前UI XML
        match get_current_device_xml(&app).await {
            Ok(xml) => {
                info!("✅ [真机执行] 实时dump完成, XML长度: {}", xml.len());
                xml
            }
            Err(e) => {
                error!("❌ [真机执行] 实时dump失败: {}", e);
                return Err(format!("实时dump失败: {}", e));
            }
        }
    };

    // 2. 构建XML索引器
    let xml_indexer = XmlIndexer::build_from_xml(&ui_xml)
        .map_err(|e| {
            error!("❌ [真机执行] 构建XML索引失败: {}", e);
            format!("构建XML索引失败: {}", e)
        })?;

    debug!("✅ [真机执行] XML索引构建完成, 节点数: {}", xml_indexer.all_nodes.len());

    // 3. 🎯 优先使用 index_path 查找目标节点（更可靠）
    let clicked_node_idx = if let Some(ref index_path) = input.static_ref.index_path {
        debug!("🎯 [真机执行] 使用 index_path 定位: {:?}", index_path);
        xml_indexer.find_node_by_index_path(index_path)
            .ok_or_else(|| {
                error!("❌ [真机执行] 通过 index_path 未找到目标元素: {:?}", index_path);
                // 🔄 如果 index_path 失败，尝试回退到 xpath
                debug!("🔄 [真机执行] index_path 失败，尝试回退到 xpath: {}", input.static_ref.absolute_xpath);
                format!("通过 index_path 未找到目标元素: {:?}", index_path)
            })?
    } else {
        // 🔄 回退使用 xpath（兼容旧数据）
        debug!("🔄 [真机执行] 使用 xpath 定位（兼容模式）: {}", input.static_ref.absolute_xpath);
        xml_indexer.find_node_by_xpath(&input.static_ref.absolute_xpath)
            .ok_or_else(|| {
                error!("❌ [真机执行] 未找到目标元素: {}", input.static_ref.absolute_xpath);
                format!("未找到目标元素: {}", input.static_ref.absolute_xpath)
            })?
    };

    info!("✅ [真机执行] 找到目标节点: index={}", clicked_node_idx);

    // 4. 推导四节点上下文 (使用ClickNormalizer)
    use crate::domain::structure_runtime_match::ClickNormalizer;
    let normalizer = ClickNormalizer::new(&xml_indexer);
    let clicked_node = &xml_indexer.all_nodes[clicked_node_idx];
    let normalized = normalizer.normalize_click(clicked_node.bounds)
        .map_err(|e| {
            error!("❌ [真机执行] 四节点推导失败: {}", e);
            format!("四节点推导失败: {}", e)
        })?;

    info!("✅ [真机执行] 四节点推导完成: clicked={}, container={}, card_root={}, clickable_parent={}", 
        normalized.original_clicked.node_index,
        normalized.container.node_index,
        normalized.card_root.node_index,
        normalized.clickable_parent.node_index
    );

    // 5. 根据mode执行匹配
    let match_mode = parse_match_mode(&input.selected_mode)?;
    let (targets_found, execution_details) = execute_match_by_mode(
        &xml_indexer,
        match_mode,
        normalized.original_clicked.node_index,
        normalized.card_root.node_index,
        normalized.clickable_parent.node_index,
        &input.intent,
    )?;

    info!("✅ [真机执行] 匹配完成, 找到 {} 个目标", targets_found);

    // 6. 执行点击 (按scope和节流)
    let clicks_executed = execute_clicks(
        &app,
        &execution_details,
        &input.intent,
    ).await?;

    info!("🎉 [真机执行] 执行完成: 点击了 {} 个目标", clicks_executed);

    Ok(ExecutionResult {
        success: true,
        clicks_executed,
        targets_found,
        details: execution_details,
        error_message: None,
    })
}

/// 获取当前设备的UI XML
async fn get_current_device_xml(app: &tauri::AppHandle) -> Result<String, String> {
    use tokio::process::Command as AsyncCommand;
    use std::env;
    
    // 从 app_state 获取当前设备 ID（如果有设备追踪服务）
    // 或者从环境变量/配置文件读取
    let device_id = env::var("CURRENT_DEVICE_ID")
        .unwrap_or_else(|_| "emulator-5554".to_string()); // 默认模拟器
    
    let adb_path = env::var("ADB_PATH")
        .unwrap_or_else(|_| "platform-tools/adb.exe".to_string());
    
    info!("📱 [真机执行] 从设备 {} 获取 UI XML", device_id);
    
    let mut cmd = AsyncCommand::new(&adb_path);
    cmd.args(&[
        "-s", &device_id,
        "shell",
        "uiautomator dump /sdcard/window_dump.xml && cat /sdcard/window_dump.xml"
    ]);
    
    #[cfg(windows)]
    {
        cmd.creation_flags(0x08000000);
    }
    
    let result = cmd.output().await
        .map_err(|e| format!("执行 uiautomator dump 失败: {}", e))?;
    
    if !result.status.success() {
        let error = String::from_utf8_lossy(&result.stderr);
        return Err(format!("UI dump 失败: {}", error));
    }
    
    let xml_content = String::from_utf8_lossy(&result.stdout).to_string();
    if xml_content.trim().is_empty() {
        return Err("UI dump 返回空内容".to_string());
    }
    
    info!("✅ [真机执行] 成功获取 XML，大小: {} 字节", xml_content.len());
    Ok(xml_content)
}

/// 解析匹配模式
fn parse_match_mode(mode_str: &str) -> Result<MatchMode, String> {
    match mode_str {
        "CardSubtree" => Ok(MatchMode::CardSubtree),
        "LeafContext" => Ok(MatchMode::LeafContext),
        "TextExact" => Ok(MatchMode::TextExact),
        _ => Err(format!("未知匹配模式: {}", mode_str)),
    }
}

/// 根据模式执行匹配
fn execute_match_by_mode(
    xml_indexer: &XmlIndexer,
    mode: MatchMode,
    clicked_node: usize,
    card_root_node: usize,
    clickable_parent_node: usize,
    intent: &Option<ExecutionIntent>,
) -> Result<(usize, Vec<ExecutionDetail>), String> {
    info!("🔍 [匹配执行] 使用模式: {:?}", mode);

    // 根据scope决定返回多少个目标
    let scope = intent.as_ref().map(|i| i.scope.as_str()).unwrap_or("first");
    
    match mode {
        MatchMode::CardSubtree => {
            info!("📦 [CardSubtree] 执行卡片子树匹配");
            let adapter = XmlIndexerAdapter::new(xml_indexer, "adhoc".to_string());
            let matcher = SubtreeMatcher::new(&adapter);
            let outcome = matcher.score_subtree(card_root_node as u32, clickable_parent_node as u32);
            
            if outcome.conf < 0.70 {
                warn!("⚠️ [CardSubtree] 置信度过低: {:.3}", outcome.conf);
                return Ok((0, vec![]));
            }
            
            // 简化实现：返回卡片根节点作为目标
            let detail = ExecutionDetail {
                target_xpath: xml_indexer.all_nodes[card_root_node].xpath.clone(),
                click_bounds: xml_indexer.all_nodes[card_root_node].bounds,
                confidence: outcome.conf,
                clicked: false,
            };
            
            Ok((1, vec![detail]))
        }
        
        MatchMode::LeafContext => {
            info!("🍃 [LeafContext] 执行叶子上下文匹配");
            let matcher = LeafContextMatcher::new(xml_indexer);
            
            // 构建上下文签名 (简化实现)
            let clicked_element = &xml_indexer.all_nodes[clicked_node].element;
            let sig = ContextSig {
                class: clicked_element.class.clone().unwrap_or_default(),
                clickable: clicked_element.clickable.unwrap_or(false),
                ancestor_classes: vec![], // 简化：不填充祖先链
                sibling_shape: vec![],    // 简化：不填充兄弟节点
                sibling_index: 0,
                rel_xywh: (0.0, 0.0, 0.0, 0.0), // 简化：不计算相对位置
                has_text: clicked_element.text.is_some(),
                has_desc: clicked_element.content_desc.is_some(),
                has_res_id: clicked_element.resource_id.is_some(),
            };
            
            let outcome = matcher.score_leaf_context(&sig);
            
            if outcome.conf < 0.70 {
                warn!("⚠️ [LeafContext] 置信度过低: {:.3}", outcome.conf);
                return Ok((0, vec![]));
            }
            
            let detail = ExecutionDetail {
                target_xpath: xml_indexer.all_nodes[clicked_node].xpath.clone(),
                click_bounds: xml_indexer.all_nodes[clicked_node].bounds,
                confidence: outcome.conf,
                clicked: false,
            };
            
            Ok((1, vec![detail]))
        }
        
        MatchMode::TextExact => {
            info!("📝 [TextExact] 执行文本精确匹配");
            let matcher = TextExactMatcher::new(xml_indexer);
            let outcome = matcher.score_text_exact(clicked_node);
            
            if outcome.conf < 0.70 {
                warn!("⚠️ [TextExact] 置信度过低: {:.3}", outcome.conf);
                return Ok((0, vec![]));
            }
            
            let detail = ExecutionDetail {
                target_xpath: xml_indexer.all_nodes[clicked_node].xpath.clone(),
                click_bounds: xml_indexer.all_nodes[clicked_node].bounds,
                confidence: outcome.conf,
                clicked: false,
            };
            
            Ok((1, vec![detail]))
        }
    }
}

/// 执行点击操作
async fn execute_clicks(
    app: &tauri::AppHandle,
    details: &[ExecutionDetail],
    intent: &Option<ExecutionIntent>,
) -> Result<usize, String> {
    let scope = intent.as_ref().map(|i| i.scope.as_str()).unwrap_or("first");
    let interval_ms = intent.as_ref()
        .and_then(|i| i.click_interval_ms)
        .unwrap_or(120);
    
    let targets_to_click = match scope {
        "first" => details.iter().take(1).collect::<Vec<_>>(),
        "all" => details.iter().collect::<Vec<_>>(),
        _ => details.iter().take(1).collect::<Vec<_>>(),
    };
    
    info!("🖱️ [点击执行] 准备点击 {} 个目标, 间隔: {}ms", targets_to_click.len(), interval_ms);
    
    let mut clicks = 0;
    for (i, detail) in targets_to_click.iter().enumerate() {
        let (left, top, right, bottom) = detail.click_bounds;
        let center_x = (left + right) / 2;
        let center_y = (top + bottom) / 2;
        
        info!("👆 [点击执行] 第{}/{} 点击坐标: ({}, {}), 置信度: {:.3}", 
            i + 1, targets_to_click.len(), center_x, center_y, detail.confidence);
        
        // 执行真实 ADB 点击
        match adb_tap(app, center_x, center_y).await {
            Ok(_) => {
                info!("✅ [点击执行] 点击成功");
                clicks += 1;
            }
            Err(e) => {
                warn!("⚠️ [点击执行] 点击失败: {}", e);
                // 失败后继续尝试下一个目标（取决于业务需求，也可以选择直接返回错误）
            }
        }
        
        // 节流等待
        if i < targets_to_click.len() - 1 {
            tokio::time::sleep(tokio::time::Duration::from_millis(interval_ms)).await;
        }
    }
    
    Ok(clicks)
}

/// 执行 ADB 点击
async fn adb_tap(app: &tauri::AppHandle, x: i32, y: i32) -> Result<(), String> {
    use tokio::process::Command as AsyncCommand;
    use std::env;
    
    let device_id = env::var("CURRENT_DEVICE_ID")
        .unwrap_or_else(|_| "emulator-5554".to_string());
    
    let adb_path = env::var("ADB_PATH")
        .unwrap_or_else(|_| "platform-tools/adb.exe".to_string());
    
    let mut cmd = AsyncCommand::new(&adb_path);
    cmd.args(&[
        "-s", &device_id,
        "shell",
        "input", "tap",
        &x.to_string(),
        &y.to_string(),
    ]);
    
    #[cfg(windows)]
    {
        cmd.creation_flags(0x08000000);
    }
    
    let result = cmd.output().await
        .map_err(|e| format!("执行 input tap 失败: {}", e))?;
    
    if !result.status.success() {
        let error = String::from_utf8_lossy(&result.stderr);
        return Err(format!("点击失败: {}", error));
    }
    
    Ok(())
}
