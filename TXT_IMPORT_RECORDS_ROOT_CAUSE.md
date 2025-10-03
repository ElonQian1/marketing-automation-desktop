# TXT 导入记录不显示的根本原因分析

## 🔴 核心问题

**数据库中 TXT 导入记录表完全为空（COUNT = 0）**，但号码表中有数据，说明：
1. ✅ 号码导入功能正常
2. ❌ 创建导入记录失败（被静默忽略了）

## 🔍 根本原因

### 原因 1：UNIQUE 约束冲突

查看表结构发现：
```sql
CREATE TABLE txt_import_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL UNIQUE,  -- ⚠️ UNIQUE 约束！
    ...
)
```

**问题**：
- 如果用户选择同一个文件多次导入（即使文件内容不同）
- 第二次导入时 `INSERT` 会因为 `file_path` UNIQUE 约束失败
- 后端代码使用 `let _ = with_db_connection(...)` 或 `if let Err(e) = ...` 只记录错误到 `eprintln!()`
- **前端完全看不到这个错误**

### 原因 2：错误日志位置

```rust
if let Err(e) = with_db_connection(&app_handle, |conn| {
    txt_import_records_repo::create_txt_import_record(...)
}) {
    eprintln!("⚠️  创建TXT导入记录失败: {}", e);  // ❌ 只打印到后端控制台
}
```

用户看不到后端控制台输出，所以不知道发生了什么。

## 🔧 解决方案

### 方案 A：改为 UPSERT（推荐）

修改创建记录逻辑，使用 `INSERT OR REPLACE`：

```rust
pub fn create_txt_import_record(...) -> SqliteResult<i64> {
    let mut stmt = conn.prepare(
        "INSERT INTO txt_import_records 
         (file_path, file_name, total_numbers, successful_imports, duplicate_numbers, import_status, error_message, imported_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'))
         ON CONFLICT(file_path) DO UPDATE SET
           total_numbers = excluded.total_numbers,
           successful_imports = excluded.successful_imports,
           duplicate_numbers = excluded.duplicate_numbers,
           import_status = excluded.import_status,
           error_message = excluded.error_message,
           imported_at = datetime('now'),
           updated_at = datetime('now')"
    )?;
    
    // ... 执行 ...
}
```

**优点**：
- 同一文件重复导入会更新记录而不是失败
- 符合用户预期：看到最新的导入结果
- 不会因 UNIQUE 约束报错

### 方案 B：移除 UNIQUE 约束（不推荐）

修改表结构，但需要数据迁移：
```sql
ALTER TABLE txt_import_records DROP CONSTRAINT unique_file_path;
```

**缺点**：同一文件会有多条记录，用户可能困惑

### 方案 C：添加时间戳到 file_path（不推荐）

在 file_path 后面加时间戳使其唯一，但会导致路径不可读。

## 📋 实施步骤

1. **修改后端仓储层** (`txt_import_records_repo.rs`)
   - 将 `INSERT` 改为 `INSERT ... ON CONFLICT ... DO UPDATE`
   
2. **改进错误日志**
   - 使用 `tracing::warn!` 替代 `eprintln!`
   - 添加更详细的错误信息

3. **测试验证**
   - 导入同一个文件两次
   - 确认记录被更新而不是创建失败
   - 确认前端列表正常显示

## 🎯 预期效果

修复后：
- ✅ 每次导入都能看到记录（无论是新文件还是重复文件）
- ✅ 重复导入同一文件会更新该文件的记录
- ✅ "已导入文件记录"面板正常显示所有历史
- ✅ 用户可以清楚地看到每个文件的最新导入状态

---

**报告时间**: 2025年10月3日  
**优先级**: 🔴 最高（核心功能完全不可用）
