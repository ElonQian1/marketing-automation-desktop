我刚把你仓库最新结构扫了一遍（根目录能看到 `src/`、`src-tauri/`、一堆设计文档与配置：`ARCHITECTURE_REFACTOR_PLAN.md`、`STEP_CARD_REFACTOR_COMPLETED.md`、`tsconfig.*`、`tailwind.config.js` 等等），说明你已经把“AI/步骤卡片/事件路由/前后端分层”做了不少铺垫。基于**当前状态**，我建议你把“精准获客”这条链路按下面方式落地：先**闭环跑通**（评论→AI意图→前端汇总→生成“回放计划”），ADB 真机部分用**可插拔模拟层**占位；等 dump 完成后只换 Provider 即可，无需改上层业务。([GitHub][1])

---

# 最小闭环架构（马上可加进仓库）

## 1) 领域模型（统一放后端）

* `LeadComment`：一条社媒评论
  `id, platform(douyin|xhs), video_url, author, content, ts`
* `LeadAnalysis`：AI 识别结果
  `comment_id, intent(询价|询地址|售后|咨询|无效), confidence, entities(product/location/phone/priceTarget...), reply_suggestion, tags[]`
* `ReplayPlan`：回放计划（未来给 ADB 执行）
  `comment_id, platform, video_url, author, target_text, suggested_reply`

> 存储：SQLite 两张表（`lead_comments`、`lead_analyses`），另加一张 `replay_plans` 作为**任务队列**（status: pending|running|done|failed）。先从文件 JSON 也行，准备好表更利于后续任务重试/观测。

## 2) Provider 抽象（为 ADB 预留、先用 Mock）

```rust
// src-tauri/src/device/provider.rs
#[async_trait::async_trait]
pub trait DumpProvider {
  async fn open_app(&self, platform: &str) -> anyhow::Result<()>;
  async fn open_video(&self, url: &str) -> anyhow::Result<()>;
  async fn dump_xml(&self) -> anyhow::Result<String>; // 返回当前屏XML
  async fn reply(&self, author: &str, text: &str) -> anyhow::Result<()>;
}
```

* `MockDumpProvider`（先用它）：`dump_xml()` 读内置模板/生成接近真实的 XML；`reply()` 只写日志/事件（不触设备）。
* `AdbDumpProvider`（日后接）：真正调用 ADB/scrcpy/UIAutomator。

## 3) Orchestrator（把计划变为动作）

```rust
// src-tauri/src/device/orchestrator.rs
pub struct ReplayOrchestrator<P: DumpProvider> { pub p: P }

impl<P: DumpProvider> ReplayOrchestrator<P> {
  pub async fn run(&self, plan: &ReplayPlan) -> anyhow::Result<()> {
    self.p.open_app(&plan.platform).await?;
    self.p.open_video(&plan.video_url).await?;
    let xml = self.p.dump_xml().await?;
    // TODO: 在XML里定位目标评论（作者/内容相似度/邻接结构）
    self.p.reply(&plan.author, &plan.suggested_reply).await?;
    Ok(())
  }
}
```

* 现在用 `ReplayOrchestrator<MockDumpProvider>` 跑；ADB 就绪后只换模板参数。

## 4) AI 管道（OpenAI/混元两边都能跑）

* 前端把评论批量交给后端命令 `lh_analyze_comments`（或保持你现有前端并发调用 `ai_chat` 的方式），统一使用**函数调用（tools）**返回结构化 JSON（我们之前给你的 `return_lead_analysis` 就是这个工具）。
* 结果入库到 `lead_analyses`，并生成推荐 `ReplayPlan`（暂不执行）。

## 5) 前端页面（Lead Hunt）

* 列表：评论 + `intent/置信度/建议回复` + 过滤器（意图、平台）
* 右侧详情：实体抽取（产品、数量、地址、联系方式…） + 一键“生成回放计划”/“执行模拟”
* 事件提示：`ai://stream`（分析进度）、`orchestrator://status`（模拟执行日志）

---

# 你现在代码里要加/改的点（按目录）

## A. 后端（Tauri / Rust）

1. **模块骨架**

   * `src-tauri/src/device/provider.rs`（Trait）
   * `src-tauri/src/device/mock.rs`（MockDumpProvider）
   * `src-tauri/src/device/orchestrator.rs`（执行器）
