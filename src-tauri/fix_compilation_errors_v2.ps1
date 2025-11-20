
$files = Get-ChildItem -Path "src" -Recurse -Filter "*.rs"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # Fix 1: Bad regex artifacts (element(!.field...))
    $content = $content -replace 'element\(!\.content_desc\.is_empty\(\)\)', '!element.content_desc.is_empty()'
    $content = $content -replace 'element\(!\.text\.is_empty\(\)\)', '!element.text.is_empty()'
    $content = $content -replace 'clicked_element\(!\.text\.is_empty\(\)\)', '!clicked_element.text.is_empty()'
    $content = $content -replace 'clicked_element\(!\.content_desc\.is_empty\(\)\)', '!clicked_element.content_desc.is_empty()'
    
    # Fix 2: Bad regex artifacts (let ref ... if !ref ...)
    # Pattern: let ref var = &obj.field; if !ref var.is_empty() {
    # Replacement: if !obj.field.is_empty() {
    $content = $content -replace 'let ref \w+ = &(\w+\.\w+); if !ref \w+\.is_empty\(\) \{', 'if !$1.is_empty() {'
    
    # Fix 3: Nested let statements (bounds)
    # Pattern: let \w+ = let bounds_str = &element.bounds; \{
    # This is hard to fix with regex perfectly, but let's try to handle common cases.
    # Case A: let click_point = let bounds_str = &element.bounds; { ... }
    # We'll assume we want to use element.bounds directly.
    # For now, let's just comment out these broken blocks or try to simplify them.
    # Actually, if bounds is ElementBounds, we don't need to parse it.
    
    # Fix 4: String methods on Option (when it's actually String)
    # .as_deref().unwrap_or("") -> .as_str() (or just remove if it's String)
    # But wait, if it's String, .as_deref() is invalid.
    # If code is `elem.text.as_deref().unwrap_or("")`, and `text` is String, it should be `elem.text.as_str()` or just `&elem.text`.
    $content = $content -replace '\.text\.as_deref\(\)\.unwrap_or\(""\)', '.text.as_str()'
    $content = $content -replace '\.content_desc\.as_deref\(\)\.unwrap_or\(""\)', '.content_desc.as_str()'
    
    # Fix 5: is_clickable / is_enabled bool usage
    # .is_clickable.unwrap_or(false) -> .is_clickable
    $content = $content -replace '\.is_clickable\.unwrap_or\(false\)', '.is_clickable'
    $content = $content -replace '\.is_enabled\.unwrap_or\(false\)', '.is_enabled'
    
    # Fix 6: is_clickable == Some(true) -> is_clickable
    $content = $content -replace '\.is_clickable == Some\(true\)', '.is_clickable'
    $content = $content -replace '\.is_enabled == Some\(true\)', '.is_enabled'

    # Fix 7: Missing fields renames (based on error log)
    # is_clickable -> clickable (for DetectedElement/InteractiveElement context, NOT UIElement)
    # But be careful not to change UIElement.is_clickable.
    # The error log showed `detected.is_clickable` -> `detected.clickable`.
    # And `element.is_clickable` -> `element.clickable` in `universal_ui_finder\core.rs`.
    # Let's target specific files or patterns if possible.
    
    # Fix 8: Fix `package` field in xml_indexer
    if ($file.Name -eq "xml_indexer.rs") {
        $content = $content -replace 'package,', 'package_name: package,'
        $content = $content -replace 'class: class_name,', 'class_name,'
        $content = $content -replace 'clickable: clickable.and_then\(\|s\| s.parse\(\).ok\(\)\),', 'is_clickable: clickable.and_then(|s| s.parse().ok()).unwrap_or(false),'
        $content = $content -replace 'enabled: enabled.and_then\(\|s\| s.parse\(\).ok\(\)\),', 'is_enabled: enabled.and_then(|s| s.parse().ok()).unwrap_or(false),'
        # Fix text/content_desc unwrapping
        $content = $content -replace 'text,', 'text: text.unwrap_or_default(),'
        $content = $content -replace 'content_desc,', 'content_desc: content_desc.unwrap_or_default(),'
    }

    # Fix 9: Fix strategy_plugin.rs package_name
    if ($file.Name -eq "strategy_plugin.rs") {
        $content = $content -replace 'package_name: clickable_target.package_name.clone\(\)', 'package_name: clickable_target.package_name.clone()'
        # Wait, UIElement has package_name now (I added it). So this should be fine IF I re-run check.
        # But the error was "no field package_name on type &UIElement".
        # Ah, I added it to the struct definition, but maybe I need to update the instantiation in xml_indexer first (which I did in Fix 8).
    }

    # Fix 10: Fix ElementBounds usage in strategy_plugin.rs
    # Self::parse_bounds(&element.bounds.clone()) -> Ok(element.bounds.clone()) (mocking the result structure)
    # The code expects `Result<(i32, i32, i32, i32), ...>`.
    # ElementBounds has left, top, right, bottom.
    # We can replace `Self::parse_bounds(&element.bounds.clone())` with `Ok((element.bounds.left, element.bounds.top, element.bounds.right, element.bounds.bottom))`
    if ($file.Name -eq "strategy_plugin.rs") {
        $content = $content -replace 'Self::parse_bounds\(&(\w+)\.bounds\.clone\(\)\)', 'Ok(($1.bounds.left, $1.bounds.top, $1.bounds.right, $1.bounds.bottom))'
    }

    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated $($file.Name)"
    }
}
