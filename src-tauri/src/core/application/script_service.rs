// src-tauri/src/core/application/script_service.rs
// module: core/application | layer: application | role: script-use-cases
// summary: 脚本应用服务 - 编排所有脚本相关用例

use std::sync::Arc;
use tracing::{info, warn, error};

use crate::core::domain::script::{
    Script, ScriptStep, ScriptSummary, ScriptRepository,
    ScriptExecutor, ScriptExecutionResult, StepExecutionResult,
};
use crate::core::shared::{CoreError, CoreResult, error::ErrorCode};

/// 脚本应用服务
/// 
/// 这是脚本相关所有用例的统一入口。
/// 无论是 Tauri 插件、MCP 服务器还是 CLI，都通过这个服务操作脚本。
pub struct ScriptAppService {
    repository: Arc<dyn ScriptRepository>,
    executor: Arc<dyn ScriptExecutor>,
}

impl ScriptAppService {
    pub fn new(
        repository: Arc<dyn ScriptRepository>,
        executor: Arc<dyn ScriptExecutor>,
    ) -> Self {
        Self { repository, executor }
    }

    // ========================================================================
    // CRUD 用例
    // ========================================================================

    /// 创建新脚本
    pub async fn create_script(
        &self,
        name: String,
        description: String,
    ) -> CoreResult<Script> {
        info!("📝 创建新脚本: {}", name);
        
        let script = Script::new(name, description);
        
        // 保存到仓储
        self.repository.save(&script).await?;
        
        info!("✅ 脚本创建成功: {}", script.id);
        Ok(script)
    }

    /// 保存脚本
    pub async fn save_script(&self, script: &Script) -> CoreResult<String> {
        info!("💾 保存脚本: {} ({})", script.name, script.id);
        
        // 验证脚本有效性（如果有步骤的话）
        if !script.steps.is_empty() {
            script.validate()?;
        }
        
        let id = self.repository.save(script).await?;
        
        info!("✅ 脚本保存成功: {}", id);
        Ok(id)
    }

    /// 加载脚本
    pub async fn load_script(&self, script_id: &str) -> CoreResult<Script> {
        info!("📂 加载脚本: {}", script_id);
        
        let script = self.repository.load(script_id).await?;
        
        info!("✅ 脚本加载成功: {} ({}步骤)", script.name, script.steps.len());
        Ok(script)
    }

    /// 删除脚本
    pub async fn delete_script(&self, script_id: &str) -> CoreResult<()> {
        info!("🗑️ 删除脚本: {}", script_id);
        
        // 确保脚本存在
        if !self.repository.exists(script_id).await? {
            return Err(CoreError::script_not_found(script_id));
        }
        
        self.repository.delete(script_id).await?;
        
        info!("✅ 脚本删除成功: {}", script_id);
        Ok(())
    }

    /// 列出所有脚本
    pub async fn list_scripts(&self) -> CoreResult<Vec<ScriptSummary>> {
        info!("📋 列出所有脚本");
        
        let scripts = self.repository.list().await?;
        
        info!("✅ 找到 {} 个脚本", scripts.len());
        Ok(scripts)
    }

    /// 搜索脚本
    pub async fn search_scripts(&self, query: &str) -> CoreResult<Vec<ScriptSummary>> {
        info!("🔍 搜索脚本: {}", query);
        
        let scripts = self.repository.search(query).await?;
        
        info!("✅ 搜索到 {} 个脚本", scripts.len());
        Ok(scripts)
    }

    // ========================================================================
    // 执行用例
    // ========================================================================

    /// 执行脚本
    pub async fn execute_script(
        &self,
        script_id: &str,
        device_id: &str,
    ) -> CoreResult<ScriptExecutionResult> {
        info!("🚀 执行脚本: {} on device {}", script_id, device_id);
        
        // 1. 加载脚本
        let script = self.repository.load(script_id).await?;
        
        // 2. 验证脚本
        script.validate()?;
        
        // 3. 执行
        let result = self.executor.execute(&script, device_id).await?;
        
        // 4. 记录日志
        if result.success {
            info!(
                "✅ 脚本执行成功: {} ({}/{}步骤, {}ms)",
                script_id, result.completed_steps, result.total_steps, result.elapsed_ms
            );
        } else {
            warn!(
                "❌ 脚本执行失败: {} (失败于步骤 {:?})",
                script_id, result.failed_step
            );
        }
        
        Ok(result)
    }

