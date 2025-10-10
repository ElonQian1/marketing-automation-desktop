import React, { useState } from 'react';
import {
  StrategyScoreCard,
  StrategyScoreBadge,
  StrategyRecommendationPanel,
  InteractiveScoringPanel,
  MatchingStrategySelector
} from './index';
import type { DetailedStrategyRecommendation } from './StrategyRecommendationPanel';
import type { MatchStrategy } from './types';
import type { WeightConfig } from './hooks';

// 响应式设计基础设施导入
import {
  useBreakpoint,
  useMobileDetection,
  useResponsiveValue,
  generateMobileButtonClasses,
  generateA11yFocusClasses,
  mergeClasses,
  BREAKPOINTS,
  type Breakpoint
} from './responsive';

/**
 * 📚 策略评分 UI 组件响应式演示
 * 
 * 这个演示文件展示了如何正确使用所有策略评分相关的 UI 组件。
 * 包含完整的使用示例、最佳实践、响应式设计和移动端适配。
 * 
 * 🎯 组件清单：
 * - StrategyScoreCard: 策略评分卡片（响应式优化）
 * - StrategyScoreBadge: 轻量级评分徽章  
 * - StrategyRecommendationPanel: 策略推荐面板（响应式优化）
 * - InteractiveScoringPanel: 交互式评分面板（响应式优化）
 * - MatchingStrategySelector: 增强型策略选择器
 * 
 * 🎨 响应式特性：
 * - 多断点适配（xs/sm/md/lg/xl/2xl）
 * - 移动端触摸优化
 * - 智能布局切换
 * - 可访问性增强
 * - 设备模拟器和断点切换工具
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
  // 基础状态
  const [selectedStrategy, setSelectedStrategy] = useState<MatchStrategy>('strict');
  const [showDetailed, setShowDetailed] = useState(false);
  const [compactMode, setCompactMode] = useState(true);
  const [weights, setWeights] = useState({
    performance: 0.3,
    stability: 0.3,
    compatibility: 0.2,
    uniqueness: 0.2
  });

  // 响应式状态检测
  const breakpoint = useBreakpoint();
  const { isMobile, isTouchDevice } = useMobileDetection();
  
  // 设备模拟器状态（用于演示）
  const [simulatedBreakpoint, setSimulatedBreakpoint] = useState<Breakpoint | null>(null);
  const [showDeviceSimulator, setShowDeviceSimulator] = useState(false);
  
  // 当前有效断点（优先使用模拟断点）
  const effectiveBreakpoint = simulatedBreakpoint || breakpoint;
  const isEffectiveMobile = simulatedBreakpoint 
    ? ['xs', 'sm'].includes(simulatedBreakpoint)
    : isMobile;

  // 响应式布局配置
  const containerSpacing = useResponsiveValue({
    xs: 'space-y-4',
    sm: 'space-y-5', 
    md: 'space-y-6',
    lg: 'space-y-8',
    xl: 'space-y-8',
    '2xl': 'space-y-10'
  });

  const gridLayout = useResponsiveValue({
    xs: 'grid-cols-1',
    sm: 'grid-cols-1', 
    md: 'grid-cols-2',
    lg: 'grid-cols-2',
    xl: 'grid-cols-3',
    '2xl': 'grid-cols-3'
  });

  const demoCardLayout = useResponsiveValue({
    xs: 'grid-cols-1',
    sm: 'grid-cols-2',
    md: 'grid-cols-2', 
    lg: 'grid-cols-3',
    xl: 'grid-cols-3',
    '2xl': 'grid-cols-4'
  });

  const controlPanelLayout = useResponsiveValue({
    xs: 'flex-col space-y-3',
    sm: 'flex-row flex-wrap gap-4',
    md: 'flex-row flex-wrap gap-6'
  });

  // 事件处理
  const handleStrategySelect = (strategy: MatchStrategy) => {
    setSelectedStrategy(strategy);
    console.log('策略选择变更:', strategy);
  };

  const handleWeightChange = (newWeights: WeightConfig) => {
    setWeights(newWeights);
    console.log('权重配置变更:', newWeights);
  };

  const handleBreakpointSimulation = (bp: Breakpoint | null) => {
    setSimulatedBreakpoint(bp);
    console.log('模拟断点切换:', bp || '真实设备');
  };

  return (
    <div className={mergeClasses(
      "min-h-screen bg-gray-50 dark:bg-gray-900 light-theme-force",
      useResponsiveValue({
        xs: "p-3",
        sm: "p-4", 
        md: "p-6",
        lg: "p-8",
        xl: "p-8",
        '2xl': "p-10"
      })
    )}>
      <div className="max-w-6xl mx-auto">
        
        {/* 响应式状态指示器 */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="font-medium">当前断点:</span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-xs font-mono">
                {typeof effectiveBreakpoint === 'object' ? effectiveBreakpoint.currentBreakpoint : effectiveBreakpoint}
              </span>
              {simulatedBreakpoint && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                  模拟中
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <span>📱 移动端: {isEffectiveMobile ? '是' : '否'}</span>
              <span>👆 触摸设备: {isTouchDevice ? '是' : '否'}</span>
              <span>🖥️ 视口宽度: {typeof window !== 'undefined' ? window.innerWidth : '--'}px</span>
            </div>
          </div>
        </div>

        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className={mergeClasses(
            "font-bold text-gray-900 dark:text-white mb-2",
            useResponsiveValue({
              xs: "text-2xl",
              sm: "text-2xl",
              md: "text-3xl",
              lg: "text-3xl",
              xl: "text-4xl",
              '2xl': "text-4xl"
            })
          )}>
            🎯 策略评分 UI 组件响应式演示
          </h1>
          <p className={mergeClasses(
            "text-gray-600 dark:text-gray-300",
            useResponsiveValue({
              xs: "text-sm",
              sm: "text-base",
              md: "text-base",
              lg: "text-lg"
            })
          )}>
            展示所有策略评分相关组件的响应式设计和移动端适配效果
          </p>
        </div>

        {/* 设备模拟器和控制面板 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold">🎛️ 演示控制</h2>
            <button
              onClick={() => setShowDeviceSimulator(!showDeviceSimulator)}
              className={mergeClasses(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                generateMobileButtonClasses(true),
                generateA11yFocusClasses(),
                showDeviceSimulator 
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              )}
            >
              📱 设备模拟器
            </button>
          </div>
          
          {/* 设备模拟器 */}
          {showDeviceSimulator && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium mb-3">🔧 断点模拟器</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleBreakpointSimulation(null)}
                  className={mergeClasses(
                    "px-3 py-1 rounded text-xs font-medium transition-colors",
                    generateMobileButtonClasses(true),
                    !simulatedBreakpoint
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300 hover:bg-gray-200"
                  )}
                >
                  真实设备
                </button>
                {Object.keys(BREAKPOINTS).map((bp) => (
                  <button
                    key={bp}
                    onClick={() => handleBreakpointSimulation(bp as Breakpoint)}
                    className={mergeClasses(
                      "px-3 py-1 rounded text-xs font-medium transition-colors",
                      generateMobileButtonClasses(true),
                      simulatedBreakpoint === bp
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300 hover:bg-gray-200"
                    )}
                  >
                    {bp} ({BREAKPOINTS[bp as Breakpoint]}px+)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 基本控制 */}
          <div className={mergeClasses("flex gap-4", controlPanelLayout)}>
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

        {/* 组件演示区域 */}
        <div className={containerSpacing}>

        {/* 1. 策略评分徽章演示 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">🏷️ StrategyScoreBadge - 评分徽章</h2>
          <p className="text-gray-600 mb-4">轻量级的策略评分显示，适合在选项旁边显示</p>
          
          <div className={mergeClasses(
            "flex gap-3 mb-4",
            useResponsiveValue({
              xs: "flex-col space-y-2",
              sm: "flex-wrap",
              md: "flex-wrap"
            })
          )}>
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
            <div>📱 <strong>响应式</strong>: 移动端自动垂直布局，大屏横向排列</div>
          </div>
        </section>

        {/* 2. 策略评分卡片演示 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">📊 StrategyScoreCard - 评分卡片</h2>
          <p className="text-gray-600 mb-4">完整的策略评分展示卡片，支持多种尺寸和交互</p>
          
          <div className={mergeClasses("grid gap-4 mb-4", demoCardLayout)}>
            {mockRecommendations.slice(0, 3).map((rec, index) => (
              <StrategyScoreCard
                key={rec.strategy}
                strategyName={rec.strategy}
                score={rec.score}
                isRecommended={index === 0}
                size={showDetailed ? 'detailed' : compactMode ? 'compact' : 'normal'}
                onClick={() => handleStrategySelect(rec.strategy as MatchStrategy)}
                className="hover:shadow-md transition-shadow"
              />
            ))}
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <div>💡 <strong>尺寸模式</strong>: compact(简洁) | normal(标准) | detailed(详细)</div>
            <div>🏆 <strong>推荐标识</strong>: 最佳策略会显示推荐徽章</div>
            <div>🎯 <strong>交互</strong>: 点击卡片触发策略选择回调</div>
            <div>📱 <strong>响应式</strong>: xs单列→md双列→xl三列，触摸友好设计</div>
          </div>
        </section>

        {/* 3. 增强型策略选择器演示 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">🎯 MatchingStrategySelector - 增强选择器</h2>
          <p className="text-gray-600 mb-4">集成评分徽章的策略选择器，提供更丰富的选择信息</p>
          
          <div className={useResponsiveValue({
            xs: "w-full",
            sm: "max-w-md",
            md: "max-w-lg"
          })}>
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
            />
          </div>
          
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <div>💡 <strong>功能</strong>: 标准策略选择 + 评分徽章 + 推荐提示</div>
            <div>🎨 <strong>视觉增强</strong>: 最佳策略会有特殊标识</div>
            <div>📊 <strong>评分显示</strong>: 可控制是否显示评分信息</div>
            <div>📱 <strong>响应式</strong>: 移动端全宽显示，桌面端固定宽度</div>
          </div>
        </section>

        {/* 4. 策略推荐面板演示 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">📋 StrategyRecommendationPanel - 推荐面板</h2>
          <p className="text-gray-600 mb-4">全面的策略推荐和分析面板，支持智能模式切换</p>
          
          <StrategyRecommendationPanel
            recommendations={mockRecommendations}
            currentStrategy={selectedStrategy}
            onStrategySelect={handleStrategySelect}
            compact={compactMode}
            className="border border-gray-200 dark:border-gray-700 rounded-lg"
          />
          
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <div>💡 <strong>智能模式</strong>: 移动端自动使用紧凑模式</div>
            <div>🧠 <strong>智能推荐</strong>: 自动排序和推荐理由说明</div>
            <div>📈 <strong>多维评分</strong>: 性能、稳定性、兼容性、独特性</div>
            <div>📱 <strong>响应式</strong>: xs:2个策略→md:双列→2xl:三列显示</div>
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
            <div>📊 <strong>雷达图</strong>: 可视化策略多维度对比 (xs:160px→2xl:260px)</div>
            <div>🔄 <strong>实时计算</strong>: 权重变化立即重新评分排序</div>
            <div>✅ <strong>策略选择</strong>: 支持多策略选择和对比</div>
            <div>📱 <strong>响应式</strong>: 权重滑块移动端增厚，雷达图自适应</div>
          </div>
        </section>

        </div> {/* containerSpacing */}

        {/* 响应式设计展示 */}
        <section className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🎨 响应式设计特性</h2>
          <div className={mergeClasses("grid gap-4", gridLayout)}>
            <div className="space-y-3">
              <h3 className="font-medium text-purple-700 dark:text-purple-300">📱 移动端优化</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• 触摸友好的44px最小目标</li>
                <li>• 权重滑块增厚到12px</li>
                <li>• 策略卡片单列布局</li>
                <li>• 智能模式自动切换</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-blue-700 dark:text-blue-300">🖥️ 桌面端增强</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• 多列网格布局展示</li>
                <li>• 雷达图尺寸放大</li>
                <li>• 详细模式信息展示</li>
                <li>• 悬停交互效果</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-green-700 dark:text-green-300">♿ 可访问性</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• WCAG 2.1 AA颜色对比</li>
                <li>• 键盘导航支持</li>
                <li>• 屏幕阅读器友好</li>
                <li>• ARIA标签完整</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 使用代码示例 */}
        <section className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">💻 响应式代码示例</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            <pre>{`// 1. 响应式基础设施导入
import {
  useBreakpoint,
  useMobileDetection,
  useResponsiveValue
} from './responsive';

// 2. 组件内响应式配置
const { isMobile } = useMobileDetection();
const gridLayout = useResponsiveValue({
  xs: 'grid-cols-1',
  md: 'grid-cols-2', 
  xl: 'grid-cols-3'
});

// 3. 智能模式切换
const isCompactMode = compact || isMobile;

// 4. 响应式组件使用
<StrategyRecommendationPanel
  compact={isCompactMode}
  className={gridLayout}
/>

// 5. 移动端优化按钮
<button className={mergeClasses(
  "px-4 py-2 rounded",
  generateMobileButtonClasses(),
  generateA11yFocusClasses()
)}>
  触摸友好按钮
</button>`}</pre>
          </div>
        </section>

        {/* 最佳实践 */}
        <section className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">💡 响应式设计最佳实践</h2>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="text-blue-600 font-semibold">🎯 移动优先:</span>
              <span>所有组件从xs断点开始设计，逐步增强到桌面端</span>
            </div>
            <div className="flex gap-3">
              <span className="text-blue-600 font-semibold">🎨 智能切换:</span>
              <span>移动端自动使用紧凑模式，无需用户手动配置</span>
            </div>
            <div className="flex gap-3">
              <span className="text-blue-600 font-semibold">📱 触摸友好:</span>
              <span>所有交互元素符合44px最小触摸目标，增加视觉反馈</span>
            </div>
            <div className="flex gap-3">
              <span className="text-blue-600 font-semibold">🔄 状态一致:</span>
              <span>跨设备保持功能完整性，仅优化展示形式</span>
            </div>
            <div className="flex gap-3">
              <span className="text-blue-600 font-semibold">⚡ 性能优化:</span>
              <span>使用useResponsiveValue缓存配置，避免重复计算</span>
            </div>
            <div className="flex gap-3">
              <span className="text-blue-600 font-semibold">♿ 可访问性:</span>
              <span>遵循WCAG 2.1 AA标准，支持键盘导航和屏幕阅读器</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default ScoringUIDemo;