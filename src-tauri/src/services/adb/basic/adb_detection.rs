use super::adb_core::AdbService;
use tracing::{info, warn};

impl AdbService {
    /// 获取项目内的 ADB 路径（最高优先级）
    /// 
    /// 搜索顺序：
    /// 1. 当前工作目录/platform-tools/adb.exe
    /// 2. 父级目录/platform-tools/adb.exe
    /// 3. 可执行文件路径及其上级目录
    fn get_project_adb_path() -> Option<String> {
        // 尝试从当前工作目录开始查找
        if let Ok(current_dir) = std::env::current_dir() {
            // 首先尝试当前目录的 platform-tools
            let adb_path = current_dir.join("platform-tools").join("adb.exe");
            info!("🔍 检查当前目录ADB路径: {:?}", adb_path);
            if adb_path.exists() {
                info!("✅ 找到当前目录ADB路径");
                return adb_path.to_str().map(|s| s.to_string());
            }
            
            // 然后尝试上级目录的 platform-tools（处理从src-tauri运行的情况）
            if let Some(parent_dir) = current_dir.parent() {
                let parent_adb_path = parent_dir.join("platform-tools").join("adb.exe");
                info!("🔍 检查父级目录ADB路径: {:?}", parent_adb_path);
                if parent_adb_path.exists() {
                    info!("✅ 找到父级目录ADB路径");
                    return parent_adb_path.to_str().map(|s| s.to_string());
                }
            }
        }

        // 尝试从可执行文件路径查找
        if let Ok(exe_path) = std::env::current_exe() {
            info!("🔍 从可执行文件路径查找: {:?}", exe_path);
            // 从exe路径向上查找项目根目录
            let mut parent = exe_path.parent();
            while let Some(dir) = parent {
                let adb_path = dir.join("platform-tools").join("adb.exe");
                if adb_path.exists() {
                    info!("✅ 找到可执行文件相对ADB路径");
                    return adb_path.to_str().map(|s| s.to_string());
                }
                
                // 也检查上级目录
                if let Some(parent_dir) = dir.parent() {
                    let parent_adb_path = parent_dir.join("platform-tools").join("adb.exe");
                    if parent_adb_path.exists() {
                        info!("✅ 找到可执行文件上级相对ADB路径");
                        return parent_adb_path.to_str().map(|s| s.to_string());
                    }
                }
                
                parent = dir.parent();
            }
        }

        warn!("⚠️ 未找到项目内的ADB路径");
        None
    }

    /// 检查路径是否在雷电模拟器黑名单中
    /// 雷电模拟器的 ADB 已知存在崩溃问题，应避免使用
    fn is_ldplayer_blacklisted(path: &str) -> bool {
        path.to_lowercase().contains("leidian") || 
        path.to_lowercase().contains("ldplayer")
    }

    /// 智能 ADB 路径检测（整合 SafeAdbManager 特性）
    /// 
    /// 优先级顺序：
    /// 1. 项目内 platform-tools（最安全，官方 Google Platform Tools）
    /// 2. 系统 PATH 中的 ADB
    /// 3. 标准 Android SDK 安装路径
    /// 4. 雷电模拟器路径（仅作为最后回退，且会跳过已知有问题的版本）
    pub fn detect_ldplayer_adb(&self) -> Option<String> {
        info!("🔍 开始智能ADB路径检测...");
        
        // 1. 最高优先级：项目内的 ADB（避免使用模拟器自带的有问题版本）
        if let Some(project_path) = Self::get_project_adb_path() {
            if self.validate_adb_path(&project_path) {
                info!("✅ 使用项目内ADB路径（最高优先级）: {}", project_path);
                return Some(project_path);
            }
        }
        
        // 预先生成格式化路径以避免生命周期问题
        let user_profile = std::env::var("USERPROFILE").unwrap_or_default();
        let temp_dir = std::env::var("TEMP").unwrap_or_default();

        let user_adb_path = format!("{}\\ADB\\adb.exe", user_profile);
        let temp_platform_tools_path = format!("{}\\platform-tools\\adb.exe", temp_dir);
        let android_sdk_path = format!("{}\\Android\\Sdk\\platform-tools\\adb.exe", user_profile);
        let local_android_sdk_path = format!(
            "{}\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe",
            user_profile
        );

        // 智能ADB路径检测 - 优先级顺序
        let adb_paths = vec![
            // 2. 系统PATH中的ADB
            "adb.exe",
            "adb",
            
            // 3. 系统ADB路径
            user_adb_path.as_str(),
            temp_platform_tools_path.as_str(),
            android_sdk_path.as_str(),
            local_android_sdk_path.as_str(),
            
            // 4. 雷电模拟器路径（仅作为最后回退，会被黑名单过滤）
            "C:\\LDPlayer\\LDPlayer9\\adb.exe",
            "C:\\LDPlayer\\LDPlayer4\\adb.exe",
            "D:\\LDPlayer\\LDPlayer9\\adb.exe",
            "D:\\LDPlayer\\LDPlayer4\\adb.exe",
            "E:\\LDPlayer\\LDPlayer9\\adb.exe",
            "E:\\LDPlayer\\LDPlayer4\\adb.exe",
        ];

        for path in adb_paths {
            // 跳过雷电模拟器黑名单路径
            if Self::is_ldplayer_blacklisted(path) {
                warn!("⚠️ 跳过雷电模拟器ADB (已知崩溃问题): {}", path);
                continue;
            }
            
            if self.check_file_exists(path) {
                info!("🧪 测试ADB路径: {}", path);
                
                // 验证路径可用性
                if self.validate_adb_path(path) {
                    info!("✅ 找到可用的ADB: {}", path);
                    
                    // 如果是相对路径，尝试转换为绝对路径
                    if path.starts_with("platform-tools") {
                        if let Ok(current_dir) = std::env::current_dir() {
                            let absolute_path = current_dir.join(path);
                            if absolute_path.exists() {
                                return Some(absolute_path.to_string_lossy().to_string());
                            }
                        }
                        return Some(path.to_string());
                    }
                    return Some(path.to_string());
                } else {
                    warn!("⚠️ ADB路径存在但验证失败: {}", path);
                }
            }
        }

        warn!("❌ 未找到可用的ADB路径");
        None
    }

    /// 检测智能ADB路径
    /// 更通用的ADB路径检测方法，不仅限于雷电模拟器
    pub fn detect_smart_adb_path(&self) -> Option<String> {
        // 重用现有的检测逻辑
        self.detect_ldplayer_adb()
    }

    /// 验证ADB路径是否有效
    pub fn validate_adb_path(&self, adb_path: &str) -> bool {
        if !self.check_file_exists(adb_path) {
            return false;
        }

        // 尝试执行ADB版本命令来验证可用性
        match self.execute_command(adb_path, &["version".to_string()]) {
            Ok(_) => true,
            Err(_) => false,
        }
    }

    /// 获取ADB版本信息
    pub fn get_adb_version(&self, adb_path: &str) -> Result<String, Box<dyn std::error::Error>> {
        self.execute_command(adb_path, &["version".to_string()])
    }
}