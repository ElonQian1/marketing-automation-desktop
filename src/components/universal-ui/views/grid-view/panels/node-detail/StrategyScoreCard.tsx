import React from 'react';

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
 * 🎯 策略评分卡片组件
 * 
 * 📍 功能：
 * - 显示单个匹配策略的评分详情
 * - 支持紧凑、正常、详细三种显示模式
 * - 提供推荐策略的视觉标识
 * 
 * 🎨 设计原则：
 * - 使用语义化的颜色系统表示评分等级
 * - 支持响应式设计和可点击交互
 * - 保持与项目设计系统一致的视觉风格
 */
export const StrategyScoreCard: React.FC<StrategyScoreCardProps> = ({
  strategyName,
  score,
  isRecommended = false,
  size = 'normal',
  className = '',
  onClick
}) => {
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

  const baseClasses = `
    relative border rounded-lg transition-all duration-200
    ${onClick ? 'cursor-pointer hover:shadow-sm' : ''}
    ${isRecommended ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
    ${getScoreBgColor(score.total)}
    ${className}
  `;

  const renderCompactMode = () => (
    <div className={`${baseClasses} px-2 py-1`} onClick={onClick}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium truncate">{strategyName}</span>
        <div className="flex items-center gap-1">
          <span className={`font-bold ${getScoreColor(score.total)}`}>
            {formatScore(score.total)}%
          </span>
          {isRecommended && (
            <span className="text-blue-600 dark:text-blue-400 text-[10px]">★</span>
          )}
        </div>
      </div>
    </div>
  );

  const renderNormalMode = () => (
    <div className={`${baseClasses} p-3`} onClick={onClick}>
      {isRecommended && (
        <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
          推荐
        </div>
      )}
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm">{strategyName}</h4>
        <div className="text-right">
          <div className={`font-bold text-lg ${getScoreColor(score.total)}`}>
            {formatScore(score.total)}%
          </div>
          <div className="text-xs text-neutral-500">
            {getScoreLabel(score.total)}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between">
          <span className="text-neutral-600 dark:text-neutral-400">性能:</span>
          <span className={getScoreColor(score.performance)}>
            {formatScore(score.performance)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600 dark:text-neutral-400">稳定:</span>
          <span className={getScoreColor(score.stability)}>
            {formatScore(score.stability)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600 dark:text-neutral-400">兼容:</span>
          <span className={getScoreColor(score.compatibility)}>
            {formatScore(score.compatibility)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600 dark:text-neutral-400">独特:</span>
          <span className={getScoreColor(score.uniqueness)}>
            {formatScore(score.uniqueness)}%
          </span>
        </div>
      </div>
    </div>
  );

  const renderDetailedMode = () => (
    <div className={`${baseClasses} p-4`} onClick={onClick}>
      {isRecommended && (
        <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <span>★</span>
          <span>推荐策略</span>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base">{strategyName}</h3>
        <div className="text-right">
          <div className={`font-bold text-2xl ${getScoreColor(score.total)}`}>
            {formatScore(score.total)}%
          </div>
          <div className="text-sm text-neutral-500">
            综合评分 · {getScoreLabel(score.total)}
          </div>
        </div>
      </div>

      {/* 详细评分条 */}
      <div className="space-y-3">
        {[
          { key: 'performance', label: '性能表现', value: score.performance, desc: '执行速度与资源消耗' },
          { key: 'stability', label: '稳定性', value: score.stability, desc: '跨环境一致性表现' },
          { key: 'compatibility', label: '兼容性', value: score.compatibility, desc: '设备与版本适配度' },
          { key: 'uniqueness', label: '独特性', value: score.uniqueness, desc: '元素区分度与精确性' }
        ].map(({ key, label, value, desc }) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{label}</span>
              <span className={`text-sm font-semibold ${getScoreColor(value)}`}>
                {formatScore(value)}%
              </span>
            </div>
            <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  value >= 0.8 ? 'bg-green-500' :
                  value >= 0.6 ? 'bg-yellow-500' :
                  value >= 0.4 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${value * 100}%` }}
              />
            </div>
            <div className="text-xs text-neutral-500">{desc}</div>
          </div>
        ))}
      </div>

      {/* 置信度和优势描述 */}
      {score.confidence && (
        <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">置信度:</span>
            <span className="font-medium">{formatScore(score.confidence)}%</span>
          </div>
        </div>
      )}
    </div>
  );

  if (size === 'compact') return renderCompactMode();
  if (size === 'detailed') return renderDetailedMode();
  return renderNormalMode();
};

export default StrategyScoreCard;