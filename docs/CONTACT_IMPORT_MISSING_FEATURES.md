# 联系人导入向导 - 未完成功能详细清单

## 📅 检查日期
2025-10-22

## 🔍 详细对照需求检查结果

根据用户提供的需求图片，以下是**已完成**和**未完成**的详细对比：

---

## ✅ 已完成的功能

### 1. 模块名称更改 ✓
- [x] "导入TXT到号码池" → "导入文件到号码池"
- [x] 按钮文本更新
- [x] 说明文字强调保留文件名和时间

### 2. 号码池树形展示 ✓
- [x] 按文件名分组显示
- [x] 点击展开/折叠文件夹
- [x] 展开全部/折叠全部按钮
- [x] 显示文件下的联系人列表

### 3. 导入状态显示 ✓
- [x] 状态标签（已导入/未导入/已分配）
- [x] 导入设备名称显示
- [x] 状态渲染器实现完整

### 4. 从已保存目录导入 ✓ (新增)
- [x] 添加独立的"从已保存目录导入"按钮
- [x] 与"导入到号码池"按钮分离
- [x] 各自独立的loading状态

---

## ❌ 未完成的核心功能

### 1. 导入文件到号码池模块

#### ❌ 文件名去重检查
**需求描述**：
> "文件名重复的则不导入"

**当前状态**：
- 当前只做号码去重，不检查文件是否已导入过
- 可能重复导入同一个文件

**需要实现**：
```typescript
// 1. 后端：检查文件是否已导入
async fn check_file_imported(file_path: &str) -> bool {
  // 查询 txt_import_records 表
}

// 2. 前端：导入前检查
if (await isFileImported(filePath)) {
  message.warning(`文件 ${fileName} 已导入过，跳过`);
  return;
}
```

**影响**：中等 - 会导致重复数据

---

### 2. 号码池模块

#### ❌ 批量展开选中的文件夹
**需求描述**：
> "批量展开文件夹"

**当前状态**：
- 只有"展开全部"和"折叠全部"
- 无法只展开选中的几个文件夹

**需要实现**：
```typescript
// 添加"展开选中"按钮
<Button onClick={expandSelected}>展开选中</Button>

const expandSelected = () => {
  const filesToExpand = selectedRowKeys
    .filter(key => key.startsWith('file-'));
  setExpandedKeys([...expandedKeys, ...filesToExpand]);
};
```

**影响**：低 - 用户体验优化

#### ❌ 批量下载/删除的后端实现
**需求描述**：
> "批量下载文件夹、批量删除文件夹"

**当前状态**：
- UI按钮已实现
- 点击后无实际功能（需要后端API）

**需要实现**：
```rust
// 后端命令
#[command]
pub async fn delete_numbers_by_files(
    app_handle: AppHandle,
    file_paths: Vec<String>,
) -> Result<i64, String> {
  // DELETE FROM contact_numbers WHERE source_file IN (...)
}

#[command]
pub async fn export_numbers_by_files(
    app_handle: AppHandle,
    file_paths: Vec<String>,
) -> Result<String, String> {
  // 导出为TXT/CSV
}
```

**影响**：高 - 核心功能缺失

---

### 3. 设备与VCF模块 ⚠️ **最重要**

#### ❌ 从数据库抓取文件名列表
**需求描述**：
> "导入到设备时，抓取已经导入的文件名"

**当前状态**：
- 完全未实现
- 无法看到可用的文件列表

**需要实现**：
```typescript
// 1. 后端API
#[command]
pub async fn get_imported_file_list(
    app_handle: AppHandle,
) -> Result<Vec<FileInfo>, String> {
  // SELECT source_file, COUNT(*) 
  // FROM contact_numbers 
  // GROUP BY source_file
}

// 2. 前端服务
export async function getImportedFileList(): Promise<FileInfo[]> {
  return invoke('get_imported_file_list');
}
```

**影响**：**致命** - 核心流程无法使用

#### ❌ 文件选择器UI
**需求描述**：
> "勾选一个或多个文件夹来进行导入"

**当前状态**：
- 完全未实现
- 无文件选择界面

**需要实现**：
```tsx
// FileSelector组件
<Checkbox.Group onChange={handleFileSelect}>
  {files.map(file => (
    <Checkbox key={file.path} value={file.path}>
      {file.name} ({file.count}条)
    </Checkbox>
  ))}
</Checkbox.Group>
<Text>已选：{selectedCount}条联系人</Text>
```

**影响**：**致命** - 核心功能完全缺失

#### ❌ 选中后显示总联系人数量
**需求描述**：
> "勾选之后，要显示总联系人数量"

**当前状态**：
- 未实现

**需要实现**：
```typescript
const totalContacts = selectedFiles.reduce(
  (sum, file) => sum + file.count, 
  0
);
<Statistic title="已选联系人" value={totalContacts} />
```

**影响**：高 - 用户无法确认选择结果

#### ❌ 导入进度实时显示
**需求描述**：
> "导入任务遗交之后，要显示导入状态：已导入数量，未导入数量"

**当前状态**：
- 无实时进度显示
- 用户不知道导入进展

