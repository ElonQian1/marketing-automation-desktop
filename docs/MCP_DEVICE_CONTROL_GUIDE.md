# MCP 设备控制服务使用指南

## 概述

本项目提供了一个 MCP (Model Context Protocol) 服务器，允许 **任何 AI 助手**（如 VS Code Copilot、Claude、ChatGPT 等）直接控制 Android 设备，并将操作流程保存为可执行脚本。

## 核心能力

1. **设备控制** - 列出设备、启动应用、点击元素、滑动屏幕、输入文本
2. **屏幕分析** - 获取屏幕 UI 结构 (XML)，分析元素位置和属性
3. **脚本创建** - 将操作流程记录为可复用的自动化脚本
4. **脚本执行** - 在任意设备上重放已保存的脚本

## 架构

```
┌─────────────────┐     stdio      ┌──────────────────────┐     HTTP      ┌────────────────────┐
│  AI 助手        │ ◄────────────► │ MCP Bridge Layer     │ ◄───────────► │ Tauri Backend      │
│  (Copilot等)    │                │ (device-control-     │               │ (端口 3100)        │
│                 │                │  server)             │               │                    │
└─────────────────┘                └──────────────────────┘               └────────────────────┘
                                                                                   │
                                                                                   ▼
                                                                          ┌────────────────────┐
                                                                          │  ADB 设备控制      │
                                                                          │  脚本持久化存储    │
                                                                          └────────────────────┘
```

## 配置

### 1. VS Code MCP 配置

`.vscode/mcp.json` 文件已配置好：

```json
{
  "servers": {
    "device-control": {
      "type": "stdio",
      "command": "node",
      "args": ["mcp/device-control-server/index.js"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

### 2. 确保依赖已安装

```bash
cd mcp/device-control-server
npm install
```

### 3. 确保 Tauri 应用正在运行

MCP 服务需要后端支持，请先启动 Tauri 应用：

```bash
npm run tauri dev
```

---

## 完整工具列表

### 📱 设备管理工具

| 工具 | 描述 | 必需参数 | 可选参数 |
|------|------|----------|----------|
| `list_devices` | 列出所有已连接设备 | - | - |
| `get_screen` | 获取屏幕 UI 结构 (XML) | `device_id` | - |
| `launch_app` | 启动应用 | `device_id`, `package_name` | - |
| `run_adb_command` | 执行 ADB 命令 | `device_id`, `command` | - |

### 👆 交互操作工具

| 工具 | 描述 | 必需参数 | 可选参数 |
|------|------|----------|----------|
| `tap_element` | 点击指定文本的元素 | `device_id`, `text` | `match_type` (exact/contains) |
| `tap` | 点击指定坐标 | `device_id`, `x`, `y` | - |
| `input_text` | 输入文本 | `device_id`, `text` | - |
| `swipe_screen` | 滑动屏幕 | `device_id`, `direction` | `distance` (short/medium/long) |
| `press_key` | 按下按键 | `device_id`, `key` | - (back/home/menu/enter/delete) |
| `wait` | 等待指定时间 | `milliseconds` | - |

### 📝 脚本管理工具

| 工具 | 描述 | 必需参数 | 可选参数 |
|------|------|----------|----------|
| `list_scripts` | 列出所有脚本 | - | - |
| `get_script` | 获取脚本详情 | `script_id` | - |
| `create_script` | 创建新脚本 | `name` | `description` |
| `add_step` | 添加步骤到脚本 | `script_id`, `step_name`, `action_type` | `target_text`, `target_xpath`, `input_text`, `wait_ms`, `swipe_direction` |
| `update_step` | 更新步骤 | `script_id`, `step_index`, `step_name`, `action_type` | 同 add_step |
| `remove_step` | 删除步骤 | `script_id`, `step_index` | - |
| `reorder_steps` | 调整步骤顺序 | `script_id`, `from_index`, `to_index` | - |
| `execute_script` | 执行脚本 | `script_id`, `device_id` | - |
| `delete_script` | 删除脚本 | `script_id` | - |
| `duplicate_script` | 复制脚本 | `script_id` | - |
| `validate_script` | 验证脚本 | `script_id` | - |

---

## 🤖 AI 代理操作指南

### 典型工作流程

AI 代理应该按照以下步骤完成自动化任务：

```
1. 🔌 连接设备
   └─ 调用 list_devices 获取设备列表
   
2. 🚀 启动应用
   └─ 调用 launch_app 打开目标应用
   
3. 📷 分析屏幕
   └─ 调用 get_screen 获取 UI 结构
   └─ 解析 XML，找到目标元素
   
