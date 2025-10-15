# 策略选择器功能说明

## 🎯 功能概述

步骤卡片现在集成了智能策略选择器，支持三种策略类型的自动切换和手动选择：

### 📋 三种策略类型

1. **🧠 智能·自动链**（smart-auto）
   - Step1→Step6 动态决策链
   - 必要时回退全局索引兜底
   - 适用于复杂多步骤操作

2. **🎯 智能·单步**（smart-single）  
   - 从 Step1~Step6 指定某一步强制使用
   - 精确控制特定分析步骤
   - 适用于已知最佳策略的场景

3. **📌 静态策略**（static）
   - 用户保存/自建的固定XPath策略
   - 快速执行，但元素变化时失效风险高
   - 适用于稳定界面的高性能操作

### ✨ 核心功能

#### 🤖 智能推荐系统
- 分析完成后自动显示置信度最高的策略
- 一键升级功能快速应用推荐策略
- 置信度评分帮助用户决策

#### 🔄 实时分析能力
- 支持手动触发重新分析
- 实时显示分析进度条
- 支持分析任务取消

#### 💾 策略保存功能
- 将智能策略候选保存为静态策略
- 用户自定义策略管理
- 策略复用提升效率

### 🎨 界面特性

#### 🎪 响应式布局
- 左右分栏在小屏幕自动变为上下两行
- 智能换行保证内容完整显示
- flexWrap 确保各种屏幕尺寸适配

#### 🌈 独立设计系统
- STEP_CARD_DESIGN_TOKENS 独立色彩系统
- 避免全局样式冲突
- 强制颜色值确保可读性

#### 📱 交互体验
- 直观的策略类型按钮切换
- 候选策略列表展开/收起
- 置信度可视化显示

### 🔧 技术实现

#### 📊 类型系统
```typescript
// 策略选择器核心类型
export interface StrategySelector {
  activeStrategy: {
    type: StrategyType;
    key?: string;
  };
  analysis: AnalysisState;
  candidates: {
    smart: StrategyCandidate[];
    static: StrategyCandidate[];
  };
  recommended?: RecommendedStrategy;
  config: StrategyConfig;
}
```

#### 🎭 事件系统
- `onStrategyChange`: 策略切换事件
- `onReanalyze`: 重新分析触发
- `onSaveAsStatic`: 保存静态策略
- `onApplyRecommendation`: 应用推荐策略

### 🚀 快速体验

#### 🎭 演示版本（模拟数据）
1. 启动应用后导航到 **"🧠 策略选择器演示"**
2. 查看完整的策略选择器界面和交互
3. 尝试不同策略类型的切换
4. 体验重新分析和策略保存功能

#### 🚀 真实后端集成版本
1. 启动应用后导航到 **"🚀 策略选择器后端集成"**
2. 体验真实的Tauri后端智能分析服务
3. 观察实时的分析进度和事件更新
4. 测试完整的策略生成和推荐系统

### 📈 业务价值

- **🎯 精确控制**: 三层策略体系满足不同精度需求
- **⚡ 性能优化**: 智能推荐减少试错成本  
- **🔄 容错机制**: 自动链策略提供回退兜底
- **💡 学习能力**: 分析结果持续优化策略选择

### 🔗 后端集成完成

✅ **真实后端服务已完整集成**：
- `useSmartStrategyAnalysis` Hook 调用真实的智能分析后端
- `SmartStepCardWithBackend` 组件提供完整的后端集成包装
- Tauri事件监听实现实时进度更新和结果同步
- 完整的任务生命周期管理（开始/取消/重试）

🎯 **使用真实集成版本**：
```tsx
import SmartStepCardWithBackend from './components/SmartStepCardWithBackend';

<SmartStepCardWithBackend
  step={step}
  element={xmlElement}  // 提供XML分析的元素信息
  onStepUpdate={handleStepUpdate}
  // ...其他props
/>
```

---

*策略选择器现在拥有完整的前后端集成能力，从演示阶段正式进入生产就绪状态。真实的智能分析后端为策略生成提供强大的技术支撑。*