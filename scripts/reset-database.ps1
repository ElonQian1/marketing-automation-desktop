# 数据库重置脚本 - 用于开发阶段清空并重建数据库
# 警告：此操作会删除所有数据！

param(
    [switch]$Confirm = $false,
    [switch]$Backup = $true
)

$ErrorActionPreference = "Stop"

# 数据库路径
$DbPath = Join-Path $PSScriptRoot "..\src-tauri\data\contacts.db"
$BackupDir = Join-Path $PSScriptRoot "..\backups"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  📦 数据库重置脚本" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# 检查数据库是否存在
if (-not (Test-Path $DbPath)) {
    Write-Host "✅ 数据库文件不存在，无需重置" -ForegroundColor Green
    Write-Host "   路径: $DbPath" -ForegroundColor Gray
    exit 0
}

# 显示当前数据库信息
Write-Host "🔍 当前数据库信息:" -ForegroundColor Yellow
Write-Host "   路径: $DbPath" -ForegroundColor Gray
$FileInfo = Get-Item $DbPath
Write-Host "   大小: $([math]::Round($FileInfo.Length / 1KB, 2)) KB" -ForegroundColor Gray
Write-Host "   修改时间: $($FileInfo.LastWriteTime)" -ForegroundColor Gray
Write-Host ""

# 二次确认
if (-not $Confirm) {
    Write-Host "⚠️  警告: 此操作将删除所有数据库数据！" -ForegroundColor Red
    Write-Host ""
    $response = Read-Host "确认要继续吗？(输入 YES 继续)"
    
    if ($response -ne "YES") {
        Write-Host "❌ 操作已取消" -ForegroundColor Yellow
        exit 1
    }
}

# 停止相关进程
Write-Host ""
Write-Host "⏸️  正在停止相关进程..." -ForegroundColor Yellow

try {
    Get-Process | Where-Object { 
        $_.ProcessName -like "*node*" -or 
        $_.ProcessName -like "*employee*" -or
        $_.ProcessName -like "*tauri*"
    } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Start-Sleep -Seconds 2
    Write-Host "✅ 进程已停止" -ForegroundColor Green
} catch {
    Write-Host "⚠️  无法停止某些进程，可能需要手动关闭应用" -ForegroundColor Yellow
}

# 备份数据库
if ($Backup) {
    Write-Host ""
    Write-Host "💾 正在备份数据库..." -ForegroundColor Yellow
    
    # 创建备份目录
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir | Out-Null
    }
    
    # 生成备份文件名（带时间戳）
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $BackupPath = Join-Path $BackupDir "contacts_backup_$Timestamp.db"
    
    try {
        Copy-Item $DbPath $BackupPath -Force
        Write-Host "✅ 备份完成: $BackupPath" -ForegroundColor Green
        Write-Host "   备份大小: $([math]::Round((Get-Item $BackupPath).Length / 1KB, 2)) KB" -ForegroundColor Gray
    } catch {
        Write-Host "❌ 备份失败: $_" -ForegroundColor Red
        Write-Host "   是否继续删除数据库？(输入 YES 继续)" -ForegroundColor Yellow
        $response = Read-Host
        if ($response -ne "YES") {
            Write-Host "❌ 操作已取消" -ForegroundColor Yellow
            exit 1
        }
    }
}

# 删除数据库文件
Write-Host ""
Write-Host "🗑️  正在删除数据库..." -ForegroundColor Yellow

try {
    Remove-Item $DbPath -Force
    Write-Host "✅ 数据库已删除" -ForegroundColor Green
} catch {
    Write-Host "❌ 删除失败: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "可能原因：" -ForegroundColor Yellow
    Write-Host "  1. 数据库文件被其他程序占用" -ForegroundColor Gray
    Write-Host "  2. 权限不足" -ForegroundColor Gray
    Write-Host ""
    Write-Host "建议：" -ForegroundColor Yellow
    Write-Host "  1. 确保所有相关应用已关闭" -ForegroundColor Gray
    Write-Host "  2. 以管理员身份运行此脚本" -ForegroundColor Gray
    exit 1
}

# 清理 WAL 和 SHM 文件
Write-Host ""
Write-Host "🧹 清理临时文件..." -ForegroundColor Yellow

$WalPath = "$DbPath-wal"
$ShmPath = "$DbPath-shm"

if (Test-Path $WalPath) {
    Remove-Item $WalPath -Force -ErrorAction SilentlyContinue
    Write-Host "✅ 已删除 WAL 文件" -ForegroundColor Green
}

if (Test-Path $ShmPath) {
    Remove-Item $ShmPath -Force -ErrorAction SilentlyContinue
    Write-Host "✅ 已删除 SHM 文件" -ForegroundColor Green
}

# 完成
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  ✅ 数据库重置完成！" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "下一步操作：" -ForegroundColor Cyan
Write-Host "  1. 运行应用: npm run tauri dev" -ForegroundColor Gray
Write-Host "  2. 应用启动时会自动创建新的数据库" -ForegroundColor Gray
Write-Host "  3. 新数据库将使用最新的 schema 定义" -ForegroundColor Gray
Write-Host ""

if ($Backup -and (Test-Path $BackupPath)) {
    Write-Host "💾 备份文件位置: $BackupPath" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "🎉 准备好开始全新的数据库体验！" -ForegroundColor Cyan
Write-Host ""
