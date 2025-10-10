                                                                          # 智能策略系统 (Intelligent Strategy System)

## 📋 项目概述

本模块实现了基于文档描述的 **Step 0-6 智能匹配策略决策流程**，解决了用户在元素选择时需要手动选择匹配策略的问题。

### 核心功能
- **智能策略推荐**：基于元素特征自动推荐最佳匹配策略
- **Step 0-6 决策流程**：完整实现文档描述的渐进式策略选择
- **评分系统**：多维度评分确保策略推荐的准确性
- **本地验证**：在缓存XML上验证策略唯一性

### 解决的问题
1. **策略选择困难**：用户无需手动选择，系统自动推荐最佳策略
2. **跨设备兼容性**：智能识别设备差异，选择稳定的匹配方式
3. **性能优化**：渐进式决策，优先选择快速且稳定的策略

## 🏗️ 架构设计

### 模块结构
```
intelligent-strategy-system/
├── types/              # 类型定义
├── core/               # 核心决策引擎
├── analyzers/          # Step 1-6 分析器
├── scoring/            # 评分系统
├── generators/         # 生成器
├── integration/        # 集成适配
└── utils/              # 工具函数
```

### 核心流程
```
用户选择元素 → Step 0 规范化输入 → Step 1-6 分析器链 → 评分排序 → 本地验证 → 推荐最佳策略
```

## 🎯 决策流程详解

### Step 0: 规范化输入
- 提取元素属性（id/text/class/clickable等）
- 分析祖先链和最近可点击父节点
- 收集稳定容器和潜在锚点

### Step 1: 自我可定位性检查
- resource-id 唯一性检查
- content-desc 唯一性检查
- 组合键（id + class + package）唯一性

### Step 2: 子树锚点查找
- 在元素子树中查找稳定锚点
- 文本锚点和图标ID锚点
- 构造"可点击父 + 后代锚点"策略

### Step 3: 上溯可点击父节点
- 查找最近的可点击父节点
- 使用父节点 + 子元素特征组合

### Step 4: 区域限定匹配
- 锁定稳定容器（如底部导航）
- 在容器内进行局部匹配

### Step 5: 邻居相对定位
- 使用已稳定命中的兄弟节点为参照
- 前/后相对位置匹配

### Step 6: 索引兜底
- 优先局部索引（容器内）
- 最后才使用全局索引，并加强校验

## 📊 评分权重配置

```typescript
评分规则：
├── ID唯一性: +100分
├── content-desc唯一: +95分
├── 文本等值匹配: +70分
├── 区域限定: +30分
├── 结构稳定性: +20~40分
├── 局部索引: -15分（+校验补偿+10分）
└── 全局索引: -60分
```

## 🔧 使用方式

### 基本使用
```typescript
import { StrategyDecisionEngine } from '@/modules/intelligent-strategy-system';

const engine = new StrategyDecisionEngine();
const recommendation = await engine.analyzeAndRecommend(selectedNode, xmlSnapshot);

console.log(`推荐策略: ${recommendation.strategy}`);
console.log(`置信度: ${recommendation.confidence}`);
console.log(`推荐理由: ${recommendation.reason}`);
```

### 集成到现有流程
```typescript
// 在元素选择确认时调用
const handleElementConfirm = async (node: UiNode) => {
  const recommendation = await intelligentStrategy.recommend(node);
  
  // 自动设置推荐的策略
  setSelectedStrategy(recommendation.strategy);
  
  // 生成步骤信息
  const stepInfo = await stepGenerator.generate(node, recommendation);
};
```

## ⚡ 性能特点

- **快速决策**：优先级算法，能快速命中就不回退
- **本地验证**：在缓存XML上验证，避免网络延迟
- **内存缓存**：复用分析结果，减少重复计算
- **渐进式回退**：只在必要时使用复杂策略

## 🧪 测试策略

每个分析器都支持独立单元测试：
```typescript
describe('SelfAnchorAnalyzer', () => {
  it('应该正确识别唯一的resource-id', () => {
    // 测试用例
  });
});
```

## 📈 扩展性

- **新增分析器**：在 `analyzers/` 目录添加新的分析器类
- **调整评分权重**：修改 `scoring/ScoreWeightConfig.ts`
- **自定义策略**：实现 `IStrategyAnalyzer` 接口

## 🤝 兼容性

本模块完全兼容现有架构：
- 保持现有 `useAdb()` 接口不变
- 兼容现有步骤生成流程
- 提供 Legacy 适配层支持旧代码

---

**版本**: v1.0.0  
**创建日期**: 2025年10月9日  
**架构**: DDD + 模块化设计