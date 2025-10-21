太好了，这块完全可以做成**“AI 接入独立模块（ai/）”**，把 OpenAI 当成一个**可替换的 Provider（适配器）**。下面给你一套能直接落地的蓝图 + 最小代码骨架（TS/Node & Rust/Tauri），支持**结构化输出、函数调用（tool calling）、串流、重试与限流**，并且与现在你的“步骤卡片 / 智能策略”业务契合。

---

# 一、模块化设计蓝图（可直接放到仓库）

```
/src
  /ai
    /core
      types.ts            # 统一请求/响应类型、错误码
      router.ts           # 任务路由：embedding / chat / image / tools
      stream.ts           # SSE/流式处理统一封装
      rateLimit.ts        # 限流与重试（指数退避）
    /providers
      openai.ts           # OpenAI 适配器（Responses API）
      # hunyuan.ts        # 可选：后续并存另一个适配器（同接口）
    /schemas
      stepCard.schema.ts  # 你的步骤卡片 JSON Schema（结构化输出）
      tools.schema.ts     # 函数调用（tool）参数 JSON Schema
    index.ts              # 工厂：按 env 选择 provider，导出统一 AI 接口
/config
  ai.config.ts            # 模型、温度、超时、并发等配置（按环境分层）
```

**关键思路**

* **统一接口 + Provider 适配器**：`AIClient` 抽象 -> `OpenAIProvider` 实现。日后要换别家只换一个文件。
* **强约束结构化输出**：用 Responses API 的 **Structured Outputs**，让模型**按你的 JSON Schema**产出“步骤卡片”，减少错漏与后处理成本。([OpenAI平台][1])
* **函数调用（tool calling）**：把“读取 XML/查询全局索引/执行 ADB 点击”等封成工具（函数），模型需要时自动调用，后端实现真实动作。([OpenAI平台][2])
* **流式串流**：前端可以实时显示“分析进度/思路摘要/最终步骤卡片”。([OpenAI平台][3])
* **限流与重试**：基于官方**限流策略**设计指数退避，避免 429/负载抖动。([OpenAI平台][4])
* **生产要点**：键管理、日志/追踪、超时、观测、脱敏。([OpenAI平台][5])

---

# 二、最小可用代码（TypeScript / Node 侧）

> 兼容 VS Code 插件、Node 后端或 Tauri sidecar。**注意**：我按你的习惯，代码块第一行保留“文件路径”。

```ts
// src/ai/core/types.ts
export type AIModel = string; // 从配置读取
export type ToolSpec = {
  name: string;
  description?: string;
  parameters: object; // JSON Schema
};
export type StepCard = {
  strategyType: string;
  locator: { kind: string; value: string };
  confidence: number;
  fallbacks?: Array<{ kind: string; value: string }>;
  notes?: string;
};

export type AIRequest = {
  model: AIModel;
  messages: Array<{ role: "system"|"user"|"assistant"; content: string }>;
  tools?: ToolSpec[];
  responseSchema?: { name: string; schema: object; strict?: boolean };
  stream?: boolean;
  temperature?: number;
  timeoutMs?: number;
};

export type AIResponse<T = any> = {
  raw?: any;
  output?: T;
  toolCalls?: Array<{ name: string; arguments: any; id?: string }>;
};
```

```ts
// src/ai/schemas/stepCard.schema.ts
export const StepCardSchema = {
  name: "StepCard",
  schema: {
    type: "object",
    required: ["strategyType", "locator", "confidence"],
    properties: {
      strategyType: { type: "string", enum: ["self_anchor","child_anchor","local_index","global_index","ocr_match","image_template"] },
      locator: {
        type: "object",
        required: ["kind","value"],
        properties: {
          kind: { type: "string", enum: ["xpath","resource_id","text","bounds","css"] },
          value: { type: "string" }
        }
      },
      confidence: { type: "number", minimum: 0, maximum: 1 },
      fallbacks: {
        type: "array",
        items: {
          type: "object",
          required: ["kind","value"],
          properties: {
            kind: { type: "string" },
            value: { type: "string" }
          }
        }
      },
      notes: { type: "string" }
    }
  },
  strict: true
};
```

```ts
// src/ai/schemas/tools.schema.ts
export const ToolFetchXml = {
  name: "fetch_xml",
  description: "按当前页面dump策略取最新XML",
  parameters: {
    type: "object",
    properties: { regionHint: { type: "string" } }
  }
};

export const ToolQueryIndex = {
  name: "query_index",
  description: "查询全局/局部索引返回候选元素",
  parameters: {
    type: "object",
    required: ["query","scope"],
    properties: {
      query: { type: "string" },
      scope: { type: "string", enum: ["local","global"] }
    }
  }
};

export const ToolTap = {
  name: "tap_element",
  description: "在设备上执行点击",
  parameters: {
    type: "object",
    required: ["x","y"],
    properties: { x: { type: "number" }, y: { type: "number" } }
  }
};
```

