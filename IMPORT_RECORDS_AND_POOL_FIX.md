# TXT 导入记录与号码池修复报告

## 📋 问题概述

用户反馈了两个核心问题：

### 问题 1：导入记录缺失
- **现象**: 即使"文件中有 28 个号码，但全部已存在（去重 28 个）"，"已导入文件记录"面板也不显示任何记录
- **原因**: 之前的逻辑只有在成功导入新号码时才创建记录，空文件或全部重复的情况下不创建记录

### 问题 2：号码池数量不符
- **现象**: 数据库有 395 条 contact_numbers 记录，但号码池只显示 45 个号码
- **原因**: `fetch_unclassified_numbers` 使用了 `WHERE industry IS NULL` 过滤条件，只显示未分类的号码

---

## 🔧 修复方案

### 修复 1：确保所有导入都创建记录

**文件**: `src-tauri/src/services/contact_storage/commands/contact_numbers.rs`

**改动**:
```rust
// ✅ 新逻辑：提前提取文件名，无论结果如何都创建记录
let content = fs::read_to_string(&file_path).map_err(|e| format!("读取文件失败: {}", e))?;
let numbers = extract_numbers_from_text(&content);

// 提取文件名（用于记录）
let file_name = Path::new(&file_path)
    .file_name()
    .and_then(|f| f.to_str())
    .unwrap_or("unknown.txt")
    .to_string();

let (inserted, duplicates, errors) = with_db_connection(&app_handle, |conn| {
    contact_numbers_repo::insert_numbers(conn, &numbers, &file_path)
})?;

// 无论导入结果如何都记录到 txt_import_records 表（包括空文件和全部重复）
let status = if errors.is_empty() { 
    if numbers.is_empty() {
        "empty"  // 空文件
    } else if inserted == 0 && duplicates > 0 {
        "all_duplicates"  // 全部重复
    } else {
        "success"
    }
} else { 
    "partial" 
};
```

**效果**:
- ✅ 空文件 → 创建记录，状态为 `empty`
- ✅ 全部重复 → 创建记录，状态为 `all_duplicates`
- ✅ 部分成功 → 创建记录，状态为 `success` 或 `partial`
- ✅ 用户始终能看到导入历史

---

### 修复 2：调整号码池筛选逻辑

**文件**: `src-tauri/src/services/contact_storage/repositories/contact_numbers_repo.rs`

**改动**:
```rust
pub fn fetch_unclassified_numbers(
    conn: &Connection,
    count: i64,
    only_unconsumed: bool,
) -> SqlResult<Vec<ContactNumberDto>> {
    let sql = if only_unconsumed {
        // ✅ 新逻辑：显示所有未导入且未使用的号码（不再限制 industry）
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id 
         FROM contact_numbers 
         WHERE (status = 'not_imported' OR status IS NULL) AND (used = 0 OR used IS NULL) 
         ORDER BY id ASC LIMIT ?1"
    } else {
        "SELECT id, phone, name, source_file, created_at, industry, used, used_at, used_batch, status, imported_device_id 
         FROM contact_numbers 
         WHERE (status = 'not_imported' OR status IS NULL) 
         ORDER BY id ASC LIMIT ?1"
    };
    // ... 其余代码不变
}
```

**对比**:
```diff
- WHERE industry IS NULL AND (used = 0 OR used IS NULL)
+ WHERE (status = 'not_imported' OR status IS NULL) AND (used = 0 OR used IS NULL)
```

**效果**:
- ❌ 旧逻辑：只显示 `industry IS NULL` 的号码（45 个）
- ✅ 新逻辑：显示所有 `status = 'not_imported'` 或 `status IS NULL` 的号码（接近 100 个）
- ✅ 更符合"号码池"的语义：显示所有可用的号码，而不是仅未分类的号码

---

## 🎯 新增状态值

为 `txt_import_records.import_status` 字段新增两个状态：

| 状态 | 说明 | 显示文本 |
|------|------|----------|
| `success` | 成功导入至少 1 个号码 | ✅ 成功 |
| `partial` | 部分成功（有错误） | ⚠️ 部分成功 |
| `empty` ⭐ | 文件中未找到有效号码 | 📭 空文件 |
| `all_duplicates` ⭐ | 所有号码都是重复的 | 🔄 全部重复 |

---

## 📊 预期行为

### 场景 1：导入包含 28 个号码的文件，全部重复
- **数据库**: 创建 txt_import_records 记录
  - `total_numbers = 28`
  - `successful_imports = 0`
  - `duplicate_numbers = 28`
  - `import_status = 'all_duplicates'`
- **UI 显示**: 
  - "已导入文件记录"面板显示该文件
  - 状态：🔄 全部重复
  - 统计：总数 28，导入 0，重复 28
- **消息提示**: `⚠️ 文件中有 28 个号码，但全部是重复号码`

### 场景 2：导入空文件或无效文件
- **数据库**: 创建 txt_import_records 记录
  - `total_numbers = 0`
  - `successful_imports = 0`
  - `duplicate_numbers = 0`
  - `import_status = 'empty'`
- **UI 显示**: 
  - "已导入文件记录"面板显示该文件
  - 状态：📭 空文件
  - 统计：总数 0，导入 0，重复 0
- **消息提示**: `⚠️ 文件中未找到有效的手机号码`

