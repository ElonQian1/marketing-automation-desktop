# Marketing Module (营销模块)

> **模块前缀**: `marketing-` / `Marketing`  
> **别名路径**: `@marketing`  
> **核心职责**: 营销自动化核心功能，包含联系人管理、消息发送、批量操作等

---

## 📁 目录结构

```
src/modules/marketing/
├── domain/              # 领域层
│   ├── entities/        # 营销实体
│   ├── value-objects/   # 值对象
│   └── public/          # 对外契约
├── application/         # 应用层
│   └── usecases/        # 业务用例
├── services/            # 服务层
├── api/                 # API 适配器
├── hooks/               # React Hooks
├── ui/                  # UI 组件
└── index.ts             # 模块门牌导出
```

---

## 🎯 核心功能

### 1. 联系人管理
- 联系人导入导出
- 联系人分组管理
- 联系人去重
- 联系人标签

### 2. 消息自动化
- 批量发送消息
- 消息模板管理
- 定时发送
- 发送记录追踪

### 3. 批量操作
- 批量添加好友
- 批量发送名片
- 批量互动点赞
- 操作进度监控

---

## 📦 对外导出

```typescript
import {
  ContactEntity,
  MessageTemplate,
  SendMessageUseCase,
  BatchOperationService
} from '@marketing';
```

---

## 🚀 使用示例

```typescript
// 批量发送消息
const sendUseCase = new SendMessageUseCase();
await sendUseCase.execute({
  contacts: selectedContacts,
  template: messageTemplate,
  options: {
    delay: 1000,
    stopOnError: false
  }
});
```

---

**最后更新**: 2025-10-26  
**维护者**: @团队
