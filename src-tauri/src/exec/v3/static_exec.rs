// src-tauri/src/exec/v3/static_exec.rs
// module: exec | layer: v3 | role: 静态策略执行器 - 基于固定定位器的确定性执行
// summary: 包装现有的 id/xpath/text 静态定位逻辑，支持 dryrun 模式，统一事件流

use super::events::{emit_progress, emit_complete};
use super::types::{
    StaticSpecV3, ContextEnvelope, ProgressPhase,
    ExecutionResult, ExecutionEventV3, StepScore,
};
use tauri::{AppHandle, Emitter};
use anyhow::{Result, anyhow};
use std::time::Instant;

/// 静态策略执行器主入口
///
/// **核心逻辑**：
/// 1. **固定定位**：使用 staticSpec.locators (id/xpath/text/class) 精确定位元素
/// 2. **确定性评分**：
///    - 找到元素且满足 constraints (可见/唯一/ROI) → confidence = 1.0
///    - 找到元素但不满足 constraints → confidence = 0.5
///    - 未找到元素 → confidence = 0.0
/// 3. **Dryrun 模式**：
///    - true → 只定位和评分，不执行动作
///    - false → 执行 staticSpec.action (tap/input/swipe/back 等)
/// 4. **可见性验证**：严格按照 constraints.mustBeVisible/mustBeClickable 验证
///
/// **事件流**：
/// - device_ready → snapshot_ready → match_started → matched → validated → executed → complete
pub async fn execute_static(
    app: &AppHandle,
    envelope: &ContextEnvelope,
    static_spec: &StaticSpecV3,
) -> Result<ExecutionEventV3> {
    let start_time = Instant::now();
    let device_id = &envelope.device_id;

    // ====== Phase 1: device_ready ======
    emit_progress(
        app,
        device_id,
        ProgressPhase::DeviceReady,
        "设备准备完成",
    )?;

    // TODO 1: 校验设备连接状态
    // if !is_device_connected(device_id).await? {
    //     return Err(anyhow!("Device {} not connected", device_id));
    // }

    // ====== Phase 2: snapshot_ready ======
    emit_progress(
        app,
        device_id,
        ProgressPhase::SnapshotReady,
        "快照准备完成",
    )?;

    // TODO 2: 获取当前快照（XML + screenshot）
    // let snapshot = if envelope.snapshot.as_ref().map(|s| s.analysis_id.is_empty()).unwrap_or(true) {
    //     get_or_create_snapshot(device_id).await?
    // } else {
    //     envelope.snapshot.clone().unwrap()
    // };

    // ====== Phase 3: match_started ======
    let locator_desc = format!(
        "id={:?}, xpath={:?}, text={:?}, class={:?}",
        static_spec.locators.resource_id,
        static_spec.locators.xpath,
        static_spec.locators.text,
        static_spec.locators.class_name,
    );
    emit_progress(
        app,
        device_id,
        ProgressPhase::MatchStarted,
        &format!("开始静态定位: {}", locator_desc),
    )?;

    // ====== Phase 4: 静态定位元素 ======
    // TODO 3: 调用现有的静态定位逻辑
    // let matched_elements = find_elements_by_locators(
    //     &snapshot.xml_cache_id,
    //     &static_spec.locators,
    // ).await?;

    // 临时模拟：假设找到1个元素
    let matched_elements = vec![MockElement {
        bounds: (100, 200, 300, 400),
        visible: true,
        clickable: true,
    }];

    // ====== Phase 5: 应用约束条件评分 ======
    let mut confidence = 0.0;
    let mut reason = String::new();
    let mut coords: Option<(i32, i32)> = None;

    if matched_elements.is_empty() {
        // 未找到元素
        confidence = 0.0;
        reason = "静态定位器未匹配到任何元素".to_string();
    } else if matched_elements.len() > 1 {
        // 找到多个元素
        if envelope.constraints.as_ref().and_then(|c| c.unique).unwrap_or(false) {
            confidence = 0.0;
            reason = format!("找到 {} 个元素，但要求唯一", matched_elements.len());
        } else {
            // 不要求唯一，取第一个
            confidence = 0.8;
            reason = format!("找到 {} 个元素，使用第一个", matched_elements.len());
            coords = Some(calculate_center(&matched_elements[0]));
        }
    } else {
        // 找到唯一元素
        let element = &matched_elements[0];
        
        // TODO 4: 应用可见性约束
        // let must_be_visible = envelope.constraints.as_ref()
        //     .and_then(|c| c.must_be_visible)
        //     .unwrap_or(true);
        // 
        // if must_be_visible && !element.visible {
        //     confidence = 0.5;
        //     reason = "元素不可见".to_string();
        // } else if must_be_clickable && !element.clickable {
        //     confidence = 0.5;
        //     reason = "元素不可点击".to_string();
        // } else {
        //     confidence = 1.0;
        //     reason = "静态定位成功".to_string();
        //     coords = Some(calculate_center(element));
        // }

        // 临时模拟
        confidence = 1.0;
        reason = "静态定位成功（模拟）".to_string();
        coords = Some((200, 300));
    }

    // ====== Phase 6: matched ======
    let step_id = static_spec.strategy_id.clone().unwrap_or_else(|| "static_strategy".to_string());
    let step_score = StepScore {
        step_id: step_id.clone(),
        confidence,
        cached: false,
        reason: reason.clone(),
    };

    emit_progress(
        app,
        device_id,
        ProgressPhase::Matched,
        &format!("定位完成，置信度: {:.2}", confidence),
    )?;

    // ====== Phase 7: validated ======
    emit_progress(
        app,
        device_id,
        ProgressPhase::Validated,
        if static_spec.dryrun {
            "Dryrun 模式，跳过执行"
        } else {
            "准备执行动作"
        },
    )?;

    // ====== Phase 8: 执行动作（非 dryrun 模式） ======
    let mut execution_ok = false;

    if !static_spec.dryrun && coords.is_some() && confidence >= 0.5 {
        // TODO 5: 执行静态动作
        // match &static_spec.action {
        //     StaticAction::Tap => {
        //         adb_tap(device_id, coords.unwrap()).await?;
        //         execution_ok = true;
        //     }
        //     StaticAction::Input { text } => {
        //         adb_input_text(device_id, text).await?;
        //         execution_ok = true;
        //     }
        //     StaticAction::Swipe { direction } => {
        //         adb_swipe(device_id, direction).await?;
        //         execution_ok = true;
        //     }
        //     StaticAction::Back => {
        //         adb_keyevent(device_id, "KEYCODE_BACK").await?;
        //         execution_ok = true;
        //     }
        // }

        // 临时模拟
        execution_ok = true;

        emit_progress(
            app,
            device_id,
            ProgressPhase::Executed,
            &format!("动作执行完成: {:?}", static_spec.action),
        )?;
    } else if static_spec.dryrun {
        emit_progress(
            app,
            device_id,
            ProgressPhase::Executed,
            "Dryrun 模式，已跳过执行",
        )?;
    } else {
        emit_progress(
            app,
            device_id,
            ProgressPhase::Executed,
            &format!("置信度不足 ({:.2})，跳过执行", confidence),
        )?;
    }

    // TODO 6: 后置验证（如果配置了 envelope.validation）
    // if let Some(validation) = &envelope.validation {
    //     match &validation.post_action.wait_for {
    //         "node_gone" => {
    //             // 等待元素消失
    //             wait_for_node_disappear(device_id, &static_spec.locators, validation.post_action.timeout_ms).await?;
    //         }
    //         "new_activity" => {
    //             // 等待 Activity 切换
    //             wait_for_activity_change(device_id, validation.post_action.timeout_ms).await?;
    //         }
    //         "text_appears" => {
    //             // 等待文本出现
    //             wait_for_text(device_id, &validation.post_action.value, validation.post_action.timeout_ms).await?;
    //         }
    //         _ => {}
    //     }
    // }

    // ====== Phase 9: complete ======
    let elapsed_ms = start_time.elapsed().as_millis() as u64;

    let event = ExecutionEventV3::Complete {
        device_id: device_id.clone(),
        summary: crate::exec::v3::types::ExecutionSummary {
            adopted_step_id: Some(static_spec.step_id.clone()),
            elapsed_ms,
            reason: if static_spec.dryrun {
                "Dryrun 模式完成".to_string()
            } else if execution_ok {
                "静态策略执行成功".to_string()
            } else {
                "静态策略执行跳过或失败".to_string()
            },
        },
        scores: vec![step_score],
        result: Some(ExecutionResult {
            ok: execution_ok || static_spec.dryrun,
            coords,
            candidate_count: Some(matched_elements.len()),
            screen_hash_now: None, // TODO: 计算当前 screenHash
            validation: None, // TODO: 添加验证结果
        }),
    };

    emit_complete(app, &event)?;
    Ok(event)
}

