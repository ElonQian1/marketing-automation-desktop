# 步骤卡片组件代码审查规范

## 🎯 PR 审查检查清单

### 📋 强制检查项（❌ 不通过审查）

#### 1. 组件使用规范检查

- [ ] **禁止直接导入内部组件**
  ```tsx
  // ❌ 禁止
  import { DraggableStepCard } from '@/components/DraggableStepCard';
  import { UnifiedStepCard } from '@/modules/universal-ui/components/unified-step-card';
  
  // ✅ 必须
  import { StepCardSystem } from '@/modules/universal-ui';
  ```

- [ ] **禁止在同一页面混用不同卡片组件**
  ```tsx
  // ❌ 禁止混用
  <DraggableStepCard />
  <StepCardSystem />
  <UnifiedStepCard />
  
  // ✅ 统一使用
  <StepCardSystem config={{...}} />
  <StepCardSystem config={{...}} />
  ```

- [ ] **禁止忽视废弃警告**
  ```tsx
  // ❌ 如果看到 @deprecated 组件仍在使用，必须要求迁移或说明原因
  ```

#### 2. 配置规范检查

- [ ] **配置项精确性**
  ```tsx
  // ❌ 过度配置（启用不需要的功能）
  <StepCardSystem config={{
    enableDrag: true,
    enableIntelligent: true,
    enableExperimentalFeatures: true,  // 不需要但开启
    showDebugInfo: true                // 生产环境不应开启
  }} />
  
  // ✅ 精确配置
  <StepCardSystem config={{
    enableDrag: needsDragFeature,     // 基于实际需求
    enableIntelligent: needsAI        // 按需开启
  }} />
  ```

- [ ] **业务特化正确性**
  ```tsx
  // ✅ 业务模块应指定正确的 businessType
  // 在 prospecting 模块中
  <StepCardSystem config={{ businessType: 'prospecting' }} />
  
  // 在 script-builder 模块中
  <StepCardSystem config={{ businessType: 'script-builder' }} />
  ```

#### 3. 数据格式检查

- [ ] **数据适配正确性**
  ```tsx
  // ✅ 确保数据格式兼容或使用适配器
  const adaptedData = needsAdapter 
    ? adaptLegacyStepToIntelligent(legacyData)
    : modernData;
  
  <StepCardSystem stepData={adaptedData} />
  ```

- [ ] **TypeScript 类型正确性**
  ```tsx
  // ✅ 确保没有 any 类型或类型错误
  // ✅ 确保回调函数签名正确
  ```

### 📋 建议检查项（⚠️ 建议改进）

#### 1. 性能优化建议

- [ ] **大列表性能检查**
  ```tsx
  // ⚠️ 对于大列表，建议使用最小配置
  <StepCardSystem config={{
    systemMode: 'minimal',              // 最小功能模式
    enableExperimentalFeatures: false  // 关闭实验性功能
  }} />
  ```

- [ ] **不必要的重渲染检查**
  ```tsx
  // ⚠️ 检查是否有不必要的内联对象创建
  // ❌ 
  <StepCardSystem config={{ enableDrag: true }} />  // 每次渲染都创建新对象
  
  // ✅
  const stepConfig = useMemo(() => ({ enableDrag: true }), []);
  <StepCardSystem config={stepConfig} />
  ```

#### 2. 可维护性建议

- [ ] **配置抽取建议**
  ```tsx
  // ⚠️ 对于复杂配置，建议抽取为常量
  const PROSPECTING_STEP_CONFIG = {
    businessType: 'prospecting' as const,
    enableDrag: true,
    enableIntelligent: true,
    theme: 'default' as const
  };
  
  <StepCardSystem config={PROSPECTING_STEP_CONFIG} />
  ```

- [ ] **注释完整性**
  ```tsx
  // ⚠️ 复杂配置建议添加注释说明
  <StepCardSystem 
    config={{
      systemMode: 'intelligent-only',  // 只需要智能分析，不需要拖拽
      businessType: 'prospecting',     // 精准获客业务特化
      showDebugInfo: __DEV__           // 开发环境显示调试信息
    }}
  />
  ```

### 📋 架构一致性检查

#### 1. 导入路径一致性

- [ ] **统一从模块入口导入**
  ```tsx
  // ✅ 统一使用
  import { StepCardSystem } from '@/modules/universal-ui';
  
  // ❌ 避免深层导入
  import { StepCardSystem } from '@/modules/universal-ui/components/step-card-system/StepCardSystem';
  ```

#### 2. 命名规范一致性

- [ ] **变量命名规范检查**
  ```tsx
  // ✅ 推荐命名
  const stepConfig = {...};
  const stepCallbacks = {...};
  const stepData = {...};
  
  // ⚠️ 避免混淆命名
  const dragConfig = {...};      // 不够明确
  const cardProps = {...};       // 太通用
  ```

#### 3. 模块边界检查

