// src-tauri/src/commands/run_step_v2/validation/xml_parser.rs
// module: step-execution | layer: validation | role: XML解析工具
// summary: 提取XML节点属性和边界信息的解析函数

use regex::Regex;

/// 从XML节点字符串中提取指定属性的值
/// 
/// # 参数
/// - `node_str`: XML节点字符串，例如 `<node text="Hello" resource-id="btn_submit" />`
/// - `attr_name`: 属性名，例如 "text", "resource-id", "bounds"
/// 
/// # 返回
/// - `Some(String)`: 属性值
/// - `None`: 属性不存在或解析失败
pub fn parse_xml_attribute(node_str: &str, attr_name: &str) -> Option<String> {
    let pattern = format!(r#"{}="([^"]*)"#, attr_name);
    let regex = Regex::new(&pattern).ok()?;
    regex.captures(node_str)?.get(1).map(|m| m.as_str().to_string())
}

/// 从bounds字符串解析为Bounds结构
/// 
/// # 参数
/// - `bounds_str`: bounds字符串，格式为 "[left,top][right,bottom]"，例如 "[100,200][300,400]"
/// 
/// # 返回
/// - `Ok(Bounds)`: 解析成功的边界
/// - `Err(String)`: 解析失败的错误信息
pub fn parse_bounds_from_string(bounds_str: &str) -> Result<super::super::Bounds, String> {
    // bounds格式: [left,top][right,bottom]
    let bounds_regex = Regex::new(r#"\[(\d+),(\d+)\]\[(\d+),(\d+)\]"#).unwrap();
    if let Some(caps) = bounds_regex.captures(bounds_str) {
        Ok(super::super::Bounds {
            left: caps[1].parse().unwrap_or(0),
            top: caps[2].parse().unwrap_or(0),
            right: caps[3].parse().unwrap_or(100),
            bottom: caps[4].parse().unwrap_or(100),
        })
    } else {
        Err(format!("无法解析bounds: {}", bounds_str))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_xml_attribute() {
        let node = r#"<node text="Hello" resource-id="btn_submit" class="Button" />"#;
        
        assert_eq!(parse_xml_attribute(node, "text"), Some("Hello".to_string()));
        assert_eq!(parse_xml_attribute(node, "resource-id"), Some("btn_submit".to_string()));
        assert_eq!(parse_xml_attribute(node, "class"), Some("Button".to_string()));
        assert_eq!(parse_xml_attribute(node, "nonexistent"), None);
    }

    #[test]
    fn test_parse_bounds_from_string() {
        let bounds_str = "[100,200][300,400]";
        let result = parse_bounds_from_string(bounds_str).unwrap();
        
        assert_eq!(result.left, 100);
        assert_eq!(result.top, 200);
        assert_eq!(result.right, 300);
        assert_eq!(result.bottom, 400);
    }
}
