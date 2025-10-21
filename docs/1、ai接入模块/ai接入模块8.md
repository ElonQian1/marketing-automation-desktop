太好了！我把“精准获客”闭环拆成**3个可独立提交的PR任务包**，每个都能单独合并生效，方便你丢给 AI 代理开工。每个任务都包含：**要改/新增的文件清单、函数签名、接口/命令、完成标准（DoD）、手工验证步骤、建议 commit 信息**。
（说明：若你的仓库已有同名文件/模块，请**合并实现**而不是覆盖。）

---

## 任务包 PR-1：数据与协议初始化（导入评论 → 列表 → 生成“回放计划”到文件）

```text
# 任务包 PR-1 - Lead Hunt 基础闭环（无 AI，无 ADB）
目标：前端导入评论 → 后端存储/读取 → 一键生成“回放计划”写入 debug/outbox/replay_plans.json，前端可见状态为“模拟”

【新增/修改文件（后端 Rust / Tauri）】
1. src-tauri/src/services/lead_hunt.rs
   - 类型：
     struct RawComment { id:String, platform:String, videoUrl:Option<String>, author:String, content:String, ts:Option<i64> }
     struct ReplayPlan  { id:String, platform:String, videoUrl:String, author:String, comment:String, suggested_reply:Option<String> }
   - 函数：
     fn save_comments(items: Vec<RawComment>) -> anyhow::Result<()>
     fn list_comments() -> anyhow::Result<Vec<RawComment>>
     fn write_replay_plan(plan: ReplayPlan) -> anyhow::Result<()>
     说明：数据先落盘 JSON（app_data_dir/lead_hunt/comments.json；debug/outbox/replay_plans.json）

2. src-tauri/src/commands_lead_hunt.rs
   - #[tauri::command] fn lh_save_comments(items: Vec<RawComment>) -> Result<(), String>
   - #[tauri::command] fn lh_list_comments() -> Result<Vec<RawComment>, String>
   - #[tauri::command] fn lh_import_comments() -> Result<(), String>
     实现：读取 src-tauri/src/mock/social_comments.json 写入 comments.json（最小可用）
   - #[tauri::command] fn lh_create_replay_plan(plan: ReplayPlan) -> Result<(), String>

3. src-tauri/src/mock/social_comments.json
   - 放 3~5 条演示数据（抖音/小红书混合）

4. src-tauri/src/main.rs
   - 注册上述命令到 invoke_handler!

【新增/修改文件（前端 React）】
1. src/pages/LeadHunt.tsx
   - 列表：platform/author/content
   - 顶部按钮：导入（调用 lh_import_comments）、刷新（lh_list_comments）
   - 行操作按钮：“生成回放计划”（调用 lh_create_replay_plan）

2. src/lib/mock/comments.sample.ts（可选）
   - 若你更喜欢前端先种子，再调用 lh_save_comments 也可以保留

【接口契约】
- invoke("lh_import_comments") -> 导入 mock；OK 返回空
- invoke("lh_list_comments") -> RawComment[]
- invoke("lh_create_replay_plan", { plan }) -> OK 返回空
  plan: { id, platform, videoUrl, author, comment, suggested_reply?: string }

【完成标准（DoD）】
- 运行 tauri dev，打开“精准获客”页
- 点击“导入评论”→ 列表显示 3~5 条
- 任意一行点“生成回放计划”，生成文件 debug/outbox/replay_plans.json，内容包含对应行信息
- 不依赖 AI，不依赖 ADB

【手工验证】
- Windows/Mac/Linux 均可生成 outbox 文件；再次点击会 append 新 plan
- 列表刷新正常，无崩溃日志

【建议提交信息（中文）】
feat(lead-hunt): 初始化精准获客模块，支持导入评论/列表/生成回放计划（模拟）
```

---

## 任务包 PR-2：AI 意图识别与建议回复（OpenAI/混元可切换）

