# AI Agent MCP 工具使用指南

## 概述

本指南说明外部 AI Agent 如何通过 MCP 协议控制设备、分析屏幕，并将操作流程保存为可重复执行的通用算法脚本。

## 新增的 AI Agent 专用工具

### 1. `find_elements` - 智能元素查找

**用途**: 使用正则表达式和条件过滤查找屏幕上的元素。

**参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `device_id` | string | ✅ | 设备ID |
| `pattern` | string | ✅ | 正则表达式，如 `\\d+(\\.\\d+)?万赞` |
| `search_in` | string | ❌ | 搜索范围: `text`, `content-desc`, `both`（默认） |
| `min_value` | number | ❌ | 最小数值过滤（用于"点赞上万"这类条件） |
| `max_results` | number | ❌ | 最多返回几个结果（默认10） |

**返回示例**:
```json
{
  "found": true,
  "count": 2,
  "elements": [
    {
      "text": "",
      "content_desc": "笔记 热点 国投瑞银白银基金限购100元！ 来自潇湘晨报 1.8万赞",
      "bounds": "[552,1158][1056,1785]",
      "center_x": 804,
      "center_y": 1472,
      "numeric_value": 18000.0
    }
  ]
}
```

**使用场景**:
- 找到所有点赞超过1万的笔记卡片
- 找到所有包含特定关键词的元素
- 动态查找而非写死固定文本

---

### 2. `extract_comments` - 评论数据提取

**用途**: 从当前屏幕的评论列表中提取结构化数据。

**参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `device_id` | string | ✅ | 设备ID |
| `max_count` | number | ❌ | 最多提取几条（默认5） |

**返回示例**:
```json
{
  "success": true,
  "count": 5,
  "comments": [
    {
      "username": "小芸",
      "content": "[赞R][赞R]",
      "likes": "1",
      "time_location": "53分钟前 浙江"
    },
    {
      "username": "贺军良",
      "content": "好",
      "likes": "60",
      "time_location": "昨天 20:16 湖南"
    }
  ]
}
```

---

### 3. `save_agent_script` - 保存 AI Agent 脚本

**用途**: 将 AI Agent 的操作流程保存为可重复执行的算法脚本。

**参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 脚本名称 |
| `description` | string | ❌ | 脚本描述 |
| `goal` | string | ✅ | 任务目标（自然语言） |
| `steps` | array | ✅ | 步骤列表 |
| `output` | object | ❌ | 期望输出格式 |

**步骤格式**:
```json
{
  "name": "查找万赞笔记",
  "action": "find_and_tap",
  "condition": {
    "pattern": "\\d+(\\.\\d+)?万赞",
    "min_value": 10000
  }
}
```

---

## 完整工作流示例

### 任务: "在小红书首页找到点赞上万的笔记，获取前5条评论"

```
AI Agent 执行流程:

1. list_devices
   → 返回: [{"id": "emulator-5554", "status": "connected"}]

2. get_screen (device_id: "emulator-5554")
   → 返回: XML 格式的 UI 层级结构

3. find_elements (device_id: "emulator-5554", pattern: "\\d+(\\.\\d+)?万赞", min_value: 10000)
   → 返回: { "found": true, "elements": [{ "center_x": 804, "center_y": 1472, ... }] }

4. tap (device_id: "emulator-5554", x: 804, y: 1472)
   → 返回: "✅ 操作成功"

5. wait (milliseconds: 2000)
   → 等待详情页加载

6. tap_element (device_id: "emulator-5554", text: "评论")
   → 点击评论按钮

7. wait (milliseconds: 1500)
   → 等待评论列表加载

8. extract_comments (device_id: "emulator-5554", max_count: 5)
   → 返回: { "comments": [...] }

9. save_agent_script (name: "小红书热门评论采集", goal: "...", steps: [...])
   → 保存为可重复执行的脚本
```

---

## AI Agent 脚本格式

保存的脚本采用 `ai_agent_script` 格式，包含：

```json
{
  "format": "ai_agent_script",
  "version": "1.0.0",
  "name": "脚本名称",
  "goal": "任务目标（自然语言描述）",
  "steps": [
    {
      "name": "步骤名称",
      "action": "find_and_tap | tap | swipe | wait | extract_comments | back",
      "condition": { ... },  // 查找条件（用于 find_and_tap）
      "params": { ... },     // 其他参数
      "fallback": { ... },   // 失败时的备选方案
      "on_success": { ... }  // 成功后的操作
    }
  ],
  "output": {
    "type": "comments | posts | users | custom",
    "schema": { ... }
  }
}
```

---

## 通用 vs 写死的对比

| 方面 | 写死方式 | 通用算法方式 |
|------|---------|-------------|
| 文本匹配 | `text_match: "1.8万赞"` | `pattern: "\\d+(\\.\\d+)?万赞", min_value: 10000` |
| 适用性 | 只能匹配这一个帖子 | 能匹配任何万赞帖子 |
| 可重复 | 下次数据变了就失效 | 始终有效 |
| AI 友好 | 需要人工调整 | AI 可自主执行 |

---

## MCP 工具完整列表

### 设备控制
- `list_devices` - 列出所有设备
- `get_screen` - 获取屏幕 XML
- `tap` - 坐标点击
- `tap_element` - 文本匹配点击
- `swipe_screen` - 滑动屏幕
- `input_text` - 输入文本
- `press_key` - 按键（back/home/enter）
- `wait` - 等待
- `launch_app` - 启动应用

### AI Agent 专用
- `find_elements` - 智能元素查找（正则+条件）
- `extract_comments` - 评论数据提取
- `save_agent_script` - 保存算法脚本

### 脚本管理
- `list_scripts` - 列出脚本
- `get_script` - 获取脚本详情
- `create_script` - 创建脚本
- `add_step` - 添加步骤
- `execute_script` - 执行脚本
- `delete_script` - 删除脚本

---

## 注意事项

1. **正则表达式转义**: JSON 中的正则需要双重转义，如 `\\d+` 而非 `\d+`
2. **中文数字解析**: `find_elements` 自动解析 "1.8万" → 18000, "2475" → 2475
3. **content-desc 搜索**: 小红书的点赞数通常在 `content-desc` 属性中，设置 `search_in: "both"`
4. **失败重试**: 建议在脚本中设置 `fallback` 策略，如找不到元素时滑动重试
