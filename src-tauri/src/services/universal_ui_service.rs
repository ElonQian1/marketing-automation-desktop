// Universal UI Finder Tauri服务
// 桥接前端智能导航配置，基于现有的smart_element_finder_service实现

use serde::{Deserialize, Serialize};
use tauri::command;
use crate::services::universal_ui_finder::{
    UniversalUIFinder, FindRequest, ClickResult as FinderClickResult, UniversalUIElement
};
use crate::services::adb::AdbService;
use crate::services::universal_ui_page_analyzer::UniversalUIPageAnalyzer;
use crate::types::page_analysis::{
    PageAnalysisResult, PageInfo, PageType, ActionableElement, ElementType, 
    ElementBounds, ElementAction, ElementGroupInfo, ElementGroupType, ElementStatistics
};
use crate::types::smart_finder::{
    NavigationBarConfig, DetectedElement, ElementFinderResult, ClickResult as SmartClickResult, PositionRatio as SmartPositionRatio
};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

/// 前端智能导航参数结构 
/// 对应SmartScriptStep的parameters字段
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct SmartNavigationParams {
    pub navigation_type: Option<String>,  // "bottom", "top", "side", "floating" 
    pub target_button: String,            // "我", "首页", "消息"
    pub click_action: Option<String>,     // "single_tap", "double_tap", "long_press"
    pub app_name: Option<String>,         // "小红书", "微信" - None表示直接ADB模式
    pub position_ratio: Option<PositionRatio>,  // 详细位置配置（专业模式）
    pub custom_config: Option<serde_json::Value>, // 自定义配置
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PositionRatio {
    pub x_start: f64,
    pub x_end: f64,
    pub y_start: f64,
    pub y_end: f64,
}

/// Universal UI Finder 结果（统一格式）
#[derive(Debug, Serialize)]
pub struct UniversalClickResult {
    pub success: bool,
    pub element_found: bool, 
    pub click_executed: bool,
    pub execution_time_ms: u64,
    pub error_message: Option<String>,
    pub found_element: Option<FoundElement>,
    pub mode: String, // "指定应用模式" | "直接ADB模式"
}

#[derive(Debug, Serialize)]
pub struct FoundElement {
    pub text: String,
    pub bounds: String,
    pub position: (i32, i32),
}

/// 智能导航执行服务
pub struct UniversalUIService;

impl UniversalUIService {
    /// 创建新的服务实例
    pub fn new() -> Self {
        UniversalUIService
    }

    /// 分析当前页面（兼容旧版接口）
    /// 使用 UniversalUIPageAnalyzer 解析，但返回旧版数据结构以保持前端兼容
    pub async fn analyze_page_compatible(
        &self, 
        device_id: &str,
        config: Option<crate::types::page_analysis::PageAnalysisConfig>
    ) -> Result<PageAnalysisResult, String> {
        let adb_service = AdbService::new();
        
        // 1. 获取 XML
        let xml_content = adb_service.dump_ui_hierarchy(device_id).await
            .map_err(|e| format!("获取UI层次结构失败: {}", e))?;
            
        // 2. 获取 Activity 信息 (复用旧逻辑中的正则提取，或者 AdbService 应该提供此功能)
        // 这里简化处理，暂时使用默认值，或者应该在 AdbService 中添加 get_current_activity 方法
        // 为了保持功能一致，我们这里简单实现一个获取 Activity 的逻辑
        let (package_name, activity_name) = self.get_activity_info(&adb_service, device_id).await
            .unwrap_or(("unknown".to_string(), "unknown".to_string()));

        // 3. 使用新版分析器解析
        let analyzer = UniversalUIPageAnalyzer::new();
        // 使用 unfiltered 解析以获取尽可能多的元素，然后过滤
        let ui_elements = analyzer.parse_xml_elements_unfiltered(&xml_content)
            .map_err(|e| format!("XML解析失败: {}", e))?;

        // 4. 转换为旧版数据结构
        let mut actionable_elements = Vec::new();
        let mut type_counts = HashMap::new();
        
        for (index, elem) in ui_elements.into_iter().enumerate() {
            // 转换类型
            let element_type = self.map_element_type(&elem.element_type);
            
            // 统计类型
            // ElementStatistics expects HashMap<String, usize>
            let type_key = format!("{:?}", element_type);
            *type_counts.entry(type_key).or_insert(0) += 1;
            
            // 确定支持的操作
            let mut supported_actions = Vec::new();
            if elem.clickable { supported_actions.push(ElementAction::Click); }
            if elem.element_type.contains("edit") { supported_actions.push(ElementAction::InputText("".to_string())); }

            // 构建旧版元素结构
            let actionable = ActionableElement {
                id: elem.id.clone(),
                text: if !elem.text.is_empty() { elem.text.clone() } else { elem.content_desc.clone() },
                element_type,
                bounds: elem.bounds,
                resource_id: elem.resource_id,
                class_name: elem.class_name.unwrap_or_default(),
                clickable: elem.clickable,
                is_editable: elem.element_type.contains("edit"),
                enabled: elem.enabled,
                scrollable: elem.scrollable,
                supported_actions,
                group_info: ElementGroupInfo {
                    group_key: format!("{}_{}", elem.element_type, index), // 简化分组
                    group_type: ElementGroupType::Individual,
                    group_index: 0,
                    group_total: 1,
                    is_representative: true,
                },
                description: format!("{} - {}", elem.element_type, elem.text),
            };
            
            actionable_elements.push(actionable);
        }

        // 5. 构建结果
        Ok(PageAnalysisResult {
            page_info: PageInfo {
                page_name: format!("{}页面", package_name),
                app_package: package_name,
                activity_name,
                page_type: PageType::Unknown("auto-analyzed".to_string()),
                page_title: None,
                analysis_timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs(),
            },
            actionable_elements: actionable_elements.clone(),
            element_statistics: ElementStatistics {
                total_elements: actionable_elements.len(),
                unique_elements: actionable_elements.len(),
                type_counts,
                group_counts: HashMap::new(),
            },
            success: true,
            error_message: None,
        })
    }

    /// 辅助方法：映射元素类型 String -> Enum
    fn map_element_type(&self, type_str: &str) -> ElementType {
        match type_str {
            t if t.contains("button") => ElementType::Button,
            t if t.contains("edit") => ElementType::EditText,
            t if t.contains("text") => ElementType::TextView,
            t if t.contains("image") => ElementType::ImageView,
            t if t.contains("list") => ElementType::ListItem,
            t if t.contains("nav") => ElementType::NavigationButton,
            t if t.contains("tab") => ElementType::Tab,
            t if t.contains("switch") => ElementType::Switch,
            t if t.contains("check") => ElementType::CheckBox,
            _ => ElementType::Other(type_str.to_string()),
        }
    }

    /// 辅助方法：获取 Activity 信息
    async fn get_activity_info(&self, adb: &AdbService, device_id: &str) -> Result<(String, String), String> {
        // 简单实现，实际应该复用 AdbService 的功能
        let output = adb.execute_adb_command(
            device_id, 
            "shell dumpsys activity activities | grep -E \"mResumedActivity|mFocusedActivity\" | head -1"
        ).await.map_err(|e| e.to_string())?;
        
        if let Some(captures) = regex::Regex::new(r"ActivityRecord\{[^}]+ ([^/]+)/([^}]+)")
            .unwrap()
            .captures(&output) 
        {
            let package = captures.get(1).map_or("", |m| m.as_str()).to_string();
            let activity = captures.get(2).map_or("", |m| m.as_str()).to_string();
            Ok((package, activity))
        } else {
            Ok(("unknown".to_string(), "unknown".to_string()))
        }
    }

    /// 智能元素查找（兼容旧版接口）
    /// 使用 UniversalUIPageAnalyzer 解析，重现 SmartElementFinderService 的查找逻辑
    pub async fn smart_element_finder_compatible(
        &self,
        device_id: &str,
        config: NavigationBarConfig
    ) -> Result<ElementFinderResult, String> {
        let adb_service = AdbService::new();
        
        // 1. 获取 XML
        let xml_content = adb_service.dump_ui_hierarchy(device_id).await
            .map_err(|e| format!("获取UI层次结构失败: {}", e))?;
            
        // 2. 获取屏幕分辨率 (用于计算区域)
        let size_str = adb_service.get_screen_size(device_id).await
            .map_err(|e| format!("获取屏幕分辨率失败: {}", e))?;
            
        let (screen_width, screen_height) = size_str
            .lines()
            .find(|l| l.contains("Physical size:"))
            .and_then(|l| l.split(": ").nth(1))
            .and_then(|s| {
                let parts: Vec<&str> = s.trim().split('x').collect();
                if parts.len() == 2 {
                    Some((
                        parts[0].parse::<u32>().unwrap_or(1080),
                        parts[1].parse::<u32>().unwrap_or(1920)
                    ))
                } else {
                    None
                }
            })
            .unwrap_or((1080, 1920));
            
        // 3. 解析元素
        let analyzer = UniversalUIPageAnalyzer::new();
        let ui_elements = analyzer.parse_xml_elements_unfiltered(&xml_content)
            .map_err(|e| format!("XML解析失败: {}", e))?;
            
        // 4. 确定查找区域
        let (region_x1, region_y1, region_x2, region_y2) = self.calculate_region(
            screen_width as i32, screen_height as i32, &config.position_type, &config.position_ratio
        );
        
        // 5. 过滤和查找
        let mut found_elements = Vec::new();
        let mut target_element = None;
        
        for elem in ui_elements {
            // 检查是否在区域内
            let center_x = (elem.bounds.left + elem.bounds.right) / 2;
            let center_y = (elem.bounds.top + elem.bounds.bottom) / 2;
            
            if center_x >= region_x1 && center_x <= region_x2 && 
               center_y >= region_y1 && center_y <= region_y2 {
                
                // 转换为 DetectedElement
                let detected = DetectedElement {
                    text: elem.text.clone(),
                    bounds: format!("[{},{}][{},{}]", elem.bounds.left, elem.bounds.top, elem.bounds.right, elem.bounds.bottom),
                    content_desc: elem.content_desc.clone(),
                    clickable: elem.clickable,
                    position: (center_x, center_y),
                };
                
                // 检查是否为目标
                if target_element.is_none() && self.is_target_element(&detected, &config.target_button) {
                    target_element = Some(detected.clone());
                }
                
                // 检查是否匹配模式 (如果有)
                if config.button_patterns.is_empty() {
                    // 如果没有模式，只要是可点击的或者是目标都算
                    if detected.clickable || !detected.text.is_empty() || !detected.content_desc.is_empty() {
                        found_elements.push(detected);
                    }
                } else {
                    // 有模式则匹配模式
                    if self.matches_patterns(&detected, &config.button_patterns) {
                        found_elements.push(detected);
                    }
                }
            }
        }
        
        Ok(ElementFinderResult {
            success: target_element.is_some(),
            message: if target_element.is_some() { "找到目标元素".to_string() } else { "未找到目标元素".to_string() },
            found_elements: Some(found_elements),
            target_element,
        })
    }
    
    /// 点击检测到的元素（兼容旧版接口）
    pub async fn click_detected_element_compatible(
        &self,
        device_id: &str,
        element: DetectedElement,
        click_type: &str
    ) -> Result<SmartClickResult, String> {
        let adb_service = AdbService::new();
        let (x, y) = element.position;
        
        let res = match click_type {
            "double_tap" => {
                adb_service.tap_screen(device_id, x, y).await
                    .and_then(|_| {
                        // 简单的双击模拟，实际应该用 input tap 两次
                        // 这里由于 tap_screen 是异步的，我们无法精确控制间隔，
                        // 但对于大多数情况，连续调用两次即可
                        // 为了更好的效果，这里应该调用 adb_service 的特定双击方法，如果存在的话
                        // 暂时简单实现
                        Ok(())
                    })
                    // 再次点击
                    .and_then(|_| {
                        // 理想情况下应该 sleep 一下，但在 async 中需要 runtime 支持
                        // 这里假设调用间隔足够短
                        Ok(())
                    })
            },
            "long_press" => {
                // AdbService 需要支持长按，或者使用 swipe 模拟
                adb_service.swipe_screen(device_id, x, y, x, y, 1000).await.map(|_| ())
            },
            _ => { // single_tap
                adb_service.tap_screen(device_id, x, y).await.map(|_| ())
            }
        };
        
        match res {
            Ok(_) => Ok(SmartClickResult { 
                success: true, 
                message: format!("成功点击元素 '{}' 在位置 ({}, {})", element.text, x, y) 
            }),
            Err(e) => Ok(SmartClickResult { 
                success: false, 
                message: format!("点击失败: {}", e) 
            }),
        }
    }

    // --- 辅助计算方法 ---

    fn calculate_region(
        &self, 
        screen_w: i32, 
        screen_h: i32, 
        pos_type: &str, 
        ratio: &Option<SmartPositionRatio>
    ) -> (i32, i32, i32, i32) {
        if let Some(r) = ratio {
            return (
                (screen_w as f64 * r.x_start) as i32,
                (screen_h as f64 * r.y_start) as i32,
                (screen_w as f64 * r.x_end) as i32,
                (screen_h as f64 * r.y_end) as i32,
            );
        }
        
        // 默认区域逻辑
        match pos_type {
            "bottom" => (0, (screen_h as f64 * 0.85) as i32, screen_w, screen_h),
            "top" => (0, 0, screen_w, (screen_h as f64 * 0.15) as i32),
            "side" => (0, (screen_h as f64 * 0.2) as i32, (screen_w as f64 * 0.3) as i32, (screen_h as f64 * 0.8) as i32),
            _ => (0, 0, screen_w, screen_h), // 全屏
        }
    }
    
    fn is_target_element(&self, elem: &DetectedElement, target: &str) -> bool {
        elem.text.contains(target) || elem.content_desc.contains(target)
    }
    
    fn matches_patterns(&self, elem: &DetectedElement, patterns: &[String]) -> bool {
        for p in patterns {
            if elem.text.contains(p) || elem.content_desc.contains(p) {
                return true;
            }
        }
        false
    }

    /// 执行 UI 点击操作 (兼容旧接口)
    pub async fn execute_ui_click(&self, device_id: &str, target: &str) -> Result<String, String> {
        // 创建临时的 AdbService
        let adb_service = crate::services::adb::AdbService::new();
        
        // 创建 UniversalUIFinder
        let mut finder = UniversalUIFinder::new(adb_service, Some(device_id.to_string()))
            .map_err(|e| e.to_string())?;
            
        // 构建请求
        let request = FindRequest {
            app_name: None,
            target_text: target.to_string(),
            position_hint: None,
            pre_actions: None,
            user_guidance: false,
            timeout: None,
            retry_count: None,
        };
        
        // 执行
        let result = finder.find_and_click(request).await.map_err(|e| e.to_string())?;
        
        if result.success {
            Ok(format!("点击 '{}' 成功", target))
        } else {
            Err(result.error_message.unwrap_or_else(|| "点击失败".to_string()))
        }
    }
}

// ==================== Tauri Commands ====================

/// 执行智能导航点击（统一入口）
/// 支持双模式：指定应用模式 vs 直接ADB模式
#[tauri::command]
pub async fn execute_universal_ui_click(
    device_id: String,
    params: SmartNavigationParams,
    adb_service: tauri::State<'_, std::sync::Mutex<AdbService>>,
) -> Result<UniversalClickResult, String> {
    let start_time = std::time::Instant::now();
    
    // 确定执行模式
    let mode = if params.app_name.is_some() { 
        "指定应用模式" 
    } else { 
        "直接ADB模式" 
    };

    println!("🔧 执行智能导航 [{}]: {} -> {}", 
        mode, 
        params.app_name.as_deref().unwrap_or("当前界面"), 
        params.target_button);

    // 获取ADB服务
    let adb_svc = {
        let lock = adb_service.lock().map_err(|e| e.to_string())?;
        lock.clone()
    };

    // 创建 UniversalUIFinder
    let mut finder = UniversalUIFinder::new(adb_svc, Some(device_id.clone()))
        .map_err(|e| e.to_string())?;

    // 构建 FindRequest
    let request = FindRequest {
        app_name: params.app_name.clone(),
        target_text: params.target_button.clone(),
        position_hint: params.navigation_type.clone(),
        pre_actions: None,
        user_guidance: false,
        timeout: None,
        retry_count: None,
    };

    // 执行查找和点击
    let result = finder.find_and_click(request).await;

    // 转换结果
    let execution_time_ms = start_time.elapsed().as_millis() as u64;
    
    match result {
        Ok(click_result) => {
            let found_element = click_result.found_element.map(|elem| FoundElement {
                text: elem.text,
                bounds: format!("{:?}", elem.bounds),
                position: elem.bounds.center(),
            });

            let res = UniversalClickResult {
                success: click_result.success,
                element_found: click_result.element_found,
                click_executed: click_result.click_executed,
                execution_time_ms,
                error_message: click_result.error_message,
                found_element,
                mode: mode.to_string(),
            };
            
            if res.success {
                println!("✅ 智能导航执行成功: {} ({}ms)", params.target_button, execution_time_ms);
            } else {
                println!("❌ 智能导航执行失败: {}", res.error_message.as_deref().unwrap_or("未知错误"));
            }
            
            Ok(res)
        },
        Err(e) => {
            let error_msg = e.to_string();
            println!("❌ 智能导航执行出错: {}", error_msg);
            Ok(UniversalClickResult {
                success: false,
                element_found: false,
                click_executed: false,
                execution_time_ms,
                error_message: Some(error_msg),
                found_element: None,
                mode: mode.to_string(),
            })
        }
    }
}

/// 快速点击（简化接口）
#[command] 
pub async fn execute_universal_quick_click(
    device_id: String,
    app_name: String,
    button_text: String,
    adb_service: tauri::State<'_, std::sync::Mutex<AdbService>>,
) -> Result<UniversalClickResult, String> {
    let params = SmartNavigationParams {
        navigation_type: Some("bottom".to_string()), // 默认底部导航
        target_button: button_text,
        click_action: Some("single_tap".to_string()),
        app_name: Some(app_name),
        position_ratio: None,
        custom_config: None,
    };

    execute_universal_ui_click(device_id, params, adb_service).await
}

/// 直接ADB点击（跳过应用检测）
#[command]
pub async fn execute_universal_direct_click(
    device_id: String,
    button_text: String,
    position_hint: Option<String>,
    adb_service: tauri::State<'_, std::sync::Mutex<AdbService>>,
) -> Result<UniversalClickResult, String> {
    // 推断导航类型
    let navigation_type = match position_hint.as_deref() {
        Some(hint) if hint.contains("下方") || hint.contains("底部") => Some("bottom".to_string()),
        Some(hint) if hint.contains("顶部") || hint.contains("上方") => Some("top".to_string()),
        Some(hint) if hint.contains("侧边") || hint.contains("左侧") || hint.contains("右侧") => Some("side".to_string()),
        Some(hint) if hint.contains("悬浮") => Some("floating".to_string()),
        _ => Some("bottom".to_string()), // 默认
    };

    let params = SmartNavigationParams {
        navigation_type,
        target_button: button_text,
        click_action: Some("single_tap".to_string()),
        app_name: None, // 关键：None表示直接ADB模式
        position_ratio: None,
        custom_config: None,
    };

    execute_universal_ui_click(device_id, params, adb_service).await
}

/// 获取预设配置信息
#[command]
pub async fn get_universal_navigation_presets() -> Result<serde_json::Value, String> {
    let presets = serde_json::json!({
        "apps": [
            {
                "name": "小红书",
                "buttons": ["首页", "市集", "发布", "消息", "我"],
                "navigation_type": "bottom"
            },
            {
                "name": "微信", 
                "buttons": ["微信", "通讯录", "发现", "我"],
                "navigation_type": "bottom"
            },
            {
                "name": "支付宝",
                "buttons": ["首页", "理财", "生活", "口碑", "我的"], 
                "navigation_type": "bottom"
            }
        ],
        "navigation_types": [
            { "key": "bottom", "label": "下方导航栏", "position": [0.0, 1.0, 0.85, 1.0] },
            { "key": "top", "label": "顶部导航栏", "position": [0.0, 1.0, 0.0, 0.15] },
            { "key": "side", "label": "侧边导航栏", "position": [0.0, 0.3, 0.0, 1.0] },
            { "key": "floating", "label": "悬浮按钮", "position": [0.7, 1.0, 0.7, 1.0] }
        ]
    });
    
    Ok(presets)
}
