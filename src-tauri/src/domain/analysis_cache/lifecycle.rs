// src-tauri/src/domain/analysis_cache/lifecycle.rs
// module: analysis_cache | layer: domain | role: 引用计数与生命周期管理
// summary: 管理XML快照的引用计数，确保步骤与快照的正确生命周期关联

use anyhow::Result;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use tracing::{info, warn, debug};

use super::{SnapshotId, SNAPSHOT_REFS, DOM_CACHE, SUBTREE_CACHE};

/// 步骤与快照关联信息
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct StepSnapshotLink {
    pub step_id: String,
    pub snapshot_id: SnapshotId,
    pub linked_at: i64,
    pub description: Option<String>,
}

/// 快照引用详情
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SnapshotRefInfo {
    pub snapshot_id: SnapshotId,
    pub ref_count: usize,
    pub linked_steps: Vec<String>,
    pub created_at: i64,
    pub last_accessed: i64,
}

/// 增加快照引用计数
/// 
/// # Arguments
/// * `snapshot_id` - 快照ID
/// * `step_id` - 可选的步骤ID，用于跟踪引用来源
pub fn pin_snapshot(snapshot_id: &SnapshotId, step_id: Option<&str>) -> Result<usize> {
    let new_count = SNAPSHOT_REFS
        .entry(snapshot_id.clone())
        .and_modify(|count| *count += 1)
        .or_insert(1)
        .clone();
    
    debug!(
        snapshot_id = %snapshot_id,
        step_id = ?step_id,
        new_count = new_count,
        "Pinned snapshot reference"
    );
    
    Ok(new_count)
}

/// 减少快照引用计数
/// 
/// # Arguments  
/// * `snapshot_id` - 快照ID
/// * `step_id` - 可选的步骤ID，用于跟踪引用来源
/// * `force_remove` - 是否强制移除（即使引用计数>1）
pub fn unpin_snapshot(
    snapshot_id: &SnapshotId, 
    step_id: Option<&str>,
    force_remove: bool
) -> Result<Option<usize>> {
    let mut was_removed = false;
    let mut remaining_count = None;
    
    // 使用entry API来安全地更新引用计数
    if let Some(mut entry) = SNAPSHOT_REFS.get_mut(snapshot_id) {
        let current = *entry.value();
        if current > 1 && !force_remove {
            *entry.value_mut() = current - 1;
            remaining_count = Some(current - 1);
        } else {
            drop(entry); // 释放锁
            SNAPSHOT_REFS.remove(snapshot_id);
            was_removed = true;
        }
    }
    
    debug!(
        snapshot_id = %snapshot_id,
        step_id = ?step_id,
        remaining_count = ?remaining_count,
        force_remove = force_remove,
        was_removed = was_removed,
        "Unpinned snapshot reference"
    );
    
    // 如果引用计数归零，考虑清理相关缓存
    if was_removed {
        cleanup_unreferenced_snapshot(snapshot_id)?;
    }
    
    Ok(remaining_count)
}

/// 获取快照引用信息
pub fn get_snapshot_ref_info(snapshot_id: &SnapshotId) -> Option<SnapshotRefInfo> {
    SNAPSHOT_REFS.get(snapshot_id).map(|entry| {
        SnapshotRefInfo {
            snapshot_id: snapshot_id.clone(),
            ref_count: *entry.value(),
            linked_steps: Vec::new(), // TODO: 从manifest文件读取
            created_at: 0, // TODO: 从DOM_CACHE或磁盘读取
            last_accessed: chrono::Utc::now().timestamp(),
        }
    })
}

/// 获取所有快照引用统计
pub fn get_all_snapshot_refs() -> HashMap<SnapshotId, usize> {
    SNAPSHOT_REFS.iter().map(|entry| {
        (entry.key().clone(), *entry.value())
    }).collect()
}

