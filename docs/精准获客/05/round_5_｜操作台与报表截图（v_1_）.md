# Round 5｜操作台与报表截图（v1）

> 目的：规范“应当截图/导出”的页面与指标，便于日报提交与周会复盘；本文件为**截图说明**，不含真实图片。

---

## 1) 日报-操作台截图要求
- **任务完成概览**（当日）：
  - KPI：`reply_count`、`follow_count`、`tasks_done`、`tasks_failed`；
  - 图：按小时分布的“完成任务数折线图”；
- **风控概览**：
  - KPI：`rate_limit_hits`、`dedup_hits`、`circuit_open_count`；
  - 图：`result_code` 占比饼图；
- **账号与设备表现**：
  - 表：账号 × 设备 的完成量/失败率/平均响应时间；
  - TopK：失败原因前五、相似度过高前五模板。

> 截图需包含日期区间、筛选条件与版本号（界面右上角显示）。

---

## 2) 日报-文件截图要求
- 关注清单与回复清单 CSV 的**首屏**与**尾屏**（展示表头与总行数）；
- `meta.json`（若使用）中 `export_schema_version` 与时区配置；
- 错误报告（若有）：`error_report_YYYY-MM-DD.json` 的核心段落。

---

## 3) 审计-证据链截图要求
- 任一日报样本行的**任务详情页**：
  - 事件链：`TASK_CREATED → … → TASK_DONE`；
  - 回执：`external_receipt`（API）或“已发送备注/截图”（半自动）；
  - 频控/查重/敏感词提示痕迹。

---

## 4) 周会复盘（建议截图）
- 趋势：最近 7/30 天的 `reply_count`、`follow_count`、失败率；
- 风险：`RATE_LIMITED` 与 `DUPLICATED` 趋势；
- 模板：高表现模板 Top5 与需下线模板列表。

---

## 5) 截图规范
- 分辨率 ≥ 1280×720；
- 模糊/脱敏：遮蔽平台用户 ID 的部分位数；
- 命名：`YYYY-MM-DD_scene_name.png`；
- 存放：与日报同一目录，便于归档。

