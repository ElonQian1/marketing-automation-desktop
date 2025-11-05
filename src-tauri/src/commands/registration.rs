// src-tauri/src/commands/registration.rs
// module: commands | layer: infrastructure | role: 命令注册系统
// summary: 基于 CommandGroup 的类型安全命令注册系统

use super::groups::CommandGroup;
use std::collections::HashMap;
use tracing::{info, warn, debug};
use chrono::Utc;

/// 🎯 命令注册统计信息
#[derive(Debug, Clone)]
pub struct RegistrationStats {
    pub total_groups: usize,
    pub total_commands: usize,
    pub groups: HashMap<CommandGroup, Vec<String>>,
    pub registration_time: chrono::DateTime<chrono::Utc>,
    pub duration: std::time::Duration,
}

impl RegistrationStats {
    pub fn new() -> Self {
        Self {
            total_groups: 0,
            total_commands: 0,
            groups: HashMap::new(),
            registration_time: Utc::now(),
            duration: std::time::Duration::default(),
        }
    }
    
    pub fn add_group(&mut self, group: CommandGroup, commands: Vec<String>) {
        self.total_commands += commands.len();
        self.total_groups += 1;
        self.groups.insert(group, commands);
    }
    
    pub fn finish(&mut self, start_time: std::time::Instant) {
        self.duration = start_time.elapsed();
    }
    
    /// 📊 打印详细统计信息
    pub fn log_summary(&self) {
        info!("🎉 Tauri 命令注册完成汇总:");
        info!("  📊 总计: {}个分组, {}个命令", self.total_groups, self.total_commands);
        info!("  ⏱️  总耗时: {:?}", self.duration);
        info!("  📅 注册时间: {}", self.registration_time.format("%Y-%m-%d %H:%M:%S UTC"));
        
        // 按分组类别汇总
        let mut core_count = 0;
        let mut automation_count = 0;
        let mut intelligence_count = 0;
        let mut infrastructure_count = 0;
        
        for (group, commands) in &self.groups {
            let count = commands.len();
            match group {
                CommandGroup::EmployeeManagement | CommandGroup::ContactCore | 
                CommandGroup::ContactManagement | CommandGroup::VcfOperations |
                CommandGroup::ProspectingCore => core_count += count,
                
                CommandGroup::UiAutomation | CommandGroup::PageAnalysis |
                CommandGroup::ScriptManagement | CommandGroup::ExecutionControl => automation_count += count,
                
                CommandGroup::IntelligentAnalysisV2 | CommandGroup::IntelligentAnalysisV3 |
                CommandGroup::SmartSelection | CommandGroup::AIServices => intelligence_count += count,
                
                CommandGroup::AdbCore | CommandGroup::AdbExtended | CommandGroup::FileOperations |
                CommandGroup::CacheManagement | CommandGroup::SystemDiagnostics |
                CommandGroup::LogManagement => infrastructure_count += count,
                
                _ => {}
            }
            
            info!("  📦 {}: {}个命令", group.display_name(), count);
        }
        
        info!("  🏢 核心业务: {}个命令", core_count);
        info!("  🤖 自动化: {}个命令", automation_count);
        info!("  🧠 智能分析: {}个命令", intelligence_count);
        info!("  🔧 基础设施: {}个命令", infrastructure_count);
        
        if self.total_commands > 100 {
            warn!("⚠️ 命令数量较多({}个)，建议考虑进一步模块化", self.total_commands);
        }
    }
}

/// 🔧 增强的单组注册宏
#[macro_export]
macro_rules! register_command_group_enhanced {
    ($builder:expr, $stats:expr, $group:expr, [$($cmd:ident),* $(,)?]) => {
        {
            use tracing::{info, debug};
            
            let group_name = $group.display_name();
            let commands = vec![$(stringify!($cmd)),*];
            let start_time = std::time::Instant::now();
            
            info!("🔄 注册命令组: {} ({} 个命令)", group_name, commands.len());
            debug!("📋 命令详情: {:?}", commands);
            
            let builder = $builder.invoke_handler(tauri::generate_handler![$($cmd),*]);
            
            let elapsed = start_time.elapsed();
            debug!("✅ {} 注册完成 ({:?})", group_name, elapsed);
            
            // 更新统计
            $stats.add_group($group, commands.clone());
            
            builder
        }
    };
}

/// 🚀 终极命令注册宏 - 类型安全 + 完整统计
#[macro_export] 
macro_rules! register_all_commands_ultimate {
    ($builder:expr, { $($group:expr => [$($cmd:ident),* $(,)?]),* $(,)? }) => {
        {
            use $crate::commands::registration::RegistrationStats;
            
            let registration_start = std::time::Instant::now();
            let mut stats = RegistrationStats::new();
            
            info!("🚀 开始注册 Tauri 命令组 (类型安全模式)...");
            
            let mut builder = $builder;
            
            $(
                builder = register_command_group_enhanced!(builder, stats, $group, [$($cmd),*]);
            )*
            
            stats.finish(registration_start);
            stats.log_summary();
            
            builder
        }
    };
}