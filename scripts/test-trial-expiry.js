/**
 * 测试试用期过期功能的辅助脚本
 * 
 * 使用方法（在浏览器 Console 中执行）：
 * 1. 打开浏览器开发者工具（F12）
 * 2. 进入 Console 标签
 * 3. 复制粘贴以下代码并执行
 */

// ========== 场景 1: 设置账户即将过期（还剩2天）==========
function setTrialExpiringSoon() {
  const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
  
  if (!authStorage.state || !authStorage.state.user) {
    console.error('❌ 未找到登录用户，请先登录 test/test123');
    return;
  }
  
  const now = new Date();
  const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  
  authStorage.state.user.expiresAt = twoDaysLater.toISOString();
  authStorage.state.isTrialExpired = false;
  
  localStorage.setItem('auth-storage', JSON.stringify(authStorage));
  
  console.log('✅ 已设置试用期还剩 2 天');
  console.log('📅 到期时间:', twoDaysLater.toLocaleString('zh-CN'));
  console.log('🔄 请刷新页面查看"试用期警告弹窗"');
}

// ========== 场景 2: 设置账户已过期 ==========
function setTrialExpired() {
  const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
  
  if (!authStorage.state || !authStorage.state.user) {
    console.error('❌ 未找到登录用户，请先登录 test/test123');
    return;
  }
  
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  authStorage.state.user.expiresAt = yesterday.toISOString();
  authStorage.state.isTrialExpired = false; // 注意：刷新后会自动检测
  
  localStorage.setItem('auth-storage', JSON.stringify(authStorage));
  
  console.log('✅ 已设置试用期为昨天过期');
  console.log('📅 到期时间:', yesterday.toLocaleString('zh-CN'));
  console.log('🔄 请刷新页面查看"试用期已过期"页面');
}

// ========== 场景 3: 重置为正常的15天试用期 ==========
function resetTrialPeriod() {
  const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
  
  if (!authStorage.state || !authStorage.state.user) {
    console.error('❌ 未找到登录用户，请先登录 test/test123');
    return;
  }
  
  const now = new Date();
  const fifteenDaysLater = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
  
  authStorage.state.user.expiresAt = fifteenDaysLater.toISOString();
  authStorage.state.isTrialExpired = false;
  
  localStorage.setItem('auth-storage', JSON.stringify(authStorage));
  
  console.log('✅ 已重置为完整的 15 天试用期');
  console.log('📅 到期时间:', fifteenDaysLater.toLocaleString('zh-CN'));
  console.log('🔄 请刷新页面查看正常状态');
}

// ========== 场景 4: 查看当前试用期状态 ==========
function checkTrialStatus() {
  const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
  
  if (!authStorage.state || !authStorage.state.user) {
    console.error('❌ 未找到登录用户');
    return;
  }
  
  const user = authStorage.state.user;
  const now = new Date();
  const expiryDate = new Date(user.expiresAt);
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  console.log('👤 用户信息:', user.username);
  console.log('🎭 用户角色:', user.role);
  console.log('📅 到期时间:', expiryDate.toLocaleString('zh-CN'));
  console.log('⏰ 剩余天数:', diffDays > 0 ? diffDays + ' 天' : '已过期');
  console.log('🚨 是否过期:', diffDays <= 0 ? '是' : '否');
  
  if (diffDays <= 3 && diffDays > 0) {
    console.log('⚠️  将会显示"试用期警告弹窗"');
  } else if (diffDays <= 0) {
    console.log('🔒 将会显示"试用期已过期"页面');
  }
}

// ========== 场景 5: 清除所有认证数据 ==========
function clearAuth() {
  localStorage.removeItem('auth-storage');
  console.log('✅ 已清除所有认证数据');
  console.log('🔄 请刷新页面返回登录页');
}

// ========== 使用指南 ==========
console.log('%c========== 试用期测试工具 ==========', 'color: #1890ff; font-size: 16px; font-weight: bold');
console.log('');
console.log('📋 可用命令：');
console.log('');
console.log('%c1. setTrialExpiringSoon()', 'color: #faad14; font-weight: bold');
console.log('   设置试用期还剩 2 天（触发警告弹窗）');
console.log('');
console.log('%c2. setTrialExpired()', 'color: #ff4d4f; font-weight: bold');
console.log('   设置试用期已过期（触发过期页面）');
console.log('');
console.log('%c3. resetTrialPeriod()', 'color: #52c41a; font-weight: bold');
console.log('   重置为完整的 15 天试用期');
console.log('');
console.log('%c4. checkTrialStatus()', 'color: #1890ff; font-weight: bold');
console.log('   查看当前试用期状态');
console.log('');
console.log('%c5. clearAuth()', 'color: #8c8c8c; font-weight: bold');
console.log('   清除所有认证数据（返回登录页）');
console.log('');
console.log('💡 使用提示：');
console.log('   1. 先用 test/test123 登录');
console.log('   2. 在 Console 中调用上述命令');
console.log('   3. 刷新页面查看效果');
console.log('');
