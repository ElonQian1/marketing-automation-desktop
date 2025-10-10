/**
 * GridInspectorIntegration.ts
 * 页面分析器智能策略集成示例
 * 
 * @description 展示如何将智能策略推荐集成到"确定"按钮点击流程中
 */

import { analyzeElementForStrategy, previewStrategyForElement } from '../../../../../services/IntelligentStrategyService';
import type { EnhancedRecommendation } from '../../../../../services/IntelligentStrategyService';

/**
 * 在页面分析器中点击"确定"按钮时的处理逻辑
 * 这个函数演示了如何替换原来的手动策略选择为智能推荐
 */
export async function handleConfirmButtonWithIntelligentStrategy(
  selectedElement: any,  // 当前选中的元素
  xmlContent: string,    // 页面XML内容
  existingStrategy?: string  // 用户可能已选择的策略
): Promise<{
  stepCard: any;
  recommendation: EnhancedRecommendation;
  wasIntelligentlyRecommended: boolean;
}> {
  
  console.log('🧠 启动智能策略分析...');
  
  try {
    // 1. 使用智能策略服务分析元素
    const recommendation = await analyzeElementForStrategy(selectedElement, xmlContent);
    
    // 2. 决定是使用智能推荐还是用户选择的策略
    let finalStrategy = recommendation.strategy;
    let wasIntelligentlyRecommended = true;
    
    if (existingStrategy && existingStrategy !== 'auto') {
      // 如果用户已手动选择策略，优先使用用户选择
      finalStrategy = existingStrategy as any;
      wasIntelligentlyRecommended = false;
      console.log('👤 使用用户手动选择的策略:', existingStrategy);
    } else {
      console.log('🎯 使用智能推荐策略:', recommendation.strategy, 
                  `(置信度: ${(recommendation.confidence * 100).toFixed(1)}%)`);
    }
    
    // 3. 生成步骤卡片
    const stepCard = {
      // 三要素
      xmlSnapshot: recommendation.stepCardParams?.xmlSnapshot,
      absoluteXPath: recommendation.stepCardParams?.absoluteXPath,
      selectedStrategy: finalStrategy,
      
      // 智能推荐的扩展信息
      plan: recommendation.alternatives || [],
      recommendedIndex: wasIntelligentlyRecommended ? 0 : -1,
      confidence: recommendation.confidence,
      intelligentRecommendation: {
        strategy: recommendation.strategy,
        reason: recommendation.reason,
        performance: recommendation.performance,
        alternatives: recommendation.alternatives?.slice(0, 3) || [] // 只保留前3个备选
      },
      
      // 执行配置
      allowBackendFallback: true,
      timeBudgetMs: 1200,
      assertions: (recommendation.stepCardParams as any)?.assertions || [],
      
      // 元数据
      createdAt: new Date().toISOString(),
      createdBy: 'intelligent-strategy-system',
      version: '1.0.0'
    };
    
    // 4. 记录分析统计
    console.log('📊 智能策略分析完成', {
      totalTime: recommendation.executionStats?.totalTime,
      candidateCount: recommendation.executionStats?.candidateCount,
      selectedStrategy: finalStrategy,
      confidence: recommendation.confidence
    });
    
    return {
      stepCard,
      recommendation,
      wasIntelligentlyRecommended
    };
    
  } catch (error) {
    console.error('❌ 智能策略分析失败，使用回退逻辑:', error);
    
    // 回退到原有的步骤卡片生成逻辑
    const fallbackStrategy = selectedElement.xpath ? 'xpath-direct' : 'standard';
    
    return {
      stepCard: {
        xmlSnapshot: xmlContent,
        absoluteXPath: generateFallbackXPath(selectedElement),
        selectedStrategy: existingStrategy || fallbackStrategy,
        plan: [],
        recommendedIndex: -1,
        confidence: 0.3,
        createdAt: new Date().toISOString(),
        createdBy: 'fallback-logic',
        error: error.message
      },
      recommendation: null as any,
      wasIntelligentlyRecommended: false
    };
  }
}

/**
 * 在策略选择器中显示智能推荐标识
 * 这个函数可以在策略选择器组件中调用，为推荐的策略添加特殊标识
 */