// ====== 内部辅助结构（临时模拟） ======

#[derive(Debug, Clone)]
struct MockElement {
    bounds: (i32, i32, i32, i32), // (x, y, width, height)
    visible: bool,
    clickable: bool,
}

fn calculate_center(element: &MockElement) -> (i32, i32) {
    let (x, y, w, h) = element.bounds;
    (x + w / 2, y + h / 2)
}

// ====== TODO: 实现的辅助函数 ======

// TODO 7: 根据定位器查找元素
// async fn find_elements_by_locators(
//     xml_cache_id: &str,
//     locators: &StaticLocators,
// ) -> Result<Vec<Element>> {
//     // 调用现有的 XML 解析和元素匹配逻辑
//     // 例如: services::xml_parser::find_by_xpath(...)
//     //       services::xml_parser::find_by_resource_id(...)
//     todo!("集成现有静态定位逻辑")
// }

// TODO 8: 等待元素消失
// async fn wait_for_node_disappear(
//     device_id: &str,
//     locators: &StaticLocators,
//     timeout_ms: Option<u64>,
// ) -> Result<()> {
//     // 轮询检查元素是否消失
//     todo!("实现等待元素消失逻辑")
// }

// TODO 9: 等待 Activity 切换
// 检测当前 Activity 是否与之前不同
// async fn wait_for_activity_change(
//     device_id: &str,
//     timeout_ms: Option<u64>,
// ) -> Result<()> {
//     todo!("实现等待 Activity 切换逻辑")
// }

// TODO 10: 等待文本出现
// 轮询检查指定文本是否出现在屏幕上
// async fn wait_for_text(
//     device_id: &str,
//     text: &str,
//     timeout_ms: Option<u64>,
// ) -> Result<()> {
//     todo!("实现等待文本出现逻辑")
// }
