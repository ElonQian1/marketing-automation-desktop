import React from 'react';
import { useBreakpoint, useMobileDetection, useResponsiveValue } from './responsive';
import { generateMobileButtonClasses, generateA11yFocusClasses, mergeClasses } from './responsive/utils';

// 临时定义详细评分接口，直到与主模块集成
interface StrategyScore {
  total: number;
  performance: number;
  stability: number;
  compatibility: number;
  uniqueness: number;
  confidence?: number;
}

interface StrategyScoreCardProps {
  strategyName: string;
  score: StrategyScore;
  isRecommended?: boolean;
  size?: 'compact' | 'normal' | 'detailed';
  className?: string;
  onClick?: () => void;
}

/**
 * 🎯 策略评分卡片组件（响应式优化版）
 * 
 * 📍 功能：
 * - 显示单个匹配策略的评分详情
 * - 支持紧凑、正常、详细三种显示模式
 * - 提供推荐策略的视觉标识
 * - 📱 移动端优化：触摸友好的交互区域和自适应布局
 * 
 * 🎨 设计原则：
 * - 使用语义化的颜色系统表示评分等级
 * - 响应式设计，支持从手机到桌面的全屏适配
 * - 保持与项目设计系统一致的视觉风格
 * - WCAG 2.1 AA 合规的可访问性支持
 */
