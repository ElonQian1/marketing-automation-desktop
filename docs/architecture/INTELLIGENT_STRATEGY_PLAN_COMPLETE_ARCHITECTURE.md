# 智能策略计划完整架构方案

## 📋 问题诊断

### 当前问题
用户反馈:"我点选的都是通讯录,为什么变成这个了"

**实际情况**:
- 用户在前端点击了 FrameLayout 容器 `[0,1321][1080,1447]`
- 真正的"通讯录"按钮在子元素中(未被精确选中)
- 后端收到空的 children_texts 和空的 text/content-desc
- 后端智能分析找到5个子按钮(作品/日常/推荐/收藏/喜欢),但没有找到"通讯录"

### 根本原因
**当前架构缺少"用户选择锚定 → 智能策略生成 → 真机重新定位"的完整流程**

错误的解决方向:
- ❌ 过滤前端元素列表(策略2)
- ❌ 智能容器检测自动切换到子元素
- ❌ 修改前端数据提取逻辑

正确的解决方向:
- ✅ **保留用户的原始选择**
- ✅ **生成智能策略计划(Plan)**
- ✅ **后端按策略重新定位**

## 🎯 设计目标

根据 xpath说明/对话1-8.md 的完整讨论,我们需要实现:

1. **前端**:离线评估+可视化 → 生成候选策略清单(Plan) + 推荐
2. **后端**:真机校验+执行 → 快路径优先 + 受控回退
3. **工作流**:用户点"确定" → 自动生成策略Plan → 可手动切换 → 后端执行

## 🏗️ 完整架构设计

### 1. 数据流架构

```
┌─────────────────┐
│  用户点击元素N   │ (可以是容器、可以是子元素、可以是任何元素)
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────┐
│ UserSelectionAnchor (前端)       │
│ - 记录原始元素完整信息            │
│ - bounds, text, content-desc    │
│ - resource-id, class, xpath    │
│ - 父元素链、子元素树、兄弟元素   │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ StrategyPlanGenerator (前端)    │
│ - Step 0: 规范化输入             │
│ - Step 1: Self-Anchor           │
│ - Step 2: Child-Driven          │
│ - Step 3: Region-Scoped         │
│ - Step 4: Neighbor-Relative     │
│ - Step 5: Index Fallback        │
│ → 生成候选策略Plan(排序+打分)    │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ StepCard (增强)                  │
│ - xml_snapshot                  │
│ - absolute_xpath                │
│ - strategy.selected (推荐策略)  │
│ + strategy_plan[] (候选链)      │
│ + recommended_index             │
│ + user_selection_anchor         │
│ + i18n_alias (同义词)           │
│ + allow_backend_fallback        │
└────────┬────────────────────────┘
         │ 发送到后端
         ↓
┌─────────────────────────────────┐
│ 后端 StrategyExecutor (Rust)    │
│ 1. Dump真机XML                  │
│ 2. 执行selected策略 (快路径)    │
│ 3. 失败→按Plan回退 (可配置)     │
│ 4. 返回结果+日志                │
└─────────────────────────────────┘
```

### 2. 核心数据结构

#### UserSelectionAnchor (前端)
```typescript
interface UserSelectionAnchor {
  // 用户点击的原始元素
  elementId: string;
  bounds: string;  // "[x1,y1][x2,y2]"
  text: string;
  contentDesc: string;
  resourceId: string;
  className: string;
  clickable: boolean;
  
  // 上下文信息
  ancestorChain: ElementInfo[];  // 祖先链
  childTree: ElementInfo[];      // 子树
  siblings: ElementInfo[];       // 兄弟元素
  
  // 特征标识
  nearestClickableParent: ElementInfo | null;
  nearestStableContainer: ElementInfo | null;  // 如bottom_navigation
  potentialAnchors: {  // 潜在锚点
    textAnchors: string[];     // 子树中的文本
    idAnchors: string[];       // 子树中的resource-id
  };
  
  // 多语言
  i18nAlias: string[];  // 如 ["通讯录", "Contacts", "联系人"]
}
```

