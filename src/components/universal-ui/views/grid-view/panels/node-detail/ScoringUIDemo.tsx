import React, { useState } from 'react';
import {
  StrategyScoreCard,
  StrategyScoreBadge,
  StrategyRecommendationPanel,
  InteractiveScoringPanel,
  MatchingStrategySelector,
  type DetailedStrategyRecommendation,
  type MatchStrategy
} from '@/components/universal-ui/views/grid-view/panels/node-detail';

/**
 * 📚 策略评分 UI 组件使用演示
 * 
 * 这个演示文件展示了如何正确使用所有策略评分相关的 UI 组件。
 * 包含完整的使用示例、最佳实践和常见使用场景。
 * 
 * 🎯 组件清单：
 * - StrategyScoreCard: 策略评分卡片
 * - StrategyScoreBadge: 轻量级评分徽章  
 * - StrategyRecommendationPanel: 策略推荐面板
 * - InteractiveScoringPanel: 交互式评分面板
 * - MatchingStrategySelector: 增强型策略选择器
 */

// 模拟评分数据
const mockRecommendations: DetailedStrategyRecommendation[] = [
  {
    strategy: 'strict',
    score: {
      total: 0.89,
      performance: 0.85,
      stability: 0.90,
      compatibility: 0.80,
      uniqueness: 0.88,
      confidence: 0.92
    },
    confidence: 0.92,
    reason: '严格策略在当前元素结构下表现最佳，具有高稳定性和独特性'
  },
  {
    strategy: 'relaxed',
    score: {
      total: 0.82,
      performance: 0.75,
      stability: 0.85,
      compatibility: 0.95,
      uniqueness: 0.70,
      confidence: 0.88
    },
    confidence: 0.88,
    reason: '宽松策略兼容性优秀，适合多环境部署和动态页面'
  },
  {
    strategy: 'positionless',
    score: {
      total: 0.75,
      performance: 0.80,
      stability: 0.82,
      compatibility: 0.90,
      uniqueness: 0.65,
      confidence: 0.85
    },
    confidence: 0.85,
    reason: '无位置策略避免布局变化影响，在内容更新频繁的页面中表现稳定'
  },
  {
    strategy: 'absolute',
    score: {
      total: 0.68,
      performance: 0.95,
      stability: 0.60,
      compatibility: 0.55,
      uniqueness: 0.90,
      confidence: 0.75
    },
    confidence: 0.75,
    reason: '绝对策略性能极高但稳定性较低，适合固定布局的静态页面'
  }
];

