// src-tauri/src/commands/semantic_analyzer_config.rs
// module: commands | layer: commands | role: 语义分析器配置管理命令
// summary: 处理语义分析器配置的保存、加载和管理操作

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AntonymPair {
    pub id: String,
    pub word1: String,
    pub word2: String,
    pub confidence: Option<f64>,
    pub description: Option<String>,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticAnalyzerConfig {
    pub enabled: bool,
    pub text_matching_mode: String, // "exact" or "partial"
    pub antonym_pairs: Vec<AntonymPair>,
    pub antonym_penalty_score: f64,
}

impl Default for SemanticAnalyzerConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            text_matching_mode: "partial".to_string(),
            antonym_pairs: vec![
                AntonymPair {
                    id: "default_1".to_string(),
                    word1: "关注".to_string(),
                    word2: "已关注".to_string(),
                    confidence: Some(0.9),
                    description: Some("防止误点击已关注的用户".to_string()),
                    enabled: true,
                },
                AntonymPair {
                    id: "default_2".to_string(),
                    word1: "登录".to_string(),
                    word2: "退出".to_string(),
                    confidence: Some(0.8),
                    description: Some("防止登录/退出操作混淆".to_string()),
                    enabled: true,
                },
                AntonymPair {
                    id: "default_3".to_string(),
                    word1: "打开".to_string(),
                    word2: "关闭".to_string(),
                    confidence: Some(0.7),
                    description: Some("防止开关状态操作混淆".to_string()),
                    enabled: true,
                },
            ],
            antonym_penalty_score: 0.5,
        }
    }
}

/// 获取配置文件路径
fn get_config_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("获取应用数据目录失败: {}", e))?;
    
    // 确保目录存在
    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("创建应用数据目录失败: {}", e))?;
    
    Ok(app_data_dir.join("semantic_analyzer_config.json"))
}

/// 加载语义分析器配置
#[tauri::command]
pub async fn load_semantic_analyzer_config(app_handle: AppHandle) -> Result<SemanticAnalyzerConfig, String> {
    let config_path = get_config_path(&app_handle)?;
    
    if !config_path.exists() {
        tracing::info!("配置文件不存在，使用默认配置: {:?}", config_path);
        return Ok(SemanticAnalyzerConfig::default());
    }
    
    let config_content = fs::read_to_string(&config_path)
        .map_err(|e| format!("读取配置文件失败: {}", e))?;
    
    let config: SemanticAnalyzerConfig = serde_json::from_str(&config_content)
        .map_err(|e| format!("解析配置文件失败: {}", e))?;
    
    tracing::info!("成功加载语义分析器配置");
    Ok(config)
}

/// 保存语义分析器配置
#[tauri::command]
pub async fn save_semantic_analyzer_config(
    app_handle: AppHandle,
    config: SemanticAnalyzerConfig,
) -> Result<(), String> {
    let config_path = get_config_path(&app_handle)?;
    
    let config_content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("序列化配置失败: {}", e))?;
    
    fs::write(&config_path, config_content)
        .map_err(|e| format!("写入配置文件失败: {}", e))?;
    
    tracing::info!("成功保存语义分析器配置: {:?}", config_path);
    Ok(())
}

/// 重置为默认配置
#[tauri::command]
pub async fn reset_semantic_analyzer_config(app_handle: AppHandle) -> Result<SemanticAnalyzerConfig, String> {
    let default_config = SemanticAnalyzerConfig::default();
    save_semantic_analyzer_config(app_handle, default_config.clone()).await?;
    tracing::info!("已重置为默认语义分析器配置");
    Ok(default_config)
}

/// 测试反义词检测
#[derive(Debug, Serialize)]
pub struct AntonymTestResult {
    pub should_match: bool,
    pub has_antonym_conflict: bool,
    pub message: String,
    pub conflict_pair: Option<AntonymPair>,
}

