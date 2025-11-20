// src-tauri/src/commands/click_normalizer_test.rs
// module: commands | layer: application | role: 点击规范化测试命令
// summary: 测试点击规范化功能，验证重叠层回收和容器限域

use crate::domain::structure_runtime_match::{ClickNormalizer, ClickNormalizeResult};
use crate::engine::xml_indexer::XmlIndexer;
use serde::{Deserialize, Serialize};
use tauri::command;

/// 点击规范化测试请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClickNormalizeRequest {
    /// XML内容（UI Dump）
    pub xml_content: String,
    
    /// 点击的bounds
    pub clicked_bounds: (i32, i32, i32, i32),
}

/// 点击规范化测试响应
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClickNormalizeResponse {
    /// 是否成功
    pub success: bool,
    
    /// 错误信息（如果失败）
    pub error: Option<String>,
    
    /// 规范化结果
    pub result: Option<ClickNormalizeResultDTO>,
}

/// 规范化结果DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClickNormalizeResultDTO {
    /// 容器信息
    pub container: NodeInfoDTO,
    
    /// 卡片根信息
    pub card_root: NodeInfoDTO,
    
    /// 可点父信息
    pub clickable_parent: NodeInfoDTO,
    
    /// 原始点击节点信息
    pub original_clicked: NodeInfoDTO,
    
    /// 列信息
    pub column_info: ColumnInfoDTO,
}

/// 节点信息DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NodeInfoDTO {
    /// 节点索引
    pub node_index: usize,
    
    /// 类名
    pub class_name: Option<String>,
    
    /// 文本内容
    pub text: Option<String>,
    
    /// content-desc
    pub content_desc: Option<String>,
    
    /// resource-id
    pub resource_id: Option<String>,
    
    /// 是否可点击
    pub clickable: Option<bool>,
    
    /// bounds
    pub bounds: (i32, i32, i32, i32),
    
    /// XPath
    pub xpath: String,
}

/// 列信息DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ColumnInfoDTO {
    /// 列类型：left/right/unknown
    pub column: String,
    
    /// 在列内的位置
    pub position_in_column: usize,
    
    /// 同列卡片总数
    pub column_card_count: usize,
}

/// 🎯 主测试命令：点击规范化
#[command]
pub async fn test_click_normalization(request: ClickNormalizeRequest) -> ClickNormalizeResponse {
    tracing::info!("🔄 [TestCommand] 开始点击规范化测试: bounds={:?}", request.clicked_bounds);
    
    match test_click_normalization_impl(&request).await {
        Ok(result) => {
            tracing::info!("✅ [TestCommand] 点击规范化测试成功");
            ClickNormalizeResponse {
                success: true,
                error: None,
                result: Some(result),
            }
        }
        Err(e) => {
            tracing::error!("❌ [TestCommand] 点击规范化测试失败: {}", e);
            ClickNormalizeResponse {
                success: false,
                error: Some(e.to_string()),
                result: None,
            }
        }
    }
}

async fn test_click_normalization_impl(request: &ClickNormalizeRequest) -> anyhow::Result<ClickNormalizeResultDTO> {
    // 1. 构建XML索引
    tracing::info!("🔧 [TestCommand] 构建XML索引...");
    let xml_indexer = XmlIndexer::build_from_xml(&request.xml_content)?;
    tracing::info!("✅ [TestCommand] XML索引构建完成，共 {} 个节点", xml_indexer.all_nodes.len());

    // 2. 创建点击规范化器
    let normalizer = ClickNormalizer::new(&xml_indexer);

    // 3. 执行点击规范化
    tracing::info!("🎯 [TestCommand] 执行点击规范化...");
    let result = normalizer.normalize_click(request.clicked_bounds)?;

    // 4. 转换为DTO
    let dto = convert_to_dto(result)?;
    
    tracing::info!("🎊 [TestCommand] 点击规范化完成:");
    tracing::info!("   - 容器: {} ({})", 
                  dto.container.class_name.as_deref().unwrap_or("Unknown"), 
                  dto.container.node_index);
    tracing::info!("   - 卡片根: {} ({})", 
                  dto.card_root.content_desc.as_deref().unwrap_or("No desc"), 
                  dto.card_root.node_index);
    tracing::info!("   - 可点父: {} ({})", 
                  dto.clickable_parent.class_name.as_deref().unwrap_or("Unknown"), 
                  dto.clickable_parent.node_index);
    tracing::info!("   - 列位置: {} - 第{}个/共{}个", 
                  dto.column_info.column, 
                  dto.column_info.position_in_column + 1, 
                  dto.column_info.column_card_count);

    Ok(dto)
}

/// 转换规范化结果为DTO
fn convert_to_dto(result: ClickNormalizeResult) -> anyhow::Result<ClickNormalizeResultDTO> {
    Ok(ClickNormalizeResultDTO {
        container: convert_node_to_dto(result.container),
        card_root: convert_node_to_dto(result.card_root),
        clickable_parent: convert_node_to_dto(result.clickable_parent),
        original_clicked: convert_node_to_dto(result.original_clicked),
        column_info: ColumnInfoDTO {
            column: match result.column_info.column {
                crate::domain::structure_runtime_match::WaterfallColumn::Left => "left".to_string(),
                crate::domain::structure_runtime_match::WaterfallColumn::Right => "right".to_string(),
                crate::domain::structure_runtime_match::WaterfallColumn::Unknown => "unknown".to_string(),
            },
            position_in_column: result.column_info.position_in_column,
            column_card_count: result.column_info.column_card_count,
        },
    })
}

