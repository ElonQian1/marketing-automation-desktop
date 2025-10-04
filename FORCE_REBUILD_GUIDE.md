# 🔄 强制重新构建指南

**问题**: 代码已修改但浏览器使用旧缓存，防抖动逻辑未生效

## 🚀 解决方法

### 方法1：完全重启（推荐）

```powershell
# 1. 停止当前的 dev 服务器（Ctrl+C）

# 2. 清理构建缓存
Remove-Item -Recurse -Force node_modules/.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

# 3. 重新启动
npm run tauri dev
```

### 方法2：浏览器硬刷新

在应用窗口中：
- **Windows**: `Ctrl + Shift + R` 或 `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

### 方法3：清理 Tauri 缓存

```powershell
# 停止应用
# 然后运行：
npm run tauri build -- --debug
```

## 🔍 验证修复是否生效

重启后，查看控制台日志，应该看到：

```
✅ 正确的日志（修复生效）：
📱 [AdbApplicationService] 收到设备变化回调: {deviceCount: 0}
🔄 [AdbApplicationService] 清除之前的防抖定时器  ← ✅ 新日志
⚠️ [AdbApplicationService] 收到空设备列表，等待后续事件确认...  ← ✅ 新日志
```

```
❌ 错误的日志（旧缓存）：
📱 [AdbApplicationService] 收到设备变化回调: {deviceCount: 0}
🔄 [adbStore] setDevices 被调用  ← 没有防抖动日志，直接更新
```

## 📋 检查清单

- [ ] 停止 dev 服务器
- [ ] 删除 `node_modules/.vite` 缓存
- [ ] 重新启动 `npm run tauri dev`
- [ ] 在浏览器中按 `Ctrl + Shift + R`
- [ ] 检查控制台日志是否出现防抖动日志
- [ ] 测试设备插拔是否自动更新

## 🐛 如果还是不行

检查文件是否真的保存了：

```powershell
# 查看类成员变量
Select-String -Path "src\application\services\AdbApplicationService.ts" -Pattern "private debounceTimer"

# 应该看到：
# private debounceTimer: NodeJS.Timeout | null = null;
# private lastDeviceCount: number = 0;
```

## 💡 热重载问题说明

Vite/Tauri 的热重载有时会失效，特别是：
- 修改类成员变量
- 修改构造函数
- 修改私有方法

**解决方案**: 完全重启 dev 服务器

---

**操作步骤**：
1. 按 `Ctrl+C` 停止当前的 dev 服务器
2. 运行清理命令（见上方）
3. 重新启动 `npm run tauri dev`
4. 测试设备插拔，观察日志
