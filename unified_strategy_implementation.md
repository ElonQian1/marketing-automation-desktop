# 🚀 统一策略匹配 - 具体实现代码

## 📋 重构方案概览

将当前分裂的双路径系统重构为统一的策略匹配系统，具体代码实现如下：

## 🔧 1. 前端统一执行器实现

### 新的统一 Hook

```typescript
// src/hooks/useUnifiedStepExecutor.ts
import { useState, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useAdb } from '@/application/hooks/useAdb';

export interface UnifiedStepResult {
  success: boolean;
  step_id: string;
  step_name: string;
  message: string;
  duration_ms: number;
  timestamp: number;
  
  // 分阶段结果
  strategy_validation?: {
    success: boolean;
    strategy: string;
    matched_elements: any[];
    confidence_score: number;
    validation_time_ms: number;
  };
  element_location?: {
    success: boolean;
    target_element: any;
    coordinates: { x: number; y: number };
    bounds: string;
    location_method: 'strategy' | 'direct' | 'bounds';
  };
  action_execution?: {
    success: boolean;
    action_type: string;
    actual_coordinates?: { x: number; y: number };
    execution_time_ms: number;
    ui_changed: boolean;
  };
  
  ui_elements: any[];
  extracted_data?: any;
  logs: string[];
  error_details?: string;
}

export function useUnifiedStepExecutor() {
  const { devices, selectedDevice } = useAdb();
  const [testingSteps, setTestingSteps] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Map<string, UnifiedStepResult>>(new Map());

  const executeStep = useCallback(async (
    step: SmartScriptStep,
    deviceId: string,
    mode: 'test' | 'execute' = 'test'
  ): Promise<UnifiedStepResult> => {
    const stepId = step.id;
    console.log(`🚀 统一执行器开始: ${step.name} (设备: ${deviceId}, 模式: ${mode})`);
    
    setTestingSteps(prev => new Set(prev).add(stepId));

    try {
      // 调用新的统一后端命令
      const result = await invoke('execute_unified_step', {
        deviceId,
        step,
        mode
      }) as UnifiedStepResult;

      console.log('✅ 统一执行器完成:', result);
      setTestResults(prev => new Map(prev).set(stepId, result));
      return result;

    } catch (error) {
      console.error('❌ 统一执行器失败:', error);
      
      const errorResult: UnifiedStepResult = {
        success: false,
        step_id: stepId,
        step_name: step.name,
        message: `执行失败: ${error}`,
        duration_ms: 0,
        timestamp: Date.now(),
        ui_elements: [],
        logs: [`❌ 执行异常: ${error}`],
        error_details: String(error)
      };
      
      setTestResults(prev => new Map(prev).set(stepId, errorResult));
      return errorResult;

    } finally {
      setTestingSteps(prev => {
        const next = new Set(prev);
        next.delete(stepId);
        return next;
      });
    }
  }, []);

  // 向后兼容的执行方法
  const executeLegacyStep = useCallback(async (
    step: SmartScriptStep,
    deviceId: string
  ): Promise<SingleStepTestResult> => {
    const unifiedResult = await executeStep(step, deviceId, 'test');
    
    // 转换为旧格式
    return {
      success: unifiedResult.success,
      step_id: unifiedResult.step_id,
      step_name: unifiedResult.step_name,
      message: unifiedResult.message,
      duration_ms: unifiedResult.duration_ms,
      timestamp: unifiedResult.timestamp,
      ui_elements: unifiedResult.ui_elements,
      logs: unifiedResult.logs,
      error_details: unifiedResult.error_details,
      extracted_data: unifiedResult.extracted_data
    };
  }, [executeStep]);

  return {
    executeStep,
    executeLegacyStep, // 向后兼容
    testingSteps,
    testResults,
    isTestingStep: (stepId: string) => testingSteps.has(stepId),
    getTestResult: (stepId: string) => testResults.get(stepId)
  };
}
```

### 重构后的 useSingleStepTest.ts