/// 转换节点为DTO
fn convert_node_to_dto(node: crate::domain::structure_runtime_match::NormalizedNode) -> NodeInfoDTO {
    NodeInfoDTO {
        node_index: node.node_index,
        class_name: node.element.class_name,
        text: Some(node.element.text),
        content_desc: Some(node.element.content_desc),
        resource_id: node.element.resource_id,
        clickable: Some(node.element.clickable),
        bounds: node.bounds,
        xpath: node.xpath,
    }
}

/// 🔍 辅助命令：分析XML结构（用于调试）
#[command]
pub async fn analyze_xml_structure(xml_content: String) -> AnalyzeResponse {
    tracing::info!("🔍 [TestCommand] 开始分析XML结构");
    
    match analyze_xml_structure_impl(&xml_content).await {
        Ok(result) => {
            tracing::info!("✅ [TestCommand] XML结构分析完成");
            AnalyzeResponse {
                success: true,
                error: None,
                result: Some(result),
            }
        }
        Err(e) => {
            tracing::error!("❌ [TestCommand] XML结构分析失败: {}", e);
            AnalyzeResponse {
                success: false,
                error: Some(e.to_string()),
                result: None,
            }
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyzeResponse {
    pub success: bool,
    pub error: Option<String>,
    pub result: Option<AnalyzeResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyzeResult {
    /// 总节点数
    pub total_nodes: usize,
    
    /// 容器候选节点
    pub container_candidates: Vec<NodeInfoDTO>,
    
    /// 卡片根候选节点
    pub card_root_candidates: Vec<NodeInfoDTO>,
    
    /// 可点击节点统计
    pub clickable_stats: ClickableStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClickableStats {
    /// 可点击节点总数
    pub total_clickable: usize,
    
    /// 可点击FrameLayout数量
    pub clickable_framelayouts: usize,
    
    /// 不可点击但有content-desc的FrameLayout数量
    pub desc_framelayouts: usize,
}

async fn analyze_xml_structure_impl(xml_content: &str) -> anyhow::Result<AnalyzeResult> {
    // 构建XML索引
    let xml_indexer = XmlIndexer::build_from_xml(xml_content)?;
    let normalizer = ClickNormalizer::new(&xml_indexer);
    
    let mut container_candidates = Vec::new();
    let mut card_root_candidates = Vec::new();
    let mut clickable_count = 0;
    let mut clickable_framelayout_count = 0;
    let mut desc_framelayout_count = 0;
    
    // 遍历所有节点进行分析
    for (index, indexed_node) in xml_indexer.all_nodes.iter().enumerate() {
        let element = &indexed_node.element;
        
        // 统计可点击节点
        if element.clickable {
            clickable_count += 1;
            
            if let Some(class) = &element.class_name {
                if class.ends_with("FrameLayout") {
                    clickable_framelayout_count += 1;
                }
            }
        }
        
        // 统计有content-desc的不可点击FrameLayout
        if !element.clickable {
            if let Some(class) = &element.class_name {
                if class.ends_with("FrameLayout") && !element.content_desc.is_empty() {
                    desc_framelayout_count += 1;
                }
            }
        }
        
        // 检查是否是容器候选
        if normalizer.is_scroll_container(element) {
            container_candidates.push(convert_node_to_dto(
                crate::domain::structure_runtime_match::NormalizedNode {
                    node_index: index,
                    element: element.clone(),
                    bounds: indexed_node.bounds,
                    xpath: indexed_node.xpath.clone(),
                }
            ));
        }
        
        // 检查是否是卡片根候选
        if normalizer.is_card_root_candidate(element) {
            card_root_candidates.push(convert_node_to_dto(
                crate::domain::structure_runtime_match::NormalizedNode {
                    node_index: index,
                    element: element.clone(),
                    bounds: indexed_node.bounds,
                    xpath: indexed_node.xpath.clone(),
                }
            ));
        }
    }
    
    // 按面积排序容器候选节点（大的在前）
    container_candidates.sort_by(|a, b| {
        let area_a = (a.bounds.2 - a.bounds.0) * (a.bounds.3 - a.bounds.1);
        let area_b = (b.bounds.2 - b.bounds.0) * (b.bounds.3 - b.bounds.1);
        area_b.cmp(&area_a)
    });
    
    // 按top位置排序卡片根候选节点
    card_root_candidates.sort_by_key(|node| node.bounds.1);
    
    Ok(AnalyzeResult {
        total_nodes: xml_indexer.all_nodes.len(),
        container_candidates,
        card_root_candidates,
        clickable_stats: ClickableStats {
            total_clickable: clickable_count,
            clickable_framelayouts: clickable_framelayout_count,
            desc_framelayouts: desc_framelayout_count,
        },
    })
}
