// src/services/vcf/mod.rs
// VCF 导入模块 - 多品牌策略 + 智能打开器
//
// 模块职责：
// 1. VCF 文件生成和解析（utils）
// 2. 多品牌导入策略执行（importer + strategies + types）
// 3. UI 自动化备用方案（smart_opener）

mod importer;
mod strategies;
mod types;
mod utils;
mod smart_opener;

// 公开核心类型和函数
pub use importer::MultiBrandVcfImporter;
pub use strategies::*;
pub use types::{
    DeviceBrandInfo,
    VcfImportStrategy,
    ImportMethod,
    ImportStepType,
    MultiBrandImportResult,
    ImportAttempt,
};
pub use utils::{Contact, VcfOpenResult, VcfImportResult, generate_vcf_file};
pub use smart_opener::smart_vcf_opener;
