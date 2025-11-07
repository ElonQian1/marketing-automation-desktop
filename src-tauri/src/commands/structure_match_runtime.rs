// src-tauri/src/commands/structure_match_runtime.rs
// module: commands | layer: application | role: 结构匹配运行时命令
// summary: Tauri命令层 - 将结构匹配算法暴露给前端

use crate::domain::structure_runtime_match::{
    sm_run_once, SmConfig, SmResult, XmlIndexerAdapter,
};
use crate::engine::xml_indexer::XmlIndexer;
use serde::{Deserialize, Serialize};

/// 前端请求参数
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SmMatchRequest {
    /// XML内容（UI Dump）
    pub xml_content: String,
    
    /// 配置参数
    pub config: SmConfigDTO,
    
    /// 可选：容器提示
    pub container_hint: Option<String>,
}

/// 前端配置DTO（Data Transfer Object）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SmConfigDTO {
    /// 匹配模式：speed / default / robust
    pub mode: String,
    
    /// 骨架规则DSL（可选）
    pub skeleton_rules: Option<String>,
    
    /// 字段规则（可选）
    pub field_rules: Option<Vec<FieldRuleDTO>>,
    
    /// 早停开关
    pub early_stop_enabled: Option<bool>,
}

/// 字段规则DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FieldRuleDTO {
    /// 字段名（如 "title", "price" 等）
    pub field_name: String,
    
    /// 期望值（可选）
    pub expected: Option<String>,
    
    /// 正则表达式（可选）
    pub regex: Option<String>,
}

/// 前端响应DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SmMatchResponse {
    /// 是否成功
    pub success: bool,
    
    /// 错误信息（如果失败）
    pub error: Option<String>,
    
    /// 匹配结果（如果成功）
    pub result: Option<SmResultDTO>,
    
    /// 耗时（毫秒）
    pub elapsed_ms: u64,
}

/// 结构匹配结果DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SmResultDTO {
    /// 容器节点ID
    pub container_id: u32,
    
    /// 布局类型
    pub layout_type: String,
    
    /// 匹配到的元素列表
    pub items: Vec<SmItemDTO>,
    
    /// 匹配分数
    pub score: f32,
}

/// 单个匹配元素DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SmItemDTO {
    /// 节点ID
    pub node_id: u32,
    
    /// 匹配分数
    pub score: f32,
    
    /// 边界坐标
    pub bounds: SmBoundsDTO,
}

/// 边界坐标DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SmBoundsDTO {
    pub left: i32,
    pub top: i32,
    pub right: i32,
    pub bottom: i32,
}

/// Tauri命令：执行结构匹配
#[tauri::command]
pub async fn sm_match_once(request: SmMatchRequest) -> Result<SmMatchResponse, String> {
    let start_time = std::time::Instant::now();
    
    // 1. 构建XmlIndexer
    let indexer = XmlIndexer::build_from_xml(&request.xml_content)
        .map_err(|e| format!("Failed to build XmlIndexer: {}", e))?;
    
    // 2. 计算XML哈希（简化版：使用内容长度）
    let xml_hash = format!("hash_{}", request.xml_content.len());
    
    // 3. 创建适配器
    let adapter = XmlIndexerAdapter::new(&indexer, xml_hash);
    
    // 🔥 4. 【新增】调用容器限域模块，自动识别容器
    use crate::domain::structure_runtime_match::container_gate::{
        resolve_container_scope, ContainerHints, ContainerConfig
    };
    
    // 从前端传来的 container_hint 提取提示信息
    let container_hints = if let Some(hint_str) = &request.container_hint {
        tracing::info!("🎯 [SM Runtime] 收到容器提示: {}", hint_str);
        
        // 尝试解析 JSON 格式的 hints
        match serde_json::from_str::<serde_json::Value>(hint_str) {
            Ok(hints_json) => {
                let selected_element_id = hints_json
                    .get("selected_element_id")
                    .and_then(|v| v.as_str())
                    .and_then(|s| s.parse::<u32>().ok());
                
                let selected_element_bounds = hints_json
                    .get("selected_element_bounds")
                    .and_then(|v| v.as_array())
                    .and_then(|arr| {
                        if arr.len() == 4 {
                            Some(crate::domain::structure_runtime_match::container_gate::types::Bounds {
                                l: arr[0].as_i64()? as i32,
                                t: arr[1].as_i64()? as i32,
                                r: arr[2].as_i64()? as i32,
                                b: arr[3].as_i64()? as i32,
                            })
                        } else {
                            None
                        }
                    });
                
                tracing::info!(
                    "✅ [SM Runtime] 解析hints成功: element_id={:?}, bounds={:?}",
                    selected_element_id,
                    selected_element_bounds
                );
                
                ContainerHints {
                    container_xpath: None,
                    bounds: selected_element_bounds,
                    ancestor_sign_chain: Vec::new(),
                }
            }
            Err(e) => {
                tracing::warn!("⚠️ [SM Runtime] 解析hints失败: {}, 使用空hints", e);
                ContainerHints::default()
            }
        }
    } else {
        ContainerHints::default()
    };
    
    // 调用容器限域模块（4个参数：tree, anchor, hints, config）
    // anchor 设为根节点0，让容器限域模块从根开始搜索
    let container_scope_result = resolve_container_scope(
        &adapter,
        0,  // anchor: 从根节点开始搜索
        &container_hints,
        &ContainerConfig::default()
    );
    
    let container_id = match container_scope_result {
        Ok(container_scope) => {
            tracing::info!(
                "�️ [SM Runtime] 容器限域完成: container_id={}, reason={}, confidence={:.2}",
                container_scope.root_id,
                container_scope.reason,
                container_scope.confidence
            );
            
            // 如果容器是根节点(id=0)，记录警告
            if container_scope.root_id == 0 {
                tracing::warn!(
                    "⚠️ [SM Runtime] 容器限域返回根节点(id=0)，可能范围过大！reason={}",
                    container_scope.reason
                );
            }
            
            Some(container_scope.root_id)
        }
        Err(e) => {
            tracing::warn!("⚠️ [SM Runtime] 容器限域失败: {}, 使用全局搜索", e);
            None
        }
    };
    
    // 5. 转换前端配置为SmConfig
    let config = convert_config_dto(request.config)?;
    
    // 6. 创建NoopCache（因为我们暂时不缓存）
    use crate::domain::structure_runtime_match::ports::cache::NoopCache;
    let mut cache = NoopCache;
    
    // 7. 执行匹配算法
    // 注意：当前 sm_run_once 内部会自动调用 pick_container()
    // TODO: 未来可以修改 sm_run_once 签名，直接传入 container_id 以避免重复检测
    if let Some(cid) = container_id {
        tracing::info!(
            "🎯 [SM Runtime] 将使用容器 {} 进行匹配（当前版本内部会重新检测）",
            cid
        );
    }
    
    let result = sm_run_once(&adapter, &mut cache, &config, false);
    
    // 8. 转换结果为DTO
    let result_dto = convert_result_to_dto(result);
    
    let elapsed_ms = start_time.elapsed().as_millis() as u64;
    
    Ok(SmMatchResponse {
        success: true,
        error: None,
        result: Some(result_dto),
        elapsed_ms,
    })
}

