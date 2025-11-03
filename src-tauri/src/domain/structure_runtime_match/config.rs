// src-tauri/src/domain/structure_runtime_match/config.rs
// module: structure_runtime_match | layer: domain | role: 配置模型
// summary: 结构匹配的配置选项 - 模式/早停开关/骨架规则/字段规则

use super::types::SmLayoutType;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum SmMode {
    Speed,
    Default,
    Robust,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct SkeletonRules {
    pub require_image_above_text: bool,
    pub allow_depth_flex: i32, // 层级弹性 ±N
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct FieldRule {
    pub class_contains: Option<String>,
    pub must_equal_text: Option<String>,
    pub presence_only: bool, // 仅要求"存在/非空"
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct FieldRules {
    pub rules: Vec<FieldRule>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ContainerHint {
    pub xpath: Option<String>,
    pub fingerprint: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SmConfig {
    pub mode: SmMode,
    pub allowed_layouts: Option<Vec<SmLayoutType>>, // None=Auto
    pub skip_geometry: bool,                        // 早停1：已知版式
    pub skip_template_when_single: bool,            // 早停2：单目标时跳过模板
    pub strict_skeleton_only: bool,                 // 早停3：只跑骨架（极速）
    pub min_confidence: f32,                        // 默认 0.70
    pub container_hint: Option<ContainerHint>,
    pub skeleton_rules: SkeletonRules,
    pub field_rules: FieldRules,
}

impl Default for SmConfig {
    fn default() -> Self {
        Self {
            mode: SmMode::Default,
            allowed_layouts: None,
            skip_geometry: false,
            skip_template_when_single: false,
            strict_skeleton_only: false,
            min_confidence: 0.70,
            container_hint: None,
            skeleton_rules: SkeletonRules {
                require_image_above_text: true,
                allow_depth_flex: 1,
            },
            field_rules: FieldRules::default(),
        }
    }
}