#### StrategyVariant (前端/后端共用)
```typescript
interface StrategyVariant {
  id: string;
  kind: StrategyKind;  // 见下文
  scope: 'global' | 'regional';
  
  // 选择器
  selectors: {
    resourceId?: string;
    contentDesc?: string;
    text?: string | string[];  // 支持多语言
    className?: string;
    clickable?: boolean;
  };
  
  // 结构关系
  structure?: {
    type: 'ancestor' | 'descendant' | 'sibling' | 'parent';
    containerXPath?: string;  // 区域限定容器
    relation?: 'following' | 'preceding' | 'first' | 'last';
  };
  
  // 索引
  index?: {
    type: 'local' | 'global';
    value: number;
    containerXPath?: string;  // 局部索引的容器
  };
  
  // 轻校验
  checks: {
    mustContainText?: string[];
    mustBeClickable?: boolean;
    mustHaveIcon?: string;
    boundsRegion?: string;  // 必须在某区域内
  };
  
  // 元数据
  score: number;  // 稳定性评分
  explain: string;  // 可读解释
  risk: string[];  // 风险提示
  
  // 本地验证结果(前端)
  localVerify?: {
    matchCount: number;
    passed: boolean;
    failReason?: string;
  };
}

enum StrategyKind {
  SelfId = 'self_id',                      // Step 1: resource-id唯一
  SelfDesc = 'self_desc',                  // Step 1: content-desc唯一
  SelfCombo = 'self_combo',                // Step 1: 组合唯一
  ChildAnchorToParent = 'child_to_parent', // Step 2: 子树锚点→父可点
  RegionTextToParent = 'region_text',      // Step 3: 容器+文本→父可点
  RegionLocalIndex = 'region_index',       // Step 3: 容器+局部索引+校验
  NeighborRelative = 'neighbor',           // Step 4: 邻居相对
  GlobalIndexFallback = 'global_index',    // Step 5: 全局索引+强校验
}
```

#### StrategyPlan (前端生成,后端执行)
```typescript
interface StrategyPlan {
  variants: StrategyVariant[];  // 已排序(从强到弱)
  recommendedIndex: number;     // 推荐使用哪个
  generatedBy: string;          // 'algorithm' | 'manual'
  generatedAt: number;          // 时间戳
}
```

#### StepCard (增强版)
```typescript
interface StepCard {
  // 原有三要素
  xmlSnapshot: string;
  absoluteXPath: string;
  strategy: {
    selected: StrategyVariant;  // 当前选中的策略
  };
  
  // 新增字段
  userSelectionAnchor: UserSelectionAnchor;  // 用户选择锚点
  strategyPlan: StrategyPlan;                // 候选策略计划
  i18nAlias: string[];                       // 多语言别名
  
  // 执行配置
  allowBackendFallback: boolean;  // 允许后端回退
  timeBudgetMs: number;           // 总时间预算
  perCandidateBudgetMs: number;   // 单候选预算
  strictMode: boolean;            // 严格模式(不回退)
  
  // 元数据
  xmlHash: string;
  nodeFingerprint: string;
}
```

### 3. 策略决策流程 (详细版)

#### Step 0: 规范化输入
```typescript
function normalizeInput(
  selectedElement: VisualUIElement,
  allElements: VisualUIElement[],
  xmlContent: string
): UserSelectionAnchor {
  // 1. 提取元素属性
  const basicInfo = extractBasicInfo(selectedElement);
  
  // 2. 构建祖先链
  const ancestorChain = buildAncestorChain(selectedElement, allElements);
  
  // 3. 识别最近可点击父
  const nearestClickableParent = findNearestClickable(ancestorChain);
  
  // 4. 识别稳定容器
  const nearestStableContainer = findStableContainer(ancestorChain);
  
  // 5. 收集子树锚点
  const potentialAnchors = collectAnchors(selectedElement, allElements);
  
  // 6. 收集兄弟元素
  const siblings = findSiblings(selectedElement, allElements);
  
  // 7. 生成多语言别名
  const i18nAlias = generateI18nAlias(
    selectedElement.text,
    selectedElement.contentDesc
  );
  
  return {
    ...basicInfo,
    ancestorChain,
    nearestClickableParent,
    nearestStableContainer,
    potentialAnchors,
    siblings,
    i18nAlias
  };
}
```