4. 👆 执行操作
   └─ 调用 tap_element / input_text / swipe_screen 等
   
5. 📝 记录脚本（可选）
   └─ 调用 create_script 创建脚本
   └─ 调用 add_step 添加每个操作步骤
   
6. ✅ 验证脚本
   └─ 调用 validate_script 检查脚本
   └─ 调用 execute_script 测试脚本
```

### 创建脚本示例

**任务**: 创建一个"打开小红书添加好友"的脚本

```
# Step 1: 创建脚本
调用 create_script:
  name: "打开小红书添加好友"
  description: "自动化流程：打开小红书 → 进入个人页 → 添加好友"

# Step 2: 添加步骤
调用 add_step:
  script_id: (上一步返回的 script_id)
  step_name: "点击'我'"
  action_type: "click"
  target_text: "我"

调用 add_step:
  script_id: (script_id)
  step_name: "点击'菜单'"
  action_type: "click"
  target_text: "菜单"

调用 add_step:
  script_id: (script_id)
  step_name: "点击'添加好友'"
  action_type: "click"
  target_text: "添加好友"

# Step 3: 验证脚本
调用 validate_script:
  script_id: (script_id)

# Step 4: 执行测试
调用 execute_script:
  script_id: (script_id)
  device_id: "emulator-5554"
```

### action_type 参数说明

| action_type | 用途 | 需要的参数 |
|-------------|------|-----------|
| `click` | 点击元素 | `target_text` 或 `target_xpath` |
| `input` | 输入文本 | `input_text` |
| `wait` | 等待 | `wait_ms` (毫秒) |
| `back` | 返回键 | - |
| `swipe` | 滑动 | `swipe_direction` (up/down/left/right) |

---

## 常用 App 包名

| 应用 | 包名 |
|------|------|
| 微信 | `com.tencent.mm` |
| 抖音 | `com.ss.android.ugc.aweme` |
| 小红书 | `com.xingin.xhs` |
| 淘宝 | `com.taobao.taobao` |
| 支付宝 | `com.eg.android.AlipayGphone` |
| QQ | `com.tencent.mobileqq` |
| 快手 | `com.smile.gifmaker` |
| 美团 | `com.sankuai.meituan` |

---

## 脚本存储格式

创建的脚本保存在 `src-tauri/data/scripts/` 目录，格式如下：

```json
{
  "id": "script_1765214329650",
  "name": "打开小红书添加好友",
  "description": "自动化流程：打开小红书 → 进入个人页 → 添加好友",
  "version": "1.0.0",
  "created_at": "2025-06-06T08:40:00Z",
  "updated_at": "2025-06-06T08:45:00Z",
  "author": "AI Agent",
  "category": "社交",
  "tags": ["小红书", "好友", "自动化"],
  "steps": [
    {
      "id": "step_1",
      "step_type": "smart_find_element",
      "name": "点击'我'",
      "description": "智能分析 - 点击'我'",
      "parameters": {
        "content_desc": "我",
        "element_selector": "//*[@content-desc=\"我\"]",
        "text": "我",
        "matching": {
          "strategy": "intelligent",
          "preferredStrategy": "anchor_by_child_or_parent_text"
        },
        "smartSelection": {
          "targetText": "我",
          "textMatchingMode": "exact",
          "minConfidence": 0.8
        }
      },
      "enabled": true,
      "order": 1
    }
  ]
}
```

---

## 故障排除

### 连接失败

1. 确保 Tauri 应用正在运行 (`npm run tauri dev`)
2. 检查端口 3100 是否被占用
3. 确保 ADB 服务正在运行 (`adb start-server`)

### 设备未检测到

1. 运行 `adb devices` 检查设备连接
2. 确保 USB 调试已开启
3. 对于模拟器，确保模拟器正在运行

### 元素点击失败

1. 使用 `get_screen` 重新获取最新的屏幕结构
2. 检查元素文本是否正确（区分大小写）
3. 尝试使用 `tap` 工具直接点击坐标

---

## 高级用法

### 1. 批量执行脚本

```
# 在多台设备上执行同一脚本
for device_id in ["emulator-5554", "device-2"]:
    execute_script(script_id="xxx", device_id=device_id)
```

### 2. 条件分支（规划中）

未来将支持基于屏幕内容的条件分支，例如：
- 如果元素存在则点击，否则滑动查找
- 如果弹窗出现则关闭

### 3. 循环操作（规划中）

支持循环执行某些步骤，用于批量处理场景。
