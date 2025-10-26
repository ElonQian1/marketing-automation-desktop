# Copilot 项目内规（简版，面向 AI 代理）

项目通常都会 npm run tauri dev 热重载启动着，编译好代码后不要重新启动，只需要执行 cargo check 这样的命令检查 Rust 代码即可。

## TL;DR

- **目标**：保持"模块优先 + 模块内分层"，避免因同名子目录（如 strategies/services/utils/…）误改他模组。
- **四件套**：命名前缀 · 门牌导出(index.ts) · 路径别名 · 三行文件头。
- **唯一硬底线**：`domain` 不得 import `ui/services/api/hooks/pages`。

---

## 1) 项目结构（模块内分层）

```
src/modules/<module>/{domain,application,services,api,stores,hooks,ui,pages}/
```

示例模块：`prospecting`（精准获客）、`script-builder`（智能脚本）、`contact-import`、`adb`。

---

## 2) 命名前缀（解决"同名子目录"误改）

**仅对易重名子目录的文件/类型启用前缀**（目录名可不变）：

- 目录：`domain/strategies`, `services`, `utils`, `validators`, `adapters`, `pipelines`, `mappers`, `repositories` …
- 模块 → 前缀：
  - `prospecting` → 文件：`prospecting-…`，类型：`Prospecting…`
  - `script-builder` → `script-…`，`Script…`
  - `contact-import` → `contact-…`，`Contact…`
  - `adb` → `adb-…`，`Adb…`

**命名模板**

- `domain/strategies/weighted.ts` → `prospecting-strategy-weighted.ts`  
  `StrategyWeighted` → `ProspectingStrategyWeighted`

> 只要是 **策略/服务/工具/校验** 这类容易重名的文件，务必带模块前缀。

### ⚠️ AI 代理常见违规（必查）

- ❌ `ui/components/EnhancedCard.tsx` → ✅ `ui/components/module-enhanced-card.tsx`
- ❌ `export const EnhancedCard` → ✅ `export const ModuleEnhancedCard`
- ❌ `services/helper.ts` → ✅ `services/module-helper.ts`
- **检查清单**：文件名有模块前缀？组件名有模块前缀？类型名有模块前缀？

---

## 3) 门牌导出（index.ts 统一出口）

每个模块根必须有 `index.ts`，**只导出对外稳定 API**：

```ts
// src/modules/<module>/index.ts
export * from "./domain/public/**"; // 契约/预设
export * from "./application/**"; // 用例（UseCase）
export * from "./hooks/**"; // 公开 Hook（必要时）
```

> **不要导出**内部实现（如 `domain/strategies/*`）。需要跨模块使用策略时，只从对方的 **契约(public)** 引用。

---

## 4) 路径别名（统一从"门牌"拿）

在 `tsconfig.json` 使用别名（指向模块根，默认命中 `index.ts`）：

