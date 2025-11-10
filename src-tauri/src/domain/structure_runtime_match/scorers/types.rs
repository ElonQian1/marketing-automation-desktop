// src-tauri/src/domain/structure_runtime_match/scorers/types.rs
// module: structure_runtime_match | layer: domain | role: 三路评分公共类型
// summary: 定义匹配模式、评分结果、特征提取等核心类型

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MatchMode { 
    CardSubtree,   // 子孙骨架匹配：卡片根/可点父等有层级元素
    LeafContext,   // 叶子上下文匹配：点赞/头像等无子孙小控件  
    TextExact      // 文本强等值匹配：关注/已关注等稳定按钮
}

impl MatchMode {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::CardSubtree => "CardSubtree",
            Self::LeafContext => "LeafContext", 
            Self::TextExact => "TextExact",
        }
    }
    
    pub fn display_name(&self) -> &'static str {
        match self {
            Self::CardSubtree => "子孙骨架",
            Self::LeafContext => "叶子上下文",
            Self::TextExact => "文本强等值",
        }
    }
}

#[derive(Debug, Clone)]
pub struct ScoreOutcome {
    pub mode: MatchMode,
    pub conf: f32,          // 0.0-1.0 置信度
    pub passed_gate: bool,  // 是否通过闸门
    pub explain: String,    // 解释文本，用于模态框展示
}

#[derive(Debug, Clone)]
pub struct SubtreeFeatures {
    pub has_desc_on_root: bool,     // 卡片根是否有content-desc
    pub has_clickable_parent: bool, // 是否有可点击父容器
    pub has_media_area: bool,       // 是否有媒体区域
    pub has_bottom_bar: bool,       // 是否有底栏
    pub media_ratio: f32,           // 媒体区高度占比 0..1
    pub bottom_bar_pos: f32,        // 底栏位置比例 0..1
}

#[derive(Debug, Clone)]
pub struct ContextSig {
    pub class: String,                          // 节点类名
    pub clickable: bool,                        // 是否可点击
    pub ancestor_classes: Vec<String>,          // 祖先链类名
    pub sibling_shape: Vec<(String, bool)>,     // 兄弟节点形态(类名, 可点击性)
    pub sibling_index: usize,                   // 在兄弟中的位置
    pub rel_xywh: (f32, f32, f32, f32),        // 相对父容器的几何位置(x,y,w,h)
    pub has_text: bool,                         // 是否有文本内容
    pub has_desc: bool,                         // 是否有content-desc
    pub has_res_id: bool,                       // 是否有resource-id
}