```typescript
// src/hooks/useSingleStepTest.ts (重构版本)
import { useUnifiedStepExecutor } from './useUnifiedStepExecutor';

export function useSingleStepTest() {
  const unifiedExecutor = useUnifiedStepExecutor();

  // 主要执行方法 - 现在委托给统一执行器
  const executeSingleStep = useCallback(async (
    step: SmartScriptStep,
    deviceId: string
  ): Promise<SingleStepTestResult> => {
    console.log('🔄 重构后的单步测试 - 使用统一执行器');
    
    // 检查是否支持循环
    const inlineCount = Math.max(1, Math.min(50, 
      Number((step.parameters as any)?.inline_loop_count) || 1
    ));

    if (inlineCount === 1) {
      // 单次执行：直接使用统一执行器
      return await unifiedExecutor.executeLegacyStep(step, deviceId);
    } else {
      // 多次执行：循环调用统一执行器
      console.log(`🔄 执行 ${inlineCount} 次循环`);
      
      const results: SingleStepTestResult[] = [];
      let overallSuccess = true;
      let totalDuration = 0;
      const allLogs: string[] = [];

      for (let i = 0; i < inlineCount; i++) {
        console.log(`🔄 第 ${i + 1}/${inlineCount} 次执行`);
        
        const result = await unifiedExecutor.executeLegacyStep(step, deviceId);
        results.push(result);
        
        overallSuccess = overallSuccess && result.success;
        totalDuration += result.duration_ms || 0;
        allLogs.push(`第${i + 1}次: ${result.success ? '成功' : '失败'} - ${result.message}`);

        if (!result.success) {
          console.log(`❌ 第 ${i + 1} 次执行失败，继续下一次`);
        }

        // 循环间延迟
        if (i < inlineCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // 合并结果
      const successCount = results.filter(r => r.success).length;
      return {
        success: overallSuccess,
        step_id: step.id,
        step_name: step.name,
        message: `循环执行完成: ${successCount}/${inlineCount} 次成功`,
        duration_ms: totalDuration,
        timestamp: Date.now(),
        ui_elements: results[results.length - 1]?.ui_elements || [],
        logs: allLogs,
        error_details: overallSuccess ? undefined : `${inlineCount - successCount} 次执行失败`,
        extracted_data: { loopResults: results }
      };
    }
  }, [unifiedExecutor]);

  return {
    executeSingleStep,
    // 委托其他方法到统一执行器
    testingSteps: unifiedExecutor.testingSteps,
    testResults: new Map([...unifiedExecutor.testResults.entries()].map(([k, v]) => [
      k, 
      {
        success: v.success,
        step_id: v.step_id,
        step_name: v.step_name,
        message: v.message,
        duration_ms: v.duration_ms,
        timestamp: v.timestamp,
        ui_elements: v.ui_elements,
        logs: v.logs,
        error_details: v.error_details,
        extracted_data: v.extracted_data
      } as SingleStepTestResult
    ])),
    isTestingStep: unifiedExecutor.isTestingStep,
    getTestResult: (stepId: string) => {
      const result = unifiedExecutor.getTestResult(stepId);
      if (!result) return undefined;
      
      return {
        success: result.success,
        step_id: result.step_id,
        step_name: result.step_name,
        message: result.message,
        duration_ms: result.duration_ms,
        timestamp: result.timestamp,
        ui_elements: result.ui_elements,
        logs: result.logs,
        error_details: result.error_details,
        extracted_data: result.extracted_data
      } as SingleStepTestResult;
    }
  };
}
```

## 🦀 2. 后端统一执行器实现

### 新的 Tauri 命令

