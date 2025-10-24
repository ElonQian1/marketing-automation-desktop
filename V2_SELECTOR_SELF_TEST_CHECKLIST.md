# V2 智能选择器系统 - 一眼自测清单

## 🎯 目标
无需看代码，只看日志就能判断实现是否按预期工作。

## 📋 完整自测流程（按顺序检查）

### 1️⃣ **选择器来源验证**

**预期日志模式**:
```
🎯 selector_source=Inline
✅ 使用卡片内联selector
```

**或者**:
```  
🎯 selector_source=Store
✅ 从step_id查询store获得selector
```

**❌ 错误信号**:
- `selector_source=None` + `❌ 无任何有效selector来源`
- 只看到 `selector: "element_element_79"` 字符串

---

### 2️⃣ **选择器字段验证**

**预期日志模式**:
```
🔍 最终搜索条件: text=Some("登录"), xpath=None, resourceId=Some("btn_login"), className=Some("Button"), contentDesc=None
✅ 自测通过: 至少有一个selector字段非None
```

**❌ 错误信号**:
```
🔍 最终搜索条件: text=None, xpath=None, resourceId=None, className=None, contentDesc=None  
❌ 自测失败: 所有selector字段均为None - 必定触发NO_SELECTOR
```

---

### 3️⃣ **匹配与评分验证**

**预期日志模式**:
```
🎯 ResourceId强匹配: btn_login <-> com.app:id/btn_login  
🔍 双重唯一性: 总候选=3, 高质量(≥0.70)=1, Top1=0.863, Gap=0.245, 唯一性=1 (conf:true gap:true)
```

**关键指标**:
- **强锚点匹配**: `🎯 ResourceId强匹配` 或 `🎯 XPath强匹配`
- **唯一性**: `唯一性=1` + (`conf:true` 或 `gap:true`)
- **置信度**: `Top1 ≥ 0.70`

**❌ 错误信号**:
- `唯一性>1` 且 `conf:false gap:false`
- `Top1 < 0.70`

---

### 4️⃣ **安全闸门验证**

**预期日志模式**:
```
✅ 自测通过: 非容器/整屏节点 class=Some("Button") bounds=(540,1200,780,1350)
```

**❌ 错误信号**:
```
🚫 自测检查: 整屏节点被拦截 bounds=(0,0,1080,2400)
🚫 自测检查: 容器节点被拦截 class=Some("ViewGroup")
⚠️ 置信度不足: 0.623 < 0.700 (阈值)
```

---

### 5️⃣ **坐标兜底验证（如启用）**

**预期日志模式**:
```
🎯 执行坐标Hit-Test
✅ 自测坐标Hit-Test: leaf=Some("Button") 面积=32400 坐标=(660,1275)
✅ Hit-Test成功: 匹配到Some("Button") (面积=32400)
```

**❌ 错误信号**:
```
🚫 Hit-Test命中整屏节点，跳过
🚫 Hit-Test命中容器节点: Some("LinearLayout")，跳过  
❌ Hit-Test失败: 坐标(660,1275)未命中任何有效节点
```

---

### 6️⃣ **解歧建议验证（多实例场景）**

**预期日志模式**:
```
⚠️ 匹配到3个元素，违反唯一性约束。建议: ["具体文本内容", "leaf_index定位", "xpath_prefix祖先路径"]
返回: NON_UNIQUE: 匹配到3个元素。建议添加: 具体文本内容, leaf_index定位, xpath_prefix祖先路径
```

---

## 🚨 快速排错指南

### **问题1: 收到 `NO_SELECTOR` 错误**
```
检查: selector_source + 选择器字段
原因: 前端只发了内部ID，后端无法映射到具体选择器
解决: 确保前端同时发送structured_selector对象和step_id
```

### **问题2: 命中整屏坐标 (0,0,1080,2400)**  
```
检查: 容器/整屏拦截日志
原因: 匹配到DecorView/ViewGroup等容器节点
解决: 确保forbid_fullscreen_or_container=true生效
```

### **问题3: 收到 `NON_UNIQUE` 错误**
```
检查: 双重唯一性日志中的Gap值
原因: 多个高置信度候选，Top1-Top2间隔<0.15
解决: 按建议添加更具体的锚点（text/resourceId/leaf_index等）
```

### **问题4: 收到 `LOW_CONFIDENCE` 错误**
```
检查: 强锚点匹配日志
原因: 缺少resource-id/xpath等强证据，只有弱匹配
解决: 重新采集，选择有稳定resourceId的元素
```

---

## ✅ 完整成功案例日志

```
🎯 selector_source=Inline
✅ 使用卡片内联selector
🔍 最终搜索条件: text=Some("登录"), resourceId=Some("com.app:id/btn_login"), className=Some("Button")
✅ 自测通过: 至少有一个selector字段非None
🎯 ResourceId强匹配: com.app:id/btn_login <-> com.app:id/btn_login
🔍 双重唯一性: 总候选=1, 高质量(≥0.70)=1, Top1=0.863, Gap=1.000, 唯一性=1 (conf:true gap:true)  
✅ 自测通过: 非容器/整屏节点 class=Some("Button") bounds=(540,1200,780,1350)
✅ 匹配成功: 坐标(660,1275), 置信度=0.863
```

---

**使用方法**: 
1. 运行测试案例
2. 对照上述6个验证点逐一检查日志
3. 任何一项不符合预期→按排错指南定位问题
4. 全部符合→系统工作正常

**优势**: 无需翻代码，5分钟内确定实现质量。