/// 转换前端配置为内部SmConfig
fn convert_config_dto(dto: SmConfigDTO) -> Result<SmConfig, String> {
    use crate::domain::structure_runtime_match::{SmMode, SkeletonRules, FieldRule, FieldRules};
    
    // 解析模式
    let mode = match dto.mode.as_str() {
        "speed" => SmMode::Speed,
        "default" => SmMode::Default,
        "robust" => SmMode::Robust,
        _ => return Err(format!("Invalid mode: {}", dto.mode)),
    };
    
    // 🚀 关键修复：解析前端传来的skeleton_rules
    let skeleton_rules = if let Some(skeleton_rules_str) = &dto.skeleton_rules {
        tracing::info!("🔧 [SmConfig] 解析前端skeleton_rules: {}", skeleton_rules_str);
        
        // 尝试解析JSON格式的skeleton规则
        match serde_json::from_str::<serde_json::Value>(skeleton_rules_str) {
            Ok(skeleton_json) => {
                if let Some(skeleton_array) = skeleton_json.as_array() {
                    tracing::info!("✅ [SmConfig] 成功解析到 {} 个skeleton规则", skeleton_array.len());
                    
                    // 📝 TODO: 这里需要根据实际的skeleton结构来设置规则
                    // 当前暂用默认值，但会在后续迭代中完善
                    SkeletonRules {
                        require_image_above_text: false, // 放宽限制
                        allow_depth_flex: 2, // 增加深度弹性
                    }
                } else {
                    tracing::warn!("⚠️ [SmConfig] skeleton_rules不是数组格式，使用默认规则");
                    SkeletonRules {
                        require_image_above_text: false,
                        allow_depth_flex: 1,
                    }
                }
            }
            Err(e) => {
                tracing::warn!("⚠️ [SmConfig] 解析skeleton_rules失败: {}, 使用默认规则", e);
                SkeletonRules {
                    require_image_above_text: false,
                    allow_depth_flex: 1,
                }
            }
        }
    } else {
        tracing::info!("🔧 [SmConfig] 无skeleton_rules，使用默认配置");
        SkeletonRules {
            require_image_above_text: true,
            allow_depth_flex: 1,
        }
    };
    
    // 解析字段规则（简化版：暂不支持）
    let field_rules = FieldRules::default();
    
    Ok(SmConfig {
        mode,
        allowed_layouts: None,
        skip_geometry: false,
        skip_template_when_single: false,
        strict_skeleton_only: false,
        min_confidence: 0.70,
        container_hint: None,
        skeleton_rules,
        field_rules,
    })
}

/// 转换内部SmResult为前端DTO
fn convert_result_to_dto(result: SmResult) -> SmResultDTO {
    // 提取容器信息
    let (container_id, layout_type) = if let Some(container) = result.container {
        (
            container.node as u32,
            format!("{:?}", container.layout),
        )
    } else {
        (0, "Unknown".to_string())
    };
    
    // 转换匹配项
    let items: Vec<SmItemDTO> = result
        .items
        .into_iter()
        .map(|item| SmItemDTO {
            node_id: item.node as u32,
            score: item.scores.total,
            bounds: SmBoundsDTO {
                left: item.bounds.left,
                top: item.bounds.top,
                right: item.bounds.right,
                bottom: item.bounds.bottom,
            },
        })
        .collect();
    
    // 计算平均得分
    let avg_score = if items.is_empty() {
        0.0
    } else {
        items.iter().map(|i| i.score).sum::<f32>() / items.len() as f32
    };
    
    SmResultDTO {
        container_id,
        layout_type,
        items,
        score: avg_score,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_convert_config_dto() {
        let dto = SmConfigDTO {
            mode: "default".to_string(),
            skeleton_rules: Some("class=TextView".to_string()),
            field_rules: Some(vec![
                FieldRuleDTO {
                    field_name: "title".to_string(),
                    expected: Some("测试".to_string()),
                    regex: None,
                },
            ]),
            early_stop_enabled: Some(true),
        };

        let config = convert_config_dto(dto).unwrap();
        assert!(matches!(config.mode, crate::domain::structure_runtime_match::SmMode::Default));
        assert!(config.skeleton_rules.is_some());
        assert!(config.field_rules.is_some());
    }
}
