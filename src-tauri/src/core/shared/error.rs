// src-tauri/src/core/shared/error.rs
// module: core/shared | layer: shared | role: error-types
// summary: 统一错误类型定义

use serde::{Deserialize, Serialize};
use std::fmt;

/// 核心错误类型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoreError {
    pub code: ErrorCode,
    pub message: String,
    pub details: Option<String>,
}

/// 错误码枚举
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ErrorCode {
    // 通用错误
    Unknown,
    InvalidInput,
    NotFound,
    AlreadyExists,
    NotConfigured,
    Internal,
    ExternalService,
    
    // 脚本相关
    ScriptNotFound,
    ScriptInvalid,
    ScriptExecutionFailed,
    
    // 设备相关
    DeviceNotConnected,
    DeviceCommandFailed,
    DeviceError,
    
    // IO 相关
    FileReadError,
    FileWriteError,
    NetworkError,
}

impl CoreError {
    pub fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            details: None,
        }
    }

    pub fn with_details(mut self, details: impl Into<String>) -> Self {
        self.details = Some(details.into());
        self
    }

    // 快捷构造函数
    pub fn not_found(resource: &str, id: &str) -> Self {
        Self::new(
            ErrorCode::NotFound,
            format!("{} 不存在: {}", resource, id),
        )
    }

    pub fn script_not_found(id: &str) -> Self {
        Self::new(ErrorCode::ScriptNotFound, format!("脚本不存在: {}", id))
    }

    pub fn invalid_input(msg: impl Into<String>) -> Self {
        Self::new(ErrorCode::InvalidInput, msg)
    }

    pub fn not_configured(msg: impl Into<String>) -> Self {
        Self::new(ErrorCode::NotConfigured, msg)
    }

    pub fn internal(msg: impl Into<String>) -> Self {
        Self::new(ErrorCode::Internal, msg)
    }

    pub fn external_service(msg: impl Into<String>) -> Self {
        Self::new(ErrorCode::ExternalService, msg)
    }
}

impl fmt::Display for CoreError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{:?}] {}", self.code, self.message)?;
        if let Some(ref details) = self.details {
            write!(f, " ({})", details)?;
        }
        Ok(())
    }
}

impl std::error::Error for CoreError {}

impl From<std::io::Error> for CoreError {
    fn from(err: std::io::Error) -> Self {
        CoreError::new(ErrorCode::FileReadError, err.to_string())
    }
}

impl From<serde_json::Error> for CoreError {
    fn from(err: serde_json::Error) -> Self {
        CoreError::new(ErrorCode::InvalidInput, err.to_string())
    }
}

impl From<anyhow::Error> for CoreError {
    fn from(err: anyhow::Error) -> Self {
        CoreError::new(ErrorCode::Unknown, err.to_string())
    }
}

/// 核心结果类型
pub type CoreResult<T> = Result<T, CoreError>;
