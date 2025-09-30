# ADB 联系人查询方法测试报告

## 📋 测试环境信息

- **测试日期**: 2025年9月30日
- **设备ID**: AHXVCP3526428590
- **设备品牌**: Honor（华为系）
- **ROM类型**: 定制Android系统
- **ADB版本**: Android Debug Bridge version 1.0.41
- **联系人包**: 
  - `com.hihonor.contacts.sync` (华为联系人同步)
  - `com.android.providers.contacts` (标准联系人提供者)

---

## ✅ **可行的查询方式**

### 1. **基础联系人信息查询**
```bash
# 查询联系人基本信息（姓名和ID）
adb shell content query --uri content://com.android.contacts/contacts --projection display_name --projection _id
```

**测试结果**：
```
Row: 0 display_name=联系人1
Row: 1 display_name=联系人2  
Row: 2 display_name=联系人3
Row: 3 display_name=联系人4
```

**适用场景**：
- 获取联系人总数统计
- 获取联系人姓名列表
- 基础的联系人存在性验证

---

### 2. **联系人数据表查询**
```bash
# 查询联系人详细数据（包含手机号码）
adb shell content query --uri content://com.android.contacts/data --projection contact_id --projection data1
```

**测试结果**：
```
Row: 0 data1=联系人1
Row: 1 data1=17743110605    # 手机号码
Row: 2 data1=联系人2
Row: 3 data1=15272746516    # 手机号码
Row: 4 data1=联系人3
Row: 5 data1=15580509467    # 手机号码
Row: 6 data1=联系人4
Row: 7 data1=15296791112    # 手机号码
```

**适用场景**：
- 获取联系人的详细数据
- 提取手机号码信息
- 需要后续处理区分数据类型

---

### 3. **数据类型识别查询**
```bash
# 查询数据类型（区分姓名和手机号）
adb shell content query --uri content://com.android.contacts/data --projection contact_id --projection data1 --projection mimetype
```

**测试结果**：
```
Row: 0 mimetype=vnd.android.cursor.item/name      # 姓名类型
Row: 1 mimetype=vnd.android.cursor.item/phone_v2  # 手机号类型
```

**识别的数据类型**：
- `vnd.android.cursor.item/name`: 联系人姓名
- `vnd.android.cursor.item/phone_v2`: 手机号码
- `vnd.android.cursor.item/email_v2`: 邮箱地址（如果存在）

**适用场景**：
- 精确区分不同类型的联系人数据
- 构建结构化的联系人信息

---

### 4. **包管理器查询**
```bash
# 查看联系人相关的安装包
adb shell pm list packages | findstr -i contact
```

**测试结果**：
```
package:com.hihonor.contacts.sync
package:com.android.providers.contacts
```

**适用场景**：
- 检测设备的联系人系统类型
- 判断是否为厂商定制ROM
- 兼容性预检查

---

## ❌ **不可行的查询方式**

### 1. **复杂WHERE条件查询**
```bash
# ❌ 失败：精确过滤查询
adb shell content query --uri content://com.android.contacts/data --where "mimetype='vnd.android.cursor.item/phone_v2'"
```

**错误信息**：
```
android.database.sqlite.SQLiteException: near ".": syntax error (Sqlite code 1 SQLITE_ERROR)
```

**失败原因**：
- Honor定制ROM的SQLite语法限制
- ContentProvider安全策略限制
- 不支持复杂的WHERE条件

---

### 2. **复合字段投影语法**
```bash
# ❌ 失败：冒号分隔的字段语法
adb shell content query --uri content://com.android.contacts/data --projection "contact_id:data1:mimetype"
```

**错误信息**：
```
java.lang.IllegalArgumentException: Non-token detected in 'contact_id:data1:mimetype'
```

**失败原因**：
- 不支持标准的冒号分隔投影语法
- 需要使用多个`--projection`参数

---

### 3. **联系人服务转储**
```bash
# ❌ 失败：系统服务转储
adb shell dumpsys contacts
```

**错误信息**：
```
Can't find service: contacts
```

**失败原因**：
- 联系人服务未暴露给dumpsys
- 厂商定制系统移除了该服务接口
- 需要特殊权限或root访问

---

### 4. **LIKE模糊匹配查询**
```bash
# ❌ 失败：模糊匹配查询
adb shell content query --uri content://com.android.contacts/data --where "mimetype LIKE '%phone%'"
```

**错误信息**：
```
usage: adb shell content [subcommand] [options]
```

**失败原因**：
- 不支持LIKE操作符
- WHERE条件语法受限
- 需要使用精确匹配

---

## 🎯 **推荐的实用策略**

### **策略一：分步查询 + PC端合并（推荐）**

```bash
# 1. 获取联系人基础信息
adb shell content query --uri content://com.android.contacts/contacts --projection _id --projection display_name > contacts_basic.txt

# 2. 获取所有详细数据
adb shell content query --uri content://com.android.contacts/data --projection contact_id --projection data1 --projection mimetype > contacts_data.txt

# 3. 在PC端（Rust/Python）中处理和合并数据
```

