// src-tauri/src/commands/registry.rs
// module: commands | layer: application | role: 命令注册器
// summary: 分组管理 Tauri 命令注册，避免 main.rs 过于庞大

use tauri::Builder;

/// 命令组特征
pub trait CommandGroup {
    fn register_commands() -> Vec<Box<dyn tauri::command::CommandArg<tauri::Wry>>>;
    fn group_name() -> &'static str;
}

/// ADB 相关命令组
pub struct AdbCommands;
impl CommandGroup for AdbCommands {
    fn register_commands() -> Vec<Box<dyn tauri::command::CommandArg<tauri::Wry>>> {
        vec![
            // ADB 核心命令
            Box::new(super::adb::execute_adb_command),
            Box::new(super::adb::get_adb_devices),
            Box::new(super::adb::get_adb_version),
            Box::new(super::adb::connect_adb_device),
            Box::new(super::adb::disconnect_adb_device),
            // ... 其他 ADB 命令
        ]
    }
    
    fn group_name() -> &'static str {
        "ADB"
    }
}

/// 联系人管理命令组
pub struct ContactCommands;
impl CommandGroup for ContactCommands {
    fn register_commands() -> Vec<Box<dyn tauri::command::CommandArg<tauri::Wry>>> {
        vec![
            // 联系人相关命令
            // Box::new(contact_commands::parse_contact_file),
            // Box::new(contact_commands::import_contact_numbers_from_file),
            // ... 其他联系人命令
        ]
    }
    
    fn group_name() -> &'static str {
        "Contact"
    }
}

/// UI 自动化命令组
pub struct UIAutomationCommands;
impl CommandGroup for UIAutomationCommands {
    fn register_commands() -> Vec<Box<dyn tauri::command::CommandArg<tauri::Wry>>> {
        vec![
            // UI 自动化命令
            // Box::new(ui_commands::smart_element_finder),
            // Box::new(ui_commands::execute_universal_ui_click),
            // ... 其他 UI 命令
        ]
    }
    
    fn group_name() -> &'static str {
        "UI_Automation"
    }
}

/// 智能分析命令组
pub struct IntelligentAnalysisCommands;
impl CommandGroup for IntelligentAnalysisCommands {
    fn register_commands() -> Vec<Box<dyn tauri::command::CommandArg<tauri::Wry>>> {
        vec![
            Box::new(super::intelligent_analysis::start_intelligent_analysis),
            Box::new(super::intelligent_analysis::cancel_intelligent_analysis),
            // ... 其他智能分析命令
        ]
    }
    
    fn group_name() -> &'static str {
        "Intelligent_Analysis"
    }
}

/// 🎯 容器限域命令组（新增）
pub struct ContainerScopeCommands;
impl CommandGroup for ContainerScopeCommands {
    fn register_commands() -> Vec<Box<dyn tauri::command::CommandArg<tauri::Wry>>> {
        vec![
            // 未来的容器限域相关命令
            // Box::new(container_commands::resolve_container_scope_cmd),
            // Box::new(container_commands::test_container_detection_cmd),
        ]
    }
    
    fn group_name() -> &'static str {
        "Container_Scope"
    }
}

/// 统一命令注册器
pub struct CommandRegistry;

impl CommandRegistry {
    /// 注册所有命令组
    pub fn register_all(builder: Builder<tauri::Wry>) -> Builder<tauri::Wry> {
        tracing::info!("🔧 开始注册命令组...");
        
        let mut total_commands = 0;
        let builder = builder;
        
        // 注册各个命令组
        let groups = [
            ("ADB", AdbCommands::register_commands()),
            ("Contact", ContactCommands::register_commands()),
            ("UI_Automation", UIAutomationCommands::register_commands()),
            ("Intelligent_Analysis", IntelligentAnalysisCommands::register_commands()),
            ("Container_Scope", ContainerScopeCommands::register_commands()),
        ];
        
        for (group_name, commands) in groups {
            let count = commands.len();
            total_commands += count;
            tracing::info!("✅ 注册 {} 命令组: {} 个命令", group_name, count);
        }
        
        tracing::info!("🎉 总计注册 {} 个 Tauri 命令", total_commands);
        
        // 注意：由于 Tauri 的限制，这里需要使用宏方式
        // 实际实现需要配合宏来简化注册过程
        builder
    }
}

/// 便捷宏：简化命令组注册
#[macro_export]
macro_rules! register_command_groups {
    ($builder:expr, $($group:ty),+ $(,)?) => {{
        let mut builder = $builder;
        $(
            tracing::info!("📝 注册命令组: {}", <$group>::group_name());
            // 这里需要具体的注册实现
        )+
        builder
    }};
}