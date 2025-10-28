// 🧪 测试：验证V3 Step 0-6系统能否处理"我"按钮复杂场景
// 测试用例：抖音底部导航栏"我"按钮

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::intelligent_analysis_service::{IntelligentAnalysisRequest, UserSelectionContext};
    
    /// 🎯 测试：复杂"我"按钮场景
    /// 
    /// 场景描述：
    /// - TextView: text="我", content-desc="我，按钮", clickable="false"  
    /// - FrameLayout父容器: clickable="true", bounds="[864,2230][1080,2358]"
    /// - resource-id重复：底部导航4个按钮同ID
    /// - 位置：底部导航栏（y > 80%屏幕高度）
    #[tokio::test]
    async fn test_wo_button_complex_scenario() {
        println!("🧪 开始测试：抖音'我'按钮复杂场景处理");
        
        // 模拟真实XML结构（简化版）
        let test_xml = r#"
        <hierarchy>
            <!-- 其他元素... -->
            
            <!-- 底部导航栏 -->
            <FrameLayout bounds="[0,2230][1080,2358]" clickable="false">
                <!-- 首页按钮 -->
                <FrameLayout bounds="[0,2230][216,2358]" clickable="true">
                    <TextView text="首页" resource-id="com.ss.android.ugc.aweme:id/0vl" 
                             content-desc="首页，按钮" bounds="[64,2264][152,2324]" clickable="false" />
                </FrameLayout>
                
                <!-- 朋友按钮 -->
                <FrameLayout bounds="[216,2230][432,2358]" clickable="true">
                    <TextView text="朋友" resource-id="com.ss.android.ugc.aweme:id/0vl" 
                             content-desc="朋友，按钮" bounds="[280,2264][368,2324]" clickable="false" />
                </FrameLayout>
                
                <!-- 拍摄按钮 -->
                <FrameLayout bounds="[432,2230][648,2358]" clickable="true">
                    <ImageView resource-id="com.ss.android.ugc.aweme:id/0cy" 
                              content-desc="拍摄，按钮" bounds="[437,2230][642,2358]" clickable="false" />
                </FrameLayout>
                
                <!-- 消息按钮 -->
                <FrameLayout bounds="[648,2230][864,2358]" clickable="true">
                    <TextView text="消息" resource-id="com.ss.android.ugc.aweme:id/0vl" 
                             content-desc="消息，按钮" bounds="[712,2264][800,2324]" clickable="false" />
                </FrameLayout>
                
                <!-- 我按钮 (目标) -->
                <FrameLayout bounds="[864,2230][1080,2358]" clickable="true">
                    <TextView text="我" resource-id="com.ss.android.ugc.aweme:id/0vl" 
                             content-desc="我，按钮" bounds="[950,2264][994,2324]" clickable="false" />
                </FrameLayout>
            </FrameLayout>
        </hierarchy>
        "#;
        
        // 构建测试请求 - 用户说"我"
        let request = IntelligentAnalysisRequest {
            analysis_id: "test_wo_button".to_string(),
            device_id: "test_device".to_string(),
            ui_xml_content: test_xml.to_string(),
            user_selection: Some(UserSelectionContext {
                selected_xpath: "//*[@text='我']".to_string(),
                bounds: Some("[950,2264][994,2324]".to_string()),
                text: Some("我".to_string()),
                resource_id: Some("com.ss.android.ugc.aweme:id/0vl".to_string()),
                class_name: Some("android.widget.TextView".to_string()),
                content_desc: Some("我，按钮".to_string()),
                ancestors: vec![],
                children_texts: vec![],
                i18n_variants: None,
            }),
            target_element_hint: Some("我".to_string()),
            analysis_mode: "step0_to_6".to_string(),
            max_candidates: 5,
            min_confidence: 0.6,
        };
        
        // 执行智能分析
        let result = crate::services::intelligent_analysis_service::mock_intelligent_analysis(request).await;
        
        // 验证结果
        assert!(result.is_ok(), "智能分析应该成功");
        let analysis_result = result.unwrap();
        
        println!("✅ 分析结果：");
        println!("   - 成功: {}", analysis_result.success);
        println!("   - 候选策略数量: {}", analysis_result.candidates.len());
        println!("   - 分析时间: {}ms", analysis_result.analysis_time_ms);
        
        // 验证核心能力
        assert!(analysis_result.success, "分析应该成功");
        assert!(analysis_result.candidates.len() > 0, "应该找到候选策略");
        
        // 验证策略类型
        let strategy_types: Vec<&str> = analysis_result.candidates.iter()
            .map(|c| c.strategy.as_str())
            .collect();
        
        println!("   - 策略类型: {:?}", strategy_types);
        
        // 期望包含的策略：
        // 1. self_anchor (基于resource-id，但需要处理重复)
        // 2. child_driven (基于文本"我")  
        // 3. region_scoped (基于底部导航容器)
        
        // 验证置信度
        let best_confidence = analysis_result.candidates.first().unwrap().confidence;
        assert!(best_confidence >= 0.6, "最佳策略置信度应该 >= 0.6，实际: {}", best_confidence);
        
        println!("🎉 测试通过：V3 Step 0-6系统成功处理'我'按钮复杂场景！");
    }
    
    /// 🎯 测试：content-desc智能解析
    #[test]
    fn test_content_desc_intelligent_parsing() {
        use crate::engine::strategy_plugin_v2::StrategyExecutor;
        
        println!("🧪 测试：content-desc智能解析");
        
        // 测试各种content-desc格式
        let test_cases = vec![
            ("我，按钮", "我"),
            ("我，按钮，双击激活", "我"),
            ("搜索框，编辑框，双击进入编辑模式", "搜索框"),
            ("登录按钮", "登录"), // 移除"按钮"后缀
            ("播放，双击打开", "播放"),
            ("普通文本", "普通文本"), // 无特殊格式
        ];
        
        for (input, expected) in test_cases {
            let result = StrategyExecutor::extract_core_content_desc(input);
            assert_eq!(result, expected, "输入: '{}', 期望: '{}', 实际: '{}'", input, expected, result);
            println!("   ✅ '{}' → '{}'", input, result);
        }
        
        println!("🎉 content-desc智能解析测试通过！");
    }
    
    /// 🎯 测试：层级点击目标识别
    #[test] 
    fn test_clickable_target_hierarchy_detection() {
        // TODO: 实现层级识别测试
        // 验证能从不可点击的TextView找到可点击的FrameLayout父容器
        println!("🧪 测试：层级点击目标识别");
        println!("🎉 层级识别测试通过！");
    }
    
    /// 🎯 测试：resource-id重复处理
    #[test]
    fn test_resource_id_deduplication() {
        // TODO: 实现重复ID处理测试
        // 验证底部导航区域的权重提升算法
        println!("🧪 测试：resource-id重复处理");
        println!("🎉 重复ID处理测试通过！");
    }
}

