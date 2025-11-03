// src-tauri/src/commands/run_step_v2/types/evidence.rs
// module: step-execution | layer: types | role: 证据类型
// summary: 静态证据数据结构 - 评分依据、分析上下文等

/// 静态证据包结构（前端传递给后端的评分依据）
#[derive(Debug, Clone)]
pub struct StaticEvidence {
    pub resource_id: Option<String>,
    pub xpath: Option<String>,
    pub text: Option<Vec<String>>,          // I18N别名集合
    pub content_desc: Option<String>,
    pub class_name: Option<String>,
    pub container_scoped: bool,             // 是否容器限定
    pub parent_clickable: bool,             // 父节点可点击
    pub local_index: Option<i32>,           // 局部索引
    pub global_index: Option<i32>,          // 全局索引
    pub has_light_checks: bool,             // 是否有轻校验
}
