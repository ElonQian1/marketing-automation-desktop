# 数据库重置与新 Schema 迁移指南

## 📋 方案概述

我们创建了全新的简化版数据库 Schema（V2.0），完全解决了迁移失败和字段混乱的问题。

---

## 🎯 新 Schema 改进点

### 1. **简化字段**
- ❌ 移除：`used`, `used_at`, `used_batch` (contact_numbers)
- ✅ 改用：`status`, `assigned_batch_id`, `assigned_at`
- ❌ 移除：`is_completed`, `generation_method`, `source_start_id`, `source_end_id` (vcf_batches)
- ✅ 改用：`status`, 统一状态管理

### 2. **统一命名**
- `imported_count` → `success_count`
- `successful_imports` → `imported_numbers`
- `import_status` → `status`

### 3. **清晰的状态流转**

#### contact_numbers 状态
```
available (可用) → assigned (已分配) → imported (已导入)
```

#### vcf_batches 状态
```
pending (待生成) → generated (已生成) → importing (导入中) → completed (已完成)
```

#### import_sessions 状态
```
pending (待处理) → running (运行中) → success/failed/partial (完成)
```

#### txt_import_records 状态
```
success (成功) | empty (空文件) | all_duplicates (全部重复) | partial (部分成功) | failed (失败)
```

### 4. **移除复杂迁移**
- 不再需要 `migrate_vcf_batches_if_needed()` 函数
- 不再需要 `migrate_vcf_batches.rs` 命令
- 启动即用，无迁移错误

---

## 🚀 迁移步骤

### 方案 A：完全重置（推荐开发阶段）

#### 1. 备份并重置数据库

```powershell
# 在项目根目录执行
.\scripts\reset-database.ps1
```

**脚本功能**：
- ✅ 自动停止相关进程
- ✅ 备份现有数据库（带时间戳）
- ✅ 删除旧数据库文件
- ✅ 清理 WAL 和 SHM 文件

**执行流程**：
```
📦 数据库重置脚本
🔍 当前数据库信息:
   路径: D:\rust\active-projects\小红书\employeeGUI\src-tauri\data\contacts.db
   大小: 123.45 KB
   修改时间: 2025-01-21 14:30:00

⚠️  警告: 此操作将删除所有数据库数据！

确认要继续吗？(输入 YES 继续): YES

⏸️  正在停止相关进程...
✅ 进程已停止

💾 正在备份数据库...
✅ 备份完成: D:\rust\active-projects\小红书\employeeGUI\backups\contacts_backup_20250121_143000.db
   备份大小: 123.45 KB

🗑️  正在删除数据库...
✅ 数据库已删除

🧹 清理临时文件...
✅ 已删除 WAL 文件
✅ 已删除 SHM 文件

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ 数据库重置完成！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

下一步操作：
  1. 运行应用: npm run tauri dev
  2. 应用启动时会自动创建新的数据库
  3. 新数据库将使用最新的 schema 定义

💾 备份文件位置: D:\rust\active-projects\小红书\employeeGUI\backups\contacts_backup_20250121_143000.db

🎉 准备好开始全新的数据库体验！
```

#### 2. 替换 schema.rs

```powershell
# 在项目根目录执行
cd src-tauri\src\services\contact_storage\repositories\common\

# 备份旧文件
Copy-Item schema.rs schema.rs.backup

# 使用新 schema
Copy-Item schema_v2.rs schema.rs
```

#### 3. 移除迁移命令（可选）

如果不再需要迁移功能：

```powershell
# 删除迁移命令文件
Remove-Item src-tauri\src\services\contact_storage\commands\migrate_vcf_batches.rs

# 从 commands/mod.rs 中移除导出
# 从 services/mod.rs 中移除导出
# 从 main.rs 中移除命令注册
```

#### 4. 启动应用

```powershell
npm run tauri dev
```

**预期结果**：
```
🚀 开始初始化数据库表结构 V2.0
✅ contact_numbers 表创建完成
✅ vcf_batches 表创建完成
✅ import_sessions 表创建完成
✅ txt_import_records 表创建完成
✅ 数据库表初始化完成
```

---

### 方案 B：迁移历史数据（保留 395 条记录）

如果需要保留历史数据：

#### 1. 创建数据迁移脚本

```rust
// src-tauri/src/services/contact_storage/commands/migrate_to_v2.rs

use rusqlite::Connection;
use tauri::Manager;

#[tauri::command]
pub async fn migrate_database_to_v2(app: tauri::AppHandle) -> Result<String, String> {
    let db_path = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?
        .join("contacts.db");
    
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    
    // 在事务中执行迁移
    conn.execute_batch(r#"
        BEGIN TRANSACTION;
        
        -- 备份旧表
        CREATE TEMPORARY TABLE old_contact_numbers AS SELECT * FROM contact_numbers;
        CREATE TEMPORARY TABLE old_vcf_batches AS SELECT * FROM vcf_batches;
        
        -- 删除旧表
        DROP TABLE contact_numbers;
        DROP TABLE vcf_batches;
        
        -- 使用新 schema 创建表（手动执行 schema_v2.rs 中的 DDL）
        
        -- 迁移 contact_numbers 数据
        INSERT INTO contact_numbers (
            id, phone, name, source_file, created_at, industry,
            status, assigned_batch_id, assigned_at,
            imported_device_id, imported_at
        )
        SELECT 
            id, phone, name, source_file, created_at, industry,
            CASE 
                WHEN used = 1 AND imported_device_id IS NOT NULL THEN 'imported'
                WHEN used = 1 THEN 'assigned'
                ELSE 'available'
            END as status,
            used_batch as assigned_batch_id,
            used_at as assigned_at,
            imported_device_id,
            used_at as imported_at
        FROM old_contact_numbers;
        
        -- 迁移 vcf_batches 数据（如果有）
        -- INSERT INTO vcf_batches ...
        
        -- 清理临时表
        DROP TABLE old_contact_numbers;
        DROP TABLE old_vcf_batches;
        
        COMMIT;
    "#).map_err(|e| format!("Migration failed: {}", e))?;
    
    Ok("Migration completed successfully".to_string())
}
```

