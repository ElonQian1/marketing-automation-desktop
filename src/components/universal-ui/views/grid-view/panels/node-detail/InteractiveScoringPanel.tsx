import React, { useState } from 'react';
import type { DetailedStrategyRecommendation, DetailedStrategyScore } from './StrategyRecommendationPanel';
import type { MatchStrategy } from './types';
import { StrategyScoreCard } from './StrategyScoreCard';
import { useInteractiveScoring } from './hooks/useInteractiveScoring';
import { useBreakpoint, useMobileDetection, useResponsiveValue } from './responsive';
import { generateMobileButtonClasses, generateA11yFocusClasses, mergeClasses } from './responsive/utils';

interface WeightConfig {
  performance: number;
  stability: number;
  compatibility: number;
  uniqueness: number;
}

interface InteractiveScoringPanelProps {
  initialRecommendations: DetailedStrategyRecommendation[];
  sourceElement?: any; // 🆕 分析的源元素
  onWeightChange?: (weights: WeightConfig) => void;
  onStrategySelect?: (strategy: MatchStrategy) => void;
  className?: string;
}

/**
 * 🎯 交互式策略评分面板（响应式优化版）
 * 
 * 📍 功能：
 * - 实时权重调整和重新评分
 * - 可视化评分权重滑块
 * - 动态策略排序和推荐
 * - 详细的评分分析图表
 * - 📱 移动端优化：触摸友好的滑块和自适应雷达图
 * 
 * 🎨 特色：
 * - 权重配置的实时生效
 * - 评分变化的视觉反馈
 * - 多维度评分的雷达图展示
 * - 策略对比分析工具
 * - 响应式布局，支持从手机到桌面的全屏适配
 * - WCAG 2.1 AA 合规的可访问性支持
 */
