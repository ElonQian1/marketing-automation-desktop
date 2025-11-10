// src-tauri/src/domain/structure_runtime_match/execution_types.rs
// module: structure_runtime_match | layer: domain | role: 执行类型定义
// summary: 定义自动选型器生成的执行模式类型，支持智能匹配结果到实际执行参数的转换

use serde::{Serialize, Deserialize};

/// 执行点击的具体模式，由自动选型器推荐后转换为实际执行参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClickMode {
    /// 结构层级匹配 - 适用于复杂卡片结构
    StructuralHierarchy {
        /// 卡片根节点边界
        root_bounds: String,
        /// 可点击父节点边界
        clickable_bounds: String,
        /// 层级深度
        hierarchy_depth: usize,
    },
    
    /// 相对位置匹配 - 基于几何位置关系
    RelativePosition {
        /// 参考节点边界
        reference_bounds: String,
        /// 目标节点边界
        target_bounds: String,
        /// 位置类型描述
        position_type: String,
    },
    
    /// 文本增强位置匹配 - 结合文本提示和位置信息
    TextAugmentedPosition {
        /// 文本提示
        text_hint: String,
        /// 备用边界
        fallback_bounds: String,
        /// 上下文描述
        context_description: String,
    },
    
    /// 精确文本匹配 - 基于稳定文本内容
    ExactTextMatch {
        /// 目标文本
        target_text: String,
        /// 文本来源（text/content-desc）
        text_source: String,
        /// 置信度级别
        confidence_level: f32,
        /// 备用边界
        fallback_bounds: String,
    },
    
    /// 容器内索引匹配 - 基于容器内的相对顺序
    ContainerIndexMatch {
        /// 容器边界
        container_bounds: String,
        /// 相对索引（0-based）
        relative_index: usize,
        /// 列信息（左列/右列）
        column_info: Option<ColumnInfo>,
    },
    
    /// 兜底：直接坐标点击
    DirectCoordinate {
        /// 点击坐标
        x: i32,
        y: i32,
        /// 来源描述
        source_description: String,
    },
}

/// 列信息，用于瀑布流等多列布局
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColumnInfo {
    /// 列类型（left/right/center）
    pub column_type: String,
    /// 列内索引
    pub column_index: usize,
    /// 列边界范围
    pub column_bounds: String,
}

/// 执行策略配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionStrategy {
    /// 首选执行模式
    pub primary_mode: ClickMode,
    /// 备用执行模式
    pub fallback_modes: Vec<ClickMode>,
    /// 超时设置（毫秒）
    pub timeout_ms: u32,
    /// 重试次数
    pub retry_count: u32,
}

impl Default for ExecutionStrategy {
    fn default() -> Self {
        Self {
            primary_mode: ClickMode::DirectCoordinate {
                x: 0,
                y: 0,
                source_description: "默认坐标".to_string(),
            },
            fallback_modes: Vec::new(),
            timeout_ms: 5000,
            retry_count: 3,
        }
    }
}

impl ClickMode {
    /// 获取执行模式的描述名称
    pub fn mode_name(&self) -> &'static str {
        match self {
            ClickMode::StructuralHierarchy { .. } => "结构层级匹配",
            ClickMode::RelativePosition { .. } => "相对位置匹配",
            ClickMode::TextAugmentedPosition { .. } => "文本增强位置匹配",
            ClickMode::ExactTextMatch { .. } => "精确文本匹配",
            ClickMode::ContainerIndexMatch { .. } => "容器索引匹配",
            ClickMode::DirectCoordinate { .. } => "直接坐标点击",
        }
    }
    
    /// 获取执行的可靠性评分（0.0-1.0）
    pub fn reliability_score(&self) -> f32 {
        match self {
            ClickMode::StructuralHierarchy { hierarchy_depth, .. } => {
                // 层级越深，可靠性稍有下降，但仍较高
                (0.9 - (*hierarchy_depth as f32 * 0.05)).max(0.7)
            },
            ClickMode::RelativePosition { position_type, .. } => {
                match position_type.as_str() {
                    "bottom-action" | "sibling-context" => 0.85,
                    _ => 0.75,
                }
            },
            ClickMode::TextAugmentedPosition { .. } => 0.80,
            ClickMode::ExactTextMatch { confidence_level, .. } => *confidence_level,
            ClickMode::ContainerIndexMatch { .. } => 0.70,
            ClickMode::DirectCoordinate { .. } => 0.60,
        }
    }
    
    /// 检查是否需要容器上下文
    pub fn requires_container_context(&self) -> bool {
        matches!(self, 
            ClickMode::StructuralHierarchy { .. } |
            ClickMode::RelativePosition { .. } |
            ClickMode::ContainerIndexMatch { .. }
        )
    }
    
    /// 检查是否需要文本内容
    pub fn requires_text_content(&self) -> bool {
        matches!(self, 
            ClickMode::TextAugmentedPosition { .. } |
            ClickMode::ExactTextMatch { .. }
        )
    }
}