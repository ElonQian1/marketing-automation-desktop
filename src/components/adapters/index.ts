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

// Upload - 统一触发/列表显示策略
export {
  UploadAdapter,
  type UploadAdapterProps,
} from "./upload/UploadAdapter";

// Tree - 支持虚拟滚动与统一默认
export {
  TreeAdapter,
  type TreeAdapterProps,
} from "./tree/TreeAdapter";

// DatePicker - 日期与范围选择
export {
  DatePickerAdapter,
  RangeDatePickerAdapter,
  type DatePickerAdapterProps,
  type RangeDatePickerAdapterProps,
} from "./date-picker/DatePickerAdapter";

// Drawer - 统一宽度/位置/销毁行为
export {
  DrawerAdapter,
  type DrawerAdapterProps,
} from "./drawer/DrawerAdapter";

// Steps - 进度与流程
export {
  StepsAdapter,
  type StepsAdapterProps,
} from "./steps/StepsAdapter";

// Grid - 栅格布局适配器
export {
  GridRow,
  GridCol,
  GridSpace,
  type GridRowProps,
  type GridColProps,
  type GridSpaceProps,
} from "./grid/GridAdapter";

// Icons - 图标适配器
export {
  BrandStarIcon,
  BrandRocketIcon,
  BrandBulbIcon,
  BrandSuccessIcon,
  BrandWarningIcon,
  BrandInfoIcon,
  BrandErrorIcon,
  type IconProps,
} from "./icons/IconAdapter";

// 提示：请不要在此处导出任何以 Ant* 命名的重复适配器，避免双实现。