#### Step 1: Self-Anchor (自我可定位)
```typescript
function evaluateSelfAnchor(anchor: UserSelectionAnchor): StrategyVariant[] {
  const variants: StrategyVariant[] = [];
  
  // 1.1 resource-id唯一性
  if (anchor.resourceId && isUnique(anchor.resourceId, allElements)) {
    variants.push({
      id: 'self_id',
      kind: StrategyKind.SelfId,
      scope: 'global',
      selectors: { resourceId: anchor.resourceId },
      checks: { mustBeClickable: true },
      score: 100,
      explain: `通过resource-id='${anchor.resourceId}'直接定位(最快最稳)`,
      risk: []
    });
  }
  
  // 1.2 content-desc唯一性
  if (anchor.contentDesc && isUnique(anchor.contentDesc, allElements)) {
    variants.push({
      id: 'self_desc',
      kind: StrategyKind.SelfDesc,
      scope: 'global',
      selectors: { contentDesc: anchor.contentDesc },
      checks: { mustBeClickable: true },
      score: 95,
      explain: `通过content-desc='${anchor.contentDesc}'直接定位`,
      risk: ['多语言环境下可能变化']
    });
  }
  
  // 1.3 组合唯一性 (class + id模式 + clickable + package)
  const combo = buildComboSelector(anchor);
  if (combo && isUnique(combo, allElements)) {
    variants.push({
      id: 'self_combo',
      kind: StrategyKind.SelfCombo,
      scope: 'global',
      selectors: combo,
      checks: { mustBeClickable: true },
      score: 80,
      explain: '通过属性组合定位(class+id+状态)',
      risk: ['UI改版可能影响']
    });
  }
  
  return variants;
}
```

#### Step 2: Child-Driven (子树找锚点)
```typescript
function evaluateChildAnchor(anchor: UserSelectionAnchor): StrategyVariant[] {
  const variants: StrategyVariant[] = [];
  const parent = anchor.nearestClickableParent || anchor;
  
  // 2.1 子树文本锚点 → 可点击父
  const textAnchors = anchor.potentialAnchors.textAnchors;
  if (textAnchors.length > 0) {
    variants.push({
      id: 'child_text_to_parent',
      kind: StrategyKind.ChildAnchorToParent,
      scope: 'global',
      selectors: {
        text: anchor.i18nAlias,  // 多语言
        className: parent.className
      },
      structure: {
        type: 'parent',
        relation: 'first'
      },
      checks: {
        mustBeClickable: true,
        mustContainText: textAnchors
      },
      score: 70,
      explain: `通过子树文本'${textAnchors.join('|')}'找到可点击父元素`,
      risk: ['文本变化会失败']
    });
  }
  
  // 2.2 子树id锚点 → 可点击父
  const idAnchors = anchor.potentialAnchors.idAnchors;
  if (idAnchors.length > 0) {
    variants.push({
      id: 'child_id_to_parent',
      kind: StrategyKind.ChildAnchorToParent,
      scope: 'global',
      selectors: {
        resourceId: idAnchors[0]  // 使用最稳定的id
      },
      structure: {
        type: 'ancestor',
        relation: 'first'
      },
      checks: {
        mustBeClickable: true
      },
      score: 85,
      explain: `通过子元素resource-id='${idAnchors[0]}'上溯到可点击父`,
      risk: []
    });
  }
  
  return variants;
}
```