```rust
// src-tauri/src/commands/unified_execution.rs
use anyhow::Result;
use serde::{Deserialize, Serialize};
use crate::services::execution::model::{SmartScriptStep, ExecutionMode};
use crate::services::unified_step_executor::UnifiedStepExecutor;

#[derive(Debug, Deserialize)]
pub struct ExecuteUnifiedStepRequest {
    device_id: String,
    step: SmartScriptStep,
    mode: ExecutionMode,
}

#[derive(Debug, Serialize)]
pub struct UnifiedStepResult {
    pub success: bool,
    pub step_id: String,
    pub step_name: String,
    pub message: String,
    pub duration_ms: u64,
    pub timestamp: i64,
    
    // 分阶段结果
    pub strategy_validation: Option<StrategyValidationResult>,
    pub element_location: Option<ElementLocationResult>,
    pub action_execution: Option<ActionExecutionResult>,
    
    pub ui_elements: Vec<serde_json::Value>,
    pub extracted_data: Option<serde_json::Value>,
    pub logs: Vec<String>,
    pub error_details: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct StrategyValidationResult {
    pub success: bool,
    pub strategy: String,
    pub matched_elements: Vec<serde_json::Value>,
    pub confidence_score: f64,
    pub validation_time_ms: u64,
}

#[derive(Debug, Serialize, Clone)]
pub struct ElementLocationResult {
    pub success: bool,
    pub target_element: serde_json::Value,
    pub coordinates: Coordinates,
    pub bounds: String,
    pub location_method: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct Coordinates {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Serialize, Clone)]
pub struct ActionExecutionResult {
    pub success: bool,
    pub action_type: String,
    pub actual_coordinates: Option<Coordinates>,
    pub execution_time_ms: u64,
    pub ui_changed: bool,
}

#[tauri::command]
pub async fn execute_unified_step(
    device_id: String,
    step: SmartScriptStep,
    mode: ExecutionMode,
) -> Result<UnifiedStepResult, String> {
    tracing::info!("🚀 统一执行器开始: {} (设备: {}, 模式: {:?})", step.name, device_id, mode);
    
    let executor = UnifiedStepExecutor::new(device_id.clone())?;
    
    match executor.execute_step(step, mode).await {
        Ok(result) => {
            tracing::info!("✅ 统一执行器完成: {}", result.step_name);
            Ok(result)
        }
        Err(e) => {
            tracing::error!("❌ 统一执行器失败: {}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn validate_strategy_only(
    device_id: String,
    strategy_config: serde_json::Value,
) -> Result<StrategyValidationResult, String> {
    tracing::info!("🎯 策略验证: 设备={} 配置={:?}", device_id, strategy_config);
    
    let executor = UnifiedStepExecutor::new(device_id)?;
    
    match executor.validate_strategy_only(strategy_config).await {
        Ok(result) => {
            tracing::info!("✅ 策略验证完成: {} (成功: {})", result.strategy, result.success);
            Ok(result)
        }
        Err(e) => {
            tracing::error!("❌ 策略验证失败: {}", e);
            Err(e.to_string())
        }
    }
}
```

### 统一执行器实现

