# new-report.ps1 - 员工日报自动生成脚本
# 用法: powershell scripts/new-report.ps1 A
# 为指定员工生成当日日报模板

param(
    [Parameter(Mandatory=$true)]
    [string]$Employee
)

# 获取当前日期（台北时间）
$TimeZone = [System.TimeZoneInfo]::FindSystemTimeZoneById("China Standard Time")
$TaipeiTime = [System.TimeZoneInfo]::ConvertTime([DateTime]::Now, $TimeZone)
$DateStr = $TaipeiTime.ToString("yyyy-MM-dd")
$TimeStr = $TaipeiTime.ToString("HH:mm:ss")

# 员工映射
$EmployeeMap = @{
    "A" = @{
        "Role" = "Design Tokens & 主题桥负责人"
        "Dir" = "A-令牌主题"
        "Tasks" = @(
            "维护 styles/tokens.css (--brand/--bg-*/--text-*/--radius/--shadow/--font/--control-h)",
            "配置 tailwind.config.ts 读取 tokens",
            "ThemeBridge.tsx 使用 darkAlgorithm + 最小token",
            "提供 tokens 对照表，禁止硬编码视觉值",
            "运行覆盖扫描，确保 .ant-* 与 !important 为 0"
        )
        "Collaborators" = "@B 吸收tokens; @C 紧凑模式回归; @D 跟踪覆盖扫描"
    }
    "B" = @{
        "Role" = "轻组件开发工程师"
        "Dir" = "B-组件库"
        "Tasks" = @("组件开发任务待定义")
        "Collaborators" = "@A tokens同步; @C 适配器集成; @D 质量验证"
    }
    "C" = @{
        "Role" = "AntD适配器工程师" 
        "Dir" = "C-适配与图元"
        "Tasks" = @("适配器任务待定义")
        "Collaborators" = "@A tokens对齐; @B 组件集成; @D 质量检查"
    }
    "D" = @{
        "Role" = "页面集成&质检工程师"
        "Dir" = "D-页面与质检"
        "Tasks" = @("质检任务待定义")
        "Collaborators" = "@A tokens验证; @B 组件测试; @C 适配器检查"
    }
}

if (-not $EmployeeMap.ContainsKey($Employee)) {
    Write-Error "未知员工代码: $Employee. 支持的员工: A, B, C, D"
    exit 1
}

$EmpInfo = $EmployeeMap[$Employee]
$ReportDir = "docs\员工工作报告\$($EmpInfo.Dir)"
$ReportFile = "$ReportDir\$DateStr`_员工$Employee`_$($EmpInfo.Dir -replace '-.*', '').md"

# 确保目录存在
if (-not (Test-Path $ReportDir)) {
    New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null
}

# 检查是否已存在今日报告
if (Test-Path $ReportFile) {
    Write-Host "今日报告已存在: $ReportFile" -ForegroundColor Yellow
    Write-Host "如需重新生成，请先删除现有文件" -ForegroundColor Yellow
    exit 0
}

# 生成报告模板
$Template = @"
# 员工$Employee 日报 - $($EmpInfo.Role)

**日期**: $DateStr（台北）  
**生成时间**: $TimeStr (UTC+08:00)  
**负责人**: 员工$Employee  

---

## 📋 今日产出

### 🛠️ 核心文件更新项
"@

# 根据员工角色生成不同的模板内容
if ($Employee -eq "A") {
    $Template += @"

- **tokens.css 更新**: src/styles/tokens.css
  - [ ] --brand 系列更新
  - [ ] --bg-* 背景系统调整  
  - [ ] --text-* 文本颜色优化
  - [ ] --radius/--shadow 几何属性
  - [ ] --font/--control-h 字体控件

- **tailwind.config.ts 对齐**: 
  - [ ] CSS变量映射验证
  - [ ] 新tokens同步更新

- **ThemeBridge.tsx tokens对齐**:
  - [ ] darkAlgorithm 配置检查
  - [ ] 最小token集合优化
  - [ ] 组件主题映射更新
"@
} else {
    $Template += @"

### 🔧 主要工作内容
"@
    foreach ($task in $EmpInfo.Tasks) {
        $Template += "`n- [ ] $task"
    }
}

$Template += @"


---

## 📊 提交记录
```
提交哈希: [待填写]
提交信息: [待填写] 
提交时间: [待填写]
PR编号: [如适用]
```

---

## ⚠️ 影响与风险

### 需其他员工跟进的点
$($EmpInfo.Collaborators)

### 发现的问题与风险
- [ ] [待填写具体问题]
- [ ] [待填写风险点]

### 阻塞项（如有）
- [ ] [等待其他员工的输入]
- [ ] [依赖的外部因素]

---

## 🎯 明日计划

### 高优先级任务
- [ ] [待规划]
- [ ] [待规划]

### 持续监控项目
- [ ] [日常维护工作]

---

## 📝 备注

### 工作环境状态
- [ ] 开发环境正常
- [ ] 构建流程无误
- [ ] 质量检查通过

### 团队协调状态  
- [ ] 已同步工作进展
- [ ] 无阻塞其他员工
- [ ] 文档更新完整

---

**完成时间**: [18:00前填写] (UTC+08:00)  
**提交状态**: [ ] 已git提交并推送

*该报告由 scripts/new-report.ps1 自动生成*
"@

# 写入文件
$Template | Out-File -FilePath $ReportFile -Encoding UTF8

Write-Host "✅ 员工$Employee 日报模板已生成: $ReportFile" -ForegroundColor Green
Write-Host "📅 日期: $DateStr" -ForegroundColor Cyan
Write-Host "⏰ 生成时间: $TimeStr (UTC+08:00)" -ForegroundColor Cyan
Write-Host "📝 请在 18:00 前完成填写并提交" -ForegroundColor Yellow