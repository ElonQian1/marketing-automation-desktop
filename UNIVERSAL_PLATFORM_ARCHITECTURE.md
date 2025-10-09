# 项目架构说明 - 通用移动应用自动化平台

## 🎯 项目定位

**Universal Mobile App Automation Platform** - 通用移动应用自动化平台

- **不是** 专门针对某个特定应用的工具
- **而是** 支持任何Android应用的通用自动化框架
- **目标** 为企业级移动应用营销自动化提供统一解决方案

## 🏗️ 核心架构特点

### 1. **应用无关性设计**
```
通用框架 + 配置化适配 = 支持任意应用
```

### 2. **分层架构**
```
表现层 (React Components)
    ↓
应用层 (useAdb Hook + Services)  
    ↓
领域层 (Device/Element/Strategy Entities)
    ↓
基础设施层 (Tauri Commands + ADB)
```

### 3. **智能匹配策略**
- `absolute` - 绝对定位
- `strict` - 严格匹配  
- `relaxed` - 宽松匹配
- `positionless` - 无位置匹配
- `standard` - 标准匹配（跨设备稳定）

## 📱 支持的应用类型

### 当前已测试
- ✅ 社交媒体应用（关注、点赞、评论）
- ✅ 通讯录管理应用
- ✅ 电商应用（浏览、收藏）

### 理论支持范围
- 🎯 任何Android应用的UI自动化
- 🎯 跨品牌、跨分辨率的设备兼容
- 🎯 多语言界面适配

## 🔧 扩展新应用的方式

### 1. **配置化方式（推荐）**
```typescript
// 新应用预设配置
const newAppConfig = {
  packageName: "com.example.app",
  navigationPatterns: [...],
  elementSelectors: [...],
  matchingStrategies: [...]
};
```

### 2. **通用组件定制**
```typescript
<UniversalSocialButton 
  appConfig={newAppConfig}
  action="follow"
  strategy="standard"
/>
```

### 3. **自定义检测器（必要时）**
```rust
impl AppDetector for CustomDetector {
  // 继承通用检测框架
}
```

## 🚫 已弃用的特定应用模块

以下模块已移动到 `deprecated/` 目录：
- `XiaohongshuService` - 由通用应用服务框架替代
- `XiaohongshuAutoFollow` - 由 `UniversalSocialButton` 替代
- `xiaohongshu_detector` - 由 `GenericDetector` + 配置替代

## 🎯 未来发展方向

### 短期目标
- [ ] 完成特定应用代码的通用化重构
- [ ] 建立标准的应用配置规范
- [ ] 完善智能匹配算法

### 长期愿景  
- [ ] 支持iOS平台
- [ ] 可视化流程设计器
- [ ] 云端配置和模板库
- [ ] AI驱动的元素识别

## 📚 开发指南

1. **新功能开发** - 优先考虑通用性，避免硬编码特定应用逻辑
2. **应用适配** - 使用配置文件而非代码修改
3. **测试验证** - 在多个不同应用上验证通用性
4. **文档更新** - 及时更新架构文档，保持项目定位清晰

---

**重要提醒**: 本项目是通用自动化平台，任何特定应用的功能都应该通过配置化的方式实现，而不是硬编码的专门模块。