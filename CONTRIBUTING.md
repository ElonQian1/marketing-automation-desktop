# 贡献指南 / Contributing Guide

欢迎参与 Universal Mobile App Automation Platform 的开发！本指南将帮助您快速上手并有效贡献。

## 🚀 快速开始

### 1. 设置开发环境

```bash
# 克隆仓库
git clone https://github.com/your-username/employeeGUI.git
cd employeeGUI

# 安装依赖
npm install

# 安装 Rust 依赖和 Tauri CLI
cargo install tauri-cli

# 启动开发服务器
npm run tauri dev
```

### 2. 运行测试

```bash
# 类型检查
npm run type-check

# 代码质量检查
npm run lint

# E2E 测试
npx playwright test

# Rust 测试
cargo test
```

## 🏗️ 项目架构

### DDD 分层架构

```
src/modules/<module>/
├── domain/          # 业务逻辑和规则
├── application/     # 用例和应用服务
├── services/        # 外部服务接口
├── api/            # API 调用
├── stores/         # 状态管理
├── hooks/          # React Hooks
├── ui/             # UI 组件
└── pages/          # 页面组件
```

### 模块列表

- `prospecting` - 精准获客功能
- `script-builder` - 智能脚本构建
- `contact-import` - 联系人导入
- `adb` - Android 设备管理

## 📝 开发规范

### 1. **命名前缀规则**

为避免模块间文件重名，易重名文件必须添加模块前缀：

```typescript
// ❌ 错误
export class StrategyWeighted { }

// ✅ 正确  
export class ProspectingStrategyWeighted { }
```

### 2. **文件头注释**

每个 TypeScript 文件顶部必须包含三行注释：

```typescript
// src/modules/prospecting/domain/strategies/weighted.ts
// module: prospecting | layer: domain | role: 加权评分策略
// summary: 基于多维度权重计算潜客评分的核心算法
```

### 3. **依赖导入规则**

- 跨模块导入必须通过模块的 `index.ts`
- `domain` 层不得导入 UI/API/Services 相关依赖

```typescript
// ✅ 正确的跨模块导入
import { BuildLeadScoreUseCase } from '@prospecting';
import { ScriptStrategy } from '@script';

// ❌ 错误 - 绕过模块边界
import { WeightedStrategy } from '@prospecting/domain/strategies/weighted';
```

## 🔧 关键修复：事件路由系统

### 背景

项目最近修复了一个关键的事件路由问题：

**问题**: 后端分析完成显示"✅ 分析完成"，但前端按钮仍显示"🧠 智能·自动链 🔄 0%"

**根因**: 两套独立的分析系统缺乏统一的事件路由机制

### 解决方案

1. **统一状态管理** (`src/store/stepcards.ts`)
   ```typescript
   interface StepCard {
     id: string;
     jobId?: string;  // 关键：jobId绑定
     status: 'draft' | 'analyzing' | 'ready';
   }
   ```

2. **统一事件服务** (`src/services/unified-analysis-events.ts`)
   ```typescript
   class UnifiedAnalysisEventService {
     handleAnalysisProgress(jobId: string, progress: number) {
       // 精确路由到对应的 step card
     }
   }
   ```

3. **新组件** (`src/components/unified/`)
   - `UnifiedSmartStepCard` - 统一的智能步骤卡
   - `UnifiedCompactStrategyMenu` - 统一的策略菜单

### E2E 测试

专门的 E2E 测试确保事件路由正确性：

```typescript
// tests/e2e/event-routing-fix.spec.ts
test('事件路由修复验证', async ({ page }) => {
  // 测试 jobId 绑定和状态同步
  await validateEventRouting(page);
});
```

## 🧪 测试策略

### 运行特定测试

```bash
# 只运行事件路由测试
npx playwright test event-routing-fix

# 运行核心功能测试
npx playwright test --grep "核心功能"

# 运行特定模块测试
cargo test prospecting
```

### 添加新测试

1. **E2E 测试**: 在 `tests/e2e/` 添加 `.spec.ts` 文件
2. **单元测试**: Rust 测试在模块内的 `tests/` 目录
3. **组件测试**: 使用 React Testing Library

## 🔄 CI/CD 工作流

### 提交流程

1. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **本地测试**
   ```bash
   npm run type-check
   npm run lint
   npx playwright test
   ```

3. **提交代码**
   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   git push origin feature/your-feature-name
   ```

4. **创建 Pull Request**
   - CI 会自动运行完整测试套件
   - 包括跨平台构建验证
   - 事件系统专项测试

### 自动化检查

每个 PR 都会触发：

- ✅ TypeScript 类型检查
- ✅ ESLint 代码质量
- ✅ Rust 编译和测试
- ✅ E2E 功能测试
- ✅ 事件路由验证
- ✅ 跨平台构建测试

## 🐛 调试指南

### 常见问题

1. **事件未触发**
   - 检查 `jobId` 是否正确绑定
   - 验证事件监听器是否正确注册
   - 查看浏览器控制台的事件日志

2. **状态同步问题**
   - 确认使用统一的 `useStepCardStore`
   - 检查 `updateStepCardStatus` 调用
   - 验证 `jobId` 路由逻辑

3. **构建失败**
   - 检查 TypeScript 类型错误
   - 验证 Rust 编译错误
   - 确认依赖版本兼容性

### 调试工具

- **Chrome DevTools**: 监控 Tauri 事件
- **Rust 日志**: `RUST_LOG=debug npm run tauri dev`
- **Playwright 调试**: `npx playwright test --debug`

## 📚 文档资源

- [架构导航指南](docs/DDD架构清晰问题/架构导航指南.md)
- [事件路由修复报告](docs/EVENT_ROUTING_FIX_REPORT.md)
- [组件开发规范](docs/LIGHTWEIGHT_COMPONENTS_GUIDE.md)
- [主题系统指南](docs/THEME_SYSTEM_GUIDE.md)

## 🤝 贡献类型

### 欢迎的贡献

- 🐛 Bug 修复
- ✨ 新功能开发
- 📝 文档改进
- 🧪  测试增强
- 🔧 性能优化
- 🎨 UI/UX 改进

### 贡献流程

1. Fork 项目
2. 创建功能分支
3. 编写代码和测试
4. 确保 CI 通过
5. 提交 Pull Request
6. 参与代码审查

## 📞 获取帮助

- **GitHub Issues**: 报告 Bug 或提出功能请求
- **Discussions**: 技术讨论和架构问题
- **Code Review**: PR 中的技术交流

---

感谢您的贡献！每一个 PR 都让这个项目变得更好。🚀