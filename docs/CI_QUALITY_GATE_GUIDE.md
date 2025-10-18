# CI & Quality Gate 使用指南

> **新增**: 前端 + Rust 一体化 CI 质量门控系统，自动检测"事件流不闭环、旧代码残留、30% 假进度、未用导出/重复代码"等风险。

---

## 🎯 系统概览

### CI 质量门控流程
```yaml
前端检查:
├── TypeScript 类型检查 ✅
├── Adapter 合规性验证 ✅  
├── ESLint 代码规范检查 ✅
├── 单元测试执行 ✅
├── E2E 回归测试 ✅
├── 未使用导出检测 (ts-prune) ⚠️
├── 代码重复度分析 (jscpd) ⚠️
├── 事件流收敛验证 🆕
└── 构建完整性验证 ✅

Rust 检查:
├── Cargo fmt 格式检查 ✅
├── Cargo clippy 静态分析 ✅
├── Cargo test 单元测试 ✅
└── Cargo check 编译检查 ✅
```

### 新增质量检查
- **🎯 事件流收敛验证**: 确保 `progress=30%→67%→100%→completed` 事件闭环
- **🔍 事件常量化合规**: 检测硬编码事件字符串，强制使用 `EVENTS` 常量
- **⚡ 并发任务隔离**: 验证 JobId 精确匹配，防止串扰
- **📊 质量门控评分**: 自动化评估代码质量和合规性

---

## 🚀 本地使用

### 1. 运行完整质量检查
```bash
# 前端质量检查
npm run type-check     # TypeScript 类型检查
npm run lint          # ESLint 代码规范
npm run test          # 单元测试
npm run test:e2e      # E2E 测试

# 高级质量分析
npm run check:unused  # 未使用导出检测
npm run check:dup     # 代码重复度分析
npm run check:events  # 事件流证据收集 🆕
npm run check:event-flow # 事件流完整验证 🆕
```

### 2. 事件流专项检查
```bash
# 运行事件流收敛测试
npx playwright test event-flow-convergence.spec.ts

# 生成事件流证据包
node scripts/collect-event-evidence.mjs
```

### 3. Rust 代码检查
```bash
cd src-tauri
cargo fmt --check     # 格式检查
cargo clippy          # 静态分析
cargo test            # 单元测试
cargo check           # 编译检查
```

---

## 📋 质量门控标准

### ✅ 必须通过的检查 (阻塞 CI)
- TypeScript 类型检查无错误
- ESLint 规范检查通过
- 所有单元测试通过
- E2E 测试通过
- 构建成功
- Rust 代码 fmt + clippy + test 通过

### ⚠️ 警告级别检查 (不阻塞但生成报告)
- 未使用导出 (ts-prune)
- 代码重复度 > 3%
- 事件常量化合规性 < 70%

### 🎯 事件流质量标准
- **事件常量化**: ≥70% 使用 `EVENTS` 常量
- **硬编码事件**: ≤3个文件包含硬编码事件字符串
- **E2E覆盖**: 至少1个事件流测试用例通过

---

## 📊 报告和工件

### CI 生成的质量报告
```bash
Artifacts (下载查看):
├── quality-reports/
│   ├── depcheck-report.json      # 依赖检查报告
│   ├── jscpd-report.html         # 代码重复度可视化报告
│   └── jscpd-report.json         # 代码重复度JSON数据
└── event-evidence/
    ├── source-scan-*.json        # 源码事件使用扫描
    ├── e2e-results-*.json        # E2E事件流日志
    └── summary-*.json            # 质量门控汇总
```

### 本地报告查看
```bash
# 查看代码重复度报告
open reports/jscpd/html/index.html

# 查看事件流证据
cat reports/event-evidence/summary-*.json
```

---

## 🔧 配置和自定义

### 质量门控阈值调整
```javascript
// scripts/collect-event-evidence.mjs
const qualityGates = {
  eventConstants: { threshold: 70 },    // 事件常量化合规率
  hardcodedEvents: { threshold: 3 },    // 最大硬编码事件文件数
  e2eCoverage: { threshold: 1 }         // 最小E2E事件数量
};
```

### jscpd 重复度配置
```json
// package.json
"check:dup": "jscpd --min-lines 8 --threshold 1 --reporters html,json"
```

### E2E 测试配置
```javascript
// tests/e2e/event-flow-convergence.spec.ts
const TIMEOUTS = {
  analysisStart: 10000,    // 分析开始超时
  progressUpdate: 15000,   // 进度更新超时
  completion: 25000        // 完成超时
};
```

---

## 🛠️ 故障排除

### 常见CI失败原因

#### 1. TypeScript 类型错误
```bash
❌ Type check failed
# 解决方案
npm run type-check  # 本地复现
# 修复类型错误或添加类型定义
```

#### 2. ESLint 规范违规
```bash
❌ Lint check failed
# 解决方案
npm run lint -- --fix  # 自动修复部分问题
```

#### 3. 事件流测试失败
```bash
❌ Event flow convergence tests failed
# 解决方案
npx playwright test event-flow-convergence.spec.ts --headed  # 本地调试
# 检查事件监听器和发送器是否正确配置
```

#### 4. Rust 编译错误
```bash
❌ Cargo check failed
# 解决方案
cd src-tauri && cargo check  # 本地复现
# 修复 Rust 编译错误
```

### 调试技巧

#### 1. 本地模拟CI环境
```bash
# 设置CI环境变量
export CI=true
npm run test:e2e
```

#### 2. 详细事件流日志
```bash
# E2E测试中开启详细日志
npx playwright test --reporter=line event-flow-convergence.spec.ts
```

#### 3. 跳过特定检查（临时）
```bash
# CI工作流中大部分质量检查都有 continue-on-error: true
# 可以临时跳过但建议尽快修复
```

---

## 🎯 最佳实践

### 1. 事件系统使用
```typescript
// ✅ 正确 - 使用事件常量
import { EVENTS } from '@/shared/constants/events';
emit(EVENTS.INTELLIGENT_ANALYSIS_PROGRESS, { progress: 50 });

// ❌ 错误 - 硬编码字符串
emit('intelligent_analysis_progress', { progress: 50 });
```

### 2. E2E 测试编写
```typescript
// 使用 data-testid 而非脆弱的选择器
await page.getByTestId('intelligent-analysis-trigger').click();

// 验证事件序列而非仅UI状态
await page.waitForFunction(() => {
  const events = window.__eventCollector || [];
  return events.some(e => e.event === 'intelligent_analysis_completed');
});
```

### 3. 质量报告查看
- 每次 PR 都检查 Artifacts 中的质量报告
- 重点关注事件常量化合规性和代码重复度
- 定期清理 ts-prune 检测到的未使用导出

---

**🎉 通过这套质量门控系统，可以大幅提升代码质量，防止"假进度、事件不闭环、代码残留"等常见问题！**