- [ ] **确保不跨越模块边界**
  ```tsx
  // ✅ 在 prospecting 模块中
  <StepCardSystem config={{ businessType: 'prospecting' }} />
  
  // ❌ 在 prospecting 模块中使用其他业务类型
  <StepCardSystem config={{ businessType: 'script-builder' }} />
  ```

## 🔍 审查工具和脚本

### ESLint 规则建议

```json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": ["**/DraggableStepCard*"],
            "message": "请使用 StepCardSystem 代替 DraggableStepCard"
          },
          {
            "group": ["**/unified-step-card*"],
            "message": "请使用 StepCardSystem 代替 UnifiedStepCard"
          }
        ]
      }
    ]
  }
}
```

### Git Hook 检查脚本

```bash
#!/bin/bash
# pre-commit hook 检查步骤卡片组件使用

echo "检查步骤卡片组件使用规范..."

# 检查是否直接导入了废弃组件
if git diff --cached --name-only | grep -E '\.(tsx?|jsx?)$' | xargs grep -l "from.*DraggableStepCard\|from.*unified-step-card" > /dev/null; then
    echo "❌ 发现直接导入废弃组件，请使用 StepCardSystem"
    echo "参考迁移指南: STEP_CARD_MIGRATION_GUIDE.md"
    exit 1
fi

echo "✅ 步骤卡片组件使用规范检查通过"
```

## 📝 PR 模板

```markdown
## 步骤卡片相关变更

### 检查清单

#### 强制检查项
- [ ] 未直接导入 `DraggableStepCard` 或 `UnifiedStepCard`
- [ ] 未在同一页面混用不同的步骤卡片组件
- [ ] 已处理所有 `@deprecated` 警告
- [ ] 配置项精确匹配功能需求
- [ ] 数据格式兼容或已使用适配器
- [ ] TypeScript 类型检查无错误

#### 建议检查项
- [ ] 大列表场景已考虑性能优化
- [ ] 复杂配置已抽取为常量
- [ ] 关键配置已添加注释说明
- [ ] 导入路径遵循项目规范
- [ ] 变量命名清晰明确

### 变更说明

**使用的组件类型**: 
- [ ] StepCardSystem (推荐)
- [ ] 旧组件迁移到 StepCardSystem
- [ ] 特殊场景使用旧组件 (需说明原因)

**功能配置**:
```tsx
{
  enableDrag: boolean,        // 是否启用拖拽
  enableIntelligent: boolean, // 是否启用智能分析
  businessType: string,       // 业务特化类型
  systemMode: string          // 系统模式
}
```

**如果使用了旧组件，请说明原因**:
<!-- 例如：特殊业务需求、时间紧急、计划后续迁移等 -->

### 测试确认

- [ ] 拖拽功能正常工作
- [ ] 智能分析功能正常工作
- [ ] 编辑、删除等基础功能正常
- [ ] 样式和主题正确应用
- [ ] 性能表现符合预期

### 文档更新

- [ ] 已更新相关文档（如有）
- [ ] 已更新使用示例（如有）
- [ ] 已添加必要的代码注释
```

## 🚨 常见审查要点

### 1. 迁移不彻底

**问题**: 部分文件迁移了，部分没有迁移

**检查方法**:
```bash
# 搜索项目中是否还有直接使用旧组件的代码
grep -r "DraggableStepCard\|UnifiedStepCard" src/ --include="*.tsx" --include="*.ts"
```

**要求**: 要么全部迁移，要么有明确的迁移计划

### 2. 配置过度

**问题**: 启用了不需要的功能，影响性能

**检查方法**: 询问每个配置项的必要性

**要求**: 配置项必须有明确的业务需求支撑

### 3. 类型不安全

**问题**: 使用 `any` 类型或类型断言

**检查方法**: 检查 TypeScript 编译结果

**要求**: 必须使用正确的类型定义

### 4. 缺少错误处理

**问题**: 没有处理数据格式不兼容的情况

**检查方法**: 检查是否有数据适配和错误边界

**要求**: 必须处理数据格式兼容性问题

## 📞 审查支持

### 审查者参考资料

1. **架构文档**: `CURRENT_ARCHITECTURE_ANALYSIS.md`
2. **迁移指南**: `STEP_CARD_MIGRATION_GUIDE.md`
3. **决策指南**: `STEP_CARD_DECISION_GUIDE.md`
4. **系统文档**: `src/modules/universal-ui/components/step-card-system/README.md`

### 常见问题处理

**Q: 开发者坚持使用旧组件怎么办？**
A: 要求提供充分的技术原因，并制定迁移计划

**Q: 迁移工作量很大怎么办？**
A: 可以渐进式迁移，但必须有明确的时间表

**Q: 特殊场景确实需要旧组件怎么办？**
A: 记录为技术债，定期评估是否可以集成到新系统中

---

**记住: 严格的代码审查是确保架构一致性的关键！** 🔍