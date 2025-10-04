# 🔄 强制重新构建和清理缓存
# 用于解决热重载失效问题

Write-Host "🧹 清理 Vite 缓存..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "node_modules\.vite" -ErrorAction SilentlyContinue

Write-Host "🧹 清理 dist 目录..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue

Write-Host "✅ 缓存清理完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📝 接下来请手动执行：" -ForegroundColor Cyan
Write-Host "   1. 按 Ctrl+C 停止当前的 dev 服务器（如果正在运行）" -ForegroundColor White
Write-Host "   2. 运行: npm run tauri dev" -ForegroundColor White
Write-Host "   3. 在应用中按 Ctrl+Shift+R 强制刷新浏览器" -ForegroundColor White
Write-Host ""
Write-Host "🔍 验证方法：" -ForegroundColor Cyan
Write-Host "   查看控制台是否出现以下日志：" -ForegroundColor White
Write-Host "   🔄 [AdbApplicationService] 清除之前的防抖定时器" -ForegroundColor Green
Write-Host "   ⚠️ [AdbApplicationService] 收到空设备列表，等待后续事件确认..." -ForegroundColor Green