### 场景 3：号码池数量
- **旧行为**: 显示 45 个号码（只有 industry IS NULL 的）
- **新行为**: 显示接近 100 个号码（所有 status = 'not_imported' 的）
- **验证方式**: 
  ```sql
  -- 应该显示的号码
  SELECT COUNT(*) FROM contact_numbers 
  WHERE (status = 'not_imported' OR status IS NULL) 
  AND (used = 0 OR used IS NULL);
  ```

---

## ✅ 验证清单

### 重启后测试

1. **测试空文件导入**
   - [ ] 创建一个空的 txt 文件
   - [ ] 导入该文件
   - [ ] 检查消息："文件中未找到有效的手机号码"
   - [ ] 检查"已导入文件记录"是否显示该文件
   - [ ] 检查状态是否为"空文件"

2. **测试全部重复导入**
   - [ ] 导入一个已经导入过的文件
   - [ ] 检查消息："文件中有 X 个号码，但全部是重复号码"
   - [ ] 检查"已导入文件记录"是否显示/更新该文件
   - [ ] 检查统计数据：导入 0，重复 X

3. **测试部分重复导入**
   - [ ] 导入一个包含新号码和重复号码的文件
   - [ ] 检查消息："成功导入 X 个号码（去重 Y 个）"
   - [ ] 检查"已导入文件记录"显示正确统计

4. **验证号码池数量**
   - [ ] 打开"号码池"面板
   - [ ] 检查显示的号码数量是否接近 100（而不是 45）
   - [ ] 滚动加载，确认可以加载更多号码
   - [ ] 使用数据库验证：
     ```sql
     SELECT COUNT(*) FROM contact_numbers 
     WHERE (status = 'not_imported' OR status IS NULL) 
     AND (used = 0 OR used IS NULL);
     ```

5. **检查导入记录历史**
   - [ ] "已导入文件记录"面板显示所有历史导入
   - [ ] 每条记录显示文件图标、名称、统计数据
   - [ ] 重复导入同一文件时，记录被更新而不是创建新记录

---

## 🔍 数据库状态检查

### 检查号码统计
```sql
-- 查看不同状态的号码数量
SELECT status, COUNT(*) as count 
FROM contact_numbers 
GROUP BY status;

-- 查看不同分类的号码数量
SELECT industry, COUNT(*) as count 
FROM contact_numbers 
GROUP BY industry;

-- 应该显示在号码池的号码
SELECT COUNT(*) FROM contact_numbers 
WHERE (status = 'not_imported' OR status IS NULL) 
AND (used = 0 OR used IS NULL);
```

### 检查导入记录
```sql
-- 查看所有导入记录
SELECT file_name, total_numbers, successful_imports, duplicate_numbers, import_status 
FROM txt_import_records 
ORDER BY imported_at DESC;

-- 查看不同状态的导入记录数量
SELECT import_status, COUNT(*) as count 
FROM txt_import_records 
GROUP BY import_status;
```

---

## 🚀 用户操作指南

### 立即执行

1. **停止当前开发服务器** (Ctrl+C)

2. **重启 Tauri 开发服务器**:
   ```powershell
   cd "d:\rust\active-projects\小红书\employeeGUI"
   npm run tauri dev
   ```

3. **测试空文件导入**:
   - 创建一个空的 `test_empty.txt`
   - 通过"导入 TXT 到号码池"导入
   - 验证记录是否显示

4. **测试全部重复导入**:
   - 再次导入之前导入过的文件
   - 验证记录是否更新

5. **检查号码池数量**:
   - 打开号码池面板
   - 观察显示的号码数量是否增加到接近 100

---

## 📝 技术说明

### 为什么移除 `industry IS NULL` 限制？

**旧逻辑问题**:
- `industry` 字段用于分类号码（如"电商"、"教育"等）
- `WHERE industry IS NULL` 意味着只显示"未分类"的号码
- 这导致已分类的号码无法在号码池中显示

**新逻辑优势**:
- `status` 字段更准确地反映号码的导入状态
- `status = 'not_imported'` 表示号码还未被导入到设备
- 无论是否分类，只要未导入就应该在号码池中显示
- 更符合业务逻辑：号码池 = 可用的号码

### UPSERT 机制

通过 `ON CONFLICT(file_path) DO UPDATE SET ...` 确保：
- 第一次导入文件 → 创建新记录
- 再次导入相同文件 → 更新现有记录
- 用户始终看到最新的导入结果
- 避免重复记录和 UNIQUE 约束错误

---

## 🎉 预期改进

1. **完整的导入历史** ✅
   - 所有导入操作都有记录
   - 包括空文件和全部重复的情况

2. **准确的统计数据** ✅
   - 每个文件显示：总数、导入、重复
   - 状态标签一目了然

3. **正确的号码池数量** ✅
   - 显示所有可用号码（未导入的）
   - 不再受 industry 字段限制

4. **更好的用户体验** ✅
   - 清晰的消息提示
   - 完整的操作反馈
   - 可追溯的导入历史

---

**修复完成时间**: 2025年10月3日  
**修复文件数**: 2  
**新增状态值**: 2 (`empty`, `all_duplicates`)  
**影响范围**: TXT 导入记录显示 + 号码池筛选逻辑