export async function getStrategyRecommendationForSelector(
  selectedElement: any,
  xmlContent: string
): Promise<{
  recommendedStrategy: string | null;
  confidence: number;
  reason: string;
}> {
  
  try {
    const recommendation = await previewStrategyForElement(selectedElement, xmlContent);
    
    return {
      recommendedStrategy: recommendation.strategy,
      confidence: recommendation.confidence,
      reason: recommendation.reason
    };
    
  } catch (error) {
    console.warn('策略预览失败:', error);
    return {
      recommendedStrategy: null,
      confidence: 0,
      reason: '预览失败'
    };
  }
}

/**
 * 用于在UI中显示智能推荐标识的工具函数
 */
export function formatRecommendationBadge(
  strategy: string, 
  confidence: number, 
  isRecommended: boolean
): {
  text: string;
  color: string;
  icon: string;
} {
  if (!isRecommended) {
    return { text: '', color: '', icon: '' };
  }
  
  if (confidence > 0.8) {
    return {
      text: '🎯 强烈推荐',
      color: 'success',
      icon: 'check-circle'
    };
  } else if (confidence > 0.6) {
    return {
      text: '👍 推荐',
      color: 'processing',
      icon: 'like'
    };
  } else {
    return {
      text: '💡 建议',
      color: 'warning',
      icon: 'bulb'
    };
  }
}

// === 辅助函数 ===

/**
 * 生成回退XPath（当智能分析失败时）
 */
function generateFallbackXPath(element: any): string {
  if (element.xpath) {
    return element.xpath;
  }
  
  if (element.resource_id || element['resource-id']) {
    const resourceId = element.resource_id || element['resource-id'];
    return `//*[@resource-id="${resourceId}"]`;
  }
  
  if (element.text) {
    return `//*[@text="${element.text}"]`;
  }
  
  // 最后的兜底方案
  const index = element.index || element.attrs?.['index'] || '0';
  return `//node[@index='${index}']`;
}

/**
 * 集成配置选项
 */
export interface IntelligentStrategyConfig {
  /** 是否启用智能推荐 */
  enabled: boolean;
  
  /** 最低置信度阈值，低于此值时不使用智能推荐 */
  minConfidenceThreshold: number;
  
  /** 是否允许用户覆盖智能推荐 */
  allowUserOverride: boolean;
  
  /** 是否在UI中显示推荐理由 */
  showRecommendationReason: boolean;
  
  /** 调试模式 */
  debugMode: boolean;
}

/**
 * 默认配置
 */
export const DEFAULT_INTELLIGENT_STRATEGY_CONFIG: IntelligentStrategyConfig = {
  enabled: true,
  minConfidenceThreshold: 0.4,
  allowUserOverride: true,
  showRecommendationReason: true,
  debugMode: false
};

// === 使用示例 ===

/**
 * 在 React 组件中的使用示例
 */
export const USAGE_EXAMPLE = `
// 在页面分析器的确定按钮点击处理中：
const handleConfirmClick = async () => {
  const result = await handleConfirmButtonWithIntelligentStrategy(
    selectedElement,
    xmlContent,
    userSelectedStrategy
  );
  
  // 创建步骤卡片
  const stepCard = result.stepCard;
  
  // 显示推荐信息（可选）
  if (result.wasIntelligentlyRecommended) {
    message.success(\`智能推荐策略: \${result.recommendation.strategy}\`);
  }
  
  // 发送到后端或保存到状态
  onStepCardCreated(stepCard);
};

// 在策略选择器中显示推荐标识：
const [recommendation, setRecommendation] = useState(null);

useEffect(() => {
  if (selectedElement && xmlContent) {
    getStrategyRecommendationForSelector(selectedElement, xmlContent)
      .then(setRecommendation);
  }
}, [selectedElement, xmlContent]);

// 渲染策略选项时：
{strategies.map(strategy => (
  <Button
    key={strategy}
    type={strategy === recommendation?.recommendedStrategy ? 'primary' : 'default'}
  >
    {strategy}
    {strategy === recommendation?.recommendedStrategy && (
      <Badge {...formatRecommendationBadge(strategy, recommendation.confidence, true)} />
    )}
  </Button>
))}
`;