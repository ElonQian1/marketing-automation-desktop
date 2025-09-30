// 自动生成的样式修复脚本
// 使用此脚本快速修复常见的硬编码样式问题

const fixes = [
  {
    search: /background:\s*'rgba\(255,\s*255,\s*255,\s*0\.95\)'/g,
    replace: "// background: 'rgba(255, 255, 255, 0.95)', // 移除硬编码，使用CSS类",
    description: "注释掉硬编码白色背景"
  },
  {
    search: /border:\s*'1px solid #d9d9d9'/g,
    replace: "// border: '1px solid #d9d9d9', // 移除硬编码，使用CSS类",
    description: "注释掉硬编码边框"
  },
  {
    search: /boxShadow:\s*'[^']*'/g,
    replace: "// boxShadow: '...', // 移除硬编码，使用CSS类",
    description: "注释掉硬编码阴影"
  }
];

// 使用说明:
// 1. 在VS Code中打开问题文件
// 2. 使用查找替换功能 (Ctrl+H)
// 3. 启用正则表达式模式
// 4. 逐个应用上述修复

console.log('🔧 样式修复脚本已生成!');
console.log('建议：结合CSS类和!important来确保样式覆盖');
