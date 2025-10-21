可以，一套“**双 Provider 适配**”就够了：**OpenAI + 腾讯混元（OpenAI 兼容模式）**。思路是把你现有 `ai/` 模块抽成统一接口，运行时用环境变量切换到不同 Provider。混元官方已提供 **OpenAI 兼容接口**（同 SDK、同方法名），你只需改 `baseURL` 与 `apiKey` 即可。([腾讯云][1])

下面给你最小可用改造（兼容你“步骤卡片/工具调用/流式/Embeddings”）：

---

### 1) 环境变量（新增）

```bash
# .env / .env.local
AI_PROVIDER=openai           # or hunyuan
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1

HUNYUAN_API_KEY=hy-...
HUNYUAN_BASE_URL=https://api.hunyuan.cloud.tencent.com/v1
```

> 混元兼容端点：`https://api.hunyuan.cloud.tencent.com/v1`，可直接用 OpenAI 官方 SDK 调用其 `/v1/chat/completions`、`/v1/embeddings`。([腾讯云][2])

---

### 2) 工厂：按 provider 生成统一客户端

```ts
// src/ai/index.ts
import OpenAI from "openai";

export function createAIClient() {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();

  const baseURL =
    provider === "hunyuan"
      ? process.env.HUNYUAN_BASE_URL || "https://api.hunyuan.cloud.tencent.com/v1"
      : process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

  const apiKey =
    provider === "hunyuan" ? process.env.HUNYUAN_API_KEY : process.env.OPENAI_API_KEY;

  if (!apiKey) throw new Error(`[AI] Missing API key for ${provider}`);

  return new OpenAI({ apiKey, baseURL });
}
```

---

### 3) 统一“步骤卡片”生成：**函数调用（tools）**强约束（两边都通用）

> 混元文档明确支持 **Function Calling**（OpenAI 兼容的 `tools` 参数与两段式调用流程）；这比“结构化输出（Responses + JSON Schema）”更通用，**OpenAI 与混元都能跑**。([腾讯云][2])

```ts
// src/ai/stepCard.ts
import { createAIClient } from "./index";

const StepCardTool = {
  type: "function" as const,
  function: {
    name: "return_step_card",
    description: "Return a structured step card for ADB UI operation.",
    parameters: {
      type: "object",
      required: ["strategyType", "locator", "confidence"],
      properties: {
        strategyType: { type: "string", enum: ["self_anchor","child_anchor","local_index","global_index","ocr_match","image_template"] },
        locator: {
          type: "object",
          required: ["kind","value"],
          properties: { kind: { type: "string" }, value: { type: "string" } }
        },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        notes: { type: "string" }
      }
    }
  }
};

export async function generateStepCard(xmlSnippet: string, options?: { model?: string }) {
  const client = createAIClient();
  const model = options?.model || (process.env.AI_PROVIDER === "hunyuan" ? "hunyuan-turbos-latest" : "gpt-4o-mini");

  const r1 = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "你是ADB智能页面分析器。请通过调用 return_step_card 返回结构化步骤卡片。" },
      { role: "user", content: `基于以下XML片段，选择最稳妥的定位策略并返回：\n${xmlSnippet}` }
    ],
    tools: [StepCardTool],
    tool_choice: "auto",
    // 混元可附加自定义参数（可选）：enable_enhancement: true
  } as any);

  const choice = r1.choices?.[0];
  const call = choice?.message?.tool_calls?.[0];
  if (call?.function?.name === "return_step_card") {
    return JSON.parse(call.function.arguments);
  }

  // 兜底：模型直接回复文本时尝试解析/或返回原文
  return { rawText: choice?.message?.content ?? "" };
}
```

> 备注：
>
> * 混元“**stop** 参数语义**与 OpenAI 不同**（在匹配到 stop **之后**停止），若用 stop，需注意输出差异；官方提示未来可能调整保持一致。([腾讯云][2])
> * 混元 **流式**也支持（`stream` + `stream_options.include_usage`）。如需 usage 统计放到最后一个块。([腾讯云][2])

---

### 4) Embeddings 兼容层（向量维度注意事项）

```ts
// src/ai/embeddings.ts
import { createAIClient } from "./index";

export async function embed(texts: string[]) {
  const client = createAIClient();
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();

  const model =
    provider === "hunyuan" ? "hunyuan-embedding" : (process.env.EMBED_MODEL || "text-embedding-3-large");

  const res = await client.embeddings.create({ model, input: texts });
  return res.data.map(d => d.embedding);
}
```

* 混元 `/v1/embeddings` 当前**固定模型名** `hunyuan-embedding`、**维度固定 1024**，仅支持 `input/model` 参数。若你之前在 OpenAI 侧用 3072 维，**请在向量库里记录 provider/维度**，或各自建索引，避免混用一张表。([腾讯云][2])

---

### 5) 什么时候仍然用 OpenAI Responses + JSON Schema？

* 你的“**严格结构化输出**”在 OpenAI 上可用 **Responses API + JSON Schema**，但混元当前**未文档化**“`response_format: json_schema`”能力；跨平台最稳的是**函数调用**（上文方案已统一）。
* 若你在 OpenAI 侧想继续走 Responses，也可在 `AI_PROVIDER=openai` 分支保留原实现（`/v1/responses`），在 `hunyuan` 分支走 `/v1/chat/completions`。两者对上层接口保持一致即可。

---

## 开发者备忘（混元要点）

* **baseURL**：`https://api.hunyuan.cloud.tencent.com/v1`；**API Key** 在控制台创建（用 `Authorization: Bearer <key>`）。([腾讯云][2])
* **Chat Completions/多轮对话**：同 OpenAI；必要时可加混元**自定义参数**（如 `enable_enhancement`）。([腾讯云][2])
* **Function Calling**：标准两段式流程（模型给出函数名+参数 → 你执行 → 带结果再问模型）。([腾讯云][2])
* **差异点**：`stop` 语义、`stream_options.include_usage`、Embeddings 模型/维度固定等。([腾讯云][2])

---

要不要我**把上述 3 个文件直接按你仓库路径**（例如 `marketing-automation-desktop/src/ai/…`）整理成一次提交版本，并把“步骤卡片”UI 调用切到 `generateStepCard()`？

[1]: https://cloud.tencent.com/document/product/1729/111006 "腾讯混元大模型 OpenAI 兼容接口-文档中心-腾讯云"
[2]: https://cloud.tencent.com/document/product/1729/111007 "腾讯混元大模型 混元 OpenAI 兼容接口相关调用示例_腾讯云"
