## 策略识别和执行示例

### 示例1：标准匹配策略

```json
{
  "id": "step-001",
  "name": "点击关注按钮",
  "step_type": "smart_find_element",  // ← 第一层判断：这是智能查找步骤
  "parameters": {
    "matching": {                     // ← 第二层解析：策略参数
      "strategy": "standard",         // ← 策略类型：标准匹配
      "fields": ["resource-id", "text"],
      "values": {
        "resource-id": "com.xingin.xhs:id/follow_btn",
        "text": "关注"
      }
    }
  }
}
```

**执行路径：**
1. `isSmartFindElementType("smart_find_element")` → `true`
2. 走策略匹配路径：`executeStrategyTest()`
3. `buildCriteriaFromStep()` 解析出策略 = `"standard"`
4. 调用 `matchElementByCriteria(deviceId, criteria)`

### 示例2：隐藏元素策略

```json
{
  "id": "step-002", 
  "name": "点击隐藏的返回按钮",
  "step_type": "smart_find_element",  // ← 第一层判断：智能查找
  "parameters": {
    "matching": {
      "strategy": "hidden-element-parent",  // ← 策略类型：隐藏元素父查找
      "fields": ["text", "content-desc"],
      "values": {
        "text": "返回",
        "content-desc": "返回按钮"
      },
      "hiddenElementParentConfig": {    // ← 隐藏元素特有配置
        "targetText": "返回",
        "maxTraversalDepth": 5,
        "clickableIndicators": ["Button", "ImageButton"]
      }
    }
  }
}
```

**执行路径：**
1. `isSmartFindElementType("smart_find_element")` → `true`
2. 走策略匹配路径：`executeStrategyTest()`
3. `buildCriteriaFromStep()` 解析出策略 = `"hidden-element-parent"`
4. 调用 `matchElementByCriteria(deviceId, criteria)`
5. 在 `TauriUiMatcherRepository` 中被特殊处理

### 示例3：普通动作步骤

```json
{
  "id": "step-003",
  "name": "点击坐标",
  "step_type": "tap",                 // ← 第一层判断：这不是智能查找
  "parameters": {
    "x": 500,
    "y": 800,
    "hold_duration_ms": 100
  }
}
```

**执行路径：**
1. `isSmartFindElementType("tap")` → `false`
2. 走动作执行路径：`executeActionOnce()`
3. 调用后端 `execute_single_step_test`
4. 进入 `SmartScriptExecutor.execute_single_step()`
