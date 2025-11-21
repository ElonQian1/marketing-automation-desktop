// src/exec/v3/semantic_analyzer/mod.rs
// module: semantic-analyzer | layer: domain | role: 语义分析模块入口
// summary: 提供文本语义分析和反义词检测功能的统一入口

pub mod config;
pub mod analyzer;
pub mod antonym_detector;

#[cfg(test)]
mod test;

pub use analyzer::*;
