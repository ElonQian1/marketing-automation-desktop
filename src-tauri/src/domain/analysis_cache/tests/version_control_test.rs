// src-tauri/src/domain/analysis_cache/tests/version_control_test.rs
// module: analysis_cache | layer: domain | role: 版本控制系统测试
// summary: Phase 3 版本控制系统的基础单元测试

#[cfg(test)]
mod tests {
    use crate::domain::analysis_cache::version_control::*;

    #[test]
    fn test_basic_enums() {
        // 测试基本的枚举类型
        let algorithm = DiffAlgorithm::Fast;
        assert_eq!(format!("{:?}", algorithm), "Fast");
        
        let compression = CompressionInfo::default();
        assert_eq!(compression.compression_ratio, 0.0);
        
        let config = VersionControlConfig::default();
        assert!(config.max_versions_per_branch > 0);
    }
}