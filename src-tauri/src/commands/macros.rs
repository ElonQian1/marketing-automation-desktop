// src-tauri/src/commands/macros.rs
// module: commands | layer: application | role: 命令注册宏
// summary: 通过宏简化 Tauri 命令的分组注册

/// 🎯 分组命令注册宏
/// 
/// 使用方式：
/// ```rust
/// register_command_group!(builder, "ADB", [
///     execute_adb_command,
///     get_adb_devices,
///     connect_adb_device,
/// ])
/// ```
#[macro_export]
macro_rules! register_command_group {
    ($builder:expr, $group_name:literal, [$($cmd:path),+ $(,)?]) => {{
        use tracing::info;
        
        let commands = vec![$(stringify!($cmd)),+];
        info!("📝 注册 {} 命令组: {} 个命令", $group_name, commands.len());
        for cmd_name in &commands {
            info!("  ├─ {}", cmd_name);
        }
        
        $builder.invoke_handler(tauri::generate_handler![$($cmd),+])
    }};
}

/// 🎯 多组命令统一注册宏
/// 
/// 使用方式：
/// ```rust
/// register_all_commands!(builder, {
///     "ADB" => [execute_adb_command, get_adb_devices],
///     "Contact" => [parse_contact_file, import_contact_numbers],
/// })
/// ```  
#[macro_export]
macro_rules! register_all_commands {
    ($builder:expr, {
        $($group_name:literal => [$($cmd:path),+ $(,)?]),+ $(,)?
    }) => {{
        use tracing::info;
        
        let mut total_commands = 0;
        info!("🔧 开始注册所有命令组...");
        
        $(
            let commands = vec![$(stringify!($cmd)),+];
            total_commands += commands.len();
            info!("✅ {} 组: {} 个命令", $group_name, commands.len());
        )+
        
        info!("🎉 总计注册 {} 个 Tauri 命令", total_commands);
        
        $builder.invoke_handler(tauri::generate_handler![
            $($($cmd),+),+
        ])
    }};
}