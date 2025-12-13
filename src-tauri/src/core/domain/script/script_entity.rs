// src-tauri/src/core/domain/script/script_entity.rs
// module: core/domain/script | layer: domain | role: aggregate-root
// summary: Script 聚合根实体 - 脚本的核心业务逻辑

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::step_value_object::ScriptStep;
use crate::core::shared::{CoreError, CoreResult, error::ErrorCode};

/// 脚本聚合根
/// 
/// 这是领域核心，包含所有脚本相关的业务规则
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Script {
    /// 唯一标识符
    pub id: String,
    /// 脚本名称
    pub name: String,
    /// 脚本描述
    pub description: String,
    /// 版本号
    pub version: String,
    /// 创建时间
    pub created_at: DateTime<Utc>,
    /// 更新时间
    pub updated_at: DateTime<Utc>,
    /// 作者
    pub author: String,
    /// 分类
    pub category: String,
    /// 标签
    pub tags: Vec<String>,
    /// 步骤列表
    pub steps: Vec<ScriptStep>,
    /// 执行配置
    pub config: ScriptConfig,
    /// 扩展元数据
    pub metadata: HashMap<String, serde_json::Value>,
}

/// 脚本执行配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScriptConfig {
    /// 遇错是否继续
    pub continue_on_error: bool,
    /// 是否启用自动验证
    pub auto_verification_enabled: bool,
    /// 是否启用智能恢复
    pub smart_recovery_enabled: bool,
    /// 是否启用详细日志
    pub detailed_logging: bool,
}

impl Default for ScriptConfig {
    fn default() -> Self {
        Self {
            continue_on_error: true,
            auto_verification_enabled: true,
            smart_recovery_enabled: true,
            detailed_logging: true,
        }
    }
}

/// 脚本摘要（用于列表展示）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScriptSummary {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub tags: Vec<String>,
    pub step_count: usize,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// 脚本元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScriptMetadata {
    pub total_executions: u32,
    pub success_rate: f32,
    pub average_duration_ms: u64,
    pub last_executed_at: Option<DateTime<Utc>>,
}

impl Script {
    /// 创建新脚本
    pub fn new(name: impl Into<String>, description: impl Into<String>) -> Self {
        let now = Utc::now();
        let id = format!("script_{}", now.timestamp_millis());
        
        Self {
            id,
            name: name.into(),
            description: description.into(),
            version: "1.0.0".to_string(),
            created_at: now,
            updated_at: now,
            author: "用户".to_string(),
            category: "通用".to_string(),
            tags: vec![],
            steps: vec![],
            config: ScriptConfig::default(),
            metadata: HashMap::new(),
        }
    }

    /// 验证脚本是否有效
    pub fn validate(&self) -> CoreResult<()> {
        // 规则1: 名称不能为空
        if self.name.trim().is_empty() {
            return Err(CoreError::invalid_input("脚本名称不能为空"));
        }

        // 规则2: 至少有一个步骤
        if self.steps.is_empty() {
            return Err(CoreError::new(
                ErrorCode::ScriptInvalid,
                "脚本至少需要一个步骤",
            ));
        }

        // 规则3: 验证每个步骤
        for (index, step) in self.steps.iter().enumerate() {
            step.validate().map_err(|e| {
                CoreError::new(
                    ErrorCode::ScriptInvalid,
                    format!("步骤 {} 无效: {}", index + 1, e),
                )
            })?;
        }

        Ok(())
    }

    /// 添加步骤
    pub fn add_step(&mut self, step: ScriptStep) {
        self.steps.push(step);
        self.updated_at = Utc::now();
    }

    /// 移除步骤
    pub fn remove_step(&mut self, index: usize) -> Option<ScriptStep> {
        if index < self.steps.len() {
            self.updated_at = Utc::now();
            Some(self.steps.remove(index))
        } else {
            None
        }
    }

    /// 获取步骤数量
    pub fn step_count(&self) -> usize {
        self.steps.len()
    }

    /// 转换为摘要
    pub fn to_summary(&self) -> ScriptSummary {
        ScriptSummary {
            id: self.id.clone(),
            name: self.name.clone(),
            description: self.description.clone(),
            category: self.category.clone(),
            tags: self.tags.clone(),
            step_count: self.steps.len(),
            created_at: self.created_at,
            updated_at: self.updated_at,
        }
    }

    /// 更新时间戳
    pub fn touch(&mut self) {
        self.updated_at = Utc::now();
    }
}

impl Default for Script {
    fn default() -> Self {
        Self::new("新建脚本", "")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_script_creation() {
        let script = Script::new("测试脚本", "这是一个测试");
        assert!(!script.id.is_empty());
        assert_eq!(script.name, "测试脚本");
        assert!(script.steps.is_empty());
    }

    #[test]
    fn test_script_validation_empty_name() {
        let mut script = Script::new("", "描述");
        let result = script.validate();
        assert!(result.is_err());
    }

    #[test]
    fn test_script_validation_no_steps() {
        let script = Script::new("有效名称", "描述");
        let result = script.validate();
        assert!(result.is_err());
    }
}
