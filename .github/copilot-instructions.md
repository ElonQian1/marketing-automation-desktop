# Copilot 项目内规（简版，面向 AI 代理）

---

## 🚨 多仓库架构警告 (Multi-Repo Architecture)

**本项目由多个独立 Git 仓库组成，请务必注意！**

### 仓库结构

| 仓库名称 | 路径 | GitHub | 技术栈 | 说明 |
|---------|------|--------|--------|------|
| **marketing-automation-desktop** | `employeeGUI/` | `ElonQian1/marketing-automation-desktop` | Tauri v2 + React + TypeScript + Rust | 🖥️ **主仓库** - 桌面端应用 |
| **Android-Agent** | `employeeGUI/android-agent/` (submodule) | `ElonQian1/Android-Agent` | Kotlin + Android | 📱 **独立仓库** - 手机端 Agent 应用 |

### ⚠️ AI 代理必读规则

1. **Git 操作分离**：
   - 修改 `employeeGUI/` 下的文件 → 在主仓库提交
   - 修改 `android-agent/` 下的文件 → **必须在 android-agent 目录下单独 git commit/push**

2. **Submodule 关系**：
   - `android-agent/` 是 Git Submodule，指向独立仓库
   - 主仓库只记录 submodule 的版本指针，不包含实际代码

3. **正确的提交流程**：
   ```powershell
   # 提交 android-agent 修改
   cd android-agent
   git add .
   git commit -m "feat: xxx"
   git push
   
   # 提交主仓库修改（如果 submodule 版本更新）
   cd ..
   git add android-agent
   git commit -m "chore: update android-agent submodule"
   git push
   ```

4. **禁止操作**：
   - ❌ 在主仓库根目录执行 `git add android-agent/*`（这不会正确提交子模块内容）
   - ❌ 混淆两个仓库的修改

---

## 📋 快速检查：我该在哪个仓库操作？

| 修改内容 | 所属仓库 | Git 操作目录 |
|---------|---------|-------------|
| TypeScript/React 前端代码 | 主仓库 | `employeeGUI/` |
| Rust/Tauri 后端代码 | 主仓库 | `employeeGUI/` |
| Kotlin/Android 代码 | Android-Agent | `employeeGUI/android-agent/` |
| `.github/copilot-instructions.md` | 主仓库 | `employeeGUI/` |

---

## 🔧 开发环境说明

项目通常都会 npm run tauri dev 热重载启动着，编译好代码后不要重新启动，只需要执行 cargo check 这样的命令检查 Rust 代码即可。

没事不要执行 cargo clean

## TL;DR

- **目标**：保持"模块优先 + 模块内分层"，避免因同名文件（如 strategies/types/utils）误改他模组。
- **核心原则**：模块前缀 + 文件夹结构 + 统一导出。
- **硬底线**：`domain` 不得 import `ui/services/api/hooks/pages`。

---

## 🦀 Rust 后端架构强制规范 (Tauri v2 插件模式)

**核心原则**：禁止在 `main.rs` 中手动注册命令。所有新功能模块必须实现为 **Tauri 本地插件 (Local Plugin)**。

### 1. 插件化开发流程 (The "Lego" Pattern)
后端代码不再是单体巨石，而是由一个个独立的“乐高积木（插件）”组成。

- **❌ 严禁做法 (Legacy)**：
  - 在 `main.rs` 的 `generate_handler!` 宏中手动添加函数名。
  - 创建散落在 `src-tauri/src` 根目录下的孤立 `_cmd` 函数。

- **✅ 强制做法 (Plugin)**：
  1. **创建模块**：在 `src-tauri/src/modules/<module_name>/` 中创建 `lib.rs`。
  2. **定义插件**：使用 `tauri::plugin::Builder` 构建插件并导出 `init()` 函数。
  3. **注册插件**：在 `main.rs` 中仅添加一行 `.plugin(modules::<module_name>::init())`。

### 2. 代码模板 (AI Copy-Paste Friendly)

**模块定义 (`src-tauri/src/modules/adb/lib.rs`):**
```rust
use tauri::{plugin::{Builder, TauriPlugin}, Runtime, Manager};

// 1. 定义命令 (无需加 _cmd 后缀，无需加模块前缀)
#[tauri::command]
fn connect() { /* ... */ }

#[tauri::command]
fn list() { /* ... */ }

// 2. 导出插件初始化函数
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("adb") // 🔌 插件命名空间：决定了前端如何调用
        .invoke_handler(tauri::generate_handler![
            connect,
            list
        ])
        .build()
}
```

