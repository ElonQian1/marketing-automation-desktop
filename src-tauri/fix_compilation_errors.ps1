
$files = Get-ChildItem -Path "src" -Recurse -Filter "*.rs"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # 1. Fix double renames
    $content = $content -replace '\.class_name_name', '.class_name'
    $content = $content -replace '\.is_clickable_parent', '.clickable_parent'
    $content = $content -replace '\.is_clickable_score', '.clickable_score'

    # 2. Fix field names (careful with regex)
    # .clickable -> .is_clickable (avoid is_clickable)
    $content = $content -replace '(?<!is_)\.clickable', '.is_clickable'
    # .class -> .class_name (avoid class_name, class_chain)
    $content = $content -replace '\.class(?![_a-zA-Z])', '.class_name'
    # .package -> .package_name (avoid package_name)
    $content = $content -replace '\.package(?![_a-zA-Z])', '.package_name'
    # .enabled -> .is_enabled (avoid is_enabled)
    $content = $content -replace '(?<!is_)\.enabled', '.is_enabled'

    # 3. Fix Option unwrapping for bools
    $content = $content -replace '\.is_clickable\.unwrap_or\(false\)', '.is_clickable'
    $content = $content -replace '\.is_enabled\.unwrap_or\(false\)', '.is_enabled'
    $content = $content -replace '\.is_clickable\.unwrap_or_default\(\)', '.is_clickable'
    
    # 4. Fix Option unwrapping for bounds
    $content = $content -replace '\.bounds\.unwrap_or_default\(\)', '.bounds'
    $content = $content -replace '\.bounds\.as_ref\(\)', '.bounds'
    $content = $content -replace '\.bounds\.as_deref\(\)', '.bounds'
    $content = $content -replace '\.bounds\.clone\(\)\.unwrap_or_default\(\)', '.bounds.clone()'

    # 5. Fix Text/Desc comparisons
    # .text.as_ref() == Some(val) -> .text == val
    # We need to handle potential & references.
    # Simple case: .text.as_ref() == Some(x)
    $content = $content -replace '\.text\.as_ref\(\)\s*==\s*Some\(([^)]+)\)', '.text == $1'
    $content = $content -replace '\.content_desc\.as_ref\(\)\s*==\s*Some\(([^)]+)\)', '.content_desc == $1'
    $content = $content -replace '\.text\.as_deref\(\)\s*==\s*Some\(([^)]+)\)', '.text == $1'
    $content = $content -replace '\.content_desc\.as_deref\(\)\s*==\s*Some\(([^)]+)\)', '.content_desc == $1'

    # 6. Fix if let Some(...) = ...text
    # This is tricky with regex. I'll try a few common patterns.
    
    # if let Some(text) = &elem.text { -> let text = &elem.text; if !text.is_empty() {
    $content = $content -replace 'if let Some\(([^)]+)\) = &?([a-zA-Z0-9_.]+)\.text \{', 'let $1 = &$2.text; if !$1.is_empty() {'
    
    # if let Some(desc) = &elem.content_desc { -> let desc = &elem.content_desc; if !desc.is_empty() {
    $content = $content -replace 'if let Some\(([^)]+)\) = &?([a-zA-Z0-9_.]+)\.content_desc \{', 'let $1 = &$2.content_desc; if !$1.is_empty() {'

    # if let Some(bounds) = &elem.bounds { -> let bounds = &elem.bounds; {
    $content = $content -replace 'if let Some\(([^)]+)\) = &?([a-zA-Z0-9_.]+)\.bounds \{', 'let $1 = &$2.bounds; {'

    # if let Some(c) = elem.is_clickable { -> let c = elem.is_clickable; {
    $content = $content -replace 'if let Some\(([^)]+)\) = &?([a-zA-Z0-9_.]+)\.is_clickable \{', 'let $1 = $2.is_clickable; {'

    # 7. Fix .text.is_some() -> !.text.is_empty()
    $content = $content -replace '\.text\.is_some\(\)', '(!.text.is_empty())'
    $content = $content -replace '\.content_desc\.is_some\(\)', '(!.content_desc.is_empty())'

    # 8. Fix .text.clone().or_else(...)
    # This is specific to intelligent_analysis_service.rs
    # let element_text = elem.text.clone().or_else(|| elem.content_desc.clone());
    # -> let element_text = if !elem.text.is_empty() { Some(elem.text.clone()) } else { Some(elem.content_desc.clone()) };
    # Actually, if it expects Option<String>, we can do:
    # let element_text = if !elem.text.is_empty() { Some(elem.text.clone()) } else if !elem.content_desc.is_empty() { Some(elem.content_desc.clone()) } else { None };
    # But maybe simpler:
    # let element_text = if !elem.text.is_empty() { elem.text.clone() } else { elem.content_desc.clone() }; (if it expects String)
    
    # 9. Fix specific file: src/services/contact_automation.rs
    if ($file.Name -eq "contact_automation.rs") {
        $content = $content -replace 'use crate::services::huawei_enhanced_importer::\{HuaweiEmuiEnhancedStrategy, ImportExecutionResult\};', '// use crate::services::huawei_enhanced_importer::{HuaweiEmuiEnhancedStrategy, ImportExecutionResult};'
        $content = $content -replace 'let strategy = HuaweiEmuiEnhancedStrategy::new\(device_id, adb_path\);', '// let strategy = HuaweiEmuiEnhancedStrategy::new(device_id, adb_path);'
        $content = $content -replace 'strategy.execute\(\).await', 'Err("HuaweiEmuiEnhancedStrategy not implemented".to_string())'
        $content = $content -replace '-> Result<ImportExecutionResult, String>', '-> Result<(), String>'
    }

    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        Write-Host "Updated $($file.Name)"
    }
}
