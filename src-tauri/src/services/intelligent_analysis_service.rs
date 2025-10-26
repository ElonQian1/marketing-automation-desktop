// src-tauri/src/services/intelligent_analysis_service.rs
// module: intelligent-analysis | layer: services | role: V3 intelligent analysis service
// summary: V3智能分析服务，桥接后端V3执行系统与前端智能策略系统

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use anyhow::Result;

/// 智能分析请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntelligentAnalysisRequest {
    pub analysis_id: String,
    pub device_id: String,
    pub ui_xml_content: String,
    pub target_element_hint: Option<String>,
    pub analysis_mode: String, // "step0_to_6", "quick", "comprehensive"
    pub max_candidates: usize,
    pub min_confidence: f64,
}

/// 智能分析结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntelligentAnalysisResult {
    pub analysis_id: String,
    pub success: bool,
    pub candidates: Vec<StrategyCandidate>,
    pub analysis_time_ms: u128,
    pub step_details: Vec<StepAnalysisDetail>,
    pub recommendations: Vec<String>,
    pub metadata: AnalysisMetadata,
}

/// 策略候选
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategyCandidate {
    pub strategy: String,
    pub confidence: f64,
    pub reasoning: String,
    pub element_info: ElementInfo,
    pub execution_params: serde_json::Value,
}

/// 步骤分析详情
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepAnalysisDetail {
    pub step_name: String, // "SelfAnchor", "ChildAnchor", etc.
    pub step_index: usize, // 0-6
    pub candidates_found: usize,
    pub best_confidence: f64,
    pub execution_time_ms: u64,
    pub status: String, // "success", "failure", "skipped"
}

/// 分析元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisMetadata {
    pub xml_hash: String,
    pub xml_element_count: usize,
    pub device_info: String,
    pub analysis_timestamp: String,
    pub engine_version: String,
}

/// 元素信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementInfo {
    pub bounds: Option<String>,
    pub text: Option<String>,
    pub resource_id: Option<String>,
    pub class_name: Option<String>,
    pub click_point: Option<[i32; 2]>,
}

/// 执行智能分析（主入口）
/// 
/// 这个函数通过 IPC 调用前端的 StrategyDecisionEngine
pub async fn perform_intelligent_analysis(
    request: IntelligentAnalysisRequest,
) -> Result<IntelligentAnalysisResult> {
    tracing::info!("🧠 开始智能分析: {}", request.analysis_id);
    
    let start_time = std::time::Instant::now();
    
    // 获取 Tauri App Handle (需要从全局状态中获取)
    let app_handle = get_app_handle().await?;
    
    // 构建前端调用参数
    let frontend_request = serde_json::json!({
        "analysisId": request.analysis_id,
        "deviceId": request.device_id,
        "xmlContent": request.ui_xml_content,
        "targetElementHint": request.target_element_hint,
        "analysisMode": request.analysis_mode,
        "maxCandidates": request.max_candidates,
        "minConfidence": request.min_confidence
    });
    
    // 调用前端智能策略系统
    // 这里使用 Tauri 的 IPC 机制调用前端的 JavaScript/TypeScript 代码
    let frontend_result = call_frontend_strategy_engine(app_handle, frontend_request).await?;
    
    // 解析前端返回的结果
    let analysis_result = parse_frontend_analysis_result(frontend_result, &request, start_time.elapsed())?;
    
    tracing::info!("✅ 智能分析完成: {} 个候选策略, 耗时: {}ms", 
                   analysis_result.candidates.len(), analysis_result.analysis_time_ms);
    
    Ok(analysis_result)
}

