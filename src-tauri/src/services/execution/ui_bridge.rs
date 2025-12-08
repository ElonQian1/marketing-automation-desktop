use std::sync::Arc;
use std::sync::RwLock;

use anyhow::Result;
use tracing::info;

use crate::services::adb::get_device_session;
use crate::services::execution::ExecutionEnvironment;

/// 全局 XML 缓存，用于循环中复用上次的 dump 结果
static XML_CACHE: RwLock<Option<CachedXml>> = RwLock::new(None);

#[derive(Clone)]
struct CachedXml {
    content: String,
    timestamp: std::time::Instant,
}

impl CachedXml {
    fn new(content: String) -> Self {
        Self {
            content,
            timestamp: std::time::Instant::now(),
        }
    }
    
    /// 检查缓存是否仍然有效（默认 5 秒过期）
    fn is_valid(&self, ttl_ms: u64) -> bool {
        self.timestamp.elapsed().as_millis() < ttl_ms as u128
    }
}

/// `UiBridge` 聚合了与设备 UI 交互相关的公共能力，
/// 例如快照捕获、UI dump 与点击操作的重试封装。
///
/// 该结构体设计为轻量状态容器，可在应用层复用，
/// 避免在 `SmartScriptExecutor` 中重复实现 UI 操作逻辑。
#[derive(Clone)]
pub struct UiBridge {
    device_id: String,
    exec_env: Arc<ExecutionEnvironment>,
}

impl UiBridge {
    pub fn new(device_id: String, exec_env: Arc<ExecutionEnvironment>) -> Self {
        Self { device_id, exec_env }
    }

    pub fn device_id(&self) -> &str {
        &self.device_id
    }

    pub fn execution_environment(&self) -> Arc<ExecutionEnvironment> {
        Arc::clone(&self.exec_env)
    }

    /// 统一获取 UI 快照（XML + 可选截图）。
    /// 当前实现：委托给 `ExecutionEnvironment::capture_snapshot`。
    pub async fn capture_snapshot(&self) -> anyhow::Result<Option<String>> {
        let snapshot = self.exec_env.capture_snapshot().await?;
        Ok(snapshot.raw_xml)
    }

    /// 带重试机制的 UI dump 执行。
    /// 首先尝试通过快照提供器获取 XML，失败后回退到传统 dump。
    pub async fn execute_ui_dump_with_retry(&self, logs: &mut Vec<String>) -> Result<String> {
        logs.push("📱 开始获取设备UI结构（优先使用快照提供器）...".to_string());

        match self.capture_snapshot().await {
            Ok(Some(xml)) if !xml.is_empty() => {
                logs.push(format!("✅ 快照获取成功（snapshot_provider），长度: {} 字符", xml.len()));
                // 更新缓存
                if let Ok(mut cache) = XML_CACHE.write() {
                    *cache = Some(CachedXml::new(xml.clone()));
                }
                return Ok(xml);
            }
            Ok(Some(_)) | Ok(None) => {
                logs.push("⚠️ 快照结果为空或无XML，回退旧 UI dump 逻辑".to_string());
            }
            Err(e) => {
                logs.push(format!("⚠️ 快照捕获失败: {}，回退旧 UI dump 逻辑", e));
            }
        }

        let device_id = self.device_id.clone();
        let result = self
            .exec_env
            .run_with_retry(move |attempt| {
                let device_id = device_id.clone();
                async move {
                    if attempt > 0 {
                        if let Ok(session) = get_device_session(&device_id).await {
                            let _ = session.execute_command("rm -f /sdcard/ui_dump.xml").await;
                        }
                    }

                    let session = get_device_session(&device_id).await?;
                    let dump = session
                        .execute_command(
                            "uiautomator dump /sdcard/ui_dump.xml > /dev/null && cat /sdcard/ui_dump.xml",
                        )
                        .await?;

                    if dump.is_empty()
                        || dump.contains("ERROR:")
                        || dump.contains("null root node")
                    {
                        Err(anyhow::anyhow!("UI dump 内容异常"))
                    } else {
                        Ok(dump)
                    }
                }
            })
            .await;

        match result {
            Ok(dump) => {
                logs.push(format!("✅ UI结构获取成功（回退路径），长度: {} 字符", dump.len()));
                // 更新缓存
                if let Ok(mut cache) = XML_CACHE.write() {
                    *cache = Some(CachedXml::new(dump.clone()));
                }
                Ok(dump)
            }
            Err(e) => {
                logs.push(format!("❌ UI结构获取失败: {}", e));
                Err(e)
            }
        }
    }

