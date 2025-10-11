// src/modules/contact-import/ui/components/DeviceAssignmentGrid/components/types.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

import type { ImportResult } from '../../../../import-strategies/types';

export interface DeviceSpecificImportDialogProps {
  /** 是否显示对话框 */
  visible: boolean;
  /** VCF文件路径 */
  vcfFilePath: string;
  /** 目标设备ID */
  targetDeviceId: string;
  /** 关闭回调 */
  onClose: () => void;
  /** 导入成功回调 */
  onSuccess?: (result: ImportResult) => void;
}