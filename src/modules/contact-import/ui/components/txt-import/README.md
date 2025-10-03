# txt-import 模块

- 容器：`TxtImportRecordsModal.tsx`（导出为 `TxtImportRecordsManager`）
- Hooks：`hooks/useTxtImportRecords.tsx`、`hooks/useTxtImportActions.tsx`（通过 `hooks/index.ts` 统一导出）
- 展示组件：`components/RecordsTable.tsx`、`components/RecordActions.tsx`
- 逻辑工具：`logic/ConfirmBulkDeleteDialog.tsx`
- 入口导出：`index.ts`

使用方式：

```ts
import { TxtImportRecordsManager } from '@/modules/contact-import/ui/components/txt-import';
```

扩展点：
- 新增批量动作 → 在 `logic/` 下新增对话工具，并在 `useTxtImportActions` 中挂接回调
- 新增筛选/搜索 → 新增 `hooks/useTxtImportFilter.tsx` 或扩展 `useTxtImportRecords` 入参
- 详情展示 → 将行内错误改为抽屉/Modal 独立组件