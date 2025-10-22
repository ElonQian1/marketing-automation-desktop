# 仓库保护设置指南

## 立即可执行的GitHub仓库保护措施

### 1. 分支保护规则
在 GitHub Settings → Branches 中添加以下规则：

**保护分支**: `main`, `release/*`

**必需设置**:
- ✅ Require a pull request before merging
- ✅ Require approvals: 1
- ✅ Require review from code owners
- ✅ Require status checks to pass before merging
- ✅ Require up-to-date branches before merging
- ✅ Restrict pushes that create files to specific paths

**路径限制**:
```
# 禁止直接推送到这些路径
src/hooks/useSingleStepTest.ts
src/infrastructure/repositories/TauriStepExecutionRepository.ts
src-tauri/src/commands/run_step.rs
.github/
```

### 2. 仓库访问权限控制

**机器人/AI代理权限设置**:
- 读权限: ✅ 允许
- 写权限: ❌ 禁止直推主分支
- PR权限: ✅ 允许创建PR
- 合并权限: ❌ 必须人工审阅

### 3. CI守门规则（添加到GitHub Actions）

创建 `.github/workflows/protect-v1-code.yml`:

```yaml
name: Protect V1 Code
on: [pull_request]

jobs:
  check-v1-changes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check V1 file changes
        run: |
          # 检查是否修改了V1核心文件
          if git diff --name-only origin/main...HEAD | grep -E "(useSingleStepTest|TauriStepExecutionRepository|run_step\.rs)"; then
            echo "❌ V1核心文件被修改，需要人工审阅"
            echo "修改的文件:"
            git diff --name-only origin/main...HEAD | grep -E "(useSingleStepTest|TauriStepExecutionRepository|run_step\.rs)"
            exit 1
          fi
          echo "✅ 未修改V1核心文件"
      
      - name: Check for deprecation warnings
        run: |
          # 检查是否移除了废弃警告
          if git diff origin/main...HEAD | grep -E "^\-.*DEPRECATED|^\-.*废弃警告"; then
            echo "❌ 试图移除废弃警告"
            exit 1
          fi
          echo "✅ 废弃警告完整"
```

### 4. 本地开发保护（pre-commit hook）

创建 `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 检查是否意外修改V1文件
if git diff --cached --name-only | grep -E "(useSingleStepTest|TauriStepExecutionRepository)"; then
  echo "⚠️  警告: 你正在修改V1系统文件"
  echo "确认这是有意的吗? (y/N)"
  read -r response
  if [[ "$response" != "y" && "$response" != "Y" ]]; then
    echo "❌ 提交已取消"
    exit 1
  fi
fi
```

### 5. ESLint规则（防止调用废弃API）

添加到 `eslint.config.cjs`:

```javascript
module.exports = {
  rules: {
    // 禁止在新文件中使用V1 API
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '../hooks/useSingleStepTest',
            message: 'useSingleStepTest is deprecated. Use StepExecutionGateway instead.'
          },
          {
            name: '../infrastructure/repositories/TauriStepExecutionRepository',
            message: 'TauriStepExecutionRepository is deprecated. Use StepExecutionGateway instead.'
          }
        ]
      }
    ]
  }
};
```

## 紧急回退开关

### 环境变量控制
```bash
# 紧急回退到V1
VITE_EXECUTION_ENGINE=v1

# 启用影子执行验证V2
VITE_EXECUTION_ENGINE=shadow

# 完全切换到V2
VITE_EXECUTION_ENGINE=v2
```

### 运行时开关
在应用设置中添加紧急开关：
```typescript
// 运行时切换引擎
localStorage.setItem('execution_engine_override', 'v1');
```

## 监控和告警

### 1. 代码修改监控
```javascript
// 在CI中检查关键文件修改
const changedFiles = getChangedFiles();
const criticalFiles = [
  'useSingleStepTest.ts',
  'TauriStepExecutionRepository.ts',
  'run_step.rs'
];

if (changedFiles.some(file => criticalFiles.includes(file))) {
  await notifySlack('🚨 V1核心文件被修改，请立即审查');
}
```

### 2. 执行引擎使用统计
```typescript
// 每天统计引擎使用情况
const stats = {
  v1_usage: 0,
  v2_usage: 0, 
  shadow_usage: 0,
  errors: []
};

// 发送到监控系统
await sendMetrics(stats);
```

## 实施优先级

### 🔥 立即执行（今天）
1. ✅ 添加CODEOWNERS文件
2. ✅ 添加分支保护规则  
3. ✅ 设置机器人权限限制

### 📋 本周内
4. 添加CI守门检查
5. 设置ESLint规则
6. 创建紧急回退文档

### 🚀 下周内  
7. 添加监控和告警
8. 完善pre-commit钩子
9. 团队培训和流程确认