/// 清理无引用的快照缓存
fn cleanup_unreferenced_snapshot(snapshot_id: &SnapshotId) -> Result<()> {
    // 从内存缓存中移除
    if let Some(removed_dom) = DOM_CACHE.remove(snapshot_id) {
        info!(
            snapshot_id = %snapshot_id,
            element_count = removed_dom.1.element_count,
            "Removed unreferenced DOM cache"
        );
    }
    
    // 清理相关子树缓存
    let keys_to_remove: Vec<_> = SUBTREE_CACHE
        .iter()
        .filter(|entry| &entry.key().0 == snapshot_id)
        .map(|entry| entry.key().clone())
        .collect();
    
    for key in keys_to_remove {
        if let Some(_removed_subtree) = SUBTREE_CACHE.remove(&key) {
            debug!(
                snapshot_id = %snapshot_id,
                xpath = %key.1,
                "Removed unreferenced subtree cache"
            );
        }
    }
    
    Ok(())
}

/// 验证缓存一致性
pub fn validate_cache_consistency() -> Result<Vec<String>> {
    let mut issues = Vec::new();
    
    // 检查DOM缓存中存在但没有引用的项
    for dom_entry in DOM_CACHE.iter() {
        let snapshot_id = dom_entry.key();
        if !SNAPSHOT_REFS.contains_key(snapshot_id) {
            issues.push(format!(
                "DOM cache contains unreferenced snapshot: {}", 
                snapshot_id
            ));
        }
    }
    
    // 检查子树缓存中的孤立项
    let mut subtree_snapshots: std::collections::HashSet<SnapshotId> = std::collections::HashSet::new();
    for subtree_entry in SUBTREE_CACHE.iter() {
        let snapshot_id = &subtree_entry.key().0;
        subtree_snapshots.insert(snapshot_id.clone());
        
        if !SNAPSHOT_REFS.contains_key(snapshot_id) && !DOM_CACHE.contains_key(snapshot_id) {
            issues.push(format!(
                "Subtree cache contains orphaned entry: {} -> {}", 
                snapshot_id, 
                subtree_entry.key().1
            ));
        }
    }
    
    info!(
        dom_cache_size = DOM_CACHE.len(),
        subtree_cache_size = SUBTREE_CACHE.len(),
        ref_count_size = SNAPSHOT_REFS.len(),
        issues_found = issues.len(),
        "Cache consistency validation completed"
    );
    
    Ok(issues)
}

/// 强制清理所有缓存（调试用）
pub fn force_clear_all_caches() -> Result<()> {
    let dom_count = DOM_CACHE.len();
    let subtree_count = SUBTREE_CACHE.len();
    let ref_count = SNAPSHOT_REFS.len();
    
    DOM_CACHE.clear();
    SUBTREE_CACHE.clear();
    SNAPSHOT_REFS.clear();
    
    warn!(
        cleared_dom = dom_count,
        cleared_subtree = subtree_count,
        cleared_refs = ref_count,
        "Force cleared all caches"
    );
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pin_unpin_lifecycle() {
        let snapshot_id = "test_snapshot_123";
        
        // 初始引用
        let count1 = pin_snapshot(&snapshot_id.to_string(), Some("step_1")).unwrap();
        assert_eq!(count1, 1);
        
        // 第二个引用
        let count2 = pin_snapshot(&snapshot_id.to_string(), Some("step_2")).unwrap();
        assert_eq!(count2, 2);
        
        // 释放一个引用
        let remaining1 = unpin_snapshot(&snapshot_id.to_string(), Some("step_1"), false).unwrap();
        assert_eq!(remaining1, Some(1));
        
        // 释放最后一个引用
        let remaining2 = unpin_snapshot(&snapshot_id.to_string(), Some("step_2"), false).unwrap();
        assert_eq!(remaining2, None);
        
        // 验证已被清理
        assert!(!SNAPSHOT_REFS.contains_key(&snapshot_id.to_string()));
    }

    #[test]
    fn test_force_remove() {
        let snapshot_id = "test_snapshot_456";
        
        // 创建多个引用
        pin_snapshot(&snapshot_id.to_string(), Some("step_1")).unwrap();
        pin_snapshot(&snapshot_id.to_string(), Some("step_2")).unwrap();
        
        // 强制移除
        let result = unpin_snapshot(&snapshot_id.to_string(), Some("step_1"), true).unwrap();
        assert_eq!(result, None);
        assert!(!SNAPSHOT_REFS.contains_key(&snapshot_id.to_string()));
    }
}