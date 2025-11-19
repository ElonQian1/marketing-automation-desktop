use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tracing::info;

// ==================== 数据结构 ====================

/// 联系人数据结构
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Contact {
    pub id: String,
    pub name: String,
    pub phone: String,
    pub email: String,
    pub address: String,
    pub occupation: String,
}

/// VCF导入结果
#[derive(Debug, Serialize, Deserialize)]
pub struct VcfImportResult {
    pub success: bool,
    pub total_contacts: usize,
    pub imported_contacts: usize,
    pub failed_contacts: usize,
    pub message: String,
    pub details: Option<String>,
    pub duration: Option<u64>,
}

// ==================== 工具函数 ====================

/// 生成VCF文件
pub async fn generate_vcf_file(contacts: Vec<Contact>, output_path: &str) -> Result<String> {
    info!("开始生成VCF文件: {}", output_path);

    let mut vcf_content = String::new();

    for contact in &contacts {
        vcf_content.push_str("BEGIN:VCARD\n");
        vcf_content.push_str("VERSION:2.1\n");
        vcf_content.push_str(&format!("FN:{}\n", contact.name));
        vcf_content.push_str(&format!("N:{};;\n", contact.name));

        if !contact.phone.is_empty() {
            // 格式化中国手机号为+86格式
            let formatted_phone = format_chinese_phone(&contact.phone);
            vcf_content.push_str(&format!("TEL;CELL:{}\n", formatted_phone));
            vcf_content.push_str(&format!("TEL;TYPE=CELL:{}\n", formatted_phone));
        }

        if !contact.email.is_empty() {
            vcf_content.push_str(&format!("EMAIL:{}\n", contact.email));
        }

        if !contact.address.is_empty() {
            vcf_content.push_str(&format!("ADR:;;{};;;;\n", contact.address));
        }

        if !contact.occupation.is_empty() {
            vcf_content.push_str(&format!("NOTE:{}\n", contact.occupation));
        }

        vcf_content.push_str("END:VCARD\n");
    }

    // 写入文件
    fs::write(output_path, vcf_content)
        .with_context(|| format!("写入VCF文件失败: {}", output_path))?;

    info!("VCF文件生成完成: {} 个联系人", contacts.len());
    Ok(output_path.to_string())
}

/// 格式化中国手机号为 +86 格式
fn format_chinese_phone(phone: &str) -> String {
    let digits: String = phone.chars().filter(|c| c.is_ascii_digit()).collect();

    if digits.len() == 11 && digits.starts_with('1') {
        format!("+86 {} {} {}", &digits[0..3], &digits[3..7], &digits[7..11])
    } else {
        phone.to_string()
    }
}

/// 将简单的 TXT（每行一个手机号，或 name,phone）转换为 VCF 文件，返回 VCF 路径。
/// - 若输入已是 .vcf 则直接返回。
pub fn ensure_vcf_path(input_path: &str) -> Result<String> {
    let p = Path::new(input_path);
    if let Some(ext) = p.extension() {
        if ext.to_string_lossy().to_lowercase() == "vcf" {
            return Ok(input_path.to_string());
        }
    }

    let content = fs::read_to_string(input_path)?;
    let mut vcf = String::new();
    let mut idx = 1;
    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() { continue; }
        let (name, phone) = if line.contains(',') {
            let mut parts = line.splitn(2, ',');
            let n = parts.next().unwrap_or("").trim();
            let ph = parts.next().unwrap_or("").trim();
            (if n.is_empty() { format!("联系人{}", idx) } else { n.to_string() }, ph.to_string())
        } else {
            (format!("联系人{}", idx), line.to_string())
        };
        vcf.push_str("BEGIN:VCARD\n");
        vcf.push_str("VERSION:2.1\n");
        vcf.push_str(&format!("FN:{}\n", name));
        vcf.push_str(&format!("N:{};\n", name));
        vcf.push_str(&format!("TEL;CELL:{}\n", phone));
        vcf.push_str("END:VCARD\n");
        idx += 1;
    }

    let out = p.with_extension("vcf");
    fs::write(&out, vcf)?;
    Ok(out.to_string_lossy().to_string())
}
