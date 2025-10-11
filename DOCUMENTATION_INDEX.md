# 项目文档索引 (更新版)

> 📅 **最后更新**: 2025年10月11日  
> 🔄 **状态**: 文档重组完成，过时文档已移至 `deprecated/` 目录

## 📋 核心文档

### 🎯 最新状态报告
- **[MODULE_REFACTOR_COMPLETION_REPORT.md](./MODULE_REFACTOR_COMPLETION_REPORT.md)** - **主要参考文档**
  - 模块化重构完成报告
  - 功能完成度：87%
  - 包含统一日报服务、API完善、代码去重等完整成果

### 🏗️ 架构文档
- **[ADB_ARCHITECTURE_UNIFICATION_REPORT.md](./ADB_ARCHITECTURE_UNIFICATION_REPORT.md)**
  - ADB架构统一报告 (最新版本v2.0)
  - DDD架构实现完成
  - 统一接口采用指南

- **[README.md](./README.md)** - 项目主要说明文档
  - 项目概述和功能特色
  - 快速开始指南
  - 技术栈说明

### 📚 开发指南
- **[ADB_GLOBAL_MIGRATION_GUIDE.md](./ADB_GLOBAL_MIGRATION_GUIDE.md)** - ADB接口迁移指南
- **[.github/copilot-instructions.md](./.github/copilot-instructions.md)** - AI开发规范
- **[VERIFICATION_GUIDE.md](./VERIFICATION_GUIDE.md)** - 功能验证指南

## 📁 专业文档目录

### 🧠 智能导航系统
- **[docs/智能导航/](./docs/智能导航/)**
  - 智能元素查找器功能文档
  - 导航栏问题排查指南
  - **注意**: 部分内容可能过时，请以最新架构为准

### 🎯 精准获客系统  
- **[docs/精准获客/](./docs/精准获客/)**
  - Round 2 文档规范
  - 候选池字段清单
  - 标签体系维护指南
  - 话术模板规范

### 🎨 主题系统
- **[docs/Design_Tokens_对照表_及_使用指南.md](./docs/Design_Tokens_对照表_及_使用指南.md)**
- **[docs/THEME_SYSTEM_GUIDE.md](./docs/THEME_SYSTEM_GUIDE.md)**
- **[docs/COLOR_CONTRAST_GUIDE.md](./docs/COLOR_CONTRAST_GUIDE.md)**

### 🔧 XPath 策略系统
- **[docs/XPATH_STRATEGY_TROUBLESHOOTING.md](./docs/XPATH_STRATEGY_TROUBLESHOOTING.md)**
- **[docs/STRATEGY_SELECTOR_COMPONENTS_GUIDE.md](./docs/STRATEGY_SELECTOR_COMPONENTS_GUIDE.md)**

## 🗂️ 过时文档存档

### deprecated/ 目录
包含已过时但保留作历史参考的文档：

#### 架构分析报告 (已重构)
- `ARCHITECTURE_ANALYSIS_*.md` - 各阶段架构分析
- `ARCHITECTURE_REFACTOR_*.md` - 重构计划和报告  
- `BACKEND_MODULAR_REFACTOR_*.md` - 后端模块化报告

#### 功能实现报告 (已整合)
- `PRECISE_ACQUISITION_*.md` - 精准获客功能实现
- `POPOVER_*.md` - 弹窗相关优化报告
- `STRATEGY_*.md` - 策略选择器相关报告
- `UI_COMPONENT_*.md` - UI组件实现报告

#### XPath/XML 处理报告 (已稳定)
- `XPATH_*.md` - XPath功能各阶段实现
- `XML_*.md` - XML解析优化报告

#### TXT导入系统报告 (已完成)
- `TXT_IMPORT_*.md` - TXT导入功能实现和修复

⚠️ **注意**: deprecated/ 目录中的文档不应作为当前参考使用。

## 🔍 快速导航

### 我想了解...

**项目整体情况** → [README.md](./README.md)

**最新开发成果** → [MODULE_REFACTOR_COMPLETION_REPORT.md](./MODULE_REFACTOR_COMPLETION_REPORT.md)

**ADB接口使用** → [ADB_ARCHITECTURE_UNIFICATION_REPORT.md](./ADB_ARCHITECTURE_UNIFICATION_REPORT.md)

**精准获客功能** → [docs/精准获客/README.md](./docs/精准获客/README.md)

**主题和样式** → [docs/THEME_SYSTEM_GUIDE.md](./docs/THEME_SYSTEM_GUIDE.md)

**开发规范** → [.github/copilot-instructions.md](./.github/copilot-instructions.md)

**历史文档** → [deprecated/README.md](./deprecated/README.md)

## 📊 文档维护状态

| 类别 | 活跃文档数 | 存档文档数 | 状态 |
|------|-----------|-----------|------|
| 核心架构 | 3 | 8 | ✅ 最新 |
| 功能实现 | 1 | 15 | ✅ 已整合 |
| 开发指南 | 多个 | 3 | ✅ 持续更新 |
| UI/主题 | 多个 | 12 | ✅ 已稳定 |
| 工具系统 | 多个 | 6 | ✅ 已完善 |

## 🎯 推荐阅读顺序

### 新团队成员
1. [README.md](./README.md) - 了解项目
2. [MODULE_REFACTOR_COMPLETION_REPORT.md](./MODULE_REFACTOR_COMPLETION_REPORT.md) - 了解当前状态
3. [.github/copilot-instructions.md](./.github/copilot-instructions.md) - 学习开发规范
4. [ADB_ARCHITECTURE_UNIFICATION_REPORT.md](./ADB_ARCHITECTURE_UNIFICATION_REPORT.md) - 掌握核心架构

### 现有开发者
1. [MODULE_REFACTOR_COMPLETION_REPORT.md](./MODULE_REFACTOR_COMPLETION_REPORT.md) - 了解最新变更
2. [deprecated/README.md](./deprecated/README.md) - 了解已废弃的实现
3. 对应功能的最新文档

---

**维护说明**: 此索引文件将定期更新，确保反映最新的项目文档结构。如发现过时信息，请及时反馈。