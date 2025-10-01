# Employee D 路径规范防错指南

**创建日期**: 2025-10-01 21:05:00  
**目的**: 避免任务文件路径放置错误  

## 🚨 常见错误

### ❌ 错误示例
```
# 直接在项目根目录创建（错误！）
D:\rust\active-projects\小红书\employeeGUI\task-D-xxx.md

# 或在任意其他位置创建（错误！）
src/task-D-xxx.md
docs/task-D-xxx.md
```

### ✅ 正确路径规范

**Employee D 任务文件必须放在**：
```
docs\员工工作报告\D-页面与质检\{status}\task-D-{slug}-{YYYYMMDD-HHmmss}.md
```

其中 `{status}` 为：
- `open\` - 进行中的任务
- `review\` - 待评审的任务  
- `blocked\` - 被阻塞的任务
- `done\` - 已完成的任务

## 📋 创建任务文件的正确步骤

1. **确定任务状态**: 新任务通常放在 `open\`
2. **生成文件名**: `task-D-{描述}-{时间戳}.md`
3. **使用完整路径**:
   ```
   docs\员工工作报告\D-页面与质检\open\task-D-{slug}-{YYYYMMDD-HHmmss}.md
   ```
4. **更新索引**: 完成后更新 `_index.md`
5. **更新汇总**: 更新 `docs\员工工作报告\汇总.md`

## 🔄 任务状态流转

```
open\ (新建) → review\ (需评审) → done\ (完成)
                ↓
            blocked\ (被阻塞)
```

## 📝 必须更新的文件

每次创建或状态变更后，必须更新：

1. **`docs\员工工作报告\D-页面与质检\_index.md`**
   - 记录新任务链接
   - 更新状态变化

2. **`docs\员工工作报告\汇总.md`**
   - 顶部"最新动态"区添加链接
   - 更新员工D状态

## ⚠️ 防错检查清单

创建任务文件前检查：
- [ ] 路径包含 `docs\员工工作报告\D-页面与质检\`
- [ ] 状态目录正确 (`open\`, `review\`, `blocked\`, `done\`)
- [ ] 文件名遵循 `task-D-{slug}-{YYYYMMDD-HHmmss}.md` 格式
- [ ] 时间戳精确到秒 (HHmmss)
- [ ] 描述slug简洁明了

完成任务后检查：
- [ ] 更新 `_index.md`
- [ ] 更新 `汇总.md`
- [ ] 移动到 `done\` 目录（如果完成）

---

**Employee D**: 严格遵循路径规范，避免文件放置错误！ 🎯