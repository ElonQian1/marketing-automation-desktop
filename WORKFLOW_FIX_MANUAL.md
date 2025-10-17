# 智能分析完成事件修复清单

## ✅ 已完成
1. **intelligent-analysis-backend.ts** - 后端服务层
   - 修改 `listenToAnalysisComplete` 签名从 `(result) => void` → `(jobId: string, result: AnalysisResult) => void`
   - 修改回调调用从 `onComplete(result)` → `onComplete(event.payload.job_id, result)`

2. **useIntelligentAnalysisAdapter.ts** - Adapter层（旧版本）
   - 修改回调签名从 `(result) =>` → `(jobId, result) =>`

## ❌ 待修复
**use-intelligent-analysis-workflow.ts** 第 112-159 行

###  当前代码（错误）：
```typescript
const unlistenDone = await intelligentAnalysisBackend.listenToAnalysisComplete((result) => {
  console.log('✅ [Workflow] 收到分析完成', { jobId, result }); // ❌ jobId 未定义
  
  // 通过循环查找 selectionHash 匹配（低效 + 不可靠）
  for (const [jobId, job] of updated.entries()) {
    if (job.selectionHash === result.selectionHash && job.state === 'running') {
      // ...
    }
  }
  
  if (foundJob) {
    setStepCards(prevCards => {
      return prevCards.map(card => {
        if (card.analysisJobId === foundJob.jobId || card.selectionHash === result.selectionHash) {
          // ...
        }
      });
    });
  }
});
```

### 正确代码（需要替换）：
```typescript
const unlistenDone = await intelligentAnalysisBackend.listenToAnalysisComplete((jobId, result) => {
  console.log('✅ [Workflow] 收到分析完成', { jobId, result });
  
  // ✅ 使用 jobId 直接查找（高效 + 可靠）
  setCurrentJobs(prev => {
    const updated = new Map(prev);
    const job = updated.get(jobId);
    
    if (job && job.state === 'running') {
      updated.set(jobId, {
        ...job,
        state: 'completed',
        progress: 100,
        completedAt: Date.now(),
        result
      });
      console.log('🔗 [Workflow] 更新任务状态为已完成', { jobId, stepId: job.stepId });
    } else {
      console.warn('⚠️ [Workflow] 找不到匹配的运行中任务', { 
        jobId, 
        jobExists: !!job,
        jobState: job?.state,
        availableJobs: Array.from(updated.keys()) 
      });
    }
    
    return updated;
  });
  
  // ✅ 使用 jobId 精确匹配并更新步骤卡片
  setStepCards(prevCards => {
    return prevCards.map(card => {
      if (card.analysisJobId === jobId) {
        console.log('🎯 [Workflow] 更新步骤卡片状态', { stepId: card.stepId, jobId });
        return {
          ...card,
          analysisState: 'analysis_completed',
          analysisProgress: 100,
          analysisJobId: undefined, // ✅ 清除 jobId 防止未来误匹配
          smartCandidates: result.smartCandidates,
          staticCandidates: result.staticCandidates,
          recommendedStrategy: result.smartCandidates.find(c => c.key === result.recommendedKey),
          analyzedAt: Date.now(),
          updatedAt: Date.now()
        };
      }
      return card;
    });
  });
});
```

## 修复步骤
1. 打开 `src/modules/universal-ui/hooks/use-intelligent-analysis-workflow.ts`
2. 找到第 112 行 `const unlistenDone = await ...`
3. 手动将整个事件处理函数（约 50 行）替换为上面的"正确代码"
4. 保存文件
5. 重新运行应用测试

## 验证检查
修复后，搜索文件确认：
- ✅ `listenToAnalysisComplete((jobId, result) =>` 存在
- ✅ `const job = updated.get(jobId)` 存在
- ✅ `card.analysisJobId === jobId` 存在
- ✅ `analysisJobId: undefined` 清理存在
- ❌ `foundJob.jobId` 不应存在
- ❌ `job.selectionHash === result.selectionHash` 循环不应存在
