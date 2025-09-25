use anyhow::Result;
use async_trait::async_trait;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
#[allow(unused_imports)]
use tracing::{error, info, warn, debug};

// ExecutionEnvironment 相关导入（重试 + 快照 + 注册表 + 匹配桥接）
use crate::services::execution::{
    ExecutionEnvironment,
    ExponentialBackoffPolicy,
    RetryConfig,
    RealSnapshotProvider,
    register_execution_environment,
    LegacyUiActions,
    SmartScriptOrchestrator,
    UiBridge,
};
use crate::services::execution::model::{
    SmartActionType,
    SmartExecutorConfig,
    SmartExecutionResult,
    SmartScriptStep,
    SingleStepTestResult,
};
use crate::services::execution::SmartActionDispatcher;

use crate::services::error_handling::{ErrorHandler, ErrorHandlingConfig};
use crate::services::script_execution::ScriptPreprocessor;
use crate::application::normalizer::normalize_step_json;
use crate::application::device_metrics::{DeviceMetrics, DeviceMetricsProvider};
use crate::infra::device::metrics_provider::RealDeviceMetricsProvider;
// (已在顶部统一导入)  // 新执行环境聚合 + 重试策略 + 快照提供器 + 注册表

#[cfg(windows)]
use std::os::windows::process::CommandExt;

pub struct SmartScriptExecutor {
    pub device_id: String,
    pub adb_path: String,
    error_handler: ErrorHandler,
    preprocessor: Arc<Mutex<ScriptPreprocessor>>,
    /// 新的执行环境（重试/快照/上下文）。迁移期可选，后续完全替换内部散落逻辑。
    exec_env: Arc<ExecutionEnvironment>,
    ui_bridge: UiBridge,
}

impl SmartScriptExecutor {
    /// 统一获取 UI 快照（XML + 可选截图）。
    /// 当前实现：委托给 ExecutionEnvironment.snapshot_provider。
    /// TODO: 后续在这里加入缓存 / 失败重试 / 指标记录 等扩展。
    pub(crate) async fn capture_ui_snapshot(&self) -> anyhow::Result<Option<String>> {
        self.ui_bridge.capture_snapshot().await
    }

    pub(crate) fn device_id(&self) -> &str {
        &self.device_id
    }

    pub(crate) fn adb_path(&self) -> &str {
        &self.adb_path
    }

    pub(crate) fn ui_bridge(&self) -> &UiBridge {
        &self.ui_bridge
    }
}

impl SmartScriptExecutor {
    pub fn new(device_id: String) -> Self {
        let adb_path = crate::utils::adb_utils::get_adb_path();
        
        // 创建错误处理器配置
        let error_config = ErrorHandlingConfig {
            max_retries: 3,
            base_delay: std::time::Duration::from_millis(500),
            max_delay: std::time::Duration::from_secs(5),
            exponential_backoff: true,
            verbose_logging: true,
        };
        
        // 初始化错误处理器
        let error_handler = ErrorHandler::new(
            error_config,
            adb_path.clone(),
            Some(device_id.clone())
        );
        
        // 构建可配置重试策略（支持环境变量）
        let retry_cfg = RetryConfig::from_env();
        let retry_policy = ExponentialBackoffPolicy::new(retry_cfg.clone());

        // 注入真实快照提供器（后续可扩展截图等）
        let snapshot_provider = RealSnapshotProvider::default();

        let exec_env = Arc::new(
            ExecutionEnvironment::new(device_id.clone())
                .with_retry_policy(retry_policy)
                .with_snapshot_provider(snapshot_provider)
        );

        let ui_bridge = UiBridge::new(device_id.clone(), exec_env.clone());

        // 注册到全局执行环境注册表（弱引用存储）
        register_execution_environment(&device_id, &exec_env);

        Self {
            device_id: device_id.clone(),
            adb_path,
            error_handler,
            preprocessor: Arc::new(Mutex::new(ScriptPreprocessor::new())),
            exec_env,
            ui_bridge,
        }
    }

