// src/modules/contact-import/utils/vcf.ts
// module: contact-import | layer: module | role: module-component
// summary: 模块组件

// modules/contact-import/utils | vcf | VCF文件构建工具
// 将联系人号码数据转换为vCard格式，用于设备端联系人导入

import type { ContactNumberDto } from '../ui/services/contactNumberService';

export function buildVcfFromNumbers(numbers: ContactNumberDto[]): string {
  return numbers
    .map((n, idx) => [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${n.name || `联系人${idx + 1}`}`,
      `N:${n.name || `联系人${idx + 1}`};;;;`,
      `TEL:${n.phone}`,
      'END:VCARD',
    ].join('\n'))
    .join('\n\n');
}
