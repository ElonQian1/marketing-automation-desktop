# Tauri 2.0 参数命名修复指南

## 🔥 紧急修复（VCF生成失败）

### 问题1：`create_vcf_batch_with_numbers_cmd` 参数不匹配

**错误信息：**
```
invalid args `batchName` for command `create_vcf_batch_with_numbers_cmd`: 
command create_vcf_batch_with_numbers_cmd missing required key batchName
```

**根本原因：** 后端期望的参数与前端传递的完全不匹配

**后端期望（Rust）：**
```rust
batch_name: String,        // 批次名称
source_type: String,       // 来源类型
generation_method: String, // 生成方法
description: Option<String>, // 描述
number_ids: Vec<i64>,      // 号码ID列表
```

**修复方案：** `src/modules/vcf-sessions/services/vcf-session-service.ts`

```typescript
// ✅ 修复后
const payload = {
  batchName: batchId,              // 使用 batchId 作为 batch_name
  sourceType: 'auto',              // 自动生成类型
  generationMethod: 'quick',       // 快速生成方法
  description: `VCF file: ${vcfFilePath}`,
  numberIds,                       // 驼峰命名
};
return invoke<number>('create_vcf_batch_with_numbers_cmd', payload);
```

### 问题2：`create_import_session_cmd` 命令不存在

**错误信息：**
```
Command create_import_session_cmd not found
```

**根本原因：** 后端导入会话相关命令已被临时禁用（`// TEMPORARILY DISABLED FOR MIGRATION`）

**受影响的命令：**
- `create_import_session_cmd` - 创建导入会话
- `finish_import_session_cmd` - 完成导入会话  
- `list_import_sessions_cmd` - 列出导入会话

**修复方案：** 优雅降级，允许命令失败但不影响主流程

```typescript
// ✅ src/modules/contact-import/ui/services/vcfBatchRegistrationService.ts
try {
  sessionId = await createImportSessionRecord(batchId, deviceId);
} catch (error) {
  // 导入会话命令已被禁用，这是预期的错误
  console.info('[vcf] session creation skipped (command disabled)', error);
  // 不影响主流程，VCF文件仍然成功生成
}
```

---

## 📋 完整修复清单

### ✅ 已修复
1. `fetchUnclassifiedNumbers` - ✅ `onlyUnconsumed` (驼峰)
2. `createVcfBatchWithNumbers` - ✅ 参数映射修复
3. `registerGeneratedBatch` - ✅ 错误处理优化

### ⚠️ 待修复（非阻塞）

**修改前：**
```typescript
return invoke<ContactNumberDto[]>('fetch_unclassified_contact_numbers', { 
  count, 
  only_unconsumed: onlyUnconsumed 
});
```

**修改后：**
```typescript
return invoke<ContactNumberDto[]>('fetch_unclassified_contact_numbers', { 
  count, 
  onlyUnconsumed  // 改为驼峰命名
});
```

### 2. `src/modules/contact-import/ui/services/contactNumberService.ts`

#### 修复 1：fetchContactNumbersByIdRange
**修改前：**
```typescript
return invoke<ContactNumberDto[]>('fetch_contact_numbers_by_id_range', { 
  start_id: startId, end_id: endId, startId, endId 
});
```

**修改后：**
```typescript
return invoke<ContactNumberDto[]>('fetch_contact_numbers_by_id_range', { 
  startId, endId 
});
```

#### 修复 2：fetchContactNumbersByIdRangeUnconsumed
**修改前：**
```typescript
return invoke<ContactNumberDto[]>('fetch_contact_numbers_by_id_range_unconsumed', { 
  start_id: startId, end_id: endId, startId, endId 
});
```

**修改后：**
```typescript
return invoke<ContactNumberDto[]>('fetch_contact_numbers_by_id_range_unconsumed', { 
  startId, endId 
});
```

#### 修复 3：markContactNumbersUsedByIdRange
**修改前：**
```typescript
return invoke<number>('mark_contact_numbers_used_by_id_range', { 
  start_id: startId, end_id: endId, batch_id: batchId 
});
```

**修改后：**
```typescript
return invoke<number>('mark_contact_numbers_used_by_id_range', { 
  startId, endId, batchId 
});
```

#### 修复 4：createVcfBatchRecord
**修改前：**
```typescript
return invoke<void>('create_vcf_batch_cmd', { 
  batch_id: batchId, vcf_file_path: vcfFilePath, 
  source_start_id: sourceStartId, source_end_id: sourceEndId 
});
```

**修改后：**
```typescript
return invoke<void>('create_vcf_batch_cmd', { 
  batchId, vcfFilePath, sourceStartId, sourceEndId 
});
```

#### 修复 5：listImportSessionRecords
**修改前：**
```typescript
return invoke<ImportSessionList>('list_import_sessions_cmd', { 
  device_id: deviceId, batch_id: batchId, industry: ind, Industry: ind, limit, offset 
});
```

**修改后：**
```typescript
return invoke<ImportSessionList>('list_import_sessions_cmd', { 
  deviceId, batchId, industry: ind, limit, offset 
});
```

### 3. `src/modules/contact-import/ui/services/stats/contactStatsService.ts`

#### 修复：setContactNumbersIndustryByIdRange
**修改前：**
```typescript
return invoke<number>('set_contact_numbers_industry_by_id_range', { 
  start_id: startId, end_id: endId, industry 
});
```

**修改后：**
```typescript
return invoke<number>('set_contact_numbers_industry_by_id_range', { 
  startId, endId, industry 
});
```

### 4. `src/modules/contact-import/ui/services/deviceContactMetrics.ts`

#### 修复：设备联系人指标查询
**修改前：**
```typescript
const res = await invoke<any>(cmd, { deviceId, device_id: deviceId });
```

**修改后：**
```typescript
const res = await invoke<any>(cmd, { deviceId });
```

## 验证方法

修复完成后，测试"导入"按钮应该不再报错：
```
invalid args `onlyUnconsumed` for command `fetch_unclassified_contact_numbers`: 
command fetch_unclassified_contact_numbers missing required key onlyUnconsumed
```

## 规则总结

✅ **正确**：使用驼峰命名（camelCase）  
```typescript
{ startId, endId, batchId, deviceId, vcfFilePath }
```

❌ **错误**：使用下划线命名（snake_case）  
```typescript
{ start_id, end_id, batch_id, device_id, vcf_file_path }
```

❌ **多余**：同时传递两种格式  
```typescript
{ start_id: startId, startId }  // 冗余且可能导致混淆
```