2. **服务层（精准获客）**

   * `src-tauri/src/services/lead_hunt.rs`：读写 `lead_comments/lead_analyses/replay_plans`（先 JSON，后 SQLite）
3. **命令（给前端用）**

   * `lh_import_comments`：导入 mock/CSV/手粘贴
   * `lh_list_comments`：列评论（可联查分析结果）
   * `lh_analyze_comments`：后端批处理调用 AI（走你现有的 `ai_chat` 路由，Provider 可切）
   * `lh_create_replay_plan`：落盘计划（pending）
   * `lh_run_replay_plan`：用 `ReplayOrchestrator<MockDumpProvider>` 执行；事件广播到前端

> 你的 repo 里已有 AI 接入、事件路由、命令注册的基础（`src-tauri/`与多份实施报告），把这些命令挂上去基本不需要推翻现状。([GitHub][1])

## B. 前端（React）

1. `src/pages/LeadHunt.tsx`（或放在 `src/features/lead-hunt/`）

   * 表格 + 过滤 + 右侧详情 + “生成回放计划/执行模拟”按钮
2. 复用你已做的**设置页**（选择 OpenAI/混元、默认模型、温度、是否流式）
3. 将批量分析调用收敛成一个 hook（我们之前给的 `analyzeBatch` 可直接用/搬到后端命令也可）

---

# 路线图（小步快跑，3 个 PR）

**PR-1：数据与协议（半天）**

* 新建类型与表（或 JSON 文件存储）
* 增加 `lh_import_comments / lh_list_comments / lh_create_replay_plan` 三个命令
* 前端页：能导入、能看到评论列表、能手动点“生成回放计划”（写到 `debug/outbox/replay_plans.json`）

**PR-2：AI 意图识别（0.5–1 天）**

* 后端 `lh_analyze_comments`：串 AI Provider（走 tools 函数；OpenAI/混元任选）
* 入库 `lead_analyses`，前端联表展示（意图/置信/建议回复/实体）
* 过滤器与基本统计（多少询价、多少售后）

**PR-3：回放模拟与可替换 Provider（0.5 天）**

* `MockDumpProvider + ReplayOrchestrator` 跑通“执行模拟”，前端显示执行日志
* 预留 `AdbDumpProvider` 文件/空实现与配置项；等 dump 完成后只替换 Provider

---

# 关键实现注意

* **定位算法先行**：在 Mock XML 里模拟“作者节点 + 紧邻评论文本 + 列表分页”，你可以先做“作者+评论模糊匹配 + 列表中相对定位”策略，等真机 dump 后只调参数。
* **Embedding 维度差异**：混元 embedding 维度与 OpenAI 可能不同，若你要做“相似评论匹配”，请在向量表里加 `provider/model/dim` 字段分库。
* **速率与重试**：批量评论分析要做队列/并发控制（4~8 并发 + 指数退避，429/5xx 重试）；你已有事件系统，顺手把进度 emit 出来。
* **可观测性**：给每条评论/分析/计划打 `trace_id`，日志里串起来，问题好排查。
* **数据合规**：评论里常含个人信息（手机号/微信号），落库前做脱敏（后 4 位保留），前端仅在详情中“点按显示”。

---

# 你现在就能做的 3 个具体提交

1. **后端骨架 + MockDumpProvider**

   * `src-tauri/src/device/provider.rs / mock.rs / orchestrator.rs`
   * `src-tauri/src/services/lead_hunt.rs`（读写 JSON）
   * `lh_*` 命令 + 事件广播

2. **前端页面**

   * `src/pages/LeadHunt.tsx`（列表/筛选/详情/模拟按钮）
   * 把“AI 设置”入口放进导航，保证 Provider 可切

3. **AI 函数工具**

   * `return_lead_analysis`（我们之前给你的 JSON Schema/Tool 直接复用）
   * 对接后端 `lh_analyze_comments` 批量跑，写入 `lead_analyses`

---

如果你愿意，我可以**直接按你仓库的路径名**把以上文件骨架（Trait、Orchestrator、命令、页面、hook）整理成一个“PR-1 初始化包”。你只要合并，就能立刻在 UI 内导入评论、用 AI 标注、生成并执行“模拟回放计划”。

[1]: https://github.com/ElonQian1/marketing-automation-desktop "GitHub - ElonQian1/marketing-automation-desktop: 通用营销自动化工具"