/// 调用前端策略引擎
async fn call_frontend_strategy_engine(
    app_handle: AppHandle,
    request: serde_json::Value,
) -> Result<serde_json::Value> {
    tracing::info!("🔗 调用前端 StrategyDecisionEngine");
    
    // 方式1: 通过 emit 发送事件到前端，然后监听返回
    // app_handle.emit_all("intelligent-analysis-request", &request)?;
    
    // 方式2: 使用 Tauri 的 invoke 机制（需要前端注册对应的处理器）
    // 这里我们使用一个特殊的机制，通过 eval 直接调用前端代码
    
    let js_code = format!(
        r#"
        (async () => {{
            // 导入智能策略系统
            const {{ createIntelligentStrategy, getQuickRecommendation }} = await import('/src/modules/intelligent-strategy-system/index.ts');
            
            const request = {};
            
            try {{
                // 构建元素对象（简化版）
                const mockElement = {{
                    text: request.targetElementHint,
                    bounds: null,
                    resourceId: null,
                    className: null
                }};
                
                // 调用智能策略分析
                const recommendation = await getQuickRecommendation(mockElement, request.xmlContent);
                
                return {{
                    success: true,
                    recommendation: recommendation,
                    analysisId: request.analysisId,
                    timestamp: new Date().toISOString()
                }};
            }} catch (error) {{
                console.error('Frontend intelligent analysis failed:', error);
                return {{
                    success: false,
                    error: error.message || 'Unknown frontend analysis error',
                    analysisId: request.analysisId,
                    timestamp: new Date().toISOString()
                }};
            }}
        }})();
        "#,
        request
    );
    
    // 执行前端代码并获取结果
    app_handle
        .get_webview_window("main")
        .ok_or_else(|| anyhow::anyhow!("Main window not found"))?
        .eval(&js_code)
        .map_err(|e| anyhow::anyhow!("前端脚本执行失败: {}", e))?;
    
    // TODO: 实际使用时需要通过 IPC 事件或其他方式获取前端分析结果
    // 这里返回一个模拟结果
    Ok(serde_json::json!({
        "success": true,
        "candidates": [
            {
                "strategy": "smart_tap",
                "confidence": 0.85,
                "reasoning": "前端智能策略分析推荐"
            }
        ]
    }))
}

/// 解析前端分析结果
fn parse_frontend_analysis_result(
    frontend_result: serde_json::Value,
    original_request: &IntelligentAnalysisRequest,
    elapsed_time: std::time::Duration,
) -> Result<IntelligentAnalysisResult> {
    let success = frontend_result.get("success").and_then(|v| v.as_bool()).unwrap_or(false);
    
    if !success {
        let error_msg = frontend_result.get("error").and_then(|v| v.as_str()).unwrap_or("Unknown error");
        return Err(anyhow::anyhow!("Frontend analysis failed: {}", error_msg));
    }
    
    let recommendation = frontend_result.get("recommendation").unwrap_or(&serde_json::Value::Null);
    
    // 转换前端推荐结果为我们的格式
    let candidates = extract_candidates_from_recommendation(recommendation)?;
    
    let result = IntelligentAnalysisResult {
        analysis_id: original_request.analysis_id.clone(),
        success: true,
        candidates,
        analysis_time_ms: elapsed_time.as_millis(),
        step_details: vec![], // TODO: 从前端结果中提取
        recommendations: vec!["智能策略分析完成".to_string()],
        metadata: AnalysisMetadata {
            xml_hash: format!("{:x}", md5::compute(&original_request.ui_xml_content)),
            xml_element_count: count_xml_elements(&original_request.ui_xml_content),
            device_info: original_request.device_id.clone(),
            analysis_timestamp: chrono::Utc::now().to_rfc3339(),
            engine_version: "v3.0.0".to_string(),
        },
    };
    
    Ok(result)
}

/// 从前端推荐结果中提取候选策略
fn extract_candidates_from_recommendation(
    recommendation: &serde_json::Value,
) -> Result<Vec<StrategyCandidate>> {
    let mut candidates = Vec::new();
    
    // 提取主推荐策略
    if let Some(strategy_name) = recommendation.get("strategy").and_then(|v| v.as_str()) {
        let confidence = recommendation.get("confidence").and_then(|v| v.as_f64()).unwrap_or(0.8);
        let reasoning = recommendation.get("reasoning").and_then(|v| v.as_str()).unwrap_or("智能分析推荐");
        
        let candidate = StrategyCandidate {
            strategy: strategy_name.to_string(),
            confidence,
            reasoning: reasoning.to_string(),
            element_info: ElementInfo {
                bounds: None,
                text: recommendation.get("targetText").and_then(|v| v.as_str()).map(|s| s.to_string()),
                resource_id: None,
                class_name: None,
                click_point: None,
            },
            execution_params: recommendation.clone(),
        };
        
        candidates.push(candidate);
    }
    
    // 提取备选策略（如果有）
    if let Some(alternatives) = recommendation.get("alternatives").and_then(|v| v.as_array()) {
        for alt in alternatives {
            if let Some(strategy_name) = alt.get("strategy").and_then(|v| v.as_str()) {
                let confidence = alt.get("confidence").and_then(|v| v.as_f64()).unwrap_or(0.6);
                let reasoning = alt.get("reasoning").and_then(|v| v.as_str()).unwrap_or("备选策略");
                
                let candidate = StrategyCandidate {
                    strategy: strategy_name.to_string(),
                    confidence,
                    reasoning: reasoning.to_string(),
                    element_info: ElementInfo {
                        bounds: None,
                        text: alt.get("targetText").and_then(|v| v.as_str()).map(|s| s.to_string()),
                        resource_id: None,
                        class_name: None,
                        click_point: None,
                    },
                    execution_params: alt.clone(),
                };
                
                candidates.push(candidate);
            }
        }
    }
    
    if candidates.is_empty() {
        // 生成默认候选策略
        candidates.push(StrategyCandidate {
            strategy: "fallback_smart_selection".to_string(),
            confidence: 0.5,
            reasoning: "前端分析未返回有效策略，使用回退方案".to_string(),
            element_info: ElementInfo {
                bounds: None,
                text: Some("智能选择目标".to_string()),
                resource_id: None,
                class_name: None,
                click_point: None,
            },
            execution_params: serde_json::json!({
                "strategy": "fallback",
                "mode": "smart_selection"
            }),
        });
    }
    
    Ok(candidates)
}

