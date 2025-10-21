# AI 模块安装和使用指南

## 📦 安装步骤

### 1. 安装 OpenAI SDK

```bash
pnpm add openai
```

### 2. 配置环境变量

复制环境变量示例文件：

```bash
cp .env.ai.example .env.local
```

编辑 `.env.local` 文件，添加您的 API Key：

```bash
# 选择 AI 提供商
VITE_AI_PROVIDER=openai

# OpenAI 配置
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_OPENAI_MODEL=gpt-4o-mini
```

### 3. 更新 TypeScript 配置（已完成）

AI 模块的路径别名已添加到 `tsconfig.app.json`：

```json
{
  "compilerOptions": {
    "paths": {
      "@ai/*": ["src/modules/ai/*"]
    }
  }
}
```

## 🚀 快速开始

### 基础用法

```tsx
import { useAI } from '@ai';

function MyComponent() {
  const { generateStepCard, isLoading, error } = useAI();

  const handleGenerate = async () => {
    const result = await generateStepCard({
      xmlSnippet: '<node resource-id="btn_login">登录</node>',
      targetDescription: '登录按钮',
    });
    
    console.log(result);
  };

  return (
    <button onClick={handleGenerate} disabled={isLoading}>
      生成步骤卡片
    </button>
  );
}
```

### 完整示例（带错误处理）

```tsx
import { useAI, AIError, AIErrorType } from '@ai';

function AdvancedComponent() {
  const { generateStepCard, isLoading, error, clearError } = useAI();
  const [stepCard, setStepCard] = useState(null);

  const handleGenerate = async (xmlContent: string) => {
    try {
      const result = await generateStepCard({
        xmlSnippet: xmlContent,
        targetDescription: '目标元素',
        context: '当前页面的上下文信息',
        model: 'gpt-4o-mini', // 可选
      });

      if (result) {
        setStepCard(result);
        console.log('策略:', result.strategyType);
        console.log('定位器:', result.locator);
        console.log('置信度:', result.confidence);
      }
    } catch (err) {
      if (err instanceof AIError) {
        switch (err.type) {
          case AIErrorType.RATE_LIMIT:
            message.warning('请求过于频繁，请稍后再试');
            break;
          case AIErrorType.AUTHENTICATION:
            message.error('API Key 无效，请检查配置');
            break;
          default:
            message.error(err.message);
        }
      }
    }
  };

  return (
    <div>
      {isLoading && <Spin tip="AI 分析中..." />}
      {error && (
        <Alert
          type="error"
          message={error.message}
          closable
          onClose={clearError}
        />
      )}
      {stepCard && (
        <Card title="生成的步骤卡片">
          <p>策略: {stepCard.strategyType}</p>
          <p>定位: {stepCard.locator.kind} = {stepCard.locator.value}</p>
          <p>置信度: {(stepCard.confidence * 100).toFixed(1)}%</p>
        </Card>
      )}
    </div>
  );
}
```

## 🔌 集成到现有业务

### 在步骤卡片编辑器中使用

```tsx
// src/components/step-card-editor/StepCardEditor.tsx
import { useAI } from '@ai';

function StepCardEditor({ xmlContent }: { xmlContent: string }) {
  const { generateStepCard, isLoading } = useAI();
  const [strategies, setStrategies] = useState([]);

  const handleAIGenerate = async () => {
    const aiResult = await generateStepCard({
      xmlSnippet: xmlContent,
      targetDescription: '用户选择的元素',
    });

    if (aiResult) {
      // 添加 AI 生成的策略到列表
      setStrategies([
        ...strategies,
        {
          type: 'ai_generated',
          ...aiResult,
        },
      ]);
    }
  };

  return (
    <div>
      <Button
        onClick={handleAIGenerate}
        loading={isLoading}
        icon={<RobotOutlined />}
      >
        AI 智能生成
      </Button>
      {/* 其余 UI */}
    </div>
  );
}
```

### 在智能策略系统中使用

