// src/modules/contact-import/ui/utils/file.ts
// module: contact-import | layer: ui | role: module-component
// summary: 模块组件

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    reader.readAsText(file, 'UTF-8');
  });
}