```text
# 任务包 PR-2 - AI 意图识别（函数调用工具）
目标：批量把评论送入 AI（OpenAI/腾讯混元任选，走统一 ai_chat 命令），识别 intent/置信度/实体，给出建议回复；前端展示并可筛选

【新增/修改文件（前端）】
1. src/ai/schemas/leadIntent.schema.ts
   - 导出 LeadIntentTool（function-calling 工具）：return_lead_analysis，参数 schema:
     { intent: enum["询价","询地址","售后","咨询","无效"], confidence: [0..1],
       entities: { product, quantity, location, phone, priceTarget }, reply_suggestion: string, tags: string[] }

2. src/features/leadHunt/analyzeLead.ts
   - export async function analyzeOne(c: RawComment): Promise<LeadAnalysis>
   - export async function analyzeBatch(items: RawComment[], concurrency=4)
   - 使用 aiChat({ messages, tools:[LeadIntentTool], toolChoice:"auto" })，提取 tool_calls 第一个函数结果作为结构化输出

3. src/pages/LeadHunt.tsx
   - 顶部新增按钮“AI 批量分析”
   - 列表展示列：intent/置信度/建议回复（带筛选：全部/询价/询地址/售后/咨询/无效）

【新增/修改文件（后端，可选更稳妥方案）】
- 可将 analyzeBatch 下沉为 #[tauri::command] lh_analyze_comments()，便于统一限流/重试与入库持久化；
  如果先在前端调用 aiChat 跑通也可，后续再下沉。

【接口契约】
- aiChat 已在你的 AI 接入模块提供（provider: openai/hunyuan 可切换）
- 返回 res.choices[0].message.tool_calls[0].function.arguments 为 JSON 字符串

【完成标准（DoD）】
- AI 设置页选择某个 provider+模型（如 gpt-4o-mini 或 hunyuan-turbos-latest）
- “AI 批量分析”后，列表出现 intent/置信度/建议回复，过滤器可用
- 选一行点击“生成回放计划”，把建议回复一起带入 suggested_reply 字段写入 replay_plans.json

【注意事项】
- 并发数 4~8；429/5xx 做指数退避（200ms→400→800→…，最多 5 次）
- 输入脱敏：疑似手机号仅在详情页“点按显示”，列表显示打码（可后续做）
- 若走后端批处理：把结果入库到 lead_analyses，并联查渲染

【建议提交信息（中文）】
feat(lead-hunt): 接入AI意图识别（函数调用），支持批量分析与建议回复展示
```

---

## 任务包 PR-3：回放模拟执行器（可替换 Provider，ADB 未就绪前使用 Mock）

```text
# 任务包 PR-3 - 回放 Orchestrator + MockDumpProvider
目标：将回放计划真正执行一个“模拟流程”（打开 App → 打开视频链接 → dump → “找到评论” → 回复）。当前不用真机，只发事件日志，便于前端观察

【新增/修改文件（后端 Rust / Tauri）】
1. src-tauri/src/device/provider.rs
   #[async_trait] pub trait DumpProvider {
     async fn open_app(&self, platform: &str) -> anyhow::Result<()>;
     async fn open_video(&self, url: &str) -> anyhow::Result<()>;
     async fn dump_xml(&self) -> anyhow::Result<String>;
     async fn reply(&self, author: &str, text: &str) -> anyhow::Result<()>;
   }

2. src-tauri/src/device/mock.rs
   pub struct MockDumpProvider;
   impl DumpProvider for MockDumpProvider {
     // open_app/open_video: 发送日志事件 app.emit_all("orchestrator://status", "open_app xhs/douyin ...")
     // dump_xml: 返回内置 XML 字符串（做两条评论，模拟作者+文本）
     // reply: 仅写日志，表示“已回复 author: xxx 文本: yyy”
   }

3. src-tauri/src/device/orchestrator.rs
   pub struct ReplayOrchestrator<P: DumpProvider> { pub p: P }
   impl<P: DumpProvider> ReplayOrchestrator<P> {
     pub async fn run(&self, plan: &ReplayPlan) -> anyhow::Result<()> {
       self.p.open_app(&plan.platform).await?;
       self.p.open_video(&plan.videoUrl).await?;
       let xml = self.p.dump_xml().await?;
       // TODO: 在 xml 里匹配 author/comment（可先 contains/相似度），emit 找到/未找到的事件
       self.p.reply(&plan.author, plan.suggested_reply.as_deref().unwrap_or("")).await?;
       Ok(())
     }
   }

4. src-tauri/src/commands_lead_hunt.rs
   - 新增 #[tauri::command] fn lh_run_replay_plan(plan_id: String) -> Result<(), String>
     实现：从 replay_plans.json 读取 plan，构造 ReplayOrchestrator::<MockDumpProvider>().run(&plan)
     执行过程中通过 app.emit_all("orchestrator://status", "...") 推送步骤事件

【新增/修改文件（前端）】
1. src/pages/LeadHunt.tsx
   - 行操作新增“执行模拟”：invoke("lh_run_replay_plan", { planId: row.id })
   - 右侧/下方“执行日志”区域，listen("orchestrator://status") 实时显示

【完成标准（DoD）】
- 点击“执行模拟”可看到 open_app→open_video→dump→定位→reply 的流水日志
- 日志包含 plan 的 id/platform/videoUrl/author 关键信息
- 无 ADB 依赖，ADB 就绪后只需新增 AdbDumpProvider，并在配置处切换 Provider

【建议提交信息（中文）】
feat(lead-hunt): 新增回放 Orchestrator 与 MockDumpProvider，支持执行模拟与事件日志
```

