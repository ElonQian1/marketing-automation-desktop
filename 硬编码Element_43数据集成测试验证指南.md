# 硬编码 Element_43 数据集成测试验证指南

## 📋 快速验证清单

### 1. 立即验证步骤

1. **确认开发模式已启用**

   ```typescript
   // 在 hardcoded-element43-data.ts 中确认
   static readonly DEVELOPMENT_MODE = true; // ✅ 应该是 true
   ```

2. **打开任何使用 FloatingVisualWindow 的界面**

   - 进入结构匹配相关页面
   - 或任何使用 `useStepCardData` Hook 的组件

3. **检查控制台输出**
   - 应该看到：`🚧 [HardcodedElement43] 开发模式启用 - 使用硬编码 Element_43 数据`
   - 数据统计信息输出

### 2. 预期表现

#### ✅ 正确表现

- **无需真实步骤卡片数据**：即使没有提供 `stepCardData`，也会自动加载硬编码数据
- **固定的元素结构**：始终显示 Element_43 的 4 层嵌套结构
- **一致的边界**：根元素边界固定为 `[13,1158][534,2023]`
- **可点击元素标识**：4 个可点击元素被正确识别
- **截图显示**：显示真实截图或 SVG 占位符

#### 🔍 关键日志标识

```
🚧 [HardcodedElement43] 开发模式启用 - 使用硬编码 Element_43 数据
📊 [HardcodedElement43] 数据统计: {
  rootElement: "element_43 (FrameLayout - 用户点击的元素)",
  bounds: "[13,1158][534,2023]",
  childElements: "9个子元素 (4层深度)",
  clickableElements: 4,
  screenshotMode: "真实截图 + SVG占位符"
}
```

### 3. 详细元素结构验证

#### 根元素 (element_43)

- **类型**: FrameLayout
- **边界**: [13,1158][534,2023]
- **可点击**: false (外层容器)
- **content_desc**: "笔记 深圳也太牛了，取消了！ 来自小何老师 55 赞"

#### 关键子元素

- **element_44**: 真正可点击的 FrameLayout (✅ clickable)
- **element_47**: 笔记封面图片 (ImageView)
- **element_49**: 底部作者信息栏 (✅ clickable)
- **element_51**: 作者名文字 "小何老师"
- **element_52**: 点赞按钮 (✅ clickable)
- **element_53**: 点赞数 "55" (✅ clickable)

### 4. 功能边界验证

#### ✅ 应该工作的场景

- 结构匹配可视化窗口正常显示
- 元素边界标注准确
- 可点击元素高亮正确
- 截图与元素对齐准确

#### ⚠️ 注意事项

- 硬编码数据**不会触发**边界智能修正（因为已被禁用）
- 使用的是用户精确选择的元素 (element_43)
- 开发模式下忽略真实的 XML 解析

### 5. 关闭硬编码模式

当需要回到生产模式时：

```typescript
// 在 hardcoded-element43-data.ts 中修改
static readonly DEVELOPMENT_MODE = false; // 改为 false
```

## 🚨 问题排查

### 如果没有看到硬编码数据

1. 检查 `DEVELOPMENT_MODE` 是否为 `true`
2. 确认控制台是否有相关日志
3. 检查是否有其他错误阻断了加载

### 如果显示异常

1. 查看控制台错误信息
2. 确认类型定义是否正确导入
3. 验证 `useStepCardData` Hook 是否被正确调用

## 🎯 测试重点

这个硬编码实现的核心价值：

- **固定数据源**：开发期间不依赖真实 XML 文件
- **结构一致性**：每次测试都使用相同的元素层级
- **边界精确性**：验证视口裁剪和元素对齐逻辑
- **模块化设计**：可以轻松开启/关闭，不影响生产代码

按照这个指南验证后，硬编码的 Element_43 数据应该能为结构匹配功能提供稳定的测试基础。
