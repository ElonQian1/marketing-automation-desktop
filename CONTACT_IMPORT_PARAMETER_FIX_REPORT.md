# 联系人导入参数格式修复报告

## 问题诊断

从最新的错误日志中可以看到，虽然我们之前修复了一些问题，但参数格式仍然不匹配。具体错误：

```
invalid args `deviceId` for command `import_vcf_contacts_multi_brand`: command import_vcf_contacts_multi_brand missing required key deviceId
invalid args `deviceId` for command `safe_adb_shell_command`: command safe_adb_shell_command missing required key deviceId
invalid args `deviceId` for command `safe_adb_push`: command safe_adb_push missing required key deviceId
invalid args `deviceId` for command `adb_start_activity`: command adb_start_activity missing required key deviceId
```

## 根本原因

后端Rust命令的参数命名不一致：

1. **`import_vcf_contacts_multi_brand`** 使用 snake_case: `device_id`, `contacts_file_path`
2. **`safe_adb_shell_command`** 使用 camelCase: `deviceId`, `shellCommand`  
3. **`safe_adb_push`** 使用 camelCase: `deviceId`, `localPath`, `remotePath`
4. **`adb_start_activity`** 使用 snake_case: `device_id`, `data_uri`, `mime_type`

## 修复措施

### 1. 强制参数格式控制

使用 `invokeCompat` 函数的强制选项来确保正确的参数格式：

#### `import_vcf_contacts_multi_brand` - 强制使用 snake_case
```typescript
await invokeCompat('import_vcf_contacts_multi_brand', {
  device_id: deviceId,
  contacts_file_path: vcfFilePath
}, { forceSnake: true });
```

#### `safe_adb_shell_command` - 强制使用 camelCase
```typescript
await invokeCompat('safe_adb_shell_command', {
  deviceId,
  shellCommand: 'mkdir -p /sdcard/Android/data/com.android.contacts/files'
}, { forceCamel: true });
```

#### `safe_adb_push` - 强制使用 camelCase
```typescript
await invokeCompat('safe_adb_push', {
  deviceId,
  localPath: localVcfPath,
  remotePath: devicePath
}, { forceCamel: true });
```

#### `adb_start_activity` - 强制使用 snake_case
```typescript
await invokeCompat('adb_start_activity', {
  device_id: deviceId,
  action: 'android.intent.action.VIEW',
  data_uri: `file://${vcfPath}`,
  mime_type: mimeType,
  component: null
}, { forceSnake: true });
```

### 2. 修复文件位置

所有修复都在 `ImportStrategyExecutor.ts` 文件中：
- `src/modules/contact-import/import-strategies/services/ImportStrategyExecutor.ts`

### 3. 修复的具体调用点

1. **第47行** - `import_vcf_contacts_multi_brand` 调用
2. **第274行** - 创建目录的 `safe_adb_shell_command` 调用  
3. **第283行** - 主要的 `safe_adb_push` 调用
4. **第297行** - 兜底的 `safe_adb_push` 调用
5. **第358行** - VIEW Intent 的 `adb_start_activity` 调用
6. **第380行** - 直接 Activity 的 `adb_start_activity` 调用
7. **第443行** - 清理临时文件的 `safe_adb_shell_command` 调用

## 预期效果

修复后，应该不再看到以下错误：
- ❌ `invalid args deviceId for command import_vcf_contacts_multi_brand`
- ❌ `invalid args deviceId for command safe_adb_shell_command`  
- ❌ `invalid args deviceId for command safe_adb_push`
- ❌ `invalid args deviceId for command adb_start_activity`

## 测试建议

1. **重新启动应用** - 确保新代码生效
2. **尝试导入联系人** - 测试完整流程
3. **检查日志** - 确认参数格式错误已消失
4. **验证功能** - 确保VCF文件能成功推送和导入

## 其他已修复的问题

1. ✅ **设备批次绑定服务** - 重新实现了完整功能
2. ✅ **React渲染警告** - 修复了组件更新时机问题
3. ✅ **缺失的后端命令** - 提供了本地实现替代方案

## 下一步

如果参数格式修复后导入仍然失败，可能需要检查：
1. VCF文件生成是否正确
2. 设备权限设置
3. Android版本兼容性
4. ADB连接状态

修复完成后，联系人导入功能应该能够正常工作。