#### 2. 注册并调用迁移命令

```rust
// main.rs
.invoke_handler(tauri::generate_handler![
    migrate_database_to_v2,
    // ... 其他命令
])
```

#### 3. 在前端触发迁移

```typescript
import { invoke } from '@tauri-apps/api/core';

async function migrateDatabase() {
  try {
    const result = await invoke('migrate_database_to_v2');
    console.log('Migration result:', result);
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
```

---

## ✅ 验证步骤

### 1. 检查表结构

```sql
-- 使用 Tauri 命令或直接执行
PRAGMA table_info(contact_numbers);
PRAGMA table_info(vcf_batches);
PRAGMA table_info(import_sessions);
PRAGMA table_info(txt_import_records);
```

### 2. 检查索引

```sql
SELECT name, sql FROM sqlite_master 
WHERE type='index' 
ORDER BY tbl_name, name;
```

### 3. 验证数据

```sql
-- 检查号码池记录数
SELECT COUNT(*) FROM contact_numbers;

-- 检查状态分布
SELECT status, COUNT(*) FROM contact_numbers GROUP BY status;

-- 检查导入记录
SELECT COUNT(*) FROM txt_import_records;
```

### 4. 测试功能

- ✅ TXT 文件导入（包含空文件和全重复场景）
- ✅ 号码池显示（应显示 395 条记录）
- ✅ VCF 生成
- ✅ 设备导入
- ✅ 会话记录显示

---

## 🔧 故障排除

### 问题 1：重置脚本执行失败

**错误**：`unable to open database file`

**解决方案**：
```powershell
# 手动停止进程
Get-Process | Where-Object { 
    $_.ProcessName -like "*node*" -or 
    $_.ProcessName -like "*employee*" 
} | Stop-Process -Force

# 等待 2 秒
Start-Sleep -Seconds 2

# 再次执行重置
.\scripts\reset-database.ps1 -Confirm
```

### 问题 2：旧 schema 仍在使用

**症状**：启动时仍出现 `no such column: batch_name`

**解决方案**：
```powershell
# 确认已替换 schema.rs
Get-Content src-tauri\src\services\contact_storage\repositories\common\schema.rs | Select-String "V2.0"

# 应该看到输出：
# /// 数据库表结构定义和初始化 - V2.0 简化版

# 重新编译
npm run tauri build
```

### 问题 3：备份恢复

**场景**：需要恢复旧数据

**解决方案**：
```powershell
# 找到备份文件
Get-ChildItem backups\*.db | Sort-Object LastWriteTime -Descending | Select-Object -First 1

# 恢复备份
Copy-Item backups\contacts_backup_YYYYMMDD_HHMMSS.db src-tauri\data\contacts.db -Force
```

---

## 📊 新旧对比

| 特性 | 旧 Schema | 新 Schema V2.0 |
|------|-----------|----------------|
| vcf_batches 字段数 | 10 | 9 (-1) |
| 迁移复杂度 | 高（需要迁移函数） | 无迁移 |
| 状态管理 | `used/is_completed` | 统一 `status` |
| 字段命名 | 不一致 | 统一规范 |
| 启动时间 | 慢（迁移检查） | 快（直接创建） |
| 维护难度 | 高 | 低 |

---

## 🎉 预期效果

### 启动时
- ✅ 无迁移错误
- ✅ 快速初始化
- ✅ 清晰的日志输出

### 运行时
- ✅ 所有导入记录正常显示（包括空文件和全重复）
- ✅ 号码池正确显示 395 条记录
- ✅ VCF 生成和导入流程顺畅
- ✅ 状态流转清晰可追踪

### 开发体验
- ✅ Schema 易于理解
- ✅ 字段命名统一
- ✅ 状态管理简单
- ✅ 扩展性强

---

## 📝 下一步行动

1. **Review 新 Schema**
   - 确认字段是否符合业务需求
   - 确认状态流转是否合理

2. **选择迁移方案**
   - 方案 A：完全重置（推荐开发阶段）
   - 方案 B：迁移历史数据（保留 395 条记录）

3. **执行迁移**
   - 备份数据库
   - 替换 schema.rs
   - 重启应用

4. **验证功能**
   - 测试 TXT 导入
   - 测试号码池
   - 测试 VCF 生成
   - 测试设备导入

5. **清理代码**
   - 移除旧迁移代码
   - 更新相关 DTO
   - 更新文档

---

**问题**：
1. 是否需要保留 395 条历史数据？（影响选择方案 A 或 B）
2. 是否需要调整某些字段或状态定义？
3. 是否需要我创建数据迁移脚本（方案 B）？
