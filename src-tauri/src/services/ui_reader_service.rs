use serde::{Deserialize, Serialize};
use tokio::process::Command as AsyncCommand;
use crate::utils::adb_utils::get_adb_path;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct UIElement {
    pub text: Option<String>,
    pub resource_id: Option<String>,
    pub class: Option<String>,
    pub package: Option<String>,
    pub content_desc: Option<String>,
    pub clickable: Option<bool>,
    pub enabled: Option<bool>, // 新增enabled字段
    pub bounds: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceUIState {
    pub device_id: String,
    pub xml_content: String,
    pub elements: Vec<UIElement>,
    pub timestamp: String,
    pub page_type: String,
    pub suggested_action: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum UIPageType {
    Desktop,                    // 桌面
    FileManagerEmpty,           // 文件管理器-空目录
    FileManagerBrowsing,        // 文件管理器-浏览中
    FileManagerWithVcf,         // 文件管理器-找到VCF文件
    ContactsApp,                // 联系人应用
    PermissionDialog,           // 权限对话框
    Unknown(String),            // 未知页面
}

#[derive(Debug, Serialize, Deserialize)]
pub enum NextAction {
    OpenFileManager,        // 打开文件管理器
    NavigateToDownloads,    // 导航到下载目录
    CheckDownloadFolder,    // 检查下载文件夹
    LookForVcfFile,        // 查找VCF文件
    ClickVcfFile,          // 点击VCF文件
    ConfirmImport,         // 确认导入
    GrantPermission,       // 授予权限
    AnalyzeCurrentState,   // 分析当前状态
}

/// 实时读取设备UI界面状态
#[tauri::command]
pub async fn read_device_ui_state(device_id: String) -> Result<DeviceUIState, String> {
    println!("🔍 开始读取设备 {} 的UI状态", device_id);
    
    // 1. 使用adb获取当前UI dump
    let ui_xml = get_ui_dump(&device_id).await?;
    
    // 2. 解析XML获取关键元素
    let elements = parse_ui_elements(&ui_xml)?;
    
    // 3. 分析页面类型
    let page_type = analyze_ui_state(&elements);
    
    // 4. 建议下一步操作
    let suggested_action = suggest_next_action(&page_type, &elements);
    
    // 5. 获取当前时间戳
    let timestamp = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    
    let ui_state = DeviceUIState {
        device_id: device_id.clone(),
        xml_content: ui_xml,
        elements,
        timestamp,
        page_type: format!("{:?}", page_type),
        suggested_action: format!("{:?}", suggested_action),
    };
    
    println!("✅ UI状态读取完成，页面类型: {:?}, 建议操作: {:?}", page_type, suggested_action);
    
    // 保存到文件供调试
    let _ = save_ui_state_to_file(&ui_state, "current_ui_state.xml").await;
    
    Ok(ui_state)
}

/// 获取设备UI dump XML
pub async fn get_ui_dump(device_id: &str) -> Result<String, String> {
    println!("📱 正在获取设备 {} 的UI dump...", device_id);
    
    // 获取正确的ADB路径
    let adb_path = get_adb_path();
    
    // 先尝试刷新UI dump
    let mut refresh_cmd = AsyncCommand::new(&adb_path);
    refresh_cmd.args(&["-s", device_id, "shell", "uiautomator", "dump"]);
    
    #[cfg(windows)]
    {
        refresh_cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    
    let refresh_result = refresh_cmd.output().await;
    
    match refresh_result {
        Ok(output) if output.status.success() => {
            println!("🔄 UI dump刷新成功");
        }
        Ok(output) => {
            let error = String::from_utf8_lossy(&output.stderr);
            println!("⚠️ UI dump刷新警告: {}", error);
        }
        Err(e) => {
            println!("⚠️ UI dump刷新失败: {}", e);
        }
    }
    
    // 等待一下让UI dump生成
    tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
    
    // 读取UI dump文件
    let mut read_cmd = AsyncCommand::new(&adb_path);
    read_cmd.args(&["-s", device_id, "shell", "cat", "/sdcard/window_dump.xml"]);
    
    #[cfg(windows)]
    {
        read_cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    
    let result = read_cmd.output().await;
    
    match result {
        Ok(output) if output.status.success() => {
            let xml_content = String::from_utf8_lossy(&output.stdout).to_string();
            if xml_content.trim().is_empty() {
                return Err("UI dump文件为空".to_string());
            }
            println!("📄 成功读取UI dump，大小: {} 字符", xml_content.len());
            Ok(xml_content)
        }
        Ok(output) => {
            let error = String::from_utf8_lossy(&output.stderr);
            Err(format!("读取UI dump失败: {}", error))
        }
        Err(e) => Err(format!("执行adb命令失败: {}", e)),
    }
}

/// 解析XML内容获取UI元素
pub fn parse_ui_elements(xml_content: &str) -> Result<Vec<UIElement>, String> {
    let mut elements = Vec::new();
    
    // 检查是否是压缩的XML（单行或少数行）
    let expanded_content = if xml_content.lines().count() <= 3 {
        println!("⚠️ 检测到压缩的XML格式，正在展开以便解析...");
        expand_compressed_xml(xml_content)
    } else {
        xml_content.to_string()
    };
    
    // 使用正则表达式匹配所有node标签（处理压缩的XML）
    let mut start_pos = 0;
    while let Some(node_start) = expanded_content[start_pos..].find("<node") {
        let absolute_start = start_pos + node_start;
        
        // 找到对应的结束位置（自闭合标签或开标签）
        if let Some(tag_end) = expanded_content[absolute_start..].find('>') {
            let tag_content = &expanded_content[absolute_start..absolute_start + tag_end + 1];
            
            // 只处理包含bounds属性的节点
            if tag_content.contains("bounds=") {
                if let Ok(element) = parse_node_element(tag_content) {
                    elements.push(element);
                }
            }
            
            start_pos = absolute_start + tag_end + 1;
        } else {
            break;
        }
    }
    
    println!("🔍 解析到 {} 个UI元素", elements.len());
    if elements.len() == 1 && xml_content.len() > 1000 {
        println!("⚠️ 只解析到1个元素但XML内容很长({}字符)，可能存在解析问题", xml_content.len());
        println!("📄 XML前200字符: {}", &xml_content.chars().take(200).collect::<String>());
    }
    Ok(elements)
}

/// 解析单个node元素
fn parse_node_element(line: &str) -> Result<UIElement, String> {
    // 提取各个属性
    let text = extract_attribute(line, "text").unwrap_or_default();
    let resource_id = extract_attribute(line, "resource-id").unwrap_or_default();
    let class = extract_attribute(line, "class").unwrap_or_default();
    let package = extract_attribute(line, "package").unwrap_or_default();
    let content_desc = extract_attribute(line, "content-desc").unwrap_or_default();
    let bounds = extract_attribute(line, "bounds").unwrap_or_default();
    
    let clickable = extract_attribute(line, "clickable")
        .unwrap_or("false".to_string()) == "true";
    
    Ok(UIElement {
        text: Some(text),
        resource_id: Some(resource_id),
        class: Some(class),
        package: Some(package),
        content_desc: Some(content_desc),
        clickable: Some(clickable),
        enabled: Some(true), // 添加默认值
        bounds: Some(bounds),
    })
}

/// 提取XML属性值
fn extract_attribute(line: &str, attr_name: &str) -> Option<String> {
    let pattern = format!("{}=\"", attr_name);
    if let Some(start) = line.find(&pattern) {
        let start_pos = start + pattern.len();
        if let Some(end) = line[start_pos..].find('"') {
            return Some(line[start_pos..start_pos + end].to_string());
        }
    }
    None
}

/// 分析当前UI状态并识别页面类型
fn analyze_ui_state(elements: &[UIElement]) -> UIPageType {
    if elements.is_empty() {
        return UIPageType::Unknown("no_elements".to_string());
    }
    
    // 检查当前应用包名
    if let Some(first_element) = elements.first() {
        println!("🧠 分析UI状态，package: {:?}", first_element.package);
        
        match first_element.package.as_ref().map(|s| s.as_str()) {
            Some("com.android.documentsui") => {
                if elements.iter().any(|e| e.text.as_ref().map_or(false, |text| text.contains("无任何文件") || text.contains("No items"))) {
                    UIPageType::FileManagerEmpty
                } else if elements.iter().any(|e| e.text.as_ref().map_or(false, |text| text.contains("contacts_import.vcf") || text.contains(".vcf"))) {
                    UIPageType::FileManagerWithVcf
                } else {
                    UIPageType::FileManagerBrowsing
                }
            }
            Some("com.android.contacts") => UIPageType::ContactsApp,
            Some("com.android.packageinstaller") => UIPageType::PermissionDialog,
            Some(package) if package.contains("launcher") => UIPageType::Desktop,
            _ => UIPageType::Unknown(first_element.package.clone().unwrap_or_else(|| "unknown".to_string())),
        }
    } else {
        UIPageType::Unknown("no_elements".to_string())
    }
}

/// 根据UI状态建议下一步操作
fn suggest_next_action(page_type: &UIPageType, elements: &[UIElement]) -> NextAction {
    match page_type {
        UIPageType::Desktop => NextAction::OpenFileManager,
        UIPageType::FileManagerEmpty => {
            // 检查是否在下载目录
            if elements.iter().any(|e| e.text.as_ref().map_or(false, |text| text.contains("最近") || text.contains("Download") || text.contains("下载"))) {
                NextAction::CheckDownloadFolder
            } else {
                NextAction::NavigateToDownloads
            }
        }
        UIPageType::FileManagerBrowsing => NextAction::LookForVcfFile,
        UIPageType::FileManagerWithVcf => NextAction::ClickVcfFile,
        UIPageType::ContactsApp => NextAction::ConfirmImport,
        UIPageType::PermissionDialog => NextAction::GrantPermission,
        UIPageType::Unknown(_) => NextAction::AnalyzeCurrentState,
    }
}

/// 保存UI状态到文件（用于调试）
async fn save_ui_state_to_file(ui_state: &DeviceUIState, file_path: &str) -> Result<(), String> {
    use tokio::fs;
    
    let content = format!(
        "<!-- UI状态时间: {} -->\n<!-- 设备ID: {} -->\n<!-- 页面类型: {} -->\n<!-- 建议操作: {} -->\n<!-- 元素数量: {} -->\n{}",
        ui_state.timestamp,
        ui_state.device_id,
        ui_state.page_type,
        ui_state.suggested_action,
        ui_state.elements.len(),
        ui_state.xml_content
    );
    
    fs::write(file_path, content)
        .await
        .map_err(|e| format!("保存文件失败: {}", e))?;
    
    println!("💾 UI状态已保存到: {}", file_path);
    Ok(())
}

/// 查找特定类型的UI元素
#[tauri::command]
pub async fn find_ui_elements(
    device_id: String,
    element_type: String, // "clickable", "text", "resource_id"
    search_value: String,
) -> Result<Vec<UIElement>, String> {
    let ui_state = read_device_ui_state(device_id).await?;
    
    let matching_elements: Vec<UIElement> = ui_state.elements
        .into_iter()
        .filter(|element| {
            match element_type.as_str() {
                "clickable" => element.clickable.unwrap_or(false),
                "text" => element.text.as_ref().map_or(false, |text| text.contains(&search_value)),
                "resource_id" => element.resource_id.as_ref().map_or(false, |id| id.contains(&search_value)),
                "content_desc" => element.content_desc.as_ref().map_or(false, |desc| desc.contains(&search_value)),
                "class" => element.class.as_ref().map_or(false, |class| class.contains(&search_value)),
                _ => false,
            }
        })
        .collect();
    
    println!("🔍 找到 {} 个匹配的UI元素", matching_elements.len());
    Ok(matching_elements)
}

/// 展开压缩的XML内容
fn expand_compressed_xml(compressed_xml: &str) -> String {
    // 在关键标签前后添加换行符，使XML更易解析
    let mut expanded = compressed_xml.to_string();
    
    // 在标签开始前添加换行
    let patterns = [
        r"<node",
        r"</node>",
        r"<hierarchy",
        r"</hierarchy>",
    ];
    
    for pattern in &patterns {
        expanded = expanded.replace(pattern, &format!("\n{}", pattern));
    }
    
    // 在属性间添加空格，确保解析正确
    expanded = expanded.replace("\" ", "\" ");
    expanded = expanded.replace("\"><", "\">\n<");
    
    println!("✅ XML展开完成，从 {} 字符扩展到 {} 字符", compressed_xml.len(), expanded.len());
    
    expanded
}