#### Step 3: Region-Scoped (区域限定)
```typescript
function evaluateRegionScoped(anchor: UserSelectionAnchor): StrategyVariant[] {
  const variants: StrategyVariant[] = [];
  const container = anchor.nearestStableContainer;
  
  if (!container) {
    return variants;
  }
  
  // 3.1 容器内文本锚点 → 可点击父 (最推荐)
  if (anchor.i18nAlias.length > 0) {
    variants.push({
      id: 'region_text_to_parent',
      kind: StrategyKind.RegionTextToParent,
      scope: 'regional',
      selectors: {
        text: anchor.i18nAlias
      },
      structure: {
        type: 'descendant',
        containerXPath: container.xpath
      },
      checks: {
        mustBeClickable: true,
        mustContainText: anchor.i18nAlias,
        boundsRegion: anchor.bounds  // 必须在用户选择的区域内
      },
      score: 120,  // 区域(+30) + 文本(+70) + 父可点(+20)
      explain: `在容器'${container.resourceId}'内通过文本'${anchor.i18nAlias[0]}'找到可点击父`,
      risk: []
    });
  }
  
  // 3.2 容器内局部索引 + 轻校验
  const localIndex = calculateLocalIndex(anchor, container, allElements);
  if (localIndex !== -1) {
    variants.push({
      id: 'region_local_index',
      kind: StrategyKind.RegionLocalIndex,
      scope: 'regional',
      selectors: {
        clickable: true
      },
      structure: {
        type: 'descendant',
        containerXPath: container.xpath
      },
      index: {
        type: 'local',
        value: localIndex,
        containerXPath: container.xpath
      },
      checks: {
        mustBeClickable: true,
        mustContainText: anchor.i18nAlias,
        boundsRegion: anchor.bounds
      },
      score: 25,  // 区域(+30) + 局部索引(-15) + 校验(+10)
      explain: `容器内第${localIndex}个可点击元素,并校验包含'${anchor.i18nAlias[0]}'`,
      risk: ['顺序变化会失败', '需要bounds校验']
    });
  }
  
  return variants;
}
```

#### Step 4: Neighbor-Relative (邻居相对)
```typescript
function evaluateNeighborRelative(anchor: UserSelectionAnchor): StrategyVariant[] {
  const variants: StrategyVariant[] = [];
  
  // 找到稳定的兄弟锚点
  const stableSibling = findStableSibling(anchor.siblings);
  if (!stableSibling) {
    return variants;
  }
  
  const relation = calculateRelation(anchor, stableSibling);
  variants.push({
    id: 'neighbor_relative',
    kind: StrategyKind.NeighborRelative,
    scope: 'regional',
    selectors: {
      // 先找到稳定兄弟
      text: stableSibling.i18nAlias
    },
    structure: {
      type: 'sibling',
      relation: relation  // 'following' | 'preceding'
    },
    checks: {
      mustBeClickable: true,
      mustContainText: anchor.i18nAlias
    },
    score: 45,  // 结构(+20) + 邻居(+25)
    explain: `通过兄弟元素'${stableSibling.text}'定位(${relation})`,
    risk: ['顺序变化会失败', '兄弟元素插入会失败']
  });
  
  return variants;
}
```

#### Step 5: Index Fallback (索引兜底)
```typescript
function evaluateIndexFallback(anchor: UserSelectionAnchor): StrategyVariant[] {
  const variants: StrategyVariant[] = [];
  
  // 5.1 优先局部索引 (如果有容器)
  if (anchor.nearestStableContainer) {
    const localIndex = calculateGlobalIndex(anchor, allElements);
    variants.push({
      id: 'local_index_fallback',
      kind: StrategyKind.RegionLocalIndex,
      scope: 'regional',
      selectors: {
        className: anchor.className,
        clickable: true
      },
      structure: {
        type: 'descendant',
        containerXPath: anchor.nearestStableContainer.xpath
      },
      index: {
        type: 'local',
        value: localIndex
      },
      checks: {
        mustBeClickable: true,
        mustContainText: anchor.i18nAlias,
        boundsRegion: anchor.bounds
      },
      score: 10,
      explain: `局部索引兜底(第${localIndex}个)`,
      risk: ['高风险', '仅限紧急使用']
    });
  }
  
  // 5.2 最后才全局索引
  const globalIndex = calculateGlobalIndex(anchor, allElements);
  variants.push({
    id: 'global_index_fallback',
    kind: StrategyKind.GlobalIndexFallback,
    scope: 'global',
    selectors: {
      className: anchor.className,
      clickable: true
    },
    index: {
      type: 'global',
      value: globalIndex
    },
    checks: {
      mustBeClickable: true,
      mustContainText: anchor.i18nAlias,
      boundsRegion: anchor.bounds,
      mustHaveIcon: anchor.resourceId  // 强校验
    },
    score: -60,
    explain: `全局索引兜底(第${globalIndex}个,强校验)`,
    risk: ['极高风险', '仅限最后手段', '需要全部校验通过']
  });
  
  return variants;
}
```

