// 智能策略分析Hook
// src/hooks/universal-ui/useStrategyAnalysis.ts

import { useState, useCallback, useRef } from 'react';
import type { UIElement } from '../../api/universalUIAPI';
import type { 
  AnalysisState, 
  AnalysisProgress, 
  AnalysisResult,
  StrategyAnalysisContext,
  StrategyInfo
} from '../../components/universal-ui/element-selection/types/StrategyAnalysis';

export interface UseStrategyAnalysisReturn {
  // 状态
  analysisState: AnalysisState;
  analysisProgress: AnalysisProgress | null;
  analysisResult: AnalysisResult | null;
  error: string | null;
  
  // 方法
  startAnalysis: (context: StrategyAnalysisContext) => Promise<void>;
  cancelAnalysis: () => void;
  resetAnalysis: () => void;
  
  // 工具方法
  isAnalyzing: boolean;
  hasResult: boolean;
}

// 分析步骤定义
const ANALYSIS_STEPS = [
  { name: '规范化输入', description: '解析元素属性和层级结构' },
  { name: '自我可定位', description: '检查元素自身唯一性特征' },
  { name: '子树找锚点', description: '分析子元素锚点可用性' },
  { name: '区域限定', description: '评估容器边界和相对位置' },
  { name: '邻居相对', description: '检查相邻元素关系' },
  { name: '索引兜底', description: '计算索引定位可靠性' },
  { name: '策略综合', description: '整合分析结果并推荐最佳策略' }
];

// 模拟策略库
const STRATEGY_TEMPLATES: Record<string, Omit<StrategyInfo, 'confidence'>> = {
  'self-anchor': {
    name: '自我定位策略',
    description: '基于元素自身的唯一性特征进行定位，如resource-id、unique text等',
    category: 'self-anchor',
    performance: { speed: 'fast', stability: 'high', crossDevice: 'excellent' },
    pros: ['执行速度最快', '跨设备兼容性最好', '不依赖页面结构变化'],
    cons: ['需要元素具备唯一性特征', '对动态生成ID的处理较弱'],
    scenarios: ['按钮操作', '表单输入', '菜单选择']
  },
  'child-driven': {
    name: '子树锚点策略',
    description: '通过子元素特征定位父容器，适用于复合组件场景',
    category: 'child-driven',
    performance: { speed: 'medium', stability: 'high', crossDevice: 'good' },
    pros: ['对复合组件效果好', '能处理动态结构', '稳定性较高'],
    cons: ['需要遍历子元素', '执行时间稍长'],
    scenarios: ['卡片组件', '列表项操作', '复合按钮']
  },
  'region-scoped': {
    name: '区域限定策略',
    description: '在特定容器区域内定位元素，减少全局查找范围',
    category: 'region-scoped',
    performance: { speed: 'medium', stability: 'medium', crossDevice: 'good' },
    pros: ['减少误匹配', '提高查找精度', '适用于重复结构'],
    cons: ['依赖容器稳定性', '可能受布局变化影响'],
    scenarios: ['表格操作', '重复卡片', '分区内容']
  },
  'neighbor-relative': {
    name: '邻居相对策略',
    description: '通过相邻元素的相对位置关系进行定位',
    category: 'neighbor-relative',
    performance: { speed: 'medium', stability: 'medium', crossDevice: 'fair' },
    pros: ['处理动态内容较好', '不依赖元素自身特征', '适应结构微调'],
    cons: ['受页面布局影响', '跨设备兼容性一般', '逻辑相对复杂'],
    scenarios: ['表单相邻操作', '动态列表', '响应式布局']
  },
  'index-fallback': {
    name: '索引兜底策略',
    description: '基于元素在同类元素中的索引位置进行定位，最后的保底方案',
    category: 'index-fallback',
    performance: { speed: 'fast', stability: 'low', crossDevice: 'fair' },
    pros: ['执行简单直接', '总是能定位到元素', '计算开销小'],
    cons: ['稳定性最低', '易受页面变化影响', '维护成本高'],
    scenarios: ['临时解决方案', '测试环境', '简单重复结构']
  }
};

// 生成选择hash用于防串扰
const generateSelectionHash = (element: UIElement): string => {
  const keyAttrs = [
    element.resource_id,
    element.text,
    element.class_name,
    element.content_desc,
    `${element.bounds?.left}-${element.bounds?.top}`
  ].filter(Boolean).join('|');
  
  return btoa(keyAttrs).slice(0, 12);
};

