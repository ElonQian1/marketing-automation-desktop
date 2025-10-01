// 适配器模块聚合导出：保持单一实现与清晰入口
export {
  TableAdapter,
  DataTableAdapter,
  CompactTableAdapter,
  type TableAdapterProps,
} from "./table/TableAdapter";

export {
  FormAdapter,
  FormItemAdapter,
  DialogFormAdapter,
  StepFormAdapter,
  type FormAdapterProps,
} from "./form/FormAdapter";

// 提示：请不要在此处导出任何以 Ant* 命名的重复适配器，避免双实现。