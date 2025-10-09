import React, { useState, useMemo } from 'react';
import type { StrategyRecommendation } from '../../../../../../modules/intelligent-strategy-system';
import type { MatchStrategy } from './types';
import { StrategyScoreCard } from './StrategyScoreCard';

// 临时定义详细评分接口，直到与主模块集成
export interface DetailedStrategyScore {
  total: number;
  performance: number;
  stability: number;
  compatibility: number;
  uniqueness: number;
  confidence?: number;
}

export interface DetailedStrategyRecommendation {
  strategy: string;
  score: DetailedStrategyScore;
  confidence: number;
  reason: string;
}

interface StrategyRecommendationPanelProps {
  recommendations: DetailedStrategyRecommendation[];
  currentStrategy?: MatchStrategy;
  onStrategySelect?: (strategy: MatchStrategy) => void;
  onWeightChange?: (weights: Record<string, number>) => void;
  className?: string;
  compact?: boolean;
  loading?: boolean;
  error?: string | null;
}

/**
 * 🎯 策略推荐面板组件
 * 
 * 📍 功能：
 * - 显示所有策略的评分和推荐排序
 * - 支持权重调整和实时重新评分
 * - 提供策略详细分析和优缺点说明
 * 
 * 🎨 设计原则：
 * - 清晰的信息层级和视觉分组
 * - 支持紧凑模式和详细模式切换
 * - 提供交互式的权重配置界面
 */