    pub async fn execute_single_step(&self, step: SmartScriptStep) -> Result<SingleStepTestResult> {
        let start_time = std::time::Instant::now();
        let timestamp = chrono::Utc::now().timestamp_millis();
        let mut logs = Vec::new();

        info!("🚀 开始单步测试: {} (设备: {})", step.name, self.device_id);
        logs.push(format!("🚀 开始执行步骤: {}", step.name));
        logs.push(format!("📱 目标设备: {}", self.device_id));
        logs.push(format!("🔧 步骤类型: {:?}", step.step_type));
        
        // 详细记录步骤参数
        let params: HashMap<String, serde_json::Value> = 
            serde_json::from_value(step.parameters.clone())?;
        let step_details = format!(
            "📊 步骤详细信息: ID='{}', 坐标=({},{}), 参数={:?}",
            step.id,
            params.get("x").and_then(|v| v.as_i64()).unwrap_or(0),
            params.get("y").and_then(|v| v.as_i64()).unwrap_or(0),
            step.parameters
        );
        info!("{}", step_details);
        logs.push(step_details);

        // 后端兜底标准化：若参数为“smart_scroll风格”（有 direction/无 start_x 等），则归一化为 swipe 所需参数
        let mut step = step;
        if Self::is_smart_scroll_like(&step.parameters) && matches!(step.step_type, SmartActionType::Swipe) {
            // 使用真实设备分辨率用于归一化（安全回退到 1080x1920）
            let provider = RealDeviceMetricsProvider::new(self.adb_path.clone());
            let metrics = match provider.get(&self.device_id) {
                Some(m) => {
                    info!("📐 real-metrics: width={} height={} density={:?}", m.width_px, m.height_px, m.density);
                    m
                }
                None => {
                    warn!("📐 real-metrics: 获取失败，使用默认 1080x1920");
                    DeviceMetrics::new(1080, 1920)
                }
            };
            let (new_type, new_params) = normalize_step_json("smart_scroll", step.parameters.clone(), &metrics);
            logs.push(format!("🧩 后端归一化: smart_scroll→{}，已补齐坐标/时长", new_type));
            info!("🧩 后端归一化: smart_scroll→{}", new_type);
            step.parameters = new_params;
        }

        let dispatcher = SmartActionDispatcher::new(self);
        let result = dispatcher.execute(&step, &mut logs).await;

        let duration = start_time.elapsed().as_millis() as u64;

        match result {
            Ok(message) => {
                logs.push(format!("✅ 执行成功: {}", message));
                info!("✅ 步骤执行成功: {} (耗时: {}ms)", step.name, duration);
                Ok(SingleStepTestResult {
                    success: true,
                    step_id: step.id,
                    step_name: step.name,
                    message,
                    duration_ms: duration,
                    timestamp,
                    page_state: None,
                    ui_elements: Vec::new(),
                    logs,
                    error_details: None,
                    extracted_data: HashMap::new(),
                })
            }
            Err(e) => {
                let error_msg = e.to_string();
                logs.push(format!("❌ 执行失败: {}", error_msg));
                error!("❌ 步骤执行失败: {} - 错误: {} (耗时: {}ms)", step.name, error_msg, duration);
                Ok(SingleStepTestResult {
                    success: false,
                    step_id: step.id,
                    step_name: step.name,
                    message: "执行失败".to_string(),
                    duration_ms: duration,
                    timestamp,
                    page_state: None,
                    ui_elements: Vec::new(),
                    logs,
                    error_details: Some(error_msg),
                    extracted_data: HashMap::new(),
                })
            }
        }
    }

    pub(crate) fn is_smart_scroll_like(params: &serde_json::Value) -> bool {
        let has_direction = params.get("direction").is_some();
        let has_coords = params.get("start_x").is_some() && params.get("start_y").is_some()
            && params.get("end_x").is_some() && params.get("end_y").is_some();
        has_direction && !has_coords
    }

    /// 带重试机制的 UI dump 执行
    pub(crate) async fn execute_ui_dump_with_retry(&self, logs: &mut Vec<String>) -> Result<String> {
        self.ui_bridge.execute_ui_dump_with_retry(logs).await
    }

    /// LegacyUiActions trait 会通过 async_trait 生成 dyn Future，因此保持签名稳定。

    /// 带重试机制的点击执行
    pub(crate) async fn execute_click_with_retry(&self, x: i32, y: i32, logs: &mut Vec<String>) -> Result<String> {
        self.ui_bridge.execute_click_with_retry(x, y, logs).await
    }

    /// 获取错误处理统计信息
    pub fn get_error_handling_statistics(&self) -> String {
        self.error_handler.get_statistics()
    }

    /// 重置错误处理统计信息
    pub fn reset_error_handling_statistics(&mut self) {
        self.error_handler.reset_statistics();
    }

    /// 执行智能脚本（批量执行多个步骤）
    pub async fn execute_smart_script(
        &self,
        steps: Vec<SmartScriptStep>,
        config: Option<SmartExecutorConfig>,
    ) -> Result<SmartExecutionResult> {
        let orchestrator = SmartScriptOrchestrator::new(self, self.preprocessor.clone());
        orchestrator.execute(steps, config).await
    }

    async fn execute_adb_command(&self, args: &[&str]) -> Result<std::process::Output> {
        let mut cmd = std::process::Command::new(&self.adb_path);
        cmd.args(args);
        
        #[cfg(windows)]
        cmd.creation_flags(0x08000000);
        
        Ok(cmd.output()?)
    }
}

// LegacyUiActions trait implementation for backward compatibility
#[async_trait]
impl LegacyUiActions for SmartScriptExecutor {
    async fn execute_click_with_retry(
        &self,
        x: i32,
        y: i32,
        logs: &mut Vec<String>,
    ) -> Result<String> {
        SmartScriptExecutor::execute_click_with_retry(self, x, y, logs).await
    }

    async fn execute_ui_dump_with_retry(&self, logs: &mut Vec<String>) -> Result<String> {
        SmartScriptExecutor::execute_ui_dump_with_retry(self, logs).await
    }
}