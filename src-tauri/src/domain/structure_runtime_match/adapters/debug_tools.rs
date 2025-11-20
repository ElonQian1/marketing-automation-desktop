// src-tauri/src/domain/structure_runtime_match/adapters/debug_tools.rs
// module: structure_runtime_match | layer: domain | role: 诊断工具
// summary: 用于诊断父子关系构建问题的调试工具

use crate::domain::structure_runtime_match::adapters::xml_indexer_adapter::XmlIndexerAdapter;
use crate::domain::structure_runtime_match::types::SmNodeId;
use crate::domain::structure_runtime_match::container_gate::types::UiTree;
use std::collections::HashSet;

/// 全树父链一致性巡检
/// 
/// 检查除root外每个节点是否都有父节点，是否存在自环
pub fn validate_parent_links(adapter: &XmlIndexerAdapter, root: SmNodeId) {
    let n = adapter.node_count();
    let mut missing_parent = 0usize;
    let mut self_parent = 0usize;

    tracing::info!("🔍 [PARENT-CHK] 开始全树父链一致性检查: nodes={} root={}", n, root);

    for id in 0..(n as SmNodeId) {
        if id == root { 
            tracing::trace!("  [PARENT-CHK] 跳过root节点: node={}", id);
            continue; 
        }
        
        match adapter.parent(id) {
            None => {
                missing_parent += 1;
                if let Some(node) = adapter.get_node(id) {
                    tracing::warn!(
                        "⚠️ [PARENT-CHK] node={} 无父节点: class={:?} rid={:?} bounds={:?}",
                        id, 
                        node.element.class_name.as_deref(),
                        node.element.resource_id.as_deref(),
                        node.bounds
                    );
                } else {
                    tracing::warn!("⚠️ [PARENT-CHK] node={} 无父节点且节点不存在", id);
                }
            }
            Some(p) if p == id => {
                self_parent += 1;
                if let Some(node) = adapter.get_node(id) {
                    tracing::warn!(
                        "⚠️ [PARENT-CHK] node={} 父指向自己(循环): class={:?} rid={:?} bounds={:?}",
                        id,
                        node.element.class_name.as_deref(),
                        node.element.resource_id.as_deref(),
                        node.bounds
                    );
                } else {
                    tracing::warn!("⚠️ [PARENT-CHK] node={} 父指向自己且节点不存在", id);
                }
            }
            Some(p) => {
                tracing::trace!("  ✓ [PARENT-CHK] node={} 有父节点: parent={}", id, p);
            }
        }
    }

    if missing_parent == 0 && self_parent == 0 {
        tracing::info!("✅ [PARENT-CHK] 父链一致性通过: nodes={} root={}", n, root);
    } else {
        tracing::error!(
            "❌ [PARENT-CHK] 父链异常: missing_parent={} self_parent={} total_nodes={}",
            missing_parent, self_parent, n
        );
    }
}

/// 打印节点的完整祖先链
/// 
/// 从指定节点开始，沿着父链向上爬，直到root或检测到异常
pub fn debug_parent_chain(adapter: &XmlIndexerAdapter, start: SmNodeId) {
    let mut seen = HashSet::new();
    let mut cur = start;
    let mut hop = 0usize;

    tracing::info!("🔗 [CHAIN] ========== 从 node={} 开始打印祖先链 ==========", start);
    
    loop {
        // 循环检测
        if !seen.insert(cur) {
            tracing::error!("❌ [CHAIN] 检测到自环/循环: node={}", cur);
            break;
        }
        
        // 获取节点信息
        if let Some(node) = adapter.get_node(cur) {
            // Note: UIElement 没有 scrollable 字段，通过 UiTree trait 方法获取
            tracing::info!(
                "  [CHAIN] hop={} node={} class={:?} rid={:?} clickable={} bounds={:?}",
                hop,
                cur,
                node.element.class_name.as_deref().unwrap_or("N/A"),
                node.element.resource_id.as_deref().unwrap_or("N/A"),
                node.element.clickable,
                node.bounds
            );
        } else {
            tracing::error!("❌ [CHAIN] hop={} node={} 节点不存在！", hop, cur);
            break;
        }
        
        // 查找父节点
        match adapter.parent(cur) {
            Some(p) => {
                cur = p;
                hop += 1;
                
                // 防止异常深度
                if hop > 128 {
                    tracing::warn!("⚠️ [CHAIN] 祖先超过 128 层，提前终止");
                    break;
                }
            }
            None => {
                if hop == 0 {
                    tracing::error!(
                        "❌ [CHAIN] node={} 无父节点！若非root，则是构树/映射问题",
                        cur
                    );
                } else {
                    tracing::info!(
                        "✅ [CHAIN] node={} 无父节点，应该是root节点（总共爬了{}层）",
                        cur, hop
                    );
                }
                break;
            }
        }
    }
    
    tracing::info!("🔗 [CHAIN] ========== 祖先链打印完成 ==========");
}

/// 打印节点详细信息（用于快速诊断）
pub fn debug_node_info(adapter: &XmlIndexerAdapter, node_id: SmNodeId) {
    tracing::info!("📋 [NODE-INFO] ========== node={} 详细信息 ==========", node_id);
    
    if let Some(node) = adapter.get_node(node_id) {
        tracing::info!("  class: {:?}", node.element.class_name);
        tracing::info!("  resource-id: {:?}", node.element.resource_id);
        tracing::info!("  text: {:?}", node.element.text);
        tracing::info!("  content-desc: {:?}", node.element.content_desc);
        tracing::info!("  clickable: {:?}", node.element.clickable);
        tracing::info!("  enabled: {:?}", node.element.enabled);
        tracing::info!("  bounds: {:?}", node.bounds);
        tracing::info!("  xpath: {}", node.xpath);
        tracing::info!("  parent_xpath: {:?}", node.parent_xpath);
        tracing::info!("  container_xpath: {:?}", node.container_xpath);
        
        // 检查父节点
        match adapter.parent(node_id) {
            Some(parent_id) => {
                tracing::info!("  parent: Some({})", parent_id);
                if let Some(parent_node) = adapter.get_node(parent_id) {
                    tracing::info!("    parent.class_name: {:?}", parent_node.element.class_name);
                    tracing::info!("    parent.bounds: {:?}", parent_node.bounds);
                }
            }
            None => {
                tracing::info!("  parent: None");
            }
        }
    } else {
        tracing::error!("❌ [NODE-INFO] node={} 不存在！", node_id);
    }
    
    tracing::info!("📋 [NODE-INFO] ========== 信息打印完成 ==========");
}