export const StrategyRecommendationPanel: React.FC<StrategyRecommendationPanelProps> = ({
  recommendations,
  currentStrategy,
  onStrategySelect,
  onWeightChange,
  className = '',
  compact = false,
  loading = false,
  error = null
}) => {
  const [showWeightConfig, setShowWeightConfig] = useState(false);
  const [weights, setWeights] = useState({
    performance: 0.3,
    stability: 0.3,
    compatibility: 0.2,
    uniqueness: 0.2
  });

  // 策略名称映射
  const strategyNameMap: Record<string, string> = {
    'xpath-direct': 'XPath直接',
    'xpath-first-index': 'XPath[1]索引',
    'xpath-all-elements': 'XPath全部元素',
    'absolute': '绝对定位',
    'strict': '严格匹配',
    'relaxed': '宽松匹配',
    'positionless': '匹配任意位置',
    'standard': '标准匹配',
    'hidden-element-parent': '隐藏元素',
    'custom': '自定义'
  };

  // 策略描述映射
  const strategyDescMap: Record<string, { advantages: string[], disadvantages: string[] }> = {
    'xpath-direct': {
      advantages: ['执行速度最快', '精确定位', '资源消耗低'],
      disadvantages: ['设备依赖性强', '布局变化敏感', '可读性较差']
    },
    'standard': {
      advantages: ['跨设备兼容性好', '稳定性高', '可维护性强'],
      disadvantages: ['执行速度相对较慢', '可能存在歧义匹配']
    },
    'strict': {
      advantages: ['高精确度', '误匹配率低', '语义清晰'],
      disadvantages: ['对元素变化敏感', '可能过度严格']
    },
    'relaxed': {
      advantages: ['容错性强', '适应性好', '成功率高'],
      disadvantages: ['可能匹配到错误元素', '精确度相对较低']
    }
  };

  const sortedRecommendations = useMemo(() => {
    return [...recommendations].sort((a, b) => b.score.total - a.score.total);
  }, [recommendations]);

  const topRecommendation = sortedRecommendations[0];

  const handleWeightChange = (dimension: string, value: number) => {
    const newWeights = { ...weights, [dimension]: value };
    setWeights(newWeights);
    onWeightChange?.(newWeights);
  };

  const renderCompactMode = () => (
    <div className={`space-y-2 ${className}`}>
      {/* 🚨 加载和错误状态优先显示 */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>分析策略推荐中...</span>
        </div>
      )}
      
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
          ⚠️ {error}
        </div>
      )}
      
      {!loading && !error && (
        <>
          <div className="flex items-center justify-between text-sm font-medium">
            <span>策略推荐</span>
            <button 
              className="text-xs text-blue-600 hover:text-blue-700"
              onClick={() => setShowWeightConfig(!showWeightConfig)}
            >
              {showWeightConfig ? '收起配置' : '权重配置'}
            </button>
          </div>

      {showWeightConfig && (
        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 space-y-2">
          {Object.entries(weights).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-xs">{
                key === 'performance' ? '性能' :
                key === 'stability' ? '稳定' :
                key === 'compatibility' ? '兼容' : '独特'
              }:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={value}
                onChange={(e) => handleWeightChange(key, parseFloat(e.target.value))}
                className="w-16 h-1"
              />
              <span className="text-xs w-8 text-right">{Math.round(value * 100)}%</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1">
        {sortedRecommendations.slice(0, 3).map((rec, index) => {
          const strategyKey = rec.strategy as MatchStrategy;
          return (
            <StrategyScoreCard
              key={rec.strategy}
              strategyName={strategyNameMap[rec.strategy] || rec.strategy}
              score={rec.score}
              isRecommended={index === 0}
              size="compact"
              onClick={() => onStrategySelect?.(strategyKey)}
              className={currentStrategy === rec.strategy ? 'ring-2 ring-blue-300' : ''}
            />
          );
        })}
      </div>
        </>
      )}
    </div>
  );

  const renderDetailedMode = () => (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">智能策略推荐</h3>
        <button 
          className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1 rounded border border-blue-200 hover:bg-blue-50"
          onClick={() => setShowWeightConfig(!showWeightConfig)}
        >
          {showWeightConfig ? '收起权重配置' : '调整权重配置'}
        </button>
      </div>

      {/* 权重配置面板 */}
      {showWeightConfig && (
        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
          <h4 className="font-medium mb-3">评分权重配置</h4>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(weights).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">
                    {key === 'performance' ? '性能表现' :
                     key === 'stability' ? '稳定性' :
                     key === 'compatibility' ? '兼容性' : '独特性'}
                  </label>
                  <span className="text-sm text-neutral-600">{Math.round(value * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={value}
                  onChange={(e) => handleWeightChange(key, parseFloat(e.target.value))}
                  className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-neutral-500">
            * 权重总和会自动标准化，调整后将实时重新计算策略评分
          </div>
        </div>
      )}

      {/* 推荐策略卡片 */}
      {topRecommendation && (
        <div className="border-l-4 border-blue-500 pl-4">
          <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">🎯 推荐策略</h4>
          <StrategyScoreCard
            strategyName={strategyNameMap[topRecommendation.strategy] || topRecommendation.strategy}
            score={topRecommendation.score}
            isRecommended={true}
            size="detailed"
            onClick={() => onStrategySelect?.(topRecommendation.strategy as MatchStrategy)}
            className={currentStrategy === topRecommendation.strategy ? 'ring-2 ring-blue-300' : 'cursor-pointer hover:shadow-md'}
          />
          
          {/* 策略优缺点分析 */}
          {strategyDescMap[topRecommendation.strategy] && (
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-green-700 dark:text-green-300 mb-1">✅ 优势</h5>
                <ul className="text-neutral-600 dark:text-neutral-400 space-y-1">
                  {strategyDescMap[topRecommendation.strategy].advantages.map((adv, idx) => (
                    <li key={idx} className="text-xs">• {adv}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-orange-700 dark:text-orange-300 mb-1">⚠️ 注意</h5>
                <ul className="text-neutral-600 dark:text-neutral-400 space-y-1">
                  {strategyDescMap[topRecommendation.strategy].disadvantages.map((dis, idx) => (
                    <li key={idx} className="text-xs">• {dis}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 所有策略列表 */}
      <div>
        <h4 className="font-medium mb-3">所有策略评分 ({sortedRecommendations.length})</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedRecommendations.map((rec, index) => {
            const strategyKey = rec.strategy as MatchStrategy;
            return (
              <StrategyScoreCard
                key={rec.strategy}
                strategyName={strategyNameMap[rec.strategy] || rec.strategy}
                score={rec.score}
                isRecommended={index === 0}
                size="normal"
                onClick={() => onStrategySelect?.(strategyKey)}
                className={`
                  ${currentStrategy === rec.strategy ? 'ring-2 ring-blue-300' : ''}
                  ${index === 0 ? '' : 'opacity-90'}
                  cursor-pointer hover:shadow-md transition-shadow
                `}
              />
            );
          })}
        </div>
      </div>
    </div>
  );

  return compact ? renderCompactMode() : renderDetailedMode();
};

export default StrategyRecommendationPanel;