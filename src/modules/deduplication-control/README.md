# 查重频控模块

## 概述

查重频控模块提供了完整的安全检测、去重控制、频率限制和熔断保护功能，是小红书自动化营销工具的核心安全组件。

## 功能特性

### 🛡️ 多层安全保护
- **去重检测**: 基于内容相似度的智能去重
- **频率控制**: 可配置的时间窗口频次限制
- **熔断保护**: 故障检测和自动恢复机制
- **白名单/黑名单**: 灵活的用户分类管理

### 📊 实时监控
- **健康状态**: 系统运行状态实时监控
- **统计分析**: 详细的检查数据和拦截原因分析
- **历史记录**: 最近检查记录和趋势分析

### ⚙️ 灵活配置
- **策略配置**: 支持多种检测策略和参数调整
- **阈值设置**: 可自定义各种安全阈值
- **开关控制**: 独立的功能模块开关

## 快速开始

### 1. 基本使用

```tsx
import { DeduplicationControlManager } from '@/modules/deduplication-control';

function App() {
  return (
    <div>
      <DeduplicationControlManager />
    </div>
  );
}
```

### 2. 独立组件使用

```tsx
import { 
  SafetyConfigPanel,
  SafetyMonitorPanel,
  WhiteBlacklistManager,
  useSafetyControl
} from '@/modules/deduplication-control';

function CustomSafetyPage() {
  const {
    config,
    statistics,
    updateConfig,
    // ... 其他hooks方法
  } = useSafetyControl();

  return (
    <div>
      {/* 配置面板 */}
      <SafetyConfigPanel
        config={config}
        onConfigUpdate={updateConfig}
      />
      
      {/* 监控面板 */}
      <SafetyMonitorPanel
        statistics={statistics}
        // ... 其他props
      />
      
      {/* 名单管理 */}
      <WhiteBlacklistManager
        // ... props
      />
    </div>
  );
}
```

### 3. 程序化安全检查

```tsx
import { useSafetyControl } from '@/modules/deduplication-control';

function ContactProcessor() {
  const { performSafetyCheck } = useSafetyControl();

  const handleContact = async (contactData: any) => {
    const result = await performSafetyCheck({
      content: contactData.message,
      target: contactData.phone,
      accountId: 'current_account',
      action: 'send_message'
    });

    if (result.allowed) {
      // 执行操作
      await sendMessage(contactData);
    } else {
      // 处理拦截
      console.log('操作被拦截:', result.blockReason);
    }
  };

  return (
    // ... UI组件
  );
}
```

## 架构说明

### 目录结构
```
src/modules/deduplication-control/
├── types/              # 类型定义
│   └── index.ts
├── services/           # 服务层
│   ├── DeduplicationService.ts
│   ├── RateLimitService.ts
│   ├── CircuitBreakerService.ts
│   ├── SafetyCheckService.ts
│   └── index.ts
├── hooks/              # React Hooks
│   └── useSafetyControl.ts
├── components/         # UI组件
│   ├── SafetyConfigPanel.tsx
│   ├── SafetyMonitorPanel.tsx
│   ├── WhiteBlacklistManager.tsx
│   ├── DeduplicationControlManager.tsx
│   └── index.ts
├── index.ts           # 统一导出
└── README.md          # 说明文档
```

### 分层设计

1. **类型层** (`types/`): 定义所有接口和类型
2. **服务层** (`services/`): 实现核心业务逻辑
3. **应用层** (`hooks/`): 提供React集成接口
4. **表现层** (`components/`): 实现用户界面

## API 参考

### 主要类型

#### SafetyConfig
```typescript
interface SafetyConfig {
  deduplication: DeduplicationConfig;
  rateLimit: RateLimitConfig;
  circuitBreaker: CircuitBreakerConfig;
}
```

#### SafetyCheckRequest
```typescript
interface SafetyCheckRequest {
  content: string;
  target: string;
  accountId: string;
  action: string;
  metadata?: Record<string, any>;
}
```

#### SafetyCheckResult
```typescript
interface SafetyCheckResult {
  allowed: boolean;
  riskScore: number;
  checkTime: Date;
  deduplication: DeduplicationResult;
  rateLimit: RateLimitResult;
  circuitBreaker: CircuitBreakerResult;
  recommendations: Recommendation[];
}
```