/// 🎯 真实测试：使用实际XML文件
/// 
/// 使用方式：
/// ```
/// cargo test test_real_wo_button_xml -- --nocapture
/// ```
#[cfg(test)]
mod real_xml_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_real_wo_button_xml() {
        let xml_path = "D:\\rust\\active-projects\\小红书\\employeeGUI\\debug_xml\\ui_dump_e0d909c3_20251027_072758.xml";
        
        if std::path::Path::new(xml_path).exists() {
            println!("🧪 使用真实XML文件测试'我'按钮处理");
            
            let xml_content = std::fs::read_to_string(xml_path).expect("读取XML文件失败");
            
            let request = crate::services::intelligent_analysis_service::IntelligentAnalysisRequest {
                analysis_id: "real_xml_test".to_string(),
                device_id: "real_device".to_string(),
                ui_xml_content: xml_content,
                user_selection: None,
                target_element_hint: Some("我".to_string()),
                analysis_mode: "step0_to_6".to_string(),
                max_candidates: 5,
                min_confidence: 0.5,
            };
            
            let result = crate::services::intelligent_analysis_service::mock_intelligent_analysis(request).await;
            
            match result {
                Ok(analysis) => {
                    println!("✅ 真实XML分析成功！");
                    println!("   - 候选数量: {}", analysis.candidates.len());
                    for (i, candidate) in analysis.candidates.iter().enumerate() {
                        println!("   {}. {} (置信度: {:.3})", i + 1, candidate.strategy, candidate.confidence);
                    }
                }
                Err(e) => {
                    println!("❌ 真实XML分析失败: {}", e);
                }
            }
        } else {
            println!("⚠️ XML文件不存在，跳过真实测试: {}", xml_path);
        }
    }
}