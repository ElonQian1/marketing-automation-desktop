# Tauri 后端集成实施指南

> 优先级: 🔴 **高**  
> 目标: 替换前端模拟逻辑,实现真实的智能分析后端服务  
> 状态: 📝 待实施

---

## 📋 目录

1. [现状分析](#现状分析)
2. [Phase 1: Rust 后端实现](#phase-1-rust-后端实现)
3. [Phase 2: 防串扰机制](#phase-2-防串扰机制)
4. [Phase 3: 前端集成](#phase-3-前端集成)
5. [Phase 4: 步骤卡集成](#phase-4-步骤卡集成)
6. [测试验证](#测试验证)

---

## 现状分析

### ✅ 已有基础

| 组件 | 状态 | 说明 |
|-----|------|------|
| **前端类型系统** | ✅ 完整 | `intelligent-analysis-types.ts` 定义了所有接口 |
| **selection-hash 计算** | ✅ 完整 | `selection-hash.ts` 实现了前端哈希计算 |
| **IntelligentAnalysisController** | ⚠️ 部分 | 组件框架完整,但使用模拟逻辑 |
| **步骤卡数据模型** | ✅ 完整 | `IntelligentStepCard` 包含所有分析状态字段 |
| **Rust 后端命令** | ❌ 缺失 | 没有智能分析相关命令 |
| **事件系统** | ❌ 缺失 | 没有 analysis:progress/done/error 事件 |

### ❌ 需要实现

1. **Rust 后端模块** - `intelligent_analysis.rs`
2. **Tauri 命令** - `start_intelligent_analysis`, `cancel_intelligent_analysis`, `bind_analysis_result_to_step`
3. **事件发射器** - 实时进度更新
4. **防串扰机制** - selection_hash 校验
5. **前端真实调用** - 替换模拟逻辑

---

## Phase 1: Rust 后端实现

### 1.1 创建后端模块

**文件**: `src-tauri/src/commands/intelligent_analysis.rs`

```rust
// src-tauri/src/commands/intelligent_analysis.rs
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};
use sha1::{Sha1, Digest};

// ============================================
// 类型定义
// ============================================

/// 元素选择上下文
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementSelectionContext {
    pub snapshot_id: String,
    pub element_path: String,
    pub element_text: Option<String>,
    pub element_bounds: Option<String>,
    pub element_type: Option<String>,
    pub key_attributes: Option<HashMap<String, String>>,
    pub container_info: Option<ContainerInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerInfo {
    pub container_type: String,
    pub container_path: String,
    pub item_index: Option<u32>,
    pub total_items: Option<u32>,
}

/// 分析任务配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisJobConfig {
    pub element_context: ElementSelectionContext,
    pub step_id: Option<String>,
    pub lock_container: bool,
    pub enable_smart_candidates: bool,
    pub enable_static_candidates: bool,
}

/// 分析任务状态
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AnalysisJobState {
    Queued,
    Running,
    Completed,
    Failed,
    Canceled,
}

/// 策略候选项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategyCandidate {
    pub key: String,
    pub name: String,
    pub confidence: f32,
    pub description: String,
    pub variant: String,
    pub xpath: Option<String>,
    pub enabled: bool,
    pub is_recommended: bool,
}

/// 分析结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisResult {
    pub selection_hash: String,
    pub step_id: Option<String>,
    pub smart_candidates: Vec<StrategyCandidate>,
    pub static_candidates: Vec<StrategyCandidate>,
    pub recommended_key: String,
    pub recommended_confidence: f32,
    pub fallback_strategy: StrategyCandidate,
}

/// 分析作业响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisJobResponse {
    pub job_id: String,
    pub selection_hash: String,
    pub state: AnalysisJobState,
}

// ============================================
// 事件载荷 (Event Payloads)
// ============================================

#[derive(Debug, Clone, Serialize)]
pub struct AnalysisProgressEvent {
    pub job_id: String,
    pub progress: u8,
    pub current_step: String,
    pub estimated_time_left: Option<u64>,
}

#[derive(Debug, Clone, Serialize)]
pub struct AnalysisDoneEvent {
    pub job_id: String,
    pub selection_hash: String,
    pub result: AnalysisResult,
}

#[derive(Debug, Clone, Serialize)]
pub struct AnalysisErrorEvent {
    pub job_id: String,
    pub selection_hash: String,
    pub error: String,
}

// ============================================
// Selection Hash 计算 (与前端保持一致)
// ============================================

/// 计算 selection_hash
/// 
/// 组成规则 (与前端 TypeScript 实现一致):
/// - snapshot:${snapshotId}
/// - path:${elementPath}
/// - type:${elementType}
/// - text:${textHash}
/// - bounds:${elementBounds}
/// - attrs:${normalizedAttrs}
/// - container:${containerType}:${containerPath}
/// - index:${itemIndex}
pub fn calculate_selection_hash(context: &ElementSelectionContext) -> String {
    let mut components = Vec::new();
    
    // 1. Snapshot ID
    components.push(format!("snapshot:{}", context.snapshot_id));
    
    // 2. Element Path (核心标识)
    components.push(format!("path:{}", context.element_path));
    
    // 3. Element Type
    if let Some(ref element_type) = context.element_type {
        components.push(format!("type:{}", element_type));
    }
    
    // 4. Text Hash
    if let Some(ref text) = context.element_text {
        let text_hash = calculate_text_hash(text);
        components.push(format!("text:{}", text_hash));
    }
    
    // 5. Bounds
    if let Some(ref bounds) = context.element_bounds {
        components.push(format!("bounds:{}", bounds));
    }
    
    // 6. Key Attributes (标准化并排序)
    if let Some(ref attrs) = context.key_attributes {
        let mut attr_pairs: Vec<_> = attrs.iter().collect();
        attr_pairs.sort_by_key(|(k, _)| k.as_str());
        let attr_string: String = attr_pairs
            .iter()
            .map(|(k, v)| format!("{}={}", k, normalize_attribute_value(v)))
            .collect::<Vec<_>>()
            .join("&");
        if !attr_string.is_empty() {
            components.push(format!("attrs:{}", attr_string));
        }
    }
    
    // 7. Container Info
    if let Some(ref container) = context.container_info {
        components.push(format!(
            "container:{}:{}",
            container.container_type, container.container_path
        ));
        if let Some(index) = container.item_index {
            components.push(format!("index:{}", index));
        }
    }
    
    // 组合并计算哈希
    let combined = components.join("|");
    calculate_text_hash(&combined)
}

/// 计算文本哈希 (使用 SHA1)
fn calculate_text_hash(text: &str) -> String {
    let mut hasher = Sha1::new();
    hasher.update(text.as_bytes());
    let result = hasher.finalize();
    format!("{:x}", result)[..12].to_string()
}

/// 标准化属性值
fn normalize_attribute_value(value: &str) -> String {
    value.trim().to_lowercase()
}

// ============================================
// 智能分析服务
// ============================================

pub struct IntelligentAnalysisService {
    active_jobs: Arc<Mutex<HashMap<String, AnalysisJobConfig>>>,
}

impl IntelligentAnalysisService {
    pub fn new() -> Self {
        Self {
            active_jobs: Arc::new(Mutex::new(HashMap::new())),
        }
    }
    
    /// 启动智能分析
    pub async fn start_analysis(
        &self,
        app_handle: AppHandle,
        config: AnalysisJobConfig,
    ) -> Result<AnalysisJobResponse, String> {
        // 1. 计算 selection_hash
        let selection_hash = calculate_selection_hash(&config.element_context);
        
        // 2. 生成 job_id
        let job_id = uuid::Uuid::new_v4().to_string();
        
        // 3. 保存任务
        {
            let mut jobs = self.active_jobs.lock().unwrap();
            jobs.insert(job_id.clone(), config.clone());
        }
        
        // 4. 启动后台分析任务
        let app_handle_clone = app_handle.clone();
        let job_id_clone = job_id.clone();
        let selection_hash_clone = selection_hash.clone();
        let active_jobs_clone = self.active_jobs.clone();
        
        tauri::async_runtime::spawn(async move {
            // 执行分析流程
            if let Err(e) = execute_analysis_workflow(
                app_handle_clone,
                job_id_clone.clone(),
                selection_hash_clone.clone(),
                config,
            ).await {
                // 发送错误事件
                let _ = app_handle_clone.emit_all("analysis:error", AnalysisErrorEvent {
                    job_id: job_id_clone.clone(),
                    selection_hash: selection_hash_clone.clone(),
                    error: e,
                });
            }
            
            // 清理任务
            let mut jobs = active_jobs_clone.lock().unwrap();
            jobs.remove(&job_id_clone);
        });
        
        Ok(AnalysisJobResponse {
            job_id,
            selection_hash,
            state: AnalysisJobState::Running,
        })
    }
    
    /// 取消分析
    pub fn cancel_analysis(&self, job_id: &str) -> Result<(), String> {
        let mut jobs = self.active_jobs.lock().unwrap();
        jobs.remove(job_id);
        Ok(())
    }
}

/// 执行分析工作流
async fn execute_analysis_workflow(
    app_handle: AppHandle,
    job_id: String,
    selection_hash: String,
    config: AnalysisJobConfig,
) -> Result<(), String> {
    // Step 1: 初始化 (10%)
    emit_progress(&app_handle, &job_id, 10, "初始化分析环境").await;
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    // Step 2: XML解析 (30%)
    emit_progress(&app_handle, &job_id, 30, "解析页面结构").await;
    tokio::time::sleep(tokio::time::Duration::from_millis(800)).await;
    
    // Step 3: 智能策略生成 (60%)
    emit_progress(&app_handle, &job_id, 60, "生成智能策略").await;
    tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
    
    // Step 4: 策略评分 (80%)
    emit_progress(&app_handle, &job_id, 80, "评估策略质量").await;
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    // Step 5: 完成 (100%)
    emit_progress(&app_handle, &job_id, 95, "生成分析报告").await;
    
    // 生成分析结果 (TODO: 接入真实的策略生成服务)
    let result = generate_mock_analysis_result(&selection_hash, &config);
    
    // 发送完成事件
    app_handle.emit_all("analysis:done", AnalysisDoneEvent {
        job_id,
        selection_hash,
        result,
    }).map_err(|e| e.to_string())?;
    
    Ok(())
}

/// 发送进度事件
async fn emit_progress(app_handle: &AppHandle, job_id: &str, progress: u8, step: &str) {
    let _ = app_handle.emit_all("analysis:progress", AnalysisProgressEvent {
        job_id: job_id.to_string(),
        progress,
        current_step: step.to_string(),
        estimated_time_left: Some(((100 - progress) as u64) * 50), // 估算剩余时间
    });
}

/// 生成模拟分析结果 (临时实现,后续接入真实服务)
fn generate_mock_analysis_result(
    selection_hash: &str,
    config: &AnalysisJobConfig,
) -> AnalysisResult {
    let smart_candidates = vec![
        StrategyCandidate {
            key: "self_anchor".to_string(),
            name: "自锚定策略".to_string(),
            confidence: 95.0,
            description: "基于 resource-id 直接定位".to_string(),
            variant: "self_anchor".to_string(),
            xpath: Some("//*[@resource-id='com.example:id/button']".to_string()),
            enabled: true,
            is_recommended: true,
        },
        StrategyCandidate {
            key: "child_driven".to_string(),
            name: "子元素驱动策略".to_string(),
            confidence: 85.0,
            description: "通过子元素特征定位".to_string(),
            variant: "child_driven".to_string(),
            xpath: Some("//*[contains(@text,'确定')]".to_string()),
            enabled: true,
            is_recommended: false,
        },
    ];
    
    let fallback = StrategyCandidate {
        key: "index_fallback".to_string(),
        name: "索引兜底策略".to_string(),
        confidence: 60.0,
        description: "基于位置索引定位".to_string(),
        variant: "index_fallback".to_string(),
        xpath: Some("(//*[@class='Button'])[3]".to_string()),
        enabled: true,
        is_recommended: false,
    };
    
    AnalysisResult {
        selection_hash: selection_hash.to_string(),
        step_id: config.step_id.clone(),
        smart_candidates: smart_candidates.clone(),
        static_candidates: vec![],
        recommended_key: "self_anchor".to_string(),
        recommended_confidence: 95.0,
        fallback_strategy: fallback,
    }
}

// ============================================
// Tauri 命令
// ============================================

lazy_static::lazy_static! {
    static ref ANALYSIS_SERVICE: IntelligentAnalysisService = IntelligentAnalysisService::new();
}

/// 启动智能分析
#[tauri::command]
pub async fn start_intelligent_analysis(
    app_handle: AppHandle,
    config: AnalysisJobConfig,
) -> Result<AnalysisJobResponse, String> {
    ANALYSIS_SERVICE.start_analysis(app_handle, config).await
}

/// 取消智能分析
#[tauri::command]
pub async fn cancel_intelligent_analysis(job_id: String) -> Result<(), String> {
    ANALYSIS_SERVICE.cancel_analysis(&job_id)
}

/// 绑定分析结果到步骤卡
#[tauri::command]
pub async fn bind_analysis_result_to_step(
    step_id: String,
    result: AnalysisResult,
) -> Result<(), String> {
    // TODO: 实现将分析结果保存到步骤卡数据
    println!("绑定分析结果到步骤 {}: {:?}", step_id, result);
    Ok(())
}
```

### 1.2 更新 mod.rs

**文件**: `src-tauri/src/commands/mod.rs`

```rust
// src-tauri/src/commands/mod.rs
pub mod app_lifecycle_commands;
pub mod employees;
pub mod adb;
pub mod files;
pub mod page_analysis;
pub mod logging;
pub mod xml_cache;
pub mod metrics;
pub mod strategy_matching;
pub mod xpath_execution;
pub mod intelligent_analysis; // ✅ 新增

// 导出命令
pub use employees::*;
pub use adb::*;
pub use files::*;
pub use page_analysis::*;
pub use logging::*;
pub use xml_cache::*;
pub use xpath_execution::*;
pub use metrics::*;
pub use strategy_matching::*;
pub use intelligent_analysis::*; // ✅ 新增
```

### 1.3 注册 Tauri 命令

**文件**: `src-tauri/src/main.rs`

```rust
// src-tauri/src/main.rs
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // ... 现有命令 ...
            
            // ✅ 新增: 智能分析命令
            commands::start_intelligent_analysis,
            commands::cancel_intelligent_analysis,
            commands::bind_analysis_result_to_step,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 1.4 添加依赖

**文件**: `src-tauri/Cargo.toml`

```toml
[dependencies]
# ... 现有依赖 ...
sha1 = "0.10"
uuid = { version = "1.0", features = ["v4", "serde"] }
lazy_static = "1.4"
```

---

## Phase 2: 防串扰机制

### 2.1 后端 selection_hash 校验

后端已在 Phase 1 实现,关键点:

1. ✅ `calculate_selection_hash()` 函数与前端逻辑一致
2. ✅ 所有事件携带 `selection_hash`
3. ✅ 结果中包含 `selection_hash` 用于前端校验

### 2.2 前端三重校验

**修改文件**: `src/modules/universal-ui/components/intelligent-analysis-controller.tsx`

添加防串扰逻辑:

```typescript
// 在组件中添加 useEffect 监听事件
useEffect(() => {
  if (!visible) return;
  
  let unlistenProgress: (() => void) | null = null;
  let unlistenDone: (() => void) | null = null;
  let unlistenError: (() => void) | null = null;
  
  const setupListeners = async () => {
    const { listen } = await import('@tauri-apps/api/event');
    
    // 监听进度事件
    unlistenProgress = await listen<AnalysisProgressEvent>('analysis:progress', (event) => {
      const { jobId, progress, currentStep } = event.payload;
      
      // 🔒 校验 jobId
      if (currentJob?.jobId !== jobId) {
        console.warn('[防串扰] jobId 不匹配,忽略进度事件', { expected: currentJob?.jobId, got: jobId });
        return;
      }
      
      // 更新进度
      onProgressUpdate?.(progress, currentStep);
    });
    
    // 监听完成事件
    unlistenDone = await listen<AnalysisDoneEvent>('analysis:done', (event) => {
      const { jobId, selectionHash: resultHash, result } = event.payload;
      
      // 🔒 三重校验
      // 1. 校验 jobId
      if (currentJob?.jobId !== jobId) {
        console.warn('[防串扰] jobId 不匹配,忽略完成事件', { expected: currentJob?.jobId, got: jobId });
        return;
      }
      
      // 2. 校验 selectionHash
      const currentHash = calculateSelectionHash(elementContext);
      if (currentHash !== resultHash) {
        console.warn('[防串扰] selectionHash 不匹配,忽略完成事件', { expected: currentHash, got: resultHash });
        return;
      }
      
      // 3. 校验 stepId (如果存在)
      if (currentJob.stepId && result.stepId && currentJob.stepId !== result.stepId) {
        console.warn('[防串扰] stepId 不匹配,忽略完成事件', { expected: currentJob.stepId, got: result.stepId });
        return;
      }
      
      // ✅ 通过校验,处理结果
      onAnalysisComplete?.(result);
    });
    
    // 监听错误事件
    unlistenError = await listen<AnalysisErrorEvent>('analysis:error', (event) => {
      const { jobId, selectionHash: resultHash, error } = event.payload;
      
      // 🔒 校验 jobId 和 selectionHash
      if (currentJob?.jobId !== jobId) return;
      
      const currentHash = calculateSelectionHash(elementContext);
      if (currentHash !== resultHash) return;
      
      // ✅ 通过校验,处理错误
      onAnalysisError?.(error);
    });
  };
  
  setupListeners();
  
  // 清理监听器
  return () => {
    unlistenProgress?.();
    unlistenDone?.();
    unlistenError?.();
  };
}, [visible, currentJob, elementContext]);

// 元素切换时自动取消旧任务
useEffect(() => {
  const currentHash = calculateSelectionHash(elementContext);
  
  // 检测到元素切换
  if (currentJob && currentJob.selectionHash !== currentHash) {
    console.log('[防串扰] 检测到元素切换,取消旧任务', {
      oldHash: currentJob.selectionHash,
      newHash: currentHash
    });
    
    // 调用后端取消
    invoke('cancel_intelligent_analysis', { jobId: currentJob.jobId })
      .catch(err => console.error('取消分析失败', err));
    
    // 清理本地状态
    onCancelAnalysis?.();
  }
}, [elementContext, currentJob]);
```

---

## Phase 3: 前端集成

### 3.1 替换模拟逻辑

**修改文件**: `src/modules/universal-ui/components/intelligent-analysis-controller.tsx`

找到启动分析的逻辑,替换为真实调用:

```typescript
/**
 * 启动智能分析 (真实后端调用)
 */
const handleStartAnalysis = useCallback(async () => {
  try {
    const { invoke } = await import('@tauri-apps/api');
    
    // 计算 selection_hash
    const selectionHash = calculateSelectionHash(elementContext);
    
    // 构建分析配置
    const config: AnalysisJobConfig = {
      elementContext: {
        snapshotId: elementContext.snapshotId,
        elementPath: elementContext.elementPath,
        elementText: elementContext.elementText,
        elementBounds: elementContext.elementBounds,
        elementType: elementContext.elementType,
        keyAttributes: elementContext.keyAttributes,
        containerInfo: elementContext.containerInfo,
      },
      stepId: currentJob?.stepId,
      lockContainer: localLockContainer,
      enableSmartCandidates: true,
      enableStaticCandidates: true,
    };
    
    // 🚀 调用后端命令
    const response = await invoke<AnalysisJobResponse>(
      'start_intelligent_analysis',
      { config }
    );
    
    console.log('✅ 分析任务已启动', response);
    
    // 触发父组件回调
    onStartAnalysis?.();
    
  } catch (error) {
    console.error('❌ 启动分析失败', error);
    // 处理错误...
  }
}, [elementContext, localLockContainer, currentJob, onStartAnalysis]);
```

### 3.2 取消分析

```typescript
/**
 * 取消智能分析
 */
const handleCancelAnalysis = useCallback(async () => {
  if (!currentJob) return;
  
  try {
    const { invoke } = await import('@tauri-apps/api');
    
    await invoke('cancel_intelligent_analysis', { 
      jobId: currentJob.jobId 
    });
    
    console.log('✅ 分析已取消', currentJob.jobId);
    onCancelAnalysis?.();
    
  } catch (error) {
    console.error('❌ 取消分析失败', error);
  }
}, [currentJob, onCancelAnalysis]);
```

---

## Phase 4: 步骤卡集成

### 4.1 分析完成后自动回填

**创建文件**: `src/modules/universal-ui/hooks/use-analysis-auto-fill.ts`

```typescript
// src/modules/universal-ui/hooks/use-analysis-auto-fill.ts
// module: universal-ui | layer: hooks | role: custom-hook
// summary: 分析完成后自动回填步骤卡数据

import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api';
import type { AnalysisResult, IntelligentStepCard } from '../types/intelligent-analysis-types';

export interface UseAnalysisAutoFillOptions {
  /** 是否启用自动回填 */
  enabled?: boolean;
  /** 回填前确认 */
  requireConfirmation?: boolean;
  /** 回填成功回调 */
  onFillSuccess?: (stepCard: IntelligentStepCard) => void;
  /** 回填失败回调 */
  onFillError?: (error: string) => void;
}

export function useAnalysisAutoFill(options: UseAnalysisAutoFillOptions = {}) {
  const {
    enabled = true,
    requireConfirmation = false,
    onFillSuccess,
    onFillError,
  } = options;
  
  /**
   * 自动回填分析结果
   */
  const autoFillResult = useCallback(async (
    stepCard: IntelligentStepCard,
    result: AnalysisResult
  ) => {
    if (!enabled) return;
    
    try {
      // 1. 用户确认 (可选)
      if (requireConfirmation) {
        const confirmed = window.confirm(
          `检测到智能分析结果:\n` +
          `推荐策略: ${result.smartCandidates.find(c => c.key === result.recommendedKey)?.name}\n` +
          `置信度: ${result.recommendedConfidence}%\n\n` +
          `是否自动应用到步骤卡?`
        );
        if (!confirmed) return;
      }
      
      // 2. 调用后端绑定
      await invoke('bind_analysis_result_to_step', {
        stepId: stepCard.stepId,
        result,
      });
      
      // 3. 更新本地步骤卡状态
      const recommendedStrategy = result.smartCandidates.find(
        c => c.key === result.recommendedKey
      );
      
      const updatedCard: IntelligentStepCard = {
        ...stepCard,
        analysisState: 'analysis_completed',
        analysisProgress: 100,
        smartCandidates: result.smartCandidates,
        staticCandidates: result.staticCandidates,
        recommendedStrategy,
        activeStrategy: recommendedStrategy,
        fallbackStrategy: result.fallbackStrategy,
        analyzedAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      // 4. 回调通知
      onFillSuccess?.(updatedCard);
      
      console.log('✅ 分析结果已自动回填', updatedCard);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ 自动回填失败', error);
      onFillError?.(errorMsg);
    }
  }, [enabled, requireConfirmation, onFillSuccess, onFillError]);
  
  /**
   * 撤销回填
   */
  const undoFill = useCallback(async (stepCard: IntelligentStepCard) => {
    try {
      const updatedCard: IntelligentStepCard = {
        ...stepCard,
        analysisState: 'idle',
        analysisProgress: 0,
        smartCandidates: [],
        staticCandidates: [],
        recommendedStrategy: undefined,
        activeStrategy: undefined,
        analyzedAt: undefined,
        updatedAt: Date.now(),
      };
      
      onFillSuccess?.(updatedCard);
      console.log('✅ 已撤销分析结果');
      
    } catch (error) {
      console.error('❌ 撤销失败', error);
    }
  }, [onFillSuccess]);
  
  return {
    autoFillResult,
    undoFill,
  };
}
```

### 4.2 在 Controller 中使用

```typescript
// 在 IntelligentAnalysisController 中
import { useAnalysisAutoFill } from '../hooks/use-analysis-auto-fill';

// 组件内部
const { autoFillResult } = useAnalysisAutoFill({
  enabled: true,
  requireConfirmation: true, // 需要用户确认
  onFillSuccess: (card) => {
    console.log('步骤卡已更新', card);
    // 通知父组件...
  },
  onFillError: (error) => {
    console.error('回填失败', error);
  },
});

// 在 analysis:done 事件处理中
unlistenDone = await listen<AnalysisDoneEvent>('analysis:done', async (event) => {
  // ... 三重校验 ...
  
  // ✅ 自动回填步骤卡
  if (currentStepCard) {
    await autoFillResult(currentStepCard, result);
  }
});
```

---

## 测试验证

### 测试清单

#### 1. 后端命令测试

```bash
# 启动开发模式
pnpm tauri dev

# 在浏览器控制台测试命令
```

```javascript
// 测试启动分析
const { invoke } = window.__TAURI__.tauri;

const config = {
  elementContext: {
    snapshotId: 'test-123',
    elementPath: '/hierarchy/android.widget.Button[0]',
    elementText: '确定',
    elementType: 'Button',
    keyAttributes: {
      'resource-id': 'com.example:id/btn_confirm'
    }
  },
  lockContainer: false,
  enableSmartCandidates: true,
  enableStaticCandidates: true
};

const response = await invoke('start_intelligent_analysis', { config });
console.log('分析任务已启动', response);
```

#### 2. 事件监听测试

```javascript
// 监听进度事件
const { listen } = window.__TAURI__.event;

await listen('analysis:progress', (event) => {
  console.log('进度更新', event.payload);
});

await listen('analysis:done', (event) => {
  console.log('分析完成', event.payload);
});

await listen('analysis:error', (event) => {
  console.error('分析错误', event.payload);
});
```

#### 3. 防串扰测试

**场景1: jobId 不匹配**
- 启动分析 A (jobId: xxx)
- 启动分析 B (jobId: yyy)
- 验证: A 的结果不会被 B 处理

**场景2: selectionHash 不匹配**
- 选择元素 A,启动分析
- 切换到元素 B
- 验证: 元素 A 的分析结果被忽略

**场景3: stepId 不匹配**
- 步骤卡 A 启动分析
- 切换到步骤卡 B
- 验证: 步骤卡 A 的结果不会填充到 B

#### 4. 完整流程测试

1. ✅ 点击"智能分析"按钮
2. ✅ 后端开始分析,发送进度事件
3. ✅ 前端显示进度条和当前步骤
4. ✅ 分析完成,发送 done 事件
5. ✅ 前端进行三重校验
6. ✅ 校验通过,显示分析结果
7. ✅ 用户确认,自动回填步骤卡
8. ✅ 步骤卡状态更新,显示推荐策略

---

## 后续优化

### 短期 (2周内)

- [ ] 接入真实的策略生成服务 (替换 mock 数据)
- [ ] 实现分析任务队列管理
- [ ] 添加分析任务持久化
- [ ] 优化错误处理和重试机制

### 中期 (1个月内)

- [ ] 实现 ETA 精确计算
- [ ] 添加分析缓存机制
- [ ] 支持批量分析
- [ ] 添加分析报告导出

### 长期 (3个月内)

- [ ] 机器学习优化置信度评分
- [ ] 跨设备策略迁移
- [ ] 分析性能优化
- [ ] 企业级可观测性埋点

---

## 相关文档

- [组件架构说明](./组件架构说明.md)
- [完整性与冗余验证报告](./完整性与冗余验证报告.md)
- [组件重构总结报告](./组件重构总结报告.md)
- [点选元素气泡3整理](./点选元素气泡3整理.md)

---

**准备好了吗?让我们开始实施!** 🚀
