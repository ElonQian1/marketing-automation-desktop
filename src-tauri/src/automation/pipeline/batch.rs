// src-tauri/src/automation/pipeline/batch.rs
// module: automation | layer: pipeline | role: 批量执行器
// summary: 处理批量操作模式 (batch_mode="all")

use anyhow::Result;
use serde_json::Value;
use crate::services::universal_ui_page_analyzer::UIElement;
use crate::automation::matching::utils::calculate_center;

/// 执行批量模式
/// 
/// 遍历所有候选元素并执行点击操作
pub async fn execute_batch_mode(
    device_id: &str,
    candidates: Vec<&UIElement>,
    params: &Value,
    step_id: &str,
) -> Result<(i32, i32)> {
    tracing::info!("🔄 [Batch] 开始批量执行，共 {} 个候选", candidates.len());
    
    let mut success_count = 0;
    let total = candidates.len();
    
    for (i, candidate) in candidates.iter().enumerate() {
        tracing::info!("🔄 [Batch] 处理候选 {}/{}", i + 1, total);
        
        let (x, y) = calculate_center(candidate);
        
        // 执行点击
        if let Err(e) = crate::automation::actions::tap::execute_tap(device_id, x, y).await {
            tracing::error!("❌ [Batch] 候选 {} 点击失败: {}", i, e);
        } else {
            success_count += 1;
        }
        
        // 等待间隔 (默认1000ms)
        let interval = params.get("batch_config")
            .and_then(|c| c.get("interval_ms"))
            .and_then(|v| v.as_u64())
            .unwrap_or(1000);
            
        tokio::time::sleep(tokio::time::Duration::from_millis(interval)).await;
    }
    
    if success_count > 0 {
        // 批量模式返回虚拟坐标 (0,0)
        Ok((0, 0))
    } else {
        Err(anyhow::anyhow!("批量执行失败: 0/{} 成功", total))
    }
}
