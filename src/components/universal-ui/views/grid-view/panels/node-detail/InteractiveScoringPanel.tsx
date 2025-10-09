import React, { useState, useCallback, useMemo } from 'react';
import type { DetailedStrategyRecommendation, DetailedStrategyScore } from './StrategyRecommendationPanel';
import type { MatchStrategy } from './types';
import { StrategyScoreCard } from './StrategyScoreCard';

interface WeightConfig {
  performance: number;
  stability: number;
  compatibility: number;
  uniqueness: number;
}

interface InteractiveScoringPanelProps {
  initialRecommendations: DetailedStrategyRecommendation[];
  onWeightChange?: (weights: WeightConfig) => void;
  onStrategySelect?: (strategy: MatchStrategy) => void;
  className?: string;
}

/**
 * 🎯 交互式策略评分面板
 * 
 * 📍 功能：
 * - 实时权重调整和重新评分
 * - 可视化评分权重滑块
 * - 动态策略排序和推荐
 * - 详细的评分分析图表
 * 
 * 🎨 特色：
 * - 权重配置的实时生效
 * - 评分变化的视觉反馈
 * - 多维度评分的雷达图展示
 * - 策略对比分析工具
 */
export const InteractiveScoringPanel: React.FC<InteractiveScoringPanelProps> = ({
  initialRecommendations,
  onWeightChange,
  onStrategySelect,
  className = ''
}) => {
  const [weights, setWeights] = useState<WeightConfig>({
    performance: 0.3,
    stability: 0.3,
    compatibility: 0.2,
    uniqueness: 0.2
  });

  const [showRadarChart, setShowRadarChart] = useState(false);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);

  // 实时重新计算评分
  const recalculatedRecommendations = useMemo(() => {
    return initialRecommendations.map(rec => {
      const score = rec.score;
      const newTotal = 
        score.performance * weights.performance +
        score.stability * weights.stability +
        score.compatibility * weights.compatibility +
        score.uniqueness * weights.uniqueness;

      return {
        ...rec,
        score: {
          ...score,
          total: newTotal
        }
      };
    }).sort((a, b) => b.score.total - a.score.total);
  }, [initialRecommendations, weights]);

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

  const toggleStrategySelection = (strategy: string) => {
    setSelectedStrategies(prev => 
      prev.includes(strategy) 
        ? prev.filter(s => s !== strategy)
        : [...prev, strategy]
    );
  };

  const renderWeightSlider = (
    key: string, 
    label: string, 
    value: number, 
    color: string
  ) => (
    <div key={key} className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium flex items-center gap-2">
          <div 
            className={`w-3 h-3 rounded-full`}
            style={{ backgroundColor: color }}
          />
          {label}
        </label>
        <span className="text-sm text-neutral-600 font-semibold">
          {Math.round(value * 100)}%
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={value}
        onChange={(e) => handleWeightChange(key, parseFloat(e.target.value))}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer slider-${key}`}
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${value * 100}%, #e5e7eb ${value * 100}%, #e5e7eb 100%)`
        }}
      />
    </div>
  );

  const renderRadarChart = () => {
    if (!showRadarChart || selectedStrategies.length === 0) return null;

    const dimensions = ['performance', 'stability', 'compatibility', 'uniqueness'];
    const chartSize = 200;
    const center = chartSize / 2;
    const radius = 80;

    const selectedRecs = recalculatedRecommendations.filter(rec => 
      selectedStrategies.includes(rec.strategy)
    );

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

    return (
      <div className="mt-6 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
        <h4 className="font-medium mb-4">策略对比雷达图</h4>
        <div className="flex items-center justify-center">
          <svg width={chartSize} height={chartSize} className="border border-neutral-200 rounded">
            {/* 背景网格 */}
            {[0.2, 0.4, 0.6, 0.8, 1].map(scale => (
              <polygon
                key={scale}
                points={dimensions.map((_, i) => {
                  const angle = (i * 2 * Math.PI) / dimensions.length - Math.PI / 2;
                  const x = center + Math.cos(angle) * radius * scale;
                  const y = center + Math.sin(angle) * radius * scale;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}
            
            {/* 维度标签 */}
            {dimensions.map((dim, i) => {
              const angle = (i * 2 * Math.PI) / dimensions.length - Math.PI / 2;
              const x = center + Math.cos(angle) * (radius + 20);
              const y = center + Math.sin(angle) * (radius + 20);
              const labels = {
                performance: '性能',
                stability: '稳定',
                compatibility: '兼容',
                uniqueness: '独特'
              };
              return (
                <text
                  key={dim}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  className="text-xs fill-neutral-600"
                >
                  {labels[dim as keyof typeof labels]}
                </text>
              );
            })}

            {/* 策略数据线 */}
            {selectedRecs.map((rec, recIndex) => (
              <polygon
                key={rec.strategy}
                points={dimensions.map((dim, i) => {
                  const angle = (i * 2 * Math.PI) / dimensions.length - Math.PI / 2;
                  const value = rec.score[dim as keyof DetailedStrategyScore] as number;
                  const x = center + Math.cos(angle) * radius * value;
                  const y = center + Math.sin(angle) * radius * value;
                  return `${x},${y}`;
                }).join(' ')}
                fill={colors[recIndex % colors.length]}
                fillOpacity="0.1"
                stroke={colors[recIndex % colors.length]}
                strokeWidth="2"
              />
            ))}
          </svg>
        </div>
        
        {/* 图例 */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          {selectedRecs.map((rec, index) => (
            <div key={rec.strategy} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm">{rec.strategy}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 权重配置区域 */}
      <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">🎛️ 评分权重配置</h3>
          <button
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            onClick={() => {
              setWeights({
                performance: 0.25,
                stability: 0.25,
                compatibility: 0.25,
                uniqueness: 0.25
              });
            }}
          >
            重置为均衡
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {renderWeightSlider('performance', '性能表现', weights.performance, '#3b82f6')}
          {renderWeightSlider('stability', '稳定性', weights.stability, '#10b981')}
          {renderWeightSlider('compatibility', '兼容性', weights.compatibility, '#f59e0b')}
          {renderWeightSlider('uniqueness', '独特性', weights.uniqueness, '#ef4444')}
        </div>
      </div>

      {/* 策略列表和选择 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">📊 重新评分结果</h3>
          <button
            className="text-sm border border-neutral-300 px-3 py-1 rounded hover:bg-neutral-50"
            onClick={() => setShowRadarChart(!showRadarChart)}
          >
            {showRadarChart ? '隐藏' : '显示'}雷达图
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recalculatedRecommendations.map((rec, index) => (
            <div key={rec.strategy} className="relative">
              <StrategyScoreCard
                strategyName={rec.strategy}
                score={rec.score}
                isRecommended={index === 0}
                size="normal"
                onClick={() => {
                  onStrategySelect?.(rec.strategy as MatchStrategy);
                  toggleStrategySelection(rec.strategy);
                }}
                className={`
                  cursor-pointer transition-all
                  ${selectedStrategies.includes(rec.strategy) 
                    ? 'ring-2 ring-blue-400 shadow-lg' 
                    : 'hover:shadow-md'
                  }
                `}
              />
              <div className="absolute top-2 right-2">
                <input
                  type="checkbox"
                  checked={selectedStrategies.includes(rec.strategy)}
                  onChange={() => toggleStrategySelection(rec.strategy)}
                  className="w-4 h-4"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 雷达图 */}
      {renderRadarChart()}

      {/* 权重效果说明 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">💡 权重调整说明</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• <strong>性能表现</strong>: 影响执行速度和资源消耗的权重</li>
          <li>• <strong>稳定性</strong>: 影响跨环境一致性和可靠性的权重</li>
          <li>• <strong>兼容性</strong>: 影响设备和版本适配度的权重</li>
          <li>• <strong>独特性</strong>: 影响元素区分度和精确性的权重</li>
        </ul>
        <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
          调整权重后，策略评分会实时重新计算并重新排序。权重总和会自动标准化为100%。
        </div>
      </div>
    </div>
  );
};

export default InteractiveScoringPanel;