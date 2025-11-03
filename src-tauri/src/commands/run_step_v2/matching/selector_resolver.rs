// src-tauri/src/commands/run_step_v2/matching/selector_resolver.rs
// module: step-execution | layer: matching | role: 选择器解析
// summary: 按优先级解析选择器 - Inline > Store > CoordFallback > None

use super::super::types::RunStepRequestV2;

/// 选择器来源枚举
#[derive(Debug, Clone)]
pub enum SelectorSource {
    Inline,          // 内联结构化选择器
    Store,           // 从Store查询获得
    CoordFallback,   // 坐标兜底
    None,            // 无有效选择器
}

/// 选择器解析：按优先级 Inline > Store > CoordFallback > None
/// 
/// 返回: (来源, text, xpath, resource_id, class_name, content_desc)
pub async fn resolve_selector_with_priority(
    req: &RunStepRequestV2
) -> Result<(SelectorSource, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>), String> {
    // 1️⃣ 优先级1：内联结构化选择器
    if let Some(structured_selector) = req.step.get("structured_selector") {
        tracing::info!("🎯 使用内联结构化选择器");
        
        let mut text: Option<String> = None;
        let mut xpath: Option<String> = None;
        let mut resource_id: Option<String> = None;
        let mut class_name: Option<String> = None;
        let mut content_desc: Option<String> = None;
        
        if let Some(element_selectors) = structured_selector.get("elementSelectors") {
            text = element_selectors.get("text").and_then(|v| v.as_str()).map(|s| s.to_string());
            resource_id = element_selectors.get("resourceId").and_then(|v| v.as_str()).map(|s| s.to_string());
            class_name = element_selectors.get("className").and_then(|v| v.as_str()).map(|s| s.to_string());
            content_desc = element_selectors.get("contentDescription").and_then(|v| v.as_str()).map(|s| s.to_string());
            xpath = element_selectors.get("xpath").and_then(|v| v.as_str()).map(|s| s.to_string());
            
            // 🔥 检查子锚点→父执行字段
            let target_node_type = element_selectors.get("targetNodeType").and_then(|v| v.as_str()).map(|s| s.to_string());
            let anchor_xpath = element_selectors.get("anchorXpath").and_then(|v| v.as_str()).map(|s| s.to_string());
            let parent_constraint = element_selectors.get("parentConstraint").and_then(|v| v.as_str()).map(|s| s.to_string());
            let container_xpath = element_selectors.get("containerXpath").and_then(|v| v.as_str()).map(|s| s.to_string());
            let i18n_variants = element_selectors.get("i18nTextVariants")
                .and_then(|v| v.as_array())
                .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect::<Vec<String>>());
            
            // 🏗️ 如果有子锚点配置，生成子锚点→父执行XPath
            if anchor_xpath.is_some() && (target_node_type.is_some() || parent_constraint.is_some()) {
                if let Some(enhanced_xpath) = build_child_to_parent_xpath(
                    &container_xpath, &target_node_type, &parent_constraint, &anchor_xpath, &i18n_variants
                ) {
                    tracing::info!("🎯 启用子锚点→父执行模式，生成XPath: {}", enhanced_xpath);
                    xpath = Some(enhanced_xpath);
                } else {
                    tracing::warn!("⚠️ 子锚点→父执行配置不完整，降级到常规模式");
                }
            }
        }
        
        tracing::info!("📋 内联选择器: text={:?}, resourceId={:?}, className={:?}, contentDesc={:?}, xpath={:?}", 
                       text, resource_id, class_name, content_desc, xpath);
        return Ok((SelectorSource::Inline, text, xpath, resource_id, class_name, content_desc));
    }
    
    // 2️⃣ 优先级2：通过step_id/selector查询Store
    let selector_id = req.step.get("step_id").and_then(|v| v.as_str())
        .or_else(|| req.step.get("selector").and_then(|v| v.as_str()));
        
    if let Some(id) = selector_id {
        tracing::info!("🔍 通过Store查询选择器: {}", id);
        
        // 首先尝试用 step_id 查询
        let mut strategy_opt = crate::commands::intelligent_analysis::get_step_strategy(id.to_string()).await.ok().flatten();
        
        // 如果 step_id 查不到，尝试用 selector 查询（兜底）
        if strategy_opt.is_none() {
            if let Some(selector) = req.step.get("selector").and_then(|v| v.as_str()) {
                if selector != id {  // 避免重复查询
                    tracing::info!("🔄 step_id未命中，尝试用selector查询: {}", selector);
                    strategy_opt = crate::commands::intelligent_analysis::get_step_strategy(selector.to_string()).await.ok().flatten();
                }
            }
        }
        
        match strategy_opt {
            Some(strategy) => {
                tracing::info!("✅ Store命中策略候选: mode={:?}, batch={:?}", 
                              strategy.selection_mode, strategy.batch_config.is_some());
                return Ok((
                    SelectorSource::Store,
                    strategy.text.clone(),
                    strategy.xpath.clone(),
                    strategy.resource_id.clone(),
                    strategy.class_name.clone(),
                    None // content_desc暂时不支持
                ));
            }
            None => {
                tracing::warn!("⚠️ Store未找到策略: step_id={}, selector可能也未配置", id);
            }
        }
    }
    
    // 3️⃣ 优先级3：兼容旧格式直接参数
    let direct_text = req.step.get("text").and_then(|v| v.as_str()).map(|s| s.to_string());
    let direct_xpath = req.step.get("xpath").and_then(|v| v.as_str()).map(|s| s.to_string());
    let direct_resource_id = req.step.get("resourceId").and_then(|v| v.as_str()).map(|s| s.to_string());
    let direct_class = req.step.get("className").and_then(|v| v.as_str()).map(|s| s.to_string());
    
    if direct_text.is_some() || direct_xpath.is_some() || direct_resource_id.is_some() || direct_class.is_some() {
        tracing::info!("📝 使用直接参数选择器");
        return Ok((SelectorSource::Inline, direct_text, direct_xpath, direct_resource_id, direct_class, None));
    }
    
    // 4️⃣ 优先级4：坐标兜底（如果允许）
    let fallback_enabled = req.step.get("fallback_to_bounds")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
        
    if fallback_enabled && req.step.get("bounds").is_some() {
        tracing::info!("🎯 启用坐标兜底模式");
        return Ok((SelectorSource::CoordFallback, None, None, None, None, None));
    }
    
    // 5️⃣ 无有效选择器
    tracing::error!("❌ 未找到任何有效选择器");
    Ok((SelectorSource::None, None, None, None, None, None))
}

