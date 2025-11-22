// 手动测试智能分析集成 - 避免编译器问题
use employee_gui::exec::chain_engine::{should_trigger_intelligent_analysis, perform_intelligent_strategy_analysis};
use employee_gui::exec::types::{StepRefOrInline, InlineStep, SingleStepAction, QualitySettings, OcrMode};

fn main() {
    println!("🚀 开始智能分析集成测试...");

    // 测试1：空候选列表应该触发智能分析
    test_empty_candidates();
    
    // 测试2：低置信度候选应该触发智能分析  
    test_low_confidence();
    
    // 测试3：高置信度候选不应该触发智能分析
    test_high_confidence();
    
    // 测试4：智能分析执行功能
    test_intelligent_analysis();
    
    println!("✅ 所有测试完成！");
}

fn test_empty_candidates() {
    println!("📋 测试1：空候选列表触发");
    
    let candidates: Vec<StepRefOrInline> = vec![];
    let quality = QualitySettings {
        ocr: Some(OcrMode::Auto),
        text_lang: Some("zh-CN".to_string()),
        normalize: None,
        n_candidates: Some(5),
        signal_weights: None,
    };
    
    let result = should_trigger_intelligent_analysis(&candidates, &quality);
    if result {
        println!("  ✅ 空候选正确触发智能分析");
    } else {
        println!("  ❌ 空候选应该触发智能分析");
    }
}

fn test_low_confidence() {
    println!("📋 测试2：低置信度候选触发");
    
    let candidates = vec![
        StepRefOrInline {
            r#ref: None,
            inline: Some(InlineStep {
                step_id: "low_confidence".to_string(),
                action: SingleStepAction::Tap,
                params: serde_json::json!({
                    "confidence": 0.3, // 低于阈值0.7
                    "xpath": "//*[@text='test']"
                }),
            })
        }
    ];
    
    let quality = QualitySettings {
        ocr: Some(OcrMode::Auto),
        text_lang: Some("zh-CN".to_string()),
        normalize: None,
        n_candidates: Some(5),
        signal_weights: None,
    };
    
    let result = should_trigger_intelligent_analysis(&candidates, &quality);
    if result {
        println!("  ✅ 低置信度候选正确触发智能分析");
    } else {
        println!("  ❌ 低置信度候选应该触发智能分析");
    }
}

fn test_high_confidence() {
    println!("📋 测试3：高置信度候选不触发");
    
    let candidates = vec![
        StepRefOrInline {
            r#ref: None,
            inline: Some(InlineStep {
                step_id: "high_confidence".to_string(),
                action: SingleStepAction::Tap,
                params: serde_json::json!({
                    "confidence": 0.9, // 高于阈值0.7
                    "xpath": "//*[@text='test']"
                }),
            })
        }
    ];
    
    let quality = QualitySettings {
        ocr: Some(OcrMode::Auto),
        text_lang: Some("zh-CN".to_string()),
        normalize: None,
        n_candidates: Some(5),
        signal_weights: None,
    };
    
    let result = should_trigger_intelligent_analysis(&candidates, &quality);
    if !result {
        println!("  ✅ 高置信度候选正确不触发智能分析");
    } else {
        println!("  ❌ 高置信度候选不应该触发智能分析");
    }
}

#[tokio::main]
async fn test_intelligent_analysis() {
    println!("📋 测试4：智能分析执行");
    
    let device_id = "test_device";
    let target_element_info = Some("//*[@text='test_button']");
    let ui_xml = r#"<node index="0" text="test_button" class="android.widget.Button" clickable="true" bounds="[100,200][300,250]" />"#;
    
    match perform_intelligent_strategy_analysis(device_id, target_element_info, ui_xml).await {
        Ok(recommended_steps) => {
            if !recommended_steps.is_empty() {
                println!("  ✅ 智能分析成功返回 {} 个推荐步骤", recommended_steps.len());
                for (i, step) in recommended_steps.iter().enumerate() {
                    match step {
                        StepRefOrInline { r#ref: Some(ref_id), inline: None } => {
                            println!("    步骤 {}: 引用步骤 ID = {}", i+1, ref_id);
                        }
                        StepRefOrInline { r#ref: None, inline: Some(inline) } => {
                            println!("    步骤 {}: 内联步骤 ID = {}, 动作 = {:?}", 
                                    i+1, inline.step_id, inline.action);
                        }
                        _ => {
                            println!("    步骤 {}: 未知格式", i+1);
                        }
                    }
                }
            } else {
                println!("  ❌ 智能分析返回空结果");
            }
        }
        Err(e) => {
            println!("  ❌ 智能分析失败: {}", e);
        }
    }
}