    /// 🔥 条件性 UI dump：根据步骤参数决定是否跳过 dump
    /// 
    /// 智能决策流程：
    /// 1. 检查 `__skip_dump` 参数（由循环处理器注入）
    /// 2. 如果没有循环上下文，检查 `dump_mode` 和 `may_cause_page_change` 参数
    /// 3. 如果应该跳过且缓存有效，使用缓存
    /// 4. 否则执行真实 dump
    pub async fn execute_ui_dump_conditional(
        &self,
        step_params: &serde_json::Value,
        logs: &mut Vec<String>,
    ) -> Result<String> {
        // 🔥 记录决策原因（如果有）
        if let Some(reason) = step_params.get("__dump_decision_reason").and_then(|v| v.as_str()) {
            logs.push(format!("🤖 Dump决策: {}", reason));
        }
        
        // 获取缓存 TTL（默认 5 秒）
        let cache_ttl_ms = step_params
            .get("dump_cache_ttl_ms")
            .and_then(|v| v.as_u64())
            .unwrap_or(5000);
        
        // 🔥 决定是否跳过 dump
        let should_skip = self.should_skip_dump_smart(step_params, logs);
        
        // 🔥 记录上下文信息
        if let Some(iteration) = step_params.get("__loop_iteration").and_then(|v| v.as_i64()) {
            if let Some(step_idx) = step_params.get("__step_index_in_loop").and_then(|v| v.as_u64()) {
                logs.push(format!("📍 循环上下文: 第{}次迭代，步骤#{}", iteration, step_idx));
            }
        }
        
        if should_skip {
            // 尝试使用缓存
            if let Ok(cache) = XML_CACHE.read() {
                if let Some(cached) = cache.as_ref() {
                    if cached.is_valid(cache_ttl_ms) {
                        let elapsed = cached.timestamp.elapsed().as_millis();
                        logs.push(format!("📋 跳过dump：使用缓存XML（{}ms前获取，长度: {} 字符）", elapsed, cached.content.len()));
                        info!("📋 使用缓存XML，缓存年龄: {}ms", elapsed);
                        return Ok(cached.content.clone());
                    } else {
                        logs.push(format!("⚠️ 缓存已过期（{}ms > {}ms），需要重新dump", cached.timestamp.elapsed().as_millis(), cache_ttl_ms));
                    }
                } else {
                    logs.push("⚠️ 缓存为空，需要执行dump".to_string());
                }
            }
        } else {
            logs.push("🔄 执行dump（按策略要求）".to_string());
        }
        
        // 执行正常的 dump
        self.execute_ui_dump_with_retry(logs).await
    }
    
    /// 🤖 智能判断是否应该跳过 dump
    /// 
    /// 支持两种场景：
    /// 1. 循环内步骤：使用 `__skip_dump` 标记（由循环处理器预计算）
    /// 2. 非循环步骤：根据 `dump_mode` 和缓存状态实时判断
    fn should_skip_dump_smart(&self, step_params: &serde_json::Value, logs: &mut Vec<String>) -> bool {
        // 场景1：循环内步骤，使用预计算的 __skip_dump
        if let Some(skip) = step_params.get("__skip_dump").and_then(|v| v.as_bool()) {
            return skip;
        }
        
        // 场景2：非循环步骤，根据 dump_mode 判断
        let dump_mode = step_params
            .get("dump_mode")
            .and_then(|v| v.as_str())
            .unwrap_or("auto");
        
        match dump_mode {
            "always" => {
                logs.push("🔄 dump_mode=always，执行dump".to_string());
                false
            }
            "skip" => {
                logs.push("📋 dump_mode=skip，尝试跳过dump".to_string());
                true
            }
            "auto" => {
                // 非循环步骤的智能推断：检查缓存是否存在且有效
                // 如果用户标记了 may_cause_page_change，则不能跳过
                if let Some(true) = step_params.get("may_cause_page_change").and_then(|v| v.as_bool()) {
                    logs.push("🤖 智能推断：标记了 may_cause_page_change=true，执行dump".to_string());
                    return false;
                }
                
                // 检查缓存是否存在
                if let Ok(cache) = XML_CACHE.read() {
                    if let Some(cached) = cache.as_ref() {
                        let cache_ttl_ms = step_params
                            .get("dump_cache_ttl_ms")
                            .and_then(|v| v.as_u64())
                            .unwrap_or(5000);
                        
                        if cached.is_valid(cache_ttl_ms) {
                            logs.push("🤖 智能推断：有效缓存存在，可以复用".to_string());
                            return true;
                        }
                    }
                }
                
                logs.push("🤖 智能推断：无有效缓存，执行dump".to_string());
                false
            }
            _ => {
                // 其他模式（如 loop_entry, first_only）在非循环场景下等同于 always
                logs.push(format!("🔄 dump_mode={}（非循环场景），执行dump", dump_mode));
                false
            }
        }
    }

    /// 带重试机制的点击执行。
    pub async fn execute_click_with_retry(
        &self,
        x: i32,
        y: i32,
        logs: &mut Vec<String>,
    ) -> Result<String> {
        logs.push("👆 开始执行点击操作（带重试机制）...".to_string());

        let max_retries = 2;
        let mut last_error: Option<anyhow::Error> = None;

        for attempt in 1..=max_retries {
            if attempt > 1 {
                logs.push(format!("🔄 重试点击操作 - 第 {}/{} 次尝试", attempt, max_retries));
                tokio::time::sleep(std::time::Duration::from_millis(300)).await;
            }

            match self.try_click_xy(x, y).await {
                Ok(output) => {
                    tokio::time::sleep(std::time::Duration::from_millis(200)).await;
                    logs.push("⏱️  点击后延迟200ms完成".to_string());
                    return Ok(output);
                }
                Err(e) => {
                    logs.push(format!("❌ 点击失败: {} (尝试 {}/{})", e, attempt, max_retries));
                    last_error = Some(e);
                }
            }
        }

        logs.push(format!("❌ 点击操作最终失败，已重试 {} 次", max_retries));
        Err(last_error.unwrap_or_else(|| anyhow::anyhow!("点击操作失败")))
    }

    async fn try_click_xy(&self, x: i32, y: i32) -> Result<String> {
        let session = get_device_session(&self.device_id).await?;
        session.tap(x, y).await?;
        Ok("OK".to_string())
    }
}
