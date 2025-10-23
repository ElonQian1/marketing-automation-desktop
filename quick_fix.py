with open('src-tauri/src/main.rs', 'r', encoding='utf-8') as f:
    content = f.read()

# 添加导入
content = content.replace(
    'get_distinct_industries_cmd,',
    'get_distinct_industries_cmd, get_numbers_by_files,'
)

# 添加到 invoke_handler  
content = content.replace(
    'delete_contact_numbers,',
    'delete_contact_numbers,\n            get_numbers_by_files,'
)

with open('src-tauri/src/main.rs', 'w', encoding='utf-8') as f:
    f.write(content)
    
print('Done!')