#### 策略排序与推荐
```typescript
function generateStrategyPlan(
  anchor: UserSelectionAnchor,
  xmlContent: string
): StrategyPlan {
  // 1. 收集所有候选
  const allVariants: StrategyVariant[] = [
    ...evaluateSelfAnchor(anchor),
    ...evaluateChildAnchor(anchor),
    ...evaluateRegionScoped(anchor),
    ...evaluateNeighborRelative(anchor),
    ...evaluateIndexFallback(anchor)
  ];
  
  // 2. 本地验证(在缓存XML上)
  const verified = allVariants.map(variant => ({
    ...variant,
    localVerify: verifyInLocalXml(variant, xmlContent)
  }));
  
  // 3. 按score降序排序
  const sorted = verified
    .filter(v => v.localVerify!.passed)  // 只保留验证通过的
    .sort((a, b) => b.score - a.score);
  
  // 4. 选出推荐
  const recommendedIndex = sorted.findIndex(v => 
    v.localVerify!.matchCount === 1  // 唯一命中
  );
  
  return {
    variants: sorted,
    recommendedIndex: recommendedIndex !== -1 ? recommendedIndex : 0,
    generatedBy: 'algorithm',
    generatedAt: Date.now()
  };
}
```

### 4. 后端执行流程

#### 快路径优先
```rust
// src-tauri/src/exec/v3/element_matching/strategy_executor.rs

pub async fn execute_strategy_plan(
    device_id: &str,
    step_card: &StepCard,
) -> Result<ExecutionResult> {
    // 1. Dump真机XML
    let start = Instant::now();
    let xml_content = dump_device_xml(device_id).await?;
    let dump_time = start.elapsed();
    
    // 2. 快路径: 执行selected策略
    let selected = &step_card.strategy.selected;
    match try_execute_variant(selected, &xml_content, device_id).await {
        Ok(result) => {
            return Ok(ExecutionResult {
                success: true,
                used_variant: selected.clone(),
                coordinates: result.coordinates,
                dump_time_ms: dump_time.as_millis() as u64,
                match_time_ms: result.elapsed.as_millis() as u64,
                ..Default::default()
            });
        }
        Err(e) => {
            log::warn!("🔄 主策略失败: {}, 尝试回退", e);
        }
    }
    
    // 3. 受控回退 (如果允许)
    if step_card.allow_backend_fallback {
        return execute_fallback_chain(
            &step_card.strategy_plan,
            &xml_content,
            device_id,
            step_card.time_budget_ms,
            step_card.per_candidate_budget_ms
        ).await;
    }
    
    Err("所有策略都失败".into())
}
```

#### 受控回退链
```rust
async fn execute_fallback_chain(
    plan: &StrategyPlan,
    xml_content: &str,
    device_id: &str,
    total_budget_ms: u64,
    per_candidate_budget_ms: u64,
) -> Result<ExecutionResult> {
    let start = Instant::now();
    let mut results = Vec::new();
    
    for (i, variant) in plan.variants.iter().enumerate() {
        // 检查总预算
        if start.elapsed().as_millis() as u64 > total_budget_ms {
            log::warn!("⏱️ 总预算耗尽, 停止回退");
            break;
        }
        
        log::info!("🔄 [回退 {}/{}] 尝试策略: {}", i+1, plan.variants.len(), variant.explain);
        
        // 单候选预算
        let candidate_start = Instant::now();
        match timeout(
            Duration::from_millis(per_candidate_budget_ms),
            try_execute_variant(variant, xml_content, device_id)
        ).await {
            Ok(Ok(result)) => {
                log::info!("✅ [回退成功] 使用策略: {}", variant.explain);
                return Ok(ExecutionResult {
                    success: true,
                    used_variant: variant.clone(),
                    fallback_attempts: i + 1,
                    ..result
                });
            }
            Ok(Err(e)) => {
                results.push(FallbackAttempt {
                    variant_id: variant.id.clone(),
                    error: e.to_string(),
                    elapsed_ms: candidate_start.elapsed().as_millis() as u64
                });
            }
            Err(_) => {
                log::warn!("⏱️ 候选{}超时", i+1);
                results.push(FallbackAttempt {
                    variant_id: variant.id.clone(),
                    error: "timeout".to_string(),
                    elapsed_ms: per_candidate_budget_ms
                });
            }
        }
    }
    
    Err(format!("所有{}个候选都失败", results.len()).into())
}
```

