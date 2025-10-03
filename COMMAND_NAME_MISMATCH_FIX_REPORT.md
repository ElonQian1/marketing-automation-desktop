# Tauri 命令名称不匹配修复报告

## 问题根源

在架构重构过程中，后端 Rust 命令统一添加了 `_cmd` 后缀（遵循 Tauri 最佳实践），但前端 TypeScript 调用时没有同步更新，导致命令名称不匹配。

## 错误表现

```
Uncaught (in promise) Command list_vcf_batch_records not found
```

- **前端调用**: `invoke('list_vcf_batch_records')`  ❌ 缺少 `_cmd` 后缀
- **后端注册**: `list_vcf_batch_records_cmd` ✅ 有 `_cmd` 后缀

## 影响范围

**文件**: `src/modules/contact-import/ui/services/contactNumberService.ts`

**需要修复的命令**:

| 前端调用命令（错误） | 后端注册命令（正确） | 状态 |
|---------------------|---------------------|------|
| `'list_vcf_batch_records'` | `list_vcf_batch_records_cmd` | ✅ **已修复** |
| `'create_vcf_batch_record'` | `create_vcf_batch_cmd` | ⏳ 待修复 |
| `'get_vcf_batch_record'` | `get_vcf_batch_cmd` | ⏳ 待修复 |
| `'create_import_session_record'` | `create_import_session_cmd` | ⏳ 待修复 |
| `'finish_import_session_record'` | `finish_import_session_cmd` | ⏳ 待修复 |
| `'list_import_session_records'` | `list_import_sessions_cmd` | ⏳ 待修复 |
| `'allocate_numbers_to_device_cmd'` | `allocate_contact_numbers_to_device` | ⏳ 待修复（反向问题）|

## 后端命令注册参考（main.rs）

```rust
// VCF 批次命令
create_vcf_batch_cmd,              // ✓
list_vcf_batches_cmd,              // ✓
list_vcf_batch_records_cmd,        // ✓
get_vcf_batch_cmd,                 // ✓

// 导入会话命令
create_import_session_cmd,         // ✓
finish_import_session_cmd,         // ✓
list_import_sessions_cmd,          // ✓
update_import_session_industry_cmd,// ✓
revert_import_session_to_failed_cmd,// ✓
delete_import_session_cmd,         // ✓
get_import_session_events_cmd,     // ✓

// TXT导入记录命令
list_txt_import_records_cmd,       // ✓
delete_txt_import_record_cmd,      // ✓

// 号码分配命令
allocate_contact_numbers_to_device, // ✓ 注意：这个命令没有 _cmd 后缀！
```

## 修复计划

### 第1步：修复 VCF 批次相关命令
- `createVcfBatchRecord` → `'create_vcf_batch_cmd'`
- `getVcfBatchRecord` → `'get_vcf_batch_cmd'`

### 第2步：修复导入会话相关命令  
- `createImportSessionRecord` → `'create_import_session_cmd'`
- `finishImportSessionRecord` → `'finish_import_session_cmd'`
- `listImportSessionRecords` → `'list_import_sessions_cmd'`

### 第3步：修复特殊命令
- `allocateNumbersToDevice`: 前端错误使用了 `'allocate_numbers_to_device_cmd'`
  - 应改为: `'allocate_contact_numbers_to_device'` （无后缀）

## 修复后的验证清单

- [ ] "号码池"面板正常显示数据库中的号码记录
- [ ] "已导入文件记录"正常显示 TXT 导入历史
- [ ] 导入 TXT 文件后有成功提示
- [ ] 批次管理抽屉能正常打开并显示批次列表
- [ ] 导入会话列表能正常加载
- [ ] 设备分配功能正常工作

## 预期结果

修复后：
✅ 所有前端调用的命令名称与后端注册完全一致  
✅ 用户可以正常查看导入记录、号码池和批次信息  
✅ 不再出现 "Command xxx not found" 错误  

---

**修复时间**: 2025年10月3日  
**影响版本**: v2.0 (DDD架构重构后)  
