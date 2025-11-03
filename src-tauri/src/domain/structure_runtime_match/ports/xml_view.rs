// src-tauri/src/domain/structure_runtime_match/ports/xml_view.rs
// module: structure_runtime_match | layer: domain | role: XML视图接口
// summary: 适配XmlIndexer的trait定义 - 算法内核只依赖这个接口

use crate::domain::structure_runtime_match::types::{SmBounds, SmNodeId};

/// 适配你的 XmlIndexer；算法内核只依赖这个 trait
pub trait SmXmlView {
    fn xml_hash(&self) -> &str;
    fn container_candidates(&self) -> Vec<SmNodeId>;
    fn bounds(&self, n: SmNodeId) -> SmBounds;
    fn parent(&self, n: SmNodeId) -> Option<SmNodeId>;
    fn children(&self, n: SmNodeId) -> Vec<SmNodeId>;
    fn class(&self, n: SmNodeId) -> &str;
    fn text(&self, n: SmNodeId) -> &str;
    fn attr(&self, n: SmNodeId, k: &str) -> Option<&str>;
    fn pre(&self, n: SmNodeId) -> u32;
    fn post(&self, n: SmNodeId) -> u32;
}
