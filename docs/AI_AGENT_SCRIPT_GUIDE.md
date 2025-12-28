# AI Agent 通用算法脚本使用指南

## 概述

本MCP服务提供了一套完整的工具，让任何AI Agent都能通过MCP协议控制Android设备，执行自动化任务，并将成功的操作流程保存为可重复执行的算法脚本。

## 核心工具列表

### 设备控制工具

| 工具名 | 描述 | 关键参数 |
|--------|------|----------|
| `list_devices` | 列出所有已连接设备 | 无 |
| `launch_app` | 启动APP | `package_name` |
| `get_screen` | 获取屏幕UI结构(XML) | `device_id` |
| `find_elements` | 查找匹配元素 | `pattern`, `min_value` |
| `tap` | 点击坐标 | `x`, `y` |
| `tap_element` | 点击文本元素 | `text`, `match_type` |
| `swipe_screen` | 滑动屏幕 | `direction`, `distance` |
| `input_text` | 输入文本 | `text` |
| `press_key` | 按键 | `key` (back/home/recent) |
| `extract_comments` | 提取评论 | `max_count` |

### 脚本管理工具

| 工具名 | 描述 |
|--------|------|
| `list_scripts` | 列出所有脚本 |
| `get_script` | 获取脚本详情 |
| `create_script` | 创建新脚本 |
| `add_step` | 添加步骤 |
| `execute_script` | 执行脚本 |
| `save_agent_script` | 保存AI Agent脚本 |

---

## 示例：小红书热门笔记评论采集

### 任务目标
> 打开小红书，在首页找到点赞上万的瀑布流卡片，点击进入，获取前5个有意义的评论

### 执行流程

```
┌─────────────────────────────────────────────────────────┐
│  Step 1: 启动小红书                                      │
│  launch_app(package_name="com.xingin.xhs")              │
│  等待 3 秒                                               │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Step 2: 查找热门笔记                                    │
│  find_elements(pattern="\\d+(\\.\\d+)?万", min_value=10000) │
│  输出: { center_x: 643, center_y: 1835, text: "1.9万" } │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Step 3: 点击卡片进入详情                                │
│  tap(x=643, y=1635)  // y-200 避免点到点赞按钮          │
│  等待 3 秒                                               │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Step 4: 滚动到评论区                                    │
│  swipe_screen(direction="up", distance="large") x2      │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Step 5: 提取有意义的评论                                │
│  extract_comments(max_count=5)                          │
│  自动过滤: 纯表情、空内容、<2字符、纯数字、纯标点       │
└─────────────────────────────────────────────────────────┘
```

### MCP 调用示例

```powershell
# 1. 启动小红书
$body = '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"launch_app","arguments":{"device_id":"emulator-5554","package_name":"com.xingin.xhs"}}}'
Invoke-RestMethod -Uri "http://127.0.0.1:3100/mcp" -Method POST -ContentType "application/json" -Body $body

# 2. 查找点赞上万的笔记
$body = '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"find_elements","arguments":{"device_id":"emulator-5554","pattern":"\\\\d+(\\\\.\\\\d+)?万","min_value":10000}}}'
$result = Invoke-RestMethod -Uri "http://127.0.0.1:3100/mcp" -Method POST -ContentType "application/json" -Body $body
# 输出: { found: true, elements: [{ text: "1.9万", center_x: 643, center_y: 1835, numeric_value: 19000 }] }

# 3. 点击卡片 (y坐标减200避免点到点赞按钮)
$body = '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"tap","arguments":{"device_id":"emulator-5554","x":643,"y":1635}}}'
Invoke-RestMethod -Uri "http://127.0.0.1:3100/mcp" -Method POST -ContentType "application/json" -Body $body

# 4. 滑动到评论区
$body = '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"swipe_screen","arguments":{"device_id":"emulator-5554","direction":"up","distance":"large"}}}'
Invoke-RestMethod -Uri "http://127.0.0.1:3100/mcp" -Method POST -ContentType "application/json" -Body $body

# 5. 提取评论
$body = '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"extract_comments","arguments":{"device_id":"emulator-5554","max_count":5}}}'
$result = Invoke-RestMethod -Uri "http://127.0.0.1:3100/mcp" -Method POST -ContentType "application/json" -Body $body
# 输出: { success: true, count: 1, comments: [{ username: "程芳", content: "支持", likes: "11", time_location: "3小时前 湖北" }] }
```

---

## 关键功能说明

### 1. 正则表达式元素查找 (find_elements)

```json
{
  "pattern": "\\d+(\\.\\d+)?万",  // 匹配 "1.9万", "10万" 等
  "min_value": 10000              // 只返回数值 >= 10000 的元素
}
```

**工作原理**：
- 解析文本中的数值（如 "1.9万" → 19000）
- 自动计算元素中心坐标
- 支持按数值过滤

### 2. 智能评论提取 (extract_comments)

**自动过滤规则**：
| 规则 | 示例 | 结果 |
|------|------|------|
| 空内容 | `""` | ❌ 跳过 |
| 纯表情 | `[赞R][点赞R]` | ❌ 跳过 |
| 过短 (<2字符) | `好` | ❌ 跳过 |
| 纯数字 | `123` | ❌ 跳过 |
| 有意义内容 | `支持` | ✅ 保留 |

### 3. 脚本保存与复用

使用 `save_agent_script` 将成功的操作流程保存：

```json
{
  "name": "save_agent_script",
  "arguments": {
    "name": "小红书热门笔记评论采集",
    "goal": "找到点赞上万的笔记并获取前5条评论",
    "steps": [
      { "step_name": "启动小红书", "action": "launch_app", "package_name": "com.xingin.xhs" },
      { "step_name": "查找热门笔记", "action": "find_elements", "pattern": "\\d+万", "min_value": 10000 }
      // ...
    ]
  }
}
```

---

## MCP 端点信息

- **URL**: `http://127.0.0.1:3100/mcp`
- **协议**: JSON-RPC 2.0
- **方法**: POST
- **Content-Type**: application/json

---

## 完整脚本文件

算法脚本保存在：
```
src-tauri/data/agent_scripts/xiaohongshu_hot_comments.json
```

此脚本可供任何支持MCP协议的AI Agent直接使用。
