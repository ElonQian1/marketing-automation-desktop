可以把 OpenAI 做成**可替换的 Provider 适配器**，独立在一个 `ai/` 模块里：对外只暴露统一接口（发送、流式、函数调用/工具、结构化输出），对内用 OpenAI Responses API 实现。这样你后续要接入别家（如混元）只需要新增一个 provider 文件。

下面给你**最小可用蓝图 + 代码骨架**（TypeScript/Node 与 Rust/Tauri 各一份），直接可落地。

---

## 目录建议（独立接入模块）

```
/src/ai
  /core
    types.ts          # 统一的请求/响应类型
  /providers
    openai.ts         # OpenAI 适配器（Responses API / 流式 / 工具调用 / 结构化输出）
  index.ts            # 工厂：读取 env，返回统一 AIClient
```

**使用到的官方能力：**

* **Responses API（统一入口，支持文本/工具/流式）**。([OpenAI平台][1])
* **Structured Outputs（按 JSON Schema 严格出结构化结果）**：适合你的“步骤卡片”。([OpenAI平台][2])
* **Function Calling / Tools（函数调用）**：把“fetch XML / query index / tap”等做成工具让模型调用。([OpenAI平台][3])
* **Streaming（SSE 流式）**：边生成边在 UI 展示。([OpenAI平台][4])
* **模型列表与选择**：按需切换到性价比高的 `*-mini` 或更强模型。([OpenAI平台][5])

---

## 最小可用代码（TypeScript / Node）

> 我按你的习惯，**代码块第一行就是文件路径**。

```ts
// src/ai/core/types.ts
export type AIMessage = { role: "system"|"user"|"assistant"; content: string };
export type ToolSpec = { name: string; description?: string; parameters: object }; // JSON Schema
export type AIRequest = {
  model: string;
  messages: AIMessage[];
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
// src/ai/providers/openai.ts
import OpenAI from "openai";
import type { AIRequest, AIResponse } from "../core/types";

/** 统一调用入口：支持结构化输出 / 工具调用 / 流式 */
export async function openaiCall<T = any>(req: AIRequest): Promise<AIResponse<T>> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }); // 在进程环境里注入

  // tools -> OpenAI 规范
  const tools = (req.tools ?? []).map(t => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));

  // 结构化输出（严格按 JSON Schema）
  const response_format = req.responseSchema
    ? { type: "json_schema" as const,
        json_schema: { name: req.responseSchema.name, schema: req.responseSchema.schema, strict: req.responseSchema.strict ?? true }
      }
    : undefined;

  if (req.stream) {
    // 流式（SSE）
    const stream = await client.responses.stream({
      model: req.model,
      messages: req.messages,
      tools,
      response_format,
      temperature: req.temperature ?? 0.2,
    }); // 参考官方 streaming 文档
    const chunks: string[] = [];
    for await (const event of stream) {
      if (event.type === "response.output_text.delta") chunks.push(event.delta);
      // 如需监听函数调用：event.type === "response.tool_call.arguments.delta"
    }
    const text = chunks.join("");
    try { return { raw: text, output: JSON.parse(text) as T }; }
    catch { return { raw: text, output: text as any as T }; }
  }

  // 非流式
  const res = await client.responses.create({
    model: req.model,
    messages: req.messages,
    tools,
    response_format,
    temperature: req.temperature ?? 0.2,
  });

  // 提取工具调用
  const toolCalls =
    (res.output?.filter?.((x: any) => x.type === "tool_call") ?? [])
      .map((x: any) => ({ name: x.tool_name, arguments: x.parameters, id: x.id }));

  // 提取结构化输出（若配置）
  const text = (res as any).output_text ?? "";
  let output: any = text;
  if (response_format && text) { try { output = JSON.parse(text); } catch {} }

  return { raw: res, output, toolCalls };
}
```

```ts
// src/ai/index.ts
import type { AIRequest } from "./core/types";
import { openaiCall } from "./providers/openai";

// 例：生成“步骤卡片”（结构化输出）
export async function generateStepCard(xmlSnippet: string) {
  const StepCardSchema = {
    name: "StepCard",
    schema: {
      type: "object",
      required: ["strategyType","locator","confidence"],
      properties: {
        strategyType: { type: "string", enum: ["self_anchor","child_anchor","local_index","global_index","ocr_match","image_template"] },
        locator: { type: "object",
          required: ["kind","value"],
          properties: { kind: { type:"string" }, value: { type:"string" } }
        },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        notes: { type: "string" }
      }
    },
    strict: true
  };

  const req: AIRequest = {
    model: process.env.AI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: "你是ADB智能页面分析器，仅按Schema输出。" },
      { role: "user", content: `基于下面XML片段生成最稳妥的步骤卡片：\n${xmlSnippet}` }
    ],
    responseSchema: StepCardSchema,
    // 可加 tools：fetch_xml/query_index/tap_element（函数调用）
    stream: false
  };
  return openaiCall(req);
}
```

