// src-tauri/src/exec/v3/helpers/execution_tracker.rs
// module: exec | layer: v3/helpers | role: 执行追踪管理
// summary: 管理执行中的analysis_id，防止重复执行和资源竞争

use std::collections::HashSet;
use std::sync::{Arc, Mutex};

lazy_static::lazy_static! {
    /// 🚨 【重复执行保护】全局执行追踪器
    /// 
    /// 功能：
    /// - 追踪当前正在执行的 analysis_id
    /// - 防止同一个 analysis_id 被重复执行导致重复点击
    /// - 执行完成后自动释放锁定
    static ref EXECUTION_TRACKER: Arc<Mutex<HashSet<String>>> = Arc::new(Mutex::new(HashSet::new()));
}

/// 检查 analysis_id 是否正在执行中
pub fn is_executing(analysis_id: &str) -> bool {
    let tracker = EXECUTION_TRACKER.lock().unwrap();
    tracker.contains(analysis_id)
}

/// 尝试锁定 analysis_id（如果未被锁定）
/// 
/// Returns:
/// - Ok(true): 成功锁定，可以继续执行
/// - Ok(false): 已被锁定，不应重复执行
pub fn try_lock(analysis_id: &str) -> Result<bool, String> {
    let mut tracker = EXECUTION_TRACKER.lock()
        .map_err(|e| format!("获取执行追踪器锁失败: {}", e))?;
    
    if tracker.contains(analysis_id) {
        tracing::warn!("❌ 【重复执行阻止】analysis_id '{}' 已在执行中", analysis_id);
        Ok(false)
    } else {
        tracker.insert(analysis_id.to_string());
        tracing::info!("🔒 【执行保护】已锁定 analysis_id '{}'", analysis_id);
        Ok(true)
    }
}

/// 强制锁定 analysis_id（即使已被锁定也会覆盖）
/// 
/// ⚠️ 谨慎使用：这会打破重复执行保护机制
pub fn force_lock(analysis_id: &str) -> Result<(), String> {
    let mut tracker = EXECUTION_TRACKER.lock()
        .map_err(|e| format!("获取执行追踪器锁失败: {}", e))?;
    
    tracker.insert(analysis_id.to_string());
    tracing::warn!("⚠️ 【强制锁定】analysis_id '{}'", analysis_id);
    Ok(())
}

/// 解锁 analysis_id，允许后续执行
pub fn unlock(analysis_id: &str) -> Result<(), String> {
    let mut tracker = EXECUTION_TRACKER.lock()
        .map_err(|e| format!("获取执行追踪器锁失败: {}", e))?;
    
    let was_locked = tracker.remove(analysis_id);
    
    if was_locked {
        tracing::info!("🔓 【执行保护】已释放 analysis_id '{}' 锁定", analysis_id);
    } else {
        tracing::warn!("⚠️ 【执行保护】尝试释放未锁定的 analysis_id '{}'", analysis_id);
    }
    
    Ok(())
}

/// 清空所有执行追踪（用于测试或紧急情况）
/// 
/// ⚠️ 谨慎使用：这会清除所有执行保护
pub fn clear_all() -> Result<(), String> {
    let mut tracker = EXECUTION_TRACKER.lock()
        .map_err(|e| format!("获取执行追踪器锁失败: {}", e))?;
    
    let count = tracker.len();
    tracker.clear();
    tracing::warn!("🧹 【执行保护】已清空所有执行追踪 (共 {} 个)", count);
    
    Ok(())
}

/// 获取当前正在执行的 analysis_id 列表（用于调试）
pub fn get_active_executions() -> Result<Vec<String>, String> {
    let tracker = EXECUTION_TRACKER.lock()
        .map_err(|e| format!("获取执行追踪器锁失败: {}", e))?;
    
    Ok(tracker.iter().cloned().collect())
}

/// 获取当前执行数量
pub fn count() -> usize {
    let tracker = EXECUTION_TRACKER.lock().unwrap();
    tracker.len()
}

/// 🛡️ RAII 执行锁守卫
/// 
/// 自动管理执行锁的生命周期：
/// - 创建时自动锁定
/// - 析构时自动释放
/// - 异常退出时也能确保释放
/// 
/// # 使用示例
/// 
/// ```rust
/// // 方式1: 使用 ? 操作符，自动传播错误
/// let _guard = ExecutionLockGuard::try_new(analysis_id)?;
/// // ... 执行逻辑
/// // guard 在作用域结束时自动释放
/// 
/// // 方式2: 手动检查
/// let guard = match ExecutionLockGuard::try_new(analysis_id) {
///     Some(g) => g,
///     None => return Err("已在执行中".to_string()),
/// };
/// 
/// // 方式3: 提前释放
/// let guard = ExecutionLockGuard::try_new(analysis_id)?;
/// // ... 执行逻辑
/// drop(guard);  // 显式释放，后续代码不持有锁
/// ```
#[derive(Debug)]
pub struct ExecutionLockGuard {
    analysis_id: String,
    released: bool,
}