```ts
// src/ai/providers/openai.ts
import OpenAI from "openai";
import type { AIRequest, AIResponse } from "../core/types";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
// 官方 Node SDK & Responses API：https://platform.openai.com/docs/api-reference/introduction
// 结构化输出 / 工具调用参考： https://platform.openai.com/docs/guides/structured-outputs
// https://platform.openai.com/docs/guides/function-calling

export async function openaiCall<T = any>(req: AIRequest): Promise<AIResponse<T>> {
  const tools = (req.tools || []).map(t => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.parameters }
  }));

  const response_format = req.responseSchema
    ? {
        type: "json_schema" as const,
        json_schema: {
          name: req.responseSchema.name,
          schema: req.responseSchema.schema,
          strict: req.responseSchema.strict ?? true
        }
      }
    : undefined;

  if (req.stream) {
    // 流式（SSE）
    const stream = await client.responses.stream({
      model: req.model,
      messages: req.messages,
      tools,
      response_format,
      temperature: req.temperature ?? 0.2
    });
    // 你可以把 stream.pipe() 到前端，或在这里聚合
    const chunks: string[] = [];
    for await (const event of stream) {
      if (event.type === "response.output_text.delta") chunks.push(event.delta);
      // 也可监听 tool 调用事件 event.type === "response.tool_call.arguments.delta"
    }
    const text = chunks.join("");
    try {
      const parsed = response_format ? JSON.parse(text) : (text as any);
      return { raw: text, output: parsed as T };
    } catch {
      return { raw: text, output: text as any as T };
    }
  } else {
    const res = await client.responses.create({
      model: req.model,
      messages: req.messages,
      tools,
      response_format,
      temperature: req.temperature ?? 0.2
    });

    // 工具调用
    const toolCalls = (res.output?.filter?.(it => it.type === "tool_call") || [])
      .map((it: any) => ({
        name: it.tool_name,
        arguments: it.parameters,
        id: it.id
      }));

    // 结构化输出
    const text = res.output_text ?? "";
    let output: any = text;
    if (response_format && text) {
      try { output = JSON.parse(text); } catch {}
    }
    return { raw: res, output, toolCalls };
  }
}
```

```ts
// src/ai/index.ts
import { openaiCall } from "./providers/openai";
import { StepCardSchema } from "./schemas/stepCard.schema";
import { ToolFetchXml, ToolQueryIndex, ToolTap } from "./schemas/tools.schema";
import type { AIRequest } from "./core/types";

export async function generateStepCard(xmlSnippet: string) {
  const req: AIRequest = {
    model: process.env.AI_MODEL || "gpt-4o-mini", // 建议从配置注入，查看 models 列表
    messages: [
      { role: "system", content: "你是ADB智能页面分析器。只输出符合JSON Schema的结果。" },
      { role: "user", content: `请基于以下XML片段生成最佳步骤卡片:\n${xmlSnippet}` }
    ],
    tools: [ToolFetchXml, ToolQueryIndex, ToolTap],
    responseSchema: StepCardSchema,
    stream: false
  };
  return openaiCall(req);
}
```

> 相关官方文档：**Responses API/结构化输出/函数调用/流式**与**生产最佳实践**。([OpenAI平台][6])
> 模型列表与选择查看 **Models** 页面。([OpenAI平台][7])

---

# 三、Rust（Tauri 后端）最小骨架

> 直接用 `reqwest` 调 REST Responses API，避免引入额外复杂度；需要流式时可读 SSE。

```rust
// src-tauri/src/ai/openai_client.rs
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Serialize)]
struct ResponsesRequest<'a> {
    model: &'a str,
    messages: Vec<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tools: Option<Vec<serde_json::Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    response_format: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    temperature: Option<f32>,
}

#[derive(Deserialize)]
struct ResponsesReply {
    // 仅保留你要用到的字段；也可用 Value
    #[serde(default)]
    output_text: String,
}

pub async fn call_openai(model: &str, messages: Vec<serde_json::Value>, response_schema: Option<serde_json::Value>) -> anyhow::Result<String> {
    let req = ResponsesRequest {
        model,
        messages,
        tools: None,
        response_format: response_schema.map(|schema| {
            serde_json::json!({
               "type":"json_schema",
               "json_schema": {"name":"StepCard","schema": schema, "strict": true}
            })
        }),
        temperature: Some(0.2),
    };

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(60))
        .build()?;

    let res = client
        .post("https://api.openai.com/v1/responses")
        .bearer_auth(std::env::var("OPENAI_API_KEY")?)
        .json(&req)
        .send()
        .await?;

    let body: serde_json::Value = res.json().await?;
    let text = body.get("output_text").and_then(|v| v.as_str()).unwrap_or("").to_string();
    Ok(text)
}
```