```json
{
  "compilerOptions": {
    "paths": {
      "@prospecting/*": ["src/modules/prospecting/*"],
      "@script/*": ["src/modules/script-builder/*"],
      "@contact/*": ["src/modules/contact-import/*"],
      "@adb/*": ["src/modules/adb/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

**跨模块导入统一写法**：

```ts
import { BuildLeadScoreUseCase } from "@prospecting";
import { ScriptStrategy } from "@script";
```

---

## 5) 三行文件头（人/AI 一眼定位）

每个 `ts/tsx` 顶部必须有：

```ts
// src/modules/<module>/<layer>/path/File.ts
// module: <module> | layer: <ui|hooks|application|domain|services|api|stores|pages> | role: <简短角色>
// summary: 一句中文职责摘要
```

---

## 6) 唯一硬底线

- **禁止**：`src/modules/*/domain/**` 中 `import` 到 `ui/services/api/hooks/pages`，或直接使用 React/axios/tauri 等 IO/界面依赖。
- **做法**：所有 IO 放 `services/api`，由 `application` 串起来；`domain` 只保留纯规则/实体/算法。

---

## 🎯 特殊功能开发约束

### ADB 相关功能开发约束：

1. **强制使用统一接口**

   - ✅ 必须使用：`useAdb()` Hook
   - ❌ 禁止使用：`useAdbDevices`、`useAdbDiagnostic` 等旧接口
   - ❌ 禁止直接调用：`adbService`、`AdbDiagnosticService` 等底层服务

2. **状态管理统一原则**
   - ✅ 统一状态存储：`src/application/adbStore.ts`
   - ❌ 禁止创建新的状态管理文件
   - ❌ 禁止在组件中直接管理设备状态

### 大文件 & 模块化强制约束

#### 绝对硬性阈值（超过即需拆分 / 拒绝合并）

| 类型                            | 单文件建议上限 | 绝对上限（需立即拆分） |
| ------------------------------- | -------------- | ---------------------- |
| React 页面级组件 (`/pages/`)    | 400 行         | 600 行                 |
| 通用可复用组件 (`/components/`) | 300 行         | 450 行                 |
| 自定义 Hook                     | 200 行         | 300 行                 |
| 领域服务 / 应用服务             | 300 行         | 400 行                 |
| Zustand Store 文件              | 250 行         | 350 行                 |
| Rust 单模块业务文件             | 350 行         | 500 行                 |

### Hook 使用最佳实践：

- **`useAdb()` 使用原则**：
  - 同一页面最多只应在父组件或顶级组件中使用一次
  - 通过 props 向子组件传递需要的数据，而非让每个子组件都调用 `useAdb()`
  - 避免在模态框中的多个子组件同时使用

### 🎨 样式和颜色强制约束（防止白底白字等可读性问题）：

#### **颜色配对强制规则**：

1. **浅色背景必须配深色文字**

   ```css
   /* ✅ 正确：浅色背景 + 深色文字 */
   background: var(--bg-light-base, #ffffff);
   color: var(--text-inverse, #1e293b);
   ```

2. **深色背景必须配浅色文字**
   ```css
   /* ✅ 正确：深色背景 + 浅色文字 */
   background: var(--bg-base, #0f172a);
   color: var(--text-1, #f8fafc);
   ```

#### **强制执行的对比度标准**：

- **最低对比度**: 4.5:1 (WCAG AA 标准)
- **推荐对比度**: 7:1 (WCAG AAA 标准)

---

## 🎯 AI 代理特别指令

**作为 AI 代理，你必须：**

1. **架构检查优先**：开发任何功能前，先检查现有架构和接口
2. **重复代码零容忍**：发现类似功能立即重构合并，绝不允许重复实现
3. **接口统一强制**：所有 ADB 功能必须通过 `useAdb()` 实现
4. **代码质量保证**：确保类型安全、无警告、可维护性高
5. **文档同步更新**：修改功能时同步更新相关文档
6. **业务价值优先**：专注核心业务功能，避免创建演示、示例或展示性代码
7. **生产就绪标准**：所有代码必须达到生产环境标准，不接受简化版本
8. **主动模块化守护**：发现文件超标或结构臃肿时优先建议/实施拆分，而非继续累积
9. **防重复调用检查**：创建新组件时必须检查是否会导致重复初始化或资源浪费
10. **白底白字强制预防**：任何包含浅色背景的代码必须立即添加 `.light-theme-force` 类

### 🚨 白底白字问题快速检测卡

**项目特殊情况**: 全局深色主题 (`color: rgba(255,255,255,0.85)`) + 局部浅色组件

**⚡ 写代码时立即检查：**

```tsx
// 看到这些立即添加 className="light-theme-force"
background: '#fff'
background: 'white'
background: rgb(255,255,255)
background: '#f8fafc'

// 快速修复模板
<div className="light-theme-force" style={{ background: 'var(--bg-light-base)' }}>
  内容会自动使用正确的深色文字
</div>
```

**🎯 必查场景**: Card、Modal、卡片列表、数据展示、元素详情面板

---

## 🚫 严格禁止事项

**禁止行为：**

- 创建与现有功能重复的代码
- 使用已废弃的接口或服务
- 忽略现有的架构约束
- 保留多个版本的相同功能
- 创建简单的演示页面或示例代码
- 构建非业务核心的展示组件
- 将新增逻辑持续堆叠到已超标的巨型文件中而不提出拆分方案
- 在一个页面/模态框中创建多个同时调用 `useAdb()` 的组件
- 创建白底白字、深底深字等低对比度的不可读组合
- 在浅色背景中使用 Ant Design 组件而不添加 `.light-theme-force` 类

---

## 📋 快速检查清单

**开发完成后必须检查：**

1. ✅ 是否使用了正确的 `useAdb()` 接口
2. ✅ 是否遵循了 DDD 分层架构
3. ✅ 是否存在重复代码需要合并
4. ✅ TypeScript 类型是否完整
5. ✅ 是否有未使用的导入或变量
6. ✅ 组件是否可以正常构建和运行
7. ✅ 是否存在超过行数阈值但未给出拆分计划的文件
8. ✅ 是否存在重复调用初始化函数的风险
9. ✅ 多个组件同时使用 `useAdb()` 时是否会造成性能问题
10. ✅ **样式检查**：是否存在白底白字等可读性问题
11. ✅ **颜色对比度**：是否满足 WCAG AA 标准（4.5:1）
12. ✅ **命名前缀**：易重名文件和类型是否添加模块前缀

---

**重要提醒**：本项目已完成 DDD 重构，任何开发都必须基于新架构。违反架构约束的代码将被拒绝合并。
