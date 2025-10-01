任务 ID: A-20251002-000000
状态: open
创建时间（台北）: 2025-10-02 00:00:00 (UTC+08:00)
主题: 修复TreeView.tsx中UiNode相关错误

---

## 背景

TreeView.tsx中存在4个UiNode相关的TypeScript错误：
1. node.id属性不存在于UiNode类型
2. selectedAncestors类型不匹配（UiNode[] vs Set<UiNode>）
3. MatchCountSummary组件的matchedSet属性不存在
4. AdvancedFilterSummary组件缺少必需的props（value, onClear）

错误详情：
- `TreeView.tsx:50` - Property 'id' does not exist on type 'UiNode'
- `TreeView.tsx:58` - Type 'UiNode[]' is missing properties from type 'Set<UiNode>'
- `TreeView.tsx:69` - Property 'matchedSet' does not exist on MatchCountSummaryProps
- `TreeView.tsx:70` - Type '{}' is missing properties from AdvancedFilterSummaryProps

## 变更范围

- src/components/universal-ui/views/grid-view/components/TreeView.tsx（修复UiNode相关错误）

## 更新记录

- [2025-10-02 00:00:00] 识别TreeView.tsx中的UiNode相关错误
- [2025-10-02 00:00:00] 准备检查UiNode类型定义和组件接口

## 验证清单

- [ ] 检查UiNode类型定义，确认正确的属性名
- [ ] 修复selectedAncestors类型转换
- [ ] 检查MatchCountSummary和AdvancedFilterSummary组件接口
- [ ] 修复组件props错误
- [ ] 验证TypeScript编译通过