const ScoringUIDemo: React.FC = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<MatchStrategy>('strict');
  const [showDetailed, setShowDetailed] = useState(false);
  const [compactMode, setCompactMode] = useState(true);
  const [weights, setWeights] = useState({
    performance: 0.3,
    stability: 0.3,
    compatibility: 0.2,
    uniqueness: 0.2
  });

  const handleStrategySelect = (strategy: MatchStrategy) => {
    setSelectedStrategy(strategy);
    console.log('策略选择变更:', strategy);
  };

  const handleWeightChange = (newWeights: Record<string, number>) => {
    setWeights(newWeights as typeof weights);
    console.log('权重配置变更:', newWeights);
  };

  return (
    <div className="p-6 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen light-theme-force">
      <div className="max-w-6xl mx-auto">
        
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎯 策略评分 UI 组件演示
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            展示所有策略评分相关组件的使用方法和效果
          </p>
        </div>

        {/* 演示控制面板 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">🎛️ 演示控制</h2>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showDetailed}
                onChange={(e) => setShowDetailed(e.target.checked)}
                className="rounded"
              />
              详细模式
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={compactMode}
                onChange={(e) => setCompactMode(e.target.checked)}
                className="rounded"
              />
              紧凑模式
            </label>
            <div className="text-sm text-gray-600">
              当前选择: <span className="font-semibold text-blue-600">{selectedStrategy}</span>
            </div>
          </div>
        </div>

        {/* 1. 策略评分徽章演示 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">🏷️ StrategyScoreBadge - 评分徽章</h2>
          <p className="text-gray-600 mb-4">轻量级的策略评分显示，适合在选项旁边显示</p>
          
          <div className="flex flex-wrap gap-3 mb-4">
            {mockRecommendations.map((rec) => (
              <div key={rec.strategy} className="flex items-center gap-2">
                <span className="text-sm">{rec.strategy}:</span>
                <StrategyScoreBadge 
                  score={rec.score.total} 
                  size={compactMode ? 'small' : 'medium'}
                />
              </div>
            ))}
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <div>💡 <strong>使用场景</strong>: 策略选择器、列表项、导航菜单</div>
            <div>🎨 <strong>颜色映射</strong>: ≥0.8(绿) ≥0.7(蓝) ≥0.6(橙) &lt;0.6(红)</div>
          </div>
        </section>

        {/* 2. 策略评分卡片演示 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">📊 StrategyScoreCard - 评分卡片</h2>
          <p className="text-gray-600 mb-4">完整的策略评分展示卡片，支持多种尺寸和交互</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {mockRecommendations.slice(0, 3).map((rec, index) => (
              <StrategyScoreCard
                key={rec.strategy}
                strategyName={rec.strategy}
                score={rec.score}
                isRecommended={index === 0}
                size={showDetailed ? 'detailed' : compactMode ? 'compact' : 'normal'}
                onClick={handleStrategySelect}
                className="hover:shadow-md transition-shadow"
              />
            ))}
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <div>💡 <strong>尺寸模式</strong>: compact(简洁) | normal(标准) | detailed(详细)</div>
            <div>🏆 <strong>推荐标识</strong>: 最佳策略会显示推荐徽章</div>
            <div>🎯 <strong>交互</strong>: 点击卡片触发策略选择回调</div>
          </div>
        </section>

        {/* 3. 增强型策略选择器演示 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">🎯 MatchingStrategySelector - 增强选择器</h2>
          <p className="text-gray-600 mb-4">集成评分徽章的策略选择器，提供更丰富的选择信息</p>
          
          <div className="max-w-md">
            <MatchingStrategySelector
              value={selectedStrategy}
              onChange={handleStrategySelect}
              strategyScores={Object.fromEntries(
                mockRecommendations.map(rec => [rec.strategy, {
                  score: rec.score.total,
                  isRecommended: rec.strategy === 'strict'
                }])
              )}
              showScores={true}
              size={compactMode ? 'small' : 'medium'}
            />
          </div>
          
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <div>💡 <strong>功能</strong>: 标准策略选择 + 评分徽章 + 推荐提示</div>
            <div>🎨 <strong>视觉增强</strong>: 最佳策略会有特殊标识</div>
            <div>📊 <strong>评分显示</strong>: 可控制是否显示评分信息</div>
          </div>
        </section>

        {/* 4. 策略推荐面板演示 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">📋 StrategyRecommendationPanel - 推荐面板</h2>
          <p className="text-gray-600 mb-4">全面的策略推荐和分析面板，支持模式切换</p>
          
          <StrategyRecommendationPanel
            recommendations={mockRecommendations}
            currentStrategy={selectedStrategy}
            onStrategySelect={handleStrategySelect}
            compact={compactMode}
            className="border border-gray-200 dark:border-gray-700 rounded-lg"
          />
          
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <div>💡 <strong>模式</strong>: compact(紧凑列表) | normal(详细卡片)</div>
            <div>🧠 <strong>智能推荐</strong>: 自动排序和推荐理由说明</div>
            <div>📈 <strong>多维评分</strong>: 性能、稳定性、兼容性、独特性</div>
          </div>
        </section>

        {/* 5. 交互式评分面板演示 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">🎛️ InteractiveScoringPanel - 交互面板</h2>
          <p className="text-gray-600 mb-4">高级交互式评分面板，支持权重调整和雷达图对比</p>
          
          <InteractiveScoringPanel
            initialRecommendations={mockRecommendations}
            sourceElement={null} // 🆕 演示模式不提供源元素
            onWeightChange={handleWeightChange}
            onStrategySelect={handleStrategySelect}
            className="border border-gray-200 dark:border-gray-700 rounded-lg"
          />
          
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <div>💡 <strong>权重调整</strong>: 实时滑块调整各维度权重</div>
            <div>📊 <strong>雷达图</strong>: 可视化策略多维度对比</div>
            <div>🔄 <strong>实时计算</strong>: 权重变化立即重新评分排序</div>
            <div>✅ <strong>策略选择</strong>: 支持多策略选择和对比</div>
          </div>
        </section>

        {/* 使用代码示例 */}
        <section className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">💻 代码使用示例</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            <pre>{`// 1. 基本导入
import {
  StrategyScoreCard,
  StrategyScoreBadge,
  StrategyRecommendationPanel,
  InteractiveScoringPanel,
  MatchingStrategySelector
} from '@/components/universal-ui/views/grid-view/panels/node-detail';

// 2. 基本使用
<StrategyScoreCard
  strategyName="strict"
  score={{ total: 0.89, performance: 0.85, ... }}
  isRecommended={true}
  onClick={(strategy) => handleSelect(strategy)}
/>

// 3. 增强选择器
<MatchingStrategySelector
  value={selectedStrategy}
  onChange={handleStrategySelect}
  strategyScores={scoreMap}
  showScores={true}
/>

// 4. 推荐面板
<StrategyRecommendationPanel
  recommendations={recommendations}
  compact={true}
  onStrategySelect={handleSelect}
/>

// 5. 交互面板
<InteractiveScoringPanel
  initialRecommendations={recommendations}
  onWeightChange={handleWeightChange}
  onStrategySelect={handleSelect}
/>`}</pre>
          </div>
        </section>

        {/* 最佳实践 */}
        <section className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">💡 最佳实践建议</h2>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="text-blue-600 font-semibold">🎯 组件选择:</span>
              <span>根据使用场景选择合适的组件 - 简单选择用 Badge，详细分析用 Card，对比用 Interactive</span>
            </div>
            <div className="flex gap-3">
              <span className="text-blue-600 font-semibold">🎨 样式一致:</span>
              <span>在浅色背景容器中务必添加 .light-theme-force 类确保文字可读性</span>
            </div>
            <div className="flex gap-3">
              <span className="text-blue-600 font-semibold">📱 响应式:</span>
              <span>使用 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 确保移动端友好</span>
            </div>
            <div className="flex gap-3">
              <span className="text-blue-600 font-semibold">🔄 状态管理:</span>
              <span>将策略选择状态提升到父组件，避免多个组件重复管理</span>
            </div>
            <div className="flex gap-3">
              <span className="text-blue-600 font-semibold">⚡ 性能:</span>
              <span>大量数据时使用 useMemo 缓存计算结果，避免不必要的重新渲染</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default ScoringUIDemo;