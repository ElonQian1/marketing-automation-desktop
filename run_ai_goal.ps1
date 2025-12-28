# Run AI Goal and monitor logs
param([string]$goal = "tap douyin icon")

$port = 11451
$apiKey = "sk-QDhYLPS4UPEmAMNPtysycBLEjOiMef9pgZwtzhXS7nOtQInF"
$adb = ".\platform-tools\adb.exe"

Write-Host "====== AI Goal Execution Test ======" -ForegroundColor Cyan
Write-Host "Goal: $goal" -ForegroundColor Yellow

# Ensure API key is set
try {
    $client = New-Object System.Net.Sockets.TcpClient("127.0.0.1", $port)
    $stream = $client.GetStream()
    $writer = New-Object System.IO.StreamWriter($stream)
    $reader = New-Object System.IO.StreamReader($stream)
    $writer.WriteLine("SET_API_KEY:$apiKey")
    $writer.Flush()
    Start-Sleep -Milliseconds 500
    $buffer = New-Object char[] 4096
    $count = $reader.Read($buffer, 0, $buffer.Length)
    Write-Host "[1] API Key: OK" -ForegroundColor Green
    $client.Close()
} catch {
    Write-Host "Error setting API key: $_" -ForegroundColor Red
    exit
}

Start-Sleep -Seconds 1

# Send goal
Write-Host "[2] Sending goal..." -ForegroundColor Yellow
try {
    $client = New-Object System.Net.Sockets.TcpClient("127.0.0.1", $port)
    $client.ReceiveTimeout = 120000
    $stream = $client.GetStream()
    $writer = New-Object System.IO.StreamWriter($stream)
    $reader = New-Object System.IO.StreamReader($stream)
    
    $writer.WriteLine("RUN_AI_GOAL:$goal")
    $writer.Flush()
    
    # Read start response
    Start-Sleep -Milliseconds 500
    $buffer = New-Object char[] 4096
    $count = $reader.Read($buffer, 0, $buffer.Length)
    Write-Host ([String]::new($buffer, 0, $count)) -ForegroundColor Cyan
    
    $client.Close()
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit
}

# Wait for execution and monitor logs
Write-Host "`n[3] Monitoring execution (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Get logs
Write-Host "`n====== AI Execution Logs ======" -ForegroundColor Magenta
& $adb logcat -d | Select-String "AIAutonomousEngine" | Select-Object -Last 20

# Check current activity
Write-Host "`n====== Current Activity ======" -ForegroundColor Magenta
& $adb shell "dumpsys activity activities | grep -E 'mResumedActivity'"

Write-Host "`n====== Test Complete ======" -ForegroundColor Green