export const InteractiveScoringPanel: React.FC<InteractiveScoringPanelProps> = ({
  initialRecommendations,
  sourceElement,
  onWeightChange,
  onStrategySelect,
  className = ''
}) => {
  const [showRadarChart, setShowRadarChart] = useState(false);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);

  // 响应式状态检测
  const breakpoint = useBreakpoint();
  const { isMobile, isTouchDevice } = useMobileDetection();
  const isTablet = breakpoint.isTablet;

  // 响应式值配置
  const containerSpacing = useResponsiveValue({
    xs: 'space-y-4',
    sm: 'space-y-5',
    md: 'space-y-6',
    lg: 'space-y-6',
    xl: 'space-y-6',
    '2xl': 'space-y-8'
  });

  const sectionPadding = useResponsiveValue({
    xs: 'p-3',
    sm: 'p-4',
    md: 'p-4',
    lg: 'p-5',
    xl: 'p-6',
    '2xl': 'p-6'
  });

  const titleSize = useResponsiveValue({
    xs: 'text-base',
    sm: 'text-lg',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  });

  const weightGridLayout = useResponsiveValue({
    xs: 'grid grid-cols-1 gap-3', // 移动端单列
    sm: 'grid grid-cols-2 gap-4', // 平板双列
    md: 'grid grid-cols-2 gap-4', // 桌面双列
    lg: 'grid grid-cols-2 gap-4',
    xl: 'grid grid-cols-2 gap-5',
    '2xl': 'grid grid-cols-2 gap-6'
  });

  const strategiesGridLayout = useResponsiveValue({
    xs: 'grid grid-cols-1 gap-3', // 移动端单列
    sm: 'grid grid-cols-1 gap-4', // 小平板单列
    md: 'grid grid-cols-2 gap-4', // 桌面双列
    lg: 'grid grid-cols-2 gap-4',
    xl: 'grid grid-cols-2 gap-5',
    '2xl': 'grid grid-cols-3 gap-6' // 超大屏三列
  });

  // 🆕 使用智能评分 Hook 替代原有逻辑
  const {
    weights,
    recommendations: recalculatedRecommendations,
    isLoading,
    error,
    handleWeightChange,
    resetWeights,
    refreshRecommendations
  } = useInteractiveScoring({
    sourceElement,
    initialRecommendations,
    onWeightChange,
    onStrategySelect
  });

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
    <div key={key} className={mergeClasses(
      "space-y-2",
      // 移动端增加更多垂直间距
      isMobile ? "space-y-3" : "space-y-2"
    )}>
      <div className="flex justify-between items-center">
        <label className={mergeClasses(
          "font-medium flex items-center gap-2",
          useResponsiveValue({
            xs: "text-sm",
            sm: "text-sm",
            md: "text-base"
          })
        )}>
          <div 
            className={mergeClasses(
              "rounded-full",
              useResponsiveValue({
                xs: "w-3 h-3", // 移动端稍小
                sm: "w-3 h-3",
                md: "w-4 h-4"  // 桌面端稍大
              })
            )}
            style={{ backgroundColor: color }}
          />
          {label}
        </label>
        <span className={mergeClasses(
          "text-neutral-600 font-semibold",
          useResponsiveValue({
            xs: "text-sm",
            sm: "text-sm", 
            md: "text-base"
          })
        )}>
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
        className={mergeClasses(
          "w-full rounded-lg appearance-none cursor-pointer",
          `slider-${key}`,
          useResponsiveValue({
            xs: "h-3", // 移动端更粗的滑块便于触摸
            sm: "h-2.5",
            md: "h-2"
          }),
          // 移动端增强触摸反馈
          isTouchDevice ? "active:scale-105 transition-transform" : ""
        )}
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${value * 100}%, #e5e7eb ${value * 100}%, #e5e7eb 100%)`
        }}
        // 移动端可访问性增强
        aria-label={`${label}权重调整，当前值${Math.round(value * 100)}%`}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
      />
    </div>
  );

  const renderRadarChart = () => {
    if (!showRadarChart || selectedStrategies.length === 0) return null;

    const dimensions = ['performance', 'stability', 'compatibility', 'uniqueness'];
    
    // 响应式图表尺寸
    const chartSize = useResponsiveValue({
      xs: 160,  // 移动端更小
      sm: 180,  // 小平板
      md: 200,  // 标准尺寸
      lg: 220,  // 大屏
      xl: 240,  // 超大屏
      '2xl': 260
    });
    
    const center = chartSize / 2;
    const radius = chartSize * 0.35; // 响应式半径比例

    const selectedRecs = recalculatedRecommendations.filter(rec => 
      selectedStrategies.includes(rec.strategy)
    );

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

    return (
      <div className={mergeClasses(
        "border border-neutral-200 dark:border-neutral-700 rounded-lg",
        sectionPadding,
        useResponsiveValue({
          xs: "mt-4",
          sm: "mt-5",
          md: "mt-6"
        })
      )}>
        <h4 className={mergeClasses(
          "font-medium mb-4",
          useResponsiveValue({
            xs: "text-sm",
            sm: "text-base",
            md: "text-base"
          })
        )}>
          策略对比雷达图
        </h4>
        <div className="flex items-center justify-center">
          <svg 
            width={chartSize} 
            height={chartSize} 
            className="border border-neutral-200 rounded"
            viewBox={`0 0 ${chartSize} ${chartSize}`}
          >
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
              const labelDistance = radius + (isMobile ? 15 : 20); // 移动端标签更近
              const x = center + Math.cos(angle) * labelDistance;
              const y = center + Math.sin(angle) * labelDistance;
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
                  className={mergeClasses(
                    "fill-neutral-600",
                    useResponsiveValue({
                      xs: "text-xs",
                      sm: "text-xs",
                      md: "text-sm"
                    })
                  )}
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
                strokeWidth={isMobile ? "1.5" : "2"} // 移动端稍细的线条
              />
            ))}
          </svg>
        </div>
        
        {/* 图例 - 响应式布局 */}
        <div className={mergeClasses(
          "mt-4 flex flex-wrap gap-3 justify-center",
          useResponsiveValue({
            xs: "gap-2", // 移动端更小间距
            sm: "gap-3",
            md: "gap-3"
          })
        )}>
          {selectedRecs.map((rec, index) => (
            <div key={rec.strategy} className="flex items-center gap-2">
              <div 
                className={mergeClasses(
                  "rounded",
                  useResponsiveValue({
                    xs: "w-2.5 h-2.5", // 移动端更小图例
                    sm: "w-3 h-3",
                    md: "w-3 h-3"
                  })
                )}
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className={useResponsiveValue({
                xs: "text-xs",
                sm: "text-sm",
                md: "text-sm"
              })}>
                {rec.strategy}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={mergeClasses(containerSpacing, className)}>
      {/* 🚨 加载和错误状态 - 响应式优化 */}
      {isLoading && (
        <div className={mergeClasses(
          "flex items-center gap-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg",
          useResponsiveValue({
            xs: "px-3 py-2 text-sm",
            sm: "px-4 py-3 text-sm",
            md: "px-4 py-3 text-base"
          })
        )}>
          <div className={mergeClasses(
            "border-2 border-blue-600 border-t-transparent rounded-full animate-spin",
            useResponsiveValue({
              xs: "w-4 h-4",
              sm: "w-5 h-5",
              md: "w-5 h-5"
            })
          )}></div>
          <span>正在分析策略推荐...</span>
        </div>
      )}
      
      {error && (
        <div className={mergeClasses(
          "text-red-600 bg-red-50 border border-red-200 rounded-lg",
          useResponsiveValue({
            xs: "px-3 py-2",
            sm: "px-4 py-3",
            md: "px-4 py-3"
          })
        )}>
          <div className="flex items-center gap-2">
            <span className={useResponsiveValue({
              xs: "text-sm",
              sm: "text-sm",
              md: "text-base"
            })}>
              ⚠️ {error}
            </span>
            <button 
              className={mergeClasses(
                "ml-auto bg-red-600 text-white rounded hover:bg-red-700",
                generateMobileButtonClasses(isMobile, 'sm'),
                generateA11yFocusClasses(),
                useResponsiveValue({
                  xs: "text-xs px-2 py-1",
                  sm: "text-sm px-2 py-1",
                  md: "text-sm px-3 py-1"
                })
              )}
              onClick={refreshRecommendations}
            >
              重试
            </button>
          </div>
        </div>
      )}
      
      {/* 权重配置区域 - 响应式优化 */}
      <div className={mergeClasses(
        "bg-neutral-50 dark:bg-neutral-800 rounded-lg",
        sectionPadding
      )}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={mergeClasses("font-semibold", titleSize)}>
            🎛️ 评分权重配置
          </h3>
          <button
            className={mergeClasses(
              "bg-blue-600 text-white rounded hover:bg-blue-700",
              generateMobileButtonClasses(isMobile, 'sm'),
              generateA11yFocusClasses(),
              useResponsiveValue({
                xs: "text-xs px-2 py-1",
                sm: "text-sm px-3 py-1",
                md: "text-sm px-3 py-1"
              })
            )}
            onClick={resetWeights}
            aria-label="重置权重为均衡配置"
          >
            {isMobile ? "重置" : "重置为均衡"}
          </button>
        </div>
        
        <div className={weightGridLayout}>
          {renderWeightSlider('performance', '性能表现', weights.performance, '#3b82f6')}
          {renderWeightSlider('stability', '稳定性', weights.stability, '#10b981')}
          {renderWeightSlider('compatibility', '兼容性', weights.compatibility, '#f59e0b')}
          {renderWeightSlider('uniqueness', '独特性', weights.uniqueness, '#ef4444')}
        </div>
      </div>

      {/* 策略列表和选择 - 响应式布局 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={mergeClasses("font-semibold", titleSize)}>
            📊 重新评分结果
          </h3>
          <button
            className={mergeClasses(
              "border border-neutral-300 rounded hover:bg-neutral-50",
              generateMobileButtonClasses(isMobile, 'sm'),
              generateA11yFocusClasses(),
              useResponsiveValue({
                xs: "text-xs px-2 py-1",
                sm: "text-sm px-3 py-1",
                md: "text-sm px-3 py-1"
              })
            )}
            onClick={() => setShowRadarChart(!showRadarChart)}
            aria-label={`${showRadarChart ? '隐藏' : '显示'}雷达图对比`}
          >
            {showRadarChart ? '隐藏' : '显示'}雷达图
          </button>
        </div>
        
        <div className={strategiesGridLayout}>
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
                className={mergeClasses(
                  "cursor-pointer transition-all",
                  selectedStrategies.includes(rec.strategy) 
                    ? 'ring-2 ring-blue-400 shadow-lg' 
                    : 'hover:shadow-md'
                )}
              />
              <div className={mergeClasses(
                "absolute top-2 right-2",
                // 移动端增大复选框触摸区域
                isMobile ? "p-1" : ""
              )}>
                <input
                  type="checkbox"
                  checked={selectedStrategies.includes(rec.strategy)}
                  onChange={() => toggleStrategySelection(rec.strategy)}
                  className={mergeClasses(
                    useResponsiveValue({
                      xs: "w-5 h-5", // 移动端更大的复选框
                      sm: "w-4 h-4",
                      md: "w-4 h-4"
                    })
                  )}
                  aria-label={`选择${rec.strategy}策略进行对比`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 雷达图 */}
      {renderRadarChart()}

      {/* 权重效果说明 - 响应式优化 */}
      <div className={mergeClasses(
        "bg-blue-50 dark:bg-blue-900/20 rounded-lg",
        sectionPadding
      )}>
        <h4 className={mergeClasses(
          "font-medium text-blue-800 dark:text-blue-200 mb-2",
          useResponsiveValue({
            xs: "text-sm",
            sm: "text-base",
            md: "text-base"
          })
        )}>
          💡 权重调整说明
        </h4>
        <ul className={mergeClasses(
          "text-blue-700 dark:text-blue-300 space-y-1",
          useResponsiveValue({
            xs: "text-xs space-y-0.5",
            sm: "text-sm space-y-1",
            md: "text-sm space-y-1"
          })
        )}>
          <li>• <strong>性能表现</strong>: 影响执行速度和资源消耗的权重</li>
          <li>• <strong>稳定性</strong>: 影响跨环境一致性和可靠性的权重</li>
          <li>• <strong>兼容性</strong>: 影响设备和版本适配度的权重</li>
          <li>• <strong>独特性</strong>: 影响元素区分度和精确性的权重</li>
        </ul>
        <div className={mergeClasses(
          "mt-3 text-blue-600 dark:text-blue-400",
          useResponsiveValue({
            xs: "text-xs",
            sm: "text-xs",
            md: "text-xs"
          })
        )}>
          调整权重后，策略评分会实时重新计算并重新排序。权重总和会自动标准化为100%。
        </div>
      </div>
    </div>
  );
};

export default InteractiveScoringPanel;