/// 构建子锚点→父执行XPath
fn build_child_to_parent_xpath(
    container_xpath: &Option<String>,
    target_node_type: &Option<String>,
    parent_constraint: &Option<String>,
    anchor_xpath: &Option<String>,
    i18n_variants: &Option<Vec<String>>,
) -> Option<String> {
    // 需要至少有anchor_xpath和一个父节点约束
    let anchor = anchor_xpath.as_ref()?;
    
    let mut xpath_parts = vec![];
    
    // 容器前缀
    if let Some(container) = container_xpath {
        xpath_parts.push(container.clone());
    } else {
        xpath_parts.push("//".to_string());
    }
    
    // 父节点类型约束
    if let Some(node_type) = target_node_type {
        xpath_parts.push(node_type.clone());
    } else if let Some(constraint) = parent_constraint {
        xpath_parts.push(constraint.clone());
    } else {
        xpath_parts.push("*".to_string()); // 任意父节点
    }
    
    // 子锚点条件
    xpath_parts.push(format!("[{}]", anchor));
    
    // I18N文本变体（可选）
    if let Some(variants) = i18n_variants {
        if !variants.is_empty() {
            let text_conditions: Vec<String> = variants.iter()
                .map(|v| format!("contains(@text, '{}')", v))
                .collect();
            xpath_parts.push(format!("[{}]", text_conditions.join(" or ")));
        }
    }
    
    Some(xpath_parts.concat())
}