```tsx
// src/modules/intelligent-strategy-system/hooks/useAIStrategy.ts
import { useAI, type StepCard } from '@ai';

export function useAIStrategy() {
  const { generateStepCard } = useAI();

  const analyzeElement = async (
    elementXml: string,
    context: string
  ): Promise<StepCard | null> => {
    return await generateStepCard({
      xmlSnippet: elementXml,
      context,
    });
  };

  return { analyzeElement };
}
```

## 🎯 高级功能

### 1. 流式生成（实时反馈）

```tsx
const { generateStepCardStream } = useAI();

await generateStepCardStream(
  { xmlSnippet: xml },
  (event) => {
    switch (event.type) {
      case 'delta':
        console.log('增量:', event.delta);
        break;
      case 'done':
        console.log('完成');
        break;
      case 'error':
        console.error('错误:', event.error);
        break;
    }
  }
);
```

### 2. 向量嵌入（语义搜索）

```tsx
const { embed } = useAI();

const vectors = await embed([
  '这是第一段文本',
  '这是第二段文本',
]);

// vectors: [[0.1, 0.2, ...], [0.3, 0.4, ...]]
```

### 3. 直接使用客户端（高级）

```tsx
import { getAIClient } from '@ai';

const client = getAIClient();
const response = await client.chat({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: '你是助手' },
    { role: 'user', content: '你好' },
  ],
});
```

## 🔧 配置选项

### 切换到混元

```bash
# .env.local
VITE_AI_PROVIDER=hunyuan
VITE_HUNYUAN_API_KEY=your-hunyuan-key
VITE_HUNYUAN_BASE_URL=https://api.hunyuan.cloud.tencent.com/v1
```

### 自定义模型

```tsx
const result = await generateStepCard({
  xmlSnippet: xml,
  model: 'gpt-4o', // 使用更强大的模型
});
```

## 📊 监控和调试

### 查看日志统计

```tsx
import { getGlobalLogger } from '@ai';

const logger = getGlobalLogger();
const stats = logger.getStats();

console.log({
  总请求数: stats.totalRequests,
  错误数: stats.totalErrors,
  平均耗时: `${stats.avgDuration}ms`,
  总Token数: stats.totalTokens,
});
```

## ⚠️ 注意事项

1. **API Key 安全**
   - 绝不在代码中硬编码 API Key
   - 不要将 `.env.local` 提交到 Git
   - `.env.local` 已在 `.gitignore` 中

2. **成本控制**
   - 设置合理的 `maxTokens` 限制
   - 避免在循环中频繁调用
   - 使用缓存减少重复请求

3. **错误处理**
   - 始终检查返回值是否为 null
   - 捕获并处理 AIError
   - 提供用户友好的错误提示

4. **性能优化**
   - 首选非流式调用（更快）
   - 流式调用用于需要实时反馈的场景
   - 考虑使用 debounce 防止频繁调用

## 🐛 故障排查

### 问题：Module not found: 'openai'

**解决**：
```bash
pnpm add openai
```

### 问题：API Key 无效

**解决**：
1. 检查 `.env.local` 中的 `VITE_OPENAI_API_KEY`
2. 确认 API Key 格式正确（以 `sk-` 开头）
3. 验证 API Key 在 OpenAI 控制台是否有效

### 问题：CORS 错误

**解决**：
- OpenAI API 应该从后端调用
- 如果必须从前端调用，需要配置代理
- 建议使用 Tauri 后端调用 API

### 问题：请求超时

**解决**：
```tsx
// 增加超时时间
const client = getAIClient();
// 在配置中设置 timeout: 120000
```

## 📚 更多资源

- [模块 README](./src/modules/ai/README.md)
- [OpenAI API 文档](https://platform.openai.com/docs)
- [项目架构规范](./copilot-instructions.md)

## 🤝 技术支持

如有问题，请：
1. 查看控制台日志
2. 检查环境变量配置
3. 阅读模块 README
4. 查看示例代码
