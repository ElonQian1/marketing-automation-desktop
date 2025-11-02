# Visual-Preview Module Refactoring Script
$ErrorActionPreference = "Stop"
$baseDir = "D:\rust\active-projects\小红书\employeeGUI\src\modules\structural-matching\ui\components\visual-preview"

Write-Host "Starting Visual-Preview module refactoring..." -ForegroundColor Green

# Copy debug helper to utils
$debugHelperSource = Join-Path $baseDir "floating-window\utils\crop-debug-helper.ts"
$debugHelperDest = Join-Path $baseDir "utils\structural-matching-debug-helper.ts"

if (Test-Path $debugHelperSource) {
    Copy-Item $debugHelperSource $debugHelperDest -Force
    Write-Host "Copied: crop-debug-helper.ts" -ForegroundColor Green
}

Write-Host "Phase completed!" -ForegroundColor Cyan
