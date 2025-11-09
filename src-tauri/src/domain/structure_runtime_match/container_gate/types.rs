// src-tauri/src/domain/structure_runtime_match/container_gate/types.rs
// module: structure_runtime_match | layer: domain | role: 容器限域核心类型
// summary: 公共类型与 UiTree 抽象（最小必要接口）

use serde::{Serialize, Deserialize};

pub type NodeId = u32;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, Default)]
pub struct Bounds { 
    pub l: i32, 
    pub t: i32, 
    pub r: i32, 
    pub b: i32 
}

impl Bounds {
    #[inline] 
    pub fn width(&self) -> i32 { 
        (self.r - self.l).max(0) 
    }
    
    #[inline] 
    pub fn height(&self) -> i32 { 
        (self.b - self.t).max(0) 
    }
    
    #[inline] 
    pub fn area(&self) -> i64 { 
        (self.width() as i64) * (self.height() as i64) 
    }
    
    #[inline] 
    pub fn contains(&self, other: &Bounds) -> bool {
        self.l <= other.l && self.t <= other.t && self.r >= other.r && self.b >= other.b
    }
    
    #[inline] 
    pub fn iou(&self, other: &Bounds) -> f32 {
        let x1 = self.l.max(other.l);
        let y1 = self.t.max(other.t);
        let x2 = self.r.min(other.r);
        let y2 = self.b.min(other.b);
        let inter_w = (x2 - x1).max(0);
        let inter_h = (y2 - y1).max(0);
        let inter = (inter_w as i64 * inter_h as i64) as f32;
        let union = (self.area() + other.area() - inter as i64).max(1) as f32;
        inter / union
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ContainerHints {
    pub container_xpath: Option<String>,       // 卡片已知的容器 XPath（强提示）
    pub selected_element_id: Option<String>,   // 前端选中的元素ID（如"element_32"）
    pub bounds: Option<Bounds>,                // 卡片提供的容器屏幕区域（强/弱提示）
    pub ancestor_sign_chain: Vec<String>,      // 祖先签名链（弱提示，语义/类名片段等）
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerScope {
    pub root_id: NodeId,            // 选中的容器根节点
    pub reason: String,             // 说明为何选择它（便于审计）
    pub confidence: f32,            // 0..1
    pub profile_used: ScopeProfile, // Speed | Default | Robust
    pub trail: Vec<String>,         // 决策轨迹（若干候选与得分）
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum ScopeProfile { 
    Speed, 
    Default, 
    Robust 
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerConfig {
    pub profile: ScopeProfile,
    pub max_fullscreen_ratio: f32,  // >0.95 视为整屏，默认排除（除非确认为正确）
    pub min_area_ratio: f32,        // <0.05 过小或过薄，默认排除
    pub prefer_scrollable: bool,    // 是否给滚动容器加权
    pub enable_popup_priority: bool,// Dialog/BottomSheet 优先
}

impl Default for ContainerConfig {
    fn default() -> Self {
        Self {
            profile: ScopeProfile::Default,
            max_fullscreen_ratio: 0.95,
            min_area_ratio: 0.05,
            prefer_scrollable: true,
            enable_popup_priority: true,
        }
    }
}

/// 候选项（启发式输出）
#[derive(Debug, Clone)]
pub struct HeuristicResult {
    pub node: NodeId,
    pub score: f32,     // 局部分（0..1或更高，聚合层会归一/加权）
    pub tag: &'static str, // 标注来源：scrollable/semantic/geometry/…
    pub note: String,   // 附加说明
}

/// 统一的 UI 树抽象（最小必要接口）
/// 你可以在适配层实现：`impl UiTree for YourUiTree { … }`
pub trait UiTree {
    fn root_id(&self) -> NodeId;
    fn parent(&self, id: NodeId) -> Option<NodeId>;
    fn children(&self, id: NodeId) -> Vec<NodeId>;

    fn class(&self, id: NodeId) -> &str;
    fn element_id(&self, id: NodeId) -> Option<&str>;  // ✅ 新增: 获取元素的id属性(如"element_32")
    fn resource_id(&self, id: NodeId) -> Option<&str>;
    fn content_desc(&self, id: NodeId) -> Option<&str>;
    fn text(&self, id: NodeId) -> Option<&str>;

    fn bounds(&self, id: NodeId) -> Bounds;
    fn is_clickable(&self, id: NodeId) -> bool;
    fn is_scrollable(&self, id: NodeId) -> bool;
    fn is_dialog_like(&self, id: NodeId) -> bool; // Dialog/BottomSheet/Sheet 等

    fn node_by_xpath(&self, xpath: &str) -> Option<NodeId>;
    fn node_count(&self) -> usize;  // ✅ 新增: 获取节点总数,用于遍历
    fn screen_size(&self) -> (i32, i32); // (w, h)

    /// 便利函数：锚点是否在某节点子树内（结构判断）
    fn is_ancestor_of(&self, ancestor: NodeId, mut node: NodeId) -> bool {
        while let Some(p) = self.parent(node) {
            if p == ancestor { 
                return true; 
            }
            node = p;
        }
        false
    }
    
    /// 便利函数：沿祖先向上迭代（含自己，不含 root 之后）
    fn walk_ancestors(&self, mut node: NodeId) -> Vec<NodeId> {
        let mut v = vec![node];
        while let Some(p) = self.parent(node) {
            v.push(p);
            node = p;
        }
        v
    }
    
    /// 便利：节点面积占屏占比
    fn area_ratio(&self, id: NodeId) -> f32 {
        let (w, h) = self.screen_size();
        let vp = Bounds { l: 0, t: 0, r: w, b: h };
        self.bounds(id).area() as f32 / (vp.area().max(1) as f32)
    }
}