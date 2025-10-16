// 修复重新分析按钮禁用问题的补丁
// 主要问题：analysis.status 可能卡在 'analyzing' 状态

// 1. 在 useSmartStrategyAnalysis.ts 中添加状态重置机制
export const statusResetPatch = `
// 在 useSmartStrategyAnalysis Hook 中添加超时重置机制
useEffect(() => {
  if (strategySelector?.analysis?.status === 'analyzing') {
    // 设置超时，如果10秒后仍在分析状态，自动重置
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ [StrategyAnalysis] 分析超时，重置状态');
      setStrategySelector(prev => prev ? {
        ...prev,
        analysis: {
          status: 'failed',
          error: '分析超时，请重试'
        }
      } : null);
      setIsAnalyzing(false);
      currentJobId.current = null;
    }, 10000); // 10秒超时

    return () => clearTimeout(timeoutId);
  }
}, [strategySelector?.analysis?.status]);
`;

// 2. 在 CompactStrategyMenu.tsx 中添加更智能的禁用逻辑
export const smartDisablePatch = `
// 修改 CompactStrategyMenu.tsx 中的禁用条件
const canReanalyze = useMemo(() => {
  // 基本检查
  if (disabled) return false;
  
  // 分析状态检查
  if (selector.analysis.status === 'analyzing') return false;
  
  // 必要字段检查（根据文档中的6个条件）
  const hasRequiredFields = !!(
    selector.activeStrategy && 
    // 可以从 step 或其他地方获取这些字段
    true // 暂时放行，具体检查逻辑待实现
  );
  
  return hasRequiredFields;
}, [disabled, selector.analysis.status, selector.activeStrategy]);

// 在按钮中使用
disabled={!canReanalyze}
`;

// 3. 添加调试日志
export const debugLogPatch = `
// 在 CompactStrategyMenu.tsx 中添加调试日志
useEffect(() => {
  console.log('🔍 [CompactStrategyMenu] 状态调试:', {
    disabled,
    analysisStatus: selector.analysis.status,
    activeStrategy: selector.activeStrategy,
    hasSelector: !!selector,
    timestamp: new Date().toISOString()
  });
}, [disabled, selector.analysis.status, selector.activeStrategy]);
`;

// 4. 应急修复 - 强制重置分析状态
export const emergencyResetPatch = `
// 在浏览器控制台中运行，强制重置所有分析状态
window.resetAllAnalysisStates = () => {
  console.log('🚨 强制重置所有分析状态');
  
  // 查找所有可能的React实例
  const reactInstances = [];
  
  // 通过DOM查找
  document.querySelectorAll('[data-testid*="step"], [class*="step"]').forEach(el => {
    const reactKey = Object.keys(el).find(key => key.startsWith('__reactInternalInstance'));
    if (reactKey && el[reactKey]) {
      reactInstances.push(el[reactKey]);
    }
  });
  
  console.log(\`找到 \${reactInstances.length} 个可能的React实例\`);
  
  // 尝试触发状态重置
  // 这需要具体的实现细节，这里只是一个框架
};

// 调用应急重置
window.resetAllAnalysisStates();
`;

export default {
  statusResetPatch,
  smartDisablePatch,
  debugLogPatch,
  emergencyResetPatch
};