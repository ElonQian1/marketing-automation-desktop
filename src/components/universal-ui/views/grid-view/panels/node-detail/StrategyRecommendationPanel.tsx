// src/components/universal-ui/views/grid-view/panels/node-detail/StrategyRecommendationPanel.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React, { useState, useMemo } from 'react';
import type { StrategyRecommendation } from '../../../../../../modules/intelligent-strategy-system';
import type { MatchStrategy } from './types';
import { StrategyScoreCard } from './StrategyScoreCard';
import { useBreakpoint, useMobileDetection, useResponsiveValue } from './responsive';
import { generateMobileButtonClasses, generateA11yFocusClasses, mergeClasses } from './responsive/utils';

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
 * 🎯 策略推荐面板组件（响应式优化版）
 * 
 * 📍 功能：
 * - 显示所有策略的评分和推荐排序
 * - 支持权重调整和实时重新评分
 * - 提供策略详细分析和优缺点说明
 * - 📱 移动端优化：智能模式切换和触摸友好交互
 * 
 * 🎨 设计原则：
 * - 清晰的信息层级和视觉分组
 * - 支持紧凑模式和详细模式切换
 * - 提供交互式的权重配置界面
 * - 响应式布局，自适应各种屏幕尺寸
 * - WCAG 2.1 AA 合规的可访问性支持
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

  // 响应式状态检测
  const breakpoint = useBreakpoint();
  const { isMobile, isTouchDevice } = useMobileDetection();
  
  // 智能模式切换：移动端自动使用紧凑模式
  const isCompactMode = compact || isMobile;
  
  // 响应式值配置
  const containerSpacing = useResponsiveValue({
    xs: 'space-y-2',
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-4',
    xl: 'space-y-4',
    '2xl': 'space-y-5'
  });

  const titleSize = useResponsiveValue({
    xs: 'text-base',
    sm: 'text-lg',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  });

  const buttonPadding = useResponsiveValue({
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1 text-sm',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-sm',
    xl: 'px-4 py-2 text-base',
    '2xl': 'px-5 py-2 text-base'
  });

  const weightConfigLayout = useResponsiveValue({
    xs: 'grid grid-cols-1 gap-3', // 移动端单列
    sm: 'grid grid-cols-2 gap-3', // 小平板双列
    md: 'grid grid-cols-2 gap-4', // 桌面双列
    lg: 'grid grid-cols-2 gap-4',
    xl: 'grid grid-cols-2 gap-5',
    '2xl': 'grid grid-cols-2 gap-6'
  });

  const strategiesLayout = useResponsiveValue({
    xs: 'grid grid-cols-1 gap-2', // 移动端单列
    sm: 'grid grid-cols-1 gap-3', // 小平板单列
    md: 'grid grid-cols-2 gap-3', // 桌面双列
    lg: 'grid grid-cols-2 gap-3',
    xl: 'grid grid-cols-2 gap-4',
    '2xl': 'grid grid-cols-3 gap-4' // 超大屏三列
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
    <div className={mergeClasses(containerSpacing, className)}>
      {/* 🚨 加载和错误状态优先显示 - 响应式优化 */}
      {loading && (
        <div className={mergeClasses(
          "flex items-center gap-2 text-blue-600",
          useResponsiveValue({
            xs: "text-sm",
            sm: "text-sm",
            md: "text-base"
          })
        )}>
          <div className={mergeClasses(
            "border-2 border-blue-600 border-t-transparent rounded-full animate-spin",
            useResponsiveValue({
              xs: "w-4 h-4",
              sm: "w-4 h-4",
              md: "w-5 h-5"
            })
          )}></div>
          <span>分析策略推荐中...</span>
        </div>
      )}
      
      {error && (
        <div className={mergeClasses(
          "text-red-600 bg-red-50 border border-red-200 rounded",
          useResponsiveValue({
            xs: "text-sm px-2 py-1",
            sm: "text-sm px-3 py-2",
            md: "text-base px-3 py-2"
          })
        )}>
          ⚠️ {error}
        </div>
      )}
      
      {!loading && !error && (
        <>
          <div className="flex items-center justify-between">
            <span className={mergeClasses(
              "font-medium",
              useResponsiveValue({
                xs: "text-sm",
                sm: "text-base",
                md: "text-base"
              })
            )}>
              策略推荐
            </span>
            <button 
              className={mergeClasses(
                "text-blue-600 hover:text-blue-700",
                generateMobileButtonClasses(isMobile, 'sm'),
                generateA11yFocusClasses(),
                useResponsiveValue({
                  xs: "text-xs",
                  sm: "text-sm",
                  md: "text-sm"
                })
              )}
              onClick={() => setShowWeightConfig(!showWeightConfig)}
              aria-label={`${showWeightConfig ? '收起' : '展开'}权重配置`}
            >
              {showWeightConfig ? '收起配置' : '权重配置'}
            </button>
          </div>

      {showWeightConfig && (
        <div className={mergeClasses(
          "bg-neutral-50 dark:bg-neutral-800 rounded-lg",
          useResponsiveValue({
            xs: "p-3 space-y-2",
            sm: "p-3 space-y-2", 
            md: "p-4 space-y-3"
          })
        )}>
          <div className={weightConfigLayout}>
            {Object.entries(weights).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={useResponsiveValue({
                    xs: "text-xs",
                    sm: "text-sm",
                    md: "text-sm"
                  })}>
                    {key === 'performance' ? '性能' :
                     key === 'stability' ? '稳定' :
                     key === 'compatibility' ? '兼容' : '独特'}:
                  </span>
                  <span className={mergeClasses(
                    "font-medium",
                    useResponsiveValue({
                      xs: "text-xs w-10",
                      sm: "text-sm w-12",
                      md: "text-sm w-12"
                    })
                  )}>
                    {Math.round(value * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={value}
                  onChange={(e) => handleWeightChange(key, parseFloat(e.target.value))}
                  className={mergeClasses(
                    "w-full rounded-lg appearance-none cursor-pointer",
                    useResponsiveValue({
                      xs: "h-2", // 移动端稍厚的滑块
                      sm: "h-1.5",
                      md: "h-1"
                    }),
                    // 移动端增强触摸反馈
                    isTouchDevice ? "active:scale-105 transition-transform" : ""
                  )}
                  aria-label={`调整${key === 'performance' ? '性能' : key === 'stability' ? '稳定' : key === 'compatibility' ? '兼容' : '独特'}权重`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={mergeClasses(
        useResponsiveValue({
          xs: "space-y-1.5",
          sm: "space-y-2",
          md: "space-y-2"
        })
      )}>
        {sortedRecommendations.slice(0, isMobile ? 2 : 3).map((rec, index) => {
          const strategyKey = rec.strategy as MatchStrategy;
          return (
            <StrategyScoreCard
              key={rec.strategy}
              strategyName={strategyNameMap[rec.strategy] || rec.strategy}
              score={rec.score}
              isRecommended={index === 0}
              size="compact"
              onClick={() => onStrategySelect?.(strategyKey)}
              className={mergeClasses(
                currentStrategy === rec.strategy ? 'ring-2 ring-blue-300' : '',
                // 移动端增强触摸反馈
                isMobile ? 'active:scale-95 transition-transform' : ''
              )}
            />
          );
        })}
        {sortedRecommendations.length > (isMobile ? 2 : 3) && (
          <div className={mergeClasses(
            "text-center text-neutral-500",
            useResponsiveValue({
              xs: "text-xs pt-1",
              sm: "text-sm pt-2",
              md: "text-sm pt-2"
            })
          )}>
            还有 {sortedRecommendations.length - (isMobile ? 2 : 3)} 个策略未显示
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );

  const renderDetailedMode = () => (
    <div className={mergeClasses(containerSpacing, className)}>
      <div className="flex items-center justify-between">
        <h3 className={mergeClasses("font-semibold", titleSize)}>
          智能策略推荐
        </h3>
        <button 
          className={mergeClasses(
            "text-blue-600 hover:text-blue-700 rounded border border-blue-200 hover:bg-blue-50",
            generateMobileButtonClasses(isMobile, 'md'),
            generateA11yFocusClasses(),
            buttonPadding
          )}
          onClick={() => setShowWeightConfig(!showWeightConfig)}
          aria-label={`${showWeightConfig ? '收起' : '展开'}权重配置面板`}
        >
          {isMobile 
            ? (showWeightConfig ? '收起权重' : '权重配置')
            : (showWeightConfig ? '收起权重配置' : '调整权重配置')
          }
        </button>
      </div>

      {/* 权重配置面板 - 响应式优化 */}
      {showWeightConfig && (
        <div className={mergeClasses(
          "bg-neutral-50 dark:bg-neutral-800 rounded-lg",
          useResponsiveValue({
            xs: "p-3",
            sm: "p-4",
            md: "p-4",
            lg: "p-5",
            xl: "p-6",
            '2xl': "p-6"
          })
        )}>
          <h4 className={mergeClasses(
            "font-medium mb-3",
            useResponsiveValue({
              xs: "text-sm",
              sm: "text-base",
              md: "text-base"
            })
          )}>
            评分权重配置
          </h4>
          <div className={weightConfigLayout}>
            {Object.entries(weights).map(([key, value]) => (
              <div key={key} className={useResponsiveValue({
                xs: "space-y-2",
                sm: "space-y-2",
                md: "space-y-2"
              })}>
                <div className="flex justify-between items-center">
                  <label className={mergeClasses(
                    "font-medium",
                    useResponsiveValue({
                      xs: "text-sm",
                      sm: "text-sm",
                      md: "text-base"
                    })
                  )}>
                    {key === 'performance' ? '性能表现' :
                     key === 'stability' ? '稳定性' :
                     key === 'compatibility' ? '兼容性' : '独特性'}
                  </label>
                  <span className={mergeClasses(
                    "text-neutral-600",
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
                    "w-full bg-neutral-200 rounded-lg appearance-none cursor-pointer",
                    useResponsiveValue({
                      xs: "h-3", // 移动端更厚的滑块
                      sm: "h-2.5",
                      md: "h-2"
                    }),
                    // 移动端增强触摸反馈
                    isTouchDevice ? "active:scale-105 transition-transform" : ""
                  )}
                  aria-label={`调整${key === 'performance' ? '性能表现' : key === 'stability' ? '稳定性' : key === 'compatibility' ? '兼容性' : '独特性'}权重`}
                />
              </div>
            ))}
          </div>
          <div className={mergeClasses(
            "mt-3 text-neutral-500",
            useResponsiveValue({
              xs: "text-xs",
              sm: "text-xs",
              md: "text-xs"
            })
          )}>
            * 权重总和会自动标准化，调整后将实时重新计算策略评分
          </div>
        </div>
      )}

      {/* 推荐策略卡片 - 响应式布局 */}
      {topRecommendation && (
        <div className={mergeClasses(
          "border-l-4 border-blue-500",
          useResponsiveValue({
            xs: "pl-3",
            sm: "pl-4",
            md: "pl-4"
          })
        )}>
          <h4 className={mergeClasses(
            "font-medium text-blue-700 dark:text-blue-300 mb-2",
            useResponsiveValue({
              xs: "text-sm",
              sm: "text-base",
              md: "text-base"
            })
          )}>
            🎯 推荐策略
          </h4>
          <StrategyScoreCard
            strategyName={strategyNameMap[topRecommendation.strategy] || topRecommendation.strategy}
            score={topRecommendation.score}
            isRecommended={true}
            size="detailed"
            onClick={() => onStrategySelect?.(topRecommendation.strategy as MatchStrategy)}
            className={mergeClasses(
              currentStrategy === topRecommendation.strategy ? 'ring-2 ring-blue-300' : 'cursor-pointer hover:shadow-md',
              'transition-shadow',
              // 移动端增强触摸反馈
              isMobile ? 'active:scale-98' : ''
            )}
          />
          
          {/* 策略优缺点分析 - 响应式布局 */}
          {strategyDescMap[topRecommendation.strategy] && (
            <div className={mergeClasses(
              "mt-3",
              useResponsiveValue({
                xs: "space-y-3", // 移动端垂直布局
                sm: "space-y-3", // 小平板垂直布局
                md: "grid grid-cols-2 gap-4" // 桌面端双列布局
              })
            )}>
              <div>
                <h5 className={mergeClasses(
                  "font-medium text-green-700 dark:text-green-300 mb-1",
                  useResponsiveValue({
                    xs: "text-sm",
                    sm: "text-sm",
                    md: "text-base"
                  })
                )}>
                  ✅ 优势
                </h5>
                <ul className={mergeClasses(
                  "text-neutral-600 dark:text-neutral-400 space-y-1",
                  useResponsiveValue({
                    xs: "space-y-0.5",
                    sm: "space-y-1",
                    md: "space-y-1"
                  })
                )}>
                  {strategyDescMap[topRecommendation.strategy].advantages.map((adv, idx) => (
                    <li key={idx} className={useResponsiveValue({
                      xs: "text-xs",
                      sm: "text-xs",
                      md: "text-sm"
                    })}>
                      • {adv}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className={mergeClasses(
                  "font-medium text-orange-700 dark:text-orange-300 mb-1",
                  useResponsiveValue({
                    xs: "text-sm",
                    sm: "text-sm",
                    md: "text-base"
                  })
                )}>
                  ⚠️ 注意
                </h5>
                <ul className={mergeClasses(
                  "text-neutral-600 dark:text-neutral-400 space-y-1",
                  useResponsiveValue({
                    xs: "space-y-0.5",
                    sm: "space-y-1",
                    md: "space-y-1"
                  })
                )}>
                  {strategyDescMap[topRecommendation.strategy].disadvantages.map((dis, idx) => (
                    <li key={idx} className={useResponsiveValue({
                      xs: "text-xs",
                      sm: "text-xs",
                      md: "text-sm"
                    })}>
                      • {dis}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 所有策略列表 - 响应式网格 */}
      <div>
        <h4 className={mergeClasses(
          "font-medium mb-3",
          useResponsiveValue({
            xs: "text-sm",
            sm: "text-base",
            md: "text-base"
          })
        )}>
          所有策略评分 ({sortedRecommendations.length})
        </h4>
        <div className={strategiesLayout}>
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
                className={mergeClasses(
                  currentStrategy === rec.strategy ? 'ring-2 ring-blue-300' : '',
                  index === 0 ? '' : 'opacity-90',
                  'cursor-pointer hover:shadow-md transition-shadow',
                  // 移动端增强触摸反馈
                  isMobile ? 'active:scale-98' : ''
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );

  // 智能模式渲染：移动端优先使用紧凑模式
  return isCompactMode ? renderCompactMode() : renderDetailedMode();
};

export default StrategyRecommendationPanel;