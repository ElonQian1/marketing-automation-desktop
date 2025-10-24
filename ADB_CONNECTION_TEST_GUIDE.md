# ADB 设备连接和 UI Dump 测试脚本

## 当前问题

设备在测试过程中**断开连接（offline）**，导致 UI dump 失败。

## 快速诊断步骤

### 1. 检查设备连接

```powershell
# 使用项目中的 ADB
d:\开发\marketing-automation-desktop\platform-tools\adb.exe devices -l
```

**预期输出**（正常）：
```
List of devices attached
ABJK022823000280       device product:zeus model:MI_12_Pro device:zeus transport_id:1
```

**当前输出**（异常）：
```
List of devices attached
# 空的 - 没有设备
```

---

### 2. 重新连接设备

#### 方法 A：重新插拔 USB 线

1. **拔掉 USB 线**
2. 等待 5 秒
3. **重新插入 USB 线**
4. **在设备上确认** USB 调试授权（如果弹出）
5. 重新执行检查命令

#### 方法 B：重启 ADB 服务

```powershell
# 停止 ADB 服务
d:\开发\marketing-automation-desktop\platform-tools\adb.exe kill-server

# 等待 2 秒

# 重新启动（会自动启动）
d:\开发\marketing-automation-desktop\platform-tools\adb.exe devices
```

#### 方法 C：重启设备 USB 调试

在设备上：
1. 进入「开发者选项」
2. **关闭** USB 调试
3. 等待 3 秒
4. **重新开启** USB 调试
5. 重新授权

---

### 3. 测试 UI Automator（设备重连后）

```powershell
# 1. 确认设备在线
d:\开发\marketing-automation-desktop\platform-tools\adb.exe devices

# 应显示：
# ABJK022823000280       device

# 2. 解锁设备屏幕（重要！）
# 在设备上手动解锁屏幕

# 3. 测试 UI dump
d:\开发\marketing-automation-desktop\platform-tools\adb.exe shell uiautomator dump /sdcard/test_dump.xml

# 预期输出：
# UI hierchary dumped to: /sdcard/test_dump.xml

# 4. 读取 dump 文件
d:\开发\marketing-automation-desktop\platform-tools\adb.exe shell cat /sdcard/test_dump.xml | Select-String -Pattern "<?xml" | Select-Object -First 1

# 应显示 XML 头部
```

---

### 4. 常见问题排查

#### 问题 A：设备一直是 offline

```powershell
# 重启 ADB 连接
d:\开发\marketing-automation-desktop\platform-tools\adb.exe kill-server
d:\开发\marketing-automation-desktop\platform-tools\adb.exe reconnect
d:\开发\marketing-automation-desktop\platform-tools\adb.exe devices
```

#### 问题 B：设备显示 unauthorized

在设备上：
1. 进入「设置」→「开发者选项」
2. 点击「撤销 USB 调试授权」
3. 重新开启「USB 调试」
4. 重新授权

#### 问题 C："could not get idle state" 错误

```powershell
# 授予额外权限
d:\开发\marketing-automation-desktop\platform-tools\adb.exe shell pm grant com.android.shell android.permission.DUMP

# 测试
d:\开发\marketing-automation-desktop\platform-tools\adb.exe shell uiautomator dump
```

如果还是失败，说明是 **MIUI 系统限制**，需要：
1. 开启「USB 调试（安全设置）」
2. 或使用 Android 模拟器测试

---

### 5. 小米 MIUI 设备特别说明

MIUI 设备需要额外配置：

#### 必须开启的选项：

1. **USB 调试** ✅
2. **USB 调试（安全设置）** ✅ ⭐ **最重要**
3. **USB 安装** ✅
4. **禁用权限监控** ✅（可选，但推荐）

#### 如何找到「USB 调试（安全设置）」：

1. 进入「设置」
2. 选择「更多设置」
3. 选择「开发者选项」
4. 向下滚动找到「USB 调试（安全设置）」

**如果找不到此选项**：
- 需要先登录小米账号
- 某些 MIUI 版本需要等待 **7 天**后才会出现此选项
- 临时解决：使用 Android 模拟器

---

## 完整测试流程（请按顺序执行）

### 步骤 1：重新连接设备

```powershell
# 1. 停止 ADB
d:\开发\marketing-automation-desktop\platform-tools\adb.exe kill-server

# 2. 拔掉 USB 线，等待 5 秒，重新插入

# 3. 检查设备
d:\开发\marketing-automation-desktop\platform-tools\adb.exe devices

# 应该显示：
# List of devices attached
# ABJK022823000280       device
```

### 步骤 2：解锁屏幕并开启安全设置

1. **解锁设备屏幕**
2. 进入「开发者选项」
3. 确认以下选项都已开启：
   - ✅ USB 调试
   - ✅ USB 调试（安全设置）⭐
   - ✅ USB 安装

### 步骤 3：手动测试 UI Automator

```powershell
# 1. 测试基本 dump
d:\开发\marketing-automation-desktop\platform-tools\adb.exe shell uiautomator dump

# 预期输出：
# UI hierchary dumped to: /sdcard/window_dump.xml

# 2. 如果出现 "could not get idle state"，授予权限：
d:\开发\marketing-automation-desktop\platform-tools\adb.exe shell pm grant com.android.shell android.permission.DUMP

# 3. 再次测试
d:\开发\marketing-automation-desktop\platform-tools\adb.exe shell uiautomator dump /sdcard/test.xml

# 4. 读取文件验证
d:\开发\marketing-automation-desktop\platform-tools\adb.exe shell cat /sdcard/test.xml | Select-String -Pattern "hierarchy" | Select-Object -First 1
```

### 步骤 4：测试应用功能

如果上述手动测试都成功了，重新启动应用：

```powershell
cd d:\开发\marketing-automation-desktop
npm run tauri dev
```

然后在应用中测试智能脚本功能。

---

## 诊断结果

根据日志分析：

1. ✅ 设备最初是**连接的**（device 状态）
2. ❌ 在测试过程中设备变成了 **offline**
3. ❌ 最终设备**完全断开连接**

**可能原因**：
- USB 线松动或接触不良
- USB 端口供电不足
- 设备进入睡眠/省电模式
- MIUI 系统自动断开了 ADB 连接（安全保护）

**推荐解决方案**：
1. 使用**质量好的 USB 数据线**（不要用充电线）
2. 插到**电脑主板的 USB 口**（不要用前置 USB 或 HUB）
3. 在 MIUI 开发者选项中：
   - 开启「保持唤醒状态」
   - 开启「USB 调试（安全设置）」
   - 关闭「监控 ADB 安装应用」
4. 考虑使用 **Android Studio AVD 模拟器**作为备选方案

---

## 快速检查清单

请完成以下检查并告诉我结果：

- [ ] 设备已解锁屏幕
- [ ] 重新插拔了 USB 线
- [ ] `adb devices` 显示设备为 `device` 状态（不是 unauthorized 或 offline）
- [ ] 开启了「USB 调试（安全设置）」（MIUI 设备）
- [ ] 手动执行 `adb shell uiautomator dump` 成功
- [ ] 手动执行 `adb shell cat /sdcard/window_dump.xml` 能看到 XML 内容

---

## 下一步行动

**请按照上述步骤操作，然后告诉我：**

1. `adb devices` 的输出结果
2. `adb shell uiautomator dump` 的输出结果
3. 是否是小米 MIUI 设备？是否找到了「USB 调试（安全设置）」选项？

我会根据你的反馈提供针对性的解决方案。
