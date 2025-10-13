# 智能分析工作流快速使用指南

## 快速开始

### 1. 导入必要组件

```typescript
import {
  useIntelligentAnalysisWorkflow,
  IntelligentStepCardComponent as IntelligentStepCard,
  EnhancedElementSelectionPopover,
  type ElementSelectionContext
} from '@/modules/universal-ui';
```

### 2. Hook使用

```typescript
const MyComponent = () => {
  const {
    stepCards,           // 当前所有步骤卡片
    currentJobs,         // 分析作业状态
    isAnalyzing,         // 是否正在分析
    createStepCardQuick, // 快速创建步骤卡片
    startAnalysis,       // 启动分析
    upgradeStep,         // 升级到推荐策略
    switchStrategy,      // 切换策略
    deleteStepCard       // 删除步骤卡片
  } = useIntelligentAnalysisWorkflow();
  
  // ... 组件逻辑
};
```

### 3. 处理元素选择

```typescript
const handleElementSelected = async (elementContext: ElementSelectionContext) => {
  // 方式1: 立即创建步骤卡片（推荐）
  const stepId = await createStepCardQuick(elementContext);
  
  // 方式2: 创建并立即启动分析
  const stepId = await createStepCardQuick(elementContext);
  await startAnalysis(elementContext, stepId);
};
```

### 4. 渲染步骤卡片

```typescript
return (
  <div>
    {stepCards.map((card, index) => (
      <IntelligentStepCard
        key={card.stepId}
        stepCard={card}
        stepIndex={index + 1}
        onUpgradeStrategy={() => upgradeStep(card.stepId)}
        onRetryAnalysis={() => retryAnalysis(card.stepId)}
        onSwitchStrategy={(strategyKey, followSmart) => 
          switchStrategy(card.stepId, strategyKey, followSmart)
        }
        onDelete={() => deleteStepCard(card.stepId)}
      />
    ))}
  </div>
);
```

## 核心工作流

### "不等分析完成，先采用默认值"的实现

```typescript
// 1. 用户选择元素后立即创建步骤卡片
const elementContext = {
  snapshotId: 'current_snapshot',
  elementPath: '[0][1][2][3]',
  elementType: 'input',
  // ... 其他属性
};

// 2. 立即创建带默认值的步骤卡片
const stepId = await createStepCardQuick(elementContext);

// 此时步骤卡片已经可用，使用兜底策略
// 用户可以立即继续后续操作

// 3. 可选启动后台智能分析
await startAnalysis(elementContext, stepId);

// 4. 分析完成后自动更新步骤卡片
// Hook会自动监听分析完成事件并更新卡片
```

### 分析状态监控

```typescript
const { currentJobs, isAnalyzing } = useIntelligentAnalysisWorkflow();

// 检查特定步骤的分析状态
const getStepAnalysisStatus = (stepId: string) => {
  const step = stepCards.find(s => s.stepId === stepId);
  return step?.analysisState; // 'idle' | 'analyzing' | 'analysis_completed' | 'analysis_failed'
};

// 显示全局分析状态
if (isAnalyzing) {
  console.log('后台分析进行中...');
}
```

### 策略管理

```typescript
// 升级到推荐策略
await upgradeStep(stepId);

// 手动切换策略
await switchStrategy(stepId, 'custom_xpath_01', true);

// 策略模式说明:
// - 'intelligent': 使用AI推荐的最佳策略
// - 'smart_variant': 用户选择的智能策略变体
// - 'static_user': 用户选择的静态策略
```

## 组件使用示例

### 元素选择弹窗

```typescript
<EnhancedElementSelectionPopover
  elementContext={selectedElement}
  state="idle" // | 'analyzing' | 'analyzed' | 'failed'
  onStartAnalysis={async () => {
    const stepId = await createStepCardQuick(selectedElement);
    await startAnalysis(selectedElement, stepId);
  }}
  onDirectConfirm={async () => {
    await createStepCardQuick(selectedElement);
  }}
  onCancel={() => setSelectedElement(null)}
/>
```

### 步骤卡片

```typescript
<IntelligentStepCard
  stepCard={card}
  stepIndex={index + 1}
  showDebugInfo={process.env.NODE_ENV === 'development'}
  onUpgradeStrategy={() => upgradeStep(card.stepId)}
  onRetryAnalysis={() => retryAnalysis(card.stepId)}
  onSwitchStrategy={(key, follow) => switchStrategy(card.stepId, key, follow)}
  onDelete={() => deleteStepCard(card.stepId)}
/>
```

## 错误处理

```typescript
try {
  await createStepCardQuick(elementContext);
} catch (error) {
  message.error(`创建步骤失败: ${error.message}`);
}

try {
  await startAnalysis(elementContext, stepId);
} catch (error) {
  message.error(`启动分析失败: ${error.message}`);
}
```

## 调试技巧

### 1. 选择哈希调试

```typescript
import { debugSelectionHash } from '@/modules/universal-ui';

const context = getElementSelectionContext();
const debugInfo = debugSelectionHash(context);
console.log('选择哈希调试信息:', debugInfo);
```

### 2. 分析作业监控

```typescript
const { currentJobs } = useIntelligentAnalysisWorkflow();

// 打印所有作业状态
Array.from(currentJobs.values()).forEach(job => {
  console.log(`作业 ${job.jobId}: ${job.state} (${job.progress}%)`);
});
```

### 3. 步骤卡片状态

```typescript
stepCards.forEach(card => {
  console.log(`步骤 ${card.stepId}: ${card.analysisState}`, {
    activeStrategy: card.activeStrategy?.name,
    smartCandidates: card.smartCandidates.length,
    progress: card.analysisProgress
  });
});
```

## 性能优化建议

### 1. 避免重复分析

```typescript
// Hook会自动检查是否已有相同选择的分析任务
// 重复调用startAnalysis会复用现有任务
```

### 2. 批量操作

```typescript
// 批量删除步骤卡片
const stepIdsToDelete = ['step1', 'step2', 'step3'];
stepIdsToDelete.forEach(stepId => deleteStepCard(stepId));
```

### 3. 清理资源

```typescript
const { clearAllJobs } = useIntelligentAnalysisWorkflow();

// 组件卸载时清理
useEffect(() => {
  return () => {
    clearAllJobs();
  };
}, [clearAllJobs]);
```

## 常见问题

### Q: 为什么分析结果没有自动应用到步骤卡片？
A: 检查选择哈希是否匹配，确保分析结果关联到正确的步骤卡片。

### Q: 如何自定义兜底策略？
A: 修改Hook中的`createFallbackStrategy`函数，或通过props传入自定义策略。

### Q: 分析任务可以取消吗？
A: 可以，使用`cancelAnalysis(jobId)`方法取消正在运行的分析任务。

### Q: 如何处理分析超时？
A: 模拟后端会自动处理超时，实际项目中由Tauri后端管理超时逻辑。

---

以上是智能分析工作流的快速使用指南。更多详细信息请参考`INTELLIGENT_ANALYSIS_WORKFLOW_IMPLEMENTATION.md`文档。