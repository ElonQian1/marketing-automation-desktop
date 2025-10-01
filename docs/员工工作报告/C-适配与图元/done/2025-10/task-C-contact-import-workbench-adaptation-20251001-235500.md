# [C] 联系人导入工作台适配与类型收口

- 日期: 2025-10-01
- 负责人: 员工C（适配与图元）
- 结果: ✅ 完成（TypeScript 编译 0 错误）

## 范围
- 模块：`src/modules/contact-import/ui/*`
- 页面：`src/pages/contact-import/ContactImportPage.tsx`
- 适配层：`src/components/adapters/*`

## 关键变更
- Search 输入统一走适配器层（避免直连 AntD）。
- 表格列：通过 `getWorkbenchTableColumns({ columnSettings: { visibleColumns: configs } })` 生成；与 `useResizableColumns`（数组签名）联动，`setWidth` 回写。
- Header 可调：在 `columns` 的 `onHeaderCell` 注入 `resizableRuntime`，并以 `WorkbenchResizableHeader` 渲染。
- 批量操作栏：`WorkbenchNumbersActionsBar` 统一新 props（`pageItemIds`、`onChangeSelected`、`onArchived`、`disabled`、`globalFilter`）。
- 导入执行：VCF 生成与导入路径升级——临时文件写入 + `VcfImportService.importVcfFile`/`VcfActions.importVcfToDevice`。
- 批次登记：`registerGeneratedBatch` 使用对象参数 `{ deviceId, batchId, vcfFilePath, numberIds }`。
- 批量执行：`executeBatches(batches, options)` 签名统一，`markConsumed` 布尔映射为函数或省略。

## 验证
- `npm run type-check`：0 错误。
- 页面加载：`ContactImportPage` 懒加载工作台正常渲染。
- 表格：列设置、拖拽宽度、分页选择、批量归档动作正常。

## 架构对齐
- 遵循 DDD 与适配器层统一入口；未新增状态存储文件。
- 与现有 UI 令牌/主题系统兼容；未引入旧 API。

## 影响面与回滚
- 影响面仅限联系人导入模块与 adapters 使用点。
- 如需回滚，恢复到变更前版本的 `ContactImportWorkbench.tsx` 与 `useWorkbenchActions.ts` 即可。

## 后续建议
- 端到端烟测（可选）：运行 `tauri dev` 验证设备侧导入实际行为。
- 将批量消费标记函数落实到后端命令后，开启 `executeBatches` 的 `markConsumed`。