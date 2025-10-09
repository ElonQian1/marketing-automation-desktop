# OpenAI Codex 官方推荐设置指南

## 🎯 官方推荐的核心配置

根据 OpenAI 官方文档 (https://developers.openai.com/codex/ide)，以下是推荐的设置：

### 1. 📦 扩展安装
- **官方扩展**: `openai.chatgpt` (Codex – OpenAI's coding agent) ✅ 已安装
- **安装来源**: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=openai.chatgpt)

### 2. 🎛️ 模型配置
**官方推荐模型**: `GPT-5-Codex`
- 这是专为代码优化的 GPT-5 变体
- 在扩展中可通过模型选择器切换

**推理努力设置**:
- `低` (low): 快速响应，适合简单任务
- `中` (medium): 平衡选择 (官方推荐)
- `高` (high): 复杂任务，响应较慢

### 3. 🔐 批准模式
**官方推荐**: `Agent` 模式
- **Agent**: 可以自动读取文件、编辑代码、运行命令，但需要批准访问工作目录外或网络
- **Agent (Full Access)**: 完全访问权限，谨慎使用
- **Chat**: 仅聊天模式，不执行操作

### 4. 🛡️ 沙盒设置
**官方推荐**: `workspace-write`
- 允许在工作目录内读写文件
- 限制访问系统其他部分
- 平衡安全性和功能性

### 5. ⚙️ 在 VS Code 中的设置

已经为你配置了以下设置：
```json
{
  "codex.model": "gpt-5-codex",
  "codex.approvalPolicy": "agent", 
  "codex.sandboxMode": "workspace-write",
  "codex.modelReasoningEffort": "medium",
  "codex.ide.sidebarPosition": "right"
}
```

### 6. 🎯 使用方法

#### 连接 ChatGPT 账户
1. 确保你有 ChatGPT Plus/Pro/Business/Enterprise 订阅
2. 在扩展中点击"Sign in with ChatGPT"
3. 按提示完成认证

#### 移动到右侧边栏 (官方推荐)
1. 在 VS Code 中拖拽 Codex 图标到右侧边栏
2. 这样可以更方便地访问 Codex 功能

#### 文件引用语法
使用 `@` 符号引用文件：
```
Use @example.tsx as a reference to add a new page named "Resources"
```

#### 快捷键设置
在扩展设置中可以配置快捷键：
1. 点击扩展右上角齿轮图标
2. 选择 "Keyboard shortcuts"
3. 设置自定义快捷键

### 7. 📋 配置文件位置

**全局配置文件**: `~/.codex/config.toml`
- CLI 和 IDE 扩展共享此配置
- 可通过扩展设置中的"Open config.toml"访问

**建议的配置内容**:
```toml
# 官方推荐的基础配置
model = "gpt-5-codex"
model_provider = "openai"
model_reasoning_effort = "medium"
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[shell_environment_policy]
include_only = ["PATH", "HOME", "USER", "LANG"]
```

### 8. 🎯 针对你项目的优化

**Tauri + React + Rust 项目特别配置**:
- 模型: GPT-5-Codex (最佳代码生成)
- 推理努力: Medium (平衡速度和质量)
- 沙盒: workspace-write (允许文件操作)
- 上下文: 包含打开的文件和选中代码

### 9. 📊 使用限额

根据你的 ChatGPT 订阅类型：
- **Plus**: 每5小时 30-150 本地消息或 5-40 云任务
- **Pro**: 每5小时 300-1,500 本地消息或 50-400 云任务
- **Business/Enterprise**: 更高限额或弹性定价

### 10. 🔧 故障排除

**常见问题**:
1. **登录失败**: 确保 ChatGPT 订阅有效
2. **功能受限**: 检查批准模式和沙盒设置
3. **性能慢**: 降低推理努力或切换模型

**调试选项**:
- 在配置中启用 `verbose_logging = true`
- 查看扩展输出面板的日志

---

## 🎉 配置完成

你的 OpenAI Codex 现在已按官方推荐配置：
- ✅ 使用 GPT-5-Codex 模型
- ✅ Agent 批准模式
- ✅ 工作区写入权限
- ✅ 右侧边栏位置
- ✅ 中等推理努力

**下一步**: 重启 VS Code，然后开始使用 Codex 进行 AI 辅助编程！