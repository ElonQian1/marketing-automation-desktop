// src-tauri/src/exec/v3/helpers/xml_source_resolver.rs
// module: exec | layer: helpers | role: XML数据源三级降级解析
// summary: 统一解析XML数据源：全局XmlIndexer → 步骤卡片xmlSnapshot → 实时设备XML

use tauri::AppHandle;
use super::super::types::ContextEnvelope;

/// 📋 XML 数据源三级降级策略
///
/// **优先级：**
/// 1. 🥇 **步骤卡片 xmlSnapshot**（跨机器执行）- 携带完整快照，最可靠
/// 2. � **实时设备 XML**（标准流程）- 获取当前界面状态
/// 3. 🥉 **降级失败**（无法执行）- 返回错误
///
/// 注意：全局 XmlIndexer 只是解析缓存，不存储原始XML。
/// 实际执行时总是需要获取当前设备状态（可能已经跳转了）。
///
/// # Arguments
/// * `app` - Tauri应用句柄
/// * `envelope` - 执行上下文，包含 device_id 和 snapshot 信息
///
/// # Returns
/// * `Ok(String)` - 成功解析的 XML 字符串
/// * `Err(String)` - 解析失败的错误信息
pub async fn resolve_xml_source(
    _app: &AppHandle,
    envelope: &ContextEnvelope,
) -> Result<String, String> {
    // 🥇 第一优先级：步骤卡片 xmlSnapshot（跨机器执行场景）
    if let Some(xml_content) = &envelope.snapshot.xml_content {
        if !xml_content.is_empty() {
            tracing::info!(
                "✅ [XML数据源] 使用步骤卡片 xmlSnapshot (跨机器执行模式) | device_id: {} | xml_cache_id: {:?} | XML长度: {} bytes",
                envelope.device_id,
                envelope.snapshot.xml_cache_id,
                xml_content.len()
            );
            return Ok(xml_content.clone());
        } else {
            tracing::warn!(
                "⚠️ [XML数据源] xmlSnapshot 为空字符串，降级到实时设备XML | device_id: {}",
                envelope.device_id
            );
        }
    } else {
        tracing::info!(
            "ℹ️ [XML数据源] xmlSnapshot 未提供，使用实时设备XML (本地执行模式) | device_id: {}",
            envelope.device_id
        );
    }

    // 🥈 第二优先级：实时从设备读取 XML（标准执行流程）
    tracing::info!(
        "� [XML数据源] 降级策略启动：从实时设备读取XML | device_id: {}",
        envelope.device_id
    );

    // 使用现有的 device_manager 模块获取实时 XML
    use super::device_manager;
    match device_manager::get_ui_snapshot(&envelope.device_id).await {
        Ok(xml) => {
            tracing::info!(
                "✅ [XML数据源] 成功读取实时设备XML | device_id: {} | XML长度: {} bytes",
                envelope.device_id,
                xml.len()
            );
            Ok(xml)
        }
        Err(e) => {
            tracing::error!(
                "❌ [XML数据源] 所有数据源均失败 | device_id: {} | 错误: {}",
                envelope.device_id,
                e
            );
            Err(format!(
                "无法获取 XML 数据源 - xmlSnapshot为空, 设备读取失败: {}",
                e
            ))
        }
    }
}

/// 🔍 获取当前使用的 XML 数据源类型（用于日志/调试）
pub fn get_xml_source_type(_app: &AppHandle, envelope: &ContextEnvelope) -> &'static str {
    if envelope.snapshot.xml_content.is_some() {
        "StepCardSnapshot"
    } else {
        "RealtimeDevice"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_xml_source_priority() {
        // 测试三级降级逻辑的优先级
        // 注意：这里只测试逻辑，实际 Tauri 环境需要集成测试
    }
}
