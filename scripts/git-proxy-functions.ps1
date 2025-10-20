# Git代理快速管理命令
# 将这些添加到你的PowerShell配置文件中: $PROFILE

function Enable-GitProxy {
    <#
    .SYNOPSIS
    启用Git SSH SOCKS5代理
    .DESCRIPTION
    为Git配置SOCKS5代理，用于网络环境受限的情况
    #>
    git config --global core.sshCommand "ssh -o ProxyCommand='nc -X 5 -x 127.0.0.1:1080 %h %p'"
    Write-Host "✅ Git SSH代理已启用 (127.0.0.1:1080)" -ForegroundColor Green
}

function Disable-GitProxy {
    <#
    .SYNOPSIS
    禁用Git SSH代理
    .DESCRIPTION
    移除Git SSH代理配置，恢复直连模式
    #>
    git config --global --unset core.sshCommand
    Write-Host "✅ Git SSH代理已禁用，使用直连" -ForegroundColor Yellow
}

function Test-GitConnection {
    <#
    .SYNOPSIS
    测试Git连接状态
    .DESCRIPTION
    检查当前Git配置下的GitHub连接状态
    #>
    Write-Host "🔍 测试GitHub连接..." -ForegroundColor Cyan
    
    # 检查当前代理配置
    $sshCommand = git config --global --get core.sshCommand
    if ($sshCommand) {
        Write-Host "📡 当前使用代理: $sshCommand" -ForegroundColor Blue
        
        # 检查代理是否可用
        $proxyTest = Test-NetConnection -ComputerName 127.0.0.1 -Port 1080 -WarningAction SilentlyContinue
        if (-not $proxyTest.TcpTestSucceeded) {
            Write-Host "❌ 代理服务器不可用 (127.0.0.1:1080)" -ForegroundColor Red
            return
        }
    } else {
        Write-Host "🔗 当前使用直连模式" -ForegroundColor Blue
    }
    
    # 测试SSH连接
    try {
        $result = ssh -T git@github.com 2>&1
        if ($result -match "Hi ElonQian1") {
            Write-Host "✅ GitHub SSH连接成功" -ForegroundColor Green
        } else {
            Write-Host "❌ GitHub SSH连接失败" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ SSH连接测试失败" -ForegroundColor Red
    }
}

# 创建简短别名
Set-Alias -Name gproxy-on -Value Enable-GitProxy
Set-Alias -Name gproxy-off -Value Disable-GitProxy  
Set-Alias -Name gtest -Value Test-GitConnection

Write-Host "🚀 Git代理管理命令已加载:" -ForegroundColor Magenta
Write-Host "   gproxy-on   # 启用代理" -ForegroundColor Green
Write-Host "   gproxy-off  # 禁用代理" -ForegroundColor Yellow
Write-Host "   gtest       # 测试连接" -ForegroundColor Cyan