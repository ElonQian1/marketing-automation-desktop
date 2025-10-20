# Git代理切换脚本
# 使用方法: 
# .\scripts\git-proxy-toggle.ps1 on   # 开启代理
# .\scripts\git-proxy-toggle.ps1 off  # 关闭代理

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("on", "off")]
    [string]$Action
)

function Enable-GitProxy {
    Write-Host "🔧 启用Git SSH代理..." -ForegroundColor Green
    git config --global core.sshCommand "ssh -o ProxyCommand='nc -X 5 -x 127.0.0.1:1080 %h %p'"
    Write-Host "✅ Git SSH代理已启用 (SOCKS5: 127.0.0.1:1080)" -ForegroundColor Green
}

function Disable-GitProxy {
    Write-Host "🔧 禁用Git SSH代理..." -ForegroundColor Yellow
    git config --global --unset core.sshCommand
    Write-Host "✅ Git SSH代理已禁用，使用直连" -ForegroundColor Yellow
}

function Test-ProxyConnection {
    Write-Host "🔍 测试代理连接状态..." -ForegroundColor Cyan
    try {
        $result = Test-NetConnection -ComputerName 127.0.0.1 -Port 1080 -WarningAction SilentlyContinue
        if ($result.TcpTestSucceeded) {
            Write-Host "✅ SOCKS5代理 (1080端口) 可用" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ SOCKS5代理 (1080端口) 不可用" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ 无法连接到代理服务器" -ForegroundColor Red
        return $false
    }
}

function Show-CurrentConfig {
    Write-Host "`n📋 当前Git配置状态:" -ForegroundColor Cyan
    $sshCommand = git config --global --get core.sshCommand
    if ($sshCommand) {
        Write-Host "   SSH代理: 已启用" -ForegroundColor Green
        Write-Host "   命令: $sshCommand" -ForegroundColor Gray
    } else {
        Write-Host "   SSH代理: 已禁用 (直连模式)" -ForegroundColor Yellow
    }
}

# 主逻辑
Clear-Host
Write-Host "🚀 Git代理管理工具" -ForegroundColor Magenta
Write-Host "===================" -ForegroundColor Magenta

if ($Action -eq "on") {
    $proxyAvailable = Test-ProxyConnection
    if ($proxyAvailable) {
        Enable-GitProxy
    } else {
        Write-Host "⚠️  代理服务器不可用，请先启动SSR客户端" -ForegroundColor Red
        Write-Host "💡 提示: 确保SSR在127.0.0.1:1080运行" -ForegroundColor Yellow
        exit 1
    }
} elseif ($Action -eq "off") {
    Disable-GitProxy
}

Show-CurrentConfig

Write-Host "`n🔗 测试GitHub连接..." -ForegroundColor Cyan
try {
    $testResult = ssh -T git@github.com 2>&1
    if ($testResult -match "Hi ElonQian1") {
        Write-Host "✅ GitHub SSH连接成功" -ForegroundColor Green
    } else {
        Write-Host "❌ GitHub SSH连接失败" -ForegroundColor Red
        Write-Host "输出: $testResult" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ SSH连接测试失败" -ForegroundColor Red
}

Write-Host "`n✨ 操作完成！" -ForegroundColor Magenta