// 模拟分析逻辑
const analyzeElementStrategy = (context: StrategyAnalysisContext): AnalysisResult => {
  const { element } = context;
  
  // 基于元素特征决定推荐策略
  let recommendedStrategyKey = 'index-fallback';
  let confidence = 60;
  
  if (element.resource_id && element.resource_id.length > 0) {
    recommendedStrategyKey = 'self-anchor';
    confidence = 92 + Math.random() * 6; // 92-98%
  } else if (element.text && element.text.trim().length > 0) {
    recommendedStrategyKey = 'self-anchor';
    confidence = 85 + Math.random() * 8; // 85-93%
  } else if (element.children && element.children.length > 0) {
    recommendedStrategyKey = 'child-driven';
    confidence = 78 + Math.random() * 10; // 78-88%
  } else if ((element as any).parent_info) {
    recommendedStrategyKey = 'region-scoped';
    confidence = 70 + Math.random() * 10; // 70-80%
  }
  
  const recommendedStrategy: StrategyInfo = {
    ...STRATEGY_TEMPLATES[recommendedStrategyKey],
    confidence: Math.round(confidence)
  };
  
  // 生成备选策略
  const alternatives = Object.entries(STRATEGY_TEMPLATES)
    .filter(([key]) => key !== recommendedStrategyKey)
    .sort(() => Math.random() - 0.5) // 随机排序
    .slice(0, 2)
    .map(([, template]) => ({
      ...template,
      confidence: Math.round(confidence - 15 - Math.random() * 20) // 降低备选策略置信度
    }))
    .sort((a, b) => b.confidence - a.confidence);
  
  return {
    recommendedStrategy,
    alternatives,
    analysisMetadata: {
      totalTime: 2000 + Math.random() * 3000,
      elementComplexity: element.children?.length ? 
        (element.children.length > 5 ? 'complex' : 'medium') : 'simple',
      containerStability: 0.6 + Math.random() * 0.4,
      textStability: element.text ? (0.7 + Math.random() * 0.3) : (0.3 + Math.random() * 0.4),
      selectionHash: context.selectionHash
    }
  };
};

export const useStrategyAnalysis = (): UseStrategyAnalysisReturn => {
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const analysisAbortController = useRef<AbortController | null>(null);
  const currentContextRef = useRef<StrategyAnalysisContext | null>(null);

  // 模拟单步分析
  const simulateAnalysisStep = async (stepIndex: number, signal?: AbortSignal): Promise<void> => {
    return new Promise((resolve, reject) => {
      const step = ANALYSIS_STEPS[stepIndex];
      const stepTime = 200 + Math.random() * 600; // 200-800ms per step
      
      const timeout = setTimeout(() => {
        if (signal?.aborted) {
          reject(new Error('Analysis cancelled'));
          return;
        }
        
        setAnalysisProgress({
          currentStep: stepIndex + 1,
          totalSteps: ANALYSIS_STEPS.length,
          stepName: step.name,
          stepDescription: step.description
        });
        
        resolve();
      }, stepTime);
      
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Analysis cancelled'));
        });
      }
    });
  };

  const startAnalysis = useCallback(async (context: StrategyAnalysisContext): Promise<void> => {
    // 防串扰：如果是相同元素的重复分析，直接返回
    if (currentContextRef.current?.selectionHash === context.selectionHash && 
        analysisState === 'analyzing') {
      console.log('🔄 [策略分析] 相同元素分析已在进行中，跳过重复请求');
      return;
    }
    
    // 取消之前的分析
    if (analysisAbortController.current) {
      analysisAbortController.current.abort();
    }
    
    // 生成选择hash
    const selectionHash = context.selectionHash || generateSelectionHash(context.element);
    const fullContext = { ...context, selectionHash };
    currentContextRef.current = fullContext;
    
    // 创建新的取消控制器
    analysisAbortController.current = new AbortController();
    const { signal } = analysisAbortController.current;
    
    try {
      setAnalysisState('analyzing');
      setAnalysisProgress(null);
      setAnalysisResult(null);
      setError(null);
      
      console.log('🧠 [策略分析] 开始分析元素:', context.element, { 
        jobId: context.jobId, 
        stepId: context.stepId,
        selectionHash 
      });
      
      // 逐步执行分析
      for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
        if (signal.aborted) {
          throw new Error('Analysis cancelled');
        }
        
        await simulateAnalysisStep(i, signal);
        console.log(`📊 [分析进度] 步骤 ${i + 1}/${ANALYSIS_STEPS.length}: ${ANALYSIS_STEPS[i].name}`);
      }
      
      // 生成分析结果
      const result = analyzeElementStrategy(fullContext);
      
      if (!signal.aborted) {
        setAnalysisResult(result);
        setAnalysisState('completed');
        console.log('✅ [策略分析] 分析完成，推荐策略:', result.recommendedStrategy.name, {
          confidence: result.recommendedStrategy.confidence,
          selectionHash
        });
      }
      
    } catch (error) {
      if (!signal.aborted) {
        const errorMessage = error instanceof Error ? error.message : '分析过程中出现未知错误';
        setError(errorMessage);
        setAnalysisState('failed');
        console.error('❌ [策略分析] 分析失败:', errorMessage);
      }
    } finally {
      setAnalysisProgress(null);
      if (analysisAbortController.current?.signal === signal) {
        analysisAbortController.current = null;
      }
    }
  }, [analysisState]);

  const cancelAnalysis = useCallback(() => {
    if (analysisAbortController.current) {
      analysisAbortController.current.abort();
      analysisAbortController.current = null;
    }
    
    currentContextRef.current = null;
    setAnalysisState('idle');
    setAnalysisProgress(null);
    setError(null);
    console.log('🚫 [策略分析] 用户取消分析');
  }, []);

  const resetAnalysis = useCallback(() => {
    cancelAnalysis();
    setAnalysisResult(null);
    console.log('🔄 [策略分析] 重置分析状态');
  }, [cancelAnalysis]);

  return {
    // 状态
    analysisState,
    analysisProgress,
    analysisResult,
    error,
    
    // 方法
    startAnalysis,
    cancelAnalysis,
    resetAnalysis,
    
    // 工具属性
    isAnalyzing: analysisState === 'analyzing',
    hasResult: analysisResult !== null
  };
};