> 上面用到的官方能力与接口：**Responses API 总览与 streaming**、**Structured Outputs**、**Function Calling/Tools**、**模型选择**。([OpenAI平台][6])

---

## Rust / Tauri 后端（可选最小实现）

```rust
// src-tauri/src/ai/openai_client.rs
use serde_json::json;
use std::time::Duration;

pub async fn call_openai(model: &str, messages: serde_json::Value, response_schema: Option<serde_json::Value>) -> anyhow::Result<String> {
    let body = json!({
      "model": model,
      "messages": messages,
      "response_format": response_schema.map(|schema| json!({
        "type": "json_schema",
        "json_schema": { "name": "StepCard", "schema": schema, "strict": true }
      })),
      "temperature": 0.2
    });

    let client = reqwest::Client::builder().timeout(Duration::from_secs(60)).build()?;
    let res = client.post("https://api.openai.com/v1/responses")
        .bearer_auth(std::env::var("OPENAI_API_KEY")?)
        .json(&body).send().await?;
    let v: serde_json::Value = res.json().await?;
    let text = v.get("output_text").and_then(|x| x.as_str()).unwrap_or("").to_string();
    Ok(text)
}
```

> 如果需要**低延迟语音/多模态实时交互**，再接 **Realtime API**（WS / WebRTC）。([OpenAI平台][7])

---

## 接入你的业务流（步骤卡片 / 智能策略）

1. **前端点击可视化元素** → 收集当前 XML 片段/上下文
2. **调用 `generateStepCard(xml)`**：拿到结构化卡片（`strategyType/locator/confidence`）
3. 若模型返回**工具调用**（例如 `query_index`、`tap_element`），按顺序在后端实现并回填结果，继续交互直到完成。([OpenAI平台][3])
4. **UI 渲染**：显示主策略 + 备选/置信度；允许“切换手动静态策略 / 一键启用智能策略”。
5. 需要边出边看就把 `stream:true` 开启，SSE 推到前端。([OpenAI平台][4])

---

## 生产小贴士（必做）

* **密钥与配置**：`OPENAI_API_KEY`、`AI_MODEL` 用环境变量；区分 dev/prod。([OpenAI平台][8])
* **重试与限流**：对 429/5xx 做指数退避（200ms→400→800…，最多 5 次）。([OpenAI平台][9])
* **日志/审计**：记录 request_id、耗时、token 用量；便于成本与回溯。
* **数据合规**：了解“你的数据如何被处理”的官方说明（是否用于训练/保留策略）。([OpenAI平台][10])

---

如果你愿意，我可以**按你的仓库路径**（例如 `marketing-automation-desktop/src/ai/…`）把以上文件整理成一组 PR 级别的改动，并顺手补一段“步骤卡片”UI 的切换逻辑（智能/静态）。

[1]: https://platform.openai.com/docs/api-reference/introduction?utm_source=chatgpt.com "API Reference - OpenAI API"
[2]: https://platform.openai.com/docs/guides/structured-outputs?utm_source=chatgpt.com "Structured model outputs - OpenAI API"
[3]: https://platform.openai.com/docs/guides/function-calling?utm_source=chatgpt.com "Function calling - OpenAI API"
[4]: https://platform.openai.com/docs/api-reference/responses-streaming?utm_source=chatgpt.com "API Reference"
[5]: https://platform.openai.com/docs/models?utm_source=chatgpt.com "Models - OpenAI API"
[6]: https://platform.openai.com/docs/api-reference/responses?mkt_tok=mjuylvjgty0ymjcaaags7fxnm_jn52tiiblvxijdvnje4z15laurtxpmhdyr-rk6pyoekdqlz7r7dm-swlo3c73qabibmcilqp0tvnjrp1wjq9ckpoz93welxhdn4euei3bosq&mkt_tok=mjuylvjgty0ymjcaaags7fxnm_jn52tiiblvxijdvnje4z15laurtxpmhdyr-rk6pyoekdqlz7r7dm-swlo3c73qabibmcilqp0tvnjrp1wjq9ckpoz93welxhdn4euei3bosq&utm_cta=website-marketplace-page-featured&utm_source=chatgpt.com "API Reference"
[7]: https://platform.openai.com/docs/guides/realtime?utm_source=chatgpt.com "Realtime API"
[8]: https://platform.openai.com/docs/libraries?utm_source=chatgpt.com "Libraries - OpenAI API"
[9]: https://platform.openai.com/docs/models/compare?utm_source=chatgpt.com "Compare models - OpenAI API"
[10]: https://platform.openai.com/docs/quickstart?utm_source=chatgpt.com "Developer quickstart - OpenAI API"
