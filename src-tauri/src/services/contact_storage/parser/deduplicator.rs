/// 联系人去重模块
/// 
/// 提供多种去重策略

use std::collections::HashSet;
use super::types::ParsedContact;

/// 按号码去重（保留第一次出现）
/// 
/// 同一号码多次出现时，保留第一个（包括姓名）
pub fn deduplicate_by_phone(contacts: Vec<ParsedContact>) -> Vec<ParsedContact> {
    let mut seen = HashSet::new();
    let mut result = Vec::new();
    
    for (phone, name) in contacts {
        if seen.insert(phone.clone()) {
            result.push((phone, name));
        }
    }
    
    result
}

/// 严格去重：号码和姓名都相同才算重复
pub fn deduplicate_strict(contacts: Vec<ParsedContact>) -> Vec<ParsedContact> {
    let mut seen = HashSet::new();
    let mut result = Vec::new();
    
    for contact in contacts {
        if seen.insert(contact.clone()) {
            result.push(contact);
        }
    }
    
    result
}

/// 智能合并：相同号码的不同姓名合并为一个
/// 
/// 策略：保留最长的姓名，或第一个非空姓名
pub fn deduplicate_merge(contacts: Vec<ParsedContact>) -> Vec<ParsedContact> {
    let mut phone_to_names: std::collections::HashMap<String, Vec<String>> = std::collections::HashMap::new();
    
    for (phone, name) in contacts {
        phone_to_names.entry(phone).or_insert_with(Vec::new).push(name);
    }
    
    phone_to_names
        .into_iter()
        .map(|(phone, names)| {
            // 选择最长的非空姓名
            let best_name = names
                .iter()
                .filter(|n| !n.is_empty())
                .max_by_key(|n| n.len())
                .cloned()
                .unwrap_or_else(|| names.first().cloned().unwrap_or_default());
            
            (phone, best_name)
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_deduplicate_by_phone() {
        let contacts = vec![
            ("13912345678".to_string(), "张三".to_string()),
            ("13912345678".to_string(), "张三丰".to_string()),
            ("15800158001".to_string(), "李四".to_string()),
        ];
        
        let result = deduplicate_by_phone(contacts);
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].1, "张三"); // 保留第一个
    }
    
    #[test]
    fn test_deduplicate_merge() {
        let contacts = vec![
            ("13912345678".to_string(), "张".to_string()),
            ("13912345678".to_string(), "张三丰".to_string()),
            ("15800158001".to_string(), "李四".to_string()),
        ];
        
        let result = deduplicate_merge(contacts);
        assert_eq!(result.len(), 2);
        
        // 找到合并后的张三丰
        let zhang = result.iter().find(|(p, _)| p == "13912345678").unwrap();
        assert_eq!(zhang.1, "张三丰"); // 保留最长的姓名
    }
}
