# AI 接入模块

## 📋 概述

AI 模块提供统一的 AI 接入能力，支持 OpenAI 和腾讯混元等多种 AI 提供商。模块采用 Provider 适配器模式，可灵活切换不同的 AI 服务。

## 🏗️ 架构设计

```
src/modules/ai/
├── domain/                     # 领域层
│   ├── ai-types.ts            # 核心类型定义
│   ├── ai-config.ts           # 配置管理
│   ├── step-card-schema.ts    # 步骤卡片 Schema
│   └── tools-schema.ts        # AI 工具函数 Schema
├── services/                   # 服务层
│   ├── ai-factory.ts          # AI 客户端工厂
│   ├── ai-openai-provider.ts  # OpenAI Provider 实现
│   ├── ai-retry.ts            # 重试和限流机制
│   └── ai-logger.ts           # 日志记录
├── application/                # 应用层
│   └── ai-generate-step-card-use-case.ts  # 生成步骤卡片用例
├── hooks/                      # Hooks 层
│   └── use-ai.ts              # AI 统一 Hook
├── index.ts                    # 门牌导出
└── README.md                   # 本文档
```

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm add openai
```

### 2. 配置环境变量

在 `.env` 或 `.env.local` 中添加：

```bash
# AI 提供商选择（openai 或 hunyuan）
VITE_AI_PROVIDER=openai

# OpenAI 配置
VITE_OPENAI_API_KEY=sk-your-api-key
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_OPENAI_EMBED_MODEL=text-embedding-3-large

# 腾讯混元配置（可选）
# VITE_HUNYUAN_API_KEY=your-hunyuan-key
# VITE_HUNYUAN_BASE_URL=https://api.hunyuan.cloud.tencent.com/v1
# VITE_HUNYUAN_MODEL=hunyuan-turbo-latest
```

### 3. 在组件中使用

```tsx
import { useAI } from '@/modules/ai';

function MyComponent() {
  const { generateStepCard, isLoading, error } = useAI();

  const handleGenerate = async () => {
    const stepCard = await generateStepCard({
      xmlSnippet: '<node resource-id="btn_submit">提交</node>',
      targetDescription: '提交按钮',
      context: '登录页面',
    });
    
    if (stepCard) {
      console.log('生成的步骤卡片:', stepCard);
      // { strategyType: 'self_anchor', locator: {...}, confidence: 0.95, ... }
    }
  };

  return (
    <button onClick={handleGenerate} disabled={isLoading}>
      {isLoading ? '生成中...' : '生成步骤卡片'}
    </button>
  );
}
```

## 📚 核心功能

### 1. 生成步骤卡片

使用 AI 分析 XML 布局并生成最优的元素定位策略：

```typescript
const stepCard = await generateStepCard({
  xmlSnippet: xmlContent,
  targetDescription: '目标元素描述',
  context: '页面上下文',
  model: 'gpt-4o-mini', // 可选，默认根据 provider 选择
});
```

### 2. 流式生成

支持实时展示 AI 生成过程：

```typescript
await generateStepCardStream(
  { xmlSnippet: xmlContent },
  (event) => {
    if (event.type === 'delta') {
      console.log('增量内容:', event.delta);
    } else if (event.type === 'done') {
      console.log('生成完成');
    }
  }
);
```

### 3. 向量嵌入

生成文本的向量表示，用于语义搜索：

```typescript
const embeddings = await embed([
  '文本1',
  '文本2',
  '文本3',
]);
// [[0.1, 0.2, ...], [0.3, 0.4, ...], ...]
```

## 🔧 高级配置

### 自定义重试策略

```typescript
import { aiClientManager, getConfigFromEnv } from '@/modules/ai';

const config = getConfigFromEnv();

// 自定义重试配置
if (config.openai) {
  config.openai.retryConfig = {
    maxRetries: 5,
    initialDelayMs: 500,
    maxDelayMs: 20000,
    backoffMultiplier: 2,
  };
}

aiClientManager.initialize(config);
```

### 切换 AI 提供商

只需修改环境变量即可切换：

```bash
# 使用 OpenAI
VITE_AI_PROVIDER=openai

# 或使用混元
VITE_AI_PROVIDER=hunyuan
```

### 自定义 AI 工具函数

```typescript
import type { ToolSpec } from '@/modules/ai';

const customTool: ToolSpec = {
  name: 'custom_tool',
  description: '自定义工具描述',
  parameters: {
    type: 'object',
    properties: {
      param1: { type: 'string' },
      param2: { type: 'number' },
    },
  },
};
```

## 🎯 步骤卡片 Schema

AI 生成的步骤卡片包含以下字段：

```typescript
interface StepCard {
  strategyType: 'self_anchor' | 'child_anchor' | 'local_index' | 'global_index' | 'ocr_match' | 'image_template';
  locator: {
    kind: 'xpath' | 'resource_id' | 'text' | 'bounds' | 'css' | 'accessibility_id';
    value: string;
  };
  confidence: number; // 0-1
  fallbacks?: Array<{ kind: string; value: string }>; // 备选定位器
  notes?: string; // 说明
  reasoning?: string; // AI 推理过程
}
```

## 🛡️ 错误处理

模块提供完整的错误处理和重试机制：

```typescript
import { AIError, AIErrorType } from '@/modules/ai';

try {
  const result = await generateStepCard(input);
} catch (error) {
  if (error instanceof AIError) {
    switch (error.type) {
      case AIErrorType.RATE_LIMIT:
        console.log('触发限流，请稍后重试');
        break;
      case AIErrorType.AUTHENTICATION:
        console.log('API Key 无效');
        break;
      case AIErrorType.TIMEOUT:
        console.log('请求超时');
        break;
      default:
        console.log('未知错误:', error.message);
    }
  }
}
```

## 📊 日志和监控

模块内置日志记录功能：

```typescript
import { getGlobalLogger } from '@/modules/ai';

const logger = getGlobalLogger();

// 获取统计信息
const stats = logger.getStats();
console.log({
  totalRequests: stats.totalRequests,
  totalErrors: stats.totalErrors,
  avgDuration: stats.avgDuration,
  totalTokens: stats.totalTokens,
});
```

## 🔒 安全注意事项

1. **API Key 管理**：绝不在代码中硬编码 API Key，始终使用环境变量
2. **数据隐私**：确认 AI 提供商的数据使用政策
3. **成本控制**：设置合理的 token 限制和超时时间
4. **限流保护**：避免频繁调用导致被限流

## 📖 参考文档

- [OpenAI API 文档](https://platform.openai.com/docs/api-reference)
- [腾讯混元 OpenAI 兼容接口](https://cloud.tencent.com/document/product/1729/111006)
- [项目 DDD 架构规范](../../.github/copilot-instructions.md)

## 🤝 贡献指南

遵循项目的 DDD 分层架构和命名规范：

- 文件命名：`ai-xxx.ts`（小写 + 连字符）
- 类型命名：`AIXxx`（大驼峰 + AI 前缀）
- 每个文件必须包含三行文件头
- 通过 `index.ts` 统一导出公共接口

## ⚠️ 已知限制

1. OpenAI Provider 需要安装 `openai` 依赖包
2. 混元的 Embeddings 固定为 1024 维度
3. 流式生成暂未完全实现（当前版本）
4. Tool Calling 的实际执行逻辑需要在业务层实现

## 🗺️ Roadmap

- [ ] 完善流式生成实现
- [ ] 添加更多 AI 提供商支持（Claude、文心一言等）
- [ ] 实现 Tool Calling 的完整处理流程
- [ ] 添加缓存机制减少 API 调用
- [ ] 提供更多预设的 Prompt 模板
