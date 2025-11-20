// src-tauri/src/domain/structure_runtime_match/types.rs
// module: structure_runtime_match | layer: domain | role: 核心类型定义
// summary: 结构匹配运行时的数据类型 - SmBounds/SmLayoutType/SmResult等

use serde::{Deserialize, Serialize};

pub type SmNodeId = u32;

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct SmBounds {
    pub left: i32,
    pub top: i32,
    pub right: i32,
    pub bottom: i32,
}

impl SmBounds {
    pub fn width(&self) -> i32 {
        self.right - self.left
    }

    pub fn height(&self) -> i32 {
        self.bottom - self.top
    }

    pub fn area(&self) -> i64 {
        (self.width() as i64) * (self.height() as i64)
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum SmLayoutType {
    WaterfallMulti,
    MasonrySingle,
    UniformGrid,
    List,
    Carousel,
    Unknown,
}

#[derive(Default, Clone, Debug, Serialize, Deserialize)]
pub struct SmScores {
    pub geom: f32,
    pub tpl: f32,
    pub skeleton: f32,
    pub subtree: f32, // 🎯 新增：深度子树结构分
    pub field: f32,
    pub total: f32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SmItemHit {
    pub node: SmNodeId,
    pub bounds: SmBounds,
    pub scores: SmScores,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SmContainerHit {
    pub node: SmNodeId,
    pub bounds: SmBounds,
    pub layout: SmLayoutType,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SmResult {
    pub container: Option<SmContainerHit>,
    pub items: Vec<SmItemHit>,
}
