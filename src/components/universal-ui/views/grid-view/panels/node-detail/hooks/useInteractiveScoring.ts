import { useState, useCallback, useMemo, useEffect } from 'react';
import type { DetailedStrategyRecommendation, DetailedStrategyScore } from '../StrategyRecommendationPanel';
import type { MatchStrategy } from '../types';
import { strategySystemAdapter } from '../StrategySystemAdapter';

interface WeightConfig {
  performance: number;
  stability: number;
  compatibility: number;
  uniqueness: number;
}

interface UseInteractiveScoringProps {
  sourceElement?: any; // 分析的源元素
  initialRecommendations?: DetailedStrategyRecommendation[];
  onWeightChange?: (weights: WeightConfig) => void;
  onStrategySelect?: (strategy: MatchStrategy) => void;
}

interface UseInteractiveScoringReturn {
  weights: WeightConfig;
  recommendations: DetailedStrategyRecommendation[];
  isLoading: boolean;
  error: string | null;
  handleWeightChange: (dimension: string, value: number) => void;
  resetWeights: () => void;
  refreshRecommendations: () => Promise<void>;
}

/**
 * 🎯 交互式评分 Hook
 * 
 * 📍 功能：
 * - 管理权重配置和实时重新评分
 * - 集成真实智能策略系统分析
 * - 提供缓存和错误处理机制
 * - 支持权重变化时的智能重新评分
 * 
 * 🎨 特色：
 * - 权重自动归一化处理
 * - 基于权重的真实重新评分
 * - 防抖和缓存优化
 * - 完整的错误处理和加载状态
 */
export const useInteractiveScoring = ({
  sourceElement,
  initialRecommendations = [],
  onWeightChange,
  onStrategySelect
}: UseInteractiveScoringProps): UseInteractiveScoringReturn => {
  
  // 权重配置状态
  const [weights, setWeights] = useState<WeightConfig>({
    performance: 0.3,
    stability: 0.3,
    compatibility: 0.2,
    uniqueness: 0.2
  });

  // 分析状态
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseRecommendations, setBaseRecommendations] = useState<DetailedStrategyRecommendation[]>(initialRecommendations);

  // 🆕 实时重新计算评分（基于权重的真实分析）
  const recommendations = useMemo(() => {
    if (baseRecommendations.length === 0) return [];

    return baseRecommendations.map(rec => {
      const score = rec.score;
      
      // 使用用户自定义权重重新计算总分
      const newTotal = 
        score.performance * weights.performance +
        score.stability * weights.stability +
        score.compatibility * weights.compatibility +
        score.uniqueness * weights.uniqueness;

      return {
        ...rec,
        score: {
          ...score,
          total: Math.min(1.0, Math.max(0.0, newTotal)) // 确保在合理范围内
        }
      };
    }).sort((a, b) => b.score.total - a.score.total);
  }, [baseRecommendations, weights]);

  // 权重变化处理（自动归一化）
  const handleWeightChange = useCallback((dimension: string, value: number) => {
    const newWeights = { ...weights, [dimension]: value };
    
    // 确保权重总和为1
    const total = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
    if (total > 0) {
      const normalizedWeights: WeightConfig = {
        performance: newWeights.performance / total,
        stability: newWeights.stability / total,
        compatibility: newWeights.compatibility / total,
        uniqueness: newWeights.uniqueness / total
      };
      
      setWeights(normalizedWeights);
      onWeightChange?.(normalizedWeights);
    }
  }, [weights, onWeightChange]);

  // 重置权重为默认值
  const resetWeights = useCallback(() => {
    const defaultWeights: WeightConfig = {
      performance: 0.25,
      stability: 0.25,
      compatibility: 0.25,
      uniqueness: 0.25
    };
    setWeights(defaultWeights);
    onWeightChange?.(defaultWeights);
  }, [onWeightChange]);

  // 🆕 刷新推荐（使用真实智能策略系统）
  const refreshRecommendations = useCallback(async () => {
    if (!sourceElement) {
      setError('缺少源元素，无法进行策略分析');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 开始刷新策略推荐', { sourceElement: sourceElement.tag });
      
      // 使用真实智能策略系统分析
      const newRecommendations = await strategySystemAdapter.analyzeElement(sourceElement);
      
      setBaseRecommendations(newRecommendations);
      console.log('✅ 策略推荐刷新完成', { count: newRecommendations.length });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '策略分析失败';
      console.error('❌ 策略推荐刷新失败', err);
      setError(errorMessage);
      
      // 失败时使用模拟数据作为降级
      if (initialRecommendations.length > 0) {
        setBaseRecommendations(initialRecommendations);
      }
    } finally {
      setIsLoading(false);
    }
  }, [sourceElement, initialRecommendations]);

  // 🆕 自动触发分析（当源元素变化时）
  useEffect(() => {
    if (sourceElement && baseRecommendations.length === 0) {
      // 延迟执行避免频繁调用
      const timeoutId = setTimeout(() => {
        refreshRecommendations();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [sourceElement, baseRecommendations.length, refreshRecommendations]);

  // 初始化基础推荐数据
  useEffect(() => {
    if (initialRecommendations.length > 0 && baseRecommendations.length === 0) {
      setBaseRecommendations(initialRecommendations);
    }
  }, [initialRecommendations, baseRecommendations.length]);

  return {
    weights,
    recommendations,
    isLoading,
    error,
    handleWeightChange,
    resetWeights,
    refreshRecommendations
  };
};

export type { WeightConfig };