#[tauri::command]
pub async fn test_antonym_detection(
    app_handle: AppHandle,
    target: String,
    candidate: String,
) -> Result<AntonymTestResult, String> {
    let config = load_semantic_analyzer_config(app_handle).await?;
    
    if !config.enabled {
        return Ok(AntonymTestResult {
            should_match: true,
            has_antonym_conflict: false,
            message: "语义分析器已禁用，允许匹配".to_string(),
            conflict_pair: None,
        });
    }
    
    if config.text_matching_mode == "exact" {
        let should_match = target.trim() == candidate.trim();
        return Ok(AntonymTestResult {
            should_match,
            has_antonym_conflict: false,
            message: if should_match {
                "绝对匹配：文本完全一致".to_string()
            } else {
                "绝对匹配：文本不一致".to_string()
            },
            conflict_pair: None,
        });
    }
    
    // 检查反义词冲突
    let enabled_pairs: Vec<&AntonymPair> = config.antonym_pairs.iter().filter(|p| p.enabled).collect();
    let conflict_pair = enabled_pairs.iter().find(|p| {
        (p.word1 == target && p.word2 == candidate) ||
        (p.word2 == target && p.word1 == candidate)
    });
    
    if let Some(pair) = conflict_pair {
        Ok(AntonymTestResult {
            should_match: false,
            has_antonym_conflict: true,
            message: format!("检测到反义词冲突：{} ↔ {}", pair.word1, pair.word2),
            conflict_pair: Some((*pair).clone()),
        })
    } else {
        Ok(AntonymTestResult {
            should_match: true,
            has_antonym_conflict: false,
            message: "部分匹配：未检测到反义词冲突".to_string(),
            conflict_pair: None,
        })
    }
}

/// 添加反义词对
#[tauri::command]
pub async fn add_antonym_pair(
    app_handle: AppHandle,
    pair: AntonymPair,
) -> Result<(), String> {
    let mut config = load_semantic_analyzer_config(app_handle.clone()).await?;
    
    // 检查是否已存在相同的反义词对
    if config.antonym_pairs.iter().any(|p| p.id == pair.id) {
        return Err("反义词对ID已存在".to_string());
    }
    
    config.antonym_pairs.push(pair);
    save_semantic_analyzer_config(app_handle, config).await?;
    
    tracing::info!("成功添加反义词对");
    Ok(())
}

/// 更新反义词对
#[tauri::command]
pub async fn update_antonym_pair(
    app_handle: AppHandle,
    pair: AntonymPair,
) -> Result<(), String> {
    let mut config = load_semantic_analyzer_config(app_handle.clone()).await?;
    
    if let Some(existing_pair) = config.antonym_pairs.iter_mut().find(|p| p.id == pair.id) {
        *existing_pair = pair;
        save_semantic_analyzer_config(app_handle, config).await?;
        tracing::info!("成功更新反义词对");
        Ok(())
    } else {
        Err("反义词对不存在".to_string())
    }
}

/// 删除反义词对
#[tauri::command]
pub async fn delete_antonym_pair(
    app_handle: AppHandle,
    pair_id: String,
) -> Result<(), String> {
    let mut config = load_semantic_analyzer_config(app_handle.clone()).await?;
    
    let original_len = config.antonym_pairs.len();
    config.antonym_pairs.retain(|p| p.id != pair_id);
    
    if config.antonym_pairs.len() == original_len {
        return Err("反义词对不存在".to_string());
    }
    
    save_semantic_analyzer_config(app_handle, config).await?;
    tracing::info!("成功删除反义词对: {}", pair_id);
    Ok(())
}

/// 切换反义词对启用状态
#[tauri::command]
pub async fn toggle_antonym_pair(
    app_handle: AppHandle,
    pair_id: String,
    enabled: bool,
) -> Result<(), String> {
    let mut config = load_semantic_analyzer_config(app_handle.clone()).await?;
    
    if let Some(pair) = config.antonym_pairs.iter_mut().find(|p| p.id == pair_id) {
        pair.enabled = enabled;
        save_semantic_analyzer_config(app_handle, config).await?;
        tracing::info!("成功切换反义词对状态: {} -> {}", pair_id, enabled);
        Ok(())
    } else {
        Err("反义词对不存在".to_string())
    }
}

/// 导出配置
#[tauri::command]
pub async fn export_semantic_analyzer_config(app_handle: AppHandle) -> Result<String, String> {
    let config = load_semantic_analyzer_config(app_handle).await?;
    let config_json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("序列化配置失败: {}", e))?;
    
    tracing::info!("成功导出语义分析器配置");
    Ok(config_json)
}

/// 导入配置
#[tauri::command]
pub async fn import_semantic_analyzer_config(
    app_handle: AppHandle,
    config_json: String,
) -> Result<SemanticAnalyzerConfig, String> {
    let config: SemanticAnalyzerConfig = serde_json::from_str(&config_json)
        .map_err(|e| format!("解析导入配置失败: {}", e))?;
    
    save_semantic_analyzer_config(app_handle, config.clone()).await?;
    tracing::info!("成功导入语义分析器配置");
    Ok(config)
}