**主程序注册 (`src-tauri/src/main.rs`):**
```rust
fn main() {
    tauri::Builder::default()
        .plugin(modules::adb::init()) // ✅ 仅需一行
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 3. 前端调用规范 (Namespaced Invocation)

由于使用了插件模式，前端调用必须带上插件前缀。

- **❌ 错误**: `invoke('adb_connect_device_cmd')` (旧模式，禁止新代码使用)
- **✅ 正确**: `invoke('plugin:adb|connect')`
  - 格式: `plugin:<插件名>|<命令名>`
  - 优点: 即使不同模块都有 `connect` 命令也不会冲突。

### 4. 命名清洗
- **Rust 函数名**: 保持简洁，动词开头。例如 `connect`, `save`, `load`。**不要**加 `_cmd` 后缀，**不要**加模块前缀（因为插件本身就是命名空间）。

---

## 📁 模块化组织原则

### Rust 后端模块结构

**标准目录结构：**
```
src/services/<module>/           # 每个功能模块独立文件夹
  ├── mod.rs                      # 统一导出接口
  ├── <module>_core.rs            # 核心逻辑（带模块前缀）
  ├── <module>_types.rs           # 类型定义（带模块前缀）
  ├── <module>_strategies.rs     # 策略实现（带模块前缀）
  └── <module>_utils.rs           # 工具函数（带模块前缀）
```

**✅ 正确示例：**
```
src/services/vcf/                 # VCF 导入模块
  ├── mod.rs                      
  ├── vcf_importer.rs             # ✅ 带 vcf_ 前缀
  ├── vcf_types.rs                # ✅ 带 vcf_ 前缀
  ├── vcf_strategies.rs           # ✅ 带 vcf_ 前缀
  └── vcf_utils.rs                # ✅ 带 vcf_ 前缀

src/services/prospecting/         # 精准获客模块
  ├── mod.rs
  ├── prospecting_engine.rs       # ✅ 带 prospecting_ 前缀
  └── prospecting_types.rs        # ✅ 带 prospecting_ 前缀
```

**❌ 错误示例（会导致搜索混乱）：**
```
src/services/vcf/
  ├── importer.rs                 # ❌ 太通用，无法精准搜索
  ├── types.rs                    # ❌ 项目中已有10+个同名文件
  ├── strategies.rs               # ❌ 无法区分是哪个模块的策略
  └── utils.rs                    # ❌ 太通用

# 或者更糟糕的平铺式：
src/services/
  ├── vcf_importer.rs             # ❌ 没有文件夹层级
  ├── vcf_types.rs                # ❌ 污染顶层命名空间
  ├── vcf_strategies.rs           # ❌ services/mod.rs 需要逐个声明
```

**services/mod.rs 声明方式：**
```rust
// ✅ 正确：单行声明
pub mod vcf;           // VCF 导入模块
pub mod prospecting;   // 精准获客模块

