const fs = require('fs');

// 读取文件
let content = fs.readFileSync('src-tauri/src/main.rs', 'utf8');

// 修改1: 添加导入
content = content.replace(
    'get_distinct_industries_cmd,',
    'get_distinct_industries_cmd, get_numbers_by_files,'
);

// 修改2: 添加到 invoke_handler
content = content.replace(
    'delete_contact_numbers,',
    'delete_contact_numbers,\n            get_numbers_by_files,'
);

// 写回文件
fs.writeFileSync('src-tauri/src/main.rs', content, 'utf8');

console.log('✅ 修改完成!');
