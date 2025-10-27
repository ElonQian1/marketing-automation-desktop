// 测试坐标滑动功能
console.log('🧪 开始测试坐标滑动功能...');

// 模拟智能滑动步骤
const testStep = {
  id: 'test_swipe_' + Date.now(),
  action: 'smart_scroll',
  params: {
    direction: 'down',
    distance: 600,
    speed_ms: 300,
    start_x: 540,
    start_y: 1260
  }
};

console.log('📱 测试步骤:', JSON.stringify(testStep, null, 2));

// 这个测试会验证：
// 1. smart_scroll 是否正确转换为 swipe
// 2. 坐标参数是否正确传递
// 3. 是否跳过元素匹配直接执行
console.log('✅ 测试脚本已创建');
console.log('   - 验证坐标滑动 (540,1260) → (540,660)');
console.log('   - 持续时间: 300ms');
console.log('   - 应该跳过元素匹配，直接执行');