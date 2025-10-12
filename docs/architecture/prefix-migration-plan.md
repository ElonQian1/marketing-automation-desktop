# 前缀化迁移计划

**执行日期**: 2025年10月12日  
**执行员工**: 员工A（结构整形工程师）  
**目标**: 对容易重名的子目录实施命名前缀，避免跨模块误改

## 模块前缀约定

- `prospecting` → `prospecting-*/Prospecting*`
- `script-builder` → `script-*/Script*`  
- `contact-import` → `contact-*/Contact*`
- `adb` → `adb-*/Adb*`

## 发现的策略文件清单

### contact-import 模块

| 模块 | 子目录 | from(现名) | to(前缀化后) | 类型名改为 | 状态 | 备注 |
|------|--------|------------|-------------|-----------|------|------|
| contact-import | strategies | ImportStrategies.ts | contact-strategy-import.ts | ContactStrategyImport | ✅已完成 | 联系人导入策略 |

### adb 模块（新开始）

| 模块 | 子目录 | from(现名) | to(前缀化后) | 类型名改为 | 状态 | 备注 |
|------|--------|------------|-------------|-----------|------|------|
| adb | services | AdbApplicationService.ts | adb-application-service.ts | AdbApplicationService | ✅已完成 | ADB应用服务主入口 |
| adb | services/query | AdbQueryService.ts | adb-query-service.ts | AdbQueryService | ✅已完成 | ADB查询服务 |
| adb | services/health | AdbHealthService.ts | adb-health-service.ts | AdbHealthService | ✅已完成 | ADB健康检查服务 |
| adb | services/logging | AdbLogBridgeService.ts | adb-log-bridge-service.ts | AdbLogBridgeService | ✅已完成 | ADB日志桥接服务 |

### script-builder 模块（新开始）

| 模块 | 子目录 | from(现名) | to(前缀化后) | 类型名改为 | 状态 | 备注 |
|------|--------|------------|-------------|-----------|------|------|
| smart-script-management | services | scriptService.ts | script-management-service.ts | ScriptManagementService | ✅已完成 | 智能脚本管理服务 |
| infrastructure | repositories | TauriSmartScriptRepository.ts | script-tauri-repository.ts | ScriptTauriRepository | ✅已完成 | Tauri脚本仓储实现 |

### prospecting 模块（新开始）

| 模块 | 子目录 | from(现名) | to(前缀化后) | 类型名改为 | 状态 | 备注 |
|------|--------|------------|-------------|-----------|------|------|
| precise-acquisition | (根目录) | PreciseAcquisitionService.ts | prospecting-acquisition-service.ts | ProspectingAcquisitionService | ⏳待处理 | 精准获客系统服务门面 |
| precise-acquisition/template-management | services | TemplateManagementService.ts | prospecting-template-service.ts | ProspectingTemplateService | ⏳待处理 | 话术模板管理服务 |
| precise-acquisition/task-engine | services | TaskEngineService.ts | prospecting-task-engine-service.ts | ProspectingTaskEngineService | ⏳待处理 | 任务引擎服务 |
| precise-acquisition/task-engine | services | TaskExecutorService.ts | prospecting-task-executor-service.ts | ProspectingTaskExecutorService | ⏳待处理 | 任务执行服务 |
| precise-acquisition/task-engine | services | TaskManager.ts | prospecting-task-manager.ts | ProspectingTaskManager | ⏳待处理 | 任务管理器 |

### intelligent-strategy-system 模块（暂不处理）

此模块包含大量策略文件，但属于智能策略系统的内部实现，暂不进行前缀化处理：
- `analyzers/neighbor-relative/strategies/*`
- `analyzers/region-scoped/strategies/*`  
- `scoring/stability-assessment/strategies/*`

## 执行计划

### 阶段1: contact-import 策略前缀化
1. ✅ 识别文件：`src/modules/contact-import/strategies/ImportStrategies.ts`
2. ✅ 重命名为：`src/modules/contact-import/strategies/contact-strategy-import.ts`
3. ✅ 修改内部类型名：`IImportStrategy` → `ContactImportStrategy`，类名前缀化完成
4. ✅ 更新导入引用：8个文件成功更新

### 阶段2: ADB模块前缀化（已完成）
1. ✅ 重命名 AdbApplicationService.ts → adb-application-service.ts
2. ✅ 重命名 AdbQueryService.ts → adb-query-service.ts
3. ✅ 重命名 AdbHealthService.ts → adb-health-service.ts
4. ✅ 重命名 AdbLogBridgeService.ts → adb-log-bridge-service.ts
5. ✅ 更新所有相关的import引用
6. ✅ 统一文件头部注释格式

### 阶段3: script-builder模块前缀化（已完成）
1. ✅ 重命名 scriptService.ts → script-management-service.ts
2. ✅ 重命名 TauriSmartScriptRepository.ts → script-tauri-repository.ts  
3. ✅ 修改内部类型名：ScriptManagementService 保持不变，TauriSmartScriptRepository → ScriptTauriRepository
4. ✅ 更新所有相关的import引用（2个文件更新）
5. ✅ 统一文件头部注释格式

### 阶段4: prospecting模块前缀化（新开始）
1. ⏳ 重命名 PreciseAcquisitionService.ts → prospecting-acquisition-service.ts
2. ⏳ 重命名 TemplateManagementService.ts → prospecting-template-service.ts
3. ⏳ 重命名 TaskEngineService.ts → prospecting-task-engine-service.ts
4. ⏳ 重命名 TaskExecutorService.ts → prospecting-task-executor-service.ts
5. ⏳ 重命名 TaskManager.ts → prospecting-task-manager.ts
6. ⏳ 修改所有内部类型名加上 Prospecting 前缀
7. ⏳ 更新所有相关的import引用
8. ⏳ 统一文件头部注释格式

### 阶段5: 门牌导出完善
1. ⏳ 检查 `src/modules/contact-import/index.ts`
2. ⏳ 确保只导出对外API，不导出内部策略实现

### 阶段6: 别名检查
1. ⏳ 检查 `tsconfig.json` 中的路径别名
2. ⏳ 确保包含 `@contact/*` 等别名

### 阶段7: 三行文件头
1. ⏳ 为修改的文件添加三行文件头

## 发现的模块结构

```
src/modules/
├── adb/                    # ADB模块（结构良好）
├── contact-import/         # 联系人导入模块
│   ├── strategies/         # 📌 需要前缀化
│   ├── domain/
│   ├── application/
│   └── index.ts           # 📌 需要检查门牌导出
├── intelligent-strategy-system/  # 智能策略系统（内部实现，暂不处理）
└── ...其他模块
```

## 注意事项

1. **硬底线遵守**: 确保 domain 不依赖 UI/IO
2. **小步迭代**: 每完成一批修改就提交
3. **记录进展**: 在 `stream_a.md` 记录每步进展
4. **保持功能**: 不改变业务逻辑，只改文件名和类型名

---
*创建时间: 2025年10月12日*  
*最后更新: 2025年10月12日*