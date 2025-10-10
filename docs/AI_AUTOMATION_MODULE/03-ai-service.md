# AI Service Design (OpenAI Integration)

## Responsibilities
- 评论理解：检测意图、情感、紧急程度、是否需要人工升级。
- 回复生成：提供多候选草稿，符合品牌语调与平台规范。
- 优先级评分：结合互动指标与上下文，输出任务处理顺序。
- 异常摘要：对互动量异常变化生成摘要/提醒。
- 结果回写：将 AI 评估与建议写入 `tasks` 表，供前端展示与执行引擎使用。

## Architecture
```
Task Queue → AI Dispatcher → Prompt Builder → OpenAI Client → Response Parser → Validator → Task Updater
```

- **AI Dispatcher**：从 `ai_processing` 队列取任务，控制并发和速率（遵循 per-minute token 限制）。
- **Prompt Builder**：组合系统提示、品牌策略、评论上下文、历史互动，形成结构化输入。
- **OpenAI Client**：调用 `Chat Completions` 或 `Responses` API，支持流式处理。
- **Response Parser**：解析模型输出的 JSON，映射到内部结构。
- **Validator**：执行敏感词检测、长度校验、格式检查，不合格则重试或标记人工复核。
- **Task Updater**：将 AI 结果写回数据库（回复候选、动作建议、置信度、模型版本）。

## Model Selection
- **Primary**：`gpt-4o-mini` or `gpt-4.1`（视成本与质量而定）。
- **Fallback**：`gpt-4o-mini-high` 或自建轻量模型，处理高峰期或网络受限时。
- **Function Calling**：利用响应 JSON 模式，确保输出可解析。
- **Batch Processing**：对批量评论使用 OpenAI `Batch` API 降成本；优先低风险评论。

## Prompt Strategy
- **System Prompt**：定义品牌语调、禁用语、输出格式。示例：
  ```
  You are a marketing assistant for Brand X on 小红书. Follow tone: warm, professional, concise.
  Forbidden topics: ... Output MUST be valid JSON matching the schema...
  ```
- **Comment Context**：
  - 评论文本、作者昵称、时间、互动指标、地域。
  - 视频主题摘要（可由前置模型或人工配置提供）。
  - 历史互动（近期是否已回复、是否关注）。
- **Constraints**：
  - 字数上限（如 80 字），不得包含敏感词列表。
  - 需要引用产品卖点或活动信息时，从知识库检索并注入。
- **Output Schema**：
  ```json
  {
    "classification": {
      "intent": "inquiry|complaint|praise|spam|other",
      "sentiment": -2..2,
      "needs_follow_up": true/false
    },
    "priority": {
      "score": 0..100,
      "reason": "string"
    },
    "action": {
      "type": "reply|follow|ignore|escalate",
      "confidence": 0..1
    },
    "reply_options": [
      {"id": "A", "text": "...", "tone": "warm"},
      {"id": "B", "text": "...", "tone": "direct"}
    ],
    "alerts": []
  }
  ```

## Knowledge & Context
- 使用矢量数据库（如 SQLite FT 或 Qdrant）存储品牌 FAQ、产品资料、促销信息。
- AI 调用前根据评论内容进行检索，取前几条知识片段注入 Prompt。
- 知识库更新后记录版本号，便于审计 AI 输出基于哪版本知识。

## Safety & Compliance
- **脱敏**：评论数据在发送给 OpenAI 之前移除手机号、订单号、个人地址等敏感信息。
- **敏感词扫描**：Validator 需使用本地词库和正则检查 AI 生成内容。
- **人工复核**：对低置信度或高风险分类（投诉、敏感话题）强制人工审核。
- **日志留存**：记录请求 ID、模型、输入摘要、输出摘要、人工决策，保留 180 天。
- **回滚策略**：若模型表现异常，允许切换到旧模型或纯人工流程。

## Cost & Rate Management
- 设定每日 token 预算；Dispatcher 根据剩余额度调节并发或降级模型。
- 对于重复问题，启用回复缓存（按评论分类、视频主题、问题摘要维度）。
- 统计每个评论处理的平均 token 用量，为后续精调或 prompt 优化提供数据。

## API Interface (Rust)
```rust
pub struct AiRequest {
    pub task_id: Uuid,
    pub comment: CommentContext,
    pub knowledge_snippets: Vec<String>,
}

pub struct AiResponse {
    pub classification: Classification,
    pub priority: Priority,
    pub action: ActionRecommendation,
    pub reply_options: Vec<ReplyOption>,
    pub alerts: Vec<String>,
    pub model: String,
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
}
```
- 使用 `async` 客户端 + 重试策略（指数退避 + jitter）。
- 所有请求自动加上 `metadata`（任务来源、设备、操作员）。

## Observability
- 指标：每分钟调用次数、成功率、超时率、平均 token、生成内容被人工修改率。
- Trace：链路追踪记录 “抓取 → 任务生成 → AI → 执行” 的完整耗时。
- 日志级别：`INFO`（调用成功）、`WARN`（校验失败）、`ERROR`（API 调用失败或 JSON 解析失败）。
- 可考虑引入 OpenTelemetry + Prometheus/Grafana。
