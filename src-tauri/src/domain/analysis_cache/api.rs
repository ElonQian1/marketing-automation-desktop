// src-tauri/src/domain/analysis_cache/api.rs
// module: analysis_cache | layer: domain | role: api
// summary: 缓存操作API，统一的计算入口

use super::{DOM_CACHE, SUBTREE_CACHE, SnapshotId, SubtreeKey, DomIndex, SubtreeMetrics};
use xxhash_rust::xxh3::xxh3_64;
use anyhow::Result;

/// 注册XML快照，返回SnapshotId
pub fn register_snapshot(xml_content: &str) -> SnapshotId {
    let snapshot_id = generate_snapshot_id(xml_content);
    
    // 如果已存在则直接返回
    if DOM_CACHE.contains_key(&snapshot_id) {
        return snapshot_id;
    }
    
    // 创建并缓存DOM索引
    let dom_index = DomIndex::new(xml_content.to_string());
    DOM_CACHE.insert(snapshot_id.clone(), dom_index);
    
    tracing::info!("注册XML快照: snapshot_id={}, 元素数量={}", 
                  snapshot_id, xml_content.matches('<').count());
    
    snapshot_id
}

/// 获取DOM索引
pub fn get_dom(snapshot_id: &SnapshotId) -> Option<DomIndex> {
    DOM_CACHE.get(snapshot_id).map(|v| v.clone())
}

/// 获取或计算子树指标（核心缓存逻辑）
pub fn get_or_compute_subtree(snapshot_id: &SnapshotId, abs_xpath: &str) -> Result<SubtreeMetrics> {
    let key: SubtreeKey = (snapshot_id.clone(), abs_xpath.to_string());
    
    // 尝试缓存命中
    if let Some(cached) = SUBTREE_CACHE.get(&key) {
        tracing::debug!("子树指标缓存命中: xpath={}", abs_xpath);
        return Ok(cached.clone());
    }
    
    // 缓存未命中，需要计算
    tracing::info!("计算子树指标: snapshot_id={}, xpath={}", snapshot_id, abs_xpath);
    
    let dom = get_dom(snapshot_id)
        .ok_or_else(|| anyhow::anyhow!("未找到快照: {}", snapshot_id))?;
    
    let metrics = compute_subtree_metrics(&dom, abs_xpath)?;
    
    // 缓存结果
    SUBTREE_CACHE.insert(key, metrics.clone());
    
    Ok(metrics)
}

/// 尝试获取缓存的子树指标（不触发计算）
pub fn try_get_subtree(snapshot_id: &SnapshotId, abs_xpath: &str) -> Option<SubtreeMetrics> {
    let key: SubtreeKey = (snapshot_id.clone(), abs_xpath.to_string());
    SUBTREE_CACHE.get(&key).map(|v| v.clone())
}

/// 生成快照ID（基于XML内容哈希）
fn generate_snapshot_id(xml_content: &str) -> SnapshotId {
    let hash = xxh3_64(xml_content.as_bytes());
    format!("snap_{:016x}", hash)
}

/// 实际计算子树指标的函数
fn compute_subtree_metrics(dom: &DomIndex, abs_xpath: &str) -> Result<SubtreeMetrics> {
    // TODO: 集成现有的策略引擎和结构匹配逻辑
    // 目前返回基础实现，后续替换为实际的分析逻辑
    
    let mut metrics = SubtreeMetrics::new(abs_xpath.to_string());
    
    // 模拟从XML中提取元素信息
    if let Some(extracted) = extract_element_from_xml(&dom.xml_content, abs_xpath) {
        // 计算评分 (在移动字段之前)
        let uniqueness_score = calculate_uniqueness_score(&extracted);
        let stability_score = calculate_stability_score(&extracted);
        let suggested_strategy = suggest_strategy(&extracted);
        let available_fields = get_available_fields(&extracted);
        
        // 设置所有字段
        metrics.element_text = extracted.text;
        metrics.element_type = extracted.element_type;
        metrics.resource_id = extracted.resource_id;
        metrics.class_name = extracted.class_name;
        metrics.content_desc = extracted.content_desc;
        metrics.bounds = extracted.bounds;
        metrics.uniqueness_score = uniqueness_score;
        metrics.stability_score = stability_score;
        metrics.confidence = (uniqueness_score + stability_score) / 2.0;
        metrics.suggested_strategy = suggested_strategy;
        metrics.available_fields = available_fields;
    }
    
    tracing::debug!("计算完成: 策略={}, 置信度={:.2}", 
                   metrics.suggested_strategy, metrics.confidence);
    
    Ok(metrics)
}

/// 临时的元素信息结构
#[derive(Debug)]
struct ExtractedElement {
    text: Option<String>,
    element_type: Option<String>,
    resource_id: Option<String>,
    class_name: Option<String>,
    content_desc: Option<String>,
    bounds: Option<String>,
}

/// 从XML中提取元素信息（临时实现）
fn extract_element_from_xml(xml_content: &str, abs_xpath: &str) -> Option<ExtractedElement> {
    // TODO: 集成现有的XML解析逻辑
    // 目前返回模拟数据
    Some(ExtractedElement {
        text: Some("示例文本".to_string()),
        element_type: Some("android.widget.Button".to_string()),
        resource_id: Some("com.example:id/button".to_string()),
        class_name: Some("android.widget.Button".to_string()),
        content_desc: Some("按钮描述".to_string()),
        bounds: Some("[100,200][300,250]".to_string()),
    })
}

/// 计算唯一性评分
fn calculate_uniqueness_score(element: &ExtractedElement) -> f32 {
    let mut score: f32 = 0.0;
    
    if element.resource_id.is_some() { score += 0.4; }
    if element.content_desc.is_some() { score += 0.3; }
    if element.text.is_some() { score += 0.2; }
    if element.class_name.is_some() { score += 0.1; }
    
    score.min(1.0)
}

/// 计算稳定性评分
fn calculate_stability_score(element: &ExtractedElement) -> f32 {
    let mut score: f32 = 0.0;
    
    // resource-id和content-desc更稳定
    if element.resource_id.is_some() { score += 0.5; }
    if element.content_desc.is_some() { score += 0.3; }
    
    // 文本可能变化，评分较低
    if element.text.is_some() { score += 0.2; }
    
    score.min(1.0)
}

/// 推荐匹配策略
fn suggest_strategy(element: &ExtractedElement) -> String {
    if element.resource_id.is_some() {
        "self_anchor".to_string()
    } else if element.text.is_some() {
        "child_driven".to_string()
    } else if element.content_desc.is_some() {
        "content_desc".to_string()
    } else {
        "structure_match".to_string()
    }
}

/// 获取可用字段列表
fn get_available_fields(element: &ExtractedElement) -> Vec<String> {
    let mut fields = Vec::new();
    
    if element.resource_id.is_some() { fields.push("resource_id".to_string()); }
    if element.content_desc.is_some() { fields.push("content_desc".to_string()); }
    if element.text.is_some() { fields.push("text".to_string()); }
    if element.class_name.is_some() { fields.push("class_name".to_string()); }
    if element.bounds.is_some() { fields.push("bounds".to_string()); }
    
    fields
}