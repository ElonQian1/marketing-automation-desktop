# 容器 Bounds 传递修复 - 测试指南

## 🎯 修复概述

**问题**：前端生成的 `structural_signatures` 缺少 `container.fingerprint.hints.selected_element_bounds`，导致后端 SM Runtime 无法使用容器限域功能，默认从根节点搜索（container_id=0）。

**修复方案**：
1. ✅ **前端修复**：在 `use-hierarchical-matching-modal.ts` 的 `generateStructuralSignatures()` 中添加 `fingerprint.hints` 结构
2. ✅ **后端准备**：V3 SM Integration 已有 `extract_container_hint_from_structural_sigs()` 函数等待提取 bounds

---

## 📋 测试步骤

### 1. 重启前端（必须）
```powershell
# 停止当前运行的 dev 服务器（Ctrl+C）
npm run tauri dev
```

### 2. 创建测试步骤
1. 打开"页面分析"
2. 加载 XML 文件：`ui_dump_e0d909c3_20251030_122312.xml`
3. 点击 element_32（瀑布流卡片）
4. 生成步骤卡片

### 3. 配置结构匹配
1. 在步骤卡片上点击策略菜单
2. 选择"静态策略" → "结构匹配"
3. 模态框打开后**直接点击"确定"**（不做任何修改）

### 4. 执行步骤
点击"执行步骤"按钮

---

## ✅ 预期结果

### 前端日志（浏览器控制台）
```javascript
✅ [Enhanced] 增强结构化签名生成完成: {
  skeletonRules: 3,
  containerRole: 'FrameLayout',
  depth: 1,
  hasResourceId: true,
  hasContentDesc: false,
  hasText: false,
  hasBounds: true,  // ✅ 新增！
  bounds: [546, 225, 1067, 1083]  // ✅ 新增！
}
```

```javascript
[StructuralMatchingModal] 最终结构签名: {
  "container": {
    "role": "AUTO_DETECT",
    "depth": 1,
    "fingerprint": {  // ✅ 新增结构！
      "role": "AUTO_DETECT",
      "hints": {
        "selected_element_id": "32",
        "selected_element_bounds": [546, 225, 1067, 1083],  // ✅ bounds 数组！
        "selected_element_class": "android.widget.FrameLayout",
        "strategy": "scrollable_ancestor"
      }
    }
  },
  "skeleton": [...]
}
```

### 后端日志（Tauri终端）
```
✅ [V3 SM Integration] 提取容器提示成功: bounds=[546, 225, 1067, 1083]
✅ [V3 SM Integration] 容器提示已提取，将传递给SM Runtime
✅ [SM Runtime] 通过bounds定位到节点: node_id=32, bounds=(546, 225, 1067, 1083)
🏗️ [SM Runtime] 容器限域完成: container_id=XX (RecyclerView的ID，不是0！)
```

---

## ❌ 失败标志

### 前端日志
```javascript
✅ [Enhanced] 增强结构化签名生成完成: {
  ...
  hasBounds: false,  // ❌ bounds 未提取
  bounds: undefined  // ❌ 无 bounds 数据
}
```

```javascript
{
  "container": {
    "role": "AUTO_DETECT",
    "depth": 1
    // ❌ 缺少 fingerprint 字段
  }
}
```

### 后端日志
```
⚠️ [V3 SM Integration] 未能提取容器提示，SM将使用根节点作为起点
ℹ️ [SM Runtime] 无bounds提示，使用根节点0
```

---

## 🔍 调试检查点

### 1. 确认前端 bounds 数据来源
```javascript
// 在 use-hierarchical-matching-modal.ts 的 generateStructuralSignatures() 中添加调试：
console.log('🔥 [DEBUG] selectedElement.bounds:', selectedElement.bounds);
console.log('🔥 [DEBUG] typeof bounds:', typeof selectedElement.bounds);
```

### 2. 确认后端接收到的数据
查看后端日志中的：
```
🏗️ [V3 SM Integration] structural_signatures: {...}
```

确认 JSON 中包含：
- `container.fingerprint`
- `container.fingerprint.hints`
- `container.fingerprint.hints.selected_element_bounds`

### 3. 如果前端 bounds 为 undefined
检查步骤卡片的 `originalElement` 或 `card` 数据中是否包含 bounds：
```javascript
// CompactStrategyMenu.tsx 中的日志
⚠️ Fallback 1: 使用步骤卡片数据 {
  id: 'element_32',
  bounds: {left: 546, top: 225, right: 1067, bottom: 1083}  // ← 确认存在
}
```

---

## 📝 相关文件

### 前端修改
- `src/modules/structural-matching/hooks/use-hierarchical-matching-modal.ts` (Line 361-402)
  - 添加 bounds 提取逻辑
  - 添加 `container.fingerprint.hints` 结构

### 后端代码（无需修改，已准备就绪）
- `src-tauri/src/exec/v3/helpers/sm_integration.rs`
  - `extract_container_hint_from_structural_sigs()` 函数会提取 bounds

---

## 🎉 成功标志

当看到以下三者同时出现时，说明修复成功：

1. ✅ **前端日志**：`hasBounds: true, bounds: [546, 225, 1067, 1083]`
2. ✅ **后端日志**：`✅ [V3 SM Integration] 提取容器提示成功`
3. ✅ **后端日志**：`🏗️ [SM Runtime] 容器限域完成: container_id=XX` （XX 不是 0）

---

## 🚨 注意事项

1. **必须重启前端**：修改了 TypeScript 代码，需要重新编译
2. **使用相同 XML**：确保使用包含 element_32 的 XML 文件
3. **不要修改模态框配置**：直接点击"确定"使用默认配置
4. **查看完整日志**：确认所有关键日志都出现

---

## 📞 如果遇到问题

1. **前端 bounds 为 undefined**：检查步骤卡片数据是否包含 bounds
2. **后端未提取到 bounds**：检查前端发送的 JSON 结构是否正确
3. **container_id 仍为 0**：检查 XML 中是否存在 RecyclerView 祖先节点
