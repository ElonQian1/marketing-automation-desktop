# Simple AI test - no emoji
$port = 11451
$goal = "dakai xiaohongshu"

Write-Host "Goal: $goal"

try {
    $client = New-Object System.Net.Sockets.TcpClient("127.0.0.1", $port)
    $client.ReceiveTimeout = 180000
    $stream = $client.GetStream()
    $stream.ReadTimeout = 180000
    $writer = New-Object System.IO.StreamWriter($stream)
    $reader = New-Object System.IO.StreamReader($stream)
    
    $writer.WriteLine("RUN_AI_GOAL:$goal")
    $writer.Flush()
    
    Write-Host "Waiting for AI..."
    
    try {
        while ($true) {
            $line = $reader.ReadLine()
            if ($null -eq $line) { break }
            Write-Host "Response: $line"
            
            if ($line.Contains('"status":"completed"') -or $line.Contains('"status":"error"')) {
                Write-Host "Done"
                break
            }
        }
    } catch {
        Write-Host "Read ended: $_"
    }
    
    $client.Close()
    
} catch {
    Write-Host "Error: $_"
}