#### Variant执行器
```rust
async fn try_execute_variant(
    variant: &StrategyVariant,
    xml_content: &str,
    device_id: &str,
) -> Result<VariantResult> {
    let start = Instant::now();
    
    // 1. 解析XML
    let elements = parse_xml_with_inheritance(xml_content)?;
    
    // 2. 按variant匹配
    let candidates = match_by_variant(variant, &elements)?;
    
    // 3. 唯一性检查
    if candidates.len() != 1 {
        return Err(format!(
            "匹配数量错误: expected=1, actual={}", 
            candidates.len()
        ).into());
    }
    
    let target = &candidates[0];
    
    // 4. 轻校验
    verify_checks(target, &variant.checks, &elements)?;
    
    // 5. 计算坐标并点击
    let (x, y) = calculate_tap_coordinates(target)?;
    tap_device(device_id, x, y).await?;
    
    Ok(VariantResult {
        element: target.clone(),
        coordinates: (x, y),
        elapsed: start.elapsed()
    })
}
```

#### Bounds区域匹配增强
```rust
// 在 multi_candidate_evaluator.rs 中添加

fn check_bounds_region_match(
    candidate: &UIElement,
    user_selected_bounds: &str,  // "[0,1321][1080,1447]"
    all_elements: &[UIElement]
) -> f64 {
    let user_rect = parse_bounds(user_selected_bounds)?;
    let candidate_rect = parse_bounds(&candidate.bounds)?;
    
    // 1. 完全匹配 → 1.0
    if rectangles_equal(&user_rect, &candidate_rect) {
        return 1.0;
    }
    
    // 2. 候选在用户选择区域内 → 0.9 (很可能是子元素)
    if is_contained(&candidate_rect, &user_rect) {
        return 0.9;
    }
    
    // 3. 候选包含用户选择区域 → 0.3 (可能是父容器)
    if is_contained(&user_rect, &candidate_rect) {
        return 0.3;
    }
    
    // 4. 重叠 → 0.5 * overlap_ratio
    let overlap_ratio = calculate_overlap(&user_rect, &candidate_rect);
    if overlap_ratio > 0.5 {
        return 0.5 * overlap_ratio;
    }
    
    0.0
}
```

## 🚀 实施计划

### Phase 1: 前端核心模块 (1-2天)
1. 创建 `user-selection-anchor.ts` - 用户选择锚点
2. 创建 `strategy-plan-generator.ts` - 策略计划生成器
3. 扩展 StepCard 数据结构
4. 集成到 useIntelligentStepCardIntegration

### Phase 2: 后端执行引擎 (1-2天)
5. 创建 `strategy_executor.rs` - 策略执行器
6. 增强 `multi_candidate_evaluator.rs` - Bounds区域匹配
7. 实现回退链逻辑
8. 添加详细日志

### Phase 3: UI集成与测试 (1天)
9. StepCard UI显示推荐策略
10. 手动切换策略功能
11. 端到端测试

## 📊 预期效果

### 成功指标
- ✅ 用户点击任何元素(包括容器)都能正确生成策略Plan
- ✅ 前端显示推荐策略及候选链
- ✅ 后端快路径命中率 > 90%
- ✅ 后端回退成功率 > 95%
- ✅ 平均执行时间 < 500ms

### 用户体验
- 点击"确定" → 立即生成卡片(含推荐策略)
- 可查看为什么推荐这个策略
- 可手动切换到其他候选
- 后端自动处理环境差异

## 📝 参考文档
- xpath说明/对话1.md - 原生定位问题分析
- xpath说明/对话2.md - 通用定位算法设计
- xpath说明/对话3.md - 前后端协作架构
- xpath说明/对话4.md - 决策流程详细说明
- xpath说明/对话5.md - 前端评估后端执行
- xpath说明/对话6.md - 演进过程说明
- xpath说明/对话7.md - 人话版说明
- xpath说明/对话8.md - 开发人员清单

---

**创建日期**: 2025-10-28
**版本**: v1.0
**状态**: 待实施
