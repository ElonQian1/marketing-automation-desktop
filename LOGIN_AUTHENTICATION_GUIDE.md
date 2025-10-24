# 登录认证系统使用指南

## 📋 功能概述

本项目已集成完整的登录认证系统，包含以下功能：

✅ **本地认证**：无需后端服务器，基于本地存储
✅ **试用期管理**：支持 15 天试用期，自动过期检测
✅ **权限管理**：支持管理员和试用用户两种角色
✅ **持久化存储**：登录状态自动保存，刷新页面不会丢失
✅ **试用期提醒**：剩余天数 ≤ 3 天时自动弹窗提醒
✅ **过期强制登出**：试用期结束后自动退出，禁止使用

---

## 🔐 测试账户

### 1. 管理员账户
```
用户名: admin
密码: admin123
角色: 管理员
权限: 无限期使用
```

### 2. 试用账户
```
用户名: test
密码: test123
角色: 试用用户
权限: 15 天试用期
```

---

## 🚀 快速开始

### 1. 启动应用

```bash
npm run dev
```

### 2. 登录流程

1. 应用启动后会自动显示登录页面
2. 输入测试账户的用户名和密码
3. 点击"登录"按钮
4. 登录成功后进入主应用

### 3. 用户信息查看

登录后，在应用右上角可以看到：
- 用户头像（点击展开下拉菜单）
- 用户名和角色标签
- 试用用户会显示剩余天数
- 退出登录按钮

---

## 🛠️ 系统架构

### 文件结构

```
src/
├── stores/
│   └── authStore.ts              # 认证状态管理 (Zustand)
├── components/
│   └── auth/
│       └── AuthGuard.tsx         # 认证守卫组件
├── pages/
│   └── auth/
│       └── LoginPageNative.tsx   # 登录页面
└── App.tsx                       # 应用入口（集成 AuthGuard）
```

### 核心组件

#### 1. authStore.ts
- **作用**：全局认证状态管理
- **技术栈**：Zustand + Persist
- **存储位置**：LocalStorage (`auth-storage`)
- **功能**：
  - 用户登录/登出
  - 试用期检查
  - 剩余天数计算
  - 状态持久化

#### 2. AuthGuard.tsx
- **作用**：路由守卫，保护需要登录的页面
- **功能**：
  - 检查登录状态
  - 检查试用期
  - 显示试用期警告
  - 强制过期用户登出

#### 3. LoginPageNative.tsx
- **作用**：美观的登录界面
- **特性**：
  - 响应式设计
  - 表单验证
  - 错误提示
  - 测试账户提示

---

## 🔧 自定义配置

### 1. 添加新测试账户

编辑 `src/stores/authStore.ts`：

```typescript
const TEST_ACCOUNTS = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin' as const,
    email: 'admin@example.com'
  },
  {
    username: 'test',
    password: 'test123',
    role: 'trial' as const,
    email: 'test@example.com'
  },
  // 🆕 添加新账户
  {
    username: 'newuser',
    password: 'password123',
    role: 'trial' as const, // 或 'admin'
    email: 'newuser@example.com'
  }
];
```

### 2. 修改试用期天数

在 `authStore.ts` 的 `login` 函数中修改：

```typescript
// 试用账户：15天到期
const expiresAt = account.role === 'trial' 
  ? new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString() // 修改这里的 15
  : undefined;
```

### 3. 修改试用期警告阈值

在 `AuthGuard.tsx` 中修改：

```typescript
// 如果剩余天数 <= 3 天，显示警告
if (daysRemaining <= 3 && daysRemaining > 0) { // 修改这里的 3
  setShowTrialWarning(true);
}
```

---

## 📊 功能演示

### 1. 首次登录

```
┌─────────────────────────────────┐
│      员工登录                    │
│  社交平台自动化操作系统           │
├─────────────────────────────────┤
│  测试账户:                       │
│  管理员账户: admin / admin123    │
│  试用账户: test / test123 (15天) │
├─────────────────────────────────┤
│  用户名: [___________________]   │
│  密码:   [___________________]   │
│  □ 记住我          忘记密码？    │
│  [        登录        ]          │
└─────────────────────────────────┘
```

