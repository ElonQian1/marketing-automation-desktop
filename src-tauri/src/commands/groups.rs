// src-tauri/src/commands/groups.rs
// module: commands | layer: application | role: 命令分组定义
// summary: 定义 Tauri 命令的业务分组结构

use serde::{Deserialize, Serialize};

/// 🎯 命令分组枚举 - 按业务域划分
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum CommandGroup {
    // 🏢 核心业务
    EmployeeManagement,     // 员工管理
    ContactCore,           // 联系人核心
    ContactManagement,     // 联系人管理  
    VcfOperations,         // VCF文件操作
    
    // 🔧 基础设施
    AdbCore,              // ADB核心功能
    AdbExtended,          // ADB扩展功能
    FileOperations,       // 文件操作
    CacheManagement,      // 缓存管理
    
    // 🚀 自动化引擎  
    UiAutomation,         // UI自动化
    PageAnalysis,         // 页面分析
    ScriptManagement,     // 脚本管理
    ExecutionControl,     // 执行控制
    
    // 🧠 智能分析
    IntelligentAnalysisV2,  // 智能分析V2
    IntelligentAnalysisV3,  // 智能分析V3  
    SmartSelection,         // 智能选择
    
    // 🎯 精准获客
    ProspectingCore,       // 精准获客核心
    
    // 🤖 AI功能
    AIServices,           // AI服务
    
    // 🔍 系统诊断
    SystemDiagnostics,    // 系统诊断
    LogManagement,        // 日志管理
    
    // 🔮 实验性功能
    ContainerScoping,     // 容器限域（新功能）
    AnalysisCache,        // 分析缓存（Phase 3）
}

impl CommandGroup {
    /// 获取分组的友好名称
    pub fn display_name(&self) -> &'static str {
        match self {
            Self::EmployeeManagement => "员工管理",
            Self::ContactCore => "联系人核心",
            Self::ContactManagement => "联系人管理",
            Self::VcfOperations => "VCF文件操作",
            Self::AdbCore => "ADB核心功能", 
            Self::AdbExtended => "ADB扩展功能",
            Self::FileOperations => "文件操作",
            Self::CacheManagement => "缓存管理",
            Self::UiAutomation => "UI自动化",
            Self::PageAnalysis => "页面分析",
            Self::ScriptManagement => "脚本管理", 
            Self::ExecutionControl => "执行控制",
            Self::IntelligentAnalysisV2 => "智能分析V2",
            Self::IntelligentAnalysisV3 => "智能分析V3",
            Self::SmartSelection => "智能选择",
            Self::ProspectingCore => "精准获客",
            Self::AIServices => "AI服务",
            Self::SystemDiagnostics => "系统诊断",
            Self::LogManagement => "日志管理",
            Self::ContainerScoping => "容器限域",
            Self::AnalysisCache => "分析缓存",
        }
    }
    
    /// 获取分组的描述
    pub fn description(&self) -> &'static str {
        match self {
            Self::EmployeeManagement => "员工信息的增删改查操作",
            Self::ContactCore => "联系人文件解析、导入等核心功能",
            Self::ContactManagement => "联系人数据管理、标记、统计",
            Self::VcfOperations => "VCF文件生成、导入、验证操作",
            Self::AdbCore => "ADB连接、设备管理、基础命令",
            Self::AdbExtended => "设备属性、追踪、安全命令操作",
            Self::FileOperations => "文件读写、对话框、管理器操作",
            Self::CacheManagement => "快照缓存、清理、统计管理",
            Self::UiAutomation => "UI状态读取、元素查找、点击操作",
            Self::PageAnalysis => "页面元素分析、分类、配置验证",
            Self::ScriptManagement => "自动化脚本保存、加载、执行",
            Self::ExecutionControl => "步骤执行、中断、强制停止控制",
            Self::IntelligentAnalysisV2 => "V2版本智能分析和策略绑定",
            Self::IntelligentAnalysisV3 => "V3版本智能分析和测试执行",
            Self::SmartSelection => "智能选择协议和候选项预览",
            Self::ProspectingCore => "精准获客评论、分析、统计功能",
            Self::AIServices => "AI模型配置、对话、嵌入服务",
            Self::SystemDiagnostics => "后端健康检查、环境诊断",
            Self::LogManagement => "日志获取、过滤、清理操作",
            Self::ContainerScoping => "UI容器限域检测和范围解析",
            Self::AnalysisCache => "分析缓存版本控制和快照管理",
        }
    }
}

/// 🔄 命令注册统计信息
#[derive(Debug, Clone, Serialize)]
pub struct CommandRegistrationStats {
    pub total_groups: usize,
    pub total_commands: usize,  
    pub groups_by_category: std::collections::HashMap<String, Vec<String>>,
    pub registration_time: chrono::DateTime<chrono::Utc>,
}

/// 📊 分组命令统计
#[derive(Debug, Clone, Serialize)]
pub struct GroupStats {
    pub group: CommandGroup,
    pub command_count: usize,
    pub commands: Vec<String>,
}