### useSafetyControl Hook

```typescript
const {
  // 配置管理
  config,
  updateConfig,
  
  // 统计数据
  statistics,
  loadStatistics,
  
  // 健康监控
  healthStatus,
  refreshHealth,
  
  // 检查功能
  performSafetyCheck,
  recentChecks,
  
  // 白名单管理
  whitelist,
  addToWhitelist,
  updateWhitelistEntry,
  deleteWhitelistEntry,
  
  // 黑名单管理
  blacklist,
  addToBlacklist,
  updateBlacklistEntry,
  deleteBlacklistEntry,
  
  // 批量操作
  batchImportWhitelist,
  batchImportBlacklist,
  exportWhitelist,
  exportBlacklist,
  
  // 状态
  loading,
  error
} = useSafetyControl();
```

## 配置说明

### 去重配置
- **strategy**: 去重策略 (exact/fuzzy/semantic)
- **threshold**: 相似度阈值 (0-100)
- **timeWindow**: 时间窗口 (分钟)
- **storageLimit**: 存储限制 (条数)

### 频控配置
- **maxRequests**: 最大请求数
- **timeWindow**: 时间窗口 (秒)
- **burstLimit**: 突发限制
- **queueSize**: 队列大小

### 熔断配置
- **failureThreshold**: 失败阈值
- **timeout**: 超时时间 (毫秒)
- **resetTimeout**: 重置超时 (毫秒)

## 集成指南

### 1. 在页面中集成

```tsx
// src/pages/SafetyManagement.tsx
import React from 'react';
import { DeduplicationControlManager } from '@/modules/deduplication-control';

export const SafetyManagementPage: React.FC = () => {
  return (
    <div className="page-container">
      <DeduplicationControlManager />
    </div>
  );
};
```

### 2. 在导航中添加

```tsx
// src/components/Navigation.tsx
import { SafetyCertificateOutlined } from '@ant-design/icons';

const menuItems = [
  // ... 其他菜单项
  {
    key: 'safety',
    icon: <SafetyCertificateOutlined />,
    label: '安全管理',
    path: '/safety'
  }
];
```

### 3. 在任务执行中集成

```tsx
// src/modules/task-management/hooks/useTaskExecution.ts
import { useSafetyControl } from '@/modules/deduplication-control';

export const useTaskExecution = () => {
  const { performSafetyCheck } = useSafetyControl();

  const executeTask = async (task: Task) => {
    // 执行前安全检查
    const safetyResult = await performSafetyCheck({
      content: task.content,
      target: task.target,
      accountId: task.accountId,
      action: task.action
    });

    if (!safetyResult.allowed) {
      throw new Error(`任务被安全检查拦截: ${safetyResult.blockReason}`);
    }

    // 执行任务
    return await executeTaskInternal(task);
  };

  return { executeTask };
};
```

## 注意事项

### 性能优化
- 去重缓存会占用内存，建议合理设置 `storageLimit`
- 频控检查使用时间窗口算法，高频调用时注意性能
- 统计数据查询建议限制时间范围

### 安全考虑
- 白名单/黑名单数据建议加密存储
- 敏感配置参数应通过环境变量管理
- 定期审计和清理过期数据

### 错误处理
- 所有异步操作都包含错误处理
- 网络异常时会自动重试
- 关键错误会记录到日志系统

## 故障排除

### 常见问题

1. **配置不生效**
   - 检查配置是否正确保存
   - 确认相关功能模块已启用
   - 重启应用服务

2. **检查结果异常**
   - 检查 Tauri 后端服务状态
   - 确认请求参数格式正确
   - 查看控制台错误信息

3. **性能问题**
   - 调整去重缓存大小
   - 优化频控时间窗口
   - 减少统计数据查询频率

### 日志调试

```typescript
// 启用调试模式
localStorage.setItem('safety_debug', 'true');

// 查看详细日志
console.log('Safety check result:', result);
```

## 版本说明

- **v1.0.0**: 基础功能实现
- **当前版本**: 完整功能实现，包含所有安全检测和管理功能

## 贡献指南

1. 遵循项目的 DDD 架构原则
2. 保持类型安全，避免使用 `any`
3. 所有组件必须支持浅色背景主题
4. 新增功能需要包含完整的类型定义
5. 重要功能变更需要更新文档