### 2. 试用期警告

当剩余天数 ≤ 3 天时：

```
┌─────────────────────────────────┐
│  ⏰ 试用期即将到期               │
├─────────────────────────────────┤
│  您的试用期还剩 3 天             │
│  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░ 80%           │
│                                  │
│  试用期结束后，您将无法继续使用   │
│  本系统。请及时联系管理员升级。   │
│                                  │
│            [我知道了]            │
└─────────────────────────────────┘
```

### 3. 试用期过期

```
┌─────────────────────────────────┐
│          ⚠️                      │
│      试用期已过期                │
│                                  │
│  您的试用期已结束。如需继续使用， │
│  请联系管理员升级账户。           │
│                                  │
│         [返回登录]               │
└─────────────────────────────────┘
```

---

## 🔍 调试技巧

### 1. 查看 LocalStorage

打开浏览器开发者工具 → Application → Local Storage：

```json
{
  "auth-storage": {
    "state": {
      "user": {
        "id": "abc123",
        "username": "test",
        "role": "trial",
        "createdAt": "2025-10-24T...",
        "expiresAt": "2025-11-08T..."
      },
      "token": "dGVzdDoxNzI5NzY1...",
      "isAuthenticated": true
    },
    "version": 0
  }
}
```

### 2. 手动重置认证状态

在浏览器控制台执行：

```javascript
localStorage.removeItem('auth-storage');
window.location.reload();
```

### 3. 手动修改试用期到期时间（测试用）

```javascript
const authData = JSON.parse(localStorage.getItem('auth-storage'));
authData.state.user.expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1小时后过期
localStorage.setItem('auth-storage', JSON.stringify(authData));
window.location.reload();
```

---

## 🚨 常见问题

### Q1: 登录后刷新页面需要重新登录？

**A:** 不会。登录状态会自动保存到 LocalStorage，刷新页面会自动恢复登录状态。

### Q2: 试用账户过期后如何继续使用？

**A:** 有两种方法：
1. 使用管理员账户登录（无试用期限制）
2. 手动清除 LocalStorage 重新计算试用期（仅测试用）

### Q3: 如何添加真实的后端认证？

**A:** 修改 `authStore.ts` 中的 `login` 函数：

```typescript
login: async (username: string, password: string) => {
  try {
    // 调用真实的后端 API
    const response = await fetch('https://your-api.com/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      return { success: false, error: data.message };
    }
    
    const user: User = {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      role: data.user.role,
      createdAt: data.user.createdAt,
      expiresAt: data.user.expiresAt
    };
    
    set({
      user,
      token: data.token,
      isAuthenticated: true
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: '网络错误' };
  }
}
```

### Q4: 如何禁用登录功能（临时开发）？

**A:** 在 `App.tsx` 中临时注释掉 `AuthGuard`：

```tsx
return (
  <ThemeBridge>
    {/* <AuthGuard> */}
      <div className="app-container">
        <FullApp />
        {process.env.NODE_ENV === 'development' && <ThemeToggler />}
      </div>
    {/* </AuthGuard> */}
  </ThemeBridge>
);
```

---

## 📈 后续扩展

### 可以添加的功能

1. **忘记密码功能**
   - 邮箱验证
   - 重置密码链接

2. **注册功能**
   - 用户自助注册
   - 邮箱验证

3. **权限管理**
   - 更多角色类型
   - 页面级权限控制

4. **用户管理界面**
   - 管理员查看所有用户
   - 手动延长试用期
   - 禁用/启用账户

5. **审计日志**
   - 登录历史记录
   - 操作日志追踪

---

## 📞 技术支持

如有问题，请查看：
- `src/stores/authStore.ts` - 认证逻辑
- `src/components/auth/AuthGuard.tsx` - 路由守卫
- `src/pages/auth/LoginPageNative.tsx` - 登录界面

**提示**：所有关键逻辑都有详细的中文注释！
