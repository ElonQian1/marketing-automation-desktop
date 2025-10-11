// src/modules/contact-import/utils/csv.ts
// module: contact-import | layer: module | role: module-component
// summary: 模块组件

// modules/contact-import/utils | csv | CSV数据处理工具
// 提供数据导出为CSV格式和CSV数据解析功能，支持自定义列名和格式化

export function toCsv<T extends Record<string, any>>(rows: T[], headers?: string[]): string {
  if (!rows || rows.length === 0) return '';
  const cols = headers && headers.length > 0 ? headers : Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const escape = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const headerLine = cols.map(c => escape(c)).join(',');
  const lines = rows.map(r => cols.map(c => escape(r[c])).join(','));
  return [headerLine, ...lines].join('\n');
}

// 支持使用 key 列选择 + 独立的显示名标签（labels）
export function toCsvWithLabels<T extends Record<string, any>>(rows: T[], keys: string[], labels: string[]): string {
  if (!rows || rows.length === 0) return '';
  const cols = keys && keys.length > 0 ? keys : Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const headerLabels = labels && labels.length === cols.length ? labels : cols;
  const escape = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const headerLine = headerLabels.map(c => escape(c)).join(',');
  const lines = rows.map(r => cols.map(c => escape(r[c])).join(','));
  return [headerLine, ...lines].join('\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 带 BOM 以提升 Excel 打开中文 CSV 的兼容性
export function downloadCsvWithBom(filename: string, csv: string): void {
  const BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([BOM, csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
