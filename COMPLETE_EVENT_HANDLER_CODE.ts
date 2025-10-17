// 🔒 完整的完成事件处理代码 - 插入到 unlistenProgress 之后，unlistenError 之前

// 分析完成事件 - ✅ 使用 jobId 精确匹配 + 强制结束 Loading
const unlistenDone = await intelligentAnalysisBackend.listenToAnalysisComplete((jobId, result) => {
  console.log('✅ [Workflow] 收到分析完成', { jobId, result });
  
  // 🔒 加固B：完成后强制结束 Loading，防 UI 被类名卡住
  setCurrentJobs(prev => {
    const updated = new Map(prev);
    const job = updated.get(jobId);
    
    if (!job) {
      // 万一完成先到，也做懒绑定
      console.warn('⚠️ [Workflow] 收到未知任务的完成事件，尝试懒绑定', { jobId });
      const orphanCard = Array.from(stepCards).find(
        c => (c.analysisState === 'analyzing' || c.analysisState === 'idle') && !c.analysisJobId
      );
      
      if (orphanCard) {
        console.log('🔗 [Workflow] 懒绑定孤立完成事件到步骤', { jobId, stepId: orphanCard.stepId });
        updated.set(jobId, {
          jobId,
          stepId: orphanCard.stepId,
          selectionHash: result.selectionHash,
          state: 'completed',
          progress: 100,
          completedAt: Date.now(),
          result,
          startedAt: Date.now()
        });
      }
    } else {
      // 正常更新已登记的任务
      updated.set(jobId, {
        ...job,
        state: 'completed',
        progress: 100,
        completedAt: Date.now(),
        result
      });
      console.log('🔗 [Workflow] 更新任务状态为已完成', { jobId, stepId: job.stepId });
    }
    
    return updated;
  });
  
  // ✅ 使用 jobId 精确匹配并更新步骤卡片，强制清理 Loading
  setStepCards(prevCards => {
    return prevCards.map(card => {
      if (card.analysisJobId === jobId || 
          (card.analysisState === 'analyzing' && !card.analysisJobId)) {
        console.log('🎯 [Workflow] 更新步骤卡片为完成状态', { stepId: card.stepId, jobId });
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
