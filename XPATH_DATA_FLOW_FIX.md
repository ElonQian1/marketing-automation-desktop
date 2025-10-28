# XPath 数据流修复方案

## 问题现状

### 1. 前端发送的数据问题
```typescript
// ❌ 当前发送（从日志）
{
  element_path: "element_element_124",  // 元素ID，不是XPath！
  targetText: undefined,                 // 未提取
  original_data: undefined               // 缺失
}
```

### 2. 静态分析应该生成的数据
```typescript
// ✅ 应该生成并保存
{
  element_path: "//*[@content-desc='添加朋友']",  // 全局XPath
  targetText: "添加朋友",
  original_data: {
    element_text: "添加朋友",
    element_bounds: "[42,110][293,247]",
    key_attributes: {
      "content-desc": "添加朋友",
      "resource-id": "com.ss.android.ugc.aweme:id/tv_desc"
    },
    original_xml: "...",  // 原始XML快照
    children_texts: []
  }
}
```

## 数据流断裂点

### 断裂点1: 静态分析 → 步骤卡片
**位置**: `src/api/universal-ui/static-analysis.ts`

```typescript
// ❌ 问题代码
function buildStepFromElement(element: VisualElement) {
  return {
    element_path: element.id,  // 只保存ID！
    // 缺少 xpath, targetText, original_data
  }
}

// ✅ 修复后
function buildStepFromElement(element: VisualElement, xmlSnapshot: string) {
  const xpath = generateGlobalXPath(element);  // 生成全局XPath
  
  return {
    element_path: xpath,  // 保存XPath
    targetText: element.text || element.contentDesc,
    original_data: {
      element_text: element.text,
      element_bounds: element.bounds,
      key_attributes: {
        "content-desc": element.contentDesc,
        "resource-id": element.resourceId,
        "class": element.className
      },
      original_xml: xmlSnapshot,
      children_texts: extractChildrenTexts(element)
    }
  }
}
```

### 断裂点2: 步骤卡片 → 智能分析
**位置**: `src/modules/script-builder/services/intelligentDataTransfer.ts`

```typescript
// ❌ 问题代码
function buildAnalysisRequest(step: StepCard) {
  return {
    element_path: step.element_path,  // 传递element_id
    // 缺少 original_data
  }
}

// ✅ 修复后
function buildAnalysisRequest(step: StepCard) {
  return {
    element_path: step.element_path,  // 现在是XPath
    targetText: step.targetText,
    original_data: step.original_data,  // 传递完整数据
    smartSelection: {
      targetText: step.targetText,
      // ...
    }
  }
}
```

## 修复计划

### Phase 1: 前端XPath生成 (P0 - 立即修复)
**文件**: `src/api/universal-ui/static-analysis.ts`

1. 实现 `generateGlobalXPath()` 函数
2. 保存完整 `original_data` 到步骤卡片
3. 确保数据传递到智能分析

### Phase 2: 后端数据提取增强 (P0 - 已部分完成)
**文件**: `src-tauri/src/exec/v3/chain_engine.rs`

✅ 已完成：
- targetText 多级提取 (smartSelection → top-level → original_data)
- 多候选评估系统

⏳ 待完成：
- 失败恢复：使用 original_xml + xpath 重新分析

### Phase 3: 测试验证
1. 测试"添加朋友"按钮识别
2. 测试多候选场景（如多个相同按钮）
3. 测试失败恢复机制

## 关键文件清单

### 前端文件
- `src/api/universal-ui/static-analysis.ts` - XPath生成
- `src/modules/script-builder/services/intelligentDataTransfer.ts` - 数据传递
- `src/modules/script-builder/domain/strategies/*.ts` - 策略定义

### 后端文件
- `src-tauri/src/exec/v3/chain_engine.rs` - 执行引擎
- `src-tauri/src/exec/v3/element_matching/` - 匹配系统（新增）
- `src-tauri/src/services/intelligent_analysis_service.rs` - 智能分析