export const StrategyScoreCard: React.FC<StrategyScoreCardProps> = ({
  strategyName,
  score,
  isRecommended = false,
  size = 'normal',
  className = '',
  onClick
}) => {
  // 响应式状态检测
  const breakpoint = useBreakpoint();
  const { isMobile, isTablet } = useMobileDetection();
  
  // 响应式值配置
  const responsiveSize = useResponsiveValue({
    xs: isMobile ? 'compact' : size,
    sm: isTablet ? 'normal' : size,
    md: size,
    lg: size,
    xl: size,
    '2xl': size
  });

  const cardPadding = useResponsiveValue({
    xs: 'px-3 py-2',
    sm: 'px-3 py-2.5', 
    md: 'px-4 py-3',
    lg: 'px-4 py-3',
    xl: 'px-5 py-4',
    '2xl': 'px-6 py-4'
  });

  const textSizes = {
    compact: {
      title: useResponsiveValue({ xs: 'text-xs', sm: 'text-sm', md: 'text-sm' }),
      score: useResponsiveValue({ xs: 'text-sm', sm: 'text-base', md: 'text-lg' }),
      detail: useResponsiveValue({ xs: 'text-xs', sm: 'text-xs', md: 'text-xs' })
    },
    normal: {
      title: useResponsiveValue({ xs: 'text-sm', sm: 'text-base', md: 'text-lg' }),
      score: useResponsiveValue({ xs: 'text-lg', sm: 'text-xl', md: 'text-2xl' }),
      detail: useResponsiveValue({ xs: 'text-xs', sm: 'text-sm', md: 'text-sm' })
    },
    detailed: {
      title: useResponsiveValue({ xs: 'text-base', sm: 'text-lg', md: 'text-xl' }),
      score: useResponsiveValue({ xs: 'text-xl', sm: 'text-2xl', md: 'text-3xl' }),
      detail: useResponsiveValue({ xs: 'text-xs', sm: 'text-sm', md: 'text-base' })
    }
  };
  const getScoreColor = (scoreValue: number): string => {
    if (scoreValue >= 0.8) return 'text-green-600 dark:text-green-400';
    if (scoreValue >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    if (scoreValue >= 0.4) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (scoreValue: number): string => {
    if (scoreValue >= 0.8) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (scoreValue >= 0.6) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    if (scoreValue >= 0.4) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  const formatScore = (value: number): string => {
    return (value * 100).toFixed(1);
  };

  const getScoreLabel = (scoreValue: number): string => {
    if (scoreValue >= 0.8) return '优秀';
    if (scoreValue >= 0.6) return '良好';
    if (scoreValue >= 0.4) return '一般';
    return '较差';
  };

  // 响应式基础样式类
  const mobileInteractionClasses = onClick ? generateMobileButtonClasses(isMobile, 'md') : '';
  const focusClasses = onClick ? generateA11yFocusClasses() : '';
  
  const baseClasses = mergeClasses(
    'relative border rounded-lg transition-all duration-200',
    getScoreBgColor(score.total),
    isRecommended ? 'ring-2 ring-blue-500 ring-opacity-50' : '',
    onClick ? 'cursor-pointer hover:shadow-sm active:scale-95' : '',
    mobileInteractionClasses,
    focusClasses,
    // 移动端增加更多的交互反馈
    isMobile && onClick ? 'active:bg-opacity-80 transform transition-transform' : '',
    className
  );

  const renderCompactMode = () => (
    <div 
      className={mergeClasses(baseClasses, cardPadding)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className={mergeClasses(
        "flex items-center justify-between",
        textSizes.compact.detail,
        // 移动端增加更多垂直间距
        isMobile ? "gap-2" : "gap-1"
      )}>
        <span className={mergeClasses(
          "font-medium truncate",
          textSizes.compact.title
        )}>
          {strategyName}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={mergeClasses(
            "font-bold",
            getScoreColor(score.total),
            textSizes.compact.score
          )}>
            {formatScore(score.total)}%
          </span>
          {isRecommended && (
            <span className="text-blue-600 dark:text-blue-400 text-xs">★</span>
          )}
        </div>
      </div>
    </div>
  );

  const renderNormalMode = () => (
    <div 
      className={mergeClasses(baseClasses, cardPadding)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {isRecommended && (
        <div className={mergeClasses(
          "absolute -top-1 -right-1 bg-blue-500 text-white px-1.5 py-0.5 rounded-full",
          useResponsiveValue({
            xs: "text-xs",
            sm: "text-xs", 
            md: "text-sm"
          })
        )}>
          {isMobile ? "★" : "推荐"}
        </div>
      )}
      <div className={mergeClasses(
        "flex items-center justify-between",
        useResponsiveValue({
          xs: "mb-2",
          sm: "mb-2",
          md: "mb-3"
        })
      )}>
        <h4 className={mergeClasses(
          "font-semibold",
          textSizes.normal.title,
          // 移动端标题可能需要更多空间
          isMobile ? "flex-1 mr-2" : ""
        )}>
          {strategyName}
        </h4>
        <div className="text-right flex-shrink-0">
          <div className={mergeClasses(
            "font-bold",
            getScoreColor(score.total),
            textSizes.normal.score
          )}>
            {formatScore(score.total)}%
          </div>
          <div className={mergeClasses(
            "text-neutral-500",
            textSizes.normal.detail
          )}>
            {getScoreLabel(score.total)}
          </div>
        </div>
      </div>
      
      <div className={mergeClasses(
        useResponsiveValue({
          xs: "grid grid-cols-1 gap-1.5", // 移动端单列
          sm: "grid grid-cols-2 gap-2",   // 平板双列
          md: "grid grid-cols-2 gap-2"    // 桌面双列
        }),
        textSizes.normal.detail
      )}>
        {[
          { key: 'performance', label: '性能', value: score.performance },
          { key: 'stability', label: '稳定', value: score.stability },
          { key: 'compatibility', label: '兼容', value: score.compatibility },
          { key: 'uniqueness', label: '独特', value: score.uniqueness }
        ].map(({ key, label, value }) => (
          <div key={key} className="flex justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">{label}:</span>
            <span className={getScoreColor(value)}>
              {formatScore(value)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDetailedMode = () => (
    <div 
      className={mergeClasses(baseClasses, cardPadding)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {isRecommended && (
        <div className={mergeClasses(
          "absolute -top-1 -right-1 bg-blue-500 text-white px-2 py-1 rounded-full flex items-center gap-1",
          useResponsiveValue({
            xs: "text-xs px-1.5 py-0.5", // 移动端更紧凑
            sm: "text-xs px-2 py-1",
            md: "text-sm px-2 py-1"
          })
        )}>
          <span>★</span>
          {!isMobile && <span>推荐策略</span>}
        </div>
      )}
      
      <div className={mergeClasses(
        "flex items-center justify-between",
        useResponsiveValue({
          xs: "mb-3",
          sm: "mb-4",
          md: "mb-4"
        })
      )}>
        <h3 className={mergeClasses(
          "font-bold",
          textSizes.detailed.title,
          isMobile ? "flex-1 mr-3" : ""
        )}>
          {strategyName}
        </h3>
        <div className="text-right flex-shrink-0">
          <div className={mergeClasses(
            "font-bold",
            getScoreColor(score.total),
            textSizes.detailed.score
          )}>
            {formatScore(score.total)}%
          </div>
          <div className={mergeClasses(
            "text-neutral-500",
            textSizes.detailed.detail
          )}>
            综合评分 · {getScoreLabel(score.total)}
          </div>
        </div>
      </div>

      {/* 详细评分条 - 响应式布局 */}
      <div className={useResponsiveValue({
        xs: "space-y-2.5", // 移动端更紧凑
        sm: "space-y-3",
        md: "space-y-3"
      })}>
        {[
          { key: 'performance', label: '性能表现', value: score.performance, desc: '执行速度与资源消耗' },
          { key: 'stability', label: '稳定性', value: score.stability, desc: '跨环境一致性表现' },
          { key: 'compatibility', label: '兼容性', value: score.compatibility, desc: '设备与版本适配度' },
          { key: 'uniqueness', label: '独特性', value: score.uniqueness, desc: '元素区分度与精确性' }
        ].map(({ key, label, value, desc }) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className={mergeClasses(
                "font-medium",
                useResponsiveValue({
                  xs: "text-sm",
                  sm: "text-sm", 
                  md: "text-base"
                })
              )}>
                {label}
              </span>
              <span className={mergeClasses(
                "font-semibold",
                getScoreColor(value),
                useResponsiveValue({
                  xs: "text-sm",
                  sm: "text-sm",
                  md: "text-base"
                })
              )}>
                {formatScore(value)}%
              </span>
            </div>
            <div className={mergeClasses(
              "bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden",
              useResponsiveValue({
                xs: "h-1.5", // 移动端更薄的进度条
                sm: "h-2",
                md: "h-2"
              })
            )}>
              <div 
                className={mergeClasses(
                  "h-full transition-all duration-300",
                  value >= 0.8 ? 'bg-green-500' :
                  value >= 0.6 ? 'bg-yellow-500' :
                  value >= 0.4 ? 'bg-orange-500' : 'bg-red-500'
                )}
                style={{ width: `${value * 100}%` }}
              />
            </div>
            {!isMobile && ( // 移动端隐藏描述以节省空间
              <div className={mergeClasses(
                "text-neutral-500",
                textSizes.detailed.detail
              )}>
                {desc}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 置信度和优势描述 */}
      {score.confidence && (
        <div className={mergeClasses(
          "pt-3 border-t border-neutral-200 dark:border-neutral-700",
          useResponsiveValue({
            xs: "mt-3",
            sm: "mt-4",
            md: "mt-4"
          })
        )}>
          <div className={mergeClasses(
            "flex justify-between items-center",
            useResponsiveValue({
              xs: "text-sm",
              sm: "text-sm",
              md: "text-base"
            })
          )}>
            <span className="text-neutral-600 dark:text-neutral-400">置信度:</span>
            <span className="font-medium">{formatScore(score.confidence)}%</span>
          </div>
        </div>
      )}
    </div>
  );

  // 根据响应式大小渲染对应模式
  if (responsiveSize === 'compact') return renderCompactMode();
  if (responsiveSize === 'detailed') return renderDetailedMode();
  return renderNormalMode();
};

export default StrategyScoreCard;