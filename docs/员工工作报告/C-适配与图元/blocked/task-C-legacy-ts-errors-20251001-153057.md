任务 ID: C-20251001-153057
状态: blocked
创建时间（台北）: 2025-10-01 15:30:57 (UTC+08:00)
主题: 遗留 TS 错误（Universal UI 与旧页面）

---

## 概述
- type-check 结果显示 ~76 个错误，集中于 Universal UI、旧 Demo/Page、别名模块缺失与类型形状不一致。
- 与本次适配层/图元工作无直接关联，但会影响仓库全局 type-check 通过。

## 样例
- UIElement 类型字段差异：class/displayName/searchKeywords 等
- Set 与 Array 期望不一致（selectedAncestors）
- 模块别名引用失效（@/components/* 在部分示例/旧页）

## 下一步建议
- 开新分支集中治理 Universal UI 类型：统一 UIElement/UiNode/EnhancedUIElement 的字段与选择器
- 处理示例与旧页面的别名引用或下线
- 在 CI 加入“宽松型”检查仅覆盖新模块；逐步扩大范围

## 不阻塞声明
- 本卡不阻塞适配层与 Pattern 的页面验收；相关验收在 BrandShowcasePage 已提供局部入口
