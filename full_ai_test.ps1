# Full AI Test - Complete flow
$port = 11451
$apiKey = "sk-QDhYLPS4UPEmAMNPtysycBLEjOiMef9pgZwtzhXS7nOtQInF"

Write-Host "====== AI Full Test ======" -ForegroundColor Cyan

# 1. Set API Key
Write-Host "[1] Setting API Key..." -ForegroundColor Yellow
try {
    $client = New-Object System.Net.Sockets.TcpClient("127.0.0.1", $port)
    $stream = $client.GetStream()
    $writer = New-Object System.IO.StreamWriter($stream)
    $reader = New-Object System.IO.StreamReader($stream)
    
    $writer.WriteLine("SET_API_KEY:$apiKey")
    $writer.Flush()
    Start-Sleep -Milliseconds 1000
    
    $buffer = New-Object char[] 4096
    $count = $reader.Read($buffer, 0, $buffer.Length)
    Write-Host ([String]::new($buffer, 0, $count)) -ForegroundColor Green
    $client.Close()
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit
}

# 2. Run AI Goal
Write-Host "`n[2] Running AI Goal: Open Xiaohongshu..." -ForegroundColor Yellow
$goal = "click xiaohongshu app icon"

try {
    $client = New-Object System.Net.Sockets.TcpClient("127.0.0.1", $port)
    $client.ReceiveTimeout = 120000
    $stream = $client.GetStream()
    $writer = New-Object System.IO.StreamWriter($stream)
    $reader = New-Object System.IO.StreamReader($stream)
    
    $writer.WriteLine("RUN_AI_GOAL:$goal")
    $writer.Flush()
    
    Write-Host "Waiting for AI execution..." -ForegroundColor Gray
    
    # Read responses
    $allResponse = ""
    $startTime = Get-Date
    $timeout = 90 # seconds
    
    while (((Get-Date) - $startTime).TotalSeconds -lt $timeout) {
        if ($stream.DataAvailable) {
            $buffer = New-Object char[] 65536
            $count = $reader.Read($buffer, 0, $buffer.Length)
            $chunk = [String]::new($buffer, 0, $count)
            $allResponse += $chunk
            Write-Host "Response: $chunk" -ForegroundColor Cyan
            
            if ($chunk.Contains('"status":"completed"') -or $chunk.Contains('"status":"error"')) {
                break
            }
        }
        Start-Sleep -Milliseconds 500
    }
    
    $client.Close()
    
    Write-Host "`n====== Test Complete ======" -ForegroundColor Green
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