**需要实现**：
```tsx
<Progress 
  percent={progress} 
  format={() => `${imported}/${total}`}
/>
<Space>
  <Statistic title="已导入" value={imported} valueStyle={{ color: '#3f8600' }} />
  <Statistic title="未导入" value={failed} valueStyle={{ color: '#cf1322' }} />
</Space>
```

**影响**：高 - 用户体验差

#### ❌ 导入结果展示
**需求描述**：
> "导入任务完成后，返回导入结果：导入成功数量，未导入成功数量"

**当前状态**：
- 无结果模态框
- 无明确的成功/失败统计

**需要实现**：
```tsx
<Modal title="导入完成" visible={showResult}>
  <Result
    status="success"
    title="导入完成"
    subTitle={`成功：${success}条，失败：${failed}条`}
  >
    <Descriptions>
      <Descriptions.Item label="成功">{success}</Descriptions.Item>
      <Descriptions.Item label="失败">{failed}</Descriptions.Item>
      <Descriptions.Item label="总计">{total}</Descriptions.Item>
    </Descriptions>
  </Result>
  <Button type="primary" onClick={returnToMain}>
    确认
  </Button>
</Modal>
```

**影响**：**致命** - 用户无法确认操作结果

#### ❌ 自动返回主界面
**需求描述**：
> "用户点击确认之后，自动返回到'联系人导入'主界面"

**当前状态**：
- 无此逻辑

**需要实现**：
```typescript
const returnToMain = () => {
  setShowResult(false);
  navigate('/contact-import'); // 或关闭模态框
  refreshMainView(); // 刷新号码池
};
```

**影响**：中等 - 用户体验

#### ❌ 号码池状态同步
**需求描述**：
> "同时导入状态要显示在号码池里：每个已导入的号码，要显示'已导入'和'导入设备名称'"

**当前状态**：
- 字段已存在（`status`, `imported_device_id`）
- 渲染器已实现
- ⚠️ **缺失**：导入完成后需要刷新号码池数据

**需要实现**：
```typescript
// 导入完成后
await importToDevice(deviceId, selectedFiles);
// 自动刷新号码池
await refreshNumberPool();
```

**影响**：高 - 状态不同步会误导用户

---

## 📊 优先级评估

### 🔴 P0 - 致命（必须实现）
1. **获取文件列表API** (后端)
2. **文件选择器组件** (前端)
3. **导入结果模态框** (前端)
4. **按文件查询号码API** (后端)

### 🟠 P1 - 重要（强烈建议）
5. **导入进度实时显示**
6. **批量删除文件API** (后端)
7. **文件名去重检查**
8. **导入后自动刷新号码池**

### 🟡 P2 - 次要（可选）
9. **批量展开选中文件夹**
10. **批量导出文件**

---

## 🛠️ 实施建议

### 阶段1：核心流程打通 (2-3天)
```
[ ] 后端：get_imported_file_list 命令
[ ] 后端：get_numbers_by_files 命令
[ ] 前端：FileSelector 组件
[ ] 前端：DeviceImportFileSelector 对话框
[ ] 前端：ImportResultModal 模态框
[ ] 集成：完整的设备导入流程
```

### 阶段2：功能完善 (1-2天)
```
[ ] 文件名去重检查
[ ] 导入进度实时显示
[ ] 后端：delete_numbers_by_files 命令
[ ] 导入后自动刷新
```

### 阶段3：体验优化 (0.5-1天)
```
[ ] 批量展开选中
[ ] 批量导出功能
[ ] 错误处理优化
```

---

## 📝 后端API清单

需要新增的Rust命令：

```rust
// 1. 获取所有已导入文件列表
#[command]
pub async fn get_imported_file_list(
    app_handle: AppHandle,
) -> Result<Vec<FileInfoDto>, String>

// 2. 根据文件路径列表获取号码
#[command]
pub async fn get_numbers_by_files(
    app_handle: AppHandle,
    file_paths: Vec<String>,
) -> Result<Vec<ContactNumberDto>, String>

// 3. 检查文件是否已导入
#[command]
pub async fn check_file_imported(
    app_handle: AppHandle,
    file_path: String,
) -> Result<bool, String>

// 4. 按文件路径删除号码
#[command]
pub async fn delete_numbers_by_files(
    app_handle: AppHandle,
    file_paths: Vec<String>,
) -> Result<i64, String>

// 5. 按文件路径导出号码
#[command]
pub async fn export_numbers_by_files(
    app_handle: AppHandle,
    file_paths: Vec<String>,
    format: String, // "txt" | "csv"
) -> Result<String, String> // 返回导出文件路径
```

---

## 🎯 总结

### 完成度评估
- ✅ **UI框架**: 90% 完成
- ⚠️ **核心流程**: 40% 完成
- ❌ **设备导入**: 10% 完成（只有底层API，无业务流程）

### 最关键的缺失
**"设备与VCF"模块**的文件选择功能**完全未实现**，这是需求图片中最重要的新功能，也是整个需求的核心。

当前的实现更多是对现有功能的优化和UI调整，而**核心的按文件导入流程尚未建立**。

---

**建议优先完成P0级别的4个功能**，才能使整个功能链路打通并可用。

---

**文档创建**: 2025-10-22  
**审核状态**: 待开发确认