---

## 统一约定 & 小贴士

* **代码块首行写文件相对路径**（你的一贯要求）。
* **Provider 可替换**：MockDumpProvider → AdbDumpProvider 只换实现；上层 Orchestrator 与 UI 不变。
* **Embedding/相似匹配（可后续）**：若要“相似评论定位”，请在向量表记录 `provider/model/dim` 避免混用维度。
* **事件总线**：AI 分析进度建议用 `ai://stream`；回放用 `orchestrator://status`，前端分别订阅。
* **安全**：评论里如有敏感信息（手机号/地址），入库前可做脱敏处理，详情页点击显示原文。
* **速率限制**：批量分析默认 4 并发，指数退避；可在设置页加“最大并发/最大重试”。

---

## 一条龙给 AI 代理的执行顺序（直接复制发给它）

```text
# 执行顺序（建议连续三次提交到 main 或分三PR提交）：

1) PR-1 数据与协议初始化
- 新增后端：services/lead_hunt.rs、commands_lead_hunt.rs、mock/social_comments.json；main.rs 注册命令
- 新增前端：pages/LeadHunt.tsx（导入/列表/回放计划）
- 手测：导入mock→列表显示→生成 replay_plans.json

2) PR-2 AI 意图识别
- 新增前端：ai/schemas/leadIntent.schema.ts、features/leadHunt/analyzeLead.ts
- LeadHunt 页面接“AI 批量分析”，展示 intent/置信度/建议回复 + 过滤
- 可选：将 analyzeBatch 下沉为 #[tauri::command] lh_analyze_comments，集中限流/入库

3) PR-3 回放模拟器
- 新增后端：device/provider.rs、device/mock.rs、device/orchestrator.rs；commands_lead_hunt.rs 增 lh_run_replay_plan
- 前端订阅 orchestrator://status，展示模拟执行日志
- 手测：执行模拟看到 open_app→open_video→dump→定位→reply 日志

# 提交信息模板（中文）
- feat(lead-hunt): 初始化精准获客数据与命令，支持导入/列表/回放计划
- feat(lead-hunt): 接入AI意图识别（函数调用），批量分析并展示建议回复
- feat(lead-hunt): 新增回放 Orchestrator + MockDumpProvider，执行模拟与事件日志

# 验收清单
- [ ] LeadHunt 页面可导入并显示评论
- [ ] 批量AI分析后可按意图过滤，置信度显示正确
- [ ] 生成的 replay_plans.json 含 videoUrl/author/comment/suggested_reply
- [ ] 执行模拟能看到全流程事件日志，无崩溃
```

---

需要我把**每个文件的空实现骨架**也一起写出来（按你仓库路径+首行路径规范）吗？我可以直接给到可编译的 stub 版本，让你的 AI 代理“填空补全”。