> Rust 里若要**双向实时语音/多模态**，你可以对接 **Realtime API（WebSocket/WebRTC）**，官方有说明。([OpenAI平台][8])

---

# 四、配置与安全（最简清单）

* **环境变量**：`OPENAI_API_KEY`、`AI_MODEL`（如：`gpt-4o-mini`），不要写死。**不同环境的 baseURL/代理**也抽到配置。([OpenAI平台][9])
* **限流/重试**：遇到 429/5xx 做**指数退避**（200ms→400ms→800ms…，最多 5 次），参考官方限流说明。([OpenAI平台][4])
* **日志与观测**：记录 `request_id`、耗时、token 用量（方便成本审计）。
* **隐私与数据控制**：确认是否**不用于训练**、保留策略等，见“Your data”。([OpenAI平台][10])

---

# 五、把它接到你现有“步骤卡片 / 智能策略”流程

1. **前端可视化视图点选元素** → 提取当前 XML 片段/位置信息
2. **调用 `generateStepCard()`**（或 Rust `call_openai`）
3. **若有 tool 调用**（比如“fetch_xml / query_index / tap_element”），按返回的 `toolCalls` 顺序调用后端真实实现，再把**工具结果**回填给模型继续求解（Responses API 支持工具交互流）。([OpenAI平台][2])
4. **渲染步骤卡片**：展示 `strategyType / locator / confidence / fallbacks`，允许一键切换“手动静态策略 / 智能策略”。
5. **流式模式**：边生成边更新 UI（“正在分析…→已选策略→最终卡片”）。([OpenAI平台][3])

---

# 六、MVP 落地顺序（建议一天内完成）

1. **落地 ai/** 目录与上面 4 个文件（types / schemas / provider / index）。
2. **配置**：把 `OPENAI_API_KEY` 写到 `.env.local`（开发机）与服务器 Secret（Tauri 用环境注入）。
3. **在 Universal UI 页面**：点选元素后调用 `generateStepCard(xml)`，成功渲染卡片。
4. **追加 tools**：先上 `query_index`（只读），再串 `tap_element`（写操作做二次确认）。
5. **加重试 + 限流**，并在 UI 上显示“重试第 n 次”。([OpenAI平台][4])

---

# 七、模型选择小贴士

* 默认走**中等价位/快**的 `*-mini` 家族，复杂推理再切高阶（配置切换）。模型清单 & 更新看**Models**与**Changelog**。([OpenAI平台][7])

---

如果你愿意，我可以**按你仓库的具体路径**（比如 `employeeGUI/src/ai/…` 或 `marketing-automation-desktop/src/ai/…`）把这些文件一次性生成到 Canvas，顺便把**步骤卡片 UI**的切换逻辑一并补上。

[1]: https://platform.openai.com/docs/guides/structured-outputs?utm_source=chatgpt.com "Structured model outputs - OpenAI API"
[2]: https://platform.openai.com/docs/guides/function-calling?utm_source=chatgpt.com "Function calling - OpenAI API"
[3]: https://platform.openai.com/docs/quickstart?utm_source=chatgpt.com "Developer quickstart - OpenAI API"
[4]: https://platform.openai.com/docs/guides/rate-limits?utm_source=chatgpt.com "Rate limits - OpenAI API"
[5]: https://platform.openai.com/docs/guides/production-best-practices?utm_source=chatgpt.com "Production best practices - OpenAI API"
[6]: https://platform.openai.com/docs/api-reference/introduction?utm_source=chatgpt.com "API Reference - OpenAI API"
[7]: https://platform.openai.com/docs/models?utm_source=chatgpt.com "Models - OpenAI API"
[8]: https://platform.openai.com/docs/guides/realtime?utm_source=chatgpt.com "Realtime API"
[9]: https://platform.openai.com/docs/libraries/node-js-library?utm_source=chatgpt.com "Libraries - OpenAI API"
[10]: https://platform.openai.com/docs/guides/your-data?utm_source=chatgpt.com "Data controls in the OpenAI platform"
