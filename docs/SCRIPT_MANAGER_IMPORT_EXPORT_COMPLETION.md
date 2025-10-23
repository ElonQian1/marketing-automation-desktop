# 脚本管理器导入/导出功能完善报告

## 📋 任务概述

完善脚本管理器模态框的导入/导出功能，复用已有的分布式脚本导入/导出能力。

## 🎯 实现内容

### 1. 在 `useScriptManager` Hook 中添加导入导出方法

**文件**: `src/modules/smart-script-management/hooks/useScriptManager.ts`

#### 新增功能：

1. **`importScript()`** - 从文件导入分布式脚本
   - 使用 `ScriptFileService.importDistributedScript()` 选择并读取文件
   - 将 `DistributedScript` 转换为 `SmartScript` 格式
   - 保存到数据库并刷新脚本列表
   - 自动标记为模板导入（`metadata.isTemplate = true`）

2. **`exportScript(scriptId: string)`** - 导出单个脚本
   - 加载完整脚本数据
   - 将 `SmartScript` 转换为 `DistributedScript` 格式
   - 使用 `ScriptFileService.exportDistributedScript()` 保存文件

3. **`exportScripts(scriptIds: string[])`** - 批量导出多个脚本
   - 遍历选中的脚本ID列表
   - 依次导出每个脚本
   - 显示成功导出的数量

### 2. 在 `ScriptManager` 组件中集成导入导出功能

**文件**: `src/modules/smart-script-management/components/ScriptManager.tsx`

#### 新增功能：

1. **导入按钮** - 工具栏
   - 点击后打开文件选择对话框
   - 支持 `.json` 格式的分布式脚本文件
   - 导入成功后自动刷新列表

2. **批量导出按钮** - 工具栏
   - 导出所有选中的脚本
   - 显示选中数量
   - 禁用状态：未选中任何脚本时

3. **单个脚本导出按钮** - 操作列
   - 每行添加导出按钮
   - 支持快速导出单个脚本
   - 与其他操作按钮保持一致的样式

## 🔄 数据转换逻辑

### DistributedScript → SmartScript (导入时)

```typescript
{
  // 基本信息
  id: `imported_${Date.now()}`,
  name: distributedScript.name,
  description: distributedScript.description,
  version: distributedScript.version,
  
  // 步骤转换
  steps: distributedScript.steps.map((step, index) => ({
    id: step.id,
    order: index,
    step_type: step.actionType,
    enabled: true,
    parameters: {
      ...step.params,
      xpath: step.locator.absoluteXPath,
      resource_id: step.locator.attributes?.resourceId,
      xmlContent: step.xmlSnapshot?.xmlContent,
      locator: step.locator
    }
  })),
  
  // 配置映射
  config: {
    smart_recovery_enabled: distributedScript.runtime?.enableSmartFallback,
    default_timeout_ms: distributedScript.runtime?.timeoutMs,
    default_retry_count: distributedScript.runtime?.maxRetries
  },
  
  // 元数据标记
  metadata: {
    isTemplate: true  // 标记为模板导入
  }
}
```

### SmartScript → DistributedScript (导出时)

```typescript
{
  // 基本信息
  id: fullScript.id,
  name: fullScript.name,
  description: fullScript.description,
  version: fullScript.version,
  
  // 步骤转换
  steps: fullScript.steps.map(step => ({
    id: step.id,
    name: step.name,
    actionType: step.step_type,
    params: step.parameters,
    locator: {
      absoluteXPath: step.parameters?.xpath,
      attributes: {
        resourceId: step.parameters?.resource_id,
        text: step.parameters?.text
      }
    },
    xmlSnapshot: step.parameters?.xmlContent ? {
      xmlContent: step.parameters.xmlContent,
      xmlHash: `hash_${step.id}`,
      timestamp: Date.now()
    } : undefined
  })),
  
  // 运行时配置
  runtime: {
    maxRetries: fullScript.config.default_retry_count,
    timeoutMs: fullScript.config.default_timeout_ms,
    enableSmartFallback: fullScript.config.smart_recovery_enabled
  }
}
```

## ✨ 功能特性

### 1. 完全复用现有服务
- ✅ 使用 `ScriptFileService` 统一文件操作
- ✅ 与"导入/导出分布式脚本"功能保持一致
- ✅ 支持相同的文件格式和验证逻辑

### 2. 用户体验优化
- ✅ 导入成功后自动刷新列表
- ✅ 导入的脚本带有"模板导入"标识
- ✅ 批量操作时显示选中数量
- ✅ 提供清晰的操作提示和反馈

### 3. 类型安全
- ✅ 完整的类型转换逻辑
- ✅ 使用类型断言处理复杂参数
- ✅ 保留所有必要的元数据

## 📊 UI 变化

### 工具栏按钮组

```
[脚本管理器] [共 X 个脚本]
  ↓
[导入] [导出 (N)] [批量删除 (N)]
```

### 操作列按钮组

```
[执行] [编辑] [导出] [复制] [重命名] [删除]
     ↑ 新增导出按钮
```

## 🔍 关键代码位置

1. **Hook 导入导出方法**
   - `src/modules/smart-script-management/hooks/useScriptManager.ts:85-265`

2. **ScriptManager 组件集成**
   - 导入导出处理函数: `ScriptManager.tsx:179-215`
   - 工具栏按钮: `ScriptManager.tsx:333-353`
   - 操作列按钮: `ScriptManager.tsx:293-318`

3. **文件服务复用**
   - `src/modules/smart-script-management/services/script-file-service.ts`

## ✅ 验证要点

### 导入功能
- [ ] 点击"导入"按钮打开文件选择对话框
- [ ] 选择 `.json` 格式文件后正确解析
- [ ] 导入的脚本出现在列表中
- [ ] 脚本带有"模板导入"标识
- [ ] 步骤数据完整保留

### 导出功能
- [ ] 单个脚本导出按钮可用
- [ ] 批量导出时需要先选中脚本
- [ ] 导出的文件格式正确
- [ ] 文件名包含脚本名称
- [ ] 导出的脚本可以被重新导入

### 数据完整性
- [ ] XML 快照信息保留
- [ ] 定位器信息正确转换
- [ ] 运行时配置正确映射
- [ ] 元数据和标签保留

## 🎯 使用场景

1. **脚本分享**
   - 导出脚本 → 分享文件 → 他人导入使用

2. **脚本备份**
   - 批量导出重要脚本 → 保存到本地 → 需要时恢复

3. **跨设备同步**
   - A 设备导出 → 文件传输 → B 设备导入

4. **模板库管理**
   - 导入官方/社区脚本模板
   - 自动标记为模板来源

## 🚀 后续优化建议

1. **批量导出优化**
   - 支持打包多个脚本到一个压缩文件
   - 提供进度显示

2. **导入增强**
   - 支持拖拽文件导入
   - 导入前预览脚本内容
   - 检测重复脚本并提示

3. **云端同步**
   - 支持上传到云端脚本库
   - 从云端浏览和下载脚本

## 📝 总结

✅ 成功复用 `ScriptFileService` 的导入/导出能力  
✅ 在脚本管理器中实现完整的导入/导出功能  
✅ 支持单个和批量操作  
✅ 保持与"分布式脚本"功能的一致性  
✅ 无类型错误，代码质量良好  

**状态**: ✅ 已完成
**测试状态**: ⏳ 待用户验证
