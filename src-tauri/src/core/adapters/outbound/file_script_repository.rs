// src-tauri/src/core/adapters/outbound/file_script_repository.rs
// module: core/adapters/outbound | layer: adapters | role: script-persistence
// summary: 文件系统脚本仓储 - 实现 ScriptRepository trait

use async_trait::async_trait;
use std::path::PathBuf;
use tokio::fs;
use tracing::{info, warn, debug};

use crate::core::domain::script::{Script, ScriptSummary, ScriptRepository};
use crate::core::shared::{CoreError, CoreResult, error::ErrorCode};

/// 文件系统脚本仓储
/// 
/// 将脚本保存为 JSON 文件
pub struct FileScriptRepository {
    base_path: PathBuf,
}

impl FileScriptRepository {
    pub fn new(base_path: impl Into<PathBuf>) -> Self {
        Self {
            base_path: base_path.into(),
        }
    }

    /// 获取脚本文件路径
    fn script_path(&self, id: &str) -> PathBuf {
        self.base_path.join(format!("{}.json", id))
    }

    /// 确保目录存在
    async fn ensure_dir(&self) -> CoreResult<()> {
        if !self.base_path.exists() {
            fs::create_dir_all(&self.base_path).await.map_err(|e| {
                CoreError::new(ErrorCode::FileWriteError, format!("创建目录失败: {}", e))
            })?;
        }
        Ok(())
    }
}

#[async_trait]
impl ScriptRepository for FileScriptRepository {
    async fn save(&self, script: &Script) -> CoreResult<String> {
        self.ensure_dir().await?;
        
        let path = self.script_path(&script.id);
        let content = serde_json::to_string_pretty(script)?;
        
        fs::write(&path, content).await.map_err(|e| {
            CoreError::new(ErrorCode::FileWriteError, format!("写入文件失败: {}", e))
        })?;
        
        debug!("💾 脚本已保存: {:?}", path);
        Ok(script.id.clone())
    }

    async fn load(&self, id: &str) -> CoreResult<Script> {
        let path = self.script_path(id);
        
        if !path.exists() {
            return Err(CoreError::script_not_found(id));
        }
        
        let content = fs::read_to_string(&path).await.map_err(|e| {
            CoreError::new(ErrorCode::FileReadError, format!("读取文件失败: {}", e))
        })?;
        
        // 🔥 使用统一加载函数，自动检测并转换脚本格式
        let script = crate::core::domain::script::load_script_from_json(&content)?;
        
        debug!("📂 脚本已加载: {:?} (格式自动检测)", path);
        Ok(script)
    }

    async fn delete(&self, id: &str) -> CoreResult<()> {
        let path = self.script_path(id);
        
        if !path.exists() {
            return Err(CoreError::script_not_found(id));
        }
        
        fs::remove_file(&path).await.map_err(|e| {
            CoreError::new(ErrorCode::FileWriteError, format!("删除文件失败: {}", e))
        })?;
        
        debug!("🗑️ 脚本已删除: {:?}", path);
        Ok(())
    }

    async fn list(&self) -> CoreResult<Vec<ScriptSummary>> {
        self.ensure_dir().await?;
        
        let mut scripts = Vec::new();
        let mut entries = fs::read_dir(&self.base_path).await.map_err(|e| {
            CoreError::new(ErrorCode::FileReadError, format!("读取目录失败: {}", e))
        })?;
        
        while let Some(entry) = entries.next_entry().await.map_err(|e| {
            CoreError::new(ErrorCode::FileReadError, format!("读取目录项失败: {}", e))
        })? {
            let path = entry.path();
            
            if path.extension().map(|e| e == "json").unwrap_or(false) {
                match fs::read_to_string(&path).await {
                    Ok(content) => {
                        // 🔥 使用统一加载函数
                        match crate::core::domain::script::load_script_from_json(&content) {
                            Ok(script) => scripts.push(script.to_summary()),
                            Err(e) => {
                                warn!("⚠️ 解析脚本失败 {:?}: {}", path, e);
                            }
                        }
                    }
                    Err(e) => {
                        warn!("⚠️ 读取脚本失败 {:?}: {}", path, e);
                    }
                }
            }
        }
        
        // 按更新时间降序排序
        scripts.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        
        debug!("📋 列出 {} 个脚本", scripts.len());
        Ok(scripts)
    }

    async fn exists(&self, id: &str) -> CoreResult<bool> {
        Ok(self.script_path(id).exists())
    }

    async fn search(&self, query: &str) -> CoreResult<Vec<ScriptSummary>> {
        let all = self.list().await?;
        let query_lower = query.to_lowercase();
        
        let filtered: Vec<_> = all
            .into_iter()
            .filter(|s| {
                s.name.to_lowercase().contains(&query_lower)
                    || s.description.to_lowercase().contains(&query_lower)
                    || s.tags.iter().any(|t| t.to_lowercase().contains(&query_lower))
            })
            .collect();
        
        Ok(filtered)
    }

    async fn list_by_category(&self, category: &str) -> CoreResult<Vec<ScriptSummary>> {
        let all = self.list().await?;
        
        let filtered: Vec<_> = all
            .into_iter()
            .filter(|s| s.category == category)
            .collect();
        
        Ok(filtered)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_save_and_load() {
        let dir = tempdir().unwrap();
        let repo = FileScriptRepository::new(dir.path());
        
        let script = Script::new("测试脚本", "这是测试");
        let id = repo.save(&script).await.unwrap();
        
        let loaded = repo.load(&id).await.unwrap();
        assert_eq!(loaded.name, "测试脚本");
    }

    #[tokio::test]
    async fn test_list_empty() {
        let dir = tempdir().unwrap();
        let repo = FileScriptRepository::new(dir.path());
        
        let scripts = repo.list().await.unwrap();
        assert!(scripts.is_empty());
    }
}