// ❌ 错误：逐个文件声明（污染命名空间）
pub mod vcf_importer;
pub mod vcf_types;
pub mod vcf_strategies;
pub mod vcf_utils;
```

---

## 2) TypeScript 前端命名前缀

**仅对易重名子目录的文件/类型启用前缀**：

### TypeScript 项目结构
```
src/modules/<module>/{domain,application,services,api,stores,hooks,ui,pages}/
```

示例模块：`prospecting`（精准获客）、`script-builder`（智能脚本）、`contact-import`、`adb`。
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

#### 🚨 AI 代理修改代码前必须执行的检查

**每次修改文件前，AI 代理必须：**
1. **检查目标文件行数**：先确认文件当前大小
2. **如果已超过阈值**：必须先提出拆分方案，而不是继续往里面加代码
3. **修改后验证**：确认修改没有让文件进一步膨胀
4. **主动提醒**：如果发现文件接近阈值，主动告知用户

#### 绝对硬性阈值（超过即需拆分 / 拒绝合并）

| 类型                            | 单文件建议上限 | 绝对上限（需立即拆分） |
| ------------------------------- | -------------- | ---------------------- |
| React 页面级组件 (`/pages/`)    | 400 行         | 600 行                 |
| 通用可复用组件 (`/components/`) | 300 行         | 450 行                 |
| 单职责 Hook                     | 250 行         | 350 行                 |
| 协调型 Hook（组合多个子Hook）   | 400 行         | 500 行                 |
| 领域服务 / 应用服务             | 300 行         | 400 行                 |
| Zustand Store 文件              | 250 行         | 350 行                 |
| Rust 单模块业务文件             | 350 行         | 500 行                 |

#### 🔥 超标文件处理流程

当发现文件超过绝对上限时，AI 代理必须：
1. **停止添加新代码**
2. **分析文件职责**，识别可拆分的独立模块
3. **提出拆分方案**，列出新文件和职责划分
4. **征求用户同意**后再执行拆分
5. **拆分完成后**再进行原本的功能修改

⚠️ **重要原则：先拆分，后修改**
- 不要在超标文件中继续添加代码
- 先完成架构重构，再实现功能需求
- 这样可以避免返工和代码不一致

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

## 🔍 易混淆组件索引（AI 代理必读）

### ⚠️ 修改前必须确认调用链

本项目存在多套功能相似的组件系统。**修改任何代码前，必须先追踪调用链确认目标组件。**

**禁止行为**：看到文件名相似就开始修改，不确认是否是用户实际使用的组件。

### 📊 XML 可视化系统对照表

| 组件路径 | 用途 | 调用入口 | 数据类型 |
|----------|------|----------|----------|
| `components/adb-xml-inspector/` | 🔧 **调试工具** - XML结构分析、XPath生成 | ElementNameEditor → "XML检查器" Tab | `UiNode` |
| `components/universal-ui/views/grid-view/` | 🎨 **元素选择器** - 网格/树形模式 | UniversalPageFinderModal → 网格模式 | `UiNode` |
| `components/universal-ui/views/visual-view/` | 🎨 **元素选择器** - 可视化模式 | UniversalPageFinderModal → 可视化模式 | `VisualUIElement` |

### 📊 屏幕预览组件对照表

| 组件 | 完整路径 | 被谁使用 |
|------|----------|----------|
| `ScreenPreview` (adb-xml-inspector) | `adb-xml-inspector/AdbXmlInspector.tsx` 内部定义 | AdbXmlInspector 自身 |
| `ScreenPreview` (grid-view) | `universal-ui/views/grid-view/ScreenPreview.tsx` | GridElementView |
| `VisualPagePreview` | `universal-ui/views/visual-view/VisualPagePreview.tsx` | VisualElementView |

### 🔄 修改前的确认流程

```
1. 用户报告问题："XX功能有bug"
   ↓
2. 询问调用入口："你是通过什么路径进入这个页面的？"
   ↓
3. 追踪调用链：入口页面 → 使用的组件 → 具体文件
   ↓
4. 确认后再修改："我找到了3个相似组件，确认你用的是..."
```

### 🏷️ 组件文件头注释规范

所有易混淆的组件文件顶部必须包含调用链注释：

```tsx
// src/components/universal-ui/views/grid-view/ScreenPreview.tsx
// module: universal-ui/grid-view | layer: ui | role: screen-preview
// 📍 调用链: UniversalPageFinderModal → GridElementView → ScreenPreview
// 📍 用途: 智能页面查找器的网格视图中的屏幕预览
// 📍 数据类型: UiNode (原始XML树)
// ⚠️ 注意: 与 adb-xml-inspector 和 visual-view 中的类似组件不同！
```

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
13. ✅ **调用链确认**：修改的是用户实际使用的组件吗？

---

**重要提醒**：本项目已完成 DDD 重构，任何开发都必须基于新架构。违反架构约束的代码将被拒绝合并。

---

## 📝 日志系统（AI 代理必读）

### 日志文件位置

前后端日志会**自动保存**到文件，方便调试和问题排查：

| 日志类型 | 文件路径 | 说明 |
|---------|---------|------|
| **后端日志 (Rust)** | `src-tauri/logs/backend.log.YYYY-MM-DD` | 所有 `tracing::info/warn/error` 输出 |
| **前端日志 (TS/JS)** | `logs/frontend-YYYY-MM-DD.log` | 所有 `console.log/warn/error` 输出 |

### ⚡ 自动清空（开发模式）

**每次 Ctrl+F5 热重载时，日志会自动清空**，无需手动操作。仅在 `debug_assertions` 开发模式生效。

### 查看日志命令

```powershell
# 查看后端日志（最后50行）
Get-Content ".\src-tauri\logs\backend.log*" -Tail 50

# 查看前端日志（最后50行）
Get-Content ".\logs\frontend-*.log" -Tail 50

# 实时跟踪后端日志
Get-Content ".\src-tauri\logs\backend.log*" -Wait -Tail 20
```

### 清空日志

在 PC 端程序中：**设备中心 → 日志查看 → 清空日志文件** 按钮

或手动删除：
```powershell
Remove-Item ".\src-tauri\logs\*" -Force
Remove-Item ".\logs\frontend-*.log" -Force
```

### AI 代理调试提示

- 如果功能不工作，先检查**前端日志**查看 JS 错误
- 如果后端命令失败，检查**后端日志**查看 Rust panic 或错误信息
- 日志文件按日期滚动，每天生成新文件