/// 计算 XML 元素数量
fn count_xml_elements(xml_content: &str) -> usize {
    xml_content.matches('<').count()
}

/// 获取 App Handle（需要从全局状态获取）
/// 这里需要根据项目的实际 App Handle 管理方式实现
async fn get_app_handle() -> Result<AppHandle> {
    // TODO: 从全局状态或者其他方式获取 AppHandle
    // 这里暂时返回错误，实际使用时需要根据项目结构调整
    Err(anyhow::anyhow!("App handle not available - need to implement app handle management"))
}

/// 测试用的模拟分析函数
pub async fn mock_intelligent_analysis(
    request: IntelligentAnalysisRequest,
) -> Result<IntelligentAnalysisResult> {
    tracing::info!("🧪 使用模拟智能分析: {}", request.analysis_id);
    
    let start_time = std::time::Instant::now();
    
    // 模拟分析延迟
    tokio::time::sleep(std::time::Duration::from_millis(200)).await;
    
    let candidates = vec![
        StrategyCandidate {
            strategy: "text_match".to_string(),
            confidence: 0.85,
            reasoning: "基于文本匹配的高置信度策略".to_string(),
            element_info: ElementInfo {
                bounds: Some("[100,200][300,250]".to_string()),
                text: request.target_element_hint.clone(),
                resource_id: None,
                class_name: Some("android.widget.Button".to_string()),
                click_point: Some([200, 225]),
            },
            execution_params: serde_json::json!({
                "strategy": "text_match",
                "targetText": request.target_element_hint,
                "matchMode": "exact"
            }),
        },
        StrategyCandidate {
            strategy: "bounds_match".to_string(),
            confidence: 0.7,
            reasoning: "基于位置边界的备选策略".to_string(),
            element_info: ElementInfo {
                bounds: Some("[100,200][300,250]".to_string()),
                text: None,
                resource_id: Some("com.example:id/button".to_string()),
                class_name: Some("android.widget.Button".to_string()),
                click_point: Some([200, 225]),
            },
            execution_params: serde_json::json!({
                "strategy": "bounds_match",
                "bounds": "[100,200][300,250]"
            }),
        },
    ];
    
    let result = IntelligentAnalysisResult {
        analysis_id: request.analysis_id.clone(),
        success: true,
        candidates,
        analysis_time_ms: start_time.elapsed().as_millis(),
        step_details: vec![
            StepAnalysisDetail {
                step_name: "SelfAnchor".to_string(),
                step_index: 1,
                candidates_found: 2,
                best_confidence: 0.85,
                execution_time_ms: 50,
                status: "success".to_string(),
            },
        ],
        recommendations: vec![
            "推荐使用文本匹配策略".to_string(),
            "备选位置边界匹配策略".to_string(),
        ],
        metadata: AnalysisMetadata {
            xml_hash: format!("{:x}", md5::compute(&request.ui_xml_content)),
            xml_element_count: count_xml_elements(&request.ui_xml_content),
            device_info: request.device_id,
            analysis_timestamp: chrono::Utc::now().to_rfc3339(),
            engine_version: "v3.0.0-mock".to_string(),
        },
    };
    
    tracing::info!("✅ 模拟智能分析完成: {} 个候选策略", result.candidates.len());
    Ok(result)
}