## 验证检查点

```bash
# 1. 检查前端生成的步骤数据
console.log(step.element_path)  # 应该是 XPath，不是 "element_xxx"
console.log(step.original_data) # 应该包含 original_xml

# 2. 检查后端日志
# 应该看到：
✅ [XPath保留] 使用智能分析生成的完整XPath: //*[@content-desc='添加朋友']
✅ [targetText提取] 从smartSelection提取: "添加朋友"
✅ [original_data] 包含完整快照

# ❌ 不应该看到：
⚠️ [数据传递] 步骤缺少original_data
⚠️ 无 hint 提供，尝试通用智能元素评分
```

## 前端修复示例代码

```typescript
// src/api/universal-ui/static-analysis.ts

/**
 * 生成元素的全局XPath
 */
function generateGlobalXPath(element: VisualElement): string {
  // 优先级1: content-desc (最稳定)
  if (element.contentDesc) {
    return `//*[@content-desc='${escapeXPath(element.contentDesc)}']`;
  }
  
  // 优先级2: resource-id + 子元素text
  if (element.resourceId && element.text) {
    return `//*[@resource-id='${element.resourceId}'][.//*[@text='${escapeXPath(element.text)}']]`;
  }
  
  // 优先级3: resource-id
  if (element.resourceId) {
    return `//*[@resource-id='${element.resourceId}']`;
  }
  
  // 优先级4: text
  if (element.text) {
    return `//*[@text='${escapeXPath(element.text)}']`;
  }
  
  // 兜底: class + index
  return `//node[@class='${element.className}'][@index='${element.index}']`;
}

/**
 * XPath特殊字符转义
 */
function escapeXPath(text: string): string {
  return text.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
}

/**
 * 提取子元素文本
 */
function extractChildrenTexts(element: VisualElement): string[] {
  const texts: string[] = [];
  
  function traverse(el: VisualElement) {
    if (el.text) texts.push(el.text);
    el.children?.forEach(traverse);
  }
  
  element.children?.forEach(traverse);
  return texts;
}

/**
 * 构建完整步骤数据
 */
export function buildStepFromElement(
  element: VisualElement, 
  xmlSnapshot: string
): StepCardData {
  const xpath = generateGlobalXPath(element);
  const targetText = element.text || element.contentDesc || '';
  
  return {
    element_path: xpath,  // ✅ 保存XPath
    targetText,
    className: element.className,
    resourceId: element.resourceId,
    bounds: element.bounds,
    contentDesc: element.contentDesc,
    
    // ✅ 保存完整 original_data
    original_data: {
      element_text: targetText,
      element_bounds: element.bounds,
      element_xpath: xpath,
      key_attributes: {
        "content-desc": element.contentDesc || '',
        "resource-id": element.resourceId || '',
        "class": element.className || '',
        "text": element.text || ''
      },
      original_xml: xmlSnapshot,  // ✅ 保存XML快照
      children_texts: extractChildrenTexts(element)
    }
  };
}
```

## 后端失败恢复机制

```rust
// src-tauri/src/exec/v3/chain_engine.rs

// 在找不到元素时启用
if target_element.is_none() {
    tracing::warn!("⚠️ [智能执行] 真机XML中未找到目标元素，启动失败恢复机制");
    
    // 提取 original_data
    if let Some(original_data) = inline.params.get("original_data") {
        if let Some(original_xml) = original_data.get("original_xml").and_then(|v| v.as_str()) {
            let original_xpath = inline.params.get("element_path")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            
            let target_text = original_data.get("element_text")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            
            tracing::info!("🔄 [失败恢复] 使用原始XML重新分析");
            tracing::info!("   📍 XPath: {}", original_xpath);
            tracing::info!("   📝 目标文本: {}", target_text);
            
            // 从原始XML中找到元素特征
            // 在真机XML中搜索相似元素
            // 使用 MultiCandidateEvaluator 评分选择最佳候选
        }
    }
}
```
