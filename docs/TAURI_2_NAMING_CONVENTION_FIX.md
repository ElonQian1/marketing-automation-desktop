# Tauri 2.0 参数命名约定修复报告

## 问题描述

前端调用 `delete_txt_import_record_cmd` 时报错：
```
删除失败: invalid args `recordId` for command `delete_txt_import_record_cmd`: 
command delete_txt_import_record_cmd missing required key recordId
```

## 根本原因

**Tauri 2.0 参数命名约定变更**：

- **Tauri 1.x**: 前端可以使用 snake_case 或 camelCase，后端使用 snake_case
- **Tauri 2.0**: 
  - 前端 JavaScript → Rust: **必须使用 camelCase**
  - Rust → 前端 JavaScript: 默认保持原样（snake_case），除非使用 `#[serde(rename_all = "camelCase")]`

## 修复方案

### 1. 前端参数传递 (JavaScript → Rust)

**修改前** (`txtImportRecordService.ts`):
```typescript
return invoke<DeleteTxtImportRecordResult>('delete_txt_import_record_cmd', {
  record_id: recordId,        // ❌ snake_case 在 Tauri 2.0 中不被识别
  archive_numbers: archiveNumbers,
});
```

**修改后**:
```typescript
return invoke<DeleteTxtImportRecordResult>('delete_txt_import_record_cmd', {
  recordId,           // ✅ camelCase
  archiveNumbers,     // ✅ camelCase
});
```

### 2. 后端返回值序列化 (Rust → JavaScript)

**修改前** (`models.rs`):
```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeleteTxtImportRecordResult {
    pub record_id: i64,              // 返回给前端时保持 snake_case
    pub archived_number_count: i64,
    pub success: bool,
}
```

**修改后**:
```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]  // ✅ 自动转换为 camelCase
pub struct DeleteTxtImportRecordResult {
    pub record_id: i64,              // → recordId
    pub archived_number_count: i64,  // → archivedNumberCount
    pub success: bool,
}
```

### 3. 前端类型定义

**修改前**:
```typescript
export interface DeleteTxtImportRecordResult {
  record_id: number;           // ❌ snake_case
  archived_number_count: number;
  success: boolean;
}
```

**修改后**:
```typescript
export interface DeleteTxtImportRecordResult {
  recordId: number;              // ✅ camelCase
  archivedNumberCount: number;   // ✅ camelCase
  success: boolean;
}
```

## 修改的文件

1. **前端**:
   - `src/modules/contact-import/ui/services/txtImportRecordService.ts`
     - 修复 invoke 参数: `record_id` → `recordId`, `archive_numbers` → `archiveNumbers`
     - 修复类型定义: `DeleteTxtImportRecordResult` 接口字段改为 camelCase
     - 修复使用处: `result.value.archived_number_count` → `result.value.archivedNumberCount`

2. **后端**:
   - `src-tauri/src/services/contact_storage/models.rs`
     - 添加 `#[serde(rename_all = "camelCase")]` 到 `DeleteTxtImportRecordResult`

## Tauri 2.0 命名规范建议

### ✅ 推荐做法

1. **前端 → 后端参数**: 始终使用 camelCase
   ```typescript
   invoke('my_command', { 
     userId: 123,      // ✅
     deviceId: 'abc'   // ✅
   });
   ```

2. **后端返回数据**: 在 Rust DTO 上添加 `#[serde(rename_all = "camelCase")]`
   ```rust
   #[derive(Serialize, Deserialize)]
   #[serde(rename_all = "camelCase")]
   pub struct MyDto {
       pub user_id: i64,        // → userId
       pub device_name: String,  // → deviceName
   }
   ```

3. **前端类型定义**: 与后端序列化后的格式一致（camelCase）
   ```typescript
   interface MyDto {
     userId: number;      // ✅ 与后端 camelCase 输出一致
     deviceName: string;
   }
   ```

### ❌ 避免的做法

```typescript
// ❌ 不要在 Tauri 2.0 中使用 snake_case 参数
invoke('my_command', { 
  user_id: 123,      // ❌ 将报错
  device_id: 'abc'   // ❌ 将报错
});
```

## 迁移检查清单

如果你从 Tauri 1.x 迁移到 2.0，需要检查：

- [ ] 所有 `invoke()` 调用的参数对象是否使用 camelCase
- [ ] 所有返回数据的 Rust struct 是否添加 `#[serde(rename_all = "camelCase")]`
- [ ] 前端 TypeScript 类型定义是否与后端序列化格式一致
- [ ] 移除双重参数传递（如 `{ user_id: userId, userId }`）的临时兼容代码

## 相关文档

- [Tauri 2.0 Migration Guide](https://beta.tauri.app/guides/upgrade-migrate/)
- [Serde rename_all Documentation](https://serde.rs/container-attrs.html#rename_all)
- [JavaScript Naming Conventions](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Writing_style_guide/Code_style_guide/JavaScript#naming_conventions)

---

**修复日期**: 2025年10月3日  
**影响范围**: TXT 导入记录删除功能  
**状态**: ✅ 已修复并测试
