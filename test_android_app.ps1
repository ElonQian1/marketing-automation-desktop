# Android App 连接诊断脚本
# 用于测试 PC 与 Android Agent App 的 Socket 通信

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Android Agent App 诊断测试" -ForegroundColor Cyan  
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$PORT = 11451
$DEVICE_ID = "e0d909c3"

# Step 1: 设备连接
Write-Host "[Step 1] 检查设备连接..." -ForegroundColor Yellow
$devices = adb devices -l 2>&1 | Out-String
if ($devices -match $DEVICE_ID) {
    Write-Host "  ✅ 设备已连接: $DEVICE_ID" -ForegroundColor Green
} else {
    Write-Host "  ❌ 设备未连接" -ForegroundColor Red
    Write-Host $devices
    exit 1
}

# Step 2: App 安装
Write-Host "[Step 2] 检查 App 安装..." -ForegroundColor Yellow
$pkg = adb -s $DEVICE_ID shell pm list packages com.employee.agent 2>&1 | Out-String
if ($pkg -match "com.employee.agent") {
    Write-Host "  ✅ Employee Agent 已安装" -ForegroundColor Green
} else {
    Write-Host "  ❌ Employee Agent 未安装" -ForegroundColor Red
    exit 1
}

# Step 3: 无障碍服务
Write-Host "[Step 3] 检查无障碍服务..." -ForegroundColor Yellow
$a11y = adb -s $DEVICE_ID shell settings get secure enabled_accessibility_services 2>&1 | Out-String
$a11y = $a11y.Trim()
Write-Host "  当前无障碍服务: $a11y"
if ($a11y -match "com.employee.agent") {
    Write-Host "  ✅ 无障碍服务已开启" -ForegroundColor Green
} else {
    Write-Host "  ❌ 无障碍服务未开启" -ForegroundColor Red
    Write-Host "  请在 设置 → 无障碍 中开启 Employee Agent" -ForegroundColor Yellow
}

# Step 4: 端口转发
Write-Host "[Step 4] 设置端口转发..." -ForegroundColor Yellow
adb -s $DEVICE_ID forward tcp:$PORT tcp:$PORT 2>&1 | Out-Null
$fwdList = adb forward --list 2>&1 | Out-String
if ($fwdList -match "tcp:$PORT") {
    Write-Host "  ✅ 端口转发已设置: tcp:$PORT -> tcp:$PORT" -ForegroundColor Green
} else {
    Write-Host "  ❌ 端口转发失败" -ForegroundColor Red
    exit 1
}

# Step 5: TCP 连接
Write-Host "[Step 5] 测试 TCP 连接..." -ForegroundColor Yellow
try {
    $client = New-Object System.Net.Sockets.TcpClient
    $client.Connect("127.0.0.1", $PORT)
    Write-Host "  ✅ TCP 连接成功" -ForegroundColor Green
} catch {
    Write-Host "  ❌ TCP 连接失败: $_" -ForegroundColor Red
    Write-Host "  Android App 的 Socket 服务可能未启动" -ForegroundColor Yellow
    exit 1
}

# Step 6: 发送 DUMP 命令
Write-Host "[Step 6] 发送 DUMP 命令..." -ForegroundColor Yellow
try {
    $client.ReceiveTimeout = 5000
    $stream = $client.GetStream()
    $writer = New-Object System.IO.StreamWriter($stream)
    $reader = New-Object System.IO.StreamReader($stream)
    
    # 发送命令
    $writer.WriteLine("DUMP")
    $writer.Flush()
    Write-Host "  已发送: DUMP" -ForegroundColor Gray
    
    # 等待响应
    Write-Host "  等待响应 (5秒超时)..." -ForegroundColor Gray
    
    $response = $reader.ReadLine()
    
    if ($response -and $response.Length -gt 0) {
        Write-Host "  ✅ 收到响应: $($response.Length) 字节" -ForegroundColor Green
        
        # 尝试解析 JSON
        try {
            $json = $response | ConvertFrom-Json
            Write-Host "  ✅ JSON 解析成功" -ForegroundColor Green
            Write-Host "  根节点类型: $($json.className)" -ForegroundColor Cyan
        } catch {
            Write-Host "  ⚠️ 不是有效的 JSON" -ForegroundColor Yellow
            Write-Host "  响应内容: $($response.Substring(0, [Math]::Min(200, $response.Length)))..." -ForegroundColor Gray
        }
    } else {
        Write-Host "  ❌ 未收到响应 (空)" -ForegroundColor Red
        Write-Host ""
        Write-Host "  可能的原因:" -ForegroundColor Yellow
        Write-Host "    1. Android App 的 Socket 服务未启动" -ForegroundColor Yellow
        Write-Host "    2. 命令格式不匹配 (期望: DUMP)" -ForegroundColor Yellow
        Write-Host "    3. App 内部处理异常" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  请检查 Android App 端:" -ForegroundColor Cyan
        Write-Host "    - 确认 SocketServer 是否正在监听 $PORT 端口" -ForegroundColor Cyan
        Write-Host "    - 查看 Android Logcat 是否有相关日志" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  ❌ 读取响应失败: $_" -ForegroundColor Red
} finally {
    $client.Close()
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  诊断完成" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
