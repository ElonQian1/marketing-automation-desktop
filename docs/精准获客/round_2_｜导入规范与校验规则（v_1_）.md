# Round 2｜导入规范与校验规则（v1）

> 目标：确保**候选池 CSV** 与 **日报导出**在任何人手上都能稳定复现，无歧义、可验证。

---

## 1) 候选池 CSV 模板（强约束）
文件：`候选池_import_template.csv`

**列定义与要求：**
- `type`：`video`/`account`（必填）
- `platform`：`douyin`/`oceanengine`/`public`（必填）
- `id_or_url`：平台唯一 ID 或 URL（必填，URL 建议含协议头）
- `title`：视频标题或账号昵称（可空）
- `source`：`manual`/`csv`/`whitelist`/`ads`（必填）
- `industry_tags`：`;` 分隔的枚举标签（可空但推荐）
- `region`：区域枚举（可空）
- `notes`：备注（可空）

**示例行：**
```
video,douyin,https://www.douyin.com/video/xxxx,示例视频,榜单:口腔护理,口腔;健康,华东,——
account,douyin,https://www.douyin.com/user/xxxx,示例作者,人工添加,母婴,全国,——
```

---

## 2) 校验规则（导入前自动检查）
- **必填校验**：`type/platform/id_or_url/source` 不能为空。
- **格式校验**：
  - URL 必须合法（`http/https`）；
  - `platform` 只能取预置枚举；
  - `industry_tags` 必须全部在**标签白名单**中；
  - `region` 必须在区域白名单；
- **唯一性**：`platform + id_or_url` 为唯一键；重复→视为更新。
- **合规校验**：
  - `platform=public` 时，必须在《白名单数据源清单》中出现且标记“允许抓取”；
  - 若无法证明允许→整行拒绝导入并给出原因。

---

## 3) 错误码与处理
| 错误码 | 说明 | 处理建议 |
|---|---|---|
| E_REQUIRED | 缺少必填列 | 补齐字段后重试 |
| E_ENUM | 枚举取值非法 | 修正为白名单值 |
| E_URL | URL 非法 | 填写合法 URL |
| E_DUP | 重复记录 | 自动转为更新（提示） |
| E_NOT_ALLOWED | 白名单不允许或缺失依据 | 与 PM/法务确认后再导入 |

---

## 4) 日报导出格式（只读）
- **关注清单**：`关注日期,关注账号ID`
- **回复清单**：`日期,视频链接,评论账户ID,评论内容,回复账号ID,回复内容`

> 任何新增字段都必须经过 PM 与法务确认后再加入导出，避免越权数据扩散。

---

## 5) 去重与映射（导入阶段）
- 候选池去重键：`sha1(platform + ':' + id_or_url)`
- 评论去重键：`sha1(platform + ':' + comment_id)`（采集阶段执行）
- 标签映射：对外 CSV 的中文标签 → 内部枚举（维护映射表），避免拼写差异造成脏数据。

---

## 6) 审计要求
- 每次导入生成一条 `audit_logs` 记录（action=`IMPORT`），包含：操作者、行数、成功/失败计数、失败原因摘要（脱敏）。

---

## 7) 质检清单（DoD）
- 任意人使用模板可**零歧义**导入；
- 枚举/白名单错误可明确报错并给出修复建议；
- 导入日志可被追溯（操作者、时间、影响范围）。

