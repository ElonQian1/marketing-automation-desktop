# 服务器部署脚本
# 使用 cargo-zigbuild 交叉编译到 Linux，然后 SCP 上传

param(
    [string]$ServerIP = "119.91.19.232",
    [string]$ServerUser = "ubuntu",
    [string]$RemotePath = "/opt/lead-server"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Lead Server 部署脚本 ===" -ForegroundColor Cyan

# 1. 检查依赖
Write-Host "`n[1/5] 检查依赖..." -ForegroundColor Yellow
if (-not (Get-Command cargo-zigbuild -ErrorAction SilentlyContinue)) {
    Write-Host "安装 cargo-zigbuild..." -ForegroundColor Gray
    cargo install cargo-zigbuild
}

if (-not (Get-Command zig -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 请先安装 Zig (winget install zig.zig)" -ForegroundColor Red
    exit 1
}

# 2. 添加 Linux target
Write-Host "`n[2/5] 添加 Linux target..." -ForegroundColor Yellow
rustup target add x86_64-unknown-linux-gnu

# 3. 交叉编译
Write-Host "`n[3/5] 交叉编译 Linux 版本..." -ForegroundColor Yellow
Set-Location $PSScriptRoot
cargo zigbuild --release --target x86_64-unknown-linux-gnu

if ($LASTEXITCODE -ne 0) {
    Write-Host "编译失败!" -ForegroundColor Red
    exit 1
}

$BinaryPath = "..\target\x86_64-unknown-linux-gnu\release\lead-server"
if (-not (Test-Path $BinaryPath)) {
    Write-Host "找不到编译产物: $BinaryPath" -ForegroundColor Red
    exit 1
}

Write-Host "编译成功: $BinaryPath" -ForegroundColor Green

# 4. 上传到服务器
Write-Host "`n[4/5] 上传到服务器 $ServerUser@$ServerIP..." -ForegroundColor Yellow

# 创建远程目录
ssh "${ServerUser}@${ServerIP}" "sudo mkdir -p $RemotePath && sudo chown $ServerUser $RemotePath"

# 上传二进制文件
scp $BinaryPath "${ServerUser}@${ServerIP}:${RemotePath}/lead-server"

# 上传 .env.example
scp "$PSScriptRoot\.env.example" "${ServerUser}@${ServerIP}:${RemotePath}/.env.example"

Write-Host "上传完成!" -ForegroundColor Green

# 5. 重启服务
Write-Host "`n[5/5] 重启服务..." -ForegroundColor Yellow
ssh "${ServerUser}@${ServerIP}" @"
cd $RemotePath
chmod +x lead-server
# 如果 .env 不存在，复制示例
[ ! -f .env ] && cp .env.example .env
# 尝试重启 systemd 服务（如果存在）
sudo systemctl restart lead-server 2>/dev/null || echo '请手动启动: ./lead-server'
"@

Write-Host "`n=== 部署完成! ===" -ForegroundColor Cyan
Write-Host "服务器地址: http://${ServerIP}:8080" -ForegroundColor White
Write-Host "健康检查: http://${ServerIP}:8080/health" -ForegroundColor White
