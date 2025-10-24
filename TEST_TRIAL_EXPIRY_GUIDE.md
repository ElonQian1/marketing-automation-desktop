# 试用期过期功能测试指南

## 快速测试步骤

### 准备工作
1. 启动开发服务器：`npm run dev`
2. 在浏览器中打开应用
3. 打开浏览器开发者工具（按 F12）

---

## 测试场景 1：试用期警告弹窗

**目标**：测试当试用期还剩 ≤3 天时，会显示警告弹窗

### 步骤：

1. **登录测试账户**
   - 用户名：`test`
   - 密码：`test123`

2. **打开浏览器 Console**（开发者工具 → Console 标签）

3. **执行以下代码**（复制粘贴后按回车）：
```javascript
// 设置试用期还剩 2 天
const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
const twoDaysLater = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
authStorage.state.user.expiresAt = twoDaysLater.toISOString();
localStorage.setItem('auth-storage', JSON.stringify(authStorage));
console.log('✅ 已设置试用期还剩 2 天，请刷新页面');
```

4. **刷新页面**（按 F5）

5. **预期结果**：
   - ✅ 看到黄色警告弹窗："试用期即将到期"
   - ✅ 显示剩余天数：2 天
   - ✅ 显示进度条（橙红色）
   - ✅ 右上角用户下拉菜单显示"试用期：2 天"

---

## 测试场景 2：试用期已过期

**目标**：测试当试用期过期后，强制退出并显示过期页面

### 步骤：

1. **登录测试账户**（如果已退出）
   - 用户名：`test`
   - 密码：`test123`

2. **打开浏览器 Console**

3. **执行以下代码**：
```javascript
// 设置试用期为昨天过期
const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
authStorage.state.user.expiresAt = yesterday.toISOString();
localStorage.setItem('auth-storage', JSON.stringify(authStorage));
console.log('✅ 已设置试用期为昨天过期，请刷新页面');
```

4. **刷新页面**

5. **预期结果**：
   - ✅ 看到紫色渐变背景的过期页面
   - ✅ 显示红色警告图标和"试用期已过期"标题
   - ✅ 有"返回登录"按钮
   - ✅ 点击按钮后跳转到登录页

---

## 测试场景 3：用户下拉菜单显示试用期

**目标**：测试右上角用户菜单显示试用期倒计时

### 步骤：

1. **登录测试账户**
   - 用户名：`test`
   - 密码：`test123`

2. **查看右上角**
   - 点击用户头像（橙色圆形）

3. **预期结果**：
   - ✅ 看到用户名：test
   - ✅ 看到橙色"试用"标签
   - ✅ 看到邮箱：test@example.com
   - ✅ 看到试用期倒计时：🕒 试用期：X 天

---

## 常用测试命令（Console 中执行）

### 1️⃣ 查看当前试用期状态
```javascript
const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
const expiryDate = new Date(authStorage.state.user.expiresAt);
const daysLeft = Math.ceil((expiryDate - Date.now()) / (1000*60*60*24));
console.log('到期时间:', expiryDate.toLocaleString('zh-CN'));
console.log('剩余天数:', daysLeft);
```

### 2️⃣ 重置为完整的 15 天试用期
```javascript
const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
const fifteenDaysLater = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
authStorage.state.user.expiresAt = fifteenDaysLater.toISOString();
localStorage.setItem('auth-storage', JSON.stringify(authStorage));
console.log('✅ 已重置为 15 天试用期，请刷新页面');
```

### 3️⃣ 清除认证数据（返回登录页）
```javascript
localStorage.removeItem('auth-storage');
console.log('✅ 已清除认证数据，请刷新页面');
```

---

## 快捷测试脚本

也可以直接在 Console 中加载完整的测试工具：

```javascript
// 加载测试工具
const script = document.createElement('script');
script.src = '/scripts/test-trial-expiry.js';
document.head.appendChild(script);

// 然后就可以使用以下命令：
// - setTrialExpiringSoon()  // 设置还剩2天
// - setTrialExpired()        // 设置已过期
// - resetTrialPeriod()       // 重置为15天
// - checkTrialStatus()       // 查看状态
// - clearAuth()              // 清除认证
```

---

## 注意事项

1. **每次修改 localStorage 后都需要刷新页面**才能看到效果
2. **管理员账户（admin）没有试用期限制**，不会触发过期逻辑
3. **测试完成后**，可以用 `clearAuth()` 清除数据重新开始
4. **开发环境**中可以任意修改过期时间，**生产环境**则会按真实时间计算

---

## 完整测试流程（推荐）

```bash
# 1. 启动应用
npm run dev

# 2. 浏览器中：
#    - 登录 test/test123
#    - 打开 Console (F12)

# 3. 依次测试：

# 测试警告（2天）
const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
authStorage.state.user.expiresAt = new Date(Date.now() + 2*24*60*60*1000).toISOString();
localStorage.setItem('auth-storage', JSON.stringify(authStorage));
location.reload();  // 自动刷新

# 测试过期
const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
authStorage.state.user.expiresAt = new Date(Date.now() - 24*60*60*1000).toISOString();
localStorage.setItem('auth-storage', JSON.stringify(authStorage));
location.reload();  // 自动刷新

# 重置
localStorage.removeItem('auth-storage');
location.reload();  // 返回登录页
```

---

## 预期界面截图说明

### 警告弹窗（剩余 ≤3 天）
- 黄色时钟图标
- 标题："试用期即将到期"
- 显示剩余天数（大号橙色数字）
- 进度条（橙红渐变）
- 提示文字

### 过期页面
- 紫色渐变背景
- 白色卡片居中
- 红色警告图标（大）
- "试用期已过期"标题
- 提示联系管理员
- 蓝色"返回登录"按钮

### 用户下拉菜单
- 头像（橙色背景）
- 用户名 + 橙色"试用"标签
- 邮箱
- 🕒 试用期：X 天（橙色文字）
- 退出登录按钮

---

## 常见问题

**Q: 为什么刷新后没有看到过期页面？**  
A: 确保在 localStorage 中正确设置了过去的日期，并且用的是 `test` 账户（不是 `admin`）

**Q: 如何测试正好剩余 3 天的边界情况？**  
A: 将代码中的 `2` 改为 `3`：`+ 3 * 24 * 60 * 60 * 1000`

**Q: 管理员账户会过期吗？**  
A: 不会，只有角色为 `trial` 的账户才会检查试用期

**Q: 如何修改试用期天数？**  
A: 在 `authStore.ts` 中修改 `15 * 24 * 60 * 60 * 1000` 中的 `15`
