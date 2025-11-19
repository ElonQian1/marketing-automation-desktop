// src/services/vcf/mod.rs
// VCF 导入模块 - 多品牌策略 + 智能打开器
//
// 模块职责：
// 1. VCF 文件生成和解析（vcf_utils）
// 2. 多品牌导入策略执行（vcf_importer + vcf_strategies + vcf_types）
// 3. UI 自动化备用方案（vcf_smart_opener）

mod vcf_importer;
mod vcf_strategies;
mod vcf_types;
mod vcf_utils;
mod vcf_smart_opener;

// 公开核心类型和函数
pub use vcf_importer::MultiBrandVcfImporter;
pub use vcf_strategies::*;
pub use vcf_types::{
    DeviceBrandInfo,
    VcfImportStrategy,
    ImportMethod,
    ImportStepType,
    MultiBrandImportResult,
    ImportAttempt,
};
pub use vcf_utils::{Contact, VcfOpenResult, VcfImportResult, generate_vcf_file};
pub use vcf_smart_opener::smart_vcf_opener;
