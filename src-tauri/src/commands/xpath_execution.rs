use crate::services::safe_adb_manager::SafeAdbManager;
use crate::services::safe_adb_shell::safe_adb_shell_command;
use tauri::command;
use tokio::process::Command as AsyncCommand;
use tracing::{info, error};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[command]
pub async fn execute_xpath_action(
    device_id: String,
    xpath_expr: String,
    action: String
) -> Result<String, String> {
    let xml_content = get_ui_dump_safe(&device_id)
        .await
        .map_err(|e| format!("获取UI dump失败: {}", e))?;
    
    let bounds_str = extract_bounds_from_xml(&xml_content, &xpath_expr)?;
    let (x, y) = parse_bounds_center(&bounds_str)?;
    
    match action.as_str() {
        "click" | "点击" | "操作" => {
            execute_click(&device_id, x, y).await?;
            Ok(format!("成功点击坐标 ({}, {})", x, y))
        }
        _ => Err(format!("不支持的动作: {}", action))
    }
}

fn extract_bounds_from_xml(xml_content: &str, xpath_expr: &str) -> Result<String, String> {
    info!("🔍 分析XPath表达式: {}", xpath_expr);
    
    if xpath_expr.contains("@resource-id") {
        // 支持双引号和单引号格式
        let resource_id = if let Some(start) = xpath_expr.find("@resource-id=\"") {
            let start = start + 14; // 跳过 @resource-id="
            if let Some(end) = xpath_expr[start..].find('\"') {
                Some(&xpath_expr[start..start+end])
            } else {
                None
            }
        } else if let Some(start) = xpath_expr.find("@resource-id='") {
            let start = start + 14; // 跳过 @resource-id='
            if let Some(end) = xpath_expr[start..].find('\'') {
                Some(&xpath_expr[start..start+end])
            } else {
                None
            }
        } else {
            None
        };
        
        if let Some(resource_id) = resource_id {
            info!("🎯 提取resource-id: {}", resource_id);
            
            // 检查是否有索引语法，如 [5] 或 [1]
            let target_index = if let Some(bracket_start) = xpath_expr.rfind("][") {
                // 形如 [@resource-id="xxx"][5] 的情况
                let bracket_start = bracket_start + 2; // 跳过 "]["
                if let Some(bracket_end) = xpath_expr[bracket_start..].find(']') {
                    let index_str = &xpath_expr[bracket_start..bracket_start + bracket_end];
                    if let Ok(index) = index_str.parse::<usize>() {
                        Some(index)
                    } else {
                        None
                    }
                } else {
                    None
                }
            } else if let Some(bracket_start) = xpath_expr.rfind('[') {
                // 形如 //*[@resource-id="xxx" and @other="yyy"][5] 的情况
                if bracket_start > xpath_expr.find("@resource-id").unwrap_or(0) {
                    let bracket_start = bracket_start + 1;
                    if let Some(bracket_end) = xpath_expr[bracket_start..].find(']') {
                        let content = &xpath_expr[bracket_start..bracket_start + bracket_end];
                        if let Ok(index) = content.parse::<usize>() {
                            Some(index)
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                } else {
                    None
                }
            } else {
                None
            };
            
            // 查找所有匹配的resource-id
            let mut matching_elements = Vec::new();
            let mut search_start = 0;
            
            while let Some(found_pos) = xml_content[search_start..].find(&format!("resource-id=\"{}\"", resource_id)) {
                let actual_pos = search_start + found_pos;
                
                // 查找这个节点的开始位置
                if let Some(node_start) = xml_content[..actual_pos].rfind("<node ") {
                    // 查找这个节点的结束位置  
                    if let Some(node_end_marker) = xml_content[actual_pos..].find(">") {
                        let node_end = actual_pos + node_end_marker;
                        let node_content = &xml_content[node_start..=node_end];
                        
                        // 提取bounds
                        if let Some(bounds_start) = node_content.find("bounds=\"") {
                            let bounds_start = bounds_start + 8;
                            if let Some(bounds_end) = node_content[bounds_start..].find('\"') {
                                let bounds = &node_content[bounds_start..bounds_start + bounds_end];
                                matching_elements.push(bounds.to_string());
                            }
                        }
                    }
                }
                
                search_start = actual_pos + 1;
            }
            
            info!("� 找到 {} 个匹配的resource-id元素", matching_elements.len());
            
            if let Some(target_index) = target_index {
                info!("🎯 使用索引 [{}] 定位元素", target_index);
                
                // XPath索引从1开始，转换为数组索引（从0开始）
                let array_index = if target_index > 0 { target_index - 1 } else { 0 };
                
                if array_index < matching_elements.len() {
                    let bounds = &matching_elements[array_index];
                    info!("✅ 找到索引[{}]对应的元素，bounds: {}", target_index, bounds);
                    return Ok(bounds.clone());
                } else {
                    error!("❌ 索引[{}]超出范围，总共只有{}个匹配元素", target_index, matching_elements.len());
                    return Err(format!("索引[{}]超出范围，总共只有{}个匹配元素", target_index, matching_elements.len()));
                }
            } else {
                // 没有索引，返回第一个匹配的元素
                if !matching_elements.is_empty() {
                    let bounds = &matching_elements[0];
                    info!("✅ 未指定索引，返回第一个匹配元素，bounds: {}", bounds);
                    return Ok(bounds.clone());
                } else {
                    error!("❌ 未找到任何匹配的元素");
                    return Err("未找到任何匹配的元素".to_string());
                }
            }
        } else {
            error!("❌ 无法从XPath表达式中提取resource-id");
        }
    } else if xpath_expr.contains("@text") {
        // 支持text属性匹配
        let text_value = if let Some(start) = xpath_expr.find("@text=\"") {
            let start = start + 7; // 跳过 @text="
            if let Some(end) = xpath_expr[start..].find('\"') {
                Some(&xpath_expr[start..start+end])
            } else {
                None
            }
        } else if let Some(start) = xpath_expr.find("@text='") {
            let start = start + 7; // 跳过 @text='
            if let Some(end) = xpath_expr[start..].find('\'') {
                Some(&xpath_expr[start..start+end])
            } else {
                None
            }
        } else {
            None
        };
        
        if let Some(text_value) = text_value {
            info!("🎯 提取text: {}", text_value);
            
            // 搜索匹配的text
            if let Some(element_start) = xml_content.find(&format!("text=\"{}\"", text_value)) {
                let line_start = xml_content[..element_start].rfind('\n').unwrap_or(0);
                let line_end = xml_content[element_start..].find('\n').unwrap_or(xml_content.len() - element_start) + element_start;
                let line = &xml_content[line_start..line_end];
                
                info!("📍 找到匹配文本元素行: {}", line.chars().take(200).collect::<String>());
                
                if let Some(bounds_start) = line.find("bounds=\"") {
                    let bounds_start = bounds_start + 8;
                    if let Some(bounds_end) = line[bounds_start..].find('\"') {
                        let bounds = &line[bounds_start..bounds_start+bounds_end];
                        info!("📐 提取bounds: {}", bounds);
                        return Ok(bounds.to_string());
                    }
                }
            } else {
                error!("❌ 未找到text '{}' 的匹配元素", text_value);
            }
        } else {
            error!("❌ 无法从XPath表达式中提取text");
        }
    }
    
    Err("无法找到匹配元素".to_string())
}

fn parse_bounds_center(bounds: &str) -> Result<(i32, i32), String> {
    let bounds = bounds.trim_start_matches('[').trim_end_matches(']');
    let parts: Vec<&str> = bounds.split("][").collect();
    
    if parts.len() != 2 {
        return Err(format!("无效的bounds格式: {}", bounds));
    }
    
    let start_coords: Vec<&str> = parts[0].split(',').collect();
    let end_coords: Vec<&str> = parts[1].split(',').collect();
    
    if start_coords.len() != 2 || end_coords.len() != 2 {
        return Err(format!("无效的坐标格式: {}", bounds));
    }
    
    let left: i32 = start_coords[0].parse().map_err(|_| "无法解析left坐标")?;
    let top: i32 = start_coords[1].parse().map_err(|_| "无法解析top坐标")?;
    let right: i32 = end_coords[0].parse().map_err(|_| "无法解析right坐标")?;
    let bottom: i32 = end_coords[1].parse().map_err(|_| "无法解析bottom坐标")?;
    
    let center_x = (left + right) / 2;
    let center_y = (top + bottom) / 2;
    
    Ok((center_x, center_y))
}

async fn execute_click(device_id: &str, x: i32, y: i32) -> Result<(), String> {
    let command = format!("input tap {} {}", x, y);
    safe_adb_shell_command(device_id.to_string(), command)
        .await
        .map_err(|e| format!("点击执行失败: {}", e))?;
    Ok(())
}

/// 安全获取UI dump，使用SafeAdbManager来处理ADB路径
async fn get_ui_dump_safe(device_id: &str) -> Result<String, String> {
    info!("📱 正在获取设备 {} 的UI dump...", device_id);
    
    let mut adb_manager = SafeAdbManager::new();
    
    // 查找并获取安全的ADB路径
    let adb_path = adb_manager.find_safe_adb_path()
        .map_err(|e| format!("未找到安全的ADB路径: {}", e))?;
    
    // 先执行 uiautomator dump 刷新UI dump
    let mut refresh_cmd = AsyncCommand::new(&adb_path);
    refresh_cmd.args(&["-s", device_id, "shell", "uiautomator", "dump"]);
    
    #[cfg(windows)]
    {
        refresh_cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    
    let refresh_result = refresh_cmd.output().await;
    
    match refresh_result {
        Ok(output) if output.status.success() => {
            info!("🔄 UI dump刷新成功");
        }
        Ok(output) => {
            let error = String::from_utf8_lossy(&output.stderr);
            error!("⚠️ UI dump刷新警告: {}", error);
        }
        Err(e) => {
            error!("⚠️ UI dump刷新失败: {}", e);
            return Err(format!("UI dump刷新失败: {}", e));
        }
    }
    
    // 读取UI dump文件内容
    let mut cat_cmd = AsyncCommand::new(&adb_path);
    cat_cmd.args(&["-s", device_id, "shell", "cat", "/sdcard/window_dump.xml"]);
    
    #[cfg(windows)]
    {
        cat_cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    
    let cat_result = cat_cmd.output().await;
    
    match cat_result {
        Ok(output) if output.status.success() => {
            let xml_content = String::from_utf8_lossy(&output.stdout).to_string();
            if xml_content.trim().is_empty() {
                return Err("UI dump内容为空".to_string());
            }
            info!("✅ 成功获取UI dump，内容长度: {}", xml_content.len());
            Ok(xml_content)
        }
        Ok(output) => {
            let error = String::from_utf8_lossy(&output.stderr);
            Err(format!("读取UI dump失败: {}", error))
        }
        Err(e) => {
            Err(format!("执行adb命令失败: {}", e))
        }
    }
}