    /// 执行单个步骤（用于测试）
    pub async fn execute_single_step(
        &self,
        step: &ScriptStep,
        device_id: &str,
    ) -> CoreResult<StepExecutionResult> {
        info!("🔧 测试执行步骤: {} on device {}", step.name, device_id);
        
        // 验证步骤
        step.validate()?;
        
        // 执行
        let result = self.executor.execute_step(step, device_id).await?;
        
        if result.success {
            info!("✅ 步骤执行成功: {} ({}ms)", step.name, result.elapsed_ms);
        } else {
            warn!("❌ 步骤执行失败: {} - {:?}", step.name, result.error);
        }
        
        Ok(result)
    }

    /// 停止当前执行
    pub async fn stop_execution(&self) -> CoreResult<()> {
        info!("⏹️ 停止脚本执行");
        self.executor.stop().await
    }

    // ========================================================================
    // 步骤管理用例
    // ========================================================================

    /// 添加步骤到脚本
    pub async fn add_step(
        &self,
        script_id: &str,
        step: ScriptStep,
    ) -> CoreResult<Script> {
        info!("➕ 添加步骤到脚本 {}: {}", script_id, step.name);
        
        let mut script = self.repository.load(script_id).await?;
        script.add_step(step);
        self.repository.save(&script).await?;
        
        Ok(script)
    }

    /// 更新脚本步骤
    pub async fn update_step(
        &self,
        script_id: &str,
        step_index: usize,
        step: ScriptStep,
    ) -> CoreResult<Script> {
        info!("✏️ 更新脚本 {} 的步骤 {}", script_id, step_index);
        
        let mut script = self.repository.load(script_id).await?;
        
        if step_index >= script.steps.len() {
            return Err(CoreError::new(
                ErrorCode::NotFound,
                format!("步骤索引 {} 超出范围", step_index),
            ));
        }
        
        script.steps[step_index] = step;
        script.touch();
        self.repository.save(&script).await?;
        
        Ok(script)
    }

    /// 删除步骤
    pub async fn remove_step(
        &self,
        script_id: &str,
        step_index: usize,
    ) -> CoreResult<Script> {
        info!("➖ 删除脚本 {} 的步骤 {}", script_id, step_index);
        
        let mut script = self.repository.load(script_id).await?;
        
        if script.remove_step(step_index).is_none() {
            return Err(CoreError::new(
                ErrorCode::NotFound,
                format!("步骤索引 {} 不存在", step_index),
            ));
        }
        
        self.repository.save(&script).await?;
        
        Ok(script)
    }

    /// 重排步骤顺序
    pub async fn reorder_steps(
        &self,
        script_id: &str,
        from_index: usize,
        to_index: usize,
    ) -> CoreResult<Script> {
        info!("🔄 重排脚本 {} 步骤: {} -> {}", script_id, from_index, to_index);
        
        let mut script = self.repository.load(script_id).await?;
        
        if from_index >= script.steps.len() || to_index >= script.steps.len() {
            return Err(CoreError::invalid_input("步骤索引超出范围"));
        }
        
        let step = script.steps.remove(from_index);
        script.steps.insert(to_index, step);
        script.touch();
        
        self.repository.save(&script).await?;
        
        Ok(script)
    }

    // ========================================================================
    // 复制/模板用例
    // ========================================================================

    /// 复制脚本
    pub async fn duplicate_script(&self, script_id: &str) -> CoreResult<Script> {
        info!("📋 复制脚本: {}", script_id);
        
        let original = self.repository.load(script_id).await?;
        
        let mut copy = original.clone();
        copy.id = format!("script_{}", chrono::Utc::now().timestamp_millis());
        copy.name = format!("{} (副本)", original.name);
        copy.created_at = chrono::Utc::now();
        copy.updated_at = chrono::Utc::now();
        
        self.repository.save(&copy).await?;
        
        info!("✅ 脚本复制成功: {} -> {}", script_id, copy.id);
        Ok(copy)
    }
}