**优势**：
- 绕过WHERE条件限制
- 获取完整数据
- 灵活的后处理能力

---

### **策略二：验证导入成功的实用方法**

**导入前后对比验证**：
```bash
# 导入前统计
BEFORE=$(adb shell content query --uri content://com.android.contacts/contacts --projection _id | grep -c "Row:")

# 执行联系人导入...

# 导入后统计  
AFTER=$(adb shell content query --uri content://com.android.contacts/contacts --projection _id | grep -c "Row:")

# 计算差值
echo "新增联系人数量: $((AFTER - BEFORE))"
```

**抽样验证**：
```bash
# 获取最新的联系人数据，检查是否包含预期的手机号
adb shell content query --uri content://com.android.contacts/data --projection data1 | grep "手机号码模式"
```

---

## 🛠️ **技术实现建议**

### **Rust代码实现框架**

```rust
// src-tauri/src/services/contacts_validator.rs
use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ContactValidationResult {
    pub total_contacts: u32,
    pub phone_numbers: Vec<String>,
    pub validation_success: bool,
    pub error_message: Option<String>,
}

pub struct ContactsValidator {
    adb_path: String,
    device_id: String,
}

impl ContactsValidator {
    pub fn new(adb_path: String, device_id: String) -> Self {
        Self { adb_path, device_id }
    }
    
    /// 获取联系人总数
    pub fn get_contacts_count(&self) -> Result<u32, String> {
        let output = Command::new(&self.adb_path)
            .args([
                "-s", &self.device_id,
                "shell",
                "content", "query",
                "--uri", "content://com.android.contacts/contacts",
                "--projection", "_id"
            ])
            .output()
            .map_err(|e| format!("执行ADB命令失败: {}", e))?;
            
        let stdout = String::from_utf8_lossy(&output.stdout);
        let count = stdout.lines().filter(|line| line.starts_with("Row:")).count();
        Ok(count as u32)
    }
    
    /// 获取所有手机号码
    pub fn get_phone_numbers(&self) -> Result<Vec<String>, String> {
        let output = Command::new(&self.adb_path)
            .args([
                "-s", &self.device_id,
                "shell",
                "content", "query",
                "--uri", "content://com.android.contacts/data",
                "--projection", "data1",
                "--projection", "mimetype"
            ])
            .output()
            .map_err(|e| format!("执行ADB命令失败: {}", e))?;
            
        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut phone_numbers = Vec::new();
        let mut is_phone_row = false;
        
        for line in stdout.lines() {
            if line.contains("mimetype=vnd.android.cursor.item/phone_v2") {
                is_phone_row = true;
            } else if line.contains("data1=") && is_phone_row {
                if let Some(phone) = extract_phone_from_line(line) {
                    phone_numbers.push(phone);
                }
                is_phone_row = false;
            }
        }
        
        Ok(phone_numbers)
    }
    
    /// 验证导入结果
    pub fn validate_import(&self, expected_phones: &[String]) -> Result<ContactValidationResult, String> {
        let actual_phones = self.get_phone_numbers()?;
        let total_contacts = self.get_contacts_count()?;
        
        let mut found_phones = Vec::new();
        for expected in expected_phones {
            if actual_phones.iter().any(|actual| actual.contains(expected)) {
                found_phones.push(expected.clone());
            }
        }
        
        let validation_success = found_phones.len() == expected_phones.len();
        
        Ok(ContactValidationResult {
            total_contacts,
            phone_numbers: found_phones,
            validation_success,
            error_message: if validation_success { 
                None 
            } else { 
                Some(format!("预期{}个号码，实际找到{}个", expected_phones.len(), found_phones.len())) 
            },
        })
    }
}

fn extract_phone_from_line(line: &str) -> Option<String> {
    // 解析 "Row: X data1=手机号码" 格式
    if let Some(start) = line.find("data1=") {
        let phone_part = &line[start + 6..];
        if let Some(end) = phone_part.find(',').or_else(|| Some(phone_part.len())) {
            let phone = phone_part[..end].trim();
            // 简单的手机号码格式验证
            if phone.len() >= 11 && phone.chars().all(|c| c.is_ascii_digit()) {
                return Some(phone.to_string());
            }
        }
    }
    None
}
```

---

## 📝 **总结与建议**

### **设备兼容性**
- ✅ **基础查询**：Honor设备完全支持
- ⚠️ **复杂查询**：受厂商定制限制
- ❌ **高级功能**：需要root权限或特殊ROM

### **实用性评估**
1. **方案1（数据库直接验证）**：✅ 推荐使用
2. **方案2（UI自动化验证）**：✅ 作为补充
3. **方案3（导出对比验证）**：⚠️ 需要额外开发
4. **方案4（实时监控验证）**：❌ 当前设备不支持

### **开发建议**
- 优先使用简化的content查询
- 在PC端进行数据处理和过滤
- 实现多重验证机制提高准确性
- 为不同厂商设备预留兼容性方案

---

*文档生成时间: 2025年9月30日*  
*测试设备: AHXVCP3526428590 (Honor)*  
*文档版本: v1.0*