impl ExecutionLockGuard {
    /// 创建新的锁守卫（如果锁定失败会 panic）
    /// 
    /// ⚠️ 仅在确信能成功锁定时使用
    #[allow(dead_code)]
    pub fn new(analysis_id: &str) -> Self {
        force_lock(analysis_id).expect("获取执行锁失败");
        Self {
            analysis_id: analysis_id.to_string(),
            released: false,
        }
    }
    
    /// 尝试创建锁守卫（如果锁定失败返回 None）
    /// 
    /// 这是推荐的使用方式
    pub fn try_new(analysis_id: &str) -> Option<Self> {
        if try_lock(analysis_id).ok()? {
            Some(Self {
                analysis_id: analysis_id.to_string(),
                released: false,
            })
        } else {
            None
        }
    }
    
    /// 手动释放锁（提前释放，不等析构）
    pub fn release(mut self) {
        if !self.released {
            if let Err(e) = unlock(&self.analysis_id) {
                tracing::error!("❌ 手动释放执行锁失败: {}", e);
            }
            self.released = true;
        }
    }
}

impl Drop for ExecutionLockGuard {
    fn drop(&mut self) {
        if !self.released {
            if let Err(e) = unlock(&self.analysis_id) {
                tracing::error!("❌ 析构时释放执行锁失败: {}", e);
            } else {
                tracing::debug!("🔓 【RAII】守卫析构时自动释放锁: {}", self.analysis_id);
            }
        }
    }
}

/// 便捷函数：带守卫的锁定
/// 
/// 这是最推荐的使用方式，配合 ? 操作符使用
pub fn lock_with_guard(analysis_id: &str) -> Result<ExecutionLockGuard, String> {
    ExecutionLockGuard::try_new(analysis_id)
        .ok_or_else(|| format!("重复执行请求被阻止: analysis_id '{}' 正在执行中", analysis_id))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lock_and_unlock() {
        clear_all().unwrap();
        
        let analysis_id = "test_id_1";
        
        // 第一次锁定应该成功
        assert!(try_lock(analysis_id).unwrap());
        assert!(is_executing(analysis_id));
        
        // 重复锁定应该失败
        assert!(!try_lock(analysis_id).unwrap());
        
        // 解锁后应该可以再次锁定
        unlock(analysis_id).unwrap();
        assert!(!is_executing(analysis_id));
        assert!(try_lock(analysis_id).unwrap());
        
        // 清理
        clear_all().unwrap();
    }

    #[test]
    fn test_multiple_ids() {
        clear_all().unwrap();
        
        assert!(try_lock("id1").unwrap());
        assert!(try_lock("id2").unwrap());
        assert!(try_lock("id3").unwrap());
        
        assert_eq!(count(), 3);
        
        unlock("id2").unwrap();
        assert_eq!(count(), 2);
        
        clear_all().unwrap();
        assert_eq!(count(), 0);
    }
    
    #[test]
    fn test_guard_auto_release() {
        clear_all().unwrap();
        
        let analysis_id = "test_guard_id";
        
        {
            let _guard = ExecutionLockGuard::try_new(analysis_id).unwrap();
            assert!(is_executing(analysis_id));
            // 作用域结束时 guard 自动释放
        }
        
        assert!(!is_executing(analysis_id));
    }
    
    #[test]
    fn test_guard_manual_release() {
        clear_all().unwrap();
        
        let analysis_id = "test_manual_release";
        
        let guard = ExecutionLockGuard::try_new(analysis_id).unwrap();
        assert!(is_executing(analysis_id));
        
        // 手动释放
        guard.release();
        assert!(!is_executing(analysis_id));
    }
    
    #[test]
    fn test_guard_prevents_duplicate() {
        clear_all().unwrap();
        
        let analysis_id = "test_duplicate";
        
        let _guard1 = ExecutionLockGuard::try_new(analysis_id).unwrap();
        
        // 第二次尝试应该失败
        let guard2 = ExecutionLockGuard::try_new(analysis_id);
        assert!(guard2.is_none());
    }
    
    #[test]
    fn test_lock_with_guard_function() {
        clear_all().unwrap();
        
        let analysis_id = "test_guard_fn";
        
        // 测试成功情况
        let result = lock_with_guard(analysis_id);
        assert!(result.is_ok());
        assert!(is_executing(analysis_id));
        
        // 测试失败情况
        let result2 = lock_with_guard(analysis_id);
        assert!(result2.is_err());
        assert!(result2.unwrap_err().contains("重复执行"));
    }
}

