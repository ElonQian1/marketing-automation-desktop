#[cfg(test)]
mod tests {
    // 使用正确的包名和类型
    use employee_gui::exec::helpers::analysis_helpers::should_trigger_intelligent_analysis;
    use employee_gui::exec::types::{StepRefOrInline, InlineStep, SingleStepAction};
    
    #[test]
    fn test_should_trigger_analysis_empty_candidates() {
        // 测试1：空候选列表应该触发智能分析
        use employee_gui::exec::types::QualitySettings;
        
        let candidates: Vec<StepRefOrInline> = vec![];
        let quality = QualitySettings {
            ocr: Some(employee_gui::exec::types::OcrMode::Auto),
            text_lang: Some("zh-CN".to_string()),
            normalize: None,
            n_candidates: Some(5),
            signal_weights: None,
        };
        
        let result = should_trigger_intelligent_analysis(&candidates, &quality);
        assert!(result, "Empty candidates should trigger intelligent analysis");
    }
    
    #[test]
    fn test_should_trigger_analysis_low_confidence() {
        // 测试2：低置信度候选应该触发智能分析
        use employee_gui::exec::types::QualitySettings;
        
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
            ocr: Some(employee_gui::exec::types::OcrMode::Auto),
            text_lang: Some("zh-CN".to_string()),
            normalize: None,
            n_candidates: Some(5),
            signal_weights: None,
        };
        
        let result = should_trigger_intelligent_analysis(&candidates, &quality);
        assert!(result, "Low confidence candidates should trigger intelligent analysis");
    }
    
    #[test]
    fn test_should_not_trigger_analysis_high_confidence() {
        // 测试3：高置信度候选不应该触发智能分析
        use employee_gui::exec::types::QualitySettings;
        
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
            ocr: Some(employee_gui::exec::types::OcrMode::Auto),
            text_lang: Some("zh-CN".to_string()),
            normalize: None,
            n_candidates: Some(5),
            signal_weights: None,
        };
        
        let result = should_trigger_intelligent_analysis(&candidates, &quality);
        assert!(!result, "High confidence candidates should not trigger intelligent analysis");
    }
    
    // #[tokio::test]
    // async fn test_perform_intelligent_analysis() {
    //     // 测试4：智能分析执行应该返回模拟结果
    //     let device_id = "test_device";
    //     let target_element_info = Some("//*[@text='test_button']");
    //     let ui_xml = r#"<node index="0" text="test_button" class="android.widget.Button" clickable="true" bounds="[100,200][300,250]" />"#;
        
    //     let result = perform_intelligent_strategy_analysis(device_id, target_element_info, ui_xml).await;
        
    //     match result {
    //         Ok(recommended_steps) => {
    //             assert!(!recommended_steps.is_empty(), "Should return recommended steps");
    //             println!("✅ 智能分析测试通过: 返回了 {} 个推荐步骤", recommended_steps.len());
    //         }
    //         Err(e) => {
    //             panic!("智能分析失败: {}", e);
    //         }
    //     }
    // }
}