```rust
// src-tauri/src/services/unified_step_executor.rs
use anyhow::{Result, Context};
use std::time::Instant;
use tracing::{info, warn, error};

use crate::services::execution::{
    model::{SmartScriptStep, SmartActionType, ExecutionMode},
    matching::strategies::create_strategy_processor,
};
use crate::services::smart_script_executor::SmartScriptExecutor;
use crate::commands::unified_execution::{
    UnifiedStepResult, StrategyValidationResult, ElementLocationResult, 
    ActionExecutionResult, Coordinates
};

pub struct UnifiedStepExecutor {
    device_id: String,
    adb_path: String,
    action_executor: SmartScriptExecutor,
}

impl UnifiedStepExecutor {
    pub fn new(device_id: String) -> Result<Self> {
        let adb_path = crate::utils::adb_utils::get_adb_path();
        let action_executor = SmartScriptExecutor::new(device_id.clone());
        
        Ok(Self {
            device_id,
            adb_path,
            action_executor,
        })
    }

    pub async fn execute_step(
        &self,
        step: SmartScriptStep,
        mode: ExecutionMode,
    ) -> Result<UnifiedStepResult> {
        let start_time = Instant::now();
        let mut result = UnifiedStepResult {
            success: false,
            step_id: step.id.clone(),
            step_name: step.name.clone(),
            message: String::new(),
            duration_ms: 0,
            timestamp: chrono::Utc::now().timestamp_millis(),
            strategy_validation: None,
            element_location: None,
            action_execution: None,
            ui_elements: vec![],
            extracted_data: None,
            logs: vec![],
            error_details: None,
        };

        // 阶段1: 检查是否需要策略验证
        if let Some(strategy_config) = self.extract_strategy_config(&step) {
            result.logs.push("🎯 开始策略验证...".to_string());
            
            match self.validate_strategy(strategy_config).await {
                Ok(validation_result) => {
                    result.strategy_validation = Some(validation_result.clone());
                    
                    if !validation_result.success {
                        result.success = false;
                        result.message = format!("策略验证失败: {}", validation_result.strategy);
                        result.duration_ms = start_time.elapsed().as_millis() as u64;
                        result.logs.push("❌ 策略验证失败".to_string());
                        return Ok(result);
                    }
                    result.logs.push(format!("✅ 策略验证成功: {} (匹配{}个元素)", 
                        validation_result.strategy, validation_result.matched_elements.len()));
                }
                Err(e) => {
                    result.success = false;
                    result.message = format!("策略验证异常: {}", e);
                    result.error_details = Some(e.to_string());
                    result.duration_ms = start_time.elapsed().as_millis() as u64;
                    result.logs.push(format!("❌ 策略验证异常: {}", e));
                    return Ok(result);
                }
            }
        }

        // 阶段2: 元素定位
        result.logs.push("📍 开始元素定位...".to_string());
        match self.locate_element(&step, &result.strategy_validation).await {
            Ok(location_result) => {
                result.element_location = Some(location_result.clone());
                
                if !location_result.success {
                    result.success = false;
                    result.message = "元素定位失败".to_string();
                    result.duration_ms = start_time.elapsed().as_millis() as u64;
                    result.logs.push("❌ 元素定位失败".to_string());
                    return Ok(result);
                }
                result.logs.push(format!("✅ 元素定位成功: ({}, {}) [{}]", 
                    location_result.coordinates.x, location_result.coordinates.y, location_result.location_method));
            }
            Err(e) => {
                result.success = false;
                result.message = format!("元素定位异常: {}", e);
                result.error_details = Some(e.to_string());
                result.duration_ms = start_time.elapsed().as_millis() as u64;
                result.logs.push(format!("❌ 元素定位异常: {}", e));
                return Ok(result);
            }
        }

        // 阶段3: 动作执行
        if mode == ExecutionMode::Execute || self.should_execute_in_test_mode(&step) {
            result.logs.push("⚡ 开始动作执行...".to_string());
            
            match self.execute_action(&step, result.element_location.as_ref().unwrap()).await {
                Ok(action_result) => {
                    result.action_execution = Some(action_result.clone());
                    result.success = action_result.success;
                    result.message = if action_result.success { 
                        format!("执行成功 ({})", action_result.action_type)
                    } else { 
                        format!("执行失败 ({})", action_result.action_type)
                    };
                    result.logs.push(format!("{} 动作执行完成: {}", 
                        if action_result.success { "✅" } else { "❌" }, action_result.action_type));
                }
                Err(e) => {
                    result.success = false;
                    result.message = format!("动作执行异常: {}", e);
                    result.error_details = Some(e.to_string());
                    result.logs.push(format!("❌ 动作执行异常: {}", e));
                }
            }
        } else {
            // 测试模式：仅验证不执行
            result.success = true;
            result.message = "策略验证和元素定位成功（测试模式）".to_string();
            result.logs.push("🧪 测试模式：跳过实际执行".to_string());
        }

        result.duration_ms = start_time.elapsed().as_millis() as u64;
        info!("📊 统一执行器完成: {} 耗时{}ms 成功:{}", result.step_name, result.duration_ms, result.success);
        
        Ok(result)
    }

    fn extract_strategy_config(&self, step: &SmartScriptStep) -> Option<serde_json::Value> {
        step.parameters.get("matching").cloned()
    }

    async fn validate_strategy(&self, config: serde_json::Value) -> Result<StrategyValidationResult> {
        let start_time = Instant::now();
        
        let strategy = config.get("strategy")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("缺少策略配置"))?;

        info!("🎯 验证策略: {}", strategy);

        // 创建策略处理器
        let processor = create_strategy_processor(strategy);
        
        // 获取UI快照
        let xml_content = self.get_ui_snapshot().await
            .context("获取UI快照失败")?;

        // 构造匹配上下文
        let context = crate::services::execution::matching::strategies::MatchingContext {
            device_id: self.device_id.clone(),
            xml_content,
            criteria: config.clone(),
            additional_config: config.get("hiddenElementParentConfig")
                .or_else(|| config.get("customConfig"))
                .cloned(),
        };

        // 执行策略匹配
        let matches = processor.process(&context).await
            .context("策略处理失败")?;

        let confidence = if matches.is_empty() { 0.0 } else { 
            // 简单的置信度计算
            1.0 - (1.0 / (matches.len() as f64 + 1.0))
        };

        Ok(StrategyValidationResult {
            success: !matches.is_empty(),
            strategy: strategy.to_string(),
            matched_elements: matches,
            confidence_score: confidence,
            validation_time_ms: start_time.elapsed().as_millis() as u64,
        })
    }

    async fn locate_element(
        &self,
        step: &SmartScriptStep,
        strategy_result: &Option<StrategyValidationResult>,
    ) -> Result<ElementLocationResult> {
        // 优先使用策略匹配结果
        if let Some(strategy) = strategy_result {
            if strategy.success && !strategy.matched_elements.is_empty() {
                let element = &strategy.matched_elements[0];
                if let Some(bounds_str) = element.get("bounds").and_then(|v| v.as_str()) {
                    let bounds = self.parse_bounds(bounds_str)?;
                    return Ok(ElementLocationResult {
                        success: true,
                        target_element: element.clone(),
                        coordinates: Coordinates {
                            x: (bounds.0 + bounds.2) / 2,
                            y: (bounds.1 + bounds.3) / 2,
                        },
                        bounds: bounds_str.to_string(),
                        location_method: "strategy".to_string(),
                    });
                }
            }
        }

        // 回退到直接坐标
        if let (Some(x), Some(y)) = (
            step.parameters.get("x").and_then(|v| v.as_i64()),
            step.parameters.get("y").and_then(|v| v.as_i64())
        ) {
            return Ok(ElementLocationResult {
                success: true,
                target_element: serde_json::json!({"type": "direct_coordinates"}),
                coordinates: Coordinates { x: x as i32, y: y as i32 },
                bounds: format!("[{},{}][{},{}]", x, y, x, y),
                location_method: "direct".to_string(),
            });
        }

        // 解析 bounds
        if let Some(bounds_str) = step.parameters.get("bounds").and_then(|v| v.as_str()) {
            let bounds = self.parse_bounds(bounds_str)?;
            return Ok(ElementLocationResult {
                success: true,
                target_element: serde_json::json!({"type": "bounds_based"}),
                coordinates: Coordinates {
                    x: (bounds.0 + bounds.2) / 2,
                    y: (bounds.1 + bounds.3) / 2,
                },
                bounds: bounds_str.to_string(),
                location_method: "bounds".to_string(),
            });
        }

        Err(anyhow::anyhow!("无法确定元素位置：缺少坐标、bounds或有效的策略匹配结果"))
    }

    async fn execute_action(
        &self,
        step: &SmartScriptStep,
        location: &ElementLocationResult,
    ) -> Result<ActionExecutionResult> {
        let start_time = Instant::now();
        
        // 构造包含坐标的执行步骤
        let mut execute_step = step.clone();
        execute_step.parameters.insert("x".to_string(), serde_json::Value::Number(location.coordinates.x.into()));
        execute_step.parameters.insert("y".to_string(), serde_json::Value::Number(location.coordinates.y.into()));
        execute_step.parameters.insert("bounds".to_string(), serde_json::Value::String(location.bounds.clone()));

        info!("⚡ 执行动作: {} 坐标({}, {})", step.step_type, location.coordinates.x, location.coordinates.y);

        // 调用现有的动作执行器
        let execution_result = self.action_executor.execute_single_step(&execute_step).await
            .context("动作执行失败")?;

        Ok(ActionExecutionResult {
            success: execution_result.status == crate::services::execution::model::ExecutionStatus::Success,
            action_type: format!("{:?}", step.step_type),
            actual_coordinates: Some(location.coordinates.clone()),
            execution_time_ms: start_time.elapsed().as_millis() as u64,
            ui_changed: true, // TODO: 实际检测UI变化
        })
    }

    fn should_execute_in_test_mode(&self, step: &SmartScriptStep) -> bool {
        // 某些步骤在测试模式下也需要执行
        step.name.starts_with("点击") || 
        step.parameters.get("test_click_after_match")
            .and_then(|v| v.as_bool())
            .unwrap_or(false)
    }

    async fn get_ui_snapshot(&self) -> Result<String> {
        // 调用现有的UI获取逻辑
        use crate::services::xml_judgment::get_ui_dump;
        get_ui_dump(&self.device_id, &self.adb_path).await
            .context("获取UI快照失败")
    }

    fn parse_bounds(&self, bounds_str: &str) -> Result<(i32, i32, i32, i32)> {
        // 解析 "[100,200][300,400]" 格式
        let regex = regex::Regex::new(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]")?;
        let captures = regex.captures(bounds_str)
            .ok_or_else(|| anyhow::anyhow!("无效的bounds格式: {}", bounds_str))?;
        
        Ok((
            captures[1].parse()?,
            captures[2].parse()?,
            captures[3].parse()?,
            captures[4].parse()?,
        ))
    }
}
```

### 命令注册更新

```rust
// src-tauri/src/main.rs (更新命令注册)
.invoke_handler(tauri::generate_handler![
    // 新的统一执行命令
    commands::unified_execution::execute_unified_step,
    commands::unified_execution::validate_strategy_only,
    
    // 保留现有命令作为回退
    execute_single_step_test,  // 作为回退选项保留
    
    // 其他现有命令...
    get_employees,
    add_employee,
    // ...
])
```

## 🔄 3. 迁移和兼容性

### 渐进式迁移开关

```typescript
// src/config/featureFlags.ts
export const FEATURE_FLAGS = {
  UNIFIED_EXECUTION: localStorage.getItem('enable_unified_execution') === 'true' || 
                     process.env.REACT_APP_UNIFIED_EXECUTION === 'true',
  
  // 其他功能开关...
} as const;

// 在组件中使用
import { FEATURE_FLAGS } from '@/config/featureFlags';

export function StepTestingPanel() {
  const legacyExecutor = useSingleStepTest();
  const unifiedExecutor = useUnifiedStepExecutor();
  
  const executor = FEATURE_FLAGS.UNIFIED_EXECUTION ? unifiedExecutor : legacyExecutor;
  
  return (
    <div>
      {FEATURE_FLAGS.UNIFIED_EXECUTION && (
        <Tag color="blue">统一执行模式</Tag>
      )}
      {/* 其他UI... */}
    </div>
  );
}
```

### 用户界面开关

```typescript
// 在设置页面添加开关
<Card title="实验性功能">
  <Space direction="vertical">
    <Switch
      checked={FEATURE_FLAGS.UNIFIED_EXECUTION}
      onChange={(checked) => {
        localStorage.setItem('enable_unified_execution', checked.toString());
        window.location.reload(); // 重新加载应用
      }}
      checkedChildren="统一执行"
      unCheckedChildren="传统模式"
    />
    <Typography.Text type="secondary">
      统一执行模式整合了策略匹配和动作执行，提供更一致的体验
    </Typography.Text>
  </Space>
</Card>
```

## ✅ 实现效果

统一后的架构将实现：

1. **真正的策略功能**：策略匹配结果真实影响执行
2. **透明的分阶段处理**：每个阶段结果清晰可见
3. **一致的执行体验**：测试和批量执行使用相同逻辑
4. **完整的错误处理**：每个阶段的错误都能被正确捕获和报告
5. **向后兼容**：现有代码在迁移期间仍然可用

这样的实现将彻底解决当前架构分裂问题，提供真正统一可靠的策略匹配系统。