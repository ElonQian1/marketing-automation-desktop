# 设备监听模块化重构 - 快速验证脚本

## 🚀 一键验证（推荐）

将以下内容保存为 `verify-device-watching.ps1`，然后在 PowerShell 中运行：

```powershell
# 停止所有 Node 进程
Write-Host "🛑 停止开发服务器..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

# 等待进程完全退出
Start-Sleep -Seconds 2

# 清理缓存
Write-Host "🧹 清理缓存..." -ForegroundColor Yellow
$projectRoot = "d:\rust\active-projects\小红书\employeeGUI"
cd $projectRoot

Remove-Item -Path "node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "✅ 缓存清理完成" -ForegroundColor Green

# 重新启动
Write-Host "🚀 重新启动开发服务器..." -ForegroundColor Yellow
Write-Host ""
Write-Host "👀 请观察日志，应该看到：" -ForegroundColor Cyan
Write-Host "   - [DeviceWatchingService] ⏱️ 使用防抖策略 (300ms/500ms)" -ForegroundColor Gray
Write-Host "   - [DeviceWatchingService] ✅ 设备监听已启动，策略: debounce" -ForegroundColor Gray
Write-Host ""

# 启动并过滤日志
npm run tauri dev 2>&1 | Select-String -Pattern "DeviceWatchingService|DebounceStrategy|设备监听服务"
```

---

## 📋 分步验证（详细）

### 步骤 1: 停止开发服务器

```powershell
# 方法 1: 快捷键
# 在运行 npm run tauri dev 的终端按 Ctrl+C

# 方法 2: 强制停止所有 Node 进程
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
```

### 步骤 2: 清理缓存

```powershell
cd "d:\rust\active-projects\小红书\employeeGUI"

# 清理 Vite 缓存
Remove-Item -Path "node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue

# 清理构建产物
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "✅ 缓存清理完成" -ForegroundColor Green
```

### 步骤 3: 重新启动

```powershell
npm run tauri dev
```

### 步骤 4: 检查启动日志

**期望看到**：
```
✅ [useAdb] ADB服务已初始化
🎯 [AdbApplicationService] 开始启动设备监听服务...
[DeviceWatchingService] ⏱️ 使用防抖策略 (300ms/500ms)
[DeviceWatchingService] 🔄 启动设备监听...
[DeviceWatchingService] ✅ 设备监听已启动，策略: debounce
```

**不应该看到**（旧日志）：
```
❌ AdbApplicationService.ts?t=1759567462958:435 📱 [AdbApplicationService] 收到设备变化回调
❌ AdbApplicationService.ts?t=1759567462958:441 🔄 [AdbApplicationService] 清除之前的防抖定时器
```

### 步骤 5: 测试自动设备检测

1. 打开"联系人导入向导"页面
2. 插入 USB 设备
3. 观察控制台日志：

**期望日志**：
```
📱 [RealTimeDeviceRepository] 检测到设备变化: {deviceCount: 1, callbackCount: 1}
[DeviceWatchingService] 📡 收到设备变化事件: {deviceCount: 1, strategy: 'debounce'}
[DebounceStrategy] ⏱️ 普通设备变化，延迟 300ms 更新
[DebounceStrategy] ✅ 延迟结束，执行更新: {deviceCount: 1}
✅ [AdbApplicationService] 更新设备到 store: {deviceCount: 1, deviceIds: ['...']}
```

4. 设备列表应在 **1-2 秒内自动更新** ✅

### 步骤 6: 测试手动刷新按钮

1. 在同一页面点击"刷新设备列表"按钮
2. 设备列表应**立即刷新** ✅
3. 快速点击多次，测试防重入保护

---

## 🔍 日志过滤技巧

### 只看关键日志

```powershell
# 启动并过滤设备监听相关日志
npm run tauri dev 2>&1 | Select-String -Pattern "DeviceWatchingService|DebounceStrategy|设备监听"

# 只看设备变化事件
npm run tauri dev 2>&1 | Select-String -Pattern "设备变化|DevicesChanged|收到设备"

# 只看 useAdb 初始化
npm run tauri dev 2>&1 | Select-String -Pattern "\[useAdb\]|ADB服务"
```

### 实时监控设备事件

```powershell
# 在新终端执行，实时查看设备相关日志
npm run tauri dev 2>&1 | Select-String -Pattern "📱|🔄|✅|⏱️" | ForEach-Object {
  Write-Host $_.Line -ForegroundColor Cyan
}
```

---

## ✅ 验证通过标准

### 必须满足
- [ ] 启动日志包含 `[DeviceWatchingService]`
- [ ] 启动日志包含 `策略: debounce`
- [ ] 设备插拔自动更新（1-2 秒内）
- [ ] 设备拔出自动清空（500ms 后）
- [ ] 手动刷新按钮有效
- [ ] 无 TypeScript 编译错误
- [ ] 无控制台运行时错误

### 加分项
- [ ] 日志清晰易读
- [ ] 防抖逻辑正常（300ms/500ms）
- [ ] 空列表确认机制生效
- [ ] 性能流畅，无卡顿
- [ ] 快速点击刷新按钮不会重复调用

---

## 🐛 常见问题排查

### Q1: 还是看到旧日志？

**症状**：
```
AdbApplicationService.ts?t=1759567462958:435 📱 [AdbApplicationService] 收到设备变化回调
```

**原因**：
- 缓存未清理干净
- 浏览器缓存未刷新

**解决方案**：
```powershell
# 完全清理
Remove-Item -Path "node_modules\.vite" -Recurse -Force
Remove-Item -Path "dist" -Recurse -Force
Remove-Item -Path "src-tauri\target\debug" -Recurse -Force

# 重新启动
npm run tauri dev
```

### Q2: 设备还是不自动刷新？

**检查清单**：
- [ ] 是否在"联系人导入向导"页面？
- [ ] 控制台是否有 `[DeviceWatchingService]` 日志？
- [ ] 是否有错误日志？
- [ ] `useAdb()` Hook 是否被调用？

**调试命令**：
```powershell
# 查看详细日志
npm run tauri dev 2>&1 | Select-String -Pattern "useAdb|DeviceWatching|RealTimeDevice" | Select-Object -First 50
```

### Q3: TypeScript 类型错误？

**检查命令**：
```powershell
cd "d:\rust\active-projects\小红书\employeeGUI"
npm run type-check
```

**常见错误**：
- `Cannot find module 'device-watching'` → 检查 `index.ts` 导出
- `Property 'deviceWatchingService' does not exist` → 重新启动 TypeScript 服务器

---

## 📊 架构验证

### 检查文件结构

```powershell
# 验证新模块是否存在
Test-Path "src\application\services\device-watching\DeviceWatchingService.ts"
Test-Path "src\application\services\device-watching\strategies\IDeviceUpdateStrategy.ts"
Test-Path "src\application\services\device-watching\strategies\DebounceUpdateStrategy.ts"
Test-Path "src\application\services\device-watching\strategies\ImmediateUpdateStrategy.ts"
Test-Path "src\application\services\device-watching\index.ts"
```

**期望结果**：所有路径返回 `True`

### 检查代码行数

```powershell
# 检查 AdbApplicationService.ts 行数（应该小于 870）
(Get-Content "src\application\services\AdbApplicationService.ts").Count

# 检查新模块总行数
(Get-Content "src\application\services\device-watching\*.ts" -Recurse).Count
```

---

## 📚 相关文档

- [设备监听模块化重构报告](./DEVICE_WATCHING_MODULAR_REFACTOR_REPORT.md)
- [设备自动检测 + 模块化架构完整报告](./DEVICE_AUTO_DETECTION_AND_MODULAR_ARCHITECTURE_REPORT.md)
- [ADB 架构统一报告](./ADB_ARCHITECTURE_UNIFICATION_REPORT.md)

---

**准备好验证了吗？执行上面的步骤，验证新架构是否生效！** 🚀
