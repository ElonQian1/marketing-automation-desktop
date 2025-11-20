$files = @(
    "src/exec/v3/helpers/intelligent_analysis.rs",
    "src/exec/v3/helpers/sm_integration.rs",
    "src/exec/v3/helpers/element_hierarchy_analyzer.rs",
    "src/exec/v3/helpers/batch_executor.rs",
    "src/exec/v3/element_matching/bounds_matcher.rs",
    "src/exec/v3/chain_engine.rs",
    "src/engine/xml_indexer.rs",
    "src/domain/structure_runtime_match/click_normalizer.rs",
    "src/engine/strategy_plugin.rs",
    "src/engine/self_anchor/uniqueness_validator.rs",
    "src/commands/run_step_v2/matching/tristate_scorer.rs",
    "src/commands/run_step_v2/mod.rs",
    "src/engine/self_anchor/field_analyzer.rs",
    "src/engine/self_anchor/combination_scorer.rs",
    "src/engine/self_anchor/match_modes.rs",
    "src/engine/self_anchor/relation_seed.rs",
    "src/engine/self_anchor/mod.rs",
    "src/commands/run_step_v2/types/response.rs",
    "src/commands/smart_selection.rs",
    "src/commands/run_step_v2/execution/decision_chain_executor.rs",
    "src/services/intelligent_analysis_service.rs",
    "src/utils/element_deduplicator.rs",
    "src/utils/element_exclusion.rs",
    "src/utils/element_utils/deduplicator.rs",
    "src/utils/element_utils/exclusion_filter.rs",
    "src/matchers/business_filter.rs",
    "src/matchers/three_tier_matcher.rs",
    "src/services/execution/matching/strategies/anchor_by_relation_strategy.rs",
    "src/exec/v3/xpath_evaluator.rs",
    "src/exec/v3/element_matching/multi_candidate_evaluator.rs",
    "src/exec/v3/element_matching/xpath_matcher.rs",
    "src/exec/v3/element_matching/xpath_similarity_matcher.rs",
    "src/exec/v3/helpers/element_matching.rs",
    "src/exec/v3/helpers/step_executor.rs"
)

foreach ($file in $files) {
    $path = "D:\rust\active-projects\小红书\employeeGUI\src-tauri\$file"
    if (Test-Path $path) {
        $content = Get-Content $path -Raw -Encoding UTF8
        
        # Fix import alias
        $newContent = $content -replace "use crate::services::universal_ui_page_analyzer::parse_ui_elements_simple;", "use crate::services::universal_ui_page_analyzer::parse_ui_elements_simple as parse_ui_elements;"
        
        # Fix get_ui_dump
        $newContent = $newContent -replace "get_ui_dump\(", "AdbService::new().dump_ui_hierarchy("
        
        # Fix fields
        $newContent = $newContent -replace "\.clickable", ".is_clickable"
        $newContent = $newContent -replace "\.class", ".class_name"
        
        # Fix Option unwrapping for String fields
        $newContent = $newContent -replace "if let Some\((.+?)\) = &(.+?)\.text \{", "let `$1 = &`$2.text; if !`$1.is_empty() {"
        $newContent = $newContent -replace "if let Some\((.+?)\) = &(.+?)\.content_desc \{", "let `$1 = &`$2.content_desc; if !`$1.is_empty() {"
        
        # Fix Option unwrapping for ElementBounds
        $newContent = $newContent -replace "if let Some\((.+?)\) = &(.+?)\.bounds \{", "let `$1 = &`$2.bounds; {"
        
        if ($content -ne $newContent) {
            Set-Content $path -Value $newContent -Encoding UTF8
            Write-Host "Updated $file"
        }
    } else {
        Write-Host "File not found: $path"
    }
}
