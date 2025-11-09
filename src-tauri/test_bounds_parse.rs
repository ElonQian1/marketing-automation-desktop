// 临时测试文件：验证bounds解析
use regex::Regex;

fn extract_attribute(node_str: &str, attr_name: &str) -> Option<String> {
    let pattern = format!(r#"{}="([^"]*)""#, attr_name);
    if let Ok(regex) = Regex::new(&pattern) {
        if let Some(captures) = regex.captures(node_str) {
            return captures.get(1).map(|m| m.as_str().to_string());
        }
    }
    None
}

fn parse_bounds(bounds_str: &str) -> Result<(i32, i32, i32, i32), String> {
    let pattern = r#"\[(\d+),(\d+)\]\[(\d+),(\d+)\]"#;
    if let Ok(regex) = Regex::new(pattern) {
        if let Some(captures) = regex.captures(bounds_str) {
            let left: i32 = captures.get(1).unwrap().as_str().parse().map_err(|e| format!("{}", e))?;
            let top: i32 = captures.get(2).unwrap().as_str().parse().map_err(|e| format!("{}", e))?;
            let right: i32 = captures.get(3).unwrap().as_str().parse().map_err(|e| format!("{}", e))?;
            let bottom: i32 = captures.get(4).unwrap().as_str().parse().map_err(|e| format!("{}", e))?;
            return Ok((left, top, right, bottom));
        }
    }
    Err(format!("Invalid bounds format: {}", bounds_str))
}

fn main() {
    // 测试用例1：从XML提取bounds属性
    let node_str = r#"<node index="0" text="" resource-id="com.xingin.xhs:id/0_resource_name_obfuscated" class="android.widget.FrameLayout" package="com.xingin.xhs" content-desc="" checkable="false" checked="false" clickable="true" enabled="true" focusable="true" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[546,225][1067,1083]">"#;
    
    println!("=== 测试1: 提取bounds属性 ===");
    match extract_attribute(node_str, "bounds") {
        Some(bounds_str) => {
            println!("✅ 提取成功: '{}'", bounds_str);
            
            // 测试用例2：解析bounds字符串
            println!("\n=== 测试2: 解析bounds字符串 ===");
            match parse_bounds(&bounds_str) {
                Ok((l, t, r, b)) => {
                    println!("✅ 解析成功: ({}, {}, {}, {})", l, t, r, b);
                    assert_eq!((l, t, r, b), (546, 225, 1067, 1083));
                    println!("✅ 数值匹配正确！");
                }
                Err(e) => {
                    println!("❌ 解析失败: {}", e);
                }
            }
        }
        None => {
            println!("❌ 提取失败");
        }
    }
    
    // 测试用例3：直接解析bounds字符串
    println!("\n=== 测试3: 直接解析 ===");
    let test_str = "[546,225][1067,1083]";
    match parse_bounds(test_str) {
        Ok((l, t, r, b)) => {
            println!("✅ '{}'  → ({}, {}, {}, {})", test_str, l, t, r, b);
        }
        Err(e) => {
            println!("❌ '{}' 解析失败: {}", test_str, e);
        }
    }
}
