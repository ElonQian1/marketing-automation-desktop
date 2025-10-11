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

### 阶段2: 门牌导出完善
1. ⏳ 检查 `src/modules/contact-import/index.ts`
2. ⏳ 确保只导出对外API，不导出内部策略实现

### 阶段3: 别名检查
1. ⏳ 检查 `tsconfig.json` 中的路径别名
2. ⏳ 确保包含 `@contact/*` 等别名

### 阶段4: 三行文件头
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