#![allow(dead_code)]
#![allow(unused_variables)]
#![allow(unused_imports)]

/// Contact Storage Module - 联系人存储模块
/// 
/// 本模块实现了基于DDD架构的联系人存储系统，使用Repository Pattern + Facade Pattern
/// 提供统一的数据访问接口

pub mod models;
pub mod parser;
pub mod queries; 
pub mod commands;
pub mod repositories;
pub mod facade;
pub mod repository_facade;

// 统一的 Facade 接口

// 统一从 commands 模块导入所有命令函数
