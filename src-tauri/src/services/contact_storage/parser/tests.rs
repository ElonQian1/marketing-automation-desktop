/// 集成测试：验证增强后的解析器
/// 
/// 测试文件：包含无效号码_30个混合.txt

#[cfg(test)]
mod integration_tests {
    use crate::services::contact_storage::parser::extract_numbers_from_text;
    
    #[test]
    fn test_parse_mixed_invalid_file() {
        let content = r#"invalid_number_1
invalid_number_2
invalid_number_3
13800
138001380011111
abc123def456
+86138001380xx
138-0013-8001
(138)0013-8001
not_a_phone_number
13800138@01
138.001.38001
empty_line_below

138001380
1380013800111111111
短号码123
特殊字符#$%
international+1234567890
格式错误138-001-380-01
带空格的 138 0013 8001
emoji号码😀13800138001
中文号码一三八
13800138001有效号码1
13800138002有效号码2
13800138003有效号码3
无效的空行


带tab的	13800138004
换行符有问题的
13800138005"#;
        
        let result = extract_numbers_from_text(content);
        
        // 预期结果：5个唯一号码（去重后）
        // 13800138001, 13800138002, 13800138003, 13800138004, 13800138005
        assert_eq!(result.contacts.len(), 5, 
            "应该解析出5个唯一号码，实际解析出: {:?}", 
            result.contacts.iter().map(|(phone, _)| phone).collect::<Vec<_>>()
        );
        
        let phones: Vec<String> = result.contacts.iter()
            .map(|(phone, _)| phone.clone())
            .collect();
        
        assert!(phones.contains(&"13800138001".to_string()));
        assert!(phones.contains(&"13800138002".to_string()));
        assert!(phones.contains(&"13800138003".to_string()));
        assert!(phones.contains(&"13800138004".to_string()));
        assert!(phones.contains(&"13800138005".to_string()));
        
        println!("✅ 成功解析 {} 个号码:", result.contacts.len());
        for (i, (phone, name)) in result.contacts.iter().enumerate() {
            println!("  {}. {} {}", i+1, phone, name);
        }
    }
    
    #[test]
    fn test_parse_formatted_numbers() {
        // 测试各种格式化号码
        let cases = vec![
            ("138-0013-8001", "13800138001"),
            ("(138)0013-8001", "13800138001"),
            ("138.001.38001", "13800138001"),
            ("带空格的 138 0013 8001", "13800138001"),
            ("emoji号码😀13800138001", "13800138001"),
            ("13800138001有效号码1", "13800138001"),
            ("带tab的\t13800138004", "13800138004"),
        ];
        
        for (input, expected) in cases {
            let result = extract_numbers_from_text(input);
            assert!(result.contacts.len() >= 1, 
                "输入 '{}' 应该至少解析出1个号码，实际: {}", 
                input, result.contacts.len()
            );
            assert_eq!(result.contacts[0].0, expected,
                "输入 '{}' 应该解析出 '{}'，实际: '{}'",
                input, expected, result.contacts[0].0
            );
        }
    }
}
