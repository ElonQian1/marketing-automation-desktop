# 修复 use-intelligent-analysis-workflow.ts 的完成事件处理逻辑

$file = "d:\rust\active-projects\小红书\employeeGUI\src\modules\universal-ui\hooks\use-intelligent-analysis-workflow.ts"
$content = Get-Content $file -Raw

# 定义要替换的旧代码块
$old = @'
        // 分析完成事件
        const unlistenDone = await intelligentAnalysisBackend.listenToAnalysisComplete((jobId, result) => {
          console.log('✅ [Workflow] 收到分析完成', result);
          
          // 找到对应的任务并更新状态
          setCurrentJobs(prev => {
            const updated = new Map(prev);
            let foundJob = null;
            // 通过selectionHash匹配对应的任务
            for (const [jobId, job] of updated.entries()) {
              if (job.selectionHash === result.selectionHash && job.state === 'running') {
                updated.set(jobId, {
                  ...job,
                  state: 'completed',
                  progress: 100,
                  completedAt: Date.now(),
                  result
                });
                foundJob = { jobId, job };
                break;
              }
            }
            
            if (foundJob) {
              console.log('🔗 [Workflow] 找到匹配的任务，开始绑定结果', foundJob);
              // 直接在这里更新步骤卡片，避免闭包问题
              setStepCards(prevCards => {
                return prevCards.map(card => {
                  // 通过selectionHash或jobId匹配
                  if (card.analysisJobId === foundJob.jobId || 
                      card.selectionHash === result.selectionHash) {
                    console.log('🎯 [Workflow] 更新步骤卡片状态', { stepId: card.stepId, result });
                    return {
                      ...card,
                      analysisState: 'analysis_completed',
                      analysisProgress: 100,
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
            } else {
              console.warn('⚠️ [Workflow] 未找到匹配的分析任务', { selectionHash: result.selectionHash });
            }
            
            return updated;
          });
        });
'@

# 定义新代码块
$new = @'
        // 分析完成事件 - ✅ 使用 jobId 精确匹配
        const unlistenDone = await intelligentAnalysisBackend.listenToAnalysisComplete((jobId, result) => {
          console.log('✅ [Workflow] 收到分析完成', { jobId, result });
          
          // 使用 jobId 直接查找任务并更新状态
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
          
          // 使用 jobId 精确匹配并更新步骤卡片
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
'@

# 执行替换
if ($content -match [regex]::Escape("foundJob.jobId")) {
    Write-Host "✅ 找到目标代码，开始替换..." -ForegroundColor Green
    $content = $content.Replace($old, $new)
    Set-Content $file -Value $content
    Write-Host "✅ 替换完成！" -ForegroundColor Green
} else {
    Write-Host "⚠️ 文件中未找到目标代码，可能已经被修改过" -ForegroundColor Yellow
}

# 验证结果
if ((Get-Content $file -Raw) -match "card.analysisJobId === jobId") {
    Write-Host "✅ 验证通过：jobId 精确匹配逻辑已应用" -ForegroundColor Green
} else {
    Write-Host "❌ 验证失败：修